'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'script.js');
const source = fs.readFileSync(scriptPath, 'utf8');

const modalCloseDeclarations = source.match(/^\s*const\s+modalClose\s*=/gm) || [];
if (modalCloseDeclarations.length !== 1) {
    throw new Error(
        `Expected exactly one const modalClose declaration, found ${modalCloseDeclarations.length}`
    );
}

try {
    new vm.Script(source, { filename: 'script.js' });
} catch (err) {
    throw new Error(`script.js failed to parse: ${err.message}`);
}

console.log('script.js parses and declares modalClose once');
