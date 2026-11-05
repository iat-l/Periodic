const room = document.getElementById('room');
const light = document.querySelector('.light');
const pull = document.getElementById('pull');
const pullButton = document.getElementById('pull-button');
const cord = document.querySelector('.pull-cord');
const tab = document.querySelector('.pull-tab');

const REST = 78;        /* cord hanging length, px */
const MAX_REACH = 132;  /* hard stop at the end of the cord */
const FIRE_AT = 126;    /* the switch trips here */

const GRAVITY = 1800;
const ROPE_K = 700;
const AIR_DRAG = 4.0;

/* gravity stretches the cord a little, so true rest sits just below REST */
const EQUILIBRIUM = REST + GRAVITY / ROPE_K;

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let pos = { x: 0, y: EQUILIBRIUM };
let vel = { x: 0, y: 0 };
let pivotRect = null;
let dragging = false;
let stretchedTo = false;
let lastMove = { x: 0, y: EQUILIBRIUM, t: 0 };
let rafId = null;
let lastFrame = 0;

function flicker() {
  light.classList.remove('flick');
  void light.offsetWidth;
  light.classList.add('flick');
}

function isLit() {
  return room.classList.contains('is-lit');
}

function turnOn() {
  room.classList.add('is-lit');
  pullButton.setAttribute('aria-pressed', 'true');
  pullButton.setAttribute('aria-label', 'Pull the cord to the end to switch the lamp off');
  flicker();
}

/* nothing here rewrites visible copy: the fading text must not change mid-fade */
function turnOff() {
  room.classList.remove('is-lit');
  pullButton.setAttribute('aria-pressed', 'false');
  pullButton.setAttribute('aria-label', 'Pull the cord to the end to turn the lamp on');
}

function toggle() {
  isLit() ? turnOff() : turnOn();
}

/* ---------- drawing ---------- */

function render() {
  cord.setAttribute('x2', pos.x);
  cord.setAttribute('y2', pos.y);
  tab.setAttribute('cx', pos.x);
  tab.setAttribute('cy', pos.y);
  pullButton.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
}

function clampReach(x, y) {
  const d = Math.hypot(x, y);
  if (d <= MAX_REACH) return { x, y };
  const k = MAX_REACH / d;
  return { x: x * k, y: y * k };
}

/* ---------- physics ---------- */

function settle() {
  pos = { x: 0, y: EQUILIBRIUM };
  vel = { x: 0, y: 0 };
  pull.classList.remove('armed');
  render();
}

function simulate(now) {
  const dt = Math.min(0.032, (now - lastFrame) / 1000 || 0.016);
  lastFrame = now;

  const d = Math.hypot(pos.x, pos.y);
  let ax = 0;
  let ay = GRAVITY;

  if (d > REST) {
    const tension = (-ROPE_K * (d - REST)) / d;
    ax += tension * pos.x;
    ay += tension * pos.y;
  }

  ax -= vel.x * AIR_DRAG;
  ay -= vel.y * AIR_DRAG;

  vel.x += ax * dt;
  vel.y += ay * dt;
  pos.x += vel.x * dt;
  pos.y += vel.y * dt;

  const stretched = Math.hypot(pos.x, pos.y);
  if (stretched > MAX_REACH) {
    const hard = clampReach(pos.x, pos.y);
    pos = hard;
    vel.x *= 0.4;
    vel.y *= 0.4;
  }

  render();

  const settled = Math.abs(pos.x) < 0.5 && Math.abs(pos.y - EQUILIBRIUM) < 0.5 && Math.hypot(vel.x, vel.y) < 8;
  if (settled) {
    rafId = null;
    settle();
    return;
  }
  rafId = requestAnimationFrame(simulate);
}

function release() {
  dragging = false;
  pull.classList.remove('armed');

  /* the switch trips on letting go, never mid-stretch */
  if (stretchedTo) {
    stretchedTo = false;
    toggle();
  }

  if (reducedMotion) { settle(); return; }

  cancelAnimationFrame(rafId);
  lastFrame = performance.now();
  rafId = requestAnimationFrame(simulate);
}

/* ---------- dragging ---------- */

pullButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  cancelAnimationFrame(rafId);
  rafId = null;
  pivotRect = pull.getBoundingClientRect();
  dragging = true;
  stretchedTo = false;
  vel = { x: 0, y: 0 };
  lastMove = { x: pos.x, y: pos.y, t: event.timeStamp };
  pullButton.setPointerCapture(event.pointerId);
});

pullButton.addEventListener('pointermove', (event) => {
  if (!dragging) return;

  const target = clampReach(event.clientX - pivotRect.left, event.clientY - pivotRect.top);

  const atEnd = Math.hypot(target.x, target.y) >= FIRE_AT;
  if (atEnd) stretchedTo = true;
  pull.classList.toggle('armed', atEnd);

  /* track speed so a cord dropped mid-flight keeps swinging */
  const dt = Math.max(0.008, (event.timeStamp - lastMove.t) / 1000);
  const speed = { x: (target.x - lastMove.x) / dt, y: (target.y - lastMove.y) / dt };
  const magnitude = Math.hypot(speed.x, speed.y);
  const cap = magnitude > 2600 ? 2600 / magnitude : 1;

  vel = { x: speed.x * cap, y: speed.y * cap };
  lastMove = { x: target.x, y: target.y, t: event.timeStamp };
  pos = target;
  render();
});

pullButton.addEventListener('pointerup', release);
pullButton.addEventListener('pointercancel', release);

/* keyboard only — a plain click must never switch the lamp */
pullButton.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.code === 'Space') {
    event.preventDefault();
    toggle();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;

  /* the tour owns Escape while it is up, so one press cannot dismiss two layers */
  if (window.scilampTutorialOpen) return;

  if (detail.classList.contains('is-open')) { closeDetail(); return; }

  if (drawerOpen()) { closeDrawer(); return; }

  if (window.scilampSandboxOpen) {
    if (window.scilampCloseSandbox) window.scilampCloseSandbox();
    return;
  }

  const open = document.querySelector('.page.is-open');
  if (open) {
    const key = open.id.slice('page-'.length);
    const { x, y } = pageOrigin();
    closePage(key, x, y);
    return;
  }
  if (isLit()) turnOff();
});

/* ---------- periodic table page ---------- */

const REVEAL_MS = 640;
const reveal = document.getElementById('reveal');
let transitioning = false;
let pendingMode = null;   /* a shape picked from the menu before the page exists */
let pendingSandbox = false;   /* the sandbox was asked for from another page */

const hud = {
  root: document.getElementById('hud'),
  sym: document.getElementById('hud-sym'),
  name: document.getElementById('hud-name'),
  cat: document.getElementById('hud-cat'),
};
let hudIdle = null;

function showElement([num, sym, name, cat, x, y]) {
  const main = y <= 7;
  clearTimeout(hudIdle);
  hud.root.classList.add('is-live');
  hud.root.dataset.cat = cat;
  hud.sym.textContent = sym;
  hud.name.textContent = `${num} · ${name}`;
  hud.cat.textContent = `${CATEGORIES[cat]} · ${main ? `group ${x}` : 'f-block'} · period ${main ? y : y - 3}`;
}

/* the readout waits a beat after the last cell, so moving across the table never blinks it */
function idleHud() {
  clearTimeout(hudIdle);
  hudIdle = setTimeout(() => hud.root.classList.remove('is-live'), 160);
}

/* where a cell waits before it flies in, and from how far off */
function scatter(cell, x, y) {
  const spread = (n) => (Math.random() - 0.5) * n;
  cell.style.setProperty('--sx', `${Math.round(spread(1100))}px`);
  cell.style.setProperty('--sy', `${Math.round(spread(760))}px`);
  cell.style.setProperty('--sz', `${Math.round(-300 - Math.random() * 620)}px`);
  cell.style.setProperty('--rx', `${Math.round(spread(150))}deg`);
  cell.style.setProperty('--ry', `${Math.round(spread(150))}deg`);
  cell.style.setProperty('--rot', `${Math.round(spread(130))}deg`);
  cell.style.setProperty('--delay', `${(x + y) * 22}ms`);
}

const SHELL_ORDER = { s: 0, p: 1, d: 2, f: 3 };

/* noble cores in descending order, so the first hit is the heaviest core below Z */
const CORES = [[86, 'Rn'], [54, 'Xe'], [36, 'Kr'], [18, 'Ar'], [10, 'Ne'], [2, 'He'], [0, '']];

const FILL = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
const CAP = { s: 2, p: 6, d: 10, f: 14 };

/* ground states that do not follow the filling order */
const OVERRIDE = {
  24: '3d5 4s1', 29: '3d10 4s1',
  41: '4d4 5s1', 42: '4d5 5s1', 44: '4d7 5s1', 45: '4d8 5s1', 46: '4d10', 47: '4d10 5s1',
  57: '5d1 6s2', 58: '4f1 5d1 6s2', 64: '4f7 5d1 6s2', 78: '4f14 5d9 6s1', 79: '4f14 5d10 6s1',
  89: '6d1 7s2', 90: '6d2 7s2', 91: '5f2 6d1 7s2', 92: '5f3 6d1 7s2', 93: '5f4 6d1 7s2',
  96: '5f7 6d1 7s2', 103: '5f14 7s2 7p1',
};

function aufbau(z) {
  const out = [];
  let left = z;
  for (const s of FILL) {
    if (left <= 0) break;
    const take = Math.min(CAP[s[1]], left);
    out.push([s, take]);
    left -= take;
  }
  return out;
}

const shellRank = (s) => Number(s[0]) * 10 + SHELL_ORDER[s[1]];

/* '4f14' -> ['4f', 14] */
const parseTerm = (term) => [term.slice(0, 2), Number(term.slice(2))];

function electronArrangement(num) {
  const [coreZ, coreSym] = CORES.find(([z]) => z < num);
  const core = aufbau(coreZ);
  const outer = (OVERRIDE[num]
    ? OVERRIDE[num].split(' ').map(parseTerm)
    : aufbau(num).slice(core.length)
  ).sort((p, q) => shellRank(p[0]) - shellRank(q[0]));

  const shells = [];
  core.concat(outer).forEach(([s, n]) => {
    const p = Number(s[0]);
    shells[p - 1] = (shells[p - 1] || 0) + n;
  });

  return {
    notation: `${coreSym ? `${coreSym} ` : ''}${outer.map(([s, n]) => `${s}<sup>${n}</sup>`).join(' ')}`,
    shells,
  };
}

/* the picture: a Bohr diagram drawn from the shell counts */
function bohrSvg(sym, num, shells) {
  const centre = 130;
  const rings = shells.length;
  const first = 44;
  const last = 122;
  const radius = (i) => (rings === 1 ? (first + last) / 2 : first + ((last - first) * i) / (rings - 1));

  let dots = '';
  shells.forEach((count, i) => {
    const r = radius(i);
    const spin = Math.max(1.7, Math.min(3.4, ((2 * Math.PI * r) / count) * 0.28));
    for (let k = 0; k < count; k += 1) {
      const a = (k / count) * Math.PI * 2 + i * 0.35;
      dots += `<circle class="bohr-e" cx="${(centre + r * Math.cos(a)).toFixed(1)}" cy="${(centre + r * Math.sin(a)).toFixed(1)}" r="${spin.toFixed(1)}"/>`;
    }
  });

  const orbits = shells.map((_, i) => `<circle class="bohr-ring" cx="${centre}" cy="${centre}" r="${radius(i).toFixed(1)}"/>`).join('');

  return `<svg viewBox="0 0 260 260" role="img" aria-label="Bohr model of ${sym}: ${shells.join(', ')} electrons per shell">
    ${orbits}${dots}
    <circle class="bohr-core" cx="${centre}" cy="${centre}" r="27"/>
    <text class="bohr-sym" x="${centre}" y="${centre + 2}">${sym}</text>
    <text class="bohr-num" x="${centre}" y="${centre + 16}">${num}</text>
  </svg>`;
}

const detail = document.getElementById('detail');
const zone = document.getElementById('detail-zone');
const zoomer = document.getElementById('zoomer');
const factsClose = document.getElementById('facts-close');
const facts = {
  num: document.getElementById('zoom-num'),
  sym: document.getElementById('zoom-sym'),
  name: document.getElementById('zoom-name'),
  mass: document.getElementById('zoom-mass'),
  title: document.getElementById('facts-title'),
  sub: document.getElementById('facts-sub'),
  desc: document.getElementById('facts-desc'),
  note: document.getElementById('facts-note'),
  list: document.getElementById('facts-list'),
  hazards: document.getElementById('facts-hazards'),
  safetyH: document.getElementById('facts-safety-h'),
  bohr: document.getElementById('bohr'),
  ext: document.getElementById('facts-ext'),
  spectrum: document.getElementById('spectrum'),
  actions: document.getElementById('facts-actions'),
};

const ZOOM_MS = 520;
let activeCell = null;
let zoomHome = 'none';
let sheetMode = 'element';    /* element | created | detail | hint */
let sheetProduct = null;
let sheetReturnFocus = null;
let sheetClosing = false;

/* the sheet sits above every page; everything behind it is made inert for as long
   as it is up, and every part gets its previous value back on close.  The tutorial
   is deliberately left alone so its controls keep working while a step shows a card. */
const QUIET_PARTS = '.room, .page, .sandbox, .drawer, .menu-tab, .scrim, .reveal';
let quietSaved = null;

function silencePage(quiet) {
  if (quiet) {
    if (quietSaved) return;
    quietSaved = [];
    document.querySelectorAll(QUIET_PARTS).forEach((part) => {
      quietSaved.push([part, part.inert]);
      part.inert = true;
    });
    return;
  }
  if (!quietSaved) return;
  quietSaved.forEach(([part, was]) => { part.inert = was; });
  quietSaved = null;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let detailNum = 0;

function extRow(label, value) {
  return value == null || value === '' ? '' : `<div><dt>${label}</dt><dd>${value}</dd></div>`;
}

/* the fetched dataset paints the deeper facts in once it lands; the panel never waits for it */
function paintExtended(num) {
  loadExtended().then((map) => {
    if (detailNum !== num || sheetMode !== 'element') return;
    const x = map ? map.get(num) : null;

    facts.ext.innerHTML = [
      extRow('Electron configuration', x && x.config ? esc(x.config).replace(/(\d+)/g, '<sup>$1</sup>') : null),
      extRow('Density', x && x.density != null ? `${x.density} g/cm³` : null),
      extRow('Melting point', x && x.melt != null ? `${Math.round(x.melt)} K` : null),
      extRow('Boiling point', x && x.boil != null ? `${Math.round(x.boil)} K` : null),
      extRow('Electronegativity', x && x.en != null ? `${x.en} (Pauling)` : null),
      extRow('First ionisation', x && x.ie1 != null ? `${Math.round(x.ie1)} kJ/mol` : null),
      extRow('Oxidation states', OXIDATION[num] || null),
      extRow('Discovery', x && x.discovered ? esc(x.discovered) : null),
    ].join('');

    facts.spectrum.hidden = true;
    facts.spectrum.innerHTML = '';
    if (x && x.spectral && x.spectral.includes('File:')) {
      const file = x.spectral.slice(x.spectral.indexOf('File:') + 5);
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = `Emission spectrum of ${ELEMENTS[num - 1][2]}`;
      img.src = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=480`;
      const cap = document.createElement('figcaption');
      cap.textContent = 'Emission spectrum (Wikimedia Commons)';
      img.addEventListener('error', () => { facts.spectrum.hidden = true; });
      facts.spectrum.append(img, cap);
      facts.spectrum.hidden = false;
    }
  });
}

function fillPanel(el) {
  const [num, sym, name, cat, x, y, mass, codes, note, description, state] = el;
  const main = y <= 7;
  const { notation, shells } = electronArrangement(num);
  const phase = state || stateAt25(num);

  detail.dataset.cat = cat;
  facts.num.textContent = num;
  facts.sym.textContent = sym;
  facts.name.textContent = name;
  facts.mass.textContent = `${mass} u`;

  facts.title.textContent = `${sym} — ${name}`;
  facts.sub.textContent = `${CATEGORIES[cat]} · ${main ? `group ${x}` : 'f-block'} · period ${main ? y : y - 3} · ${phase} at 25 °C`;
  facts.desc.textContent = description || note;
  facts.note.hidden = true;
  facts.note.textContent = '';
  facts.safetyH.hidden = false;
  facts.bohr.hidden = false;
  facts.actions.hidden = true;
  facts.actions.innerHTML = '';

  facts.list.innerHTML = `
    <div><dt>Atomic number</dt><dd>${num}</dd></div>
    <div><dt>Relative atomic mass</dt><dd>${mass}${mass.startsWith('[') ? ' <span class="fact-hint">most stable isotope</span>' : ' <span class="fact-hint">u</span>'}</dd></div>
    <div><dt>Electron arrangement</dt><dd>${notation}</dd></div>
    <div><dt>Shells</dt><dd>${shells.join(' · ')}</dd></div>
    <div><dt>Common oxidation states</dt><dd>${el[11] || '—'}</dd></div>`;

  const list = codes ? codes.split(' ') : [];
  const tags = list.length ? list : ['none'];
  facts.hazards.innerHTML = tags.map((c) => (
    c === 'none'
      ? '<li><b>No hazard classification</b><i>Still worth treating as a laboratory chemical: no eating, wash hands, avoid dust.</i></li>'
      : `<li data-hz="${c}"><b>${HAZARDS[c][0]}</b><i>${HAZARDS[c][1]}</i></li>`
  )).join('');

  facts.bohr.innerHTML = `${bohrSvg(sym, num, shells)}<figcaption>Bohr model — electrons per shell from the ground state</figcaption>`;

  detailNum = num;
  facts.ext.innerHTML = '';
  facts.spectrum.hidden = true;
  facts.spectrum.innerHTML = '';
  paintExtended(num);
}

/* FLIP: the tile is drawn where it already sits, then released into the left half */
function growFrom(cell) {
  if (reducedMotion) { zoomer.style.transform = 'none'; return; }

  zoomer.style.transition = 'none';
  zoomer.style.transformOrigin = 'top left';

  const from = cell.getBoundingClientRect();
  const to = zoomer.getBoundingClientRect();
  const k = from.width / to.width;
  zoomHome = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${k})`;

  zoomer.style.transform = zoomHome;
  void zoomer.offsetWidth;                       /* commit the start pose, or nothing animates */

  zoomer.style.transition = `transform ${ZOOM_MS}ms var(--ease)`;
  zoomer.style.transform = 'none';
}

const factsPane = detail.querySelector('.facts');

/* every visible button in the sheet, in document order, for the Tab loop */
function sheetFocusables() {
  return [...detail.querySelectorAll('button, [href], input, select, textarea, [tabindex]')]
    .filter((el) => el.tabIndex !== -1 && !el.disabled && !el.hidden && el.getClientRects().length);
}

function openDetail(cell, el) {
  activeCell = cell;
  sheetMode = 'element';
  sheetProduct = null;
  sheetReturnFocus = cell;
  fillPanel(el);
  cell.classList.add('is-source');
  silencePage(true);

  detail.dataset.mode = 'element';
  detail.classList.add('is-open');
  detail.removeAttribute('aria-hidden');
  growFrom(cell);

  requestAnimationFrame(() => detail.classList.add('in'));
  setTimeout(() => {
    if (!window.scilampTutorialOpen) factsClose.focus({ preventScroll: true });
  }, reducedMotion ? 0 : ZOOM_MS);
}

const elementName = (sym) => {
  const row = ELEMENTS.find((e) => e[1] === sym);
  return row ? row[2] : sym;
};

const productKind = (product) => (
  product.diatomic ? 'Diatomic element' : SB.KIND_LABEL[product.kind] || 'Compound'
);

function fillProductSheet(product, mode) {
  const kind = productKind(product);
  const molar = compoundMass(product);
  detail.dataset.mode = mode;
  detail.dataset.cat = product.kind === 'alloy' ? 'p' : 'compound';

  facts.num.textContent = product.units > 1 ? `${product.units} ×` : '';
  facts.sym.textContent = product.formula;
  facts.name.textContent = product.name;
  facts.mass.textContent = molar ? `${molar} u per formula unit` : 'variable composition';

  facts.title.textContent = `${product.formula} — ${product.name}`;
  const bits = [kind];
  if (product.ratio) bits.push(SB.ratioText(product.ratio));
  if (product.units > 1) bits.push(`${product.units} formula units`);
  facts.sub.textContent = bits.join(' · ');

  facts.desc.textContent = mode === 'created' ? (product.why || product.description) : (product.description || product.why);
  facts.note.hidden = false;
  facts.note.textContent = mode === 'created'
    ? (product.formation || '')
    : [product.why, product.formation].filter(Boolean).join(' ');

  const rows = [
    `<div><dt>Compound type</dt><dd>${kind}</dd></div>`,
    `<div><dt>Composition</dt><dd>${esc(product.compositionText || '')}</dd></div>`,
    `<div><dt>Molar mass</dt><dd>${molar ? `${molar} u` : 'Variable — an alloy has no fixed formula'}</dd></div>`,
  ];
  if (product.ratio) rows.push(`<div><dt>Ion ratio</dt><dd>${SB.ratioText(product.ratio)}</dd></div>`);
  rows.push(`<div><dt>How it forms</dt><dd>${esc(product.formation || '')}</dd></div>`);
  rows.push(`<div><dt>Properties</dt><dd>${esc(product.properties || '')}</dd></div>`);
  rows.push(`<div><dt>Elements</dt><dd>${product.contains.map((s) => `${s} <span class="fact-hint">${elementName(s)}</span>`).join(', ')}</dd></div>`);
  if (product.suppliedText) rows.push(`<div><dt>On the bench</dt><dd>${esc(product.suppliedText)}</dd></div>`);
  facts.list.innerHTML = rows.join('');

  facts.ext.innerHTML = '';
  facts.spectrum.hidden = true;
  facts.spectrum.innerHTML = '';
  facts.hazards.innerHTML = '';
  facts.safetyH.hidden = true;
  facts.bohr.hidden = true;
  facts.bohr.innerHTML = '';

  const saved = window.SciLampStore && SciLampStore.hasProduct(product.key);
  facts.actions.hidden = false;
  if (mode === 'created') {
    facts.actions.innerHTML = `
      <span class="sheet-saved"><span aria-hidden="true">✓</span> Saved to my products</span>
      <button class="sheet-btn" type="button" data-sheet-action="details">full details</button>
      <button class="sheet-btn" type="button" data-sheet-action="shelf">my products</button>
      <button class="sheet-btn is-ghost" type="button" data-sheet-action="close">done</button>`;
  } else {
    facts.actions.innerHTML = `
      <button class="sheet-btn" type="button" data-sheet-action="sandbox">open the sandbox</button>
      ${saved ? '<button class="sheet-btn is-danger" type="button" data-sheet-action="remove">remove from my products</button>' : ''}
      <button class="sheet-btn is-ghost" type="button" data-sheet-action="close">done</button>`;
  }
}

function fillHintSheet(compound) {
  const atoms = compound.atoms || {};
  const syms = Object.keys(atoms);
  const total = syms.reduce((sum, s) => sum + atoms[s], 0);
  const metalCount = compound.metals ? compound.metals.length : 0;
  const kind = compound.kind === 'alloy' ? 'Alloy' : SB.KIND_LABEL[compound.kind] || 'Compound';

  detail.dataset.mode = 'hint';
  detail.dataset.cat = 'hint';

  facts.num.textContent = '?';
  facts.sym.textContent = '???';
  facts.name.textContent = 'Undiscovered compound';
  facts.mass.textContent = 'identity hidden';

  facts.title.textContent = `Unknown ${kind.toLowerCase()}`;
  facts.sub.textContent = metalCount
    ? `${kind} · ${metalCount} metals · variable ratio`
    : `${kind} · ${total} atoms · ${syms.length} element${syms.length === 1 ? '' : 's'}`;
  facts.desc.textContent = 'This compound stays hidden until the bench makes it. Discover it in the sandbox and its name and formula appear here.';
  facts.note.hidden = false;
  facts.note.textContent = `Hint: ${compound.hint}`;

  facts.list.innerHTML = `
    <div><dt>Compound type</dt><dd>${kind}</dd></div>
    <div><dt>Atoms in formula</dt><dd>${metalCount ? 'variable' : total}</dd></div>
    <div><dt>Elements involved</dt><dd>${metalCount || syms.length}</dd></div>`;

  facts.ext.innerHTML = '';
  facts.spectrum.hidden = true;
  facts.spectrum.innerHTML = '';
  facts.hazards.innerHTML = '';
  facts.safetyH.hidden = true;
  facts.bohr.hidden = true;
  facts.bohr.innerHTML = '';

  facts.actions.hidden = false;
  facts.actions.innerHTML = `
    <button class="sheet-btn" type="button" data-sheet-action="sandbox">open the sandbox</button>
    <button class="sheet-btn is-ghost" type="button" data-sheet-action="close">done</button>`;
}

function beginSheet(mode, trigger) {
  sheetMode = mode;
  sheetReturnFocus = trigger || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  silencePage(true);
  detail.classList.add('is-open');
  detail.removeAttribute('aria-hidden');
  requestAnimationFrame(() => detail.classList.add('in'));
  setTimeout(() => {
    if (!window.scilampTutorialOpen && detail.classList.contains('is-open')) factsClose.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 260);
}

function openProduct(product, { mode = 'detail', trigger = null } = {}) {
  if (!product) return;
  const nextMode = mode === 'created' ? 'created' : 'detail';
  activeCell = null;
  sheetProduct = product;
  fillProductSheet(product, nextMode);

  if (detail.classList.contains('is-open')) {
    sheetMode = nextMode;
    factsPane.scrollTop = 0;
    factsClose.focus({ preventScroll: true });
    return;
  }

  zoomer.style.transition = 'none';
  zoomer.style.transform = 'none';
  zoomHome = 'none';
  beginSheet(nextMode, trigger);
}

function openHint(compound, { trigger = null } = {}) {
  if (!compound) return;
  activeCell = null;
  sheetProduct = null;
  fillHintSheet(compound);

  if (detail.classList.contains('is-open')) {
    sheetMode = 'hint';
    factsPane.scrollTop = 0;
    factsClose.focus({ preventScroll: true });
    return;
  }

  zoomer.style.transition = 'none';
  zoomer.style.transform = 'none';
  zoomHome = 'none';
  beginSheet('hint', trigger);
}

function openElement(which) {
  const num = typeof which === 'number' ? which : null;
  const cell = num != null
    ? document.querySelector(`.el[data-number="${num}"]`)
    : [...document.querySelectorAll('.el')][ELEMENTS.findIndex((e) => e[1] === which)];
  const el = num != null ? ELEMENTS[num - 1] : ELEMENTS.find((e) => e[1] === which);
  if (!cell || !el) return;
  openDetail(cell, el);
}

function closeDetail() {
  if (!detail.classList.contains('is-open') || sheetClosing) return;
  sheetClosing = true;
  detail.classList.remove('in');

  const mode = sheetMode;
  const back = sheetReturnFocus;
  const done = () => {
    detail.classList.remove('is-open');
    detail.setAttribute('aria-hidden', 'true');
    silencePage(false);
    if (activeCell) activeCell.classList.remove('is-source');
    if (detail.contains(document.activeElement)) document.activeElement.blur();

    activeCell = null;
    sheetProduct = null;
    sheetReturnFocus = null;
    sheetMode = 'element';
    sheetClosing = false;
    zoomer.style.transition = 'none';
    zoomer.style.transform = 'none';
    zoomHome = 'none';

    if (window.scilampTutorialOpen) return;
    if (back && document.contains(back) && back.getClientRects().length) {
      back.focus({ preventScroll: true });
    } else {
      menuTab.focus({ preventScroll: true });
    }
  };

  if (reducedMotion) { done(); return; }

  const ms = mode === 'element' ? ZOOM_MS : 300;
  zoomer.style.transition = `transform ${ms}ms var(--ease)`;
  zoomer.style.transform = zoomHome;
  setTimeout(done, ms);
}

facts.actions.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-sheet-action]');
  if (!btn) return;
  const action = btn.dataset.sheetAction;

  if (action === 'close') { closeDetail(); return; }

  if (action === 'details' && sheetProduct) {
    fillProductSheet(sheetProduct, 'detail');
    factsPane.scrollTop = 0;
    factsClose.focus({ preventScroll: true });
    return;
  }

  if (action === 'remove' && sheetProduct) {
    if (window.SciLampStore) SciLampStore.removeProduct(sheetProduct.key);
    fillProductSheet(sheetProduct, 'detail');
    const status = document.createElement('span');
    status.className = 'sheet-saved is-removed';
    status.textContent = 'Removed from my products';
    facts.actions.prepend(status);
    factsClose.focus({ preventScroll: true });
    return;
  }

  if (action === 'shelf') {
    closeDetail();
    if (window.SciLampNav) SciLampNav.openSandbox({ shelf: true });
    return;
  }

  if (action === 'sandbox') {
    closeDetail();
    if (window.SciLampNav) SciLampNav.openSandbox();
  }
});

function buildTable() {
  const frag = document.createDocumentFragment();

  ELEMENTS.forEach((el) => {
    const [num, sym, name, cat, x, y] = el;
    const cell = document.createElement('div');
    cell.className = 'el';
    cell.dataset.cat = cat;
    cell.dataset.number = num;
    cell.style.setProperty('--x', x);
    cell.style.setProperty('--y', y);
    scatter(cell, x, y);
    cell.tabIndex = 0;
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label', `${num} ${sym} ${name}, ${CATEGORIES[cat]} — open details`);
    cell.innerHTML = `<span class="el-num">${num}</span><span class="el-sym">${sym}</span>`;
    cell.addEventListener('pointerenter', () => showElement(el));
    cell.addEventListener('pointerleave', idleHud);
    cell.addEventListener('focus', () => showElement(el));
    cell.addEventListener('blur', idleHud);
    cell.addEventListener('click', () => openDetail(cell, el));
    cell.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        openDetail(cell, el);
      }
    });
    frag.append(cell);
  });

  [[6, '57–71'], [7, '89–103']].forEach(([y, label]) => {
    const gap = document.createElement('div');
    gap.className = 'el-gap';
    gap.style.setProperty('--x', 3);
    gap.style.setProperty('--y', y);
    gap.textContent = label;
    frag.append(gap);
  });

  document.getElementById('table').append(frag);

  Object.entries(CATEGORIES).forEach(([key, label]) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'legend-item';
    item.dataset.cat = key;
    item.setAttribute('aria-pressed', 'false');
    item.innerHTML = `<span class="legend-dot"></span>${label}`;
    item.addEventListener('click', () => {
      if (catFilter.has(key)) catFilter.delete(key);
      else catFilter.add(key);
      item.setAttribute('aria-pressed', String(catFilter.has(key)));
      applyFilters();
    });
    document.getElementById('legend').append(item);
  });
}

function farthestCorner(x, y) {
  return Math.max(
    Math.hypot(x, y),
    Math.hypot(innerWidth - x, y),
    Math.hypot(x, innerHeight - y),
    Math.hypot(innerWidth - x, innerHeight - y)
  );
}

function setCircle(x, y, r) {
  reveal.style.setProperty('--cx', `${x}px`);
  reveal.style.setProperty('--cy', `${y}px`);
  reveal.style.setProperty('--r', `${r}px`);
}

function openPage(key, x, y) {
  const page = document.getElementById(`page-${key}`);
  if (!page || transitioning || page.classList.contains('is-open')) return;
  transitioning = true;

  setCircle(x, y, 0);
  reveal.classList.add('active');
  void reveal.offsetWidth;                       /* commit the collapsed start */

  if (!reducedMotion) reveal.classList.add('animate');
  setCircle(x, y, farthestCorner(x, y));

  setTimeout(() => {
    page.classList.add('is-open');
    page.removeAttribute('aria-hidden');
    document.body.classList.add('page-open');
    reveal.classList.remove('animate', 'active');
    setCircle(x, y, 0);
    transitioning = false;
    page.focus({ preventScroll: true });
    if (key === 'table') {
      placeGoo();
      relayout();
      if (pendingMode) {
        const picked = pendingMode;
        pendingMode = null;
        setMode(picked);
      } else {
        arriveTable();
      }
      if (pendingSandbox) {
        pendingSandbox = false;
        if (window.scilampOpenSandbox) window.scilampOpenSandbox();
      }
    }
  }, reducedMotion ? 0 : REVEAL_MS);
}

function closePage(key, x, y) {
  const page = document.getElementById(`page-${key}`);
  if (!page || transitioning || !page.classList.contains('is-open')) return;
  transitioning = true;
  if (key === 'table') {
    idleHud();
    pageTable.classList.remove('arriving');
  }

  setCircle(x, y, farthestCorner(x, y));
  reveal.classList.add('active');
  void reveal.offsetWidth;

  page.classList.remove('is-open');
  if (page.contains(document.activeElement)) menuTab?.focus({ preventScroll: true });
  page.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('page-open');

  if (!reducedMotion) {
    reveal.classList.add('animate');
    setCircle(x, y, 0);
  }

  setTimeout(() => {
    reveal.classList.remove('animate', 'active');
    transitioning = false;
    menuTab?.focus();
  }, reducedMotion ? 0 : REVEAL_MS);
}

function cardCentre(card) {
  const box = card.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

/* the section buttons live in the drawer, so the reveal always grows from the menu tab */
function pageOrigin() {
  return cardCentre(menuTab);
}

/* switch pages without leaving a second one open, and without leaving the sandbox
   or a sheet floating above the page you just left */
function showPage(key) {
  if (transitioning) {
    setTimeout(() => showPage(key), 220);
    return;
  }
  if (window.scilampSandboxOpen && window.scilampCloseSandbox) window.scilampCloseSandbox();
  if (detail.classList.contains('is-open') && !sheetClosing) closeDetail();
  closeDrawer();

  const current = document.querySelector('.page.is-open');
  if (current && current.id === `page-${key}`) return;
  if (current) {
    current.classList.remove('is-open');
    current.setAttribute('aria-hidden', 'true');
  }
  const { x, y } = pageOrigin();
  openPage(key, x, y);
}

function openKey(key) {
  showPage(key);
}

buildTable();

/* ---------- arrangements: the same 118 cells, placed in 3D ---------- */

/* the scale is what keeps the tiles apart: a shape is built from its own card size,
   so every ring, turn and row of a shape has clear air between one card and the next */
const ARRANGEMENTS = {
  table: { tilt: 0, spin: 0, scale: 1 },
  sphere: { tilt: -14, spin: 0, scale: 0.72 },
  helix: { tilt: -8, spin: 0, scale: 0.72 },
  grid: { tilt: -14, spin: -20, scale: 0.72 },
};

const MORPH_MS = 900;
const MORPH_WAVE = 0.35;      /* part of the morph spent starting the tiles one after another */

const DEG = Math.PI / 180;
const pageTable = document.getElementById('page-table');
const stageView = document.getElementById('stage');
const stageBoard = document.getElementById('table');
const tiles = [...stageBoard.querySelectorAll('.el')];

/* ---------- search, category filters, heatmap ---------- */

const searchInput = document.getElementById('search');
const resetBtn = document.getElementById('filter-reset');
const emptyNote = document.getElementById('empty-note');
const filterStatus = document.getElementById('filter-status');
const hmSelect = document.getElementById('hm-prop');
const hmLegend = document.getElementById('hm-legend');
const hmLow = document.getElementById('hm-low');
const hmHigh = document.getElementById('hm-high');
const hmUnit = document.getElementById('hm-unit');

const catFilter = new Set();
let query = '';
let heatProp = '';

function cellMatches([num, sym, name, cat]) {
  if (catFilter.size && !catFilter.has(cat)) return false;
  if (!query) return true;
  return (
    sym.toLowerCase().startsWith(query) ||
    name.toLowerCase().includes(query) ||
    String(num) === query ||
    String(num).startsWith(query)
  );
}

/* dimming keeps the lattice intact: cards stay in their slots, only their paint leaves */
function applyFilters() {
  let hits = 0;
  ELEMENTS.forEach((el, i) => {
    const hit = cellMatches(el);
    if (hit) hits += 1;
    tiles[i].classList.toggle('is-dim', !hit);
    tiles[i].inert = !hit;
  });
  emptyNote.hidden = hits > 0;
  filterStatus.textContent = query || catFilter.size ? `${hits} of 118 elements match` : '';
}

searchInput.addEventListener('input', () => {
  query = searchInput.value.trim().toLowerCase();
  applyFilters();
});

function clearHeat() {
  heatProp = '';
  delete pageTable.dataset.heatmap;
  tiles.forEach((cell) => {
    cell.style.removeProperty('--hm');
    cell.style.removeProperty('--hm-text');
  });
  hmLegend.hidden = true;
}

function applyHeat(key, map) {
  const prop = HEAT_PROPS[key];
  const vals = ELEMENTS.map((el) => {
    const rec = map.get(el[0]);
    return rec ? rec[key] : null;
  });

  let min = Infinity;
  let max = -Infinity;
  vals.forEach((v) => {
    if (v == null) return;
    if (v < min) min = v;
    if (v > max) max = v;
  });
  const span = max - min || 1;

  tiles.forEach((cell, i) => {
    const v = vals[i];
    if (v == null) {
      cell.style.setProperty('--hm', 'var(--hm-null)');
      cell.style.setProperty('--hm-text', 'var(--text)');
      return;
    }
    const rgb = heatRgb((v - min) / span);
    cell.style.setProperty('--hm', `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`);
    cell.style.setProperty('--hm-text', heatInk(rgb));
  });

  pageTable.dataset.heatmap = key;
  hmUnit.textContent = `${prop.label} · ${prop.unit}`;
  hmLow.textContent = prop.fmt(min);
  hmHigh.textContent = prop.fmt(max);
  hmLegend.hidden = false;
}

hmSelect.addEventListener('change', () => {
  const key = hmSelect.value;
  if (!key) { clearHeat(); return; }
  heatProp = key;
  hmSelect.disabled = true;
  loadExtended().then((map) => {
    hmSelect.disabled = false;
    if (heatProp !== key) return;
    if (!map) {
      clearHeat();
      hmSelect.value = '';
      filterStatus.textContent = 'property data unavailable — check the connection';
      return;
    }
    applyHeat(key, map);
  });
});

resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  query = '';
  catFilter.clear();
  document.querySelectorAll('.legend-item').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  hmSelect.value = '';
  clearHeat();
  applyFilters();
  searchInput.focus();
});

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const norm = (a) => {
  const v = a % 360;
  return v > 180 ? v - 360 : v < -180 ? v + 360 : v;
};

/* every shape carries the facing its tiles lie on baked into its poses: a body has a skin, the wall has a curve */

/* a pose is [x, y, z, turn, lean]: where a tile sits and how it lies on the surface under it */
let arrangement = 'table';
let shown = tiles.map(() => [0, 0, 0, 0, 0]);   /* what is on screen this frame */
let start = shown;
let goal = shown;
let reach = 1;
let reachFrom = 1;
let reachGoal = 1;
let card = [0, 0];          /* the card the shapes are built from, which is smaller than the table cell */
let cardFrom = [0, 0];
let cardGoal = [0, 0];
let tilt = 0;
let spin = 0;
let zoom = 1;
let spinVel = 0;
let tiltVel = 0;
let glideRAF = null;
let morphRAF = null;
let arriveTimer = null;
let morphAt = 0;
let morphPose = true;
let poseFrom = { tilt: 0, spin: 0, zoom: 1 };
let poseGoal = { tilt: 0, spin: 0, zoom: 1 };
let drag = null;
let suppressClick = false;

/* each builder returns a function of the element index, closing over the measured stage.
   every one of them works from the card size it is handed, so one card never stands on another */

const AIR = 1.6;              /* how much of a card has to stay clear of its neighbours */

/* the rings fill up in order of who deserves the next tile, and none of them takes more than it can hold apart */
function apportion(n, weight, room) {
  const sum = weight.reduce((a, b) => a + b, 0) || 1;
  const share = weight.map((s) => (n * s) / sum);
  const count = share.map((q, j) => Math.min(room[j], Math.floor(q)));
  let left = n - count.reduce((a, b) => a + b, 0);

  const order = share
    .map((q, j) => [j, q - Math.floor(q)])
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0]);

  let spare = true;
  while (left > 0 && spare) {
    spare = false;
    order.forEach((j) => {
      if (left > 0 && count[j] < room[j]) { count[j] += 1; left -= 1; spare = true; }
    });
  }

  /* a stage too small to hold everyone apart still has to hold everyone, so the widest ring copes */
  if (left > 0) count[order.reduce((a, b) => (room[a] > room[b] ? a : b), 0)] += left;
  return count;
}

/* latitude rings spaced evenly in height, so the top of the ball is as tidy as the middle */
function sphereLayout(w, h, card) {
  const n = tiles.length;
  const r = Math.min(w, h) * 0.46;
  const bands = clamp(Math.floor((2 * r) / (card[1] * AIR)), 4, 20);

  const level = [];          /* each ring's height, its width, and how many cards it can hold apart */
  const weight = [];
  const room = [];
  for (let j = 0; j < bands; j += 1) {
    const ny = 1 - ((j + 0.5) * 2) / bands;
    const s = Math.sqrt(Math.max(0, 1 - ny * ny));
    level.push(-ny * r);
    weight.push(s);
    room.push(Math.max(1, Math.floor((2 * Math.PI * r * s) / (card[0] * AIR))));
  }

  const count = apportion(n, weight, room);
  const first = [];
  let acc = 0;
  count.forEach((c) => { first.push(acc); acc += c; });
  const band = [];
  count.forEach((c, j) => { for (let p = 0; p < c; p += 1) band.push(j); });

  return (i) => {
    const j = band[i];
    const y = level[j] / r;
    const s = Math.sqrt(Math.max(0, 1 - y * y));
    const a = (2 * Math.PI * (i - first[j])) / count[j] + (j % 2 ? Math.PI / count[j] : 0);
    const nx = s * Math.cos(a);
    const nz = s * Math.sin(a);
    return [nx * r, y * r, nz * r, Math.atan2(nx, nz) / DEG, -Math.asin(y) / DEG];
  };
}

function helixLayout(w, h, card) {
  const n = tiles.length;
  const r = Math.min(w * 0.26, h * 0.3);
  /* a turn holds as many cards as its circumference can carry apart, and the coil climbs one card height per turn */
  const per = clamp(Math.round((2 * Math.PI * r) / (card[0] * AIR)), 8, 40);
  const step = (Math.PI * 2) / per;
  const height = Math.max(h * 0.82, (n / per) * card[1] * AIR);
  return (i) => {
    const a = i * step;
    const nx = Math.cos(a);
    const nz = Math.sin(a);
    return [nx * r, (i / (n - 1) - 0.5) * height, nz * r, Math.atan2(nx, nz) / DEG, 0];
  };
}

/* the grid is a stack of square sheets: square cards in square rows, the lightest
   element at the top left of the nearest sheet and the heaviest at the bottom right
   of the deepest one, ordered by atomic mass */
const MASS_RANK = (() => {
  const order = ELEMENTS
    .map((el, i) => [i, parseFloat(String(el[6]).replace(/[[\]]/g, ''))])
    .sort((a, b) => a[1] - b[1]);
  const rank = new Array(order.length);
  order.forEach(([i], r) => { rank[i] = r; });
  return rank;
})();

function gridLayout(w, h, card) {
  const n = tiles.length;
  const g = card[0] * AIR * 1.12;
  const k = clamp(Math.min(Math.floor((w * 0.9) / g), Math.floor((h * 0.86) / g)), 3, 11);
  const per = k * k;
  const layers = Math.ceil(n / per);
  const gz = card[0] * AIR * 1.7;
  return (i) => {
    const slot = MASS_RANK[i];
    const layer = Math.floor(slot / per);
    const q = slot % per;
    const row = Math.floor(q / k);
    const col = q % k;
    const inLayer = Math.min(per, n - layer * per);
    const rows = Math.ceil(inLayer / k);          /* the last sheet is short, so it centres itself */
    const shift = layer % 2 ? 0.5 : 0;
    return [
      (col + shift - (k - 1) / 2) * g,
      (row - (rows - 1) / 2 + (layer % 2 ? 0.5 : 0)) * g,
      /* the first sheet is the fullest one, so it is the one nearest the camera */
      (((layers - 1) / 2) - layer) * gz,
      0,
      0,
    ];
  };
}

const BUILDERS = { sphere: sphereLayout, helix: helixLayout, grid: gridLayout };

/* the flat table is a shape too: its tiles sit exactly where the grid puts them,
   and measuring it hands back the card size every shape is shrunk from.
   The stage is measured inside the switch, while the zoom is off, so a shape rebuilt
   at 2x does not grow to fill the magnified frame */
function flatSlots() {
  const was = pageTable.dataset.mode;
  pageTable.classList.add('replay');
  pageTable.dataset.mode = 'table';

  const box = stageView.getBoundingClientRect();
  const first = tiles[0].getBoundingClientRect();
  const poses = tiles.map((cell) => {
    const r = cell.getBoundingClientRect();
    return [
      r.left + r.width / 2 - (box.left + box.width / 2),
      r.top + r.height / 2 - (box.top + box.height / 2),
      0,
      0,
      0,
    ];
  });

  pageTable.dataset.mode = was;
  pageTable.classList.remove('replay');
  return { poses, tile: [first.width, first.height], box: { width: box.width, height: box.height } };
}

function build(name) {
  const flat = flatSlots();
  const box = flat.box;
  const scale = ARRANGEMENTS[name].scale;
  let tile = [flat.tile[0] * scale, flat.tile[1] * scale];
  /* the grid reads as a square lattice, so its cards are cut square */
  if (name === 'grid') tile = [Math.min(tile[0], tile[1]), Math.min(tile[0], tile[1])];

  const builder = BUILDERS[name];
  if (!builder) {
    let far = 1;
    flat.poses.forEach((p) => { far = Math.max(far, Math.hypot(p[0], p[1], p[2])); });
    return { poses: flat.poses, reach: far, tile };
  }

  /* the shape turns about its own middle, so its centroid is lifted onto the pivot */
  const at = builder(box.width, box.height, tile);
  const poses = tiles.map((_, i) => at(i));
  const middle = [0, 1, 2].map((k) => poses.reduce((sum, p) => sum + p[k], 0) / poses.length);
  let far = 1;
  poses.forEach((p) => {
    p[0] -= middle[0];
    p[1] -= middle[1];
    p[2] -= middle[2];
    far = Math.max(far, Math.hypot(p[0], p[1], p[2]));
  });
  return { poses, reach: far, tile };
}

function writeCard(size) {
  pageTable.style.setProperty('--tile-w', `${size[0].toFixed(1)}px`);
  pageTable.style.setProperty('--tile-h', `${size[1].toFixed(1)}px`);
}

function writeTile(cell, p) {
  cell.style.setProperty('--px', `${p[0].toFixed(1)}px`);
  cell.style.setProperty('--py', `${p[1].toFixed(1)}px`);
  cell.style.setProperty('--pz', `${p[2].toFixed(1)}px`);
  cell.style.setProperty('--oy', `${p[3].toFixed(2)}deg`);
  cell.style.setProperty('--ox', `${p[4].toFixed(2)}deg`);
}

function snapTo(poses, newReach, size) {
  shown = poses.map((p) => p.slice());
  reach = reachFrom = reachGoal = newReach;
  card = cardFrom = cardGoal = size.slice();
  writeCard(card);
  tiles.forEach((cell, i) => writeTile(cell, shown[i]));
  nearPrev.fill(NaN);
  fadeByDepth();
}

/* the shortest way round, so a tile never spins the long way to its new facing */
function lerpAngle(a, b, k) {
  return a + norm(b - a) * k;
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* the flat table is painted by the grid, so the tiles hand back their 3D transforms once they land */
function landTable() {
  pageTable.dataset.mode = 'table';
  nearPrev.fill(NaN);
  tiles.forEach((cell) => {
    ['--px', '--py', '--pz', '--oy', '--ox', '--near'].forEach((name) => cell.style.removeProperty(name));
  });
}

/* opening the page flies the tiles in; after that every switch is a morph from where they already stand */
function arriveTable() {
  if (reducedMotion) return;
  tiles.forEach((cell, i) => {
    scatter(cell, i % 18, Math.floor(i / 18));
    cell.style.setProperty('--delay', `${i * 6}ms`);
  });
  pageTable.classList.add('arriving');
  clearTimeout(arriveTimer);
  arriveTimer = setTimeout(() => pageTable.classList.remove('arriving'), MORPH_MS + tiles.length * 6 + 300);
}

/* where the tiles already are is where the new shape starts from */
function morphTo(poses, newReach, size) {
  if (morphRAF) cancelAnimationFrame(morphRAF);
  start = shown.map((p) => p.slice());
  goal = poses;
  reachFrom = reach;
  reachGoal = newReach;
  cardFrom = card.slice();
  cardGoal = size.slice();
  spin = norm(spin);
  poseFrom = { tilt, spin, zoom };
  poseGoal = { tilt: ARRANGEMENTS[arrangement].tilt, spin: ARRANGEMENTS[arrangement].spin, zoom: 1 };
  morphPose = true;
  morphAt = performance.now();
  morphRAF = requestAnimationFrame(morphFrame);
}

function morphFrame(now) {
  const u = clamp((now - morphAt) / MORPH_MS, 0, 1);
  const grow = easeInOut(u);

  if (morphPose) {
    tilt = poseFrom.tilt + (poseGoal.tilt - poseFrom.tilt) * u;
    spin = lerpAngle(poseFrom.spin, poseGoal.spin, u);
    zoom = poseFrom.zoom + (poseGoal.zoom - poseFrom.zoom) * u;
  }

  /* the cards change size on the way, so a shape never has to shrink the moment it is picked */
  card = [0, 1].map((k) => cardFrom[k] + (cardGoal[k] - cardFrom[k]) * grow);
  writeCard(card);

  const span = 1 + MORPH_WAVE;
  const n = tiles.length;

  for (let i = 0; i < n; i += 1) {
    const t = easeInOut(clamp(u * span - (i / n) * MORPH_WAVE, 0, 1));
    const a = start[i];
    const b = goal[i];
    const p = shown[i];
    for (let k = 0; k < 3; k += 1) p[k] = a[k] + (b[k] - a[k]) * t;
    /* the facing a shape gives its tiles is part of the shape, so it is flown in with them */
    p[3] = lerpAngle(a[3], b[3], t);
    p[4] = lerpAngle(a[4], b[4], t);
    writeTile(tiles[i], p);
  }
  reach = reachFrom + (reachGoal - reachFrom) * easeInOut(clamp(u * span - 0.5 * MORPH_WAVE, 0, 1));

  applyRotation();
  fadeByDepth();

  if (u < 1) {
    morphRAF = requestAnimationFrame(morphFrame);
    return;
  }
  morphRAF = null;
  if (arrangement === 'table') landTable();
}

/* a drag or a zoom is the user taking the pose back from a running morph */
function pinPose() {
  if (morphRAF) morphPose = false;
}

/* pointer events arrive faster than frames, so a drag accumulates its deltas
   and lands them once per frame instead of repainting the board per event */
function applyDrag() {
  drag.raf = 0;
  const dx = drag.pdx;
  const dy = drag.pdy;
  drag.pdx = 0;
  drag.pdy = 0;

  /* the slider reads as a multiplier but bites as its square, so the two ends
     of the range feel like entirely different hands on the wheel */
  const turn = SENS.turn * SENS.turn;
  spin += dx * 0.32 * turn;
  tilt = clamp(tilt - dy * 0.32 * turn, -88, 88);
  spinVel = spinVel * 0.7 + dx * 0.1 * turn;
  tiltVel = tiltVel * 0.7 - dy * 0.1 * turn;
  applyRotation();
  fadeByDepth();
}

function relayout() {
  if (!stageView.offsetWidth || !stageView.offsetHeight) return;   /* the page is hidden; wait for it to come back */
  const built = build(arrangement);

  /* the stage changed size mid-flight, so the tiles keep going to the new version of the shape */
  if (morphRAF) {
    goal = built.poses;
    reachGoal = built.reach;
    cardGoal = built.tile.slice();
    return;
  }
  snapTo(built.poses, built.reach, built.tile);
  if (arrangement === 'table') landTable();
}

/* how near each tile is to the camera, so the far half of a shape recedes instead of clouding the near half */
const nearPrev = tiles.map(() => NaN);

function fadeByDepth() {
  if (pageTable.dataset.mode === 'table') return;
  const ct = Math.cos(tilt * DEG);
  const st = Math.sin(tilt * DEG);
  const cs = Math.cos(spin * DEG);
  const ss = Math.sin(spin * DEG);
  const camZ = (x, y, z) => y * st + (-x * ss + z * cs) * ct;

  /* a shape only needs shading in proportion to the depth it has, so a sheet lying flat stays fully lit */
  let deepest = 0;
  shown.forEach((p) => { deepest = Math.max(deepest, Math.abs(camZ(p[0], p[1], p[2]))); });
  const shade = clamp(deepest / (reach * 0.6), 0, 1);

  tiles.forEach((cell, i) => {
    const p = shown[i];
    const raw = Math.pow(clamp((camZ(p[0], p[1], p[2]) / reach + 1) / 2, 0, 1), 1.25);
    const v = 1 - (1 - raw) * shade;
    /* an imperceptible step is not worth repainting 118 cards for */
    if (Math.abs(v - nearPrev[i]) < 0.02) return;
    nearPrev[i] = v;
    cell.style.setProperty('--near', v.toFixed(2));
  });
}

function applyRotation() {
  stageBoard.style.setProperty('--tilt', `${tilt.toFixed(2)}deg`);
  stageBoard.style.setProperty('--spin', `${spin.toFixed(2)}deg`);
  /* the zoom belongs to the page, because it is the stage that magnifies rather than the board inside it */
  pageTable.style.setProperty('--zoom', zoom.toFixed(3));
}

function glide() {
  spin += spinVel;
  tilt = clamp(tilt + tiltVel, -88, 88);
  spinVel *= 0.94;
  tiltVel *= 0.94;
  applyRotation();
  fadeByDepth();
  if (Math.abs(spinVel) + Math.abs(tiltVel) > 0.02) {
    glideRAF = requestAnimationFrame(glide);
  } else {
    spinVel = 0;
    tiltVel = 0;
    glideRAF = null;
  }
}

function startGlide() {
  if (reducedMotion || glideRAF || Math.abs(spinVel) + Math.abs(tiltVel) < 0.06) return;
  glideRAF = requestAnimationFrame(glide);
}

/* a turn is not a click: once the pointer has travelled, the release is swallowed */
stageView.addEventListener('pointerdown', (event) => {
  suppressClick = false;
  if (arrangement === 'table') return;
  if (glideRAF) { cancelAnimationFrame(glideRAF); glideRAF = null; }
  pinPose();
  spinVel = 0;
  tiltVel = 0;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: 0, pdx: 0, pdy: 0, raf: 0 };
  stageView.classList.add('dragging');
});

window.addEventListener('pointermove', (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  drag.x = event.clientX;
  drag.y = event.clientY;
  drag.moved += Math.abs(dx) + Math.abs(dy);
  drag.pdx += dx;
  drag.pdy += dy;
  if (!drag.raf) drag.raf = requestAnimationFrame(applyDrag);
}, { passive: true });

window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

function endDrag(event) {
  if (!drag || event.pointerId !== drag.id) return;
  if (drag.raf) { cancelAnimationFrame(drag.raf); drag.raf = 0; }
  suppressClick = drag.moved > 6;
  drag = null;
  stageView.classList.remove('dragging');
  startGlide();
}

stageView.addEventListener('click', (event) => {
  if (!suppressClick) return;
  suppressClick = false;
  event.stopPropagation();
  event.preventDefault();
}, true);

/* wheel events also queue up; the zoom is applied once per frame */
let wheelAcc = 0;
let wheelRAF = 0;

stageView.addEventListener('wheel', (event) => {
  if (arrangement === 'table') return;
  event.preventDefault();
  wheelAcc += event.deltaY;
  if (wheelRAF) return;
  wheelRAF = requestAnimationFrame(() => {
    wheelRAF = 0;
    pinPose();
    zoom = clamp(zoom * (1 - wheelAcc * 0.0014 * SENS.zoom * SENS.zoom), 0.55, 2.2);
    wheelAcc = 0;
    applyRotation();
  });
}, { passive: false });

function setMode(name) {
  if (!ARRANGEMENTS[name] || name === arrangement) return;
  if (!stageView.offsetWidth || !stageView.offsetHeight) return;
  const built = build(name);

  arrangement = name;
  setNav(name);
  pageTable.classList.remove('arriving');
  if (glideRAF) { cancelAnimationFrame(glideRAF); glideRAF = null; }
  spinVel = 0;
  tiltVel = 0;

  /* the flat table is only handed to the grid once the tiles have landed in their slots */
  if (name !== 'table') pageTable.dataset.mode = name;

  /* a hidden page never gets a frame to fly through, so it lands in its new shape straight away */
  if (reducedMotion || document.hidden) {
    if (morphRAF) { cancelAnimationFrame(morphRAF); morphRAF = null; }
    tilt = ARRANGEMENTS[name].tilt;
    spin = ARRANGEMENTS[name].spin;
    zoom = 1;
    snapTo(built.poses, built.reach, built.tile);
    if (name === 'table') landTable();
    applyRotation();
    return;
  }

  morphTo(built.poses, built.reach, built.tile);
}

/* the stage is measured whenever it gains a size, so reopening the page re-places everything;
   a resize fires a storm of observations, so the rebuild waits for the dust to settle */
let stageResizeTimer = null;
new ResizeObserver(() => {
  clearTimeout(stageResizeTimer);
  stageResizeTimer = setTimeout(() => {
    stageResizeTimer = null;
    relayout();
  }, 120);
}).observe(stageView);

zone.addEventListener('click', closeDetail);
zoomer.addEventListener('click', closeDetail);
factsClose.addEventListener('click', closeDetail);

detail.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab' || !detail.classList.contains('is-open')) return;
  const items = sheetFocusables();
  if (!items.length) { event.preventDefault(); factsClose.focus(); return; }
  const first = items[0];
  const last = items[items.length - 1];
  const inside = detail.contains(document.activeElement);

  if (event.shiftKey && (document.activeElement === first || !inside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
    event.preventDefault();
    first.focus();
  }
});

render();

/* ---------- the menu: a drawer with a lamp of its own, already lit ---------- */

const SENS = { turn: 1, zoom: 1 };

const menuTab = document.getElementById('menu-tab');
const scrim = document.getElementById('scrim');
const drawer = document.getElementById('drawer');
const settingsPane = drawer.querySelector('.drawer-pane[data-pane="settings"]');
const gearBtn = document.getElementById('drawer-gear');
const tableBtn = document.getElementById('drawer-table');
const nomBtn = document.getElementById('drawer-nom');
const nomBack = document.getElementById('nom-back');
const navItems = [...document.querySelectorAll('#goo-nav .goo-item')];
const gooDot = document.getElementById('goo-dot');
const gooPop = document.getElementById('goo-pop');
const GOO_DOT = 54;   /* must match the bubble sizes in the stylesheet */
const GOO_POP = 46;
let navSel = 'table';

const miniRoom = document.getElementById('mini-room');
const miniPull = document.getElementById('mini-pull');
const miniTab = document.getElementById('mini-tab');
const miniCord = miniPull.querySelector('.mini-cord');
const miniDot = miniPull.querySelector('.mini-dot');

/* the cord is measured in the panel's own scale, because a fixed pixel length would
   be a whip in a small box and a stub in a tall one; the swing itself is the main
   cord's physics unchanged — gravity, rope tension, air, and a switch at full stretch */
const mini = { rest: 34, max: 62, fire: 58 };
const miniRest = () => mini.rest + GRAVITY / ROPE_K;

const miniState = { x: 0, y: 0, vx: 0, vy: 0, raf: null, last: 0, drag: null, stretched: false, pivot: null, lastMove: null };

function drawMini() {
  miniCord.setAttribute('x2', miniState.x.toFixed(1));
  miniCord.setAttribute('y2', miniState.y.toFixed(1));
  miniDot.setAttribute('cx', miniState.x.toFixed(1));
  miniDot.setAttribute('cy', miniState.y.toFixed(1));
  miniTab.style.transform = `translate(${miniState.x.toFixed(1)}px, ${miniState.y.toFixed(1)}px)`;
}

function measureMini() {
  if (!miniRoom.offsetWidth) return;   /* the foot is hidden on the lamp page */
  const h = miniRoom.getBoundingClientRect().height || 230;
  mini.rest = h * 0.15;
  mini.max = h * 0.28;
  mini.fire = h * 0.255;
  if (miniState.drag) return;
  miniState.x = 0;
  miniState.y = miniRest();
  miniState.vx = 0;
  miniState.vy = 0;
  drawMini();
}

function miniFrame(now) {
  const dt = Math.min(0.032, (now - miniState.last) / 1000 || 0.016);
  miniState.last = now;

  const d = Math.hypot(miniState.x, miniState.y);
  let ax = 0;
  let ay = GRAVITY;
  if (d > mini.rest) {
    const tension = (-ROPE_K * (d - mini.rest)) / d;
    ax += tension * miniState.x;
    ay += tension * miniState.y;
  }
  ax -= miniState.vx * AIR_DRAG;
  ay -= miniState.vy * AIR_DRAG;

  miniState.vx += ax * dt;
  miniState.vy += ay * dt;
  miniState.x += miniState.vx * dt;
  miniState.y += miniState.vy * dt;

  const stretched = Math.hypot(miniState.x, miniState.y);
  if (stretched > mini.max) {
    const k = mini.max / stretched;
    miniState.x *= k;
    miniState.y *= k;
    miniState.vx *= 0.4;
    miniState.vy *= 0.4;
  }

  drawMini();

  const home = miniRest();
  const settled = Math.abs(miniState.x) < 0.5 && Math.abs(miniState.y - home) < 0.5 && Math.hypot(miniState.vx, miniState.vy) < 8;
  if (settled) {
    miniState.raf = null;
    miniState.x = 0;
    miniState.y = home;
    miniState.vx = 0;
    miniState.vy = 0;
    drawMini();
    return;
  }
  miniState.raf = requestAnimationFrame(miniFrame);
}

function miniRelease() {
  miniState.drag = null;
  miniPull.classList.remove('armed');

  /* the way out trips on letting go, never mid-stretch */
  if (miniState.stretched) {
    miniState.stretched = false;
    backToMenu();
  }

  if (reducedMotion) {
    cancelAnimationFrame(miniState.raf);
    miniState.raf = null;
    miniState.x = 0;
    miniState.y = miniRest();
    miniState.vx = 0;
    miniState.vy = 0;
    drawMini();
    return;
  }
  cancelAnimationFrame(miniState.raf);
  miniState.last = performance.now();
  miniState.raf = requestAnimationFrame(miniFrame);
}

miniTab.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  cancelAnimationFrame(miniState.raf);
  miniState.raf = null;
  miniState.pivot = miniPull.getBoundingClientRect();
  miniState.drag = event.pointerId;
  miniState.stretched = false;
  miniState.vx = 0;
  miniState.vy = 0;
  miniState.lastMove = { x: miniState.x, y: miniState.y, t: event.timeStamp };
  miniTab.setPointerCapture(event.pointerId);
});

miniTab.addEventListener('pointermove', (event) => {
  if (miniState.drag !== event.pointerId) return;

  const raw = { x: event.clientX - miniState.pivot.left, y: event.clientY - miniState.pivot.top };
  const rd = Math.hypot(raw.x, raw.y);
  const target = rd <= mini.max ? raw : { x: (raw.x * mini.max) / rd, y: (raw.y * mini.max) / rd };

  const atEnd = Math.hypot(target.x, target.y) >= mini.fire;
  if (atEnd) miniState.stretched = true;
  miniPull.classList.toggle('armed', atEnd);

  /* track speed so a cord dropped mid-flight keeps swinging */
  const dt = Math.max(0.008, (event.timeStamp - miniState.lastMove.t) / 1000);
  const speed = { x: (target.x - miniState.lastMove.x) / dt, y: (target.y - miniState.lastMove.y) / dt };
  const magnitude = Math.hypot(speed.x, speed.y);
  const cap = magnitude > 2600 ? 2600 / magnitude : 1;

  miniState.vx = speed.x * cap;
  miniState.vy = speed.y * cap;
  miniState.lastMove = { x: target.x, y: target.y, t: event.timeStamp };
  miniState.x = target.x;
  miniState.y = target.y;
  drawMini();
});

miniTab.addEventListener('pointerup', miniRelease);
miniTab.addEventListener('pointercancel', miniRelease);

miniTab.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.code !== 'Space') return;
  event.preventDefault();
  backToMenu();
});

/* the drawer is the way back out of everything, so its cord closes every layer too */
function backToMenu() {
  closeDrawer();
  if (window.scilampSandboxOpen && window.scilampCloseSandbox) window.scilampCloseSandbox();
  if (detail.classList.contains('is-open')) closeDetail();
  const open = document.querySelector('.page.is-open');
  if (!open) return;
  const key = open.id.slice('page-'.length);
  const { x, y } = pageOrigin();
  closePage(key, x, y);
}

function openSandboxFromNav({ shelf = false } = {}) {
  if (transitioning) {
    setTimeout(() => openSandboxFromNav({ shelf }), 220);
    return;
  }
  if (detail.classList.contains('is-open')) closeDetail();
  closeDrawer();

  const start = () => {
    if (window.scilampOpenSandbox) window.scilampOpenSandbox();
    if (shelf && window.scilampShowShelf) window.scilampShowShelf();
  };

  if (pageTable.classList.contains('is-open')) { start(); return; }

  const current = document.querySelector('.page.is-open');
  if (current) {
    current.classList.remove('is-open');
    current.setAttribute('aria-hidden', 'true');
  }
  pendingSandbox = true;
  const { x, y } = pageOrigin();
  openPage('table', x, y);
}

function drawerOpen() {
  return drawer.classList.contains('is-open');
}

function openDrawer() {
  if (drawerOpen()) return;
  drawer.classList.add('is-open');
  drawer.removeAttribute('aria-hidden');
  scrim.classList.add('is-on');
  menuTab.setAttribute('aria-expanded', 'true');
  /* the nav bubble reflects where you are: the shape you are looking at, or the
     flat table when nothing is open yet */
  setNav(document.querySelector('.page.is-open') ? arrangement : 'table');
  measureMini();
}

function closeDrawer() {
  if (!drawerOpen()) return;
  drawer.classList.remove('is-open');
  if (drawer.contains(document.activeElement)) menuTab.focus({ preventScroll: true });
  drawer.setAttribute('aria-hidden', 'true');
  scrim.classList.remove('is-on');
  menuTab.setAttribute('aria-expanded', 'false');
}

menuTab.addEventListener('click', () => (drawerOpen() ? closeDrawer() : openDrawer()));
scrim.addEventListener('click', closeDrawer);
document.getElementById('drawer-close').addEventListener('click', closeDrawer);

/* the gear unfolds the settings section in place; the table button is the way in */
function setSettings(open) {
  settingsPane.hidden = !open;
  settingsPane.classList.toggle('is-on', open);
  gearBtn.setAttribute('aria-expanded', String(open));
}

gearBtn.addEventListener('click', () => setSettings(settingsPane.hidden));

/* each section button opens its page from the drawer, closing whatever was up */
tableBtn.addEventListener('click', () => openKey('table'));
nomBtn.addEventListener('click', () => openKey('nom'));
nomBack.addEventListener('click', backToMenu);

/* the panel is measured again once it finishes sliding in, because a viewport
   that was asleep while it opened can hand back half-baked widths */
drawer.addEventListener('transitionend', (event) => {
  if (event.propertyName !== 'transform' || !drawerOpen()) return;
  measureMini();
});

/* the raised bubble follows the active item; the bar and the bubble are one
   blurred body, so the neck between them stays gooey while it travels */
function placeGoo() {
  const active = navItems.find((b) => b.dataset.nav === navSel && b.offsetWidth);
  if (!active) return;
  const cx = active.offsetLeft + active.offsetWidth / 2;
  gooDot.style.transform = `translateX(${(cx - GOO_DOT / 2).toFixed(1)}px)`;
  gooPop.style.transform = `translateX(${(cx - GOO_POP / 2).toFixed(1)}px)`;
}

function setNav(name) {
  navSel = name;
  navItems.forEach((b) => {
    const on = b.dataset.nav === name;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  placeGoo();
}

navItems.forEach((button) => button.addEventListener('click', () => {
  const name = button.dataset.nav;
  if (name === 'lamp') { backToMenu(); return; }

  setNav(name);
  if (document.querySelector('.page.is-open')) {
    setMode(name);
  } else {
    pendingMode = name;
    const { x, y } = pageOrigin();
    openPage('table', x, y);
  }
}));

function pickGroup(selector, apply) {
  const buttons = [...document.querySelectorAll(selector)];
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      apply(button);
      buttons.forEach((b) => {
        const on = b === button;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
    });
  });
}

pickGroup('[data-scheme]', (b) => { document.documentElement.dataset.scheme = b.dataset.scheme; });
pickGroup('[data-theme]', (b) => { document.documentElement.dataset.theme = b.dataset.theme; });

function bindSens(id, key) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const paint = () => {
    SENS[key] = Number(input.value);
    out.textContent = SENS[key].toFixed(1);
  };
  input.addEventListener('input', paint);
  paint();
}

bindSens('sens-turn', 'turn');
bindSens('sens-zoom', 'zoom');

let winResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(winResizeTimer);
  winResizeTimer = setTimeout(() => {
    measureMini();
    if (pageTable.classList.contains('is-open')) placeGoo();
  }, 150);
});
setNav('table');
measureMini();

/* small public surface for the sandbox, the index and the tour */
window.SciLampSheet = {
  openElement,
  openProduct,
  openHint,
  close: closeDetail,
  isOpen: () => detail.classList.contains('is-open'),
};
window.SciLampNav = {
  page: showPage,
  home: backToMenu,
  drawer: (open) => (open ? openDrawer() : closeDrawer()),
  settings: (open) => setSettings(Boolean(open)),
  openSandbox: openSandboxFromNav,
  index: () => showPage('index'),
  tutorial: () => { if (window.scilampStartTutorial) window.scilampStartTutorial(); },
};
