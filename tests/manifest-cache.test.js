const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'script.js');
const scriptSource = fs.readFileSync(scriptPath, 'utf8');

function createSessionStorage(initialValues = {}) {
    const values = { ...initialValues };

    return {
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
        },
        setItem(key, value) {
            values[key] = String(value);
        },
        removeItem(key) {
            delete values[key];
        }
    };
}

function createElementStub(tagName = 'div') {
    return {
        tagName: tagName.toUpperCase(),
        dataset: {},
        style: {
            setProperty() {}
        },
        classList: {
            add() {},
            remove() {},
            toggle() {},
            contains() {
                return false;
            }
        },
        appendChild() {},
        insertBefore() {},
        remove() {},
        setAttribute() {},
        getAttribute() {
            return null;
        },
        addEventListener() {},
        querySelector() {
            return null;
        },
        querySelectorAll() {
            return [];
        },
        getBoundingClientRect() {
            return { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 };
        }
    };
}

function loadBrowserScript({ fetchImpl, sessionValues }) {
    const context = {
        console,
        fetch: fetchImpl,
        sessionStorage: createSessionStorage(sessionValues),
        setTimeout() {
            return 0;
        },
        clearTimeout() {},
        document: {
            readyState: 'loading',
            body: createElementStub('body'),
            querySelector() {
                return null;
            },
            querySelectorAll() {
                return [];
            },
            getElementById() {
                return null;
            },
            addEventListener() {},
            createElement: createElementStub
        },
        IntersectionObserver: class {
            observe() {}
            unobserve() {}
            disconnect() {}
        },
        Image: class {
            set src(_value) {}
        },
        Audio: class {
            set src(_value) {}
        }
    };

    context.window = context;

    vm.createContext(context);
    vm.runInContext(scriptSource, context, { filename: 'script.js' });
    return context;
}

function createManifestFetch(manifests) {
    const calls = [];
    const fetchImpl = async (url, init) => {
        calls.push({ url: String(url), init });
        const baseUrl = String(url).split('?')[0];
        const text = manifests[baseUrl];

        if (text === undefined) {
            return {
                ok: false,
                text: async () => ''
            };
        }

        return {
            ok: true,
            text: async () => text
        };
    };

    return { fetchImpl, calls };
}

async function testNotableWorkManifestWinsOverStaleSessionCache() {
    const { fetchImpl, calls } = createManifestFetch({
        'images/notable-work/folders.txt': '18\n17\n16\n'
    });
    const context = loadBrowserScript({
        fetchImpl,
        sessionValues: {
            'zh-notable-folders-v1': JSON.stringify([17, 16, 15])
        }
    });

    const folderIds = await context.detectNotableWorkFolders();

    assert.deepEqual(Array.from(folderIds), [18, 17, 16]);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /^images\/notable-work\/folders\.txt\?t=\d+$/);
    assert.equal(calls[0].init.cache, 'no-store');
    assert.deepEqual(
        JSON.parse(context.sessionStorage.getItem('zh-notable-folders-v1')),
        [18, 17, 16]
    );
}

async function testHomeBackgroundManifestWinsOverStaleSessionCache() {
    const { fetchImpl, calls } = createManifestFetch({
        'images/home/background-list.txt': 'images/notable-work/18/1.jpeg\nimages/notable-work/17/1.jpeg\n'
    });
    const context = loadBrowserScript({
        fetchImpl,
        sessionValues: {
            'zh-home-background-paths-v1': JSON.stringify(['images/notable-work/16/1.jpeg'])
        }
    });

    const backgrounds = await context.initializeHomeBackgroundCandidates();

    assert.deepEqual(Array.from(backgrounds), [
        'images/notable-work/18/1.jpeg',
        'images/notable-work/17/1.jpeg'
    ]);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /^images\/home\/background-list\.txt\?t=\d+$/);
    assert.equal(calls[0].init.cache, 'no-store');
    assert.deepEqual(
        JSON.parse(context.sessionStorage.getItem('zh-home-background-paths-v1')),
        [
            'images/notable-work/18/1.jpeg',
            'images/notable-work/17/1.jpeg'
        ]
    );
}

(async () => {
    await testNotableWorkManifestWinsOverStaleSessionCache();
    await testHomeBackgroundManifestWinsOverStaleSessionCache();
    console.log('manifest-cache tests passed');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
