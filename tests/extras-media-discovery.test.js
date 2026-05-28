const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const pagePath = path.join(repoRoot, 'i-think-narcissus-fell-in.html');
const extrasDir = path.join(repoRoot, 'images/i-think-narcissus-fell-in/extras');
const html = fs.readFileSync(pagePath, 'utf8');

function extractFunction(name) {
    const start = html.indexOf(`function ${name}`);
    assert.notStrictEqual(start, -1, `Expected ${name} to exist`);

    const bodyStart = html.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < html.length; i++) {
        if (html[i] === '{') depth++;
        if (html[i] === '}') depth--;
        if (depth === 0) {
            return html.slice(start, i + 1);
        }
    }

    throw new Error(`Could not extract ${name}`);
}

function extractLoadExtrasExtensions() {
    const loadStart = html.indexOf('async function loadExtrasMedia');
    assert.notStrictEqual(loadStart, -1, 'Expected loadExtrasMedia to exist');

    const extensionsStart = html.indexOf('const extensions =', loadStart);
    assert.notStrictEqual(extensionsStart, -1, 'Expected loadExtrasMedia extensions list');

    const arrayStart = html.indexOf('[', extensionsStart);
    let depth = 0;
    for (let i = arrayStart; i < html.length; i++) {
        if (html[i] === '[') depth++;
        if (html[i] === ']') depth--;
        if (depth === 0) {
            return vm.runInNewContext(`(${html.slice(arrayStart, i + 1)})`);
        }
    }

    throw new Error('Could not extract loadExtrasMedia extensions list');
}

const getExtensionCandidates = vm.runInNewContext(`(${extractFunction('getExtensionCandidates')})`);
const extensionGroups = extractLoadExtrasExtensions();

const existingByNumber = new Map();
for (const filename of fs.readdirSync(extrasDir)) {
    const match = filename.match(/^(\d+)\.([^.]+)$/);
    if (!match) continue;

    const number = Number(match[1]);
    const files = existingByNumber.get(number) || [];
    files.push(filename);
    existingByNumber.set(number, files);
}

const highestExistingNumber = Math.max(...existingByNumber.keys());
const missingNumbers = [];
for (let number = 1; number <= highestExistingNumber; number++) {
    if (!existingByNumber.has(number)) {
        missingNumbers.push(number);
    }
}
assert.deepStrictEqual(missingNumbers, [], 'Test fixture expects contiguous numbered extras');

const discovered = [];
for (let fileNumber = 1; discovered.length < 50; fileNumber++) {
    let fileFound = false;

    for (const extGroup of extensionGroups) {
        for (const ext of extGroup) {
            for (const extensionCandidate of getExtensionCandidates(ext)) {
                const filename = `${fileNumber}.${extensionCandidate}`;
                if (fs.existsSync(path.join(extrasDir, filename))) {
                    discovered.push(filename);
                    fileFound = true;
                    break;
                }
            }
            if (fileFound) break;
        }
        if (fileFound) break;
    }

    if (!fileFound) break;
}

const expected = Array.from({ length: highestExistingNumber }, (_, index) => index + 1);
assert.deepStrictEqual(
    discovered.map((filename) => Number(filename.split('.')[0])),
    expected,
    'Extras discovery must not stop at uppercase extensions before later files'
);
assert.ok(discovered.includes('7.MOV'), 'Uppercase MOV extra should be discovered');
assert.ok(discovered.includes('12.jpg'), 'Scanner should continue after the uppercase MOV file');

console.log(`Discovered ${discovered.length} extras: ${discovered.join(', ')}`);
