/* First-load chemistry loader: the counter fills the electron shells, the veil
   fades, then the cover replays its entrance. The head adds .intro-on before
   paint and owns a watchdog so a failure here can never trap the page. */

(() => {
  const root = document.documentElement;
  const veil = document.getElementById('intro-veil');
  if (!veil) {
    root.classList.remove('intro-on');
    return;
  }
  if (!root.classList.contains('intro-on')) {
    veil.remove();
    return;
  }

  const tr = (en, zh) => window.SciLampI18n?.t(en, zh) ?? en;
  const stageEl = document.getElementById('intro-stage');
  const percentEl = document.getElementById('intro-percent');
  const configEl = document.getElementById('intro-config');
  const cover = document.getElementById('cover');
  const tokens = configEl ? [...configEl.querySelectorAll('span')] : [];

  const STAGES = [
    [0, tr('Filling the K shell', '填充 K 電子層')],
    [0.34, tr('Filling the L shell', '填充 L 電子層')],
    [0.68, tr('Filling the M shell', '填充 M 電子層')],
  ];

  const COUNT_MS = 1500;
  const HOLD_CAP_MS = 1200;
  const SETTLE_MS = 320;
  const startedAt = performance.now();
  let stageIndex = -1;
  let finished = false;

  /* the entrance waits behind the veil, then starts on the fade */
  cover?.classList.remove('is-entering');

  function paint(value, progress) {
    veil.style.setProperty('--intro-progress', String(value));
    if (percentEl) percentEl.textContent = String(Math.round(value * 100)).padStart(3, '0');
    tokens.forEach((token, index) => {
      token.classList.toggle('is-on', progress >= (index + 1) / tokens.length);
    });

    let next = 0;
    STAGES.forEach(([at], index) => {
      if (progress >= at) next = index;
    });
    if (next !== stageIndex) {
      stageIndex = next;
      if (stageEl) stageEl.textContent = STAGES[next][1];
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    paint(1, 1);
    if (stageEl) stageEl.textContent = tr('Electron arrangement ready', '電子排布完成');

    veil.classList.add('is-done');
    root.classList.add('intro-done');
    document.dispatchEvent(new CustomEvent('scilamp:intro-done'));

    if (cover) {
      cover.classList.remove('is-entering');
      void cover.offsetWidth;
      cover.classList.add('is-entering');
    }

    window.setTimeout(() => {
      veil.remove();
      root.classList.remove('intro-on');
    }, 640);
    window.setTimeout(() => root.classList.remove('intro-done'), 1600);
  }

  function settle() {
    if (finished) return;
    const from = 0.92;
    const at = performance.now();
    const step = (now) => {
      const t = Math.min((now - at) / SETTLE_MS, 1);
      paint(from + (1 - from) * t, 1);
      if (t < 1) requestAnimationFrame(step);
      else finish();
    };
    requestAnimationFrame(step);
  }

  function waitForLoad() {
    if (document.readyState === 'complete') {
      settle();
      return;
    }
    let timer = 0;
    const settleNow = () => {
      window.clearTimeout(timer);
      window.removeEventListener('load', settleNow);
      settle();
    };
    window.addEventListener('load', settleNow, { once: true });
    timer = window.setTimeout(() => {
      window.removeEventListener('load', settleNow);
      settle();
    }, HOLD_CAP_MS);
  }

  function count(now) {
    if (finished) return;
    const t = Math.min((now - startedAt) / COUNT_MS, 1);
    const eased = 1 - Math.pow(1 - t, 2.6);
    paint(eased * 0.92, eased);
    if (t < 1) requestAnimationFrame(count);
    else waitForLoad();
  }

  requestAnimationFrame(count);
})();
