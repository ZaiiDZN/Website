// Fade out overlay to reveal Notable Work page
const fadeOutLink = document.querySelector('.fade-out-link');
const homeOverlay = document.querySelector('.home-page-overlay');
const body = document.body;

// Show overlay on page load by default
if (homeOverlay) {
    // Always show overlay on initial page load
    body.classList.add('overlay-active');
    homeOverlay.classList.remove('fade-out');
    homeOverlay.style.pointerEvents = 'auto';
    sessionStorage.removeItem('overlay-hidden');
}

// Handle fade out when clicking Notable Work link
if (fadeOutLink && homeOverlay) {
    fadeOutLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Add fade-out class to overlay
        homeOverlay.classList.add('fade-out');
        
        // Store state and remove overflow hidden from body after fade
        setTimeout(() => {
            sessionStorage.setItem('overlay-hidden', 'true');
            body.classList.remove('overlay-active');
        }, 600); // Match transition duration
    });
}

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Piece Modal Functionality
const pieceModal = document.getElementById('piece-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalClose = document.getElementById('modal-close');

// ============================================================================
// NOTABLE WORK GALLERY SYSTEM (FULLY DYNAMIC)
// ============================================================================
// System: Automatically detects all folders in images/notable-work/
// Folders are chronological (1=oldest, newest at highest number)
// Visual: Newest at top-left, oldest at bottom-right
// No hardcoded limits - automatically adapts to any number of pieces

// Helper: Get folder number from gallery item index
// Note: This is now mainly for backward compatibility - folder IDs are stored directly on elements
function getFolderIdFromGalleryIndex(index, totalItems) {
    if (!totalItems) {
        const galleryItems = document.querySelectorAll('#notable-work-gallery .gallery-item');
        totalItems = galleryItems.length;
    }
    return totalItems - index;
}

// Helper: Get gallery index from folder number
// Note: This is now mainly for backward compatibility - folder IDs are stored directly on elements
function getGalleryIndexFromFolderId(folderId, totalItems) {
    if (!totalItems) {
        const galleryItems = document.querySelectorAll('#notable-work-gallery .gallery-item');
        totalItems = galleryItems.length;
    }
    return totalItems - folderId;
}

// Open modal when clicking gallery item
document.addEventListener('click', function(e) {
    const galleryItem = e.target.closest('.gallery-item');
    if (galleryItem && !galleryItem.closest('.home-page-overlay')) {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if it's a notable work image
        if (galleryItem.classList.contains('clickable-notable-image')) {
            // Use the folder ID stored when the image was loaded (most reliable)
            let folderId = galleryItem.getAttribute('data-folder-id');
            
            // Fallback to calculation if data-folder-id not set
            if (!folderId) {
                const galleryItems = document.querySelectorAll('#notable-work-gallery .gallery-item');
                const index = Array.from(galleryItems).indexOf(galleryItem);
                folderId = getFolderIdFromGalleryIndex(index, galleryItems.length);
            } else {
                folderId = parseInt(folderId);
            }
            
            // Check if folder ID exists in gallery (validation)
            const galleryItems = document.querySelectorAll('#notable-work-gallery .gallery-item');
            const existingFolderIds = Array.from(galleryItems).map(item => 
                parseInt(item.getAttribute('data-folder-id'))
            );
            if (existingFolderIds.includes(folderId) && pieceModal) {
                openPieceModal(folderId);
            }
        }
    }
});

// Close notable image overlay
const notableImageOverlay = document.getElementById('notable-image-overlay');
const notableImageOverlayBackdrop = document.getElementById('notable-image-overlay-backdrop');
const notableImageOverlayImage = document.getElementById('notable-image-overlay-image');

function closeNotableImageOverlay() {
    if (notableImageOverlay) {
        notableImageOverlay.classList.remove('active');
        document.body.classList.remove('image-overlay-active');
        document.body.style.overflow = '';
    }
}

if (notableImageOverlayBackdrop) {
    notableImageOverlayBackdrop.addEventListener('click', closeNotableImageOverlay);
}

// Close when clicking on the overlay content (but not the image itself)
if (notableImageOverlayImage) {
    notableImageOverlayImage.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && notableImageOverlay && notableImageOverlay.classList.contains('active')) {
        closeNotableImageOverlay();
    }
});

// Observe gallery items for fade-in animation (only if not already visible)
document.querySelectorAll('.gallery-item').forEach(item => {
    if (item.style.opacity === '') {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(item);
    }
});

// Close modal
function closePieceModal() {
    if (pieceModal) {
        pieceModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closePieceModal);
}

// Close when clicking on modal content (but not the content itself)
const modalContent = document.querySelector('.modal-content');
if (modalContent) {
    modalContent.addEventListener('click', function(e) {
        // If clicking directly on the modal content container (not children), close
        if (e.target === modalContent) {
            closePieceModal();
        }
    });
    
    // Prevent closing when clicking inside modal columns
    const modalColumns = modalContent.querySelector('.modal-columns');
    const modalSupplement = modalContent.querySelector('.modal-supplement-gallery');
    if (modalColumns) {
        modalColumns.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    if (modalSupplement) {
        modalSupplement.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

const modalInquireLink = document.getElementById('modal-inquire-link');
if (modalInquireLink) {
    modalInquireLink.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Close modal on Escape key; arrow keys navigate between pieces
document.addEventListener('keydown', function(e) {
    if (!pieceModal || !pieceModal.classList.contains('active')) {
        return;
    }

    if (e.key === 'Escape') {
        closePieceModal();
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateModalPiece(-1);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateModalPiece(1);
    }
});

function formatPieceSize(size) {
    if (!size) return '';
    return size.replace(/(\d+(?:\.\d+)?)(?!\s*")/g, '$1"');
}

function formatNotableWorkSize(size) {
    if (!size) return '';
    const cleaned = size.trim().replace(/\s+in\s*$/i, '').replace(/\s+in\b/gi, ' ').trim();
    return formatPieceSize(cleaned);
}

function formatNotableWorkDescription(text) {
    if (!text) return '';

    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escaped
        .replace(/\*([^*\n]+)\*/g, '<i>$1</i>')
        .replace(/\n/g, '<br>');
}

function getNotableWorkModalLayout(extraCount) {
    const thumbCount = extraCount;

    if (thumbCount >= 3) {
        return {
            imageMaxWidth: '92%',
            imageMaxHeight: '47vh',
            supplementGridCols: `repeat(${thumbCount}, minmax(0, 1fr))`,
            supplementImageHeight: 'clamp(118px, 20vh, 156px)'
        };
    }

    if (thumbCount === 2) {
        return {
            imageMaxWidth: '92%',
            imageMaxHeight: '49vh',
            supplementGridCols: 'repeat(2, minmax(0, 1fr))',
            supplementImageHeight: 'clamp(128px, 22vh, 168px)'
        };
    }

    if (thumbCount === 1) {
        return {
            imageMaxWidth: '94%',
            imageMaxHeight: '51vh',
            supplementGridCols: 'repeat(1, minmax(0, 1fr))',
            supplementImageHeight: 'clamp(136px, 24vh, 180px)'
        };
    }

    return {
        imageMaxWidth: '94%',
        imageMaxHeight: '64vh',
        supplementGridCols: 'repeat(2, minmax(0, 1fr))',
        supplementImageHeight: '0px'
    };
}

function getNotableWorkFolderOrder() {
    const galleryItems = document.querySelectorAll('#notable-work-gallery .gallery-item');
    return Array.from(galleryItems)
        .map((item) => parseInt(item.getAttribute('data-folder-id'), 10))
        .filter((folderId) => !Number.isNaN(folderId));
}

function buildInquireContactUrl(subject, returnTo) {
    const params = new URLSearchParams();
    params.set('subject', subject);
    if (returnTo) {
        params.set('return', returnTo);
    }
    return `contact.html?${params.toString()}`;
}

function getSafeReturnHref(path) {
    if (!path || typeof path !== 'string') {
        return null;
    }

    const trimmed = path.trim();
    // Reject scheme tricks (`https:evil.example`, `javascript:`, `data:`) and
    // backslash host bypasses that the HTML URL parser treats as off-site.
    if (!trimmed || /[\\:]/.test(trimmed) || trimmed.includes('..')) {
        return null;
    }

    try {
        const resolved = new URL(trimmed, window.location.href);
        const pageName = resolved.pathname.split('/').pop();
        const isSameOriginPage = resolved.origin === window.location.origin
            && (resolved.protocol === 'http:' || resolved.protocol === 'https:')
            && resolved.pathname === `/${pageName}`
            && /^[A-Za-z0-9._-]+\.html$/.test(pageName)
            && !resolved.username
            && !resolved.password;

        if (!isSameOriginPage) {
            return null;
        }

        return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    } catch {
        return null;
    }
}

function isSafeReturnPath(path) {
    return getSafeReturnHref(path) !== null;
}

function updateModalInquireLink() {
    const inquireLink = document.getElementById('modal-inquire-link');
    if (!inquireLink || !pieceModal) return;

    const pieceTitle = (
        pieceModal.getAttribute('data-piece-title')
        || document.getElementById('modal-title-text')?.textContent
        || ''
    ).trim() || 'Notable Work';
    const folderId = pieceModal.getAttribute('data-current-folder-id');
    const imageIndex = pieceModal.getAttribute('data-current-index') || '0';
    let returnTo = 'notable-work.html';

    if (folderId) {
        returnTo = `notable-work.html?piece=${encodeURIComponent(folderId)}&image=${encodeURIComponent(imageIndex)}`;
    }

    inquireLink.href = buildInquireContactUrl(`Inquiry - ${pieceTitle}`, returnTo);
}

function initContactInquireBack() {
    const backLink = document.getElementById('contact-back-link');
    if (!backLink) return;

    const returnTo = new URLSearchParams(window.location.search).get('return');
    const safeHref = getSafeReturnHref(returnTo);
    if (!safeHref) {
        backLink.hidden = true;
        return;
    }

    backLink.href = safeHref;
    backLink.hidden = false;
}

const SHOWCASE_FLYER_SRC = 'images/home/showcase-flyer.png';

function ensureShowcaseOverlay() {
    let overlay = document.getElementById('showcase-overlay');
    if (overlay) {
        return overlay;
    }

    overlay = document.createElement('div');
    overlay.id = 'showcase-overlay';
    overlay.className = 'showcase-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
        <div class="showcase-overlay-backdrop" id="showcase-overlay-backdrop"></div>
        <div class="showcase-overlay-content">
            <img
                src="${SHOWCASE_FLYER_SRC}"
                alt="All White Galleries showcase at Silks Building, Friday August 28 at 8:30 PM, 37-24 24th St Astoria NY"
                class="showcase-overlay-image"
            >
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function openShowcaseOverlay() {
    const overlay = ensureShowcaseOverlay();
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('showcase-open');
}

function closeShowcaseOverlay() {
    const overlay = document.getElementById('showcase-overlay');
    if (!overlay) {
        return;
    }

    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('showcase-open');
}

function initShowcaseOverlay() {
    if (initShowcaseOverlay.initialized) {
        return;
    }
    initShowcaseOverlay.initialized = true;

    ensureShowcaseOverlay();

    document.addEventListener('click', (event) => {
        if (event.target.closest('.showcase-link')) {
            event.preventDefault();
            openShowcaseOverlay();
        }
    });

    document.addEventListener('click', (event) => {
        if (event.target.id === 'showcase-overlay-backdrop') {
            closeShowcaseOverlay();
        }
    });

    document.addEventListener('keydown', (event) => {
        const overlay = document.getElementById('showcase-overlay');
        if (event.key === 'Escape' && overlay?.classList.contains('active')) {
            closeShowcaseOverlay();
        }
    });
}

async function restoreNotableWorkModalFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const pieceParam = params.get('piece');
    if (!pieceParam || !document.querySelector('#notable-work-gallery') || !pieceModal) {
        return;
    }

    const folderId = parseInt(pieceParam, 10);
    if (Number.isNaN(folderId)) {
        return;
    }

    const imageIndex = parseInt(params.get('image') || '0', 10);

    await openPieceModal(folderId);

    if (!Number.isNaN(imageIndex) && imageIndex > 0) {
        const allImagesJson = pieceModal.getAttribute('data-all-images');
        if (allImagesJson) {
            const allImages = JSON.parse(allImagesJson);
            if (imageIndex < allImages.length) {
                renderModalImageCarousel(allImages, imageIndex);
            }
        }
    }

    if (window.history.replaceState) {
        window.history.replaceState(null, '', 'notable-work.html');
    }
}

function navigateModalPiece(direction) {
    const folderOrder = getNotableWorkFolderOrder();
    const currentFolderId = parseInt(pieceModal.getAttribute('data-current-folder-id'), 10);
    const currentIndex = folderOrder.indexOf(currentFolderId);

    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= folderOrder.length) return;

    openPieceModal(folderOrder[nextIndex]);
}

// Load piece text data from file
async function loadPieceData(folderId) {
    // Add a cache-busting query param so recent edits to piece-data.txt
    // are always picked up (especially in local dev / publishing).
    const dataPath = `images/notable-work/${folderId}/piece-data.txt?v=${Date.now()}`;
    const defaultData = {
        title: '',
        size: '',
        medium: '',
        year: '',
        description: ''
    };
    
    try {
        const response = await fetch(dataPath);
        if (!response.ok) return defaultData;
        
        const text = await response.text();
        const lines = text.split('\n');
        
        const data = { ...defaultData };
        let inDescription = false;
        let descriptionLines = [];
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('title:')) {
                data.title = trimmed.substring(6).trim();
                inDescription = false;
            } else if (trimmed.startsWith('size:')) {
                data.size = trimmed.substring(5).trim();
                inDescription = false;
            } else if (trimmed.startsWith('medium:')) {
                data.medium = trimmed.substring(7).trim();
                inDescription = false;
            } else if (trimmed.startsWith('year:')) {
                data.year = trimmed.substring(5).trim();
                inDescription = false;
            } else if (trimmed.startsWith('description:')) {
                descriptionLines = [trimmed.substring(12).trim()];
                inDescription = true;
            } else if (inDescription && trimmed) {
                descriptionLines.push(trimmed);
            } else if (inDescription && !trimmed && descriptionLines.length > 0) {
                descriptionLines.push('');
            }
        });
        
        if (descriptionLines.length > 0) {
            data.description = descriptionLines.join('\n');
        }
        
        return data;
    } catch (error) {
        console.error('Error loading piece data for folder', folderId, ':', error);
        return defaultData;
    }
}

const MODAL_CAROUSEL_FADE_MS = 500;
let modalCarouselAnimating = false;

function getCarouselThumbImages(allImages, safeIndex) {
    const thumbImages = [];
    for (let offset = 1; offset < allImages.length; offset += 1) {
        thumbImages.push(allImages[(safeIndex + offset) % allImages.length]);
    }
    return thumbImages;
}

function createCarouselMainImg(imagePath, maxWidth, maxHeight) {
    const img = document.createElement('img');
    img.src = imagePath;
    img.alt = 'Piece image';
    img.className = 'modal-carousel-img';
    img.style.setProperty('--carousel-max-width', maxWidth);
    img.style.setProperty('--carousel-max-height', maxHeight);
    img.draggable = false;
    return img;
}

function buildSupplementGalleryLayer(layer, thumbImages, safeIndex, totalImages, allImages, supplementGridCols, supplementImageHeight) {
    layer.className = 'modal-supplement-gallery modal-supplement-layer';
    layer.style.gridTemplateColumns = supplementGridCols;
    layer.style.setProperty('--thumb-height', supplementImageHeight);

    thumbImages.forEach((thumb, thumbIndex) => {
        const targetIndex = (safeIndex + thumbIndex + 1) % totalImages;
        const imgDiv = document.createElement('div');
        imgDiv.className = 'modal-supplement-image';
        imgDiv.style.cursor = 'pointer';

        const imgElement = document.createElement('img');
        imgElement.src = thumb.path;
        imgElement.alt = `Additional image ${thumbIndex + 1}`;
        imgElement.draggable = false;

        imgDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            if (modalCarouselAnimating) return;
            renderModalImageCarousel(allImages, targetIndex, { animate: true });
        });

        imgDiv.appendChild(imgElement);
        layer.appendChild(imgDiv);
    });
}

function crossfadeSupplementGallery(supplementContainer, buildLayer) {
    const newLayer = document.createElement('div');
    buildLayer(newLayer);

    if (!supplementContainer.children.length) {
        newLayer.classList.add('is-active');
        supplementContainer.appendChild(newLayer);
        supplementContainer.style.display = 'grid';
        return;
    }

    const outgoingLayer = supplementContainer.querySelector('.modal-supplement-layer.is-active');
    if (!outgoingLayer) {
        supplementContainer.innerHTML = '';
        newLayer.classList.add('is-active');
        supplementContainer.appendChild(newLayer);
        supplementContainer.style.display = 'grid';
        return;
    }

    outgoingLayer.classList.remove('is-active');
    outgoingLayer.classList.add('is-leaving');
    newLayer.classList.add('is-entering');
    supplementContainer.appendChild(newLayer);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            newLayer.classList.remove('is-entering');
            newLayer.classList.add('is-active');
        });
    });

    window.setTimeout(() => {
        outgoingLayer.remove();
    }, MODAL_CAROUSEL_FADE_MS);
}

function updateMainCarouselImage(modalMainImage, incomingImg, totalImages) {
    let stage = modalMainImage.querySelector('.modal-carousel-stage');

    if (!stage) {
        modalMainImage.innerHTML = '';
        stage = document.createElement('div');
        stage.className = 'modal-carousel-stage';
        modalMainImage.appendChild(stage);
        attachModalImageArrows(modalMainImage, totalImages);
    } else {
        stage.querySelectorAll('.modal-carousel-img').forEach((img) => img.remove());
    }

    incomingImg.classList.add('is-active');
    stage.appendChild(incomingImg);
}

// Render main image + rotating thumbnail strip for notable work modal
function renderModalImageCarousel(allImages, currentIndex, options = {}) {
    const { animate = false } = options;
    const modalMainImage = document.getElementById('modal-main-image');
    const supplementContainer = document.getElementById('modal-supplement-images');
    if (!modalMainImage || !allImages?.length || !pieceModal) {
        return;
    }

    const totalImages = allImages.length;
    const safeIndex = ((currentIndex % totalImages) + totalImages) % totalImages;
    const maxWidth = pieceModal.getAttribute('data-image-max-width') || '92%';
    const maxHeight = pieceModal.getAttribute('data-image-max-height') || '54vh';
    const supplementGridCols = pieceModal.getAttribute('data-supplement-grid-cols') || 'repeat(2, minmax(96px, 1fr))';
    const supplementImageHeight = pieceModal.getAttribute('data-supplement-image-height') || '104px';
    const thumbImages = getCarouselThumbImages(allImages, safeIndex);
    const incomingImg = createCarouselMainImg(allImages[safeIndex].path, maxWidth, maxHeight);
    const shouldAnimateThumbs = animate
        && thumbImages.length > 0
        && supplementContainer?.querySelector('.modal-supplement-layer.is-active');

    if (shouldAnimateThumbs && modalCarouselAnimating) {
        return;
    }

    if (shouldAnimateThumbs) {
        modalCarouselAnimating = true;
    }

    updateMainCarouselImage(modalMainImage, incomingImg, totalImages);

    pieceModal.setAttribute('data-all-images-count', totalImages.toString());

    if (supplementContainer) {
        if (thumbImages.length > 0) {
            const buildLayer = (layer) => {
                buildSupplementGalleryLayer(
                    layer,
                    thumbImages,
                    safeIndex,
                    totalImages,
                    allImages,
                    supplementGridCols,
                    supplementImageHeight
                );
            };

            if (shouldAnimateThumbs) {
                crossfadeSupplementGallery(supplementContainer, buildLayer);
            } else {
                supplementContainer.innerHTML = '';
                supplementContainer.classList.add('modal-supplement-stack');
                const layer = document.createElement('div');
                buildLayer(layer);
                layer.classList.add('is-active');
                supplementContainer.appendChild(layer);
                supplementContainer.style.display = 'grid';
            }
        } else {
            supplementContainer.innerHTML = '';
            supplementContainer.style.display = 'none';
        }
    }

    pieceModal.setAttribute('data-current-index', safeIndex.toString());
    updateModalArrows(safeIndex, totalImages);
    updateModalInquireLink();

    if (shouldAnimateThumbs) {
        window.setTimeout(() => {
            modalCarouselAnimating = false;
        }, MODAL_CAROUSEL_FADE_MS);
    }
}

function attachModalImageArrows(modalMainImage, totalImages) {
    if (!modalMainImage || totalImages <= 1) return;

    modalMainImage.querySelectorAll('.modal-nav-arrow').forEach((arrow) => arrow.remove());

    const leftArrow = document.createElement('button');
    leftArrow.className = 'modal-nav-arrow modal-nav-arrow-left';
    leftArrow.type = 'button';
    leftArrow.innerHTML = '>';
    leftArrow.setAttribute('aria-label', 'Previous image');
    leftArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        if (modalCarouselAnimating) return;
        navigateModalImage(-1);
    });

    const rightArrow = document.createElement('button');
    rightArrow.className = 'modal-nav-arrow modal-nav-arrow-right';
    rightArrow.type = 'button';
    rightArrow.innerHTML = '>';
    rightArrow.setAttribute('aria-label', 'Next image');
    rightArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        if (modalCarouselAnimating) return;
        navigateModalImage(1);
    });

    modalMainImage.appendChild(leftArrow);
    modalMainImage.appendChild(rightArrow);
}

// Navigate rotating image carousel in modal (infinite wrap)
function navigateModalImage(direction) {
    const allImagesJson = pieceModal.getAttribute('data-all-images');
    if (!allImagesJson) return;

    const allImages = JSON.parse(allImagesJson);
    const totalImages = allImages.length;
    if (totalImages <= 1) return;

    const currentIndex = parseInt(pieceModal.getAttribute('data-current-index') || '0', 10);
    const newIndex = (currentIndex + direction + totalImages) % totalImages;
    if (newIndex === currentIndex) return;
    renderModalImageCarousel(allImages, newIndex, { animate: true });
}

// Arrows stay visible for rotating carousel
function updateModalArrows(currentIndex, totalImages) {
    const modalMainImage = document.getElementById('modal-main-image');
    if (!modalMainImage) return;

    const leftArrow = modalMainImage.querySelector('.modal-nav-arrow-left');
    const rightArrow = modalMainImage.querySelector('.modal-nav-arrow-right');

    if (leftArrow) {
        leftArrow.style.display = totalImages > 1 ? 'flex' : 'none';
    }
    if (rightArrow) {
        rightArrow.style.display = totalImages > 1 ? 'flex' : 'none';
    }
}

// Open piece modal with piece data
async function openPieceModal(folderId) {
    if (!pieceModal) return;
    
    // Ensure folderId is valid - check if it exists in the gallery
    folderId = parseInt(folderId);
    if (isNaN(folderId) || folderId < 1) {
        console.error('Invalid folderId:', folderId);
        return;
    }
    
    // Verify folder ID exists in gallery
    const galleryItems = document.querySelectorAll('#notable-work-gallery .gallery-item');
    const existingFolderIds = Array.from(galleryItems).map(item => 
        parseInt(item.getAttribute('data-folder-id'))
    );
    if (!existingFolderIds.includes(folderId)) {
        console.error('Folder ID not found in gallery:', folderId);
        return;
    }
    
    // Load piece data (title, size, medium, year, description) from text file
    const pieceData = await loadPieceData(folderId);
    pieceModal.setAttribute('data-current-folder-id', folderId.toString());
    pieceModal.setAttribute('data-piece-title', pieceData.title || '');
    
    // Load all images (main + extras) and check which exist
    const allImages = [];
    const basePath = `images/notable-work/${folderId}`;
    
    // Clear any previous images to avoid cross-contamination
    allImages.length = 0;
    
    // Check if main image exists (try .jpg, .jpeg, .png)
    const checkMainImage = new Promise((resolve) => {
        const extensions = ['jpg', 'jpeg', 'png'];
        let tried = 0;
        
        const tryNext = () => {
            if (tried >= extensions.length) {
                resolve();
                return;
            }
            
            const ext = extensions[tried];
            const mainImagePath = `${basePath}/1.${ext}`;
            const testImg = new Image();
            testImg.onload = () => {
                allImages.push({ path: mainImagePath, isMain: true });
                resolve();
            };
            testImg.onerror = () => {
                tried++;
                tryNext();
            };
            testImg.src = mainImagePath;
        };
        
        tryNext();
    });
    
    // Check for extra images (2.jpg, 2.jpeg, 3.jpg, etc.)
    const checkExtraImages = [];
    for (let i = 2; i <= 10; i++) {
        checkExtraImages.push(
            new Promise((resolve) => {
                const extensions = ['jpg', 'jpeg', 'png'];
                let tried = 0;
                
                const tryNext = () => {
                    if (tried >= extensions.length) {
                        resolve();
                        return;
                    }
                    
                    const ext = extensions[tried];
                    const imgPath = `${basePath}/${i}.${ext}`;
                    const testImg = new Image();
                    testImg.onload = () => {
                        allImages.push({ path: imgPath, isMain: false });
                        resolve();
                    };
                    testImg.onerror = () => {
                        tried++;
                        tryNext();
                    };
                    testImg.src = imgPath;
                };
                
                tryNext();
            })
        );
    }
    
    // Wait for all images to be checked
    await Promise.all([checkMainImage, ...checkExtraImages]);
    
    // Separate main and extras - ensure main (1.jpg) is NOT in extras
    const mainImage = allImages.find(img => img.isMain);
    // Filter out main image from extras (in case it was added twice)
    const extraImages = allImages.filter(img => !img.isMain && !img.path.includes('/1.'));
    
    // Combine all images in order: main first, then extras
    const allImagesOrdered = [];
    if (mainImage) {
        allImagesOrdered.push(mainImage);
    }
    allImagesOrdered.push(...extraImages);
    
    // Store all images on the modal for navigation
    pieceModal.setAttribute('data-all-images', JSON.stringify(allImagesOrdered));
    pieceModal.setAttribute('data-current-index', '0');
    modalCarouselAnimating = false;
    
    // Calculate image sizes and modal size based on extra count
    const extraCount = extraImages.length;
    const layout = getNotableWorkModalLayout(extraCount);
    const { imageMaxWidth, imageMaxHeight, supplementGridCols, supplementImageHeight } = layout;

    pieceModal.setAttribute('data-image-max-width', imageMaxWidth);
    pieceModal.setAttribute('data-image-max-height', imageMaxHeight);
    pieceModal.setAttribute('data-supplement-grid-cols', supplementGridCols);
    pieceModal.setAttribute('data-supplement-image-height', supplementImageHeight);
    pieceModal.classList.toggle('modal-has-extras', extraCount > 0);
    pieceModal.classList.toggle('modal-has-carousel', allImagesOrdered.length > 1);
    
    // Update modal content
    const modalContent = document.querySelector('.modal-content');
    const modalTitleText = document.getElementById('modal-title-text');
    const modalDescription = document.getElementById('modal-description');
    const supplementContainer = document.getElementById('modal-supplement-images');
    
    if (allImagesOrdered.length > 0) {
        renderModalImageCarousel(allImagesOrdered, 0);
    } else {
        const modalMainImage = document.getElementById('modal-main-image');
        if (modalMainImage) {
            modalMainImage.innerHTML = `<div class="modal-image-placeholder"><span>Main Image</span></div>`;
        }
        if (supplementContainer) {
            supplementContainer.innerHTML = '';
            supplementContainer.style.display = 'none';
        }
    }
    
    // Update text fields (hide if empty)
    if (modalTitleText) {
        // If no title is provided in piece-data.txt, leave this blank
        modalTitleText.textContent = pieceData.title || '';
    }

    updateModalInquireLink();
    
    // Handle size, medium, year - hide if empty, show if present
    const modalDetails = document.querySelector('.modal-details');
    if (modalDetails) {
        // Clear existing content
        modalDetails.innerHTML = '';
        
        if (pieceData.size && pieceData.size.trim() !== '') {
            const sizeP = document.createElement('p');
            sizeP.id = 'modal-size';
            sizeP.textContent = formatNotableWorkSize(pieceData.size.trim());
            modalDetails.appendChild(sizeP);
        }
        
        if (pieceData.medium) {
            const mediumP = document.createElement('p');
            mediumP.id = 'modal-medium';
            mediumP.textContent = pieceData.medium;
            modalDetails.appendChild(mediumP);
        }
        
        if (pieceData.year) {
            const yearP = document.createElement('p');
            yearP.id = 'modal-year';
            yearP.textContent = pieceData.year;
            modalDetails.appendChild(yearP);
        }
    }
    
    if (modalDescription) {
        if (pieceData.description) {
            modalDescription.innerHTML = formatNotableWorkDescription(pieceData.description);
            modalDescription.style.display = 'block';
        } else {
            modalDescription.style.display = 'none';
        }
    }

    if (supplementContainer && allImagesOrdered.length > 1) {
        supplementContainer.style.marginTop = '0.75rem';
        supplementContainer.style.gap = extraCount >= 4 ? '0.55rem' : '0.65rem';
    }
    
    if (modalContent) {
        modalContent.style.maxHeight = '96vh';
        modalContent.style.minHeight = 'min(84vh, 760px)';
        modalContent.style.overflow = 'hidden';
    }
    
    // Show modal
    pieceModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Home button - show overlay again (for other pages that might need it)
const showHomeOverlayBtn = document.getElementById('show-home-overlay');

function showHomeOverlay() {
    const overlay = document.querySelector('.home-page-overlay');
    if (overlay) {
        // Remove fade-out class and show overlay
        overlay.classList.remove('fade-out');
        overlay.style.pointerEvents = 'auto';
        overlay.style.opacity = '1';
        overlay.style.display = 'block';
        body.classList.add('overlay-active');
        body.style.overflow = 'hidden';
        sessionStorage.removeItem('overlay-hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

if (showHomeOverlayBtn) {
    showHomeOverlayBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showHomeOverlay();
    });
}

// Image loading utilities
const imageExtensions = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
const IMAGE_FETCH_POOL_SIZE = 8;
const HOME_BACKGROUND_CACHE_KEY = 'zh-home-background-paths-v1';
const NOTABLE_FOLDERS_CACHE_KEY = 'zh-notable-folders-v2';

let homeBackgroundCandidates = null;

async function fetchTextManifest(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        return (await response.text())
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#'));
    } catch {
        return null;
    }
}

function readSessionCache(key) {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeSessionCache(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore quota errors
    }
}

async function runPool(items, poolSize, worker) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function runWorker() {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex++;
            results[currentIndex] = await worker(items[currentIndex], currentIndex);
        }
    }

    const workers = Array.from(
        { length: Math.min(poolSize, items.length) },
        () => runWorker()
    );
    await Promise.all(workers);
    return results;
}

async function imageExists(path) {
    try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

function buildHomeBackgroundPatterns() {
    const patterns = [];
    const addRange = (patternFn, max) => {
        for (let i = 1; i <= max; i++) {
            patterns.push(patternFn(i));
        }
    };

    addRange((i) => `images/notable-work/${i}/1.jpeg`, 25);
    addRange((i) => `images/archive-project/${i}/1.jpeg`, 10);
    addRange((i) => `images/i-think-narcissus-fell-in/${i}/1.jpeg`, 6);
    addRange((i) => `images/home/${i}.jpeg`, 20);

    return Array.from(new Set(patterns));
}

async function probeHomeBackgroundPatterns(patterns) {
    const found = await runPool(patterns, IMAGE_FETCH_POOL_SIZE, async (path) => {
        if (await imageExists(path)) return path;
        const basePath = path.replace(/\.(jpe?g|png|webp|gif)$/i, '');
        for (const ext of imageExtensions) {
            const candidate = `${basePath}.${ext}`;
            if (candidate !== path && (await imageExists(candidate))) {
                return candidate;
            }
        }
        return null;
    });

    return found.filter(Boolean);
}

async function initializeHomeBackgroundCandidates() {
    if (homeBackgroundCandidates !== null) {
        return homeBackgroundCandidates;
    }

    const cached = readSessionCache(HOME_BACKGROUND_CACHE_KEY);
    if (cached && cached.length) {
        homeBackgroundCandidates = cached;
        return homeBackgroundCandidates;
    }

    const manifest = await fetchTextManifest('images/home/background-list.txt');
    if (manifest && manifest.length) {
        homeBackgroundCandidates = manifest;
        writeSessionCache(HOME_BACKGROUND_CACHE_KEY, manifest);
        return homeBackgroundCandidates;
    }

    const patterns = buildHomeBackgroundPatterns();
    homeBackgroundCandidates = await probeHomeBackgroundPatterns(patterns);
    if (homeBackgroundCandidates.length) {
        writeSessionCache(HOME_BACKGROUND_CACHE_KEY, homeBackgroundCandidates);
    }
    return homeBackgroundCandidates;
}

// Try to load an image from a path, with fallback extensions
function tryLoadImage(imagePath, onSuccess, onError) {
    const testImg = new Image();
    testImg.onload = () => onSuccess(imagePath);
    testImg.onerror = () => {
        // Try different extensions
        const basePath = imagePath.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
        let triedExtensions = [imagePath.split('.').pop().toLowerCase()];
        let currentIndex = 0;
        
        const tryNextExtension = () => {
            if (currentIndex >= imageExtensions.length) {
                onError();
                return;
            }
            
            const ext = imageExtensions[currentIndex];
            if (!triedExtensions.includes(ext)) {
                triedExtensions.push(ext);
                const newPath = `${basePath}.${ext}`;
                const newImg = new Image();
                newImg.onload = () => onSuccess(newPath);
                newImg.onerror = () => {
                    currentIndex++;
                    tryNextExtension();
                };
                newImg.src = newPath;
            } else {
                currentIndex++;
                tryNextExtension();
            }
        };
        
        tryNextExtension();
    };
    testImg.src = imagePath;
}

const HOME_BACKGROUND_IMAGE_COUNT = 10;
const HOME_BACKGROUND_POOL_EXTRA = 5;
const HOME_BACKGROUND_COLLECTION_COUNT = 2;
const HOME_BACKGROUND_PIECES_PER_COLLECTION = 5;
const HOME_BACKGROUND_NOTABLE_COUNT = 5;
const HOME_GALLERY_MAX_OVERLAP = 0.05;
const HOME_GALLERY_MAX_PLACEMENT_ATTEMPTS = 250;

const HOME_COLLECTION_IMAGE_SOURCES = [
    {
        match: (name) => name.startsWith('All White Galleries'),
        getPaths: async (limit) => {
            const folders = await fetchTextManifest(`images/all-white-galleries/folders.txt?v=${Date.now()}`);
            const paths = await getFolderPrimaryImagePaths('images/all-white-galleries', folders || []);
            return paths.slice(0, limit);
        }
    },
    {
        match: (name) => name.startsWith('I Think Narcissus Fell In'),
        getPaths: (limit) => [6, 5, 4, 3, 2, 1]
            .slice(0, limit)
            .map((pieceId) => `images/i-think-narcissus-fell-in/${pieceId}/1.jpeg`)
    },
    {
        match: (name) => name.startsWith('Archive'),
        getPaths: (limit) => [4, 3, 2, 1]
            .slice(0, limit)
            .map((pieceId) => `images/archive-project/${pieceId}/1.jpeg`)
    }
];

async function resolveHomeBackgroundImagePath(path) {
    if (await imageExists(path)) {
        return path;
    }

    const basePath = path.replace(/\.(jpe?g|png|webp|gif)$/i, '');
    for (const ext of imageExtensions) {
        const candidate = `${basePath}.${ext}`;
        if (candidate !== path && (await imageExists(candidate))) {
            return candidate;
        }
    }

    return null;
}

async function getFolderPrimaryImagePaths(baseDir, folderIds, { newestFirst = true } = {}) {
    let ids = folderIds
        .map((folderId) => parseInt(folderId, 10))
        .filter((folderId) => !Number.isNaN(folderId));

    if (newestFirst) {
        ids.sort((a, b) => b - a);
    }

    return ids.map((folderId) => `${baseDir}/${folderId}/1.jpeg`);
}

function getHomeCollectionImageSource(collectionName) {
    return HOME_COLLECTION_IMAGE_SOURCES.find((source) => source.match(collectionName));
}

async function buildHomeBackgroundSelectionPaths() {
    const orderedPaths = [];
    const collections = await fetchTextManifest(`images/collections-list.txt?v=${Date.now()}`);

    if (collections?.length) {
        for (const collectionName of collections.slice(0, HOME_BACKGROUND_COLLECTION_COUNT)) {
            const source = getHomeCollectionImageSource(collectionName);
            if (!source) {
                console.warn('No home background mapping for collection:', collectionName);
                continue;
            }

            const collectionPaths = await source.getPaths(HOME_BACKGROUND_PIECES_PER_COLLECTION);
            orderedPaths.push(...collectionPaths);
        }
    }

    const notableFolders = await fetchTextManifest(`images/notable-work/folders.txt?v=${Date.now()}`);
    if (notableFolders?.length) {
        const notablePaths = await getFolderPrimaryImagePaths('images/notable-work', notableFolders);
        orderedPaths.push(...notablePaths.slice(0, HOME_BACKGROUND_NOTABLE_COUNT));
    }

    return orderedPaths;
}

async function getHomeBackgroundSelectionPool() {
    const orderedPaths = await buildHomeBackgroundSelectionPaths();
    const poolSize = HOME_BACKGROUND_IMAGE_COUNT + HOME_BACKGROUND_POOL_EXTRA;
    const pool = [];

    for (const path of orderedPaths) {
        if (pool.length >= poolSize) {
            break;
        }

        const resolved = await resolveHomeBackgroundImagePath(path);
        if (resolved) {
            pool.push(resolved);
        }
    }

    return pool;
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function applyRandomGalleryLayout(item) {
    const width = randomBetween(140, 220);
    const aspectRatio = randomBetween(0.85, 1.2);
    const top = randomBetween(6, 94);
    const left = randomBetween(4, 96);
    const rotation = randomBetween(-14, 14);

    item.style.setProperty('--width', `${Math.round(width)}px`);
    item.style.setProperty('--aspect-ratio', aspectRatio.toFixed(2));
    item.style.setProperty('--top', `${top.toFixed(1)}%`);
    item.style.setProperty('--left', `${left.toFixed(1)}%`);
    item.style.setProperty('--rotation', `${rotation.toFixed(1)}deg`);
}

function getRectIntersectionArea(rectA, rectB) {
    const overlapWidth = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left));
    const overlapHeight = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top));
    return overlapWidth * overlapHeight;
}

function getRectOverlapRatio(rectA, rectB) {
    const intersection = getRectIntersectionArea(rectA, rectB);
    if (intersection <= 0) return 0;

    const areaA = rectA.width * rectA.height;
    const areaB = rectB.width * rectB.height;
    const smallerArea = Math.min(areaA, areaB);
    if (smallerArea <= 0) return 0;

    return intersection / smallerArea;
}

function exceedsMaxGalleryOverlap(candidateRect, placedRects) {
    return placedRects.some((placedRect) => getRectOverlapRatio(candidateRect, placedRect) > HOME_GALLERY_MAX_OVERLAP);
}

function isRectInsideGallery(rect, galleryRect) {
    const edgeMargin = 2;
    return (
        rect.left >= galleryRect.left - edgeMargin &&
        rect.top >= galleryRect.top - edgeMargin &&
        rect.right <= galleryRect.right + edgeMargin &&
        rect.bottom <= galleryRect.bottom + edgeMargin
    );
}

function placeGalleryItemWithoutOverlap(item, gallery, placedRects) {
    for (let attempt = 0; attempt < HOME_GALLERY_MAX_PLACEMENT_ATTEMPTS; attempt++) {
        applyRandomGalleryLayout(item);
        gallery.appendChild(item);

        const candidateRect = item.getBoundingClientRect();
        const galleryRect = gallery.getBoundingClientRect();
        const isValid =
            isRectInsideGallery(candidateRect, galleryRect) &&
            !exceedsMaxGalleryOverlap(candidateRect, placedRects);

        if (isValid) {
            placedRects.push(candidateRect);
            return true;
        }

        gallery.removeChild(item);
    }

    return false;
}

function initHomeBackgroundGallery() {
    const gallery = document.getElementById('home-background-gallery');
    if (!gallery) return;

    gallery.innerHTML = '';
    const placedRects = [];

    for (let i = 0; i < HOME_BACKGROUND_IMAGE_COUNT; i++) {
        const item = document.createElement('div');
        item.className = 'gallery-image-item';
        item.dataset.imageId = String(i + 1);

        const placeholder = document.createElement('div');
        placeholder.className = 'gallery-image-placeholder-new';
        item.appendChild(placeholder);

        const placed = placeGalleryItemWithoutOverlap(item, gallery, placedRects);
        if (!placed) {
            applyRandomGalleryLayout(item);
            gallery.appendChild(item);
            placedRects.push(item.getBoundingClientRect());
        }
    }
}

function createBackgroundGalleryImage(src, index) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.decoding = 'async';
    img.loading = index < 3 ? 'eager' : 'lazy';
    img.fetchPriority = index < 3 ? 'auto' : 'low';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '4px';
    return img;
}

// Load images for home page background gallery
async function loadHomeGalleryImages() {
    const galleryItems = document.querySelectorAll('#home-background-gallery .gallery-image-item');
    if (!galleryItems.length) return;

    const selectionPool = await getHomeBackgroundSelectionPool();
    if (!selectionPool.length) return;

    const shuffled = selectionPool.slice().sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(galleryItems.length, selectionPool.length));

    galleryItems.forEach((item, index) => {
        const imagePath = selected[index];
        if (!imagePath) return;

        const placeholder = item.querySelector('.gallery-image-placeholder-new');
        if (!placeholder) return;

        const img = createBackgroundGalleryImage(imagePath, index);
        img.addEventListener('error', () => {
            tryLoadImage(
                imagePath,
                (src) => {
                    img.src = src;
                },
                () => {}
            );
        }, { once: true });

        placeholder.replaceWith(img);
    });
}

async function detectNotableWorkFolders() {
    const manifest = await fetchTextManifest(`images/notable-work/folders.txt?v=${Date.now()}`);
    if (manifest && manifest.length) {
        const folderIds = manifest.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id));
        writeSessionCache(NOTABLE_FOLDERS_CACHE_KEY, folderIds);
        return folderIds;
    }

    const cached = readSessionCache(NOTABLE_FOLDERS_CACHE_KEY);
    if (cached && cached.length) {
        return cached;
    }

    const maxScan = 40;
    const results = await runPool(
        Array.from({ length: maxScan }, (_, i) => i + 1),
        IMAGE_FETCH_POOL_SIZE,
        async (folderId) => {
            const paths = [
                `images/notable-work/${folderId}/1.jpeg`,
                `images/notable-work/${folderId}/1.jpg`,
                `images/notable-work/${folderId}.jpeg`,
                `images/notable-work/${folderId}.jpg`
            ];

            for (const path of paths) {
                if (await imageExists(path)) {
                    return folderId;
                }
            }
            return null;
        }
    );

    const folderIds = results.filter((folderId) => folderId !== null);
    folderIds.sort((a, b) => b - a);
    if (folderIds.length) {
        writeSessionCache(NOTABLE_FOLDERS_CACHE_KEY, folderIds);
    }
    return folderIds;
}

// Dynamically create gallery items based on detected folders
function createNotableWorkGalleryItems(folderIds) {
    const gallery = document.getElementById('notable-work-gallery');
    if (!gallery) return;
    
    // Clear any existing items
    gallery.innerHTML = '';
    
    // Create gallery items (newest first, which is already sorted)
    folderIds.forEach((folderId) => {
        const item = document.createElement('div');
        item.className = 'gallery-item clickable-notable-image';
        item.setAttribute('data-piece-id', folderId);
        item.setAttribute('data-folder-id', folderId);
        item.innerHTML = '<div class="gallery-image-placeholder">Loading...</div>';
        gallery.appendChild(item);
    });
}

// Load images for notable work gallery
function loadNotableWorkImages() {
    const galleryItems = document.querySelectorAll('#notable-work-gallery .gallery-item');
    const totalItems = galleryItems.length;
    const loadedImages = [];
    
    if (totalItems === 0) {
        return; // No items to load
    }
    
    galleryItems.forEach((item, index) => {
        // Get folder ID from the data attribute (already set during creation)
        const folderId = parseInt(item.getAttribute('data-folder-id'));
        
        if (!folderId) {
            console.warn('Gallery item missing folder ID at index', index);
            return;
        }
        
        // Helper to create and insert image
        const createImage = (src) => {
            const placeholder = item.querySelector('.gallery-image-placeholder');
            if (placeholder) {
                const img = document.createElement('img');
                img.src = src;
                img.className = 'gallery-image';
                img.loading = 'lazy';
                img.decoding = 'async';
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 4px;';
                
                img.onload = function() {
                    loadedImages.push({
                        element: item,
                        naturalHeight: this.naturalHeight,
                        naturalWidth: this.naturalWidth
                    });
                    
                    if (loadedImages.length === galleryItems.length) {
                        regulateGalleryHeights(loadedImages);
                    }
                };
                
                placeholder.replaceWith(img);
            }
        };
        
        // Try new structure first (folder/1.jpeg), then fallback to old structure (folder.jpg)
        tryLoadImage(
            `images/notable-work/${folderId}/1.jpeg`,
            createImage,
            () => {
                // Fallback to old structure
                tryLoadImage(
                    `images/notable-work/${folderId}.jpg`,
                    createImage,
                    () => {
                        // No image found - use placeholder dimensions
                        loadedImages.push({
                            element: item,
                            naturalHeight: 400,
                            naturalWidth: 400
                        });
                        
                        if (loadedImages.length === galleryItems.length) {
                            regulateGalleryHeights(loadedImages);
                        }
                    }
                );
            }
        );
    });
}

// Helper function to try loading image with multiple extensions
function tryLoadWithExtensions(basePath, onSuccess, onError) {
    const extensions = ['jpeg', 'jpg', 'png'];
    let tried = 0;
    
    const tryNext = () => {
        if (tried >= extensions.length) {
            onError();
            return;
        }
        
        const ext = extensions[tried];
        const imagePath = `${basePath}.${ext}`;
        tryLoadImage(imagePath, onSuccess, () => {
            tried++;
            tryNext();
        });
    };
    
    tryNext();
}

// Regulate gallery item heights by row (3 images per row)
function regulateGalleryHeights(loadedImages) {
    if (loadedImages.length === 0) return;
    
    // Wait a bit for images to render, then measure actual heights
    setTimeout(() => {
        const galleryItems = Array.from(document.querySelectorAll('#notable-work-gallery .gallery-item'));
        const itemsPerRow = 3;
        
        // Group items by row
        for (let rowStart = 0; rowStart < galleryItems.length; rowStart += itemsPerRow) {
            const rowItems = galleryItems.slice(rowStart, rowStart + itemsPerRow);
            const rowHeights = [];
            
            // Measure natural heights of images in this row
            rowItems.forEach(item => {
                const img = item.querySelector('.gallery-image');
                if (img && img.naturalHeight > 0 && img.naturalWidth > 0) {
                    // Calculate what the height would be at current width (maintaining aspect ratio)
                    const currentWidth = item.offsetWidth || 300; // Approximate column width
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    const calculatedHeight = currentWidth / aspectRatio;
                    rowHeights.push(calculatedHeight);
                }
            });
            
            if (rowHeights.length === 0) continue;
            
            // Calculate average height for this row
            const avgRowHeight = rowHeights.reduce((sum, h) => sum + h, 0) / rowHeights.length;
            
            // Apply average height to all items in this row (maintain proportions, don't crop)
            rowItems.forEach(item => {
                const img = item.querySelector('.gallery-image');
                const container = item;
                
                if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
                    // Calculate scale factor to fit average height
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    const targetHeight = avgRowHeight;
                    const targetWidth = targetHeight * aspectRatio;
                    
                    // Set container to fit the scaled image
                    container.style.height = `${targetHeight}px`;
                    container.style.width = '100%';
                    container.style.display = 'flex';
                    container.style.alignItems = 'center';
                    container.style.justifyContent = 'center';
                    container.style.overflow = 'hidden';
                    
                    // Set image to maintain proportions (contain, not cover)
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = `${targetHeight}px`;
                    img.style.width = 'auto';
                    img.style.height = 'auto';
                    img.style.objectFit = 'contain'; // Don't crop - maintain proportions
                }
            });
        }
    }, 200);
}

// Load secondary images for a piece (for overlays)
function loadSecondaryImages(pieceFolder, maxImages = 10) {
    const secondaryImages = [];
    let loadedCount = 0;
    
    for (let i = 2; i <= maxImages; i++) {
        const imagePath = `${pieceFolder}/${i}.jpg`;
        const testImg = new Image();
        testImg.onload = () => {
            secondaryImages.push(imagePath);
            loadedCount++;
        };
        testImg.onerror = () => {
            loadedCount++;
            if (loadedCount === maxImages - 1) {
                // All images checked
            }
        };
        testImg.src = imagePath;
    }
    
    return secondaryImages;
}

// Load images for project pages (new structure with subfolders)
function loadProjectImages(projectFolder) {
    const projectImages = document.querySelectorAll(`[data-project-image]`);
    
    projectImages.forEach((item) => {
        const imageId = item.getAttribute('data-project-image');
        // New structure: images/project-folder/1/1.jpg (main image in subfolder)
        const imagePath = `images/${projectFolder}/${imageId}/1.jpeg`;
        
        tryLoadImage(
            imagePath,
            (src) => {
                const placeholder = item.querySelector('.project-image-placeholder, .piece-image-placeholder');
                if (placeholder) {
                    const img = document.createElement('img');
                    img.src = src;
                    img.loading = 'lazy';
                    img.decoding = 'async';
                    
                    // For ITNFI project, size to align with title and end before audio player
                    if (item.closest('.narcissus-project-page')) {
                        img.style.width = 'auto';
                        img.style.height = 'auto';
                        img.style.maxWidth = '100%';
                        img.style.maxHeight = '100%';
                        img.style.objectFit = 'contain';
                        img.style.display = 'block';
                        img.style.margin = '0';
                    } else {
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'contain';
                        img.style.display = 'block';
                        img.style.margin = '0 auto';
                    }
                    
                    placeholder.replaceWith(img);
                } else {
                    // If no placeholder, try to replace the item itself
                    item.innerHTML = `<img src="${src}" alt="Project image" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">`;
                }
            },
            () => {
                // Fallback to old structure: images/project-folder/1.jpg
                const fallbackPath = `images/${projectFolder}/${imageId}.jpeg`;
                tryLoadImage(
                    fallbackPath,
                    (src) => {
                        const placeholder = item.querySelector('.project-image-placeholder, .piece-image-placeholder');
                        if (placeholder) {
                            const img = document.createElement('img');
                            img.src = src;
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.objectFit = 'contain';
                            img.style.display = 'block';
                            img.style.margin = '0 auto';
                            placeholder.replaceWith(img);
                        } else {
                            item.innerHTML = `<img src="${src}" alt="Project image" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">`;
                        }
                    },
                    () => {
                        // Keep placeholder if image doesn't exist
                    }
                );
            }
        );
    });
}

// Load mixed media (audio, design images) for a piece
function loadMixedMedia(pieceFolder) {
    const mixedMedia = {
        audio: null,
        designImages: []
    };
    
    // Try to find audio file
    const audioExtensions = ['mp3', 'wav', 'm4a'];
    audioExtensions.forEach(ext => {
        const audioPath = `${pieceFolder}/audio.${ext}`;
        const testAudio = new Audio();
        testAudio.oncanplay = () => {
            if (!mixedMedia.audio) {
                mixedMedia.audio = audioPath;
            }
        };
        testAudio.src = audioPath;
    });
    
    // Try to find design images (design-1.jpg, design-2.jpg, etc.)
    for (let i = 1; i <= 10; i++) {
        const designPath = `${pieceFolder}/design-${i}.jpg`;
        const testImg = new Image();
        testImg.onload = () => {
            mixedMedia.designImages.push(designPath);
        };
        testImg.src = designPath;
    }
    
    return mixedMedia;
}

// Load Cargo images using hash values (keeping for backward compatibility)
function loadCargoImages() {
    const galleryImages = document.querySelectorAll('.gallery-image[data-src]');
    galleryImages.forEach(img => {
        const hash = img.getAttribute('data-src');
        if (hash) {
            // Try different Cargo CDN URL patterns
            const cargoUrls = [
                `https://cargo.site/images/${hash}`,
                `https://cargo.site/${hash}`,
                `https://files.cargocollective.com/${hash}`,
                `https://cargo.site/c/${hash}`
            ];
            
            // Try loading from first URL pattern
            const testImg = new Image();
            testImg.onload = function() {
                img.src = cargoUrls[0];
                const placeholder = img.nextElementSibling;
                if (placeholder && placeholder.classList.contains('gallery-image-placeholder')) {
                    placeholder.style.display = 'none';
                }
            };
            testImg.onerror = function() {
                // If first URL fails, try others or show placeholder
                const placeholder = img.nextElementSibling;
                if (placeholder && placeholder.classList.contains('gallery-image-placeholder')) {
                    placeholder.style.display = 'flex';
                }
            };
            testImg.src = cargoUrls[0];
        }
    });
}

function scheduleIdleTask(task, timeout = 1500) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(task, { timeout });
    } else {
        setTimeout(task, 0);
    }
}

// ============================================================================
// ALL WHITE GALLERIES — piece rows from images/all-white-galleries/{n}/
// ============================================================================

function parsePieceDataText(text) {
    const defaultData = {
        title: '',
        size: '',
        medium: '',
        year: '',
        description: ''
    };

    const data = { ...defaultData };
    let inDescription = false;
    let descriptionLines = [];

    text.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('title:')) {
            data.title = trimmed.substring(6).trim();
            inDescription = false;
        } else if (trimmed.startsWith('size:')) {
            data.size = trimmed.substring(5).trim();
            inDescription = false;
        } else if (trimmed.startsWith('medium:')) {
            data.medium = trimmed.substring(7).trim();
            inDescription = false;
        } else if (trimmed.startsWith('year:')) {
            data.year = trimmed.substring(5).trim();
            inDescription = false;
        } else if (trimmed.startsWith('description:')) {
            descriptionLines = [trimmed.substring(12).trim()];
            inDescription = true;
        } else if (inDescription) {
            if (trimmed || descriptionLines.length > 0) {
                descriptionLines.push(trimmed);
            }
        }
    });

    if (descriptionLines.length > 0) {
        while (descriptionLines.length > 0 && descriptionLines[descriptionLines.length - 1].trim() === '') {
            descriptionLines.pop();
        }
        data.description = descriptionLines.join('\n');
    }

    return data;
}

async function loadAwgPieceData(pieceId) {
    const dataPath = `images/all-white-galleries/${pieceId}/piece-data.txt?v=${Date.now()}`;

    try {
        const response = await fetch(dataPath);
        if (!response.ok) {
            return parsePieceDataText('');
        }
        return parsePieceDataText(await response.text());
    } catch (error) {
        console.error('Error loading AWG piece data for piece', pieceId, ':', error);
        return parsePieceDataText('');
    }
}

async function detectAwgFolders() {
    const manifest = await fetchTextManifest('images/all-white-galleries/folders.txt');
    if (manifest && manifest.length) {
        return manifest
            .map((id) => parseInt(id, 10))
            .filter((id) => !Number.isNaN(id))
            .sort((a, b) => a - b);
    }

    const maxScan = 20;
    const results = await runPool(
        Array.from({ length: maxScan }, (_, i) => i + 1),
        IMAGE_FETCH_POOL_SIZE,
        async (pieceId) => {
            const paths = [
                `images/all-white-galleries/${pieceId}/1.jpeg`,
                `images/all-white-galleries/${pieceId}/1.jpg`,
                `images/all-white-galleries/${pieceId}/1.png`
            ];

            for (const path of paths) {
                if (await imageExists(path)) {
                    return pieceId;
                }
            }
            return null;
        }
    );

    return results.filter((pieceId) => pieceId !== null).sort((a, b) => a - b);
}

async function getAwgPieceImages(pieceId) {
    const images = [];

    for (let index = 1; index <= 12; index += 1) {
        const paths = [
            `images/all-white-galleries/${pieceId}/${index}.jpeg`,
            `images/all-white-galleries/${pieceId}/${index}.jpg`,
            `images/all-white-galleries/${pieceId}/${index}.png`
        ];

        let foundPath = null;
        for (const path of paths) {
            if (await imageExists(path)) {
                foundPath = path;
                break;
            }
        }

        if (foundPath) {
            images.push(foundPath);
        } else if (images.length > 0) {
            break;
        }
    }

    return images;
}

const awgPieceImages = {};
let awgImageCarousel = { images: [], index: 0 };
let awgOverlayInitialized = false;

function formatAwgSize(size) {
    return formatPieceSize(size);
}

function initAwgImageOverlay() {
    if (awgOverlayInitialized) return;

    const overlay = document.getElementById('awg-image-overlay');
    if (!overlay) return;

    awgOverlayInitialized = true;

    const media = document.getElementById('awg-image-overlay-media');
    const leftArrow = document.getElementById('awg-carousel-left');
    const rightArrow = document.getElementById('awg-carousel-right');

    function closeAwgOverlay() {
        overlay.classList.remove('active');
        document.documentElement.style.overflow = '';
    }

    function updateAwgCarouselArrows() {
        const { images, index } = awgImageCarousel;
        const showArrows = images.length > 1;

        if (leftArrow) {
            leftArrow.classList.toggle('hidden', !showArrows || index === 0);
        }
        if (rightArrow) {
            rightArrow.classList.toggle('hidden', !showArrows || index === images.length - 1);
        }
    }

    function displayAwgImage(index) {
        if (!media || index < 0 || index >= awgImageCarousel.images.length) {
            return;
        }

        awgImageCarousel.index = index;
        const src = awgImageCarousel.images[index];
        media.innerHTML = `<img src="${src}" alt="Expanded piece view" class="awg-overlay-image">`;
        updateAwgCarouselArrows();
    }

    function openAwgOverlay(pieceId, startIndex) {
        const images = awgPieceImages[pieceId] || [];
        if (!images.length) return;

        awgImageCarousel = { images, index: startIndex };
        displayAwgImage(startIndex);
        overlay.classList.add('active');
        document.documentElement.style.overflow = 'hidden';
    }

    document.addEventListener('click', (event) => {
        const img = event.target.closest('.awg-piece-images img');
        if (!img || !document.querySelector('.all-white-galleries-page')) {
            return;
        }

        event.preventDefault();

        const pieceEl = img.closest('.awg-piece');
        const pieceId = pieceEl?.getAttribute('data-piece-id');
        const imageIndex = Array.from(pieceEl.querySelectorAll('.awg-piece-images img')).indexOf(img);

        if (pieceId) {
            openAwgOverlay(pieceId, Math.max(0, imageIndex));
        }
    });

    overlay.addEventListener('click', (event) => {
        if (!overlay.classList.contains('active')) {
            return;
        }

        if (event.target.closest('.awg-overlay-image') || event.target.closest('.carousel-arrow')) {
            return;
        }

        closeAwgOverlay();
    });

    leftArrow?.addEventListener('click', (event) => {
        event.stopPropagation();
        displayAwgImage(awgImageCarousel.index - 1);
    });

    rightArrow?.addEventListener('click', (event) => {
        event.stopPropagation();
        displayAwgImage(awgImageCarousel.index + 1);
    });

    document.addEventListener('keydown', (event) => {
        if (!overlay.classList.contains('active')) {
            return;
        }

        if (event.key === 'Escape') {
            closeAwgOverlay();
        } else if (event.key === 'ArrowLeft') {
            displayAwgImage(awgImageCarousel.index - 1);
        } else if (event.key === 'ArrowRight') {
            displayAwgImage(awgImageCarousel.index + 1);
        }
    });
}

async function loadAwgGallery() {
    const container = document.getElementById('awg-pieces');
    if (!container) return;

    const pieceIds = await detectAwgFolders();
    container.innerHTML = '';
    Object.keys(awgPieceImages).forEach((key) => {
        delete awgPieceImages[key];
    });

    if (!pieceIds.length) {
        updateAwgGalleryPosition();
        return;
    }

    for (const pieceId of pieceIds) {
        const [pieceData, imagePaths] = await Promise.all([
            loadAwgPieceData(pieceId),
            getAwgPieceImages(pieceId)
        ]);

        const article = document.createElement('article');
        article.className = 'awg-piece';
        article.setAttribute('data-piece-id', pieceId);

        if (pieceId === 2 || pieceId === 5) {
            article.classList.add('awg-piece-painting');
        }

        if (pieceData.title) {
            const title = document.createElement('h2');
            title.className = 'awg-piece-title';
            title.textContent = pieceData.title;
            article.appendChild(title);
        }

        if (imagePaths.length) {
            awgPieceImages[pieceId] = imagePaths;

            const imagesRow = document.createElement('div');
            imagesRow.className = 'awg-piece-images';

            imagePaths.forEach((path) => {
                const img = document.createElement('img');
                img.src = path;
                img.alt = pieceData.title || `Piece ${pieceId}`;
                img.loading = 'lazy';
                img.decoding = 'async';
                imagesRow.appendChild(img);
            });

            article.appendChild(imagesRow);
        }

        const info = document.createElement('div');
        info.className = 'awg-piece-info';

        const formattedSize = formatAwgSize(pieceData.size);
        const detailParts = [formattedSize, pieceData.medium].filter(Boolean);
        if (detailParts.length) {
            const details = document.createElement('p');
            details.className = 'awg-piece-details';
            details.textContent = detailParts.join(', ');
            info.appendChild(details);
        }

        if (pieceData.description) {
            const description = document.createElement('p');
            description.className = 'awg-piece-description';
            description.textContent = pieceData.description;
            info.appendChild(description);
        }

        article.appendChild(info);
        container.appendChild(article);
    }

    await appendAwgFinSection(container);

    updateAwgGalleryPosition();
}

async function loadAwgCollectionDescription() {
    try {
        const response = await fetch(`images/all-white-galleries/description.txt?v=${Date.now()}`);
        if (!response.ok) {
            return '[Collection description placeholder]';
        }

        const text = (await response.text()).trim();
        return text || '[Collection description placeholder]';
    } catch (error) {
        console.error('Error loading AWG collection description:', error);
        return '[Collection description placeholder]';
    }
}

function formatAwgCollectionDescription(text, { appendShowcaseLink = false } = {}) {
    const paragraphs = text.split(/\n\s*\n/).filter((paragraph) => paragraph.trim());

    return paragraphs.map((paragraph, index) => {
        const escaped = paragraph
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        let formatted = escaped
            .replace(/All White Galleries/g, '<i>All White Galleries</i>')
            .replace(/A\.W\.G\./g, '<i>A.W.G.</i>');

        if (appendShowcaseLink && index === 0) {
            formatted += ' <button type="button" class="showcase-link">See <i>A.W.G.</i> in person!</button>';
        }

        return formatted;
    }).join('\n\n');
}

async function loadAwgSpotifyMoodBoard() {
    const defaults = {
        prefix: 'Listen to the A.W.G.',
        link: 'Spotify Mood Board',
        url: 'https://open.spotify.com/playlist/1NH7HHLa0KiyiX4zlNBwYz?si=hRk2XVrIRnOUNIzeFinXKQ'
    };

    try {
        const response = await fetch(`images/all-white-galleries/spotify-mood-board.txt?v=${Date.now()}`);
        if (!response.ok) {
            return defaults;
        }

        const data = { ...defaults };
        (await response.text()).split('\n').forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('prefix:')) {
                data.prefix = trimmed.substring(7).trim();
            } else if (trimmed.startsWith('link:')) {
                data.link = trimmed.substring(5).trim();
            } else if (trimmed.startsWith('url:')) {
                data.url = trimmed.substring(4).trim();
            }
        });

        return data;
    } catch (error) {
        console.error('Error loading AWG Spotify mood board link:', error);
        return defaults;
    }
}

function buildAwgSpotifyLine({ prefix, link, url }) {
    const formattedPrefix = formatAwgCollectionDescription(prefix);
    const escapedLink = link
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const escapedUrl = url
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;');

    return `${formattedPrefix} <a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedLink}</a>.`;
}

function createAwgNav(isBottom = false) {
    const nav = document.createElement('div');
    nav.className = isBottom ? 'awg-nav awg-nav-bottom' : 'awg-nav awg-nav-top';
    nav.innerHTML = `
        <a href="index.html" class="home-link-header awg-nav-link awg-nav-link-home">
            <span class="awg-nav-char awg-nav-h">h</span><span class="awg-nav-char awg-nav-o">o</span><span class="awg-nav-char awg-nav-m">m</span><span class="awg-nav-char awg-nav-e">e</span>
        </a>
        <a href="projects.html" class="back-link-header awg-nav-link awg-nav-link-back">
            <span class="awg-nav-char awg-nav-b">b</span><span class="awg-nav-char awg-nav-a">a</span><span class="awg-nav-char awg-nav-c">c</span><span class="awg-nav-char awg-nav-k">k</span>
        </a>
        ${isBottom ? `
        <a href="${buildInquireContactUrl('Inquiry - All White Galleries', 'all-white-galleries.html')}" class="awg-nav-link awg-nav-link-inquire">
            <span class="awg-nav-char awg-nav-i">i</span><span class="awg-nav-char awg-nav-n">n</span><span class="awg-nav-char awg-nav-q">q</span><span class="awg-nav-char awg-nav-u">u</span><span class="awg-nav-char awg-nav-i2">i</span><span class="awg-nav-char awg-nav-r">r</span><span class="awg-nav-char awg-nav-e">e</span>
        </a>` : ''}
    `;
    return nav;
}

async function appendAwgFinSection(container) {
    const existingFin = container.querySelector('.awg-fin-section');
    if (existingFin) {
        existingFin.remove();
    }

    const descriptionText = await loadAwgCollectionDescription();
    const spotifyData = await loadAwgSpotifyMoodBoard();
    const finSection = document.createElement('div');
    finSection.className = 'awg-fin-section';

    const finLabel = document.createElement('p');
    finLabel.className = 'awg-fin';
    finLabel.innerHTML = '<i>Fin.</i>';

    const description = document.createElement('div');
    description.className = 'awg-collection-description';
    description.innerHTML = formatAwgCollectionDescription(descriptionText, { appendShowcaseLink: true });

    const spotifyLine = document.createElement('p');
    spotifyLine.className = 'awg-collection-spotify';
    spotifyLine.innerHTML = buildAwgSpotifyLine(spotifyData);

    finSection.appendChild(finLabel);
    finSection.appendChild(description);
    finSection.appendChild(spotifyLine);
    finSection.appendChild(createAwgNav(true));
    container.appendChild(finSection);
}

function sampleCoverBottomColor(coverImage) {
    if (!coverImage?.naturalWidth || !coverImage?.naturalHeight) {
        return '#f1f1f1';
    }

    const canvas = document.createElement('canvas');
    canvas.width = coverImage.naturalWidth;
    canvas.height = coverImage.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(coverImage, 0, 0);

    const pixels = [];
    const { naturalWidth: width, naturalHeight: height } = coverImage;

    for (let y = height - 24; y < height; y += 1) {
        for (let x = Math.floor(width * 0.2); x < Math.floor(width * 0.8); x += 3) {
            const [r, g, b] = context.getImageData(x, y, 1, 1).data;
            pixels.push([r, g, b]);
        }
    }

    if (!pixels.length) {
        return '#f1f1f1';
    }

    const [r, g, b] = pixels.reduce(
        (totals, [pr, pg, pb]) => [totals[0] + pr, totals[1] + pg, totals[2] + pb],
        [0, 0, 0]
    ).map((total) => Math.round(total / pixels.length));

    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function updateAwgGalleryPosition() {
    const coverImage = document.querySelector('.awg-cover-image');
    const gallery = document.getElementById('awg-pieces');
    if (!coverImage || !gallery || !coverImage.offsetHeight) {
        return;
    }

    const pageColor = sampleCoverBottomColor(coverImage);
    document.documentElement.style.setProperty('--awg-page-color', pageColor);

    const startOffset = coverImage.offsetHeight * 0.5;
    gallery.style.marginTop = `${startOffset - coverImage.offsetHeight}px`;
}

function initAwgPageLayout() {
    const coverImage = document.querySelector('.awg-cover-image');
    if (!coverImage) {
        return;
    }

    const refreshLayout = () => updateAwgGalleryPosition();

    if (coverImage.complete) {
        refreshLayout();
    } else {
        coverImage.addEventListener('load', refreshLayout, { once: true });
    }

    window.addEventListener('resize', refreshLayout);
}

function initAwgScrollHint() {
    const hint = document.getElementById('awg-scroll-hint');
    if (!hint || hint.dataset.initialized) {
        return;
    }

    hint.dataset.initialized = 'true';

    let dismissed = false;

    function dismissHint() {
        if (dismissed) {
            return;
        }

        dismissed = true;
        hint.classList.add('awg-scroll-hint-dismissed');
        hint.setAttribute('aria-hidden', 'true');
        window.removeEventListener('scroll', onScroll);
    }

    function onScroll() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        if (scrollTop > 16) {
            dismissHint();
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

// Load images when DOM is ready
async function initializeImageLoading() {
    initShowcaseOverlay();

    // Home: layout immediately, load photos after first paint
    if (document.querySelector('#home-background-gallery')) {
        initHomeBackgroundGallery();
        scheduleIdleTask(() => {
            loadHomeGalleryImages();
        });
    }

    // Load notable work images if on notable work page
    const notableWorkGallery = document.querySelector('#notable-work-gallery');
    if (notableWorkGallery) {
        const folderIds = await detectNotableWorkFolders();
        if (folderIds.length > 0) {
            createNotableWorkGalleryItems(folderIds);
            loadNotableWorkImages();
            await restoreNotableWorkModalFromQuery();
        } else {
            console.log('No notable work folders detected');
        }
    }

    if (document.querySelector('.contact-page')) {
        initContactInquireBack();
    }
    
    // Load project images based on page
    if (document.querySelector('.archive-project-page, [data-project="archive"]')) {
        loadProjectImages('archive-project');
    }
    if (document.querySelector('.narcissus-project-page, [data-project="narcissus"]')) {
        loadProjectImages('i-think-narcissus-fell-in');
    }
    if (document.querySelector('.all-white-galleries-page, [data-project="all-white-galleries"]')) {
        initAwgPageLayout();
        initAwgScrollHint();
        initAwgImageOverlay();
        await loadAwgGallery();
    }
    
    // Load Cargo images (backward compatibility)
    loadCargoImages();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeImageLoading);
} else {
    initializeImageLoading();
}

// ============================================
// AUTOMATIC UPLOAD SYSTEM (Foundation)
// ============================================
// This system will automatically detect new images and create gallery items/overlays
// TODO: Implement full auto-detection and template generation

// Function to scan for new images in a folder (foundation - legacy, now using detectNotableWorkFolders)
function scanForNewImages(folderPath, maxImages = 200) {
    const foundImages = [];
    
    // Try to detect images by attempting to load them
    for (let i = 1; i <= maxImages; i++) {
        const imagePath = `${folderPath}/${i}/1.jpg`;
        const testImg = new Image();
        testImg.onload = () => {
            foundImages.push({
                id: i,
                path: imagePath,
                folder: `${folderPath}/${i}`
            });
        };
        testImg.src = imagePath;
    }
    
    return foundImages;
}

// Function to create gallery item template (for future use)
function createGalleryItemTemplate(pieceId, pieceData = {}) {
    return {
        html: `
            <div class="gallery-item clickable-notable-image" data-piece-id="${pieceId}">
                <div class="gallery-image-placeholder">Image ${pieceId}</div>
            </div>
        `,
        modalData: {
            title: pieceData.title || 'Piece Name',
            size: pieceData.size || 'size',
            medium: pieceData.medium || 'medium',
            year: pieceData.year || 'year',
            description: pieceData.description || 'Details about.'
        }
    };
}

// Function to auto-detect and add new notable work pieces (foundation)
function autoDetectNotableWorkPieces() {
    // This will scan images/notable-work/ and create gallery items for new pieces
    // Currently returns empty - will be implemented when we discuss metadata system
    const existingPieces = document.querySelectorAll('#notable-work-gallery .gallery-item');
    const maxPieceId = existingPieces.length;
    
    // Scan for new pieces beyond current count
    const newPieces = scanForNewImages('images/notable-work', 200);
    
    // Filter to only new pieces (beyond current maxPieceId)
    const actuallyNew = newPieces.filter(p => p.id > maxPieceId);
    
    // TODO: When metadata system is ready, create gallery items for new pieces
    // For now, this is the foundation structure
    
    return actuallyNew;
}

// Initialize auto-detection on page load (disabled for now - will enable when ready)
// autoDetectNotableWorkPieces();