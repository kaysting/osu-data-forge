// src/objects/Beatmap.js

const BeatmapSet = require('./BeatmapSet');
const BeatmapUserState = require('./BeatmapUserState');

module.exports = class Beatmap {
    /**
     * Create a new `Beatmap` object with data from stable or lazer databases.
     * @param {Object} d Raw data.
     */
    constructor(d = {}) {
        /**
         * Beatmapset metadata. Contains data relevant to all difficulties of the set that this beatmap belongs to.
         * @type {BeatmapSet}
         */
        this.beatmapset = new BeatmapSet(d);

        /**
         * The size of the map.
         *
         * This value is exclusive to stable databases older than version `20191106`.
         * @type {number|null}
         */
        this.size = d.size ?? null;
        /**
         * The MD5 hash of this beatmap. This value serves as the beatmap's truly unique identifier, separate from its online ID.
         * @type {string|null}
         */
        this.hash = d.md5 ?? d.hash ?? null;
        /**
         * The name of the audio file for this map.
         * @type {string}
         */
        this.audioFileName = d.audioFileName ?? '';
        /**
         * The name of the `.osu` file for this map.
         *
         * Exclusive to stable.
         * @type {string}
         */
        this.osuFileName = d.osuFileName ?? '';
        /**
         * The online ID for this specific beatmap difficulty. `0` if unsubmitted.
         * @type {number}
         */
        this.id = d.beatmapId ?? 0;

        /**
         * The game mode/ruleset of this map.
         *
         * Short names for custom rulesets in lazer should appear here, though it's untested.
         * @type {'osu'|'taiko'|'catch'|'mania'}
         */
        this.mode = d.modeString ?? d.mode ?? 'osu';

        /**
         * Version name. This is the name of the individual beatmap difficulty, like Easy, Hard, Insane, etc.
         * @type {string}
         */
        this.version = d.version ?? '';

        /**
         * Map ranked status.
         * @type {'unknown'|'graveyard'|'pending'|'wip'|'ranked'|'approved'|'loved'|'qualified'}
         */
        this.rankedStatus = d.rankedStatusString ?? d.rankedStatus ?? 'unknown';

        /**
         * The number of circles in this map.
         *
         * This is present for all modes and equates to the mode's primary object.
         * @type {number}
         */
        this.countCircles = d.countCircles ?? 0;
        /**
         * The number of sliders in this map, or a combined count of sliders and spinners if reading from lazer.
         *
         * This is present for all modes and equates to the mode's secondary/hold type object.
         * @type {number}
         */
        this.countSliders = d.countSliders ?? 0;
        /**
         * The number of spinners in this map, or always `0` if reading from lazer.
         *
         * This is present for all modes and equates to the mode's special/uncommon object.
         * @type {number}
         */
        this.countSpinners = d.countSpinners ?? 0;

        /**
         * Circle size, or key count in mania.
         * @type {number}
         */
        this.cs = d.cs ?? 0;
        /**
         * Approach rate.
         * @type {number}
         */
        this.ar = d.ar ?? 0;
        /**
         * Overall difficulty (accuracy).
         * @type {number}
         */
        this.od = d.od ?? 0;
        /**
         * HP drain.
         * @type {number}
         */
        this.hp = d.hp ?? 0;

        /**
         * Mania scroll speed.
         *
         * Unsure if this is tied to the map or a user setting. Please create an issue or PR if this should belong inside `userState`.
         * @type {number}
         */
        this.maniaScrollSpeed = d.maniaScrollSpeed ?? 0;

        /**
         * The nomod star rating (difficulty) of this map.
         * @type {number}
         */
        this.starRating = d.starRating ?? 0;

        /**
         * The length of the map in milliseconds, not counting breaks. Equal to `totalTimeMs` if reading from lazer.
         * @type {number}
         */
        this.drainTimeMs = d.drainTimeMs ?? (d.drainTimeSecs ? d.drainTimeSecs * 1000 : null) ?? 0;
        /**
         * The length of the map in milliseconds from start to end.
         * @type {number}
         */
        this.totalTimeMs = d.totalTimeMs ?? (d.totalTimeSecs ? d.totalTimeSecs * 1000 : null) ?? 0;
        /**
         * The audio offset in milliseconds that the preview point is placed at.
         *
         * Exclusive to stable.
         * @type {number}
         */
        this.previewPointOffsetMs = d.previewPointOffsetMs ?? 0;

        /**
         * The date this map was last modified locally.
         * @type {Date}
         */
        this.dateLastModified = d.dateLastModified ?? Date.now();
        /**
         * The date this map was last synced with the osu! servers.
         * @type {Date|null}
         */
        this.dateLastSynced = d.dateLastSynced ?? null;
        /**
         * The date this map was last played by the user.
         * @type {Date|null}
         */
        this.dateLastPlayed = d.dateLastPlayed ?? null;

        /**
         * Online offset configured by the mapper.
         * @type {number}
         */
        this.onlineOffset = d.onlineOffset ?? 0;

        /**
         * Map-specific user settings and played state.
         * @type {BeatmapUserState}
         */
        this.userState = new BeatmapUserState(d);
    }
};
