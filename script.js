const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionQuery.matches;
motionQuery.addEventListener?.('change', (event) => { reducedMotion = event.matches; });

const I18N = window.SciLampI18n;
const elName = (el) => I18N?.elementName(el) ?? el[2];
const catName = (cat) => I18N?.categoryName(cat) ?? CATEGORIES[cat];

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;

  /* the tour owns Escape while it is up, so one press cannot dismiss two layers */
  if (window.scilampTutorialOpen) return;

  if (helpVisible) { closeHelp(); return; }

  if (detail.classList.contains('is-open')) { closeDetail(); return; }

  if (navMenuOpen()) { closeNavMenu({ restoreFocus: true }); return; }

  if (window.scilampSandboxOpen) { dismissSandbox(); return; }

  if (committedKey) routeToCover();
});

/* ---------- periodic table page ---------- */

const navHome = document.getElementById('nav-home');
const navMore = document.getElementById('nav-more');
const navMenu = document.getElementById('nav-menu');
const navSettings = document.getElementById('nav-settings');
const routeLoader = document.getElementById('route-loader');
const routeBackdrop = document.getElementById('route-backdrop');
const sandboxEl = document.getElementById('sandbox');
const topnavLinks = [...document.querySelectorAll('.topnav-link')];
let pendingMode = null;   /* a shape picked from the menu before the page exists */
let committedKey = null;  /* the page that stays visible after the current route settles */
let routeSeq = 0;
let routeTimer = 0;
let loaderTimer = 0;
let sandboxBaseKey = null;
let routeZ = 100;

const routeMs = () => (reducedMotion ? 0 : 300);
const LOADER_DELAY = 380;
const PAGE_SCROLLER = '.courses-app, .index-app, .notes-app, .table-scroll';

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
  hud.name.textContent = `${num} · ${elName([num, sym, name, cat])}`;
  hud.cat.textContent = `${catName(cat)} · ${main ? `${I18N?.t('group', '族') ?? 'group'} ${x}` : 'f-block'} · ${I18N?.t('period', '週期') ?? 'period'} ${main ? y : y - 3}`;
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
let sheetHint = null;
let sheetElement = null;
let sheetReturnFocus = null;
let sheetClosing = false;
let finishSheetClose = null;
let sheetCloseTimer = 0;

/* the sheet sits above every page; everything behind it is made inert for as long
   as it is up, and every part gets its previous value back on close.  The tutorial
   is deliberately left alone so its controls keep working while a step shows a card. */
const QUIET_PARTS = '.cover, .page, .sandbox, .topbar, .help';
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

const STAR_PATH = 'M12 3.6l2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.61 6.9 19.3l.98-5.68L3.75 9.6l5.7-.83z';
const starSvg = `<svg class="icon-star" viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
const copySvg = `<svg class="icon-copy" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="1.8"/><path d="M5.5 14.5V5.5h9"/></svg><svg class="icon-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7.2"/></svg>`;

function favoriteButton(record, extraClass = '') {
  if (!record || !window.SciLampFx) return '';
  const active = window.SciLampStore ? SciLampStore.isFavorite(record.id) : false;
  const label = active
    ? (I18N?.t('Remove from favorites', '從收藏移除') ?? 'Remove from favorites')
    : (I18N?.t('Save to favorites', '收藏') ?? 'Save to favorites');
  return `<button class="icon-btn${extraClass ? ` ${extraClass}` : ''}" type="button" data-sheet-action="favorite"
    aria-pressed="${active}" aria-label="${label}" title="${label}">${starSvg}</button>`;
}

function copyButton(label) {
  if (!window.SciLampFx) return '';
  const text = I18N?.t('Copy a shareable summary', '複製可分享的摘要') ?? 'Copy a shareable summary';
  return `<button class="icon-btn" type="button" data-sheet-action="copy" aria-label="${text}" title="${esc(label)}">${copySvg}</button>`;
}

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
  facts.name.textContent = elName(el);
  facts.mass.textContent = `${mass} u`;

  facts.title.textContent = `${sym} — ${elName(el)}`;
  const position = main ? `${I18N?.t('group', '族') ?? 'group'} ${x}` : 'f-block';
  const period = `${I18N?.t('period', '週期') ?? 'period'} ${main ? y : y - 3}`;
  facts.sub.textContent = `${catName(cat)} · ${position} · ${period} · ${I18N?.stateName(phase) ?? phase} ${I18N?.t('at 25 °C', '在 25 °C') ?? 'at 25 °C'}`;
  facts.desc.textContent = I18N?.elementDescription(el) || description || note;
  facts.note.hidden = true;
  facts.note.textContent = '';
  facts.safetyH.hidden = false;
  facts.bohr.hidden = false;
  sheetElement = el;
  const record = window.SciLampFx ? SciLampFx.elementRecord(el) : null;
  facts.actions.innerHTML = favoriteButton(record);
  facts.actions.hidden = !facts.actions.innerHTML;

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

function cancelSheetClose() {
  if (!sheetClosing) return;
  clearTimeout(sheetCloseTimer);
  sheetClosing = false;
  finishSheetClose = null;
  zoomer.style.transition = 'none';
  zoomer.style.transform = 'none';
  zoomHome = 'none';
}

function openDetail(cell, el) {
  cancelSheetClose();
  if (activeCell && activeCell !== cell) activeCell.classList.remove('is-source');
  activeCell = cell;
  sheetMode = 'element';
  sheetProduct = null;
  sheetHint = null;
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
  product.diatomic
    ? (I18N?.t('Diatomic element', '雙原子元素') ?? 'Diatomic element')
    : I18N?.kindLabel(product.kind) || SB.KIND_LABEL[product.kind] || 'Compound'
);

function localizeComposition(text) {
  if (!I18N?.isZh || !text) return text;
  if (/variable composition/i.test(text)) return I18N.t('variable composition', '組成可變');
  return text.replace(/(\d+)\s+([a-z]+)/g, (match, count, name) => {
    const row = ELEMENTS.find((entry) => entry[2].toLowerCase() === name);
    return `${count} ${row ? I18N.elementName(row) : name}`;
  });
}

function fillProductSheet(product, mode) {
  const kind = productKind(product);
  const molar = compoundMass(product);
  const tr = (en, zh) => I18N?.t(en, zh) ?? en;
  sheetElement = null;
  const zhText = I18N?.compoundText(product);
  const description = zhText?.description || product.description;
  const why = zhText?.why || product.why;
  const formation = zhText?.formation || product.formation;
  const properties = zhText?.properties || product.properties;
  const composition = localizeComposition(product.compositionText || '');
  const supplied = localizeComposition(product.suppliedText || '');
  const ratioLabel = product.ratio
    ? (I18N?.isZh ? `${product.ratio[0]} 陽離子 : ${product.ratio[1]} 陰離子` : SB.ratioText(product.ratio))
    : '';
  detail.dataset.mode = mode;
  detail.dataset.cat = product.kind === 'alloy' ? 'p' : 'compound';

  const displayName = I18N?.compoundName(product) || product.name;
  facts.num.textContent = product.units > 1 ? `${product.units} ×` : '';
  facts.sym.textContent = product.formula;
  facts.name.textContent = displayName;
  facts.mass.textContent = molar
    ? `${molar} u ${tr('per formula unit', '每化學式單位')}`
    : tr('variable composition', '組成可變');

  facts.title.textContent = mode === 'created' ? displayName : `${product.formula} — ${displayName}`;
  const bits = [kind];
  if (product.ratio) bits.push(ratioLabel);
  if (product.units > 1) bits.push(`${product.units} ${tr('formula units', '化學式單位')}`);
  facts.sub.textContent = bits.join(' · ');

  facts.desc.textContent = mode === 'created' ? (why || description) : (description || why);
  facts.note.hidden = mode === 'created';
  facts.note.textContent = mode === 'created'
    ? ''
    : [why, formation].filter(Boolean).join(' ');

  const rows = [
    `<div><dt>${tr('Compound type', '化合物類型')}</dt><dd>${kind}</dd></div>`,
    `<div><dt>${tr('Composition', '組成')}</dt><dd>${esc(composition)}</dd></div>`,
    `<div><dt>${tr('Molar mass', '莫耳質量')}</dt><dd>${molar ? `${molar} u` : tr('Variable — an alloy has no fixed formula', '可變——合金沒有固定化學式')}</dd></div>`,
  ];
  if (product.ratio) rows.push(`<div><dt>${tr('Ion ratio', '離子比')}</dt><dd>${ratioLabel}</dd></div>`);
  rows.push(`<div><dt>${tr('How it forms', '如何形成')}</dt><dd>${esc(formation || '')}</dd></div>`);
  rows.push(`<div><dt>${tr('Properties', '性質')}</dt><dd>${esc(properties || '')}</dd></div>`);
  rows.push(`<div><dt>${tr('Elements', '元素')}</dt><dd>${product.contains.map((s) => `${s} <span class="fact-hint">${elementName(s)}</span>`).join(', ')}</dd></div>`);
  if (supplied) rows.push(`<div><dt>${tr('On the bench', '實驗台上')}</dt><dd>${esc(supplied)}</dd></div>`);
  facts.list.innerHTML = rows.join('');

  facts.ext.innerHTML = '';
  facts.spectrum.hidden = true;
  facts.spectrum.innerHTML = '';
  facts.hazards.innerHTML = '';
  facts.safetyH.hidden = true;
  facts.bohr.hidden = true;
  facts.bohr.innerHTML = '';

  const saved = window.SciLampStore && SciLampStore.hasProduct(product.key);
  const favRecord = window.SciLampFx ? SciLampFx.productRecord(product) : null;
  const tools = `${favoriteButton(favRecord)}${copyButton(`${product.formula} — ${displayName}`)}`;
  facts.actions.hidden = false;
  if (mode === 'created') {
    facts.actions.innerHTML = `${tools}
      <span class="sheet-saved"><span aria-hidden="true">✓</span> ${tr('Saved', '已保存')}</span>
      <button class="sheet-btn" type="button" data-sheet-action="details">${tr('full details', '完整資料')}</button>
      <button class="sheet-btn is-ghost" type="button" data-sheet-action="close">${tr('done', '完成')}</button>`;
  } else {
    facts.actions.innerHTML = `${tools}
      <button class="sheet-btn" type="button" data-sheet-action="sandbox">${tr('open the sandbox', '打開實驗台')}</button>
      ${saved ? `<span class="sheet-saved"><span aria-hidden="true">✓</span> ${tr('Saved', '已保存')}</span>` : ''}
      <button class="sheet-btn is-ghost" type="button" data-sheet-action="close">${tr('done', '完成')}</button>`;
  }
}

function fillHintSheet(compound) {
  const atoms = compound.atoms || {};
  const syms = Object.keys(atoms);
  const total = syms.reduce((sum, s) => sum + atoms[s], 0);
  const metalCount = compound.metals ? compound.metals.length : 0;
  const kind = I18N?.kindLabel(compound.kind) || SB.KIND_LABEL[compound.kind] || 'Compound';
  const tr = (en, zh) => I18N?.t(en, zh) ?? en;
  const zhHint = I18N?.compoundText(compound)?.hint;
  sheetElement = null;

  detail.dataset.mode = 'hint';
  detail.dataset.cat = 'hint';

  facts.num.textContent = '?';
  facts.sym.textContent = '???';
  facts.name.textContent = tr('Undiscovered compound', '未發現的化合物');
  facts.mass.textContent = tr('identity hidden', '身分隱藏');

  facts.title.textContent = I18N?.isZh ? `未知${kind}` : `Unknown ${kind.toLowerCase()}`;
  facts.sub.textContent = I18N?.isZh
    ? (metalCount ? `${kind} · ${metalCount} 種金屬 · 比例可變` : `${kind} · ${total} 顆原子 · ${syms.length} 種元素`)
    : (metalCount ? `${kind} · ${metalCount} metals · variable ratio` : `${kind} · ${total} atoms · ${syms.length} element${syms.length === 1 ? '' : 's'}`);
  facts.desc.textContent = tr(
    'This compound stays hidden until the bench makes it. Discover it in the sandbox and its name and formula appear here.',
    '這個化合物要在實驗台做出來才會揭曉。到實驗台發現它，名稱與化學式就會出現在這裡。'
  );
  facts.note.hidden = false;
  facts.note.textContent = I18N?.isZh
    ? `提示：${zhHint || compound.hint}`
    : `Hint: ${compound.hint}`;

  facts.list.innerHTML = `
    <div><dt>${tr('Compound type', '化合物類型')}</dt><dd>${kind}</dd></div>
    <div><dt>${tr('Atoms in formula', '化學式中的原子數')}</dt><dd>${metalCount ? tr('variable', '可變') : total}</dd></div>
    <div><dt>${tr('Elements involved', '涉及元素')}</dt><dd>${metalCount || syms.length}</dd></div>`;

  facts.ext.innerHTML = '';
  facts.spectrum.hidden = true;
  facts.spectrum.innerHTML = '';
  facts.hazards.innerHTML = '';
  facts.safetyH.hidden = true;
  facts.bohr.hidden = true;
  facts.bohr.innerHTML = '';

  facts.actions.hidden = false;
  facts.actions.innerHTML = `
    <button class="sheet-btn" type="button" data-sheet-action="sandbox">${tr('open the sandbox', '打開實驗台')}</button>
    <button class="sheet-btn is-ghost" type="button" data-sheet-action="close">${tr('done', '完成')}</button>`;
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
  sheetHint = null;
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
  sheetHint = compound;
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

/* the same sheet opened from a favorites card, with no tile to grow from */
function openElementSheet(which, { trigger = null } = {}) {
  const el = typeof which === 'number' ? ELEMENTS[which - 1] : ELEMENTS.find((entry) => entry[1] === which);
  if (!el) return;
  cancelSheetClose();
  if (activeCell) {
    activeCell.classList.remove('is-source');
    activeCell = null;
  }
  sheetMode = 'element';
  sheetProduct = null;
  sheetHint = null;
  if (trigger) sheetReturnFocus = trigger;
  fillPanel(el);
  detail.dataset.mode = 'element';

  if (detail.classList.contains('is-open')) {
    factsPane.scrollTop = 0;
    factsClose.focus({ preventScroll: true });
    return;
  }

  zoomer.style.transition = 'none';
  zoomer.style.transform = 'none';
  zoomHome = 'none';
  beginSheet('element', trigger);
}

function closeDetail({ instant = false } = {}) {
  if (!detail.classList.contains('is-open')) return;
  if (sheetClosing) {
    if (instant && finishSheetClose) finishSheetClose();
    return;
  }
  sheetClosing = true;
  detail.classList.remove('in');

  const mode = sheetMode;
  const back = sheetReturnFocus;
  const done = () => {
    if (!sheetClosing) return;
    clearTimeout(sheetCloseTimer);
    sheetClosing = false;
    finishSheetClose = null;
    detail.classList.remove('is-open');
    detail.setAttribute('aria-hidden', 'true');
    silencePage(false);
    if (activeCell) activeCell.classList.remove('is-source');
    if (detail.contains(document.activeElement)) document.activeElement.blur();

    activeCell = null;
    sheetProduct = null;
    sheetHint = null;
    sheetElement = null;
    sheetReturnFocus = null;
    sheetMode = 'element';
    zoomer.style.transition = 'none';
    zoomer.style.transform = 'none';
    zoomHome = 'none';

    if (window.scilampTutorialOpen) return;
    if (back && document.contains(back) && back.getClientRects().length) {
      back.focus({ preventScroll: true });
    } else if (navHome) {
      navHome.focus({ preventScroll: true });
    }
  };
  finishSheetClose = done;

  if (instant || reducedMotion) { done(); return; }

  const ms = mode === 'element' ? ZOOM_MS : 300;
  zoomer.style.transition = `transform ${ms}ms var(--ease)`;
  zoomer.style.transform = zoomHome;
  sheetCloseTimer = setTimeout(done, ms);
}

facts.actions.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-sheet-action]');
  if (!btn) return;
  const action = btn.dataset.sheetAction;

  if (action === 'favorite') {
    if (!window.SciLampFx) return;
    const record = sheetMode === 'element' && sheetElement
      ? SciLampFx.elementRecord(sheetElement)
      : SciLampFx.productRecord(sheetProduct);
    if (!record) return;
    const active = SciLampFx.toggle(record);
    SciLampFx.syncFavorite(btn, active);
    SciLampFx.pop(btn);
    return;
  }

  if (action === 'copy' && sheetProduct && window.SciLampFx) {
    SciLampFx.copy(SciLampFx.productSummary(sheetProduct), btn);
    return;
  }

  if (action === 'close') { closeDetail(); return; }

  if (action === 'details' && sheetProduct) {
    fillProductSheet(sheetProduct, 'detail');
    factsPane.scrollTop = 0;
    factsClose.focus({ preventScroll: true });
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
    cell.setAttribute('aria-label', I18N
      ? I18N.t(`${num} ${sym} ${name}, ${CATEGORIES[cat]} — open details`, `${num} ${sym} ${elName(el)}，${catName(cat)}——開啟詳細資料`)
      : `${num} ${sym} ${name}, ${CATEGORIES[cat]} — open details`);
    cell.style.setProperty('--art', SciLampArt.forSymbol(sym));
    cell.style.setProperty('--mark', SciLampArt.forMark(sym));
    cell.innerHTML = `<span class="el-art" aria-hidden="true"></span><span class="el-mark" aria-hidden="true"></span><span class="el-num">${num}</span><span class="el-sym">${sym}</span><span class="el-flag" aria-hidden="true"></span>`;
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

  const LEGEND_LABEL = { e: 'alkaline earth', p: 'post-transition', u: 'unknown' };
  Object.entries(CATEGORIES).forEach(([key, label]) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'legend-item';
    item.dataset.cat = key;
    item.dataset.label = LEGEND_LABEL[key] || label;
    item.setAttribute('aria-pressed', 'false');
    item.setAttribute('aria-label', I18N
      ? I18N.t(`Filter ${label} elements`, `篩選${catName(key)}元素`)
      : `Filter ${label} elements`);
    item.innerHTML = `<span class="legend-dot"></span>${catName(key)}`;
    item.addEventListener('click', () => {
      if (catFilter.has(key)) catFilter.delete(key);
      else catFilter.add(key);
      item.setAttribute('aria-pressed', String(catFilter.has(key)));
      applyFilters();
    });
    document.getElementById('legend').append(item);
  });
}

function pageEl(key) {
  return document.getElementById(`page-${key}`);
}

function sandboxVisible() {
  return !!sandboxEl && !sandboxEl.hidden;
}

function replayCoverEntrance() {
  if (reducedMotion || !cover) return;
  cover.classList.remove('is-entering');
  void cover.offsetWidth;
  cover.classList.add('is-entering');
}

/* the page itself is a shell; its content scrolls in one inner region */
function scrollerFor(layer) {
  if (!layer || layer === cover || layer === sandboxEl) return layer;
  return layer.querySelector(PAGE_SCROLLER) || layer;
}

/* called at the start of a route: the incoming layer is still transparent,
   so the user never sees the jump to the top */
function resetScroll(layer) {
  if (!layer) return;
  const scroller = scrollerFor(layer);
  if (!scroller) return;
  scroller.scrollTop = 0;
  scroller.scrollLeft = 0;
  window.scrollTo(0, 0);
}

/* an opaque sheet below all pages, above the menu: page-to-page cross-fades
   must never reveal the cover between the two layers */
function setRouteBackdrop(on) {
  routeBackdrop?.classList.toggle('is-on', Boolean(on));
}

function nextRouteZ() {
  routeZ = Math.min(routeZ + 2, 140);
  return routeZ;
}

function hideRouteLoader() {
  clearTimeout(loaderTimer);
  routeLoader?.classList.remove('is-on');
}

/* the bar is armed before the target renders: ordinary in-memory routes win
   the race and never show it, a blocked render does */
function armRouteLoader(seq) {
  hideRouteLoader();
  loaderTimer = setTimeout(() => {
    if (seq === routeSeq) routeLoader?.classList.add('is-on');
  }, LOADER_DELAY);
}

function preparePage(page) {
  page.classList.remove('is-open', 'is-leaving');
  page.classList.add('is-entering');
  page.removeAttribute('aria-hidden');
  page.inert = false;
}

function enterPage(page) {
  if (reducedMotion) {
    page.classList.remove('is-entering');
    page.classList.add('is-open');
    return;
  }
  void page.offsetWidth;                       /* commit the transparent start pose */
  page.classList.add('is-open');
}

function hidePage(page, { animate = false } = {}) {
  if (!page) return;
  if (page.contains(document.activeElement)) document.activeElement.blur();
  page.classList.remove('is-entering');
  if (animate && !reducedMotion) {
    page.classList.remove('is-open');
    page.classList.add('is-leaving');
  } else {
    page.classList.remove('is-open', 'is-leaving');
    page.style.zIndex = '';
  }
  page.setAttribute('aria-hidden', 'true');
  page.inert = true;
}

function initTableRoute(key) {
  if (key !== 'table') return;
  syncArrange(arrangement);
  relayout();
  if (pendingMode) {
    const picked = pendingMode;
    pendingMode = null;
    setMode(picked);
  } else {
    arriveTable();
  }
}

/* every layer that is not the destination starts dissolving on the same frame */
function retireOtherPages(target, z) {
  document.querySelectorAll('.page').forEach((page) => {
    if (page === target) return;
    page.style.zIndex = String(z);
    if (page.classList.contains('is-open') || page.classList.contains('is-entering')) {
      if (page.contains(document.activeElement)) document.activeElement.blur();
      page.classList.remove('is-open', 'is-entering');
      page.classList.add('is-leaving');
      page.setAttribute('aria-hidden', 'true');
      page.inert = true;
    }
  });
}

function settlePage(key, target, seq) {
  if (seq !== routeSeq) return;
  hideRouteLoader();

  if (sandboxVisible() && window.scilampCloseSandbox) {
    window.scilampCloseSandbox({ animate: false, restoreFocus: false });
  }
  document.querySelectorAll('.page').forEach((page) => {
    if (page !== target) hidePage(page);
  });

  target.classList.remove('is-entering', 'is-leaving');
  target.classList.add('is-open');
  target.style.zIndex = '';
  target.removeAttribute('aria-hidden');
  target.inert = false;
  sandboxBaseKey = null;
  routeZ = 100;
  setRouteBackdrop(true);                 /* keep the menu masked for the whole visit */
  setActiveNav(key);
  cover.inert = true;
  cover.setAttribute('aria-hidden', 'true');
  document.body.classList.add('page-open');
  target.focus({ preventScroll: true });
}

/* One route stack for every navigation: the destination is mounted and put on
   top while the outgoing layer is still fully painted, then both cross-fade
   with the same 10px rise. The opaque backdrop sits between the menu and the
   blend, so the cover can never show through a page-to-page transition. */
function routeToPage(key) {
  const target = pageEl(key);
  if (!target) return;

  const seq = ++routeSeq;
  clearTimeout(routeTimer);
  armRouteLoader(seq);

  const sandboxUp = sandboxVisible();
  const sourceCover = !sandboxUp && !cover.inert && !document.body.classList.contains('page-open');
  const wasOpen = target.classList.contains('is-open') && !target.classList.contains('is-leaving');
  const alreadyHere = committedKey === key && wasOpen && !sandboxUp;

  setActiveNav(key);
  cover.inert = true;
  cover.setAttribute('aria-hidden', 'true');
  document.body.classList.add('page-open');

  if (alreadyHere) {
    committedKey = key;
    settlePage(key, target, seq);
    return;
  }

  committedKey = key;

  /* coming from the menu, the menu is the outgoing layer: keep it visible and
     let the new page rise over it. Between pages, mask it completely. */
  setRouteBackdrop(!sourceCover);

  const baseZ = nextRouteZ();

  if (sandboxUp && window.scilampCloseSandbox) {
    window.scilampCloseSandbox({ animate: true, restoreFocus: false });
    sandboxEl.inert = true;
    sandboxEl.setAttribute('aria-hidden', 'true');
    setActiveNav(key);
  }

  retireOtherPages(target, baseZ);

  resetScroll(target);
  preparePage(target);
  target.style.zIndex = String(sandboxUp ? Math.max(baseZ + 2, 112) : baseZ + 2);
  enterPage(target);
  if (!wasOpen) initTableRoute(key);
  routeTimer = setTimeout(() => settlePage(key, target, seq), routeMs());
}

function routeToCover() {
  const seq = ++routeSeq;
  clearTimeout(routeTimer);
  armRouteLoader(seq);
  committedKey = null;
  sandboxBaseKey = null;
  routeZ = 100;

  const openPages = [...document.querySelectorAll('.page.is-open, .page.is-entering')];
  const sandboxUp = sandboxVisible();

  cover.inert = false;
  cover.removeAttribute('aria-hidden');
  document.body.classList.remove('page-open');
  setActiveNav('home');
  setRouteBackdrop(false);
  resetScroll(cover);
  replayCoverEntrance();

  if (sandboxUp && window.scilampCloseSandbox) {
    window.scilampCloseSandbox({ animate: true, restoreFocus: false });
    sandboxEl.inert = true;
    sandboxEl.setAttribute('aria-hidden', 'true');
    setActiveNav('home');
  }

  openPages.forEach((page, i) => {
    if (page.id === 'page-table') {
      idleHud();
      pageTable.classList.remove('arriving');
    }
    page.style.zIndex = String(112 + i);
    page.classList.remove('is-open', 'is-entering');
    page.classList.add('is-leaving');
    page.setAttribute('aria-hidden', 'true');
    page.inert = true;
  });

  if (!openPages.length && !sandboxUp) {
    hideRouteLoader();
    navHome?.focus({ preventScroll: true });
    return;
  }

  routeTimer = setTimeout(() => {
    if (seq !== routeSeq) return;
    hideRouteLoader();
    document.querySelectorAll('.page').forEach((page) => hidePage(page, { animate: false }));
    navHome?.focus({ preventScroll: true });
  }, routeMs() + 40);
}

/* A navigation request always wins: the old page is retired after the new one
   has painted, and a second request simply layers the next page on top. */
function showPage(key) {
  if (detail.classList.contains('is-open')) closeDetail({ instant: true });
  closeNavMenu();
  routeToPage(key);
}

function dismissSandbox() {
  const baseKey = sandboxBaseKey;
  const base = baseKey ? pageEl(baseKey) : null;
  if (window.scilampCloseSandbox) window.scilampCloseSandbox({ animate: true, restoreFocus: false });
  if (sandboxEl) {
    sandboxEl.inert = true;
    sandboxEl.setAttribute('aria-hidden', 'true');
  }
  sandboxBaseKey = null;

  if (base) {
    base.inert = false;
    base.removeAttribute('aria-hidden');
    setActiveNav(baseKey);
    base.focus({ preventScroll: true });
    return;
  }

  committedKey = null;
  cover.inert = false;
  cover.removeAttribute('aria-hidden');
  document.body.classList.remove('page-open');
  setRouteBackdrop(false);
  setActiveNav('home');
  replayCoverEntrance();
  navHome?.focus({ preventScroll: true });
}

function openKey(key) { showPage(key); }

buildTable();

/* ---------- arrangements: the same 118 cells, placed in 3D ---------- */

/* the scale is what keeps the tiles apart: a shape is built from its own card size,
   so every ring, turn and row of a shape has clear air between one card and the next */
const ARRANGEMENTS = {
  table: { tilt: 0, spin: 0, scale: 1 },
  sphere: { tilt: -14, spin: 0, scale: 0.72 },
  helix: { tilt: -12, spin: 0, scale: 0.72 },
  /* the grid is a face-on lattice, so every one of its cards keeps its label */
  grid: { tilt: 0, spin: 0, scale: 1 },
};

const MORPH_MS = 900;
const MORPH_WAVE = 0.35;      /* part of the morph spent starting the tiles one after another */

const DEG = Math.PI / 180;
const cover = document.getElementById('cover');
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
let heatData = null;

function cellMatches([num, sym, name, cat]) {
  if (catFilter.size && !catFilter.has(cat)) return false;
  if (!query) return true;
  return (
    sym.toLowerCase().startsWith(query) ||
    name.toLowerCase().includes(query) ||
    (I18N?.elementName(el).toLowerCase().includes(query) ?? false) ||
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
  filterStatus.textContent = query || catFilter.size
    ? I18N?.t(`${hits} of 118 elements match`, `${hits} / 118 個元素符合`) ?? `${hits} of 118 elements match`
    : '';
}

searchInput.addEventListener('input', () => {
  query = searchInput.value.trim().toLowerCase();
  applyFilters();
});

function clearHeat() {
  heatProp = '';
  heatData = null;
  delete pageTable.dataset.heatmap;
  tiles.forEach((cell) => {
    cell.style.removeProperty('--hm');
    cell.style.removeProperty('--hm-text');
  });
  hmLegend.hidden = true;
}

function applyHeat(key, map) {
  heatProp = key;
  heatData = map;
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

  /* rings are spaced by card height, not by the equator's capacity, and extra rings are added
     only when the ball genuinely needs them — that keeps the poles and the equator evenly filled */
  const rings = (bands) => {
    const level = [];
    const weight = [];
    const room = [];
    for (let j = 0; j < bands; j += 1) {
      const ny = 1 - ((j + 0.5) * 2) / bands;
      const s = Math.sqrt(Math.max(0, 1 - ny * ny));
      level.push(-ny * r);
      weight.push(s);
      room.push(Math.max(1, Math.floor((2 * Math.PI * r * s) / (card[0] * AIR))));
    }
    return { level, weight, room };
  };

  let bands = clamp(Math.floor((2 * r) / (card[1] * 1.22)), 4, 24);
  let shape = rings(bands);
  let capacity = shape.room.reduce((a, b) => a + b, 0);
  while (capacity < n && bands < 24) {
    bands += 1;
    shape = rings(bands);
    capacity = shape.room.reduce((a, b) => a + b, 0);
  }

  const count = apportion(n, shape.weight, shape.room);
  const first = [];
  let acc = 0;
  count.forEach((c) => { first.push(acc); acc += c; });
  const band = [];
  count.forEach((c, j) => { for (let p = 0; p < c; p += 1) band.push(j); });

  return (i) => {
    const j = band[i];
    const y = shape.level[j] / r;
    const s = Math.sqrt(Math.max(0, 1 - y * y));
    const a = (2 * Math.PI * (i - first[j])) / count[j] + (j % 2 ? Math.PI / count[j] : 0);
    const nx = s * Math.cos(a);
    const nz = s * Math.sin(a);
    return [nx * r, y * r, nz * r, Math.atan2(nx, nz) / DEG, -Math.asin(y) / DEG];
  };
}

const HELIX_TILT = -12;
const HELIX_AIR = 1.22;       /* vertical air between neighbouring turns */
const HELIX_GAP = 1.28;       /* room a card needs around the ring, as a share of its width */

/* one source of truth for the coil: how wide the ring is, how many cards ride a turn,
   how tall the whole coil becomes, and how much of the stage it needs once the camera's
   perspective has enlarged the near side */
function helixMetrics(w, h, card) {
  const n = tiles.length;
  const r = Math.min(w * 0.34, h * 0.4);
  const room = Math.max(4, Math.floor((2 * Math.PI * r) / (card[0] * HELIX_GAP)));
  const per = clamp(room, 6, 40);
  const turns = Math.ceil(n / per);
  const height = turns * card[1] * HELIX_AIR;
  const ring = 2 * r * Math.abs(Math.sin(HELIX_TILT * DEG));
  return { r, per, turns, height, span: height + ring + card[1] };
}

/* the coil is sized from the stage, not the other way round: try the largest card that
   still lands its last turn inside the frame, and only shrink when the stage demands it */
function fitHelix(w, h, base) {
  for (let step = 18; step >= 6; step -= 1) {
    const s = step / 10;
    const card = [base[0] * s, base[1] * s];
    const m = helixMetrics(w, h, card);
    if (m.span * 1.16 <= h && (2 * m.r + card[0] * 1.2) * 1.16 <= w) return { card, m };
  }
  const card = [base[0] * 0.45, base[1] * 0.45];
  return { card, m: helixMetrics(w, h, card) };
}

function helixLayout(w, h, card) {
  const n = tiles.length;
  const { r, per, height } = helixMetrics(w, h, card);
  const step = (Math.PI * 2) / per;
  return (i) => {
    const a = i * step;
    /* facing is handled by fadeByDepth, which turns every card toward the camera;
       an outward-facing card would hide its label on the far side of the coil */
    return [Math.cos(a) * r, (i / (n - 1) - 0.5) * height, Math.sin(a) * r, 0, 0];
  };
}

const MASS_RANK = (() => {
  const order = ELEMENTS
    .map((el, i) => [i, parseFloat(String(el[6]).replace(/[[\]]/g, ''))])
    .sort((a, b) => a[1] - b[1]);
  const rank = new Array(order.length);
  order.forEach(([i], r) => { rank[i] = r; });
  return rank;
})();

/* the grid is one mass-ordered sheet — not a stack of sheets, so nothing can be
   buried behind a neighbour or lose its label down a deeper layer */
const GRID_COLS = Math.ceil(Math.sqrt(tiles.length));
const GRID_ROWS = Math.ceil(tiles.length / GRID_COLS);

function gridPitch(w, h) {
  return Math.min((w * 0.94) / GRID_COLS, (h * 0.94) / GRID_ROWS);
}

function gridLayout(w, h) {
  const pitch = gridPitch(w, h);
  return (i) => {
    const slot = MASS_RANK[i];
    const row = Math.floor(slot / GRID_COLS);
    const col = slot % GRID_COLS;
    return [
      (col - (GRID_COLS - 1) / 2) * pitch,
      (row - (GRID_ROWS - 1) / 2) * pitch,
      0,
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

  if (name === 'grid') {
    /* the sheet owns its scale: the pitch is chosen from the stage and the card
       is cut to fit that pitch, so eleven rows can never fall out of the frame */
    const side = gridPitch(box.width, box.height) * 0.8;
    tile = [side, side];
  } else if (name === 'helix') {
    tile = fitHelix(box.width, box.height, tile).card;
  }

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

/* cramped stages (phones, short windows) cannot hold a legible 3D shape; they get
   the same 118 cards as a simple scrollable lattice instead of a shrunken coil */
const narrowStage = matchMedia('(max-width: 767px)');

function shouldCompact(name) {
  if (name === 'table') return false;
  if (narrowStage.matches) return true;
  const w = stageView.clientWidth;
  const h = stageView.clientHeight;
  if (!w || !h) return true;
  if (h < 340) return true;
  if (name === 'grid' && gridPitch(w, h) < 36) return true;
  return false;
}

function enterCompact(name) {
  if (morphRAF) { cancelAnimationFrame(morphRAF); morphRAF = null; }
  pageTable.classList.remove('arriving');
  pageTable.dataset.mode = name;
  pageTable.dataset.compact = '';
  pageTable.style.removeProperty('--zoom');
  stageBoard.style.removeProperty('--tilt');
  stageBoard.style.removeProperty('--spin');
  tiles.forEach((cell, i) => {
    ['--px', '--py', '--pz', '--oy', '--ox', '--near', '--label', '--ink-near'].forEach((prop) => cell.style.removeProperty(prop));
    cell.style.order = name === 'grid' ? String(MASS_RANK[i]) : '';
  });
  nearPrev.fill(NaN);
  labelPrev.fill(NaN);
}

function leaveCompact() {
  if (!pageTable.hasAttribute('data-compact')) return;
  pageTable.removeAttribute('data-compact');
  tiles.forEach((cell) => { cell.style.order = ''; });
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
  labelPrev.fill(NaN);
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
  labelPrev.fill(NaN);
  tiles.forEach((cell) => {
    ['--px', '--py', '--pz', '--oy', '--ox', '--near', '--label', '--ink-near'].forEach((name) => cell.style.removeProperty(name));
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

  if (shouldCompact(arrangement)) {
    enterCompact(arrangement);
    return;
  }
  leaveCompact();

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
const labelPrev = tiles.map(() => NaN);
let billboardPrev = false;

function fadeByDepth() {
  if (pageTable.dataset.mode === 'table' || pageTable.hasAttribute('data-compact')) return;
  const ct = Math.cos(tilt * DEG);
  const st = Math.sin(tilt * DEG);
  const cs = Math.cos(spin * DEG);
  const ss = Math.sin(spin * DEG);
  const camZ = (x, y, z) => y * st + (-x * ss + z * cs) * ct;

  /* a shape only needs shading in proportion to the depth it has, so a sheet lying flat stays fully lit */
  let deepest = 0;
  shown.forEach((p) => { deepest = Math.max(deepest, Math.abs(camZ(p[0], p[1], p[2]))); });
  const shade = clamp(deepest / (reach * 0.6), 0, 1);

  /* the coil and the lattice turn every card toward the viewer: a card left facing
     outward loses its back face at some point on the turn, which read as a blank tile */
  const billboard = arrangement === 'helix' || arrangement === 'grid';
  if (billboard) {
    const oy = `${(-spin).toFixed(2)}deg`;
    const ox = `${(-tilt).toFixed(2)}deg`;
    tiles.forEach((cell, i) => {
      cell.style.setProperty('--oy', oy);
      cell.style.setProperty('--ox', ox);
      /* a face turned to the viewer keeps its ink undimmed, whatever its depth */
      cell.style.setProperty('--ink-near', '1');
      /* the label test below reads the card's own pose, but a billboarded card has
         already cancelled the board's turn; without this every label faded out once
         the scene passed ~76deg of tilt, leaving a screen of blank tiles */
      if (!billboardPrev) {
        cell.style.setProperty('--label', '1');
        labelPrev[i] = 1;
      }
    });
  } else if (billboardPrev) {
    tiles.forEach((cell) => cell.style.removeProperty('--ink-near'));
    labelPrev.fill(NaN);
  }
  billboardPrev = billboard;

  tiles.forEach((cell, i) => {
    const p = shown[i];
    const raw = Math.pow(clamp((camZ(p[0], p[1], p[2]) / reach + 1) / 2, 0, 1), 1.25);
    const v = 1 - (1 - raw) * shade;
    /* an imperceptible step is not worth repainting 118 cards for (NaN on first run must still paint) */
    if (!(Math.abs(v - nearPrev[i]) < 0.02)) {
      nearPrev[i] = v;
      cell.style.setProperty('--near', v.toFixed(2));
    }

    /* a card turned edge-on shows its label as a smear, so the text follows the facing
       rather than the depth; billboarded cards always face the viewer */
    const oy = p[3] * DEG;
    const ox = p[4] * DEG;
    const cox = Math.cos(ox);
    const face = camZ(cox * Math.sin(oy), -Math.sin(ox), cox * Math.cos(oy));
    const label = billboard ? 1 : clamp((face - 0.08) / 0.24, 0, 1);
    if (!(Math.abs(label - labelPrev[i]) < 0.03)) {
      labelPrev[i] = label;
      cell.style.setProperty('--label', label.toFixed(2));
    }
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

/* the arrangement breathes on its own until a hand touches it */
const IDLE_MS = 3400;
let idleTimer = 0;

function stageIdleAllowed() {
  return !reducedMotion && arrangement !== 'table' && !pageTable.hasAttribute('data-compact');
}

function scheduleIdle() {
  clearTimeout(idleTimer);
  stageView.classList.remove('is-idle');
  if (!stageIdleAllowed()) return;
  idleTimer = window.setTimeout(() => {
    idleTimer = 0;
    if (drag || document.hidden || !stageIdleAllowed()) return;
    stageView.classList.add('is-idle');
  }, IDLE_MS);
}

function wakeStage() {
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = 0; }
  stageView.classList.remove('is-idle');
}

/* a turn is not a click: once the pointer has travelled, the release is swallowed */
stageView.addEventListener('pointerdown', (event) => {
  suppressClick = false;
  if (arrangement === 'table' || pageTable.hasAttribute('data-compact')) return;
  wakeStage();
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
  scheduleIdle();
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
  if (arrangement === 'table' || pageTable.hasAttribute('data-compact')) return;
  event.preventDefault();
  wakeStage();
  wheelAcc += event.deltaY;
  if (wheelRAF) return;
  wheelRAF = requestAnimationFrame(() => {
    wheelRAF = 0;
    pinPose();
    zoom = clamp(zoom * (1 - wheelAcc * 0.0014 * SENS.zoom * SENS.zoom), 0.55, 2.2);
    wheelAcc = 0;
    applyRotation();
  });
  scheduleIdle();
}, { passive: false });

function setMode(name) {
  applyMode(name);
  scheduleIdle();
}

function applyMode(name) {
  if (!ARRANGEMENTS[name] || name === arrangement) return;
  if (!stageView.offsetWidth || !stageView.offsetHeight) return;

  const wasCompact = pageTable.hasAttribute('data-compact');
  const compact = shouldCompact(name);

  arrangement = name;
  syncArrange(name);
  pageTable.classList.remove('arriving');
  if (glideRAF) { cancelAnimationFrame(glideRAF); glideRAF = null; }
  spinVel = 0;
  tiltVel = 0;

  if (compact) {
    enterCompact(name);
    return;
  }

  leaveCompact();
  const built = build(name);

  /* the flat table is only handed to its grid once the tiles have landed in their slots */
  if (name !== 'table') pageTable.dataset.mode = name;

  /* a compact lattice has no 3D pose to fly from, so it hands over in one clean step */
  if (wasCompact) {
    if (morphRAF) { cancelAnimationFrame(morphRAF); morphRAF = null; }
    tilt = ARRANGEMENTS[name].tilt;
    spin = ARRANGEMENTS[name].spin;
    zoom = 1;
    snapTo(built.poses, built.reach, built.tile);
    if (name === 'table') landTable();
    applyRotation();
    return;
  }

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

/* ---------- theme: the night stage is the default, a manual choice is remembered ---------- */

const themeBtn = document.getElementById('nav-theme');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeRoot = document.documentElement;
const THEME_KEY = 'scilamp-theme';

function paintTheme(theme) {
  themeRoot.dataset.theme = theme;
  if (themeMeta) themeMeta.content = theme === 'dark' ? '#000000' : '#ffffff';
  if (themeBtn) {
    const dark = theme === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  document.dispatchEvent(new CustomEvent('scilamp:theme', { detail: { theme } }));
}

paintTheme(themeRoot.dataset.theme === 'dark' ? 'dark' : 'light');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = themeRoot.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (error) {
      /* private mode: the choice simply lasts for this visit */
    }
    paintTheme(next);
  });
}

document.addEventListener('scilamp:theme', () => {
  if (heatProp && heatData) applyHeat(heatProp, heatData);
});

/* ---------- the top bar: primary sections, one quiet menu ---------- */

const SENS = { turn: 1, zoom: 1 };
const arrangeButtons = [...document.querySelectorAll('#arrange .arrange-btn')];
const settingsToggle = document.getElementById('nav-settings-toggle');
const helpEl = document.getElementById('help');
const helpClose = document.getElementById('help-close');
const helpDone = document.getElementById('help-done');
const helpZone = document.getElementById('help-zone');
let helpReturn = null;
let helpVisible = false;

function setActiveNav(key) {
  topnavLinks.forEach((link) => {
    const on = link.dataset.nav === key;
    link.classList.toggle('is-active', on);
    if (on) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/* the top bar is the way back out of everything */
function backToMenu() {
  closeNavMenu();
  if (detail.classList.contains('is-open')) closeDetail({ instant: true });
  routeToCover();
}

function openSandboxFromNav() {
  if (detail.classList.contains('is-open')) closeDetail({ instant: true });
  closeNavMenu();

  if (window.scilampSandboxOpen) {
    setActiveNav('sandbox');
    return;
  }

  const baseKey = committedKey;
  const base = baseKey ? pageEl(baseKey) : null;
  ++routeSeq;
  clearTimeout(routeTimer);
  hideRouteLoader();
  if (base) settlePage(baseKey, base, routeSeq);
  else document.querySelectorAll('.page').forEach((page) => hidePage(page));

  sandboxBaseKey = baseKey;
  if (base && base.id !== 'page-table') {
    if (base.contains(document.activeElement)) document.activeElement.blur();
    base.inert = true;
    base.setAttribute('aria-hidden', 'true');
  }
  cover.inert = true;
  cover.setAttribute('aria-hidden', 'true');
  document.body.classList.add('page-open');
  setActiveNav('sandbox');
  resetScroll(sandboxEl);
  sandboxEl.inert = false;
  setRouteBackdrop(Boolean(base));
  if (window.scilampOpenSandbox) window.scilampOpenSandbox();
}

/* ---------- the more menu ---------- */

function navMenuOpen() {
  return !!navMenu && !navMenu.hidden;
}

function menuItems() {
  return navMenu ? [...navMenu.querySelectorAll('.nav-menu-item')] : [];
}

function setSettings(open) {
  if (!navSettings) return;
  navSettings.hidden = !open;
  navSettings.classList.toggle('is-on', open);
  settingsToggle.setAttribute('aria-expanded', String(open));
}

function openNavMenu({ focusFirst = false } = {}) {
  if (!navMenu || navMenuOpen()) return;
  if (helpVisible) closeHelp();
  navMenu.hidden = false;
  navMore.setAttribute('aria-expanded', 'true');
  if (focusFirst) requestAnimationFrame(() => menuItems()[0]?.focus({ preventScroll: true }));
}

function closeNavMenu({ restoreFocus = false } = {}) {
  if (!navMenuOpen()) return;
  const hadFocus = navMenu.contains(document.activeElement);
  navMenu.hidden = true;
  navMore.setAttribute('aria-expanded', 'false');
  setSettings(false);
  if (restoreFocus && hadFocus) navMore.focus({ preventScroll: true });
  else if (hadFocus && document.activeElement) document.activeElement.blur();
}

navMore.addEventListener('click', () => {
  if (navMenuOpen()) closeNavMenu({ restoreFocus: true });
  else openNavMenu({ focusFirst: true });
});

navMore.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    openNavMenu({ focusFirst: true });
  }
});

navMenu.addEventListener('keydown', (event) => {
  const items = menuItems();
  const at = items.indexOf(document.activeElement);
  if (event.key === 'Escape') {
    event.preventDefault();
    closeNavMenu({ restoreFocus: true });
    return;
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!items.length) return;
    const step = event.key === 'ArrowDown' ? 1 : -1;
    items[(at + step + items.length) % items.length].focus({ preventScroll: true });
  }
});

document.addEventListener('pointerdown', (event) => {
  if (!navMenuOpen()) return;
  if (!document.getElementById('topbar-more').contains(event.target)) closeNavMenu();
});

settingsToggle.addEventListener('click', () => {
  const open = navSettings.hidden;
  setSettings(open);
  if (open) requestAnimationFrame(() => document.getElementById('sens-turn').focus({ preventScroll: true }));
});

navMenu.querySelector('[data-menu="profile"]').addEventListener('click', () => {
  closeNavMenu();
  showPage('profile');
});

navMenu.querySelector('[data-menu="notes"]').addEventListener('click', () => {
  closeNavMenu();
  showPage('notes');
});

navMenu.querySelector('[data-menu="tutorial"]').addEventListener('click', () => {
  closeNavMenu();
  if (window.scilampStartTutorial) window.scilampStartTutorial();
});

navMenu.querySelector('[data-menu="help"]').addEventListener('click', () => {
  openHelp(navMore);
});

/* ---------- help ---------- */

function openHelp(trigger) {
  if (!helpEl || helpVisible) return;
  helpVisible = true;
  helpReturn = trigger || document.activeElement;
  closeNavMenu();
  helpEl.hidden = false;
  helpEl.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => helpEl.classList.add('is-on'));
  setTimeout(() => {
    if (helpVisible) helpClose.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 40);
}

function closeHelp() {
  if (!helpVisible) return;
  helpVisible = false;
  helpEl.classList.remove('is-on');
  helpEl.setAttribute('aria-hidden', 'true');
  window.setTimeout(() => { helpEl.hidden = true; }, reducedMotion ? 0 : 240);
  const back = helpReturn;
  helpReturn = null;
  if (back && document.contains(back) && back.getClientRects().length) back.focus({ preventScroll: true });
}

helpClose.addEventListener('click', closeHelp);
helpDone.addEventListener('click', closeHelp);
helpZone.addEventListener('click', closeHelp);

helpEl.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeHelp();
    return;
  }
  if (event.key !== 'Tab') return;
  const items = [...helpEl.querySelectorAll('button, [href], input, select, textarea')]
    .filter((el) => !el.disabled && el.tabIndex !== -1 && el.getClientRects().length);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.getElementById('sb-help')?.addEventListener('click', (event) => openHelp(event.currentTarget));

/* the bench button enters through the same route so Escape knows what to return to */
document.getElementById('sandbox-entry')?.addEventListener('click', () => openSandboxFromNav());

/* ---------- section links ---------- */

topnavLinks.forEach((link) => {
  link.addEventListener('click', () => {
    closeNavMenu();
    const key = link.dataset.nav;
    if (key === 'sandbox') openSandboxFromNav();
    else showPage(key);
  });
});

navHome.addEventListener('click', backToMenu);

setActiveNav('home');

/* cover cards and hero buttons are the front door */
function openFromCover(trigger, key) {
  showPage(key);
}

document.querySelectorAll('[data-open]').forEach((button) => {
  button.addEventListener('click', () => {
    const dest = button.dataset.open;
    if (dest === 'tutorial') {
      if (window.scilampStartTutorial) window.scilampStartTutorial();
    } else if (dest === 'sandbox') {
      openSandboxFromNav();
    } else {
      openFromCover(button, dest);
    }
  });
});

function syncArrange(name) {
  arrangeButtons.forEach((button) => {
    const on = button.dataset.nav === name;
    button.classList.toggle('is-on', on);
    button.setAttribute('aria-pressed', String(on));
  });
}

arrangeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const name = button.dataset.nav;
    if (!document.querySelector('.page.is-open')) {
      pendingMode = name;
      showPage('table');
      return;
    }
    setMode(name);
  });
});

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

syncArrange('table');

/* UI strings handled by the dictionary; names and generated labels refresh here */
function refreshLocalizedChrome() {
  document.querySelectorAll('.legend-item').forEach((item) => {
    const key = item.dataset.cat;
    if (!key || !CATEGORIES[key]) return;
    item.innerHTML = `<span class="legend-dot"></span>${catName(key)}`;
    item.setAttribute('aria-label', I18N
      ? I18N.t(`Filter ${CATEGORIES[key]} elements`, `篩選${catName(key)}元素`)
      : `Filter ${CATEGORIES[key]} elements`);
  });
  document.querySelectorAll('.el[data-number]').forEach((cell) => {
    const row = ELEMENTS.find((e) => e[0] === Number(cell.dataset.number));
    if (!row) return;
    cell.setAttribute('aria-label', I18N
      ? I18N.t(`${row[0]} ${row[1]} ${row[2]}, ${CATEGORIES[row[3]]} — open details`, `${row[0]} ${row[1]} ${elName(row)}，${catName(row[3])}——開啟詳細資料`)
      : `${row[0]} ${row[1]} ${row[2]}, ${CATEGORIES[row[3]]} — open details`);
  });
  if (detail.classList.contains('is-open')) {
    if (sheetMode === 'element') {
      const row = sheetElement || (activeCell ? ELEMENTS.find((e) => e[0] === Number(activeCell.dataset.number)) : null);
      if (row) fillPanel(row);
    } else if (sheetProduct) {
      fillProductSheet(sheetProduct, sheetMode);
    } else if (sheetMode === 'hint' && sheetHint) {
      fillHintSheet(sheetHint);
    }
  }
  themeBtn?.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark'
    ? I18N.t('Switch to light theme', '切換至淺色主題')
    : I18N.t('Switch to dark theme', '切換至深色主題'));
}

document.addEventListener('scilamp:lang', refreshLocalizedChrome);

document.addEventListener('scilamp:favorites', () => {
  if (!detail.classList.contains('is-open') || !window.SciLampFx) return;
  const btn = facts.actions.querySelector('[data-sheet-action="favorite"]');
  if (!btn) return;
  const record = sheetMode === 'element' && sheetElement
    ? SciLampFx.elementRecord(sheetElement)
    : SciLampFx.productRecord(sheetProduct);
  if (record) SciLampFx.syncFavorite(btn, SciLampStore.isFavorite(record.id));
});

/* small public surface for the sandbox, the index and the tour */
window.SciLampSheet = {
  openElement,
  openElementSheet,
  openProduct,
  openHint,
  close: closeDetail,
  isOpen: () => detail.classList.contains('is-open'),
};
window.SciLampNav = {
  page: showPage,
  home: backToMenu,
  menu: (open) => (open ? openNavMenu() : closeNavMenu()),
  settings: (open) => { if (open) openNavMenu(); setSettings(Boolean(open)); },
  help: () => openHelp(navMore),
  setActive: setActiveNav,
  openSandbox: openSandboxFromNav,
  index: () => showPage('index'),
  tutorial: () => { if (window.scilampStartTutorial) window.scilampStartTutorial(); },
};
