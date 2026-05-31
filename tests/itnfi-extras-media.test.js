const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const pagePath = path.join(repoRoot, 'i-think-narcissus-fell-in.html');
const pageHtml = fs.readFileSync(pagePath, 'utf8');

const extensionGroupsMatch = pageHtml.match(/const extrasExtensionGroups = (\[[\s\S]*?\n\s*\]);/);
assert(extensionGroupsMatch, 'extrasExtensionGroups should be declared on the ITNFI page');

const extensionGroups = Function(`"use strict"; return (${extensionGroupsMatch[1]});`)();
assert(
    extensionGroups.flat().includes('MOV'),
    'extras media loader must probe uppercase .MOV files'
);

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a'].includes(ext)) return 'audio';
    return 'unknown';
}

function scanExtrasWithPageExtensions() {
    const extrasFolder = 'images/i-think-narcissus-fell-in/extras/';
    const extrasItems = [];
    let fileNumber = 1;
    let foundFiles = 0;
    const maxFiles = 50;

    while (foundFiles < maxFiles) {
        let fileFound = false;

        for (const extGroup of extensionGroups) {
            for (const ext of extGroup) {
                const filePath = `${extrasFolder}${fileNumber}.${ext}`;
                if (fs.existsSync(path.join(repoRoot, filePath))) {
                    extrasItems.push({
                        path: filePath,
                        type: getFileType(filePath),
                        number: fileNumber
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

    return extrasItems;
}

const extrasItems = scanExtrasWithPageExtensions();

assert.deepEqual(
    extrasItems.map((item) => item.number),
    Array.from({ length: 12 }, (_, index) => index + 1),
    'extras scanner should not stop at uppercase 7.MOV and hide later numbered media'
);

assert.deepEqual(
    extrasItems.find((item) => item.number === 7),
    {
        path: 'images/i-think-narcissus-fell-in/extras/7.MOV',
        type: 'video',
        number: 7
    }
);
