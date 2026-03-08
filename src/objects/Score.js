module.exports = class Score {
    /**
     * Create a new `Score` object using data from a stable or lazer database.
     * @param {Object} d Raw data.
     */
    constructor(d) {
        /**
         * The database/game version that this score was set on.
         * @type {number|null}
         */
        this.version = d.version ?? null;
        /**
         * The md5 hash of the beatmap that this score was set on.
         * @type {string|null}
         */
        this.beatmapHash = d.beatmapHash ?? null;
        /**
         * The md5 hash of this score's replay file.
         * @type {string|null}
         */
        this.replayHash = d.replayHash ?? null;
        /**
         * The submitted score ID for this score, or `0` if unsubmitted.
         * @type {number}
         */
        this.scoreId = d.onlineScoreId ?? 0;

        /**
         * The mode this score was set on.
         * @type {'osu'|'taiko'|'catch'|'mania'}
         */
        this.mode = d.modeString ?? 'osu';

        /**
         * The name of the player who set this score.
         * @type {string}
         */
        this.playerName = d.playerName ?? '';

        /**
         * Number of 300s.
         * @type {number}
         */
        this.count300 = d.count300 ?? 0;
        /**
         * Number of 100's in osu!, 150's in osu!taiko, 100's in osu!catch, 100's in osu!mania.
         * @type {number}
         */
        this.count100 = d.count100 ?? 0;
        /**
         * Number of 50's in osu!, small fruit in osu!catch, 50's in osu!mania
         * @type {number}
         */
        this.count50 = d.count50 ?? 0;
        /**
         * Number of Gekis in osu!, Max 300's in osu!mania.
         * @type {number}
         */
        this.countGeki = d.countGeki ?? 0;
        /**
         * Number of Katus in osu!, 200's in osu!mania.
         * @type {number}
         */
        this.countKatsu = d.countKatsu ?? 0;
        /**
         * Number of misses.
         * @type {number}
         */
        this.countMiss = d.countMiss ?? 0;

        /**
         * Replay score.
         * @type {number}
         */
        this.replayScore = d.replayScore ?? 0;

        /**
         * Max combo achieved.
         * @type {number}
         */
        this.maxCombo = d.maxCombo ?? 0;
        /**
         * Is this score a full combo?
         * @type {boolean}
         */
        this.isFullCombo = d.isFullCombo ?? false;

        /**
         * A list of names of the mods used to set this score.
         * @type {string[]}
         */
        this.mods = d.modStrings ?? [];

        /**
         * The time/date at which this score was set.
         * @type {Date}
         */
        this.timePlayed = d.timePlayed ?? new Date();
    }
};
