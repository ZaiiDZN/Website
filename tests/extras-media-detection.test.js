const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'i-think-narcissus-fell-in.html'), 'utf8');

const extensionsMatch = html.match(/async function loadExtrasMedia\(\) \{[\s\S]*?const extensions = (\[[\s\S]*?\n\s*\]);/);
assert(extensionsMatch, 'Could not find extras media extension groups');

const extensionGroups = vm.runInNewContext(extensionsMatch[1]);

async function discoverExtrasMedia() {
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
                        number: fileNumber
                    });
                    fileFound = true;
                    foundFiles++;
                    break;
                }
            }
            if (fileFound) break;
        }

        if (!fileFound) {
            break;
        }

        fileNumber++;
    }

    return extrasItems;
}

(async () => {
    const extrasItems = await discoverExtrasMedia();
    assert.deepStrictEqual(
        extrasItems.map((item) => item.number),
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        'extras discovery should not stop at uppercase MOV media'
    );
    assert.strictEqual(extrasItems[6].path, 'images/i-think-narcissus-fell-in/extras/7.MOV');
})();
