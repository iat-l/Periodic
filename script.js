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

  if (drawerOpen()) { closeDrawer(); return; }

  if (detail.classList.contains('is-open')) { closeDetail(); return; }

  const open = document.querySelector('.page.is-open');
  if (open) {
    const key = open.id.slice('page-'.length);
    const { x, y } = cardCentre(document.querySelector(`[data-page="${key}"]`));
    closePage(key, x, y);
    return;
  }
  if (isLit()) turnOff();
});

/* ---------- the card: tilts to the pointer, opens its page ---------- */

const MAX_TILT = 9;

document.querySelectorAll('.card').forEach((card) => {
  const tilt = card.querySelector('.card-tilt');

  const setTilt = (ms) => {
    tilt.style.transition = `transform ${ms}ms var(--ease)`;
  };

  card.addEventListener('pointermove', (event) => {
    if (reducedMotion || event.pointerType === 'touch') return;

    const box = card.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width;
    const py = (event.clientY - box.top) / box.height;

    setTilt(90);
    card.style.setProperty('--tx', `${(0.5 - py) * MAX_TILT * 2}deg`);
    card.style.setProperty('--ty', `${(px - 0.5) * MAX_TILT * 2}deg`);
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
  });

  card.addEventListener('pointerleave', () => {
    setTilt(550);
    card.style.setProperty('--tx', '0deg');
    card.style.setProperty('--ty', '0deg');
  });

  card.addEventListener('click', (event) => {
    openPage(card.dataset.page, event.clientX, event.clientY);
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.code === 'Space') {
      event.preventDefault();
      const { x, y } = cardCentre(card);
      openPage(card.dataset.page, x, y);
    }
  });
});

/* ---------- periodic table page ---------- */

const REVEAL_MS = 640;
const reveal = document.getElementById('reveal');
let transitioning = false;
let pendingMode = null;   /* a shape picked from the menu before the page exists */

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

const GASES = new Set([1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86]);
const LIQUIDS = new Set([35, 80]);
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
const facts = {
  num: document.getElementById('zoom-num'),
  sym: document.getElementById('zoom-sym'),
  name: document.getElementById('zoom-name'),
  mass: document.getElementById('zoom-mass'),
  title: document.getElementById('facts-title'),
  sub: document.getElementById('facts-sub'),
  note: document.getElementById('facts-note'),
  list: document.getElementById('facts-list'),
  hazards: document.getElementById('facts-hazards'),
  bohr: document.getElementById('bohr'),
};

const ZOOM_MS = 520;
let activeCell = null;
let zoomHome = 'none';

/* everything outside the dialog stops taking focus while it is up */
function silencePage(quiet) {
  document.querySelectorAll('.page-bar, .table-scroll, .legend').forEach((part) => {
    part.inert = quiet;
  });
}

function fillPanel(el) {
  const [num, sym, name, cat, x, y, mass, codes, note] = el;
  const main = y <= 7;
  const { notation, shells } = electronArrangement(num);
  const state = GASES.has(num) ? 'gas' : LIQUIDS.has(num) ? 'liquid' : 'solid';

  detail.dataset.cat = cat;
  facts.num.textContent = num;
  facts.sym.textContent = sym;
  facts.name.textContent = name;
  facts.mass.textContent = `${mass} u`;

  facts.title.textContent = `${sym} — ${name}`;
  facts.sub.textContent = `${CATEGORIES[cat]} · ${main ? `group ${x}` : 'f-block'} · period ${main ? y : y - 3} · ${state} at 25 °C`;
  facts.note.textContent = note;

  facts.list.innerHTML = `
    <div><dt>Atomic number</dt><dd>${num}</dd></div>
    <div><dt>Relative atomic mass</dt><dd>${mass}${mass.startsWith('[') ? ' <span class="fact-hint">most stable isotope</span>' : ' <span class="fact-hint">u</span>'}</dd></div>
    <div><dt>Electron arrangement</dt><dd>${notation}</dd></div>
    <div><dt>Shells</dt><dd>${shells.join(' · ')}</dd></div>`;

  const list = codes ? codes.split(' ') : [];
  const tags = list.length ? list : ['none'];
  facts.hazards.innerHTML = tags.map((c) => (
    c === 'none'
      ? '<li><b>No hazard classification</b><i>Still worth treating as a laboratory chemical: no eating, wash hands, avoid dust.</i></li>'
      : `<li data-hz="${c}"><b>${HAZARDS[c][0]}</b><i>${HAZARDS[c][1]}</i></li>`
  )).join('');

  facts.bohr.innerHTML = `${bohrSvg(sym, num, shells)}<figcaption>Bohr model — electrons per shell from the ground state</figcaption>`;
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

function openDetail(cell, el) {
  activeCell = cell;
  fillPanel(el);
  cell.classList.add('is-source');
  silencePage(true);

  detail.classList.add('is-open');
  detail.removeAttribute('aria-hidden');
  growFrom(cell);

  requestAnimationFrame(() => detail.classList.add('in'));
  setTimeout(() => document.getElementById('facts-close').focus(), reducedMotion ? 0 : ZOOM_MS);
}

function closeDetail() {
  detail.classList.remove('in');

  const done = () => {
    detail.classList.remove('is-open');
    detail.setAttribute('aria-hidden', 'true');
    silencePage(false);
    if (activeCell) {
      activeCell.classList.remove('is-source');
      activeCell.focus();
      activeCell = null;
    }
    zoomer.style.transition = 'none';
    zoomer.style.transform = 'none';
  };

  if (reducedMotion) { done(); return; }

  zoomer.style.transition = `transform ${ZOOM_MS}ms var(--ease)`;
  zoomer.style.transform = zoomHome;
  setTimeout(done, ZOOM_MS);
}

function buildTable() {
  const frag = document.createDocumentFragment();

  ELEMENTS.forEach((el) => {
    const [num, sym, name, cat, x, y] = el;
    const cell = document.createElement('div');
    cell.className = 'el';
    cell.dataset.cat = cat;
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
    const item = document.createElement('span');
    item.className = 'legend-item';
    item.dataset.cat = key;
    item.innerHTML = `<span class="legend-dot"></span>${label}`;
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
      relayout();
      if (pendingMode) {
        const picked = pendingMode;
        pendingMode = null;
        setMode(picked);
      } else {
        arriveTable();
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
  page.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('page-open');

  if (!reducedMotion) {
    reveal.classList.add('animate');
    setCircle(x, y, 0);
  }

  setTimeout(() => {
    reveal.classList.remove('animate', 'active');
    transitioning = false;
    document.querySelector(`[data-page="${key}"]`)?.focus();
  }, reducedMotion ? 0 : REVEAL_MS);
}

function cardCentre(card) {
  const box = card.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
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
    cell.style.setProperty('--near', (1 - (1 - raw) * shade).toFixed(3));
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
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: 0 };
  stageView.classList.add('dragging');
});

window.addEventListener('pointermove', (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  drag.x = event.clientX;
  drag.y = event.clientY;
  drag.moved += Math.abs(dx) + Math.abs(dy);

  /* the slider reads as a multiplier but bites as its square, so the two ends
     of the range feel like entirely different hands on the wheel */
  const turn = SENS.turn * SENS.turn;
  spin += dx * 0.32 * turn;
  tilt = clamp(tilt - dy * 0.32 * turn, -88, 88);
  spinVel = spinVel * 0.7 + dx * 0.1 * turn;
  tiltVel = tiltVel * 0.7 - dy * 0.1 * turn;
  applyRotation();
  fadeByDepth();
});

window.addEventListener('pointerup', (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  suppressClick = drag.moved > 6;
  drag = null;
  stageView.classList.remove('dragging');
  startGlide();
});

stageView.addEventListener('click', (event) => {
  if (!suppressClick) return;
  suppressClick = false;
  event.stopPropagation();
  event.preventDefault();
}, true);

stageView.addEventListener('wheel', (event) => {
  if (arrangement === 'table') return;
  event.preventDefault();
  pinPose();
  zoom = clamp(zoom * (1 - event.deltaY * 0.0014 * SENS.zoom * SENS.zoom), 0.55, 2.2);
  applyRotation();
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

/* the stage is measured whenever it gains a size, so reopening the page re-places everything */
new ResizeObserver(() => relayout()).observe(stageView);

zone.addEventListener('click', closeDetail);
zoomer.addEventListener('click', closeDetail);
document.getElementById('facts-close').addEventListener('click', closeDetail);

render();

/* ---------- the menu: a drawer with a lamp of its own, already lit ---------- */

const SENS = { turn: 1, zoom: 1 };

const menuTab = document.getElementById('menu-tab');
const scrim = document.getElementById('scrim');
const drawer = document.getElementById('drawer');
const settingsPane = drawer.querySelector('.drawer-pane[data-pane="settings"]');
const navItems = [...drawer.querySelectorAll('.goo-item')];
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

/* the drawer is the way back out of everything, so its cord closes the page too */
function backToMenu() {
  closeDrawer();
  const open = document.querySelector('.page.is-open');
  if (!open) return;
  const key = open.id.slice('page-'.length);
  const { x, y } = cardCentre(document.querySelector(`[data-page="${key}"]`));
  closePage(key, x, y);
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
  /* what the menu offers depends on where you are: the lamp and its cord
     only mean something once a page is open */
  setNav(document.querySelector('.page.is-open') ? arrangement : 'table');
  measureMini();
}

function closeDrawer() {
  if (!drawerOpen()) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  scrim.classList.remove('is-on');
  menuTab.setAttribute('aria-expanded', 'false');
}

menuTab.addEventListener('click', () => (drawerOpen() ? closeDrawer() : openDrawer()));
scrim.addEventListener('click', closeDrawer);
document.getElementById('drawer-close').addEventListener('click', closeDrawer);

/* the panel is measured again once it finishes sliding in, because a viewport
   that was asleep while it opened can hand back half-baked widths */
drawer.addEventListener('transitionend', (event) => {
  if (event.propertyName !== 'transform' || !drawerOpen()) return;
  placeGoo();
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
  settingsPane.hidden = name !== 'settings';
  settingsPane.classList.toggle('is-on', name === 'settings');
  placeGoo();
}

navItems.forEach((button) => button.addEventListener('click', () => {
  const name = button.dataset.nav;
  if (name === 'settings') { setNav('settings'); return; }
  if (name === 'lamp') { backToMenu(); return; }

  setNav(name);
  if (document.querySelector('.page.is-open')) {
    setMode(name);
  } else {
    pendingMode = name;
    const card = document.querySelector('[data-page="table"]');
    const { x, y } = cardCentre(card);
    openPage('table', x, y);
  }
  /* the shape morphs behind the panel, so the panel gets out of the way */
  setTimeout(closeDrawer, 280);
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

window.addEventListener('resize', () => {
  measureMini();
  if (drawerOpen()) placeGoo();
});
setNav('table');
measureMini();
