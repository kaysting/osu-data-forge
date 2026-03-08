const Realm = require('realm');
const { log } = require('../../lib/utils');

module.exports = class RealmDatabase {
    constructor(realmInstance) {
        this.realm = realmInstance;
    }

    /**
     * Open a Realm database dynamically without pre-defining schemas.
     * @param {string} filePath Path to the realm database file.
     */
    static async open(filePath) {
        log(`Opening realm database at ${filePath}...`);

        // By omitting the 'schema' property in the config, Realm infers it from the file.
        const realmInstance = await Realm.open({
            path: filePath
        });

        log(`Successfully opened realm database!`);
        return new RealmDatabase(realmInstance);
    }

    /**
     * Retrieve the raw database schema.
     */
    getSchema() {
        return this.realm.schema;
    }

    /**
     * Safely close the Realm instance to release the file lock.
     */
    close() {
        if (!this.realm.isClosed) {
            this.realm.close();
            log('Realm database closed.');
        }
    }
};
