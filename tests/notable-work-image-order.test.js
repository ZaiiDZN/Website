const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'script.js');
const scriptSource = fs.readFileSync(scriptPath, 'utf8');

function loadOrderingHelpers() {
    const start = scriptSource.indexOf('function getPieceImageNumber');
    const endMarker = 'async function openPieceModal';
    const end = scriptSource.indexOf(endMarker);
    assert.ok(start !== -1 && end !== -1 && end > start, 'Expected piece image ordering helpers in script.js');

    const helperSource = scriptSource.slice(start, end);
    const context = { Number };
    vm.runInNewContext(
        `${helperSource}\nthis.getPieceImageNumber = getPieceImageNumber;\nthis.orderPieceImagesByNumber = orderPieceImagesByNumber;`,
        context
    );
    return context;
}

function testHelperSortsScrambledExtras() {
    const { orderPieceImagesByNumber, getPieceImageNumber } = loadOrderingHelpers();

    assert.strictEqual(getPieceImageNumber('images/notable-work/17/3.jpeg'), 3);
    assert.strictEqual(getPieceImageNumber('images/notable-work/17/10.png'), 10);

    const scrambled = [
        { path: 'images/notable-work/17/5.jpeg', isMain: false },
        { path: 'images/notable-work/17/2.jpeg', isMain: false },
        { path: 'images/notable-work/17/4.jpeg', isMain: false },
        { path: 'images/notable-work/17/3.jpeg', isMain: false }
    ];

    const ordered = orderPieceImagesByNumber(scrambled);
    assert.deepStrictEqual(
        ordered.map((img) => img.path),
        [
            'images/notable-work/17/2.jpeg',
            'images/notable-work/17/3.jpeg',
            'images/notable-work/17/4.jpeg',
            'images/notable-work/17/5.jpeg'
        ]
    );
}

function testOpenPieceModalUsesFixedSlots() {
    assert.match(
        scriptSource,
        /const extraImageSlots = new Array\(9\)\.fill\(null\)/,
        'openPieceModal should probe extras into fixed slots'
    );
    assert.match(
        scriptSource,
        /extraImageSlots\[slotIndex\] = \{ path: imgPath, isMain: false \}/,
        'extra probes must write to slotIndex, not push in completion order'
    );
    assert.match(
        scriptSource,
        /orderPieceImagesByNumber\(extraImageSlots\.filter\(Boolean\)\)/,
        'extras should be ordered by piece number before rendering'
    );
    assert.doesNotMatch(
        scriptSource,
        /allImages\.push\(\{ path: imgPath, isMain: false \}\)/,
        'extra image probes must not append into a shared array by onload timing'
    );
}

testHelperSortsScrambledExtras();
testOpenPieceModalUsesFixedSlots();
console.log('notable-work-image-order.test.js passed');
