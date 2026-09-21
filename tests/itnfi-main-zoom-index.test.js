const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'i-think-narcissus-fell-in.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start !== -1, `Missing function ${name}`);
  let i = source.indexOf('{', start);
  assert.ok(i !== -1, `Missing body for ${name}`);
  let depth = 0;
  for (; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }
  throw new Error(`Unclosed function ${name}`);
}

eval(extractFunction(html, 'getNumberedMediaFileNumber'));
eval(extractFunction(html, 'resolveMainImageCarouselIndex'));

assert.strictEqual(getNumberedMediaFileNumber('images/i-think-narcissus-fell-in/2/3.jpeg'), 3);
assert.strictEqual(
  getNumberedMediaFileNumber('http://127.0.0.1:8765/images/i-think-narcissus-fell-in/5/2.jpg?x=1'),
  2
);

const scrambled = [
  { type: 'image', src: 'images/i-think-narcissus-fell-in/3/3.jpeg' },
  { type: 'image', src: 'images/i-think-narcissus-fell-in/3/1.jpeg' },
  { type: 'image', src: 'images/i-think-narcissus-fell-in/3/2.jpeg' }
];

// Absolute clicked URL must resolve to the matching file number, not always index 0
assert.strictEqual(
  resolveMainImageCarouselIndex(
    'http://127.0.0.1:8765/images/i-think-narcissus-fell-in/3/2.jpeg',
    scrambled,
    0
  ),
  2
);
assert.strictEqual(
  resolveMainImageCarouselIndex(
    'http://127.0.0.1:8765/images/i-think-narcissus-fell-in/3/1.jpeg',
    scrambled,
    9
  ),
  1
);

// loadMainImages must use fixed slots (not push-on-onload)
assert.match(html, /slots\[i - 1\]\s*=/);
assert.doesNotMatch(
  html,
  /pieceMainImages\[pieceId\] = mainImages;/
);
assert.match(html, /resolveMainImageCarouselIndex\(/);
assert.match(
  html,
  /mixed-media-row\[data-piece-id\]/
);

// Old buggy matcher must not remain in the click path
assert.doesNotMatch(
  html,
  /imgSrc\.includes\(`\/\$\{pid\}\/`\)/
);

console.log('itnfi-main-zoom-index.test.js: all assertions passed');
