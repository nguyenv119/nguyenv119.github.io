(function () {
  var SONGS = [
    // { src: 'mewsics/byu_charlieputh.mp3',  title: 'Beat Yourself Up — Charlie Puth'  },
    // { src: 'mewsics/endworld_searows.mp3',  title: 'End of the World — Searows'      },
    { src: 'mewsics/cry_charlieputh.mp3',   title: 'Cry — Charlie Puth'              },
    { src: 'mewsics/manynights_metro.mp3',  title: 'Too Many Nights — Metro Boomin'  },
    { src: 'mewsics/toxic.mp3',             title: 'Toxic — Playboi Carti'           },
    { src: 'mewsics/apocalypse.mp3',        title: 'Apocalypse — Cigarettes After Sex'},
    { src: 'mewsics/nopole.mp3',        title: 'No Pole - Don Toliver'},
  ];

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  var queue    = shuffle(SONGS.map(function (_, i) { return i; }));
  var queuePos = 0;

  // Audio element persists (lives outside #content)
  var audio = document.getElementById('audio');

  // Mutable DOM references — updated by bindUI()
  var wrap, replayBtn, prevBtn, nextBtn, progressWrap, progressBar;
  var trackName, trackTime, playHint, sideLabel, player;

  var playing = false;

  function fmt(s) {
    if (!s || !isFinite(s)) return '';
    return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  function setState(state) {
    playing = state;
    if (wrap) {
      wrap.classList.toggle('playing', state);
      wrap.setAttribute('aria-label', state ? 'Pause music' : 'Play music');
    }
    if (player) player.classList.toggle('playing', state);
    if (state && playHint) playHint.classList.add('hidden');
  }

  function loadSong(pos, autoplay) {
    var song = SONGS[queue[pos]];
    audio.src = song.src;
    if (trackName) trackName.textContent = song.title;
    if (trackTime) trackTime.textContent = '';
    if (progressBar) progressBar.style.width = '0%';
    if (sideLabel) sideLabel.textContent = 'SIDE ' + String.fromCharCode(65 + pos);
    if (autoplay) {
      audio.play()
        .then(function () { setState(true); })
        .catch(function () { setState(false); });
    }
  }

  function tryPlay() {
    audio.play()
      .then(function () { setState(true); })
      .catch(function () { setState(false); });
  }

  function pause() { audio.pause(); setState(false); }

  function goNext() {
    queuePos = (queuePos + 1) % queue.length;
    loadSong(queuePos, true);
  }

  function goPrev() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      queuePos = (queuePos - 1 + queue.length) % queue.length;
      loadSong(queuePos, playing);
    }
  }

  // Bind (or re-bind) UI elements and their click handlers.
  // Called on initial load and whenever the homepage content is restored via SPA.
  function bindUI() {
    wrap         = document.getElementById('cassetteWrap');
    replayBtn    = document.getElementById('replaySvgBtn');
    prevBtn      = document.getElementById('prevBtn');
    nextBtn      = document.getElementById('nextBtn');
    progressWrap = document.getElementById('progressWrap');
    progressBar  = document.getElementById('progressBar');
    trackName    = document.getElementById('trackName');
    trackTime    = document.getElementById('trackTime');
    playHint     = document.getElementById('playHint');
    sideLabel    = document.getElementById('sideLabel');
    player       = document.querySelector('.player');

    if (!wrap) return; // Not on homepage — nothing to bind

    // Sync visual state with current audio state
    setState(playing);

    // Sync track info display
    var song = SONGS[queue[queuePos]];
    if (trackName) trackName.textContent = song.title;
    if (sideLabel) sideLabel.textContent = 'SIDE ' + String.fromCharCode(65 + queuePos);
    if (progressBar && audio.duration && isFinite(audio.duration)) {
      progressBar.style.width = (audio.currentTime / audio.duration * 100) + '%';
    }
    if (trackTime && audio.duration && isFinite(audio.duration)) {
      trackTime.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
    }

    // Click handlers on freshly inserted DOM elements
    wrap.addEventListener('click', function () { playing ? pause() : tryPlay(); });
    wrap.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); playing ? pause() : tryPlay(); }
    });

    replayBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      audio.currentTime = 0;
      if (!playing) tryPlay();
    });

    prevBtn.addEventListener('click', function (e) { e.stopPropagation(); goPrev(); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); goNext(); });

    progressWrap.addEventListener('click', function (e) {
      if (!audio.duration || isNaN(audio.duration)) return;
      var r = this.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });
  }

  // Audio event listeners — attached ONCE to the persistent audio element.
  // They use the mutable DOM refs which get updated by bindUI().
  audio.addEventListener('play',  function () { setState(true); });
  audio.addEventListener('pause', function () { setState(false); });
  audio.addEventListener('ended', function () { setState(false); goNext(); });

  audio.addEventListener('timeupdate', function () {
    if (!audio.duration || isNaN(audio.duration)) return;
    if (progressBar) progressBar.style.width = (audio.currentTime / audio.duration * 100) + '%';
    if (trackTime) trackTime.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
  });

  audio.addEventListener('loadedmetadata', function () {
    if (trackTime) trackTime.textContent = '0:00 / ' + fmt(audio.duration);
  });

  // Initial load
  loadSong(0, false);
  audio.addEventListener('canplay', function () { if (!playing) tryPlay(); }, { once: true });
  bindUI();

  // Expose for the SPA router
  window.__playerBindUI = bindUI;
})();
