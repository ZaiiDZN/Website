const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(repoRoot, 'i-think-narcissus-fell-in.html');
const extrasDir = path.join(repoRoot, 'images/i-think-narcissus-fell-in/extras');

const html = fs.readFileSync(htmlPath, 'utf8');
const loadExtrasMediaMatch = html.match(/async function loadExtrasMedia\(\) \{[\s\S]*?renderExtrasCarousel\(\);[\s\S]*?\n        \}/);
assert(loadExtrasMediaMatch, 'loadExtrasMedia function should exist');

const extensionsMatch = loadExtrasMediaMatch[0].match(/const extensions = \[([\s\S]*?)\];/);
assert(extensionsMatch, 'loadExtrasMedia should define extension groups');

const extensionGroups = [...extensionsMatch[1].matchAll(/\[([^\]]+)\]/g)]
    .map((group) => [...group[1].matchAll(/'([^']+)'/g)].map((extension) => extension[1]));
const extensions = extensionGroups.flat();

assert(
    extensions.includes('MOV'),
    'extras scanner must probe uppercase MOV files on case-sensitive hosts'
);

const discovered = [];
for (let fileNumber = 1; fileNumber <= 50; fileNumber++) {
    const fileName = extensions
        .map((extension) => `${fileNumber}.${extension}`)
        .find((candidate) => fs.existsSync(path.join(extrasDir, candidate)));

    if (!fileName) break;
    discovered.push(fileName);
}

assert.deepStrictEqual(
    discovered.map((fileName) => Number(fileName.split('.')[0])),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    'extras scanner should discover every contiguous tracked extra asset'
);
assert.strictEqual(discovered[6], '7.MOV', 'the seventh extra asset is tracked as uppercase 7.MOV');

