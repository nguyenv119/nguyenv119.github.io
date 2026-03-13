(function () {
  const audio        = document.getElementById('audio');
  const wrap         = document.getElementById('cassetteWrap');
  const replayBtn    = document.getElementById('replaySvgBtn');
  const progressWrap = document.getElementById('progressWrap');
  const progressBar  = document.getElementById('progressBar');
  const trackName    = document.getElementById('trackName');
  const trackTime    = document.getElementById('trackTime');

  let playing = false;

  function fmt(s) {
    if (!s || !isFinite(s)) return '';
    return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  function hasSrc() {
    const src = audio.currentSrc || audio.querySelector('source')?.src || '';
    return src.length > 0 && src !== window.location.href;
  }

  function setState(state) {
    playing = state;
    wrap.classList.toggle('playing', state);
    wrap.setAttribute('aria-label', state ? 'Pause music' : 'Play music');
  }

  function tryPlay() {
    if (!hasSrc()) return;
    audio.play()
      .then(() => setState(true))
      .catch(() => setState(false));
  }

  function pause() { audio.pause(); setState(false); }

  wrap.addEventListener('click', () => playing ? pause() : tryPlay());

  wrap.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); playing ? pause() : tryPlay(); }
  });

  replayBtn.addEventListener('click', e => {
    e.stopPropagation();
    audio.currentTime = 0;
    if (!playing) tryPlay();
  });

  audio.addEventListener('play',  () => setState(true));
  audio.addEventListener('pause', () => setState(false));
  audio.addEventListener('ended', () => setState(false));

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

  audio.addEventListener('canplay', () => { if (!playing) tryPlay(); }, { once: true });
})();
