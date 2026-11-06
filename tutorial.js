/* Guided tour — twelve stops over the whole site.

   The engine keeps one thing on screen at a time: a dimmed layer with a hole
   clipped around the live target, an accent ring that tracks it every frame,
   and an absolute card placed beside it.  Scene changes are driven by the real
   public surfaces in script.js, sandbox.js and index-page.js; nothing is a
   screenshot.  Every asynchronous step is token-guarded, so pressing Escape or
   skipping mid-transition can never let an old step reopen a sheet or move the
   page after the tour is gone. */

(() => {
  const tour = document.getElementById('tour');
  const block = document.getElementById('tour-block');
  const spot = document.getElementById('tour-spot');
  const panel = document.getElementById('tour-panel');
  const stepLabel = document.getElementById('tour-step');
  const titleEl = document.getElementById('tour-title');
  const textEl = document.getElementById('tour-text');
  const skipBtn = document.getElementById('tour-skip');
  const dotsEl = document.getElementById('tour-dots');
  const backBtn = document.getElementById('tour-back');
  const nextBtn = document.getElementById('tour-next');
  const navMore = document.getElementById('nav-more');
  const navHome = document.getElementById('nav-home');
  if (!tour || !block || !spot || !panel) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : ms));

  /* Waiting must not depend on compositor frames: a throttled or hidden tab
     can withhold requestAnimationFrame indefinitely, which would strand a
     step mid-scene.  Every tick is raced against a short timer. */
  function onTick(fn) {
    let done = false;
    const run = () => { if (!done) { done = true; fn(); } };
    requestAnimationFrame(run);
    setTimeout(run, 40);
  }
  const frame = () => new Promise((resolve) => onTick(resolve));

  const sheetIsOpen = () => !!(window.SciLampSheet && SciLampSheet.isOpen());
  const navMenu = () => document.getElementById('nav-menu');
  const sandbox = () => document.getElementById('sandbox');

  function waitFor(test, alive, timeout = 3200) {
    return new Promise((resolve) => {
      const started = performance.now();
      const tick = () => {
        if (alive && !alive()) { resolve(false); return; }
        let ok = false;
        try { ok = !!test(); } catch { ok = false; }
        if (ok) { resolve(true); return; }
        if (performance.now() - started > timeout) { resolve(false); return; }
        onTick(tick);
      };
      tick();
    });
  }

  function visible(el) {
    if (!el || !el.isConnected || el.closest('[hidden]')) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  }

  async function closeSheet(alive) {
    if (!sheetIsOpen()) return;
    window.SciLampSheet.close();
    await waitFor(() => !sheetIsOpen(), alive, 1800);
  }

  /* ---------- scene helpers ----------
     Each one checks `alive()` before touching the UI and again after every
     wait, so a stale step simply stops instead of fighting the current one. */

  async function goHome(alive) {
    if (!alive()) return;
    await closeSheet(alive);
    if (!alive()) return;
    if (window.SciLampNav) SciLampNav.home();
    await waitFor(() => !document.querySelector('.page.is-open')
      && !(navMenu() && !navMenu().hidden)
      && !window.scilampSandboxOpen, alive, 2600);
  }

  async function showNavMenu(alive) {
    await goHome(alive);
    if (!alive()) return;
    if (window.SciLampNav) SciLampNav.menu(true);
    await waitFor(() => navMenu() && !navMenu().hidden, alive, 1800);
  }

  async function showSettings(alive) {
    await showNavMenu(alive);
    if (!alive()) return;
    if (window.SciLampNav) SciLampNav.settings(true);
    await waitFor(() => visible(document.getElementById('nav-settings')), alive, 1500);
  }

  async function showPage(key, alive) {
    if (!alive()) return;
    await closeSheet(alive);
    if (!alive()) return;
    if (window.scilampSandboxOpen && window.scilampCloseSandbox) window.scilampCloseSandbox();
    if (window.SciLampNav) SciLampNav.page(key);
    await waitFor(() => {
      const page = document.getElementById(`page-${key}`);
      return page && page.classList.contains('is-open');
    }, alive, 3800);
  }

  const showTable = (alive) => showPage('table', alive);

  async function showElementSheet(alive) {
    await showTable(alive);
    if (!alive()) return;
    if (!window.SciLampSheet || sheetIsOpen()) return;
    window.SciLampSheet.openElement(6);
    await waitFor(() => sheetIsOpen()
      && document.getElementById('detail').classList.contains('in')
      && visible(document.querySelector('#detail .facts')), alive, 2400);
  }

  async function showSandbox(alive) {
    if (!alive()) return;
    await closeSheet(alive);
    if (!alive()) return;
    if (window.SciLampNav) SciLampNav.openSandbox();
    await waitFor(() => sandbox() && sandbox().classList.contains('is-open'), alive, 3800);
  }

  /* ---------- the stops ---------- */

  const STEPS = [
    {
      title: 'Welcome to Sci-lamp',
      text: 'A short tour of the whole site: the table, the bench and the notebook. Use Next, Back or the arrow keys. Skip leaves the tour at any time.',
      prepare: goHome,
    },
    {
      title: 'The cover',
      text: 'A large title leads to five pastel cards. Each one opens a different part of the field guide.',
      target: '.cover-grid',
      prepare: goHome,
    },
    {
      title: 'One top bar, four sections',
      text: 'The table, sandbox, nomenclature and index stay one tap away. The current section is marked, so you always know where you are.',
      target: '#topnav-links',
      prepare: goHome,
    },
    {
      title: 'The quiet menu',
      text: 'Tour, help and sensitivity live behind the gear, keeping the main bar calm.',
      target: '#nav-menu',
      prepare: showNavMenu,
    },
    {
      title: 'Sensitivity settings',
      text: 'Turn sets how fast a shape responds to a drag; Zoom sets how strongly the wheel magnifies.',
      target: '#nav-settings',
      prepare: showSettings,
    },
    {
      title: 'Search, filters and the heatmap',
      text: 'Search by name, symbol or atomic number. Category chips filter the lattice without moving the tiles, and the heatmap can shade all 118 elements by a measured property.',
      target: '#tools',
      prepare: showTable,
    },
    {
      title: 'Four arrangements of the same table',
      text: 'The view bar morphs the same 118 tiles between the flat table, a sphere, a helix and a mass-ordered grid. Drag a shape to turn it; scroll to zoom.',
      target: '#arrange',
      prepare: showTable,
    },
    {
      title: 'Open any element',
      text: 'Click a tile for its card: a full description, electron arrangement, oxidation states, safety notes, a Bohr model and its emission spectrum. Escape or the backdrop closes it.',
      target: '.facts',
      prepare: showElementSheet,
    },
    {
      title: 'The bench takes any number of atoms',
      text: 'In Sandbox mode, tap a palette element to add one atom or drag it onto the bench. The steppers change the count. Combine resolves the whole mixture; the note underneath explains the charges and the ratio.',
      target: '#sb-workspace',
      prepare: showSandbox,
    },
    {
      title: 'My products keeps everything',
      text: 'Every successful product is saved automatically to this shelf. Open a saved product for its full card, remove one, or clear the shelf — clearing asks for a second press.',
      target: '#sb-shelf',
      prepare: showSandbox,
    },
    {
      title: 'The compound index',
      text: 'Discoveries appear in pastel with names and formulas, while the rest stay ghosted behind hints and a progress meter. It updates the moment the bench makes something new.',
      target: '#index-grid',
      prepare: (alive) => showPage('index', alive),
    },
    {
      title: 'The nomenclature notebook',
      text: 'Open the handbook one rule at a time, or practise with a short guided path. Both remember progress. That is the whole site — reopen the tour from the gear menu any time.',
      target: '.nom-choices',
      prepare: (alive) => showPage('nom', alive),
    },
  ];

  /* ---------- state ---------- */

  let open = false;
  let current = 0;
  let token = 0;
  let currentTarget = null;
  let currentRect = null;
  let focusIntent = 'panel';
  let closeTimer = 0;
  let autoTimer = 0;
  let placeTimer = 0;
  let placedRect = null;
  let placedHeight = 0;

  const hole = { x: 0, y: 0, w: 0, h: 0, on: false };

  /* ---------- geometry ---------- */

  function rawRect(el) {
    if (!el || !el.isConnected) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return null;
    return rect;
  }

  function holeRect(rect) {
    const inset = 8;
    const pad = 10;
    const left = rect.left - pad;
    const top = rect.top - pad;
    const right = rect.right + pad;
    const bottom = rect.bottom + pad;
    if (right <= inset || bottom <= inset || left >= innerWidth - inset || top >= innerHeight - inset) return null;
    const x = clamp(left, inset, innerWidth - inset);
    const y = clamp(top, inset, innerHeight - inset);
    const w = clamp(right, inset, innerWidth - inset) - x;
    const h = clamp(bottom, inset, innerHeight - inset) - y;
    if (w < 4 || h < 4) return null;
    return { left: x, top: y, width: w, height: h };
  }

  function onScreen(rect) {
    return !!rect && rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight;
  }

  function clearHole() {
    if (!hole.on && !tour.classList.contains('has-target')) return;
    hole.on = false;
    block.style.setProperty('--hw', '0px');
    block.style.setProperty('--hh', '0px');
    tour.classList.remove('has-target');
  }

  function setHole(rect) {
    const x = Math.round(rect.left);
    const y = Math.round(rect.top);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w < 4 || h < 4) { clearHole(); return; }
    if (!hole.on || x !== hole.x || y !== hole.y || w !== hole.w || h !== hole.h) {
      hole.x = x; hole.y = y; hole.w = w; hole.h = h; hole.on = true;
      block.style.setProperty('--hx', `${x}px`);
      block.style.setProperty('--hy', `${y}px`);
      block.style.setProperty('--hw', `${w}px`);
      block.style.setProperty('--hh', `${h}px`);
      spot.style.transform = `translate(${x}px, ${y}px)`;
      spot.style.width = `${w}px`;
      spot.style.height = `${h}px`;
    }
    tour.classList.add('has-target');
  }

  /* one read per frame, writes only when the numbers actually move */
  let trackQueued = false;

  function track() {
    if (!open) return;

    /* read phase: target geometry and the card height in one batch, before
       any write can force a reflow */
    let next = null;
    if (currentTarget && currentTarget.isConnected) {
      const rect = rawRect(currentTarget);
      if (rect) next = holeRect(rect);
    }
    const cardHeight = panel.offsetHeight;

    currentRect = next;
    if (next) setHole(next); else clearHole();

    /* late layout (fonts, wrapping) can move the target or resize the card
       after placement; re-place once it has been still for a moment */
    const moved = next && placedRect && (
      Math.abs(next.left - placedRect.left) > 2
      || Math.abs(next.top - placedRect.top) > 2
      || Math.abs(next.width - placedRect.width) > 2
      || Math.abs(next.height - placedRect.height) > 2
    );
    const resized = placedHeight > 0 && Math.abs(cardHeight - placedHeight) > 1;
    if (moved || resized) {
      window.clearTimeout(placeTimer);
      placeTimer = window.setTimeout(() => {
        placeTimer = 0;
        if (open) placePanel(currentRect);
      }, 160);
    }

    scheduleTrack();
  }

  function scheduleTrack() {
    if (trackQueued) return;
    trackQueued = true;
    let ran = false;
    const run = () => {
      if (ran) return;
      ran = true;
      trackQueued = false;
      track();
    };
    requestAnimationFrame(run);
    setTimeout(run, 90);
  }

  function startTrack() {
    scheduleTrack();
  }

  async function settleTarget(el, alive) {
    let last = null;
    let steady = 0;
    const started = performance.now();
    while (performance.now() - started < 2200) {
      if (!alive()) return null;
      const rect = rawRect(el);
      if (rect) {
        const same = last
          && Math.abs(rect.left - last.left) < 0.75
          && Math.abs(rect.top - last.top) < 0.75
          && Math.abs(rect.width - last.width) < 0.75
          && Math.abs(rect.height - last.height) < 0.75;
        steady = same ? steady + 1 : 0;
        if (steady >= 3) return rect;
        last = rect;
      } else {
        last = null;
        steady = 0;
      }
      await frame();
    }
    return rawRect(el);
  }

  /* ---------- panel ---------- */

  function paintPanel() {
    const step = STEPS[current];
    stepLabel.textContent = `Step ${current + 1} of ${STEPS.length}`;
    titleEl.textContent = step.title;
    textEl.textContent = step.text;
    dotsEl.innerHTML = STEPS.map((_, i) => `<span class="tour-dot${i === current ? ' is-on' : ''}"></span>`).join('');
    backBtn.disabled = current === 0;
    nextBtn.textContent = current === STEPS.length - 1 ? 'Finish' : 'Next';
    skipBtn.textContent = 'Skip tour';
  }

  function overlaps(a, b) {
    const x = Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left));
    const y = Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));
    return x * y;
  }

  function placePanel(rect) {
    placedRect = rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null;
    const width = panel.offsetWidth || 380;
    const height = panel.offsetHeight || 220;
    placedHeight = height;
    const vw = innerWidth;
    const vh = innerHeight;
    const margin = 16;
    const gap = 18;

    if (vw <= 720) {
      const left = 12;
      const top = rect && rect.top + rect.height / 2 > vh * 0.54
        ? margin
        : Math.max(margin, vh - height - margin);
      panel.style.left = `${left}px`;
      panel.style.top = `${Math.round(top)}px`;
      panel.style.setProperty('--panel-origin', top === margin ? '50% 0%' : '50% 100%');
      return;
    }

    if (!rect) {
      panel.style.left = `${Math.round((vw - width) / 2)}px`;
      panel.style.top = `${Math.round((vh - height) / 2)}px`;
      panel.style.setProperty('--panel-origin', '50% 50%');
      return;
    }

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const sides = [
      { x: cx - width / 2, y: rect.top + rect.height + gap, origin: '50% 0%' },
      { x: cx - width / 2, y: rect.top - height - gap, origin: '50% 100%' },
      { x: rect.left + rect.width + gap, y: cy - height / 2, origin: '0% 50%' },
      { x: rect.left - width - gap, y: cy - height / 2, origin: '100% 50%' },
    ];

    let best = null;
    sides.forEach((side) => {
      const x = clamp(side.x, margin, Math.max(margin, vw - width - margin));
      const y = clamp(side.y, margin, Math.max(margin, vh - height - margin));
      const moved = Math.abs(x - side.x) + Math.abs(y - side.y);
      const covered = overlaps({ left: x, top: y, width, height }, rect);
      const score = (covered > 0.5 ? 1e9 : 0) + covered * 10 + moved;
      if (!best || score < best.score) {
        best = { x, y, origin: side.origin, score };
      }
    });

    panel.style.left = `${Math.round(best.x)}px`;
    panel.style.top = `${Math.round(best.y)}px`;
    panel.style.setProperty('--panel-origin', best.origin);
  }

  /* ---------- focus ---------- */

  function tourFocusables() {
    return [skipBtn, backBtn, nextBtn]
      .filter((btn) => btn && !btn.disabled && btn.getClientRects().length);
  }

  function restoreFocus() {
    const wanted = { next: nextBtn, back: backBtn, skip: skipBtn }[focusIntent] || panel;
    const target = wanted && wanted.getClientRects().length ? wanted : panel;
    target.focus({ preventScroll: true });
  }

  function focusAfterFinish() {
    const local = document.querySelector('#sandbox.is-open #sb-help')
      || document.querySelector('.topnav-link.is-active')
      || navMore
      || navHome;
    if (local && local.getClientRects().length) local.focus({ preventScroll: true });
  }

  /* ---------- keyboard ---------- */

  function stepBy(delta) {
    if (!tour.classList.contains('is-ready')) return;
    if (delta > 0) {
      if (current >= STEPS.length - 1) { finish(true); return; }
      focusIntent = 'next';
      enter(current + 1);
      return;
    }
    if (current <= 0) return;
    focusIntent = 'back';
    enter(current - 1);
  }

  function onKey(event) {
    if (!open) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      finish(true);
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      if (!tour.classList.contains('is-ready')) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      stepBy(event.key === 'ArrowRight' ? 1 : -1);
      return;
    }

    if (event.key !== 'Tab') return;

    const active = document.activeElement;
    const items = tourFocusables();
    if (!tour.contains(active)) {
      event.preventDefault();
      if (tour.classList.contains('is-ready') && items.length) items[0].focus({ preventScroll: true });
      return;
    }
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  /* ---------- entering a step ---------- */

  async function enter(index) {
    if (!open) return;
    const my = ++token;
    const alive = () => open && my === token;
    const startedAt = performance.now();
    const wasReady = tour.classList.contains('is-ready');
    current = index;

    currentTarget = null;
    currentRect = null;
    placedRect = null;
    window.clearTimeout(placeTimer);
    placeTimer = 0;
    tour.classList.remove('is-ready', 'is-solo', 'has-target');
    tour.classList.add('is-scene');
    clearHole();

    const step = STEPS[index];
    if (step.prepare) await step.prepare(alive);
    if (!alive()) return;

    currentTarget = step.target ? document.querySelector(step.target) : null;
    if (currentTarget && !visible(currentTarget)) {
      await waitFor(() => visible(currentTarget), alive, 1400);
      if (!alive()) return;
      if (!visible(currentTarget)) currentTarget = null;
    }

    let rect = null;
    if (currentTarget) {
      const scrollTo = (behavior) => {
        try {
          currentTarget.scrollIntoView({ block: 'center', inline: 'nearest', behavior });
        } catch {
          currentTarget.scrollIntoView();
        }
      };
      scrollTo(reduceMotion ? 'auto' : 'smooth');
      rect = await settleTarget(currentTarget, alive);
      if (!alive()) return;
      /* a throttled tab can withhold the smooth-scroll animation; if the
         target never arrived, repeat the centring without animation */
      if (!onScreen(rect)) {
        scrollTo('auto');
        rect = await settleTarget(currentTarget, alive);
        if (!alive()) return;
      }
    }
    if (!alive()) return;

    if (rect) {
      const next = holeRect(rect);
      if (next) {
        currentRect = next;
        setHole(next);
        tour.classList.remove('is-solo');
      } else {
        rect = null;
      }
    }

    if (!rect) {
      currentTarget = null;
      currentRect = null;
      clearHole();
      tour.classList.add('is-solo');
    }

    /* give the old card time to finish leaving before the new one appears */
    if (wasReady && !reduceMotion) {
      const elapsed = performance.now() - startedAt;
      if (elapsed < 190) {
        await pause(190 - elapsed);
        if (!alive()) return;
      }
    }

    paintPanel();
    placePanel(currentRect);
    tour.classList.remove('is-scene');
    tour.classList.add('is-ready');
    await frame();
    if (alive()) restoreFocus();
  }

  /* ---------- start / finish ---------- */

  function start() {
    if (open) return;

    if (autoTimer) { clearTimeout(autoTimer); autoTimer = 0; }
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = 0; }

    open = true;
    window.scilampTutorialOpen = true;
    current = 0;
    currentTarget = null;
    currentRect = null;
    focusIntent = 'panel';

    tour.hidden = false;
    tour.classList.remove('is-ready', 'is-solo', 'has-target', 'is-closing');
    tour.classList.add('is-open', 'is-scene');
    tour.setAttribute('aria-hidden', 'false');
    clearHole();

    panel.tabIndex = -1;
    textEl.setAttribute('aria-live', 'polite');
    textEl.setAttribute('aria-atomic', 'true');

    body.classList.add('tour-open');
    document.addEventListener('keydown', onKey, true);
    startTrack();
    enter(0);
  }

  function finish(markDone) {
    if (!open) return;
    open = false;
    window.scilampTutorialOpen = false;
    token += 1;

    const hadSheet = sheetIsOpen();
    if (markDone && window.SciLampStore) SciLampStore.setTutorialDone();

    document.removeEventListener('keydown', onKey, true);
    window.clearTimeout(placeTimer);
    placeTimer = 0;

    const active = document.activeElement;
    if (active && tour.contains(active) && typeof active.blur === 'function') active.blur();

    currentTarget = null;
    currentRect = null;
    clearHole();
    tour.classList.remove('is-ready', 'is-scene', 'is-solo', 'has-target');
    tour.classList.add('is-closing');
    tour.setAttribute('aria-hidden', 'true');
    body.classList.remove('tour-open');

    if (hadSheet) window.SciLampSheet.close();

    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      closeTimer = 0;
      tour.hidden = true;
      tour.classList.remove('is-open', 'is-closing');
      if (!hadSheet) focusAfterFinish();
    }, reduceMotion ? 0 : 190);
  }

  /* ---------- wiring ---------- */

  nextBtn.addEventListener('click', () => {
    if (current >= STEPS.length - 1) finish(true);
    else { focusIntent = 'next'; enter(current + 1); }
  });

  backBtn.addEventListener('click', () => {
    if (current > 0) { focusIntent = 'back'; enter(current - 1); }
  });

  skipBtn.addEventListener('click', () => finish(true));

  /* the overlay owns the wheel; the card may still scroll its own copy */
  function blockScroll(event) {
    if (panel.contains(event.target)) return;
    event.preventDefault();
  }
  tour.addEventListener('wheel', blockScroll, { passive: false });
  tour.addEventListener('touchmove', blockScroll, { passive: false });

  function onResize() {
    if (!open) return;
    if (currentTarget && currentTarget.isConnected) {
      const rect = rawRect(currentTarget);
      if (rect) {
        const next = holeRect(rect);
        currentRect = next;
        if (next) setHole(next); else clearHole();
        placePanel(next);
        return;
      }
    }
    placePanel(null);
  }
  window.addEventListener('resize', onResize);

  /* web fonts and wrapping can change the card's height after it has been
     placed; re-place on any size change so the gap never drifts */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (open && currentRect) placePanel(currentRect);
    });
  }
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      if (open && currentRect) placePanel(currentRect);
    }).observe(panel);
  }

  window.scilampStartTutorial = start;

  /* first visit only: a quiet delay, never interrupts a hidden tab */
  if (window.SciLampStore && !SciLampStore.tutorialDone()) {
    autoTimer = window.setTimeout(() => {
      autoTimer = 0;
      if (document.hidden || open || SciLampStore.tutorialDone()) return;
      start();
    }, 1800);
  }
})();
