/* The specimen rail: a slow, seamless pass through a spread of elements.
   Decorative by design — the rail is aria-hidden, the table link above it
   is the only interactive part. */

(() => {
  const track = document.getElementById('rail-track');
  const section = document.querySelector('.cover-banner');
  const drift = document.querySelector('.rail-drift');
  const cover = document.getElementById('cover');
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const RAIL = [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 22, 24, 26, 29, 30, 35, 47, 50, 53, 54, 79, 80, 82, 92];

  if (track) {
    const rows = RAIL.map((num) => ELEMENTS[num - 1]).filter(Boolean);

    const tile = (row) => {
      const [num, sym, , cat, , , mass] = row;
      return `<article class="rail-tile" data-cat="${cat}">
        <span class="rail-tile-top"><span class="rail-num">${String(num).padStart(3, '0')}</span><span class="rail-dot" aria-hidden="true"></span></span>
        <span class="rail-sym">${sym}</span>
        <span class="rail-foot"><span class="rail-name" data-sym="${sym}">${SciLampI18n.elementName(row)}</span><span class="rail-mass">${mass}</span></span>
      </article>`;
    };

    const group = () => `<div class="rail-group">${rows.map(tile).join('')}</div>`;
    track.innerHTML = group() + group();

    const paintNames = () => {
      track.querySelectorAll('.rail-name').forEach((node) => {
        const row = ELEMENTS.find((entry) => entry[1] === node.dataset.sym);
        if (row) node.textContent = SciLampI18n.elementName(row);
      });
    };
    document.addEventListener('scilamp:lang', paintNames);

    const measure = () => {
      const strip = track.querySelector('.rail-group');
      if (!strip) return;
      const width = strip.getBoundingClientRect().width;
      if (!width) return;
      const seconds = Math.min(240, Math.max(90, Math.round(width / 36)));
      track.style.setProperty('--rail-duration', `${seconds}s`);
    };
    requestAnimationFrame(() => {
      measure();
      track.classList.add('is-running');
    });
    window.addEventListener('resize', measure, { passive: true });

    let inView = true;
    const syncPaused = () => {
      track.classList.toggle('is-paused', !inView || document.hidden);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
        syncPaused();
      }, { threshold: 0 }).observe(section);
    }
    document.addEventListener('visibilitychange', syncPaused);

    if (drift && section && !motionQuery.matches) {
      let frame = 0;
      const update = () => {
        frame = 0;
        if (motionQuery.matches) {
          drift.style.setProperty('--rail-shift', '0px');
          return;
        }
        const view = (cover || document.documentElement).getBoundingClientRect();
        const rect = section.getBoundingClientRect();
        if (!rect.height || rect.bottom < view.top - 200 || rect.top > view.bottom + 200) return;
        const progress = (view.top + view.bottom - rect.top - rect.bottom) / Math.max(view.height, 1);
        const shift = Math.max(-30, Math.min(30, -progress * 34));
        drift.style.setProperty('--rail-shift', `${shift.toFixed(1)}px`);
      };
      const request = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      cover?.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request, { passive: true });
      update();
    }
  }
})();
