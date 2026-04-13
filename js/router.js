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

        // Update background — resolve relative image URLs against the fetched page's path
        if (isHomePath(path)) {
          BG.removeAttribute('style');
          BG.removeAttribute('data-bg');
          BG.classList.remove('loaded');
        } else {
          var fetchedBg = doc.querySelector('.bg');
          var rawStyle = fetchedBg ? fetchedBg.getAttribute('style') : '';
          var dataBg = fetchedBg ? fetchedBg.getAttribute('data-bg') : '';

          // Reset loaded state for new background
          BG.classList.remove('loaded');

          if (rawStyle) {
            // Resolve ../images/X relative to the fetched page, not the current document
            var fixed = rawStyle.replace(/url\(['"]?(.*?)['"]?\)/g, function (_, url) {
              return 'url(' + new URL(url, location.origin + path).pathname + ')';
            });
            BG.setAttribute('style', fixed);

            // Copy data-bg attribute and resolve its URL
            if (dataBg) {
              var fullBgUrl = new URL(dataBg, location.origin + path).pathname;
              BG.setAttribute('data-bg', fullBgUrl);

              // Trigger progressive image loading
              var img = new Image();
              img.onload = function() {
                BG.style.backgroundImage = 'url(' + fullBgUrl + ')';
                BG.classList.add('loaded');
              };
              img.src = fullBgUrl;
            }
          } else {
            BG.removeAttribute('style');
            BG.removeAttribute('data-bg');
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
