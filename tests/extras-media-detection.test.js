const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(repoRoot, 'i-think-narcissus-fell-in.html');
const extrasDir = path.join(repoRoot, 'images/i-think-narcissus-fell-in/extras');

const html = fs.readFileSync(htmlPath, 'utf8');
const loaderStart = html.indexOf('async function loadExtrasMedia()');
assert.notStrictEqual(loaderStart, -1, 'loadExtrasMedia() should exist');

const loaderEnd = html.indexOf('// Render extras carousel', loaderStart);
assert.notStrictEqual(loaderEnd, -1, 'loadExtrasMedia() block should be followed by renderExtrasCarousel');

const loaderSource = html.slice(loaderStart, loaderEnd);
const extensionsMatch = loaderSource.match(/const extensions = \[([\s\S]*?)\];/);
assert(extensionsMatch, 'loadExtrasMedia() should define extension groups');

const extensionGroups = [];
const groupPattern = /\[([^\[\]]+)\]/g;
let groupMatch;
while ((groupMatch = groupPattern.exec(extensionsMatch[1])) !== null) {
    const extensions = [];
    const stringPattern = /'([^']+)'/g;
    let stringMatch;
    while ((stringMatch = stringPattern.exec(groupMatch[1])) !== null) {
        extensions.push(stringMatch[1]);
    }
    if (extensions.length) {
        extensionGroups.push(extensions);
    }
}

assert(extensionGroups.some((group) => group.includes('MOV')), 'extras scanner must support uppercase .MOV files');

const actualNumericExtras = fs.readdirSync(extrasDir)
    .filter((fileName) => /^\d+\.[^.]+$/.test(fileName))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

assert(actualNumericExtras.includes('7.MOV'), 'fixture should cover the case-sensitive .MOV asset');

const detectedExtras = [];
for (let fileNumber = 1; detectedExtras.length < 50; fileNumber++) {
    let foundFile = null;

    for (const extensionGroup of extensionGroups) {
        for (const extension of extensionGroup) {
            const fileName = `${fileNumber}.${extension}`;
            if (actualNumericExtras.includes(fileName)) {
                foundFile = fileName;
                break;
            }
        }
        if (foundFile) break;
    }

    if (!foundFile) break;
    detectedExtras.push(foundFile);
}

assert.deepStrictEqual(
    detectedExtras,
    actualNumericExtras,
    'extras scanner should not stop before later numbered media because of filename case'
);

console.log(`Detected ${detectedExtras.length} ITNFI extras media files.`);
