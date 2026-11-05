/* Sandbox mode — a bench over the periodic table page.
   Atoms accumulate as a multiset; the resolver in sandbox-data.js decides what the
   mixture makes. Every successful product is saved through SciLampStore, catalog
   discoveries light up the compound index, and the shelf below the bench keeps the
   full collection. The table stays mounted underneath, so its state survives. */

(() => {
  const sandbox = document.getElementById('sandbox');
  const entry = document.getElementById('sandbox-entry');
  const pageTable = document.getElementById('page-table');
  if (!sandbox || !entry || !pageTable) return;

  const STORE_KEY = 'scilamp.sandbox.v1';
  const CHALLENGES = SB.CHALLENGES;

  const atomsEl = document.getElementById('sb-atoms');
  const emptyEl = document.getElementById('sb-empty');
  const atomCountEl = document.getElementById('sb-atom-count');
  const recipeEl = document.getElementById('sb-recipe');
  const paletteEl = document.getElementById('sb-palette');
  const infoEl = document.getElementById('sb-elinfo');
  const infoFullBtn = document.getElementById('sb-info-full');
  const combineBtn = document.getElementById('sb-combine');
  const resultEl = document.getElementById('sb-result');
  const processEl = document.getElementById('sb-process');
  const resetBtn = document.getElementById('sb-reset');
  const backBtn = document.getElementById('sandbox-back');
  const scoreEl = document.getElementById('sb-score');
  const fillEl = document.getElementById('sb-progress-fill');
  const progressText = document.getElementById('sb-progress-text');
  const challengesEl = document.getElementById('sb-challenges');
  const hintline = document.getElementById('sb-hintline');
  const shelfEl = document.getElementById('sb-shelf');
  const shelfList = document.getElementById('sb-shelf-list');
  const shelfCount = document.getElementById('sb-shelf-count');
  const shelfIndex = document.getElementById('sb-shelf-index');
  const shelfClear = document.getElementById('sb-shelf-clear');
  const saveStatus = document.getElementById('sb-save-status');

  /* ---------- persistence ---------- */

  function loadDone() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.done)) return [];
      return data.done.filter((id) => CHALLENGES.some((c) => c.id === id));
    } catch {
      return [];
    }
  }

  const done = loadDone();

  function saveDone() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ done }));
    } catch {
      /* progress then lasts for this visit only */
    }
  }

  /* ---------- state ---------- */

  const bench = new Map();
  let inspected = null;
  let process = 'auto';
  let activeChallenge = (CHALLENGES.find((c) => !done.includes(c.id)) || {}).id || null;
  let open = false;
  let tablePrevAria = null;
  let highlightKey = null;
  let lastAlternatives = [];
  let lastRecipe = null;
  let clearArmed = false;
  let clearTimer = null;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elementRecord = (sym) => ELEMENTS.find((e) => e[1] === sym) || null;

  /* ---------- palette ---------- */

  function renderPalette() {
    paletteEl.innerHTML = SB.PALETTE.map((sym) => {
      const el = SB.EL(sym);
      if (!el) return '';
      return `<button class="sb-chip" type="button" draggable="true" data-symbol="${el.symbol}" data-cat="${el.cat}"
        aria-label="Add one ${el.name} atom, element ${el.number}">
        <span class="sb-chip-num">${el.number}</span>
        <span class="sb-chip-sym">${el.symbol}</span>
        <span class="sb-chip-name">${el.name}</span>
      </button>`;
    }).join('');

    paletteEl.querySelectorAll('.sb-chip').forEach((chip) => {
      const sym = chip.dataset.symbol;
      chip.addEventListener('click', () => addAtom(sym));
      chip.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', sym);
        event.dataTransfer.effectAllowed = 'copy';
        chip.classList.add('is-dragging');
      });
      chip.addEventListener('dragend', () => {
        chip.classList.remove('is-dragging');
        sandbox.classList.remove('is-over');
      });
    });
  }

  function paintSelection() {
    paletteEl.querySelectorAll('.sb-chip').forEach((chip) => {
      chip.classList.toggle('is-on', chip.dataset.symbol === inspected);
    });
  }

  /* ---------- element notes ---------- */

  function paintInfo() {
    if (!inspected) {
      infoFullBtn.disabled = true;
      infoEl.innerHTML = '<p class="sb-info-empty">Tap an element to read what it is, how it behaves and where it is used. Adding it to the bench also selects it.</p>';
      return;
    }
    const el = SB.EL(inspected);
    if (!el) return;
    infoFullBtn.disabled = false;
    const state = el.state || 'unknown state';
    infoEl.innerHTML = `
      <div class="sb-info-head">
        <span class="sb-info-sym" data-cat="${el.cat}">${el.symbol}</span>
        <span class="sb-info-titles">
          <strong>${el.name}</strong>
          <span>${CATEGORIES[el.cat]} · ${state} at 25 °C</span>
        </span>
      </div>
      <p class="sb-info-desc">${el.description}</p>
      <dl class="sb-info-facts">
        <div><dt>Mass</dt><dd>${el.mass} u</dd></div>
        <div><dt>Oxidation</dt><dd>${el.oxidation}</dd></div>
      </dl>`;
  }

  /* ---------- bench ---------- */

  const benchSymbols = () => [...bench.keys()].sort((a, b) => SB.EL(a).number - SB.EL(b).number);
  const benchAtoms = () => Object.fromEntries(bench);
  const benchTotal = () => [...bench.values()].reduce((sum, n) => sum + n, 0);

  function benchLine() {
    const syms = benchSymbols();
    if (!syms.length) return 'Nothing on the bench yet.';
    return `${syms.map((s) => `${bench.get(s)} ${s}`).join(' + ')} — check the process, then combine.`;
  }

  function paintCount() {
    const total = benchTotal();
    const kinds = bench.size;
    atomCountEl.textContent = total
      ? `${total} atom${total === 1 ? '' : 's'} · ${kinds} element${kinds === 1 ? '' : 's'}`
      : 'empty bench';
    recipeEl.textContent = benchLine();
  }

  function renderAtoms() {
    const syms = benchSymbols();
    emptyEl.hidden = syms.length > 0;

    atomsEl.innerHTML = syms.map((sym) => {
      const el = SB.EL(sym);
      const n = bench.get(sym);
      return `<div class="sb-atom" data-cat="${el.cat}" data-sym="${sym}">
        <button class="sb-atom-x" type="button" data-remove="${sym}" aria-label="Remove ${el.name} from the bench">&times;</button>
        <span class="sb-atom-sym">${el.symbol}</span>
        <span class="sb-atom-name">${el.name}</span>
        <span class="sb-stepper">
          <button type="button" data-step="-1" data-sym="${sym}" aria-label="Remove one ${el.name} atom">&minus;</button>
          <span class="sb-atom-n" aria-hidden="true">${n}</span>
          <button type="button" data-step="1" data-sym="${sym}" aria-label="Add one ${el.name} atom">+</button>
        </span>
        <span class="sr">${n} ${el.name} atom${n === 1 ? '' : 's'} on the bench</span>
      </div>`;
    }).join('');

    paintCount();
  }

  function paintBench() {
    renderAtoms();
    paintSelection();
    paintInfo();
  }

  function focusAfterAtomChange(sym, step) {
    if (step && bench.has(sym)) {
      const next = atomsEl.querySelector(`.sb-atom[data-sym="${sym}"] [data-step="${step}"]`);
      if (next) { next.focus({ preventScroll: true }); return; }
    }
    const chip = paletteEl.querySelector(`.sb-chip[data-symbol="${sym}"]`);
    if (chip) chip.focus({ preventScroll: true });
  }

  function addAtom(sym, { quiet = false } = {}) {
    if (!SB.PALETTE.includes(sym)) return;
    bench.set(sym, Math.min(99, (bench.get(sym) || 0) + 1));
    inspected = sym;
    paintBench();
    if (!quiet) saveStatus.textContent = `Added one ${SB.EL(sym).name.toLowerCase()} atom.`;
  }

  function stepAtom(sym, delta) {
    const next = (bench.get(sym) || 0) + delta;
    if (next <= 0) bench.delete(sym);
    else bench.set(sym, Math.min(99, next));
    paintBench();
    focusAfterAtomChange(sym, delta);
  }

  function removeAtom(sym) {
    bench.delete(sym);
    paintBench();
    const chip = paletteEl.querySelector(`.sb-chip[data-symbol="${sym}"]`);
    if (chip) chip.focus({ preventScroll: true });
    saveStatus.textContent = `${SB.EL(sym).name} removed from the bench.`;
  }

  function setBench(atoms) {
    bench.clear();
    Object.entries(atoms || {}).forEach(([sym, n]) => {
      if (SB.PALETTE.includes(sym) && n > 0) bench.set(sym, Math.min(99, Math.floor(n)));
    });
    paintBench();
  }

  atomsEl.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove]');
    if (remove) { removeAtom(remove.dataset.remove); return; }
    const step = event.target.closest('[data-step]');
    if (step) stepAtom(step.dataset.sym, Number(step.dataset.step));
  });

  const workspace = document.getElementById('sb-workspace');
  workspace.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    sandbox.classList.add('is-over');
  });
  workspace.addEventListener('dragleave', (event) => {
    if (!workspace.contains(event.relatedTarget)) sandbox.classList.remove('is-over');
  });
  workspace.addEventListener('drop', (event) => {
    event.preventDefault();
    sandbox.classList.remove('is-over');
    const sym = event.dataTransfer.getData('text/plain');
    if (sym) addAtom(sym);
  });

  /* ---------- result ---------- */

  const defaultResult = () => {
    resultEl.className = 'sb-result';
    resultEl.innerHTML = '<p class="sb-result-empty">Place any number of atoms, then combine. Metals with metals make alloys; a metal with a nonmetal makes an ionic compound; nonmetals make curated covalent molecules.</p>';
  };

  function paintIdle() {
    defaultResult();
  }

  function paintNote(text) {
    resultEl.className = 'sb-result is-note';
    resultEl.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'sb-result-note';
    p.textContent = text;
    resultEl.appendChild(p);
  }

  function alternativesHtml(list) {
    if (!list || !list.length) return '';
    return `<p class="sb-alt-line">Also possible with these elements:
      ${list.map((alt, i) => `<button class="sb-alt" type="button" data-alt="${i}">${alt.formula} · ${alt.name}</button>`).join(' ')}
    </p>`;
  }

  function paintFailure(result) {
    lastAlternatives = result.alternatives ? result.alternatives.slice() : [];
    lastRecipe = result.recipe || null;
    if (lastRecipe) {
      lastAlternatives = [];
      resultEl.className = 'sb-result is-bad';
      resultEl.innerHTML = `
        <p class="sb-result-kicker">Charges do not balance</p>
        <p class="sb-result-text" id="sb-fail-text"></p>
        <p class="sb-alt-line"><button class="sb-alt" type="button" data-recipe="1">load the ${lastRecipe.formula} recipe</button></p>`;
      resultEl.querySelector('#sb-fail-text').textContent = result.message;
      return;
    }
    lastAlternatives = result.alternatives ? result.alternatives.slice() : [];
    resultEl.className = 'sb-result is-bad';
    const buttons = lastAlternatives
      .map((alt, i) => `<button class="sb-alt" type="button" data-alt="${i}">${alt.formula} · ${alt.name}</button>`)
      .join(' ');
    resultEl.innerHTML = `<p class="sb-result-kicker">No product under these rules</p><p class="sb-result-text" id="sb-fail-text"></p>${
      buttons ? `<p class="sb-alt-line">Try instead: ${buttons}</p>` : ''
    }`;
    resultEl.querySelector('#sb-fail-text').textContent = result.message;
  }

  function paintProduct(product, info) {
    lastAlternatives = (product.alternatives || []).filter((alt) => alt.formula !== product.formula);
    lastRecipe = null;
    resultEl.className = 'sb-result is-good';
    const kind = product.diatomic ? 'Diatomic element' : SB.KIND_LABEL[product.kind];
    const ratio = product.ratio ? ` &middot; ${product.ratio[0]}:${product.ratio[1]} ions` : '';
    const units = product.units > 1 ? ` &middot; ${product.units} units` : '';
    const winsHtml = info.wins.length
      ? `<p class="sb-win">Challenge complete — ${info.wins.map((id) => CHALLENGES.find((c) => c.id === id).title).join(', ')}</p>`
      : '';
    const savedText = info.firstDiscovery
      ? 'First discovery — saved to my products and lit in the compound index.'
      : info.isNew
        ? 'Saved to my products.'
        : 'Already in my products — saved again with a new timestamp.';
    resultEl.innerHTML = `
      <p class="sb-result-kicker">${kind}${ratio}${units}</p>
      <p class="sb-formula">${product.formula}</p>
      <p class="sb-name">${product.name}</p>
      <p class="sb-result-text">${product.why || product.note}</p>
      <p class="sb-saved">&#10003; ${savedText}</p>
      ${winsHtml}
      ${alternativesHtml(lastAlternatives)}`;

    saveStatus.textContent = info.firstDiscovery
      ? `${product.name} discovered and saved.`
      : info.isNew
        ? `${product.name} saved to my products.`
        : `${product.name} was already saved; the saved entry was updated.`;
  }

  resultEl.addEventListener('click', (event) => {
    const altBtn = event.target.closest('[data-alt]');
    if (altBtn) {
      const alt = lastAlternatives[Number(altBtn.dataset.alt)];
      if (!alt) return;
      setBench(alt.atoms);
      paintNote(`Bench set to ${benchLine().replace(' — check the process, then combine.', '')} for ${alt.formula} (${alt.name}). Press combine to try it.`);
      saveStatus.textContent = `Bench set for ${alt.formula}.`;
      combineBtn.focus({ preventScroll: true });
      return;
    }
    const recipeBtn = event.target.closest('[data-recipe]');
    if (recipeBtn && lastRecipe) {
      const { cation, anion, nCat, nAn, formula } = lastRecipe;
      setBench({ [cation]: nCat, [anion]: nAn });
      paintNote(`Recipe loaded: ${nCat} ${cation} + ${nAn} ${anion} for ${formula}. Press combine.`);
      saveStatus.textContent = `Recipe for ${formula} loaded.`;
      combineBtn.focus({ preventScroll: true });
    }
  });

  /* ---------- challenges ---------- */

  function renderChallenges() {
    challengesEl.innerHTML = CHALLENGES.map((c) => {
      const isDone = done.includes(c.id);
      const active = activeChallenge === c.id;
      return `<button class="sb-chal${isDone ? ' is-done' : ''}${active ? ' is-active' : ''}" type="button"
        data-chal="${c.id}" aria-pressed="${active}" aria-label="${c.title}${isDone ? ', completed' : ''}">
        <span class="sb-chal-mark" aria-hidden="true">${isDone ? '&check;' : ''}</span>
        <span class="sb-chal-title">${c.title}</span>
      </button>`;
    }).join('');

    challengesEl.querySelectorAll('.sb-chal').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeChallenge = btn.dataset.chal;
        renderChallenges();
        renderHint();
      });
    });
    paintScore();
  }

  function paintScore() {
    const total = CHALLENGES.length;
    scoreEl.textContent = `${done.length} / ${total}`;
    fillEl.style.width = `${(done.length / total) * 100}%`;
    progressText.textContent = `${done.length} of ${total} challenges complete.`;
  }

  function renderHint() {
    const active = CHALLENGES.find((c) => c.id === activeChallenge);
    hintline.hidden = false;
    if (!active) {
      hintline.innerHTML = done.length === CHALLENGES.length
        ? '<strong>All seven challenges complete.</strong> Keep combining — the bench is yours.'
        : 'Pick a challenge to see its hint.';
      return;
    }
    const isDone = done.includes(active.id);
    hintline.innerHTML = `<span class="sb-hint-kicker">${isDone ? 'completed goal' : 'current goal'}</span><strong>${active.title}</strong> — ${active.hint}`;
  }

  function runChallenges(product) {
    const wins = [];
    CHALLENGES.forEach((c) => {
      if (done.includes(c.id)) return;
      if (c.test(product)) {
        done.push(c.id);
        wins.push(c.id);
      }
    });
    if (wins.length) saveDone();

    if (!activeChallenge || done.includes(activeChallenge)) {
      const next = CHALLENGES.find((c) => !done.includes(c.id));
      activeChallenge = next ? next.id : null;
    }
    renderChallenges();
    renderHint();
    return wins;
  }

  /* ---------- combine ---------- */

  function combine() {
    const result = SB.resolve(benchAtoms(), process);
    if (!result.ok) {
      paintFailure(result);
      saveStatus.textContent = 'No product yet — read the note under the result.';
      return;
    }

    const product = result.product;
    const existed = window.SciLampStore ? SciLampStore.hasProduct(product.key) : false;
    let saved = product;
    if (window.SciLampStore) {
      saved = SciLampStore.addProduct({
        key: product.key,
        compoundId: product.compoundId || null,
        kind: product.kind,
        name: product.name,
        formula: product.formula,
        atoms: product.atoms,
        contains: product.contains,
        note: product.note,
        why: product.why,
        formation: product.formation,
        description: product.description,
        properties: product.properties,
        compositionText: product.compositionText,
        suppliedText: product.suppliedText,
        units: product.units,
        ratio: product.ratio,
        anion: product.anion,
        diatomic: Boolean(product.diatomic),
        catalog: Boolean(product.catalog),
      }).item;
    }

    let firstDiscovery = false;
    if (product.compoundId && window.SciLampStore) firstDiscovery = SciLampStore.discover(product.compoundId);

    const wins = runChallenges(product);
    paintProduct(product, { isNew: !existed, firstDiscovery, wins });

    highlightKey = product.key;
    renderShelf();
    clearTimeout(renderShelf.highlightTimer);
    renderShelf.highlightTimer = setTimeout(() => {
      const hot = shelfList.querySelector('.sb-prod.is-new');
      if (hot) hot.classList.remove('is-new');
    }, 2200);

    const shouldExplain = firstDiscovery || (!product.compoundId && !existed);
    if (shouldExplain) {
      setTimeout(() => {
        if (!open) return;
        if (window.SciLampSheet) SciLampSheet.openProduct(saved, { mode: 'created', trigger: resultEl });
      }, reduceMotion ? 0 : 420);
    }
  }

  combineBtn.addEventListener('click', combine);

  processEl.querySelectorAll('.sb-proc').forEach((btn) => {
    btn.addEventListener('click', () => {
      process = btn.dataset.process;
      processEl.querySelectorAll('.sb-proc').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      paintIdle();
      saveStatus.textContent = `Process set to ${process}.`;
    });
  });

  resetBtn.addEventListener('click', () => {
    bench.clear();
    paintBench();
    paintIdle();
    saveStatus.textContent = 'Bench cleared.';
    const first = paletteEl.querySelector('.sb-chip');
    if (first) first.focus({ preventScroll: true });
  });

  /* ---------- shelf ---------- */

  function renderShelf() {
    if (!window.SciLampStore) return;
    const items = SciLampStore.products();
    const now = Date.now();
    shelfCount.textContent = `${items.length} saved`;
    shelfClear.disabled = items.length === 0;

    if (!items.length) {
      shelfList.innerHTML = '<p class="sb-shelf-empty">Nothing saved yet. Every successful combine lands here, kept on this device.</p>';
      return;
    }

    shelfList.innerHTML = items.map((p) => {
      const kind = p.diatomic ? 'Diatomic element' : (SB.KIND_LABEL[p.kind] || 'Compound');
      const when = p.lastAt && now - p.lastAt < 86400000
        ? 'today'
        : p.lastAt
          ? new Date(p.lastAt).toLocaleDateString()
          : '';
      const hot = p.key === highlightKey ? ' is-new' : '';
      return `<article class="sb-prod${hot}" data-key="${esc(p.key)}">
        <button class="sb-prod-open" type="button" data-open="${esc(p.key)}" aria-label="Open ${esc(p.name)}, ${esc(p.formula)}">
          <span class="sb-prod-formula">${esc(p.formula)}</span>
          <span class="sb-prod-name">${esc(p.name)}</span>
          <span class="sb-prod-meta">${kind}${p.times > 1 ? ` · saved ${p.times}×` : ''}${when ? ` · ${when}` : ''}</span>
        </button>
        <button class="sb-prod-x" type="button" data-remove-product="${esc(p.key)}" aria-label="Remove ${esc(p.name)} from my products">&times;</button>
      </article>`;
    }).join('');
  }

  shelfList.addEventListener('click', (event) => {
    const openBtn = event.target.closest('[data-open]');
    if (openBtn) {
      const item = SciLampStore.products().find((p) => p.key === openBtn.dataset.open);
      if (item && window.SciLampSheet) SciLampSheet.openProduct(item, { mode: 'detail', trigger: openBtn });
      return;
    }
    const removeBtn = event.target.closest('[data-remove-product]');
    if (removeBtn) {
      const key = removeBtn.dataset.removeProduct;
      const item = SciLampStore.products().find((p) => p.key === key);
      SciLampStore.removeProduct(key);
      saveStatus.textContent = item ? `${item.name} removed from my products.` : 'Product removed.';
      renderShelf();
      const next = shelfList.querySelector('[data-open]');
      if (next) next.focus({ preventScroll: true });
      else shelfClear.focus({ preventScroll: true });
    }
  });

  function resetClear() {
    clearArmed = false;
    clearTimeout(clearTimer);
    shelfClear.classList.remove('is-armed');
    shelfClear.textContent = 'clear all';
  }

  shelfClear.addEventListener('click', () => {
    if (!window.SciLampStore || SciLampStore.products().length === 0) return;
    if (!clearArmed) {
      clearArmed = true;
      shelfClear.classList.add('is-armed');
      shelfClear.textContent = 'confirm clear all';
      saveStatus.textContent = 'Press confirm clear all to remove every saved product.';
      clearTimer = setTimeout(resetClear, 4000);
      return;
    }
    SciLampStore.clearProducts();
    resetClear();
    renderShelf();
    saveStatus.textContent = 'All saved products cleared. Discoveries stay lit in the index.';
  });

  shelfIndex.addEventListener('click', () => {
    if (window.SciLampNav) SciLampNav.page('index');
  });

  document.addEventListener('scilamp:products', renderShelf);

  /* the sheet's "my products" action scrolls the shelf into view */
  window.scilampShowShelf = () => {
    shelfEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    shelfEl.classList.add('is-called');
    setTimeout(() => shelfEl.classList.remove('is-called'), 1400);
  };

  infoFullBtn.addEventListener('click', () => {
    if (!inspected) return;
    if (window.SciLampSheet) SciLampSheet.openElement(inspected);
  });

  /* ---------- open / close ---------- */

  function openSandbox() {
    if (open) return;
    open = true;
    window.scilampSandboxOpen = true;

    sandbox.hidden = false;
    sandbox.classList.add('is-open');
    sandbox.setAttribute('aria-hidden', 'false');

    if (!activeChallenge) {
      const next = CHALLENGES.find((c) => !done.includes(c.id));
      activeChallenge = next ? next.id : null;
    }
    paintBench();
    paintIdle();
    renderChallenges();
    renderHint();
    renderShelf();
    sandbox.focus({ preventScroll: true });

    /* hide the table from assistive tech only after focus has left it */
    tablePrevAria = pageTable.getAttribute('aria-hidden');
    pageTable.inert = true;
    pageTable.setAttribute('aria-hidden', 'true');
  }

  function closeSandbox() {
    if (!open) return;
    open = false;
    window.scilampSandboxOpen = false;

    pageTable.inert = false;
    if (pageTable.classList.contains('is-open')) {
      if (tablePrevAria === null) pageTable.removeAttribute('aria-hidden');
      else pageTable.setAttribute('aria-hidden', tablePrevAria);
    }
    if (sandbox.contains(document.activeElement)) entry.focus({ preventScroll: true });

    sandbox.classList.remove('is-open');
    sandbox.hidden = true;
    sandbox.setAttribute('aria-hidden', 'true');
  }

  window.scilampOpenSandbox = openSandbox;
  window.scilampCloseSandbox = closeSandbox;

  entry.addEventListener('click', openSandbox);
  backBtn.addEventListener('click', closeSandbox);

  /* any route out of the table page also closes the bench first */
  document.addEventListener('click', (event) => {
    if (!open) return;
    if (event.target.closest('#drawer-table, #drawer-nom, #drawer-index, #drawer-tutorial, #mini-tab')) closeSandbox();
  }, true);

  renderPalette();
  paintBench();
  paintIdle();
  renderChallenges();
  renderHint();
  renderShelf();
})();
