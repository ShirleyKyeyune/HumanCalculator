import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { processInput } from '../src/services/calculatorService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'human_calculation_test_cases.json'), 'utf8')
);

// Silence noisy debug logging from the service.
console.log = () => { };
const err = console.error;
console.error = () => { };

const TOLERANCE = 0.01;
const results = [];

for (const test of data.tests) {
    let actual = null;
    try {
        const processed = processInput(test.input);
        actual = processed[0]?.result;
    } catch (e) {
        actual = `ERROR: ${e.message}`;
    }

    const expected = test.expected;
    const pass =
        typeof actual === 'number' &&
        Math.abs(actual - expected) <= Math.max(TOLERANCE, Math.abs(expected) * 1e-6);

    results.push({ id: test.id, input: test.input, expected, actual, pass });
}

console.error = err;

const failures = results.filter((r) => !r.pass);
for (const r of results) {
    const tag = r.pass ? 'PASS' : 'FAIL';
    if (!r.pass) {
        err(`${tag} #${r.id}: ${r.input}`);
        err(`      expected ${r.expected}, got ${r.actual}`);
    }
}

err(`\n${results.length - failures.length}/${results.length} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
