const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const pagePath = path.join(repoRoot, 'i-think-narcissus-fell-in.html');
const extrasFolder = 'images/i-think-narcissus-fell-in/extras/';

function parseQuotedStrings(source) {
    const matches = source.match(/'([^']+)'/g) || [];
    return matches.map((match) => match.slice(1, -1));
}

function readExtensionGroups() {
    const html = fs.readFileSync(pagePath, 'utf8');
    const match = html.match(/const extensions = \[\s*\[([^\]]+)\],\s*\[([^\]]+)\],\s*\[([^\]]+)\]\s*\];/);
    assert(match, 'Could not find extras media extension groups in page source');
    return match.slice(1).map(parseQuotedStrings);
}

function listTrackedExtras() {
    const output = execFileSync(
        'git',
        ['ls-files', `${extrasFolder}*`],
        { cwd: repoRoot, encoding: 'utf8' }
    );
    return output.trim().split('\n').filter(Boolean);
}

function contiguousExpectedExtras(trackedFiles) {
    const byNumber = new Map();
    for (const filePath of trackedFiles) {
        const match = filePath.match(/\/(\d+)\.[^/]+$/);
        if (match) {
            byNumber.set(Number(match[1]), filePath);
        }
    }

    const expected = [];
    for (let fileNumber = 1; byNumber.has(fileNumber); fileNumber++) {
        expected.push(byNumber.get(fileNumber));
    }
    return expected;
}

function simulateExtrasScan(extensionGroups, trackedFiles) {
    const tracked = new Set(trackedFiles);
    const found = [];
    const maxFiles = 50;

    for (let fileNumber = 1; found.length < maxFiles; fileNumber++) {
        let fileFound = false;

        for (const extGroup of extensionGroups) {
            for (const ext of extGroup) {
                const filePath = `${extrasFolder}${fileNumber}.${ext}`;
                if (tracked.has(filePath)) {
                    found.push(filePath);
                    fileFound = true;
                    break;
                }
            }
            if (fileFound) break;
        }

        if (!fileFound) break;
    }

    return found;
}

const extensionGroups = readExtensionGroups();
const trackedExtras = listTrackedExtras();
const expected = contiguousExpectedExtras(trackedExtras);
const found = simulateExtrasScan(extensionGroups, trackedExtras);

assert.deepStrictEqual(
    found,
    expected,
    `Extras scan should include every contiguous numbered asset. Found:\n${found.join('\n')}\nExpected:\n${expected.join('\n')}`
);

console.log(`Detected ${found.length} contiguous extras, including case-sensitive media filenames.`);
