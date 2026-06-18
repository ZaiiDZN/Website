const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'i-think-narcissus-fell-in.html');
const extrasDir = path.join(root, 'images', 'i-think-narcissus-fell-in', 'extras');

const html = fs.readFileSync(htmlPath, 'utf8');
const extensionMatch = html.match(/const extensions = (\[[\s\S]*?\n\s*\]);/);

assert(extensionMatch, 'Could not find extras media extension list');

const extensions = Function(`"use strict"; return (${extensionMatch[1]});`)();
const extrasFiles = new Set(
  fs.readdirSync(extrasDir).filter((filename) => /^\d+\.[^.]+$/.test(filename))
);

const discovered = [];
let fileNumber = 1;
let foundFiles = 0;
const maxFiles = 50;

while (foundFiles < maxFiles) {
  let fileFound = false;

  for (const extGroup of extensions) {
    for (const ext of extGroup) {
      const filename = `${fileNumber}.${ext}`;

      if (extrasFiles.has(filename)) {
        discovered.push(filename);
        fileFound = true;
        foundFiles++;
        break;
      }
    }

    if (fileFound) break;
  }

  if (!fileFound) break;

  fileNumber++;
}

assert.deepStrictEqual(
  discovered,
  [
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
    '12.jpg',
  ],
  'Extras scanner should discover the full contiguous media sequence'
);
