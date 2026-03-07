const clc = require('cli-color');

/**
 * @typedef {Object} TestCase
 * @property {string} name The name of the test.
 * @property {Function} f An optionally async function that runs the test logic. Accepts a parameter containing the return value of the previous test.
 * @property {string[]} [requires] Optional array of test names that must pass before this test runs, otherwise this test is skipped.
 * @property {boolean} [expectError] Optional flag indicating the test should throw an error to pass.
 */

/**
 * A very simple test runner.
 * @param {TestCase[]} tests Array of test objects to execute
 */
const run = async tests => {
    const results = [];
    let prevReturn;

    // Loop for each test
    for (const test of tests) {
        try {
            // Ensure test dependencies are met
            if (test.requires) {
                let found = true;
                for (const requiredName of test.requires) {
                    found = results.find(r => r.status == 'passed' && r.test.name == requiredName);
                    if (!found) break;
                }
                if (!found) {
                    console.log(clc.yellowBright(`SKIPPED:`), test.name);
                    console.log();
                    results.push({ status: 'skipped', test });
                    continue;
                }
            }

            // Run the test
            console.log(clc.blueBright(`RUNNING:`), test.name);
            prevReturn = await test.f(prevReturn);

            // Throw error if test expects error but didn't throw
            if (test.expectError) throw new Error(`No error was thrown`);

            // Log and save pass
            console.log(clc.greenBright('PASS!'));
            results.push({ status: 'passed', test });
        } catch (error) {
            // Log and save fail
            console.log(clc.redBright('FAIL:'), error);
            results.push({ status: 'failed', test });
        }
        console.log();
    }

    // Print results
    const countPassed = results.filter(r => r.status == 'passed').length;
    const countSkipped = results.filter(r => r.status == 'skipped').length;
    const countFailed = results.filter(r => r.status == 'failed').length;
    console.log(`Results: ${countPassed} passed, ${countSkipped} skipped, ${countFailed} failed:`);
    for (const { status, test } of results) {
        switch (status) {
            case 'passed':
                console.log(clc.greenBright(' PASS:'), test.name);
                break;
            case 'skipped':
                console.log(clc.yellowBright(' SKIP:'), test.name);
                break;
            case 'failed':
                console.log(clc.redBright(' FAIL:'), test.name);
                break;
        }
    }

    // Exit with code based on present failures
    process.exit(countFailed != 0 ? 1 : 0);
};

module.exports = run;
