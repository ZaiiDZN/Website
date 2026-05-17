const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'i-think-narcissus-fell-in.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const start = html.indexOf('function getFileType');
const end = html.indexOf('// Render extras carousel items');

assert.notStrictEqual(start, -1, 'getFileType function was not found');
assert.notStrictEqual(end, -1, 'loadExtrasMedia section end was not found');
assert.ok(end > start, 'loadExtrasMedia section appears before getFileType');

const loaderSource = html.slice(start, end);
const existingFiles = new Set([
    'images/i-think-narcissus-fell-in/extras/1.jpg',
    'images/i-think-narcissus-fell-in/extras/2.jpeg',
    'images/i-think-narcissus-fell-in/extras/3.jpeg',
    'images/i-think-narcissus-fell-in/extras/4.jpeg',
    'images/i-think-narcissus-fell-in/extras/5.jpeg',
    'images/i-think-narcissus-fell-in/extras/6.jpeg',
    // extras/7.* is intentionally absent in the committed assets.
    'images/i-think-narcissus-fell-in/extras/8.jpeg',
    'images/i-think-narcissus-fell-in/extras/9.mov',
    'images/i-think-narcissus-fell-in/extras/10.jpg',
    'images/i-think-narcissus-fell-in/extras/11.jpg',
    'images/i-think-narcissus-fell-in/extras/12.jpg',
]);

const sandbox = {
    console,
    fetch: async (filePath) => ({ ok: existingFiles.has(filePath) }),
};

vm.createContext(sandbox);
vm.runInContext(`
let extrasItems = [];
function renderExtrasCarousel() {
    globalThis.__renderCalled = true;
    globalThis.__extrasItems = extrasItems;
}
${loaderSource}
`, sandbox);

(async () => {
    await vm.runInContext('loadExtrasMedia()', sandbox);

    assert.strictEqual(sandbox.__renderCalled, true, 'carousel render should be called');
    const loadedNumbers = Array.from(sandbox.__extrasItems, (item) => item.number);
    assert.deepStrictEqual(
        loadedNumbers,
        [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12],
        'extras media scan should continue after a missing numbered file'
    );
    assert.strictEqual(
        sandbox.__extrasItems.find((item) => item.number === 9).type,
        'video',
        'video extras after a numbering gap should still be loaded'
    );
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
