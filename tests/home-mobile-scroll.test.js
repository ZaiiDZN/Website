const assert = require('assert');
const fs = require('fs');
const path = require('path');

const styles = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const marker = '/* Mobile-only fixes - prevents horizontal scroll and improves mobile experience */';

function blockAfter(selector, source) {
    const selectorIndex = source.indexOf(selector);
    assert.notStrictEqual(selectorIndex, -1, `Missing selector: ${selector}`);

    const openBrace = source.indexOf('{', selectorIndex);
    assert.notStrictEqual(openBrace, -1, `Missing opening brace for ${selector}`);

    let depth = 0;
    for (let i = openBrace; i < source.length; i += 1) {
        if (source[i] === '{') {
            depth += 1;
        } else if (source[i] === '}') {
            depth -= 1;
            if (depth === 0) {
                return source.slice(openBrace + 1, i);
            }
        }
    }

    throw new Error(`Missing closing brace for ${selector}`);
}

function declarationsFor(selector, source) {
    return Object.fromEntries(
        blockAfter(selector, source)
            .split(';')
            .map((declaration) => declaration.trim())
            .filter(Boolean)
            .map((declaration) => {
                const colon = declaration.indexOf(':');
                assert.notStrictEqual(colon, -1, `Invalid declaration in ${selector}: ${declaration}`);
                return [
                    declaration.slice(0, colon).trim(),
                    declaration.slice(colon + 1).trim(),
                ];
            })
    );
}

const mobileFixesIndex = styles.indexOf(marker);
assert.notStrictEqual(mobileFixesIndex, -1, 'Missing mobile fixes media block marker');

const mobileFixes = styles.slice(mobileFixesIndex);

const homePage = declarationsFor('.home-page', mobileFixes);
assert.strictEqual(homePage['overflow-x'], 'hidden');
assert.strictEqual(homePage['overflow-y'], 'auto');
assert.strictEqual(homePage.height, 'auto');
assert.strictEqual(homePage['min-height'], '100vh');
assert.notStrictEqual(homePage.overflow, 'hidden');

const overlayContent = declarationsFor('.overlay-content', mobileFixes);
assert.strictEqual(overlayContent.position, 'relative');
assert.strictEqual(overlayContent.height, 'auto');
assert.strictEqual(overlayContent['min-height'], '100vh');
assert.strictEqual(overlayContent['overflow-y'], 'auto');
assert.notStrictEqual(overlayContent.overflow, 'hidden');

const infoSection = declarationsFor('.info-section', mobileFixes);
assert.strictEqual(infoSection.flex, 'none');
assert.strictEqual(infoSection.overflow, 'visible');
assert.notStrictEqual(infoSection['overflow-y'], 'auto');

console.log('home mobile scroll CSS regression test passed');
