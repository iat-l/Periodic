/* Guided tour — thirteen stops over the whole site.
   The tour drives the real UI through the public surfaces exposed by script.js,
   sandbox.js and index-page.js, so every stop shows the live component rather
   than a slideshow. Completion is stored by SciLampStore. */

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
  const menuTab = document.getElementById('menu-tab');
  const drawerBtn = document.getElementById('drawer-tutorial');
  if (!tour || !panel) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : ms));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function waitForVisible(selector, timeout = 3200) {
    return new Promise((resolve) => {
      const started = performance.now();
      const tick = () => {
        const el = document.querySelector(selector);
        if (el && el.getClientRects().length) { resolve(el); return; }
        if (performance.now() - started > timeout) { resolve(null); return; }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  /* ---------- navigation helpers ---------- */

  async function goHome() {
    if (window.SciLampSheet && SciLampSheet.isOpen()) SciLampSheet.close();
    await wait(340);
    if (!open) return;
    if (window.SciLampNav) SciLampNav.home();
    await wait(700);
  }

  async function showDrawer() {
    await goHome();
    if (!open) return;
    if (window.SciLampNav) SciLampNav.drawer(true);
    await waitForVisible('#drawer.is-open');
    await wait(160);
  }

  async function showSettings() {
    await showDrawer();
    if (!open) return;
    if (window.SciLampNav) SciLampNav.settings(true);
    await waitForVisible('#drawer-settings:not([hidden])');
    await wait(120);
  }

  async function showTable() {
    if (window.SciLampSheet && SciLampSheet.isOpen()) SciLampSheet.close();
    await wait(320);
    if (!open) return;
    if (window.SciLampNav) SciLampNav.page('table');
    await waitForVisible('#page-table.is-open');
    await wait(720);
  }

  async function showElementSheet() {
    await showTable();
    if (!open) return;
    if (window.SciLampSheet) SciLampSheet.openElement(6);
    await waitForVisible('#detail.is-open .facts');
    await wait(700);
  }

  async function showSandbox() {
    if (window.SciLampSheet && SciLampSheet.isOpen()) SciLampSheet.close();
    await wait(340);
    if (!open) return;
    if (window.SciLampNav) SciLampNav.openSandbox();
    await waitForVisible('#sandbox.is-open');
    await wait(160);
  }

  async function showIndex() {
    if (window.SciLampSheet && SciLampSheet.isOpen()) SciLampSheet.close();
    await wait(320);
    if (!open) return;
    if (window.SciLampNav) SciLampNav.page('index');
    await waitForVisible('#page-index.is-open');
    await wait(720);
  }

  async function showNom() {
    if (window.SciLampSheet && SciLampSheet.isOpen()) SciLampSheet.close();
    await wait(320);
    if (!open) return;
    if (window.SciLampNav) SciLampNav.page('nom');
    await waitForVisible('#page-nom.is-open');
    await wait(720);
  }

  /* ---------- the stops ---------- */

  const STEPS = [
    {
      title: 'Welcome to Sci-lamp',
      text: 'A short tour of the whole site: the lamp, the table, the bench and the notebook. Use Next, Back or the arrow keys. Skip leaves the tour at any time.',
      prepare: goHome,
    },
    {
      title: 'One cord, one switch',
      text: 'The floor lamp is the only switch. Drag the cord all the way down and let go — the room lights up with a random shade each time.',
      target: '#pull-button',
      prepare: goHome,
    },
    {
      title: 'The menu lives in the corner',
      text: 'Every page is reached from this tab. Open it whenever you need a section, the settings or this tour again.',
      target: '#menu-tab',
      prepare: goHome,
    },
    {
      title: 'Four ways in',
      text: 'The menu holds the Periodic Table, Nomenclature & Formula Writing, the Compound Index and the Tutorial. Settings unfold in place below them.',
      target: '#drawer-nav',
      prepare: showDrawer,
    },
    {
      title: 'Sensitivity settings',
      text: 'Turn sets how fast a shape responds to a drag; Zoom sets how strongly the wheel magnifies. Both apply immediately.',
      target: '#drawer-settings',
      prepare: showSettings,
    },
    {
      title: 'The lamp repaints the site',
      text: 'Amber, rose, moss and ice recolour every page, card and button. The small cord at the foot of the panel is the way back to the lamp.',
      target: '#schemes',
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
      text: 'The liquid bar morphs the same 118 tiles between the flat table, a sphere, a helix and a mass-ordered grid. Drag a shape to turn it; scroll to zoom.',
      target: '#goo-nav',
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
      text: 'Discoveries light up here with their names and formulas, while the rest stay hidden behind hints and a progress meter. It updates the moment the bench makes something new.',
      target: '#index-grid',
      prepare: showIndex,
    },
    {
      title: 'The nomenclature notebook',
      text: 'Two ways to learn: browse the handbook of naming and formula rules, or work through short guided paths. Both remember progress on this device.',
      target: '.nom-choices',
      prepare: showNom,
    },
    {
      title: 'That is the whole site',
      text: 'Restart this tour any time from Menu → Tutorial. Everything you discover and save stays in this browser — no account, no server.',
      prepare: goHome,
    },
  ];

  /* ---------- state ---------- */

  let open = false;
  let current = 0;
  let token = 0;
  let currentTarget = null;
  let layoutRAF = 0;

  const clampPanel = (value, size, margin) => clamp(value, margin, Math.max(margin, innerWidth - size - margin));

  function paintPanel() {
    const step = STEPS[current];
    stepLabel.textContent = `step ${current + 1} of ${STEPS.length}`;
    titleEl.textContent = step.title;
    textEl.textContent = step.text;
    dotsEl.innerHTML = STEPS.map((s, i) => `<span class="tour-dot${i === current ? ' is-on' : ''}"></span>`).join('');
    backBtn.disabled = current === 0;
    nextBtn.textContent = current === STEPS.length - 1 ? 'finish' : 'next';
    skipBtn.textContent = 'skip tour';
  }

  function placePanel(rect) {
    panel.style.top = 'auto';
    panel.style.left = 'auto';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';

    const w = panel.offsetWidth || 380;
    const h = panel.offsetHeight || 220;
    const margin = 12;

    if (innerWidth <= 720) {
      panel.style.left = '12px';
      panel.style.right = '12px';
      panel.style.bottom = '12px';
      return;
    }

    if (!rect) {
      panel.style.left = `${Math.round((innerWidth - w) / 2)}px`;
      panel.style.top = `${Math.round((innerHeight - h) / 2)}px`;
      return;
    }

    const gap = 16;
    let top;
    if (innerHeight - rect.bottom >= h + gap * 2) top = rect.bottom + gap;
    else if (rect.top >= h + gap * 2) top = rect.top - h - gap;
    else top = clamp(rect.bottom + gap, margin, innerHeight - h - margin);

    panel.style.left = `${Math.round(clampPanel(rect.left + rect.width / 2 - w / 2, w, margin))}px`;
    panel.style.top = `${Math.round(clamp(top, margin, Math.max(margin, innerHeight - h - margin)))}px`;
  }

  function layout() {
    layoutRAF = 0;
    if (!open) return;

    if (!currentTarget || !document.contains(currentTarget)) {
      tour.classList.add('is-solo');
      spot.hidden = true;
      placePanel(null);
      return;
    }

    const r = currentTarget.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) {
      tour.classList.add('is-solo');
      spot.hidden = true;
      placePanel(null);
      return;
    }

    tour.classList.remove('is-solo');
    spot.hidden = false;

    const pad = 8;
    const left = Math.max(4, r.left - pad);
    const top = Math.max(4, r.top - pad);
    const width = Math.min(innerWidth - left - 4, r.width + pad * 2);
    const height = Math.min(innerHeight - top - 4, r.height + pad * 2);

    spot.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    spot.style.width = `${Math.round(width)}px`;
    spot.style.height = `${Math.round(height)}px`;

    placePanel({ left, top, width, height, bottom: top + height });
  }

  function scheduleLayout() {
    if (!open || layoutRAF) return;
    layoutRAF = requestAnimationFrame(layout);
  }

  async function enter(index) {
    const my = ++token;
    current = index;
    paintPanel();

    const step = STEPS[index];
    if (step.prepare) await step.prepare();
    if (my !== token || !open) return;

    currentTarget = step.target ? document.querySelector(step.target) : null;
    if (currentTarget) {
      currentTarget.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
      await wait(360);
      if (my !== token || !open) return;
    }

    layout();
    /* a second pass catches late layout (fonts, drawer slide, sheet animation) */
    setTimeout(() => { if (my === token && open) layout(); }, 220);
  }

  function go(delta) {
    const next = clamp(current + delta, 0, STEPS.length - 1);
    if (next === current) return;
    enter(next);
    nextBtn.focus({ preventScroll: true });
  }

  function finish(markDone) {
    if (!open) return;
    open = false;
    token += 1;
    window.scilampTutorialOpen = false;

    if (markDone && window.SciLampStore) SciLampStore.setTutorialDone();

    const hadSheet = window.SciLampSheet && SciLampSheet.isOpen();
    if (hadSheet) SciLampSheet.close();

    tour.classList.remove('is-open', 'is-solo');
    tour.hidden = true;
    tour.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tour-open');
    currentTarget = null;
    spot.hidden = true;

    setTimeout(() => {
      if (menuTab && menuTab.getClientRects().length) menuTab.focus({ preventScroll: true });
    }, hadSheet ? 340 : 0);
  }

  function start() {
    if (open) return;
    open = true;
    window.scilampTutorialOpen = true;
    current = 0;
    currentTarget = null;

    tour.hidden = false;
    tour.setAttribute('aria-hidden', 'false');
    tour.classList.add('is-open');
    document.body.classList.add('tour-open');
    spot.hidden = true;

    panel.setAttribute('tabindex', '-1');
    textEl.setAttribute('aria-live', 'polite');
    panel.focus({ preventScroll: true });
    enter(0);
  }

  nextBtn.addEventListener('click', () => {
    if (current === STEPS.length - 1) finish(true);
    else go(1);
  });

  backBtn.addEventListener('click', () => go(-1));
  skipBtn.addEventListener('click', () => finish(true));

  tour.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      finish(true);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (current === STEPS.length - 1) finish(true);
      else go(1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (current > 0) go(-1);
      return;
    }
    if (event.key !== 'Tab') return;

    const items = [skipBtn, backBtn, nextBtn].filter((b) => !b.disabled && b.getClientRects().length);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];

    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel || !tour.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !tour.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('resize', scheduleLayout);
  document.addEventListener('scroll', scheduleLayout, true);

  if (drawerBtn) {
    drawerBtn.addEventListener('click', () => start());
  }

  window.scilampStartTutorial = start;

  /* first visit only: a quiet delay, never interrupts a hidden tab */
  if (window.SciLampStore && !SciLampStore.tutorialDone()) {
    setTimeout(() => {
      if (document.hidden || open || SciLampStore.tutorialDone()) return;
      start();
    }, 1800);
  }
})();
