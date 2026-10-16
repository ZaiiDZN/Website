'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'script.js');
const scriptSrc = fs.readFileSync(scriptPath, 'utf8');

function extractFunction(source, name) {
    const start = source.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `missing ${name}`);

    let brace = source.indexOf('{', start);
    let depth = 0;
    for (let i = brace; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        if (source[i] === '}') {
            depth -= 1;
            if (depth === 0) {
                return source.slice(start, i + 1);
            }
        }
    }

    throw new Error(`could not extract ${name}`);
}

const context = {};
vm.runInNewContext(
    [
        extractFunction(scriptSrc, 'formatPieceSize'),
        extractFunction(scriptSrc, 'formatNotableWorkSize'),
        'this.formatPieceSize = formatPieceSize;',
        'this.formatNotableWorkSize = formatNotableWorkSize;',
    ].join('\n'),
    context
);

const { formatPieceSize, formatNotableWorkSize } = context;

const alreadyMarked = [
    ['6" x 5" x 7.5"', '6" x 5" x 7.5"'],
    ['6.5" x 6.5" x 7"', '6.5" x 6.5" x 7"'],
    ['9" x 8.5" x 7.5"', '9" x 8.5" x 7.5"'],
    ['6.5" x 6.5" x 8.5"', '6.5" x 6.5" x 8.5"'],
    ['6" x 6" x 2.5"', '6" x 6" x 2.5"'],
    ['12.25" x 8"', '12.25" x 8"'],
    ['10.5" h', '10.5" h'],
];

for (const [input, expected] of alreadyMarked) {
    assert.strictEqual(formatNotableWorkSize(input), expected, input);
    assert.strictEqual(formatPieceSize(input), expected, input);
}

const bareNumbers = [
    ['24 x 36', '24" x 36"'],
    ['5.5 x 5.5 x 7', '5.5" x 5.5" x 7"'],
    ['6 x 6 x 5', '6" x 6" x 5"'],
    ['5.5 x 5.5 x 6.5', '5.5" x 5.5" x 6.5"'],
    ['4.5 x 5 x 5', '4.5" x 5" x 5"'],
    ['5 x 5 x 5.5', '5" x 5" x 5.5"'],
    ['7.5 in', '7.5"'],
    ['3.25 x 4.5 in', '3.25" x 4.5"'],
];

for (const [input, expected] of bareNumbers) {
    assert.strictEqual(formatNotableWorkSize(input), expected, input);
}

const notableDir = path.join(__dirname, '..', 'images', 'notable-work');
const quotedDecimalPieces = [];

for (const entry of fs.readdirSync(notableDir)) {
    const dataPath = path.join(notableDir, entry, 'piece-data.txt');
    if (!fs.existsSync(dataPath)) continue;
    const sizeLine = fs.readFileSync(dataPath, 'utf8')
        .split('\n')
        .find((line) => line.startsWith('size:'));
    if (!sizeLine) continue;
    const size = sizeLine.slice(5).trim();
    const formatted = formatNotableWorkSize(size);
    assert.ok(!/\d"\.\d/.test(formatted), `${entry} corrupted size: ${formatted}`);
    if (/\d\.\d+"/.test(size)) {
        quotedDecimalPieces.push(entry);
        assert.strictEqual(formatted, size, entry);
    }
}

assert.ok(quotedDecimalPieces.length >= 5, 'expected quoted decimal sizes in notable work');

console.log('piece-size tests passed');
