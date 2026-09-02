'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'script.js');
const scriptSrc = fs.readFileSync(scriptPath, 'utf8');

function extractFunction(source, name) {
    const start = source.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `missing ${name}`);

    let brace = source.indexOf('{', start);
    let depth = 0;
    for (let i = brace; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        if (source[i] === '}') {
            depth -= 1;
            if (depth === 0) {
                return source.slice(start, i + 1);
            }
        }
    }

    throw new Error(`could not extract ${name}`);
}

function loadReturnPathHelpers(locationHref) {
    const location = new URL(locationHref);
    const context = {
        window: {
            location: {
                href: location.href,
                origin: location.origin,
                protocol: location.protocol,
                pathname: location.pathname,
            },
        },
        URL,
    };
    const src = [
        extractFunction(scriptSrc, 'getSafeReturnHref'),
        extractFunction(scriptSrc, 'isSafeReturnPath'),
        'this.getSafeReturnHref = getSafeReturnHref;',
        'this.isSafeReturnPath = isSafeReturnPath;',
    ].join('\n');
    vm.runInNewContext(src, context);
    return context;
}

const allowed = [
    'all-white-galleries.html',
    'i-think-narcissus-fell-in.html',
    'notable-work.html',
    'notable-work.html?piece=19&image=2',
    'index.html',
    '/index.html',
    '  all-white-galleries.html  ',
];

const blocked = [
    '//evil.example',
    '\\/\\/evil.example',
    '\\\\evil.example',
    '/\\evil.example',
    'https://evil.example',
    'https:evil.example',
    'http:evil.example',
    'javascript:alert(1)',
    '\uFEFFjavascript:alert(1)',
    'data:text/html,phish',
    '/\\/evil.example',
    '../contact.html',
    'images/home/showcase-flyer.png',
    'contact.html/../index.html',
];

for (const base of [
    'https://www.zhampden.com/contact.html',
    'http://127.0.0.1:8765/contact.html',
]) {
    const helpers = loadReturnPathHelpers(base);

    for (const pathValue of allowed) {
        const href = helpers.getSafeReturnHref(pathValue);
        assert.ok(href, `${base} should allow ${JSON.stringify(pathValue)}`);
        assert.ok(href.startsWith('/'), `${pathValue} should resolve to a root-relative path, got ${href}`);
        assert.ok(href.endsWith('.html') || href.includes('.html?') || href.includes('.html#'), href);
        const resolved = new URL(href, base);
        assert.strictEqual(resolved.origin, new URL(base).origin);
    }

    for (const pathValue of blocked) {
        assert.strictEqual(
            helpers.getSafeReturnHref(pathValue),
            null,
            `${base} should block ${JSON.stringify(pathValue)}`
        );
        assert.strictEqual(helpers.isSafeReturnPath(pathValue), false);
    }
}

const httpsHelpers = loadReturnPathHelpers('https://www.zhampden.com/contact.html');
assert.strictEqual(
    httpsHelpers.getSafeReturnHref('notable-work.html?piece=20&image=0'),
    '/notable-work.html?piece=20&image=0'
);
assert.strictEqual(
    httpsHelpers.getSafeReturnHref('all-white-galleries.html'),
    '/all-white-galleries.html'
);

console.log('contact-return-path.test.js passed');
