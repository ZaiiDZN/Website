const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const pagePath = path.join(repoRoot, 'i-think-narcissus-fell-in.html');
const extrasDir = path.join(repoRoot, 'images', 'i-think-narcissus-fell-in', 'extras');

const html = fs.readFileSync(pagePath, 'utf8');
const extensionBlockMatch = html.match(
  /const extensions = \[\s*\[([^\]]+)\],\s*\[([^\]]+)\],\s*\[([^\]]+)\]\s*\];/
);

assert(extensionBlockMatch, 'Could not find extras media extension groups');

const extensionGroups = extensionBlockMatch.slice(1).map((group) => {
  return Array.from(group.matchAll(/'([^']+)'/g), (match) => match[1]);
});

const committedExtras = fs
  .readdirSync(extrasDir)
  .filter((filename) => /^\d+\.[^.]+$/.test(filename))
  .sort((a, b) => Number(a.split('.')[0]) - Number(b.split('.')[0]));

assert(committedExtras.length > 0, 'Expected committed numbered extras media');

const committedByNumber = new Map(
  committedExtras.map((filename) => {
    const [number, extension] = filename.split('.');
    return [Number(number), extension];
  })
);

const maxCommittedNumber = Math.max(...committedByNumber.keys());
const discovered = [];

for (let fileNumber = 1; discovered.length < 50; fileNumber++) {
  let fileFound = false;

  for (const extGroup of extensionGroups) {
    for (const ext of extGroup) {
      const expectedExtension = committedByNumber.get(fileNumber);
      if (expectedExtension === ext) {
        discovered.push(`${fileNumber}.${ext}`);
        fileFound = true;
        break;
      }
    }
    if (fileFound) break;
  }

  if (!fileFound) {
    break;
  }

  if (fileNumber >= maxCommittedNumber) {
    break;
  }
}

assert.deepStrictEqual(
  discovered,
  committedExtras,
  'The extras scanner must discover every committed numbered media item in order'
);

console.log(`Discovered ITNFI extras media: ${discovered.join(', ')}`);
