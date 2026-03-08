const fs = require('fs');
const fsp = require('fs/promises');
const { log } = require('../../../lib/utils');
const StableDatabaseReader = require('../../io/StableDatabaseReader');
const Beatmap = require('../../objects/Beatmap');
const { mapTo } = require('realm');

module.exports = class StableGameDatabase {
    #beatmapIndex = [];

    /**
     * Please use `StableGameDatabase.open()` instead of this constructor.
     */
    constructor(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File doesn't exist: ${filePath}`);
        }

        /** The database file path. */
        this.filePath = filePath;
        /** Data directly extracted from the database. */
        this.data = {};
        /** A set of submitted beatmap IDs. */
        this.beatmapIds = new Set();
        /** A set of submitted beatmapset IDs. */
        this.beatmapsetIds = new Set();
        /** A handle opened on the database file, used for reading data. */
        this.fileHandle = null;

        log(`Initialized StableGameDatabase at ${filePath}`);
    }

    /**
     * Open an osu!standard `osu!.db` database for reading, indexing it in memory to speed up beatmap access. This may take several seconds for large databases.
     * @param {string} filePath Your database file path.
     */
    static async open(filePath) {
        const instance = new StableGameDatabase(filePath);
        instance.fileHandle = await fsp.open(filePath, 'r');
        await instance.#index();
        return instance;
    }

    close() {
        this.fileHandle.close();
    }

    #getReader(offset = 0, bufferSize) {
        const reader = new StableDatabaseReader(this.fileHandle, bufferSize);
        reader.seek(offset);
        return reader;
    }

    async #index() {
        log(`Indexing beatmaps in ${this.filePath}...`);
        // We're using a very large buffer size here since we know we're
        // reading the whole file
        const reader = this.#getReader(0, 1024 * 1024 * 10);

        /** Database version. */
        this.data.version = await reader.readInt();
        /** The number of folders osu knows about. */
        this.data.folderCount = await reader.readInt();
        /** Is the active user's account unlocked? */
        this.data.isAccountUnlocked = await reader.readBoolean();
        /** Date the active user's account will be unlocked if it's locked. */
        this.data.dateUnlocked = await reader.readDateTime();
        /** Player name. */
        this.data.playerName = await reader.readString();
        /** The number of installed beatmaps. */
        this.data.beatmapCount = await reader.readInt();

        for (let i = 0; i < this.data.beatmapCount; i++) {
            const offset = reader.offset;
            const beatmap = await this.#readBeatmap(reader);
            this.#beatmapIndex.push({
                offset,
                md5: beatmap.hash,
                beatmapId: beatmap.id
            });
            this.beatmapIds.add(beatmap.id);
            this.beatmapsetIds.add(beatmap.beatmapset.id);
        }

        this.data.userPermissions = await reader.readInt();

        log(
            `Opened and indexed stable osu database version ${this.data.version} at ${this.filePath} with ${this.data.beatmapCount} beatmaps`
        );

        return this;
    }

    async #readBeatmap(reader) {
        const map = {};

        if (this.data.version < 20191106) {
            map.size = await reader.readInt();
        }

        map.artist = await reader.readString();
        map.artistUnicode = await reader.readString();
        map.title = await reader.readString();
        map.titleUnicode = await reader.readString();
        map.mapper = await reader.readString();
        map.version = await reader.readString();
        map.audioFileName = await reader.readString();
        map.md5 = await reader.readString();
        map.osuFileName = await reader.readString();

        map.rankedStatus = await reader.readByte();

        const statuses = {
            0: 'unknown',
            1: 'unsubmitted',
            2: 'graveyard',
            3: 'unknown',
            4: 'ranked',
            5: 'approved',
            6: 'qualified',
            7: 'loved'
        };
        map.rankedStatusString = statuses[map.rankedStatus];

        map.countCircles = await reader.readShort();
        map.countSliders = await reader.readShort();
        map.countSpinners = await reader.readShort();

        map.dateLastModified = await reader.readDateTime();

        if (this.data.version < 20140609) {
            map.ar = await reader.readByte();
            map.cs = await reader.readByte();
            map.hp = await reader.readByte();
            map.od = await reader.readByte();
        } else {
            map.ar = await reader.readSingle();
            map.cs = await reader.readSingle();
            map.hp = await reader.readSingle();
            map.od = await reader.readSingle();
        }

        map.sliderVelocity = await reader.readDouble();

        if (this.data.version >= 20140609) {
            map.starRatings = {};
            for (const mode of ['osu', 'taiko', 'catch', 'mania']) {
                const starRatings = [];
                const count = await reader.readInt();
                for (let k = 0; k < count; k++) {
                    let pair;
                    if (this.data.version < 20250107) {
                        pair = await reader.readIntDoublePair();
                    } else {
                        pair = await reader.readIntFloatPair();
                    }
                    const [mod, stars] = pair;
                    starRatings.push({ mod, stars });
                }
                map.starRatings[mode] = starRatings;
            }
        }

        map.drainTimeSecs = await reader.readInt();
        map.totalTimeMs = await reader.readInt();
        map.previewPointOffsetMs = await reader.readInt();

        map.timingPointCount = await reader.readInt();
        map.timingPoints = [];
        for (let i = 0; i < map.timingPointCount; i++) {
            map.timingPoints.push(await reader.readTimingPoint());
        }

        map.beatmapId = await reader.readInt();
        map.beatmapsetId = await reader.readInt();
        if (map.beatmapsetId === 4294967295) map.beatmapsetId = -1;
        map.threadId = await reader.readInt();

        map.grades = {};
        for (const mode of ['osu', 'taiko', 'catch', 'mania']) {
            map.grades[mode] = await reader.readByte();
        }

        map.localOffset = await reader.readShort();
        map.stackLeniency = await reader.readSingle();
        map.mode = await reader.readByte();

        const modes = {
            0: 'osu',
            1: 'taiko',
            2: 'catch',
            3: 'mania'
        };
        map.modeString = modes[map.mode];

        map.starRating = map.starRatings[map.modeString]?.find(e => e.mod === 0)?.stars;

        map.source = await reader.readString();
        map.tags = await reader.readString();

        map.onlineOffset = await reader.readShort();

        map.titleFont = await reader.readString();

        map.isUnplayed = await reader.readBoolean();
        map.dateLastPlayed = await reader.readDateTime();

        map.isOsuV2 = await reader.readBoolean();

        map.folderName = await reader.readString();

        map.dateLastSynced = await reader.readDateTime();

        map.areHitsoundsIgnored = await reader.readBoolean();
        map.areSkinsIgnored = await reader.readBoolean();
        map.isStoryboardDisabled = await reader.readBoolean();
        map.isVideoDisabled = await reader.readBoolean();
        map.areVisualsOverridden = await reader.readBoolean();

        if (this.data.version < 20140609) await reader.readShort();
        await reader.readInt();

        map.maniaScrollSpeed = await reader.readByte();

        return new Beatmap(map);
    }

    async #readBeatmapAtOffset(offset) {
        const reader = this.#getReader(offset);
        const beatmap = await this.#readBeatmap(reader);
        return beatmap;
    }

    /**
     * Get a beatmap entry by its md5 hash.
     * @param {string} md5 Beatmap hash.
     * @returns {Promise<Beatmap>}
     */
    async getBeatmapByHash(md5) {
        const entry = this.#beatmapIndex.find(e => e.md5 == md5);
        if (!entry) return null;
        return await this.#readBeatmapAtOffset(entry.offset);
    }

    /**
     * Get a beatmap by its online ID. Note that all unsubmitted maps have an ID of 0.
     * @param {number} id Online beatmap ID.
     * @returns {Promise<Beatmap>}
     */
    async getBeatmapById(id) {
        const entry = this.#beatmapIndex.find(e => e.beatmapId == id);
        if (!entry) return null;
        return await this.#readBeatmapAtOffset(entry.offset);
    }

    /**
     * Get beatmaps in bulk, optionally with pagination.
     * @param {number} limit Get this many results.
     * @param {number} offset Skip this many results.
     * @returns {Promise<Beatmap[]>}
     */
    async getBeatmaps(limit = 0, offset = 0) {
        limit = limit || this.data.beatmapCount - offset;
        const cache = this.#beatmapIndex[offset];
        if (!cache) return [];
        const reader = this.#getReader(cache.offset);
        const beatmaps = [];
        let i = 0;
        while (i < limit) {
            beatmaps.push(await this.#readBeatmap(reader));
            i++;
        }
        return beatmaps;
    }
};
