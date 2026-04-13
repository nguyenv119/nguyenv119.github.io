(function () {
  var CONTENT = document.getElementById('content');
  var BG = document.querySelector('.bg');

  // Derive base path from where index.html lives
  // e.g. "/nguyenv119-spa-persistent-music/" or "/"
  var BASE = location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '') + '/';

  function isHomePath(path) {
    return path === BASE || path === BASE + 'index.html';
  }

  function isInternalPath(path) {
    if (isHomePath(path)) return true;
    // Match BASE + pages/something.html
    return path.indexOf(BASE + 'pages/') === 0 && path.endsWith('.html');
  }

  // Resolve href relative to the current page, return absolute pathname
  function normalizePath(href) {
    try {
      var url = new URL(href, location.href);
      if (url.origin !== location.origin) return null;
      return url.pathname;
    } catch (_) {
      return null;
    }
  }

  function navigate(path, pushState) {
    fetch(path)
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');

        // Extract content to inject
        var newContent;
        if (isHomePath(path)) {
          var stage = doc.querySelector('.stage');
          newContent = stage ? stage.outerHTML : '';
        } else {
          var page = doc.querySelector('main.page');
          newContent = page ? page.outerHTML : '';
        }

        CONTENT.innerHTML = newContent;

        // Update background with placeholder support
        if (isHomePath(path)) {
          // Resolve URLs relative to BASE to avoid context-dependent resolution issues
          var homePlaceholder = new URL('images/bg3-placeholder.webp', location.origin + BASE).pathname;
          var homeFullImage = new URL('images/bg3.webp', location.origin + BASE).pathname;
          if (window.__setBackground) {
            window.__setBackground(BG, homeFullImage, homePlaceholder);
          } else {
            BG.removeAttribute('style');
          }
        } else {
          var fetchedBg = doc.querySelector('.bg');
          var placeholderUrl = fetchedBg ? fetchedBg.getAttribute('data-placeholder') : null;
          var rawStyle = fetchedBg ? fetchedBg.getAttribute('style') : '';

          // Extract and resolve full image URL
          var fullImageUrl = null;
          var match = rawStyle.match(/url\(['"]?(.*?)['"]?\)/);
          if (match) {
            fullImageUrl = new URL(match[1], location.origin + path).pathname;
          }

          // Resolve placeholder URL
          if (placeholderUrl) {
            placeholderUrl = new URL(placeholderUrl, location.origin + path).pathname;
          }

          // Use bg-loader if available, otherwise fallback
          if (window.__setBackground && (fullImageUrl || placeholderUrl)) {
            window.__setBackground(BG, fullImageUrl, placeholderUrl);
          } else if (rawStyle) {
            // Fallback: direct style application
            var fixed = rawStyle.replace(/url\(['"]?(.*?)['"]?\)/g, function (_, url) {
              return 'url(' + new URL(url, location.origin + path).pathname + ')';
            });
            BG.setAttribute('style', fixed);
          } else {
            BG.removeAttribute('style');
          }
        }

        // Toggle light-bg class
        var fetchedBody = doc.querySelector('body');
        if (fetchedBody && fetchedBody.classList.contains('light-bg')) {
          document.body.classList.add('light-bg');
        } else {
          document.body.classList.remove('light-bg');
        }

        // Update document title
        var fetchedTitle = doc.querySelector('title');
        if (fetchedTitle) {
          document.title = fetchedTitle.textContent;
        }

        if (pushState) {
          history.pushState({ path: path }, '', path);
        }

        window.scrollTo(0, 0);

        // Re-bind player UI if returning to homepage
        if (isHomePath(path) && window.__playerBindUI) {
          window.__playerBindUI();
        }
      })
      .catch(function (err) {
        console.error('SPA navigation failed:', err);
        location.href = path;
      });
  }

  // Event delegation: intercept clicks on internal links
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;

    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (link.target === '_blank') return;

    var href = link.getAttribute('href');
    if (!href) return;

    var path = normalizePath(href);
    if (!path) return;
    if (!isInternalPath(path)) return;

    e.preventDefault();
    navigate(path, true);
  });

  // Handle back/forward
  window.addEventListener('popstate', function (e) {
    var path = (e.state && e.state.path) || location.pathname;
    navigate(path, false);
  });

  // Set initial history state
  history.replaceState({ path: location.pathname }, '', location.pathname);
})();
