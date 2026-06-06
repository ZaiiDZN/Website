const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'script.js');
const scriptSource = fs.readFileSync(scriptPath, 'utf8');

function createClassList() {
    const classes = new Set();
    return {
        add: (...names) => names.forEach((name) => classes.add(name)),
        remove: (...names) => names.forEach((name) => classes.delete(name)),
        contains: (name) => classes.has(name),
        has: (name) => classes.has(name)
    };
}

function createElement(overrides = {}) {
    const element = {
        style: {},
        dataset: {},
        children: [],
        classList: createClassList(),
        textContent: '',
        innerHTML: '',
        setAttribute(name, value) {
            this.attributes[name] = String(value);
        },
        getAttribute(name) {
            return this.attributes[name] ?? null;
        },
        appendChild(child) {
            this.children.push(child);
            child.parentNode = this;
            return child;
        },
        replaceWith(replacement) {
            this.replacement = replacement;
        },
        remove() {
            this.removed = true;
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
        },
        attributes: {},
        ...overrides
    };

    return element;
}

function createSessionStorage(initial = {}) {
    const store = { ...initial };
    return {
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
        },
        setItem(key, value) {
            store[key] = String(value);
        },
        removeItem(key) {
            delete store[key];
        },
        dump() {
            return { ...store };
        }
    };
}

function loadScript({
    fetchImpl = async () => ({ ok: false, text: async () => '' }),
    documentOverrides = {},
    sessionInitial = {},
    ImageImpl = class {
        set src(_value) {
            setImmediate(() => this.onerror && this.onerror());
        }
    }
} = {}) {
    const document = {
        readyState: 'loading',
        body: createElement(),
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: () => createElement(),
        addEventListener() {},
        ...documentOverrides
    };

    const context = {
        console,
        document,
        window: {},
        sessionStorage: createSessionStorage(sessionInitial),
        fetch: fetchImpl,
        Image: ImageImpl,
        Audio: class {},
        IntersectionObserver: class {
            observe() {}
        },
        requestIdleCallback: () => {},
        setTimeout,
        setImmediate,
        Date,
        JSON,
        Array,
        Promise,
        Number,
        parseInt,
        isNaN,
        Math
    };

    context.window = context;
    vm.createContext(context);
    vm.runInContext(scriptSource, context, { filename: scriptPath });
    return context;
}

async function testNotableManifestBeatsStaleSessionCache() {
    const fetchCalls = [];
    const context = loadScript({
        sessionInitial: {
            'zh-notable-folders-v1': JSON.stringify([17, 16])
        },
        fetchImpl: async (url, options) => {
            fetchCalls.push({ url: String(url), options });
            return {
                ok: true,
                text: async () => '# newest first\n18\n17\n'
            };
        }
    });

    const folders = await context.detectNotableWorkFolders();

    assert.deepStrictEqual(folders, [18, 17]);
    assert.strictEqual(fetchCalls.length, 1);
    assert.match(fetchCalls[0].url, /^images\/notable-work\/folders\.txt\?v=\d+$/);
    assert.strictEqual(fetchCalls[0].options.cache, 'no-store');
    assert.deepStrictEqual(
        JSON.parse(context.sessionStorage.dump()['zh-notable-folders-v1']),
        [18, 17]
    );
}

async function testHomeManifestBeatsStaleSessionCache() {
    const context = loadScript({
        sessionInitial: {
            'zh-home-background-paths-v1': JSON.stringify(['images/notable-work/1/1.jpeg'])
        },
        fetchImpl: async () => ({
            ok: true,
            text: async () => 'images/notable-work/18/1.jpeg\nimages/notable-work/17/1.jpeg\n'
        })
    });

    const backgrounds = await context.initializeHomeBackgroundCandidates();

    assert.deepStrictEqual(backgrounds, [
        'images/notable-work/18/1.jpeg',
        'images/notable-work/17/1.jpeg'
    ]);
    assert.deepStrictEqual(
        JSON.parse(context.sessionStorage.dump()['zh-home-background-paths-v1']),
        ['images/notable-work/18/1.jpeg', 'images/notable-work/17/1.jpeg']
    );
}

async function testManifestFailureFallsBackToSessionCache() {
    const context = loadScript({
        sessionInitial: {
            'zh-notable-folders-v1': JSON.stringify([17, 16])
        },
        fetchImpl: async () => ({ ok: false, text: async () => '' })
    });

    const folders = await context.detectNotableWorkFolders();

    assert.deepStrictEqual(folders, [17, 16]);
}

async function testLatestModalOpenWinsRace() {
    const pieceModal = createElement();
    const modalMainImage = createElement();
    const modalTitleText = createElement();
    const modalDescription = createElement({ style: {} });
    const supplementContainer = createElement({ style: {} });
    const modalDetails = createElement();
    const modalImageColumn = createElement();
    const modalContent = createElement();
    const galleryItems = [1, 2].map((id) => createElement({
        getAttribute: (name) => (name === 'data-folder-id' ? String(id) : null)
    }));

    const byId = {
        'piece-modal': pieceModal,
        'modal-main-image': modalMainImage,
        'modal-title-text': modalTitleText,
        'modal-description': modalDescription,
        'modal-supplement-images': supplementContainer
    };

    const context = loadScript({
        documentOverrides: {
            getElementById: (id) => byId[id] || null,
            querySelectorAll: (selector) => {
                if (selector === '#notable-work-gallery .gallery-item') return galleryItems;
                return [];
            },
            querySelector: (selector) => {
                if (selector === '.modal-content') return modalContent;
                if (selector === '.modal-image-column') return modalImageColumn;
                if (selector === '.modal-details') return modalDetails;
                return null;
            }
        },
        fetchImpl: async (url) => {
            const folder = String(url).match(/notable-work\/(\d+)\//)[1];
            if (folder === '1') {
                await new Promise((resolve) => setTimeout(resolve, 25));
            }
            return {
                ok: true,
                text: async () => `title: ${folder === '1' ? 'First' : 'Second'}\ndescription: piece ${folder}`
            };
        }
    });

    await Promise.all([
        context.openPieceModal(1),
        context.openPieceModal(2)
    ]);

    assert.strictEqual(modalTitleText.textContent, 'Second');
    assert.strictEqual(modalDescription.innerHTML, '<i>piece 2</i>');
    assert(pieceModal.classList.contains('active'));
}

async function run() {
    await testNotableManifestBeatsStaleSessionCache();
    await testHomeManifestBeatsStaleSessionCache();
    await testManifestFailureFallsBackToSessionCache();
    await testLatestModalOpenWinsRace();
    console.log('script regressions passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
