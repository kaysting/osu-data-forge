const RealmDatabase = require('../../io/RealmDatabase');
const Beatmap = require('../../objects/Beatmap');
const Collection = require('../../objects/Collection');
const Score = require('../../objects/Score');

module.exports = class LazerRealmDatabase {
    /** Please use the static `open()` method! */
    constructor(db) {
        /**
         * The `RealmDatabase` instance.
         * @type {RealmDatabase}
         */
        this.db = db;
        /** Database file path. */
        this.filePath = '';
    }

    /**
     * Open a lazer client.realm database for reading and writing.
     * @param {string} filePath Path to client.realm.
     */
    static async open(filePath) {
        const db = await RealmDatabase.open(filePath);
        const instance = new LazerRealmDatabase(db);
        instance.filePath = filePath;
        return instance;
    }

    close() {
        this.close();
    }

    /**
     * Get installed maps, optionally paginated.
     * @param {number} limit Get this many maps.
     * @param {number} offset Skip this many maps.
     * @returns {Promise<Beatmap[]>}
     */
    async getBeatmaps(limit = Infinity, offset = 0) {
        const mapObjects = this.db.realm.objects('Beatmap');
        const mapsSliced = mapObjects.slice(offset, offset + limit);
        const lazerStatuses = {
            '-3': 'unknown',
            '-2': 'graveyard',
            '-1': 'wip',
            0: 'pending',
            1: 'ranked',
            2: 'approved',
            3: 'qualified',
            4: 'loved'
        };
        return mapsSliced.map(m => {
            return new Beatmap({
                // Base Map Properties
                md5: m.MD5Hash,
                beatmapId: m.OnlineID,
                version: m.DifficultyName,
                starRating: m.StarRating,
                bpm: m.BPM,

                // Lazer stores length in milliseconds as a double
                drainTimeMs: m.Length,
                totalTimeMs: m.Length,

                // Lazer's ruleset object
                modeString: m.Ruleset?.ShortName || 'osu',

                // Difficulty Sub-object
                cs: m.Difficulty?.CircleSize,
                ar: m.Difficulty?.ApproachRate,
                od: m.Difficulty?.OverallDifficulty,
                hp: m.Difficulty?.DrainRate,

                // BeatmapSet and Metadata Sub-objects
                beatmapsetId: m.BeatmapSet?.OnlineID,
                title: m.Metadata?.Title,
                titleUnicode: m.Metadata?.TitleUnicode,
                artist: m.Metadata?.Artist,
                artistUnicode: m.Metadata?.ArtistUnicode,
                mapper: m.Metadata?.Author?.Username,
                source: m.Metadata?.Source,
                tags: m.Metadata?.Tags,
                audioFileName: m.Metadata?.AudioFile,

                // User Settings Sub-object
                localOffset: m.UserSettings?.Offset,

                // Dates
                dateLastModified: m.LastLocalUpdate ?? m.BeatmapSet?.DateAdded,
                dateLastSynced: m.LastOnlineUpdate,
                dateLastPlayed: m.LastPlayed,

                // Played State
                isPlayed: !!m.LastPlayed,

                // Object Counts
                countCircles: m.TotalObjectCount - m.EndTimeObjectCount,
                countSliders: m.EndTimeObjectCount, // Best approximation for Lazer
                countSpinners: 0,

                // Ranked Status
                rankedStatusString: lazerStatuses[m.Status] || 'unknown'
            });
        });
    }

    async getBeatmapByHash(beatmapHash) {}

    async getBeatmapById(id) {}

    async getCollections(limit = Infinity, offset = 0) {}

    async getCollectionByName(nameSubstring) {}

    async searchCollections(nameSubstring) {}

    async createCollection(name, beatmapHashes) {}

    async deleteCollection(name) {}

    async getScores(limit = Infinity, offset = 0) {}

    async getBeatmapScores(beatmapHash) {}
};
