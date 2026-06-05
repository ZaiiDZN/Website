const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const pagePath = path.join(repoRoot, 'i-think-narcissus-fell-in.html');
const extrasDir = path.join(repoRoot, 'images/i-think-narcissus-fell-in/extras');

const pageHtml = fs.readFileSync(pagePath, 'utf8');
const scannerBlockMatch = pageHtml.match(
    /while \(foundFiles < maxFiles\) \{[\s\S]*?const extensions = \[\s*([\s\S]*?)\s*\];\s*let fileFound = false;/
);

assert(scannerBlockMatch, 'Expected to find extras media extension groups in the page');

const extensionGroups = Array.from(scannerBlockMatch[1].matchAll(/\[([^\]]+)\]/g), (groupMatch) =>
    Array.from(groupMatch[1].matchAll(/'([^']+)'/g), (extensionMatch) => extensionMatch[1])
);

assert(
    extensionGroups.some((group) => group.includes('MOV')),
    'Extras scanner must include uppercase MOV files for case-sensitive hosting'
);

const discovered = [];
let fileNumber = 1;
let foundFiles = 0;
const maxFiles = 50;

while (foundFiles < maxFiles) {
    let fileFound = false;

    for (const extGroup of extensionGroups) {
        for (const ext of extGroup) {
            const relativePath = `${fileNumber}.${ext}`;
            if (fs.existsSync(path.join(extrasDir, relativePath))) {
                discovered.push(relativePath);
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

assert.deepStrictEqual(discovered, [
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
    '12.jpg'
]);

console.log('extras media discovery enumerates all tracked extras through 12');
