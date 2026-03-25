(function () {
  var CONTENT = document.getElementById('content');
  var BG = document.querySelector('.bg');

  // Paths that are internal pages (relative from root)
  function isInternalPath(path) {
    return /^(\/?(pages\/[^/]+\.html|index\.html)?)$/.test(path) ||
           path === '/' || path === '';
  }

  // Normalize href to a path relative to site root
  function normalizePath(href) {
    try {
      var url = new URL(href, location.origin);
      if (url.origin !== location.origin) return null;
      var p = url.pathname;
      // ../index.html -> /index.html
      // pages/X.html -> /pages/X.html
      // Ensure leading slash
      if (!p.startsWith('/')) p = '/' + p;
      return p;
    } catch (_) {
      return null;
    }
  }

  function isHomePath(path) {
    return path === '/' || path === '/index.html';
  }

  function navigate(path, pushState) {
    // Fetch the target page
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

        // Swap content
        CONTENT.innerHTML = newContent;

        // Update background
        var fetchedBg = doc.querySelector('.bg');
        if (fetchedBg) {
          BG.setAttribute('style', fetchedBg.getAttribute('style') || '');
        } else {
          BG.removeAttribute('style');
        }

        // For homepage, the bg image is set via CSS (no inline style)
        if (isHomePath(path)) {
          BG.removeAttribute('style');
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

        // Push history state
        if (pushState) {
          history.pushState({ path: path }, '', path);
        }

        // Scroll to top
        window.scrollTo(0, 0);

        // Re-bind player UI if returning to homepage
        if (isHomePath(path) && window.__playerBindUI) {
          window.__playerBindUI();
        }
      })
      .catch(function (err) {
        // Fallback: do a normal navigation
        console.error('SPA navigation failed:', err);
        location.href = path;
      });
  }

  // Event delegation: intercept clicks on internal links
  document.addEventListener('click', function (e) {
    // Walk up from target to find anchor
    var link = e.target.closest('a');
    if (!link) return;

    // Skip if modifier keys held (user wants new tab)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    // Skip links with target="_blank"
    if (link.target === '_blank') return;

    var href = link.getAttribute('href');
    if (!href) return;

    var path = normalizePath(href);
    if (!path) return; // external or invalid
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
