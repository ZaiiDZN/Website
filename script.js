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

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && pieceModal && pieceModal.classList.contains('active')) {
        closePieceModal();
    }
});

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

// Display a specific image in the modal
function displayModalImage(index, allImages, imageMaxWidth) {
    const modalMainImage = document.getElementById('modal-main-image');
    if (!modalMainImage || !allImages || index < 0 || index >= allImages.length) {
        return;
    }
    
    const currentImage = allImages[index];
    modalMainImage.innerHTML = '';
    
    const img = document.createElement('img');
    img.src = currentImage.path;
    img.alt = 'Piece image';
    img.style.maxWidth = imageMaxWidth;
    img.style.maxHeight = '60vh';
    img.style.height = 'auto';
    img.style.width = 'auto';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
    img.style.margin = '0 auto';
    modalMainImage.appendChild(img);
    
    // Update current index
    pieceModal.setAttribute('data-current-index', index.toString());
    
    // Update arrow visibility
    updateModalArrows(index, allImages.length);
}

// Navigate to next/previous image in modal
function navigateModalImage(direction) {
    const allImagesJson = pieceModal.getAttribute('data-all-images');
    if (!allImagesJson) return;
    
    const allImages = JSON.parse(allImagesJson);
    const currentIndex = parseInt(pieceModal.getAttribute('data-current-index') || '0');
    const newIndex = currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < allImages.length) {
        // Get imageMaxWidth from current modal state
        const modalMainImage = document.getElementById('modal-main-image');
        const currentImg = modalMainImage?.querySelector('img');
        const imageMaxWidth = currentImg?.style.maxWidth || '85.7%';
        
        displayModalImage(newIndex, allImages, imageMaxWidth);
    }
}

// Update arrow visibility based on current position
function updateModalArrows(currentIndex, totalImages) {
    const leftArrow = document.querySelector('.modal-nav-arrow-left');
    const rightArrow = document.querySelector('.modal-nav-arrow-right');
    
    if (leftArrow) {
        leftArrow.style.display = currentIndex > 0 ? 'flex' : 'none';
    }
    if (rightArrow) {
        rightArrow.style.display = currentIndex < totalImages - 1 ? 'flex' : 'none';
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
    
    // Calculate image sizes and modal size based on total count (main + extras)
    // Use actual count of all images for sizing calculations
    const totalImages = allImagesOrdered.length;
    let imageMaxWidth = '85.7%';
    let imageMaxHeight = 'auto';
    let supplementGridCols = 'repeat(2, minmax(140px, 1fr))';
    let supplementImageHeight = '220px';
    let modalMaxHeight = '90vh';
    
    if (totalImages > 7) {
        imageMaxWidth = '65%';
        supplementGridCols = 'repeat(3, minmax(120px, 1fr))';
        supplementImageHeight = '140px';
        modalMaxHeight = '95vh';
    } else if (totalImages > 5) {
        imageMaxWidth = '70%';
        supplementGridCols = 'repeat(3, minmax(130px, 1fr))';
        supplementImageHeight = '180px';
        modalMaxHeight = '92vh';
    } else if (totalImages > 3) {
        imageMaxWidth = '75%';
        supplementGridCols = 'repeat(2, minmax(150px, 1fr))';
        supplementImageHeight = '200px';
        modalMaxHeight = '90vh';
    }
    
    // Adjust modal content max-height
    const modalContent = document.querySelector('.modal-content');
    
    // Update modal content
    const modalMainImage = document.getElementById('modal-main-image');
    const modalTitleText = document.getElementById('modal-title-text');
    const modalSize = document.getElementById('modal-size');
    const modalMedium = document.getElementById('modal-medium');
    const modalYear = document.getElementById('modal-year');
    const modalDescription = document.getElementById('modal-description');
    const supplementContainer = document.getElementById('modal-supplement-images');
    
    // Update main image area with navigation arrows
    const modalImageColumn = document.querySelector('.modal-image-column');
    if (modalImageColumn && allImagesOrdered.length > 0) {
        // Remove existing arrows if any
        const existingArrows = modalImageColumn.querySelectorAll('.modal-nav-arrow');
        existingArrows.forEach(arrow => arrow.remove());
        
        // Only create arrows if there's more than one image
        if (allImagesOrdered.length > 1) {
            // Create left arrow (pointing left, rotated) - hidden initially (on first image)
            const leftArrow = document.createElement('button');
            leftArrow.className = 'modal-nav-arrow modal-nav-arrow-left';
            leftArrow.innerHTML = '>';
            leftArrow.style.display = 'none'; // Hidden on first image
            leftArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateModalImage(-1);
            });
            modalImageColumn.appendChild(leftArrow);
            
            // Create right arrow (pointing right) - visible on first image
            const rightArrow = document.createElement('button');
            rightArrow.className = 'modal-nav-arrow modal-nav-arrow-right';
            rightArrow.innerHTML = '>';
            rightArrow.style.display = 'flex'; // Visible on first image (if not last)
            rightArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateModalImage(1);
            });
            modalImageColumn.appendChild(rightArrow);
        }
    }
    
    // Update main image (always show if it exists)
    if (modalMainImage) {
        if (allImagesOrdered.length > 0) {
            displayModalImage(0, allImagesOrdered, imageMaxWidth);
        } else {
            modalMainImage.innerHTML = `<div class="modal-image-placeholder"><span>Main Image</span></div>`;
        }
    }
    
    // Update text fields (hide if empty)
    if (modalTitleText) {
        // If no title is provided in piece-data.txt, leave this blank
        modalTitleText.textContent = pieceData.title || '';
    }
    
    // Handle size, medium, year - hide if empty, show if present
    const modalDetails = document.querySelector('.modal-details');
    if (modalDetails) {
        // Clear existing content
        modalDetails.innerHTML = '';
        
        if (pieceData.size && pieceData.size.trim() !== '') {
            const sizeP = document.createElement('p');
            sizeP.id = 'modal-size';
            sizeP.textContent = pieceData.size.trim();
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
            // Preserve line breaks in description
            const formattedDescription = pieceData.description.replace(/\n/g, '<br>');
            modalDescription.innerHTML = `<i>${formattedDescription}</i>`;
            modalDescription.style.display = 'block';
        } else {
            modalDescription.style.display = 'none';
        }
    }
    
    // Clear and populate supplement images (include ALL images: main + extras)
    if (supplementContainer) {
        supplementContainer.innerHTML = '';
        
        // Set grid columns based on image count
        supplementContainer.style.gridTemplateColumns = supplementGridCols;
        supplementContainer.style.marginTop = extraImages.length > 0 ? '1rem' : '0';
        
        // Add ONLY extras to supplement gallery (NOT main image)
        // Maintain proportions - don't crop
        extraImages.forEach((img, index) => {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'modal-supplement-image';
            imgDiv.style.height = supplementImageHeight;
            imgDiv.style.display = 'flex';
            imgDiv.style.alignItems = 'center';
            imgDiv.style.justifyContent = 'center';
            imgDiv.style.overflow = 'hidden';
            
            const imgElement = document.createElement('img');
            imgElement.src = img.path;
            imgElement.alt = `${img.isMain ? 'Main' : 'Extra'} image ${index + 1}`;
            imgElement.style.maxWidth = '100%';
            imgElement.style.maxHeight = '100%';
            imgElement.style.width = 'auto';
            imgElement.style.height = 'auto';
            imgElement.style.objectFit = 'contain'; // Don't crop - maintain proportions
            imgElement.style.borderRadius = '0'; // No rounded corners - raw images
            imgElement.style.cursor = 'default'; // Remove pointer cursor - no click action
            // Remove click scaling - extra images no longer enlarge
            
            imgDiv.appendChild(imgElement);
            supplementContainer.appendChild(imgDiv);
        });
        
        // Show supplement gallery only if there are extras
        if (extraImages.length > 0) {
            supplementContainer.style.display = 'grid';
        } else {
            supplementContainer.style.display = 'none';
        }
    }
    
    // Adjust modal scroll behavior based on extras
    if (modalContent) {
        if (extraImages.length > 0) {
            modalContent.style.maxHeight = modalMaxHeight;
            modalContent.style.overflowY = 'auto';
        } else {
            modalContent.style.maxHeight = 'none';
            modalContent.style.overflowY = 'hidden';
        }
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
const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

// Candidate image paths for the home page background gallery
// These are generic patterns across the site; tryLoadImage will resolve .jpg/.jpeg/etc.
let homeBackgroundCandidates = null;

function buildHomeBackgroundPatterns() {
    const patterns = [];
    
    const addRange = (patternFn, max) => {
        for (let i = 1; i <= max; i++) {
            patterns.push(patternFn(i));
        }
    };
    
    // Notable work main images (1.jpg → will also find 1.jpeg via tryLoadImage)
    addRange((i) => `images/notable-work/${i}/1.jpg`, 40);
    
    // Archive project main images
    addRange((i) => `images/archive-project/${i}/1.jpg`, 10);
    
    // ITNFI project main images
    addRange((i) => `images/i-think-narcissus-fell-in/${i}/1.jpg`, 6);
    
    // Dedicated home images, if you want to upload specific background photos
    addRange((i) => `images/home/${i}.jpg`, 30);
    
    return Array.from(new Set(patterns));
}

// Detect which candidate images actually exist (once per session)
async function initializeHomeBackgroundCandidates() {
    if (homeBackgroundCandidates !== null) {
        return homeBackgroundCandidates;
    }
    
    const patterns = buildHomeBackgroundPatterns();
    const found = [];
    
    const checks = patterns.map((path) => {
        return new Promise((resolve) => {
            tryLoadImage(
                path,
                (src) => {
                    found.push(src);
                    resolve();
                },
                () => resolve()
            );
        });
    });
    
    await Promise.all(checks);
    homeBackgroundCandidates = found;
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

// Load images for home page circular gallery
async function loadHomeGalleryImages() {
    const galleryItems = document.querySelectorAll('#circular-gallery .gallery-image-item');
    if (!galleryItems.length) return;
    
    const candidates = await initializeHomeBackgroundCandidates();
    if (!candidates || !candidates.length) return;
    
    const shuffled = candidates.slice().sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, galleryItems.length);
    
    galleryItems.forEach((item, index) => {
        const imagePath = selected[index];
        if (!imagePath) return;
        
        tryLoadImage(
            imagePath,
            (src) => {
                const placeholder = item.querySelector('.gallery-image-placeholder-new');
                if (placeholder) {
                    const img = document.createElement('img');
                    img.src = src;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'contain';
                    img.style.borderRadius = '4px';
                    placeholder.replaceWith(img);
                }
            },
            () => {
                // Keep placeholder if image doesn't exist
            }
        );
    });
}

// Detect all notable work folders by scanning for images
async function detectNotableWorkFolders() {
    const foundFolders = [];
    const maxScan = 200; // Scan up to 200 folders (reasonable limit)
    const promises = [];
    
    // Try to detect folders by attempting to load images
    for (let folderId = 1; folderId <= maxScan; folderId++) {
        const promise = new Promise((resolve) => {
            const extensions = ['jpg', 'jpeg', 'png'];
            let tried = 0;
            
            const tryNext = () => {
                if (tried >= extensions.length) {
                    resolve(null); // Folder doesn't exist
                    return;
                }
                
                const ext = extensions[tried];
                const imagePath = `images/notable-work/${folderId}/1.${ext}`;
                const testImg = new Image();
                
                testImg.onload = () => {
                    foundFolders.push(folderId);
                    resolve(folderId);
                };
                
                testImg.onerror = () => {
                    tried++;
                    tryNext();
                };
                
                testImg.src = imagePath;
            };
            
            tryNext();
        });
        
        promises.push(promise);
    }
    
    await Promise.all(promises);
    
    // Sort folders (newest first for display)
    foundFolders.sort((a, b) => b - a);
    return foundFolders;
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
        
        console.log(`Loading image: DOM index ${index} → folder ${folderId}`);
        
        // Helper to create and insert image
        const createImage = (src) => {
            const placeholder = item.querySelector('.gallery-image-placeholder');
            if (placeholder) {
                const img = document.createElement('img');
                img.src = src;
                img.className = 'gallery-image';
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
        
        // Try new structure first (folder/1.jpg), then fallback to old structure (folder.jpg)
        tryLoadImage(
            `images/notable-work/${folderId}/1.jpg`,
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
    const extensions = ['jpg', 'jpeg', 'png'];
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
        const imagePath = `images/${projectFolder}/${imageId}/1.jpg`;
        
        tryLoadImage(
            imagePath,
            (src) => {
                const placeholder = item.querySelector('.project-image-placeholder, .piece-image-placeholder');
                if (placeholder) {
                    const img = document.createElement('img');
                    img.src = src;
                    
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
                const fallbackPath = `images/${projectFolder}/${imageId}.jpg`;
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

// Load images when DOM is ready
async function initializeImageLoading() {
    // Load home gallery images if on home page
    if (document.querySelector('#circular-gallery')) {
        loadHomeGalleryImages();
    }
    
    // Load notable work images if on notable work page
    const notableWorkGallery = document.querySelector('#notable-work-gallery');
    if (notableWorkGallery) {
        // First, detect all folders and create gallery items dynamically
        const folderIds = await detectNotableWorkFolders();
        if (folderIds.length > 0) {
            createNotableWorkGalleryItems(folderIds);
            // Then load the images
            loadNotableWorkImages();
        } else {
            console.log('No notable work folders detected');
        }
    }
    
    // Load project images based on page
    if (document.querySelector('.archive-project-page, [data-project="archive"]')) {
        loadProjectImages('archive-project');
    }
    if (document.querySelector('.narcissus-project-page, [data-project="narcissus"]')) {
        loadProjectImages('i-think-narcissus-fell-in');
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