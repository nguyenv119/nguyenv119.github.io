(function () {
  const SONGS = [
    { src: 'mewsics/byu_charlieputh.mp3',  title: 'Beat Yourself Up — Charlie Puth'  },
    { src: 'mewsics/cry_charlieputh.mp3',   title: 'Cry — Charlie Puth'              },
    { src: 'mewsics/endworld_searows.mp3',  title: 'End of the World — Searows'      },
    { src: 'mewsics/manynights_metro.mp3',  title: 'Too Many Nights — Metro Boomin'  },
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const queue    = shuffle(SONGS.map((_, i) => i));
  let   queuePos = 0;

  const audio        = document.getElementById('audio');
  const wrap         = document.getElementById('cassetteWrap');
  const replayBtn    = document.getElementById('replaySvgBtn');
  const prevBtn      = document.getElementById('prevBtn');
  const nextBtn      = document.getElementById('nextBtn');
  const progressWrap = document.getElementById('progressWrap');
  const progressBar  = document.getElementById('progressBar');
  const trackName    = document.getElementById('trackName');
  const trackTime    = document.getElementById('trackTime');
  const playHint     = document.getElementById('playHint');

  let playing = false;

  function fmt(s) {
    if (!s || !isFinite(s)) return '';
    return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  function setState(state) {
    playing = state;
    wrap.classList.toggle('playing', state);
    wrap.setAttribute('aria-label', state ? 'Pause music' : 'Play music');
    if (state && playHint) playHint.classList.add('hidden');
  }

  function loadSong(pos, autoplay) {
    const song = SONGS[queue[pos]];
    audio.src = song.src;
    trackName.textContent = song.title;
    trackTime.textContent = '';
    progressBar.style.width = '0%';
    if (autoplay) {
      audio.play()
        .then(() => setState(true))
        .catch(() => setState(false));
    }
  }

  function tryPlay() {
    audio.play()
      .then(() => setState(true))
      .catch(() => setState(false));
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

  loadSong(0, false);
  audio.addEventListener('canplay', () => { if (!playing) tryPlay(); }, { once: true });

  wrap.addEventListener('click', () => playing ? pause() : tryPlay());
  wrap.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); playing ? pause() : tryPlay(); }
  });
  
  replayBtn.addEventListener('click', e => {
    e.stopPropagation();
    audio.currentTime = 0;
    if (!playing) tryPlay();
  });

  prevBtn.addEventListener('click', e => { e.stopPropagation(); goPrev(); });
  nextBtn.addEventListener('click', e => { e.stopPropagation(); goNext(); });

  audio.addEventListener('play',  () => setState(true));
  audio.addEventListener('pause', () => setState(false));
  audio.addEventListener('ended', () => { setState(false); goNext(); });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration || isNaN(audio.duration)) return;
    progressBar.style.width = (audio.currentTime / audio.duration * 100) + '%';
    trackTime.textContent   = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
  });

  progressWrap.addEventListener('click', function (e) {
    if (!audio.duration || isNaN(audio.duration)) return;
    const r = this.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });

  audio.addEventListener('loadedmetadata', () => {
    trackTime.textContent = '0:00 / ' + fmt(audio.duration);
  });
})();
