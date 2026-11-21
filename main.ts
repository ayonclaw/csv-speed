// Contest driver: parse each input independently, then serialize one deterministic answer array.
import { readFileSync, writeFileSync } from 'node:fs';
import { setFlagsFromString } from 'node:v8';
setFlagsFromString('--no-incremental-marking');
const { run } = await import('./solve.js');
const inputs = JSON.parse(readFileSync((process.env.MAKEFUN_INPUT_DIR ?? '/input') + '/cases.json', 'utf8'));
const answers = [];
for (const entry of inputs) answers.push(run(entry.input));
writeFileSync((process.env.MAKEFUN_OUTPUT_DIR ?? '/output') + '/answers.json', JSON.stringify(answers));
