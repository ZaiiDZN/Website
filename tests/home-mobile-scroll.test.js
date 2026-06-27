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

const mobileFixesIndex = styles.indexOf(marker);
assert.notStrictEqual(mobileFixesIndex, -1, 'Missing mobile fixes media block marker');

const mobileFixes = styles.slice(mobileFixesIndex);

const homePage = blockAfter('.home-page', mobileFixes);
assert.match(homePage, /overflow-x:\s*hidden;/);
assert.match(homePage, /overflow-y:\s*auto;/);
assert.match(homePage, /height:\s*auto;/);
assert.match(homePage, /min-height:\s*100vh;/);
assert.doesNotMatch(homePage, /overflow:\s*hidden;/);
assert.doesNotMatch(homePage, /height:\s*100vh;/);

const overlayContent = blockAfter('.overlay-content', mobileFixes);
assert.match(overlayContent, /position:\s*relative;/);
assert.match(overlayContent, /height:\s*auto;/);
assert.match(overlayContent, /min-height:\s*100vh;/);
assert.match(overlayContent, /overflow-y:\s*auto;/);
assert.doesNotMatch(overlayContent, /overflow:\s*hidden;/);
assert.doesNotMatch(overlayContent, /min-height:\s*0;/);

const infoSection = blockAfter('.info-section', mobileFixes);
assert.match(infoSection, /flex:\s*none;/);
assert.match(infoSection, /overflow:\s*visible;/);
assert.doesNotMatch(infoSection, /overflow-y:\s*auto;/);

console.log('home mobile scroll CSS regression test passed');
