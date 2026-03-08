const fs = require('fs');
const fsp = require('fs/promises');
const StableDatabaseReader = require('../../io/StableDatabaseReader');
const { log } = require('../../../lib/utils');
const Score = require('../../objects/Score');
const ModList = require('../../objects/ModList');

module.exports = class StableScoresDatabase {
    #beatmapIndex = {};

    /**
     * Please use `StableScoresDatabase.open()` instead of this constructor.
     */
    constructor(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File doesn't exist: ${filePath}`);
        }
        this.filePath = filePath;
        this.data = {};
        log(`Initialized StableScoresDatabase at ${filePath}`);
    }

    /**
     * Open an osu!standard `scores.db` database for reading, indexing it in memory to speed up queries. This may take several seconds for large databases.
     * @param {string} filePath Your database file path.
     */
    static async open(filePath) {
        const instance = new StableScoresDatabase(filePath);
        instance.fileHandle = await fsp.open(filePath, 'r');
        await instance.#index();
        return instance;
    }

    /**
     * Close the file handle on the open database.
     */
    close() {
        this.fileHandle.close();
    }

    #getReader(offset = 0, bufferSize) {
        const reader = new StableDatabaseReader(this.fileHandle, bufferSize);
        reader.seek(offset);
        return reader;
    }

    /**
     * @param {StableDatabaseReader} reader
     */
    async #readScore(reader) {
        const score = {};
        score.mode = await reader.readByte();
        score.version = await reader.readInt();
        score.beatmapHash = await reader.readString();
        score.playerName = await reader.readString();
        score.replayHash = await reader.readString();
        score.count300 = await reader.readShort();
        score.count100 = await reader.readShort();
        score.count50 = await reader.readShort();
        score.countGeki = await reader.readShort();
        score.countKatsu = await reader.readShort();
        score.countMiss = await reader.readShort();
        score.replayScore = await reader.readInt();
        score.maxCombo = await reader.readShort();
        score.isFullCombo = await reader.readBoolean();
        score.mods = await reader.readInt();

        // Get mod abbreviations
        score.modStrings = ModList.fromStableBitMask(score.mods);

        // Get mode string
        const modes = {
            0: 'osu',
            1: 'taiko',
            2: 'catch',
            3: 'mania'
        };
        score.modeString = modes[score.mode];

        let temp = await reader.readString();
        if (temp !== '') {
            throw new Error(
                `Error reading score at offset ${reader.offset}: Expected an empty string but read "${temp}"`
            );
        }

        score.timePlayed = await reader.readDateTime();

        temp = await reader.readInt();
        if (temp !== 4294967295) {
            throw new Error(
                `Error reading score at offset ${reader.offset}: Expected 4294967295 (-1) but read ${temp}`
            );
        }

        score.onlineScoreId = Number(await reader.readLong());

        if (score.modStrings.includes('TargetPractice')) {
            score.targetPracticeTotalAccuracy = await reader.readDouble();
        }

        return new Score(score);
    }

    async #index() {
        const reader = this.#getReader();

        // Get basic data
        this.data.version = await reader.readInt();
        this.data.countBeatmaps = await reader.readInt();

        // Loop for each collection
        let countScores = 0;
        for (let i = 0; i < this.data.countBeatmaps; i++) {
            // Read metadata for this beatmap
            const data = {
                offset: reader.offset,
                md5: await reader.readString(),
                countScores: await reader.readInt(),
                offsetScores: reader.offset
            };

            // Map beatmap data to hash for instant lookup
            this.#beatmapIndex[data.md5] = data;

            // Read scores
            for (let j = 0; j < data.countScores; j++) {
                await this.#readScore(reader);
                countScores++;
            }
        }

        log(`Opened and indexed ${countScores} scores on ${this.data.countBeatmaps} beatmaps ${this.filePath}`);

        return this;
    }

    /**
     * Get the hashes of beatmaps that have scores, optionally paginated.
     * @param {number} limit Get this many results.
     * @param {number} offset Skip this many results.
     * @returns {string[]} Array of beatmap md5 hashes.
     */
    getBeatmapHashes(limit = Infinity, offset = 0) {
        return Object.keys(this.#beatmapIndex).slice(offset, offset + limit);
    }

    /**
     * Get all scores set on a beatmap.
     * @param {string} beatmapHash The md5 hash of the beatmap to get scores for.
     * @returns {Promise<Score[]>}
     */
    async getBeatmapScores(beatmapHash) {
        // Get entry
        const entry = this.#beatmapIndex[beatmapHash];
        if (!beatmapHash) return [];

        // Get reader and seek to position
        const reader = this.#getReader();
        reader.seek(entry.offsetScores);

        // Loop and read score data
        const scores = [];
        for (let i = 0; i < entry.countScores; i++) {
            scores.push(await this.#readScore(reader));
        }
        log(`Read data for ${scores.length} scores on map ${entry.md5}`);

        return scores;
    }

    /**
     * Get scores sequentially, optionally with pagination.
     * @param {number} limit Get this many scores.
     * @param {number} offset Skip this many scores.
     * @returns {Promise<Score[]>}
     */
    async getScores(limit = Infinity, offset = 0) {
        // Get beatmap hashes since we index by them
        const hashes = Object.keys(this.#beatmapIndex);

        // Get reader
        const reader = this.#getReader();

        // Loop for each beatmap hash to collect scores
        const scores = [];
        let countSkipped = 0;
        for (const hash of hashes) {
            // Break if we have enough scores
            if (scores.length >= limit) break;

            // Skip to the next map if we haven't reached our offset yet
            // and this map doesn't have enough scores to hit it
            const entry = this.#beatmapIndex[hash];
            if (countSkipped + entry.countScores < offset) {
                countSkipped += entry.countScores;
                continue;
            }

            // Seek to the scores offset and loop for each score on this map
            reader.seek(entry.offsetScores);
            for (let i = 0; i < entry.countScores; i++) {
                // Read the score to update the reader offset
                const score = await this.#readScore(reader);

                // Skip maps until we reach our offset
                if (countSkipped < offset) {
                    countSkipped++;
                    continue;
                }

                // Save the score
                scores.push(score);

                // Stop if we have enough scores
                if (scores.length >= limit) break;
            }
        }

        log(`Read ${scores.length} scores`);
        return scores;
    }
};
