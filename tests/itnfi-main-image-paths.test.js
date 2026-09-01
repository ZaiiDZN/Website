const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const pagePath = path.join(repoRoot, 'i-think-narcissus-fell-in.html');
const html = fs.readFileSync(pagePath, 'utf8');

const mainImageMatches = [
    ...html.matchAll(/<img\s+src="(images\/i-think-narcissus-fell-in\/[1-6]\/[1-3]\.[^"]+)"/g)
];

assert.strictEqual(
    mainImageMatches.length,
    18,
    'Expected three main images for each of the six ITNFI pieces.'
);

const missingImages = mainImageMatches
    .map((match) => match[1])
    .filter((src) => !fs.existsSync(path.join(repoRoot, src)));

assert.deepStrictEqual(missingImages, []);

console.log('ITNFI main image paths exist.');
