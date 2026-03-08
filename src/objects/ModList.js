const { isBitFlipped } = require('../../lib/utils');

module.exports = class ModList {
    /**
     * An array where the index maps to the bit in a stable mod bitmask
     * and the value at that index is the name of the mod.
     */
    static stableModBits = `
        NoFail,Easy,TouchDevice,Hidden,HardRock,SuddenDeath,DoubleTime,Relax,
        HalfTime,Nightcore,Flashlight,Auto,SpunOut,AutoPilot,Perfect,
        4K,5K,6K,7K,8K,KeyMod,FadeIn,Random,Cinema,TargetPractice,9K,Coop,
        1K,2K,3K,ScoreV2,Mirror`
        .split(',')
        .map(s => s.trim());

    /**
     * Parse a stable mods bitmask integer into an array of mod names.
     * @param {number} int Stable mods bitmask integer.
     * @returns {string[]}
     */
    static fromStableBitMask(int) {
        const arr = [];
        for (let i = 0; i < ModList.stableModBits.length; i++) {
            if (isBitFlipped(int, i)) {
                arr.push(ModList.stableModBits[i]);
            }
        }
        return arr;
    }
};
