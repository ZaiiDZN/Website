const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const html = fs.readFileSync(
    path.join(root, 'i-think-narcissus-fell-in.html'),
    'utf8'
);

const desktopMediaRule = css.match(
    /\.narcissus-project-page \.piece-media-row\s*\{([^}]*)\}/
);

assert.ok(desktopMediaRule, 'desktop media-row rule should exist');
assert.match(desktopMediaRule[1], /grid-column:\s*1\s*;/);
assert.match(desktopMediaRule[1], /grid-row:\s*2\s*;/);
assert.match(desktopMediaRule[1], /position:\s*relative\s*;/);
assert.doesNotMatch(desktopMediaRule[1], /position:\s*absolute\s*;/);
assert.doesNotMatch(
    html,
    /adjustOrangeBoxHeights|calculateHeights/,
    'layout must not wait for every lazy image before reserving media-row space'
);

console.log('ITNFI media rows remain in normal grid flow.');
