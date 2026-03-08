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

    #getBeatmapObject(RealmBeatmap) {
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
        const entry = Object.create(RealmBeatmap);
        entry.rankedStatusString = lazerStatuses[entry.Status] || 'unknown';
        return new Beatmap(entry);
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
        return mapsSliced.map(m => this.#getBeatmapObject(m));
    }

    /**
     * Get a beatmap from the database by its MD5 hash.
     * @param {string} beatmapHash Beatmap hash.
     * @returns {Promise<Beatmap|null>}
     */
    async getBeatmapByHash(beatmapHash) {
        const result = this.db.realm.objects('Beatmap').filtered('MD5Hash == $0', beatmapHash)[0];
        if (!result) return null;
        return this.#getBeatmapObject(result);
    }

    /**
     * Get a beatmap by its online ID. Note that all unsubmitted maps have an ID of 0.
     * @param {number} id Online beatmap ID.
     * @returns {Promise<Beatmap|null>}
     */
    async getBeatmapById(id) {
        if (id === 0) return null;
        const result = this.db.realm.objects('Beatmap').filtered('OnlineID == $0', id)[0];
        if (!result) return null;
        return this.#getBeatmapObject(result);
    }

    async getCollections(limit = Infinity, offset = 0) {}

    async getCollectionByName(nameSubstring) {}

    async searchCollections(nameSubstring) {}

    async createCollection(name, beatmapHashes) {}

    async deleteCollection(name) {}

    async getScores(limit = Infinity, offset = 0) {}

    async getBeatmapScores(beatmapHash) {}
};
