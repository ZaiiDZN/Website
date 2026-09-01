const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(
    path.join(__dirname, '..', 'i-think-narcissus-fell-in.html'),
    'utf8'
);

const handlerStart = html.indexOf('testAudio.oncanplay = () => {');
assert.notStrictEqual(handlerStart, -1, 'audio canplay handler should exist');

const handlerEnd = html.indexOf('testAudio.onerror', handlerStart);
assert.notStrictEqual(handlerEnd, -1, 'audio canplay handler should end before error handler');

const handler = html.slice(handlerStart, handlerEnd);
assert(
    handler.includes("audioWrapper.style.display = '';"),
    'late audio detection must restore a wrapper hidden by the no-audio timeout'
);

const restoreIndex = handler.indexOf("audioWrapper.style.display = '';");
const appendIndex = handler.indexOf('audioWrapper.appendChild(playButton);');
assert(
    restoreIndex !== -1 && appendIndex !== -1 && restoreIndex < appendIndex,
    'audio wrapper should be made visible before adding the custom play button'
);

console.log('ITNFI audio visibility regression test passed');
