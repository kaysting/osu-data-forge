const log = (...args) => {
    if (!process.env.ODBM_VERBOSE) return;
    console.log(`[odbm]`, ...args);
};

const isBitFlipped = (input, bitIndex) => {
    return (input & (1 << bitIndex)) !== 0;
};

module.exports = {
    log,
    isBitFlipped
};
