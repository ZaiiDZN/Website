const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const pagePath = path.join(repoRoot, 'i-think-narcissus-fell-in.html');
const extrasDir = path.join(repoRoot, 'images', 'i-think-narcissus-fell-in', 'extras');

const html = fs.readFileSync(pagePath, 'utf8');
const scannerMatch = html.match(
    /function loadExtrasMedia\(\)[\s\S]*?const extensions = (\[[\s\S]*?\n\s*]\s*);/
);

assert(scannerMatch, 'Could not find extras media extension groups');

const extensionGroups = vm.runInNewContext(scannerMatch[1]);
const actualFiles = new Set(fs.readdirSync(extrasDir));
const detected = [];

for (let fileNumber = 1; detected.length < 50; fileNumber++) {
    let found = false;

    for (const extensionGroup of extensionGroups) {
        for (const extension of extensionGroup) {
            const filename = `${fileNumber}.${extension}`;

            if (actualFiles.has(filename)) {
                detected.push(filename);
                found = true;
                break;
            }
        }

        if (found) break;
    }

    if (!found) break;
}

assert.deepStrictEqual(detected, [
    '1.jpg',
    '2.jpeg',
    '3.jpeg',
    '4.jpeg',
    '5.jpeg',
    '6.jpeg',
    '7.MOV',
    '8.jpeg',
    '9.mov',
    '10.jpg',
    '11.jpg',
    '12.jpg'
]);

