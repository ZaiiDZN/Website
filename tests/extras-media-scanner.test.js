const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const pagePath = path.join(repoRoot, 'i-think-narcissus-fell-in.html');
const extrasDir = path.join(repoRoot, 'images', 'i-think-narcissus-fell-in', 'extras');

const pageHtml = fs.readFileSync(pagePath, 'utf8');
const loadExtrasStart = pageHtml.indexOf('async function loadExtrasMedia()');
assert.notEqual(loadExtrasStart, -1, 'loadExtrasMedia function should exist');

const loadExtrasSection = pageHtml.slice(
  loadExtrasStart,
  pageHtml.indexOf('// Render extras carousel', loadExtrasStart),
);

const extensionMatch = loadExtrasSection.match(/const extensions = \[\s*([\s\S]*?)\s*\];/);
assert.ok(extensionMatch, 'loadExtrasMedia should define extension groups');

const extensionGroups = Function(`"use strict"; return [${extensionMatch[1]}];`)();
const allExtensions = extensionGroups.flat();

assert.ok(
  allExtensions.includes('MOV'),
  'extras scanner must include uppercase MOV files on case-sensitive hosts',
);

function detectExtrasFromDisk() {
  const detected = [];
  let fileNumber = 1;
  let foundFiles = 0;
  const maxFiles = 50;

  while (foundFiles < maxFiles) {
    let fileFound = false;

    for (const extGroup of extensionGroups) {
      for (const ext of extGroup) {
        const filePath = path.join(extrasDir, `${fileNumber}.${ext}`);
        if (fs.existsSync(filePath)) {
          detected.push({
            number: fileNumber,
            filename: path.basename(filePath),
          });
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

  return detected;
}

const actualNumbers = fs.readdirSync(extrasDir)
  .map((filename) => filename.match(/^(\d+)\.[^.]+$/))
  .filter(Boolean)
  .map((match) => Number(match[1]));

const maxActualNumber = Math.max(...actualNumbers);
const expectedNumbers = Array.from({ length: maxActualNumber }, (_, index) => index + 1);
const detected = detectExtrasFromDisk();

assert.deepEqual(
  detected.map((item) => item.number),
  expectedNumbers,
  'extras scanner should detect the full contiguous numbered media set',
);
assert.equal(
  detected.find((item) => item.number === 7)?.filename,
  '7.MOV',
  'scanner should discover the checked-in uppercase 7.MOV file',
);

console.log(`Detected extras media 1-${maxActualNumber}: ${detected.map((item) => item.filename).join(', ')}`);
