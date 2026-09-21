const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const archiveHtmlPath = path.join(__dirname, '..', 'archive-project.html');
const archiveHtml = fs.readFileSync(archiveHtmlPath, 'utf8');
const scriptPath = path.join(__dirname, '..', 'script.js');
const scriptSource = fs.readFileSync(scriptPath, 'utf8');

function extractArchiveHelpers() {
    const start = archiveHtml.indexOf('const ARCHIVE_IMAGE_EXTENSIONS');
    const end = archiveHtml.indexOf('clickableImages.forEach');
    assert.ok(start !== -1 && end !== -1 && end > start, 'Expected archive image path helpers');

    const helperSource = archiveHtml.slice(start, end);
    const context = {};
    vm.runInNewContext(
        `${helperSource}\nthis.getArchivePieceImageFallbackPath = getArchivePieceImageFallbackPath;\nthis.resolveArchivePieceImageSrc = resolveArchivePieceImageSrc;`,
        context
    );
    return context;
}

function testFallbackUsesFolderJpegLayout() {
    const { getArchivePieceImageFallbackPath, resolveArchivePieceImageSrc } = extractArchiveHelpers();

    assert.strictEqual(
        getArchivePieceImageFallbackPath('2', 0),
        'images/archive-project/2/1.jpeg'
    );
    assert.strictEqual(
        getArchivePieceImageFallbackPath('2', 1),
        'images/archive-project/2/1.jpg'
    );
    assert.strictEqual(
        resolveArchivePieceImageSrc('3', null),
        'images/archive-project/3/1.jpeg'
    );
    assert.strictEqual(
        resolveArchivePieceImageSrc('3', { getAttribute: () => null, src: '', currentSrc: '' }),
        'images/archive-project/3/1.jpeg'
    );
    assert.strictEqual(
        resolveArchivePieceImageSrc('4', {
            currentSrc: 'http://example/images/archive-project/4/1.jpeg',
            getAttribute: () => 'images/archive-project/4/1.jpeg',
            src: 'http://example/images/archive-project/4/1.jpeg'
        }),
        'http://example/images/archive-project/4/1.jpeg'
    );
}

function testLegacyBrokenFallbacksRemoved() {
    assert.doesNotMatch(
        archiveHtml,
        /images\/archive-project\/\$\{imageId\}\.jpg/,
        'image overlay must not fall back to images/archive-project/{id}.jpg'
    );
    assert.doesNotMatch(
        archiveHtml,
        /images\/archive-project\/\$\{imageId\}\/1\.jpg`/,
        'folder overlay must not fall back only to 1.jpg'
    );
    assert.match(
        archiveHtml,
        /images\/archive-project\/\$\{imageId\}\/1\.\$\{ext\}/,
        'fallback paths must use folder/1.{ext} layout'
    );
    assert.match(
        archiveHtml,
        /ARCHIVE_IMAGE_EXTENSIONS = \['jpeg', 'jpg', 'png'\]/,
        'jpeg must be tried first to match tracked assets'
    );
}

function testAssetsAndLoaderAgreeOnJpeg() {
    for (let id = 1; id <= 4; id++) {
        const jpegPath = path.join(__dirname, '..', 'images', 'archive-project', String(id), '1.jpeg');
        const jpgPath = path.join(__dirname, '..', 'images', 'archive-project', String(id), '1.jpg');
        assert.ok(fs.existsSync(jpegPath), `expected archive asset ${jpegPath}`);
        assert.ok(!fs.existsSync(jpgPath), `unexpected legacy jpg asset ${jpgPath}`);
    }

    assert.match(
        scriptSource,
        /images\/\$\{projectFolder\}\/\$\{imageId\}\/1\.jpeg/,
        'loadProjectImages should probe folder/1.jpeg first'
    );
}

testFallbackUsesFolderJpegLayout();
testLegacyBrokenFallbacksRemoved();
testAssetsAndLoaderAgreeOnJpeg();
console.log('archive-overlay-paths.test.js passed');
