(function() {
  'use strict';

  var TIMEOUT_MS = 2500;
  var currentLoadAbort = null;

  /**
   * Preload an image and call callback when loaded or timeout occurs
   */
  function preloadImage(url, onComplete) {
    var img = new Image();
    var completed = false;

    var timeoutId = setTimeout(function() {
      if (!completed) {
        completed = true;
        onComplete(false); // timeout/error
      }
    }, TIMEOUT_MS);

    img.onload = function() {
      if (!completed) {
        completed = true;
        clearTimeout(timeoutId);
        onComplete(true); // success
      }
    };

    img.onerror = function() {
      if (!completed) {
        completed = true;
        clearTimeout(timeoutId);
        onComplete(false); // error
      }
    };

    img.src = url;

    // Return abort function
    return function abort() {
      completed = true;
      clearTimeout(timeoutId);
      img.onload = img.onerror = null;
      img.src = '';
    };
  }

  /**
   * Extract URL from background-image CSS value
   * "url('path')" or "url(path)" -> "path"
   */
  function extractUrl(bgImageValue) {
    if (!bgImageValue) return null;
    var match = bgImageValue.match(/url\(['"]?(.*?)['"]?\)/);
    return match ? match[1] : null;
  }

  /**
   * Check if image is already in browser cache (loads synchronously)
   */
  function isImageCached(url) {
    var img = new Image();
    img.src = url;
    return img.complete;
  }

  /**
   * Set background with placeholder and preload full image
   */
  function setBackground(bgElement, fullImageUrl, placeholderUrl) {
    if (!bgElement) return;

    // Abort any ongoing load
    if (currentLoadAbort) {
      currentLoadAbort();
      currentLoadAbort = null;
    }

    // Remove loaded class
    bgElement.classList.remove('loaded');

    // Convert to absolute URLs
    var absolutePlaceholder = placeholderUrl ? new URL(placeholderUrl, window.location.href).href : null;
    var absoluteFullImage = fullImageUrl ? new URL(fullImageUrl, window.location.href).href : null;

    // Check if full image is already cached
    if (absoluteFullImage && isImageCached(absoluteFullImage)) {
      // Full image in cache - skip placeholder, show immediately
      bgElement.style.backgroundImage = 'url(' + absoluteFullImage + ')';
      bgElement.classList.add('loaded');
      console.log('Background from cache:', absoluteFullImage);
      return;
    }

    // Full image not cached - show placeholder first
    if (absolutePlaceholder) {
      bgElement.style.backgroundImage = 'url(' + absolutePlaceholder + ')';
    } else if (absoluteFullImage) {
      // No placeholder, set full image directly
      bgElement.style.backgroundImage = 'url(' + absoluteFullImage + ')';
    }

    // Preload full image in background, then swap when ready
    if (absoluteFullImage && absolutePlaceholder) {
      currentLoadAbort = preloadImage(absoluteFullImage, function(success) {
        currentLoadAbort = null;

        // Swap to full image
        bgElement.style.backgroundImage = 'url(' + absoluteFullImage + ')';

        // Add loaded class for any additional CSS transitions
        bgElement.classList.add('loaded');

        if (success) {
          console.log('Background loaded:', absoluteFullImage);
        } else {
          console.log('Background load timeout/error:', absoluteFullImage);
        }
      });
    } else {
      // No preloading needed, just mark as loaded
      bgElement.classList.add('loaded');
    }
  }

  /**
   * Initialize background on page load
   */
  function initBackground() {
    var bgElement = document.querySelector('.bg');
    if (!bgElement) return;

    // Get placeholder from data attribute
    var placeholderUrl = bgElement.getAttribute('data-placeholder');

    // Get full image from inline style or CSS
    var fullImageUrl = extractUrl(bgElement.style.backgroundImage);

    // If no inline style, check computed style (for home page CSS)
    if (!fullImageUrl) {
      var computed = window.getComputedStyle(bgElement);
      fullImageUrl = extractUrl(computed.backgroundImage);
    }

    if (fullImageUrl || placeholderUrl) {
      setBackground(bgElement, fullImageUrl, placeholderUrl);
    }
  }

  // Expose for router
  window.__setBackground = setBackground;
  window.__initBackground = initBackground;

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackground);
  } else {
    initBackground();
  }
})();
