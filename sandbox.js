/* Sandbox mode — a bench over the periodic table page.
   Atoms accumulate as a multiset; the resolver in sandbox-data.js decides what the
   mixture makes. Every successful product is saved through SciLampStore and
   catalog discoveries light up the compound index, which is the only place the
   collection is shown. The table stays mounted underneath, so its state survives. */

(() => {
  const sandbox = document.getElementById('sandbox');
  const entry = document.getElementById('sandbox-entry');
  const pageTable = document.getElementById('page-table');
  if (!sandbox || !entry || !pageTable) return;

  const STORE_KEY = 'scilamp.sandbox.v1';
  const CHALLENGES = SB.CHALLENGES;
  const I18N = window.SciLampI18n;
  const t = (en, zh) => I18N?.t(en, zh) ?? en;
  const symName = (sym, fallback = '') => I18N?.elementName(sym) || fallback;
  const productName = (product) => I18N?.compoundName(product) || product.name;

  /* challenge wordings live here so both languages stay answer-free */
  const CHALLENGE_TEXT = {
    alloy: {
      en: ['Make any alloy', 'Two metals walk onto the bench. What do they become when they cool together?'],
      zh: ['做出任何一種合金', '兩種金屬走上實驗台。冷卻之後，它們會變成什麼？'],
    },
    ionic: {
      en: ['Create an ionic compound', 'One gives, one takes. Who is left holding the charge?'],
      zh: ['做出一種離子化合物', '一個給，一個拿。最後是誰抱著電荷？'],
    },
    'two-one': {
      en: ['Build a 2:1 ionic compound', 'One negative ion wants two positive partners. Can you arrange the guest list?'],
      zh: ['做出 2:1 的離子化合物', '一個陰離子想要兩位陽離子作伴。你能排好這份賓客名單嗎？'],
    },
    covalent: {
      en: ['Create a covalent molecule', 'Two nonmetals refuse to give up electrons. What do they do instead?'],
      zh: ['做出一個共價分子', '兩種非金屬都不肯交出電子。那它們會怎麼做？'],
    },
    oxygen: {
      en: ['Build a product containing oxygen', 'Which breathable element wants to join almost anything on the bench?'],
      zh: ['做出含氧的產物', '哪一種可呼吸的元素，幾乎什麼都想加入？'],
    },
    halide: {
      en: ['Make an ionic halide', 'A salt with a halogen’s name hidden inside — who will hold the other end?'],
      zh: ['做出離子鹵化物', '一種藏著鹵素名字的鹽——另一端會由誰握住？'],
    },
    'three-elements': {
      en: ['Build a compound from three elements', 'Three different elements in one compound: perhaps oxygen, a metal and the lightest atom.'],
      zh: ['用三種元素做出化合物', '一個化合物裡有三種不同元素：也許是氧、一種金屬，還有最輕的原子。'],
    },
  };
  const challengeTitle = (challenge) => {
    const text = CHALLENGE_TEXT[challenge.id];
    return text ? (I18N?.isZh ? text.zh[0] : text.en[0]) : challenge.title;
  };
  const challengeHint = (challenge) => {
    const text = CHALLENGE_TEXT[challenge.id];
    return text ? (I18N?.isZh ? text.zh[1] : text.en[1]) : challenge.hint;
  };

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
  const scoreEl = document.getElementById('sb-score');
  const fillEl = document.getElementById('sb-progress-fill');
  const progressText = document.getElementById('sb-progress-text');
  const challengesEl = document.getElementById('sb-challenges');
  const hintline = document.getElementById('sb-hintline');
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
  let lastProduct = null;
  let lastInfo = null;
  let lastFailure = false;
  let freshSym = null;
  let freshTimer = 0;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elementRecord = (sym) => ELEMENTS.find((e) => e[1] === sym) || null;

  /* ---------- palette ---------- */

  function renderPalette() {
    paletteEl.innerHTML = SB.PALETTE.map((sym) => {
      const el = SB.EL(sym);
      if (!el) return '';
      return `<button class="sb-chip" type="button" draggable="true" data-symbol="${el.symbol}" data-cat="${el.cat}"
        aria-label="${t(`Drag one ${el.name} atom to the bench; press Enter to add one`, `把一顆${symName(el.symbol, el.name)}原子拖到實驗台；按 Enter 加入一顆`)}">
        <span class="sb-chip-mark" aria-hidden="true"></span>
        <span class="sb-chip-num">${el.number}</span>
        <span class="sb-chip-sym">${el.symbol}</span>
        <span class="sb-chip-name">${symName(el.symbol, el.name)}</span>
      </button>`;
    }).join('');

    paletteEl.querySelectorAll('.sb-chip').forEach((chip) => {
      const sym = chip.dataset.symbol;
      chip.style.setProperty('--mark', SciLampArt.forMark(sym));
      /* a click only opens the notes; adding to the bench is a deliberate drag */
      chip.addEventListener('click', () => {
        inspected = sym;
        paintSelection();
        paintInfo();
      });
      chip.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (event.repeat) return;
        event.preventDefault();
        addAtom(sym);
      });
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
      infoEl.innerHTML = `<p class="sb-info-empty">
        <svg class="sb-info-empty-mark" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.4" /><path d="m15.4 15.4 4.8 4.8" /><circle cx="10.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" /></svg>
        <span>${t('Click an element to read what it is, how it behaves and where it is used. Drag it onto the bench to add an atom.', '點一個元素，讀它是什麼、有什麼性質、用在哪裡。把它拖到實驗台上就能加入一顆原子。')}</span>
      </p>`;
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
          <strong>${symName(el.symbol, el.name)}</strong>
          <span>${I18N?.categoryName(el.cat) || CATEGORIES[el.cat]} · ${I18N?.stateName(state) || state} ${t('at 25 °C', '在 25 °C')}</span>
        </span>
      </div>
      <p class="sb-info-desc">${I18N?.elementDescription(el.symbol) || el.description}</p>
      <dl class="sb-info-facts">
        <div><dt>${t('Mass', '質量')}</dt><dd>${el.mass} u</dd></div>
        <div><dt>${t('Oxidation', '氧化態')}</dt><dd>${el.oxidation}</dd></div>
      </dl>`;
  }

  /* ---------- bench ---------- */

  const benchSymbols = () => [...bench.keys()].sort((a, b) => SB.EL(a).number - SB.EL(b).number);
  const benchAtoms = () => Object.fromEntries(bench);
  const benchTotal = () => [...bench.values()].reduce((sum, n) => sum + n, 0);

  function benchLine() {
    const syms = benchSymbols();
    if (!syms.length) return t('Nothing on the bench yet.', '實驗台上還沒有東西。');
    return `${syms.map((s) => `${bench.get(s)} ${s}`).join(' + ')} ${t('— check the process, then combine.', '——檢查製程，然後按結合。')}`;
  }

  function paintCount() {
    const total = benchTotal();
    const kinds = bench.size;
    atomCountEl.textContent = total
      ? (I18N?.isZh
        ? `${total} 顆原子 · ${kinds} 種元素`
        : `${total} atom${total === 1 ? '' : 's'} · ${kinds} element${kinds === 1 ? '' : 's'}`)
      : t('empty bench', '空實驗台');
    recipeEl.textContent = benchLine();
  }

  function renderAtoms() {
    const syms = benchSymbols();
    emptyEl.hidden = syms.length > 0;

    atomsEl.innerHTML = syms.map((sym) => {
      const el = SB.EL(sym);
      const n = bench.get(sym);
      const fresh = sym === freshSym ? ' is-fresh' : '';
      return `<div class="sb-atom${fresh}" data-cat="${el.cat}" data-sym="${sym}">
        <span class="sb-atom-mark" aria-hidden="true"></span>
        <button class="sb-atom-x" type="button" data-remove="${sym}" aria-label="${t(`Remove ${el.name} from the bench`, `從實驗台移除${symName(el.symbol, el.name)}`)}">&times;</button>
        <span class="sb-atom-sym">${el.symbol}</span>
        <span class="sb-atom-name">${symName(el.symbol, el.name)}</span>
        <span class="sb-stepper">
          <button type="button" data-step="-1" data-sym="${sym}" aria-label="${t(`Remove one ${el.name} atom`, `移除一顆${symName(el.symbol, el.name)}原子`)}">&minus;</button>
          <span class="sb-atom-n" aria-hidden="true">${n}</span>
          <button type="button" data-step="1" data-sym="${sym}" aria-label="${t(`Add one ${el.name} atom`, `加入一顆${symName(el.symbol, el.name)}原子`)}">+</button>
        </span>
        <span class="sr">${I18N?.isZh ? `${n} 顆${symName(el.symbol, el.name)}原子在實驗台上` : `${n} ${el.name} atom${n === 1 ? '' : 's'} on the bench`}</span>
      </div>`;
    }).join('');

    atomsEl.querySelectorAll('.sb-atom').forEach((atom) => {
      atom.style.setProperty('--mark', SciLampArt.forMark(atom.dataset.sym));
    });

    paintCount();
  }

  function paintBench() {
    renderAtoms();
    paintSelection();
    paintInfo();
    /* the bench changed, so any result on screen no longer describes it */
    paintIdle();
  }

  function focusAfterAtomChange(sym, step) {
    if (step && bench.has(sym)) {
      const next = atomsEl.querySelector(`.sb-atom[data-sym="${sym}"] [data-step="${step}"]`);
      if (next) { next.focus({ preventScroll: true }); return; }
    }
    const chip = paletteEl.querySelector(`.sb-chip[data-symbol="${sym}"]`);
    if (chip) chip.focus({ preventScroll: true });
  }

  function markFresh(sym) {
    freshSym = sym;
    clearTimeout(freshTimer);
    freshTimer = setTimeout(() => { freshSym = null; }, 460);
  }

  function addAtom(sym, { quiet = false } = {}) {
    if (!SB.PALETTE.includes(sym)) return;
    bench.set(sym, Math.min(99, (bench.get(sym) || 0) + 1));
    inspected = sym;
    markFresh(sym);
    paintBench();
    if (!quiet) {
      const name = symName(sym, SB.EL(sym).name);
      saveStatus.textContent = I18N?.isZh ? `加入了一顆${name}原子。` : `Added one ${SB.EL(sym).name.toLowerCase()} atom.`;
    }
  }

  function stepAtom(sym, delta) {
    const next = (bench.get(sym) || 0) + delta;
    if (next <= 0) bench.delete(sym);
    else bench.set(sym, Math.min(99, next));
    markFresh(sym);
    paintBench();
    focusAfterAtomChange(sym, delta);
  }

  function removeAtom(sym) {
    bench.delete(sym);
    paintBench();
    const chip = paletteEl.querySelector(`.sb-chip[data-symbol="${sym}"]`);
    if (chip) chip.focus({ preventScroll: true });
    saveStatus.textContent = I18N?.isZh
      ? `已從實驗台移除${symName(sym, SB.EL(sym).name)}。`
      : `${SB.EL(sym).name} removed from the bench.`;
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
    const ready = benchTotal() > 0;
    const message = ready
      ? t('Ready when you are — press Combine.', '準備好了就按「結合」。')
      : t('Add a few atoms, then press Combine.', '加幾顆原子，然後按「結合」。');
    const icon = `<svg class="sb-result-mark" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9.5" ry="4" />
      <ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(60 12 12)" opacity=".55" />
    </svg>`;
    resultEl.innerHTML = `<p class="sb-result-empty">${icon}<span>${message}</span></p>`;
  };

  function paintIdle() {
    lastProduct = null;
    lastInfo = null;
    lastFailure = false;
    defaultResult();
  }

  function paintFailure() {
    lastProduct = null;
    lastInfo = null;
    lastFailure = true;
    resultEl.className = 'sb-result is-bad';
    resultEl.innerHTML = `
      <p class="sb-result-kicker">${t('Not quite', '差一點')}</p>
      <p class="sb-result-text">${t('That mixture does not form a product here. Change the atoms and try again.', '這個組合在這裡不會形成產物。換幾顆原子再試一次。')}</p>`;
  }

  function paintProduct(product, info, announce = true) {
    lastProduct = product;
    lastInfo = info;
    lastFailure = false;
    resultEl.className = 'sb-result is-good';
    const kind = product.diatomic ? t('Diatomic element', '雙原子元素') : I18N?.kindLabel(product.kind) || SB.KIND_LABEL[product.kind];
    const ratio = product.ratio
      ? t(` &middot; ${product.ratio[0]}:${product.ratio[1]} ions`, ` &middot; ${product.ratio[0]}:${product.ratio[1]} 離子`)
      : '';
    const units = product.units > 1
      ? t(` &middot; ${product.units} units`, ` &middot; ${product.units} 個單位`)
      : '';
    const winsHtml = info.wins.length
      ? `<p class="sb-win">${t('Challenge complete —', '挑戰完成——')} ${info.wins.map((id) => challengeTitle(CHALLENGES.find((c) => c.id === id))).join(I18N?.isZh ? '、' : ', ')}</p>`
      : '';
    const savedText = info.firstDiscovery
      ? t('First discovery — kept in the compound index.', '首次發現——已保存在化合物索引。')
      : info.isNew
        ? t('Saved to the compound index.', '已保存在化合物索引。')
        : t('Already saved — the index keeps one entry per compound.', '先前已保存——索引中每個化合物只保留一筆。');

    const favorite = window.SciLampFx ? SciLampFx.productRecord(product) : null;
    const starred = favorite && window.SciLampStore ? SciLampStore.isFavorite(favorite.id) : false;
    const starLabel = starred
      ? t('Remove from favorites', '從收藏移除')
      : t('Save to favorites', '收藏');
    const copyLabel = t('Copy a shareable summary', '複製可分享的摘要');
    const tools = favorite
      ? `<div class="sb-actions">
          <button class="icon-btn${starred ? ' is-on' : ''}" type="button" data-fav-product
            aria-pressed="${starred}" aria-label="${starLabel}" title="${starLabel}">
            <svg class="icon-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.61 6.9 19.3l.98-5.68L3.75 9.6l5.7-.83z"/></svg>
          </button>
          <button class="icon-btn" type="button" data-copy-product aria-label="${copyLabel}" title="${copyLabel}">
            <svg class="icon-copy" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="1.8"/><path d="M5.5 14.5V5.5h9"/></svg>
            <svg class="icon-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7.2"/></svg>
          </button>
        </div>`
      : '';

    resultEl.innerHTML = `
      <p class="sb-result-kicker">${kind}${ratio}${units}</p>
      <p class="sb-formula">${product.formula}</p>
      <p class="sb-name">${productName(product)}</p>
      <p class="sb-result-text">${I18N?.compoundText(product)?.why || product.why || product.note}</p>
      <p class="sb-saved"><span>&#10003; ${savedText}</span><button class="sb-index-link" type="button" data-open-index>${t('Open the compound index', '打開化合物索引')} &rarr;</button></p>
      ${tools}
      ${winsHtml}`;

    if (announce && window.SciLampFx) {
      resultEl.classList.add('is-fresh');
      setTimeout(() => resultEl.classList.remove('is-fresh'), 640);
      SciLampFx.burstAt(resultEl, { count: info.wins.length || info.firstDiscovery ? 34 : 20 });
    }

    const name = productName(product);
    if (announce) {
      saveStatus.textContent = info.firstDiscovery
        ? (I18N?.isZh ? `已發現並保存${name}，可在化合物索引查看。` : `${name} discovered and saved to the compound index.`)
        : info.isNew
          ? (I18N?.isZh ? `${name}已保存到化合物索引。` : `${name} saved to the compound index.`)
          : (I18N?.isZh ? `${name}先前已保存；索引中的資料已更新。` : `${name} was already saved; its index entry is up to date.`);
    }
  }

  /* ---------- challenges ---------- */

  function renderChallenges(freshWins = []) {
    challengesEl.innerHTML = CHALLENGES.map((c) => {
      const isDone = done.includes(c.id);
      const active = activeChallenge === c.id;
      const title = challengeTitle(c);
      const label = isDone ? t(`${title}, completed`, `${title}，已完成`) : title;
      const fresh = freshWins.includes(c.id) ? ' is-fresh' : '';
      return `<button class="sb-chal${isDone ? ' is-done' : ''}${active ? ' is-active' : ''}${fresh}" type="button"
        data-chal="${c.id}" aria-pressed="${active}" aria-label="${label}">
        <span class="sb-chal-mark" aria-hidden="true">${isDone ? '&check;' : ''}</span>
        <span class="sb-chal-title">${title}</span>
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
    progressText.textContent = I18N?.isZh
      ? `已完成 ${done.length} / ${total} 項挑戰。`
      : `${done.length} of ${total} challenges complete.`;
  }

  function renderHint() {
    const active = CHALLENGES.find((c) => c.id === activeChallenge);
    hintline.hidden = false;
    if (!active) {
      hintline.innerHTML = done.length === CHALLENGES.length
        ? (I18N?.isZh
          ? '<strong>七項挑戰全部完成。</strong>繼續結合——實驗台是你的。'
          : '<strong>All seven challenges complete.</strong> Keep combining — the bench is yours.')
        : t('Pick a challenge to see its hint.', '選一項挑戰來看看提示。');
      return;
    }
    const isDone = done.includes(active.id);
    const kicker = isDone ? t('completed goal', '已完成的目標') : t('current goal', '目前的目標');
    hintline.innerHTML = `<span class="sb-hint-kicker">${kicker}</span><strong>${challengeTitle(active)}</strong> — ${challengeHint(active)}`;
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
    renderChallenges(wins);
    renderHint();
    return wins;
  }

  /* ---------- combine ---------- */

  function combine() {
    const result = SB.resolve(benchAtoms(), process);
    if (!result.ok) {
      paintFailure();
      saveStatus.textContent = t('No product formed — change the atoms and try again.', '沒有形成產物——換幾顆原子再試一次。');
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
      const processLabel = I18N?.isZh
        ? ({ auto: '自動', alloy: '合金', ionic: '離子', covalent: '共價' }[process] || process)
        : process;
      saveStatus.textContent = I18N?.isZh ? `製程已設為${processLabel}。` : `Process set to ${process}.`;
    });
  });

  resetBtn.addEventListener('click', () => {
    bench.clear();
    paintBench();
    paintIdle();
    saveStatus.textContent = t('Bench cleared.', '實驗台已清空。');
    const first = paletteEl.querySelector('.sb-chip');
    if (first) first.focus({ preventScroll: true });
  });

  resultEl.addEventListener('click', (event) => {
    if (event.target.closest('[data-fav-product]') && lastProduct && window.SciLampFx) {
      const btn = event.target.closest('[data-fav-product]');
      const active = SciLampFx.toggle(SciLampFx.productRecord(lastProduct));
      SciLampFx.syncFavorite(btn, active);
      SciLampFx.pop(btn);
      return;
    }

    if (event.target.closest('[data-copy-product]') && lastProduct && window.SciLampFx) {
      SciLampFx.copy(SciLampFx.productSummary(lastProduct), event.target.closest('[data-copy-product]'));
      return;
    }

    if (!event.target.closest('[data-open-index]')) return;
    closeSandbox({ animate: false, restoreFocus: false });
    if (window.SciLampNav) window.SciLampNav.page('index');
  });

  document.addEventListener('scilamp:favorites', () => {
    const btn = resultEl.querySelector('[data-fav-product]');
    if (!btn || !lastProduct || !window.SciLampFx) return;
    const record = SciLampFx.productRecord(lastProduct);
    if (record) SciLampFx.syncFavorite(btn, SciLampStore.isFavorite(record.id));
  });

  document.addEventListener('scilamp:lang', () => {
    renderPalette();
    paintSelection();
    paintInfo();
    renderAtoms();
    paintCount();
    if (lastProduct && lastInfo) paintProduct(lastProduct, lastInfo, false);
    else if (lastFailure) paintFailure();
    else paintIdle();
    renderChallenges();
    renderHint();
    saveStatus.textContent = '';
  });

  infoFullBtn.addEventListener('click', () => {
    if (!inspected) return;
    if (window.SciLampSheet) SciLampSheet.openElement(inspected);
  });

  /* ---------- open / close ---------- */

  let closeTimer = 0;

  function finishClose() {
    clearTimeout(closeTimer);
    sandbox.hidden = true;
    sandbox.classList.remove('is-entering', 'is-leaving');
    sandbox.setAttribute('aria-hidden', 'true');
  }

  function openSandbox() {
    if (open) return;
    open = true;
    window.scilampSandboxOpen = true;

    clearTimeout(closeTimer);
    sandbox.hidden = false;
    sandbox.classList.remove('is-leaving');
    sandbox.classList.add('is-entering');
    void sandbox.offsetWidth;
    sandbox.classList.add('is-open');
    sandbox.setAttribute('aria-hidden', 'false');
    if (window.SciLampNav) window.SciLampNav.setActive('sandbox');

    if (!activeChallenge) {
      const next = CHALLENGES.find((c) => !done.includes(c.id));
      activeChallenge = next ? next.id : null;
    }
    paintBench();
    paintIdle();
    renderChallenges();
    renderHint();
    sandbox.focus({ preventScroll: true });

    /* hide the table from assistive tech only after focus has left it */
    tablePrevAria = pageTable.getAttribute('aria-hidden');
    pageTable.inert = true;
    pageTable.setAttribute('aria-hidden', 'true');
  }

  function closeSandbox({ animate = true, restoreFocus = true } = {}) {
    if (!open) {
      if (!animate && !sandbox.hidden) finishClose();
      return;
    }
    open = false;
    window.scilampSandboxOpen = false;

    pageTable.inert = false;
    if (pageTable.classList.contains('is-open')) {
      if (tablePrevAria === null) pageTable.removeAttribute('aria-hidden');
      else pageTable.setAttribute('aria-hidden', tablePrevAria);
    }
    if (restoreFocus && sandbox.contains(document.activeElement)) entry.focus({ preventScroll: true });

    sandbox.classList.remove('is-open');
    if (animate && !reduceMotion) {
      sandbox.classList.add('is-leaving');
      closeTimer = setTimeout(finishClose, 280);
    } else {
      finishClose();
    }
    if (window.SciLampNav) {
      window.SciLampNav.setActive(pageTable.classList.contains('is-open') ? 'table' : 'home');
    }
  }

  window.scilampOpenSandbox = openSandbox;
  window.scilampCloseSandbox = closeSandbox;

  entry.addEventListener('click', openSandbox);

  renderPalette();
  paintBench();
  paintIdle();
  renderChallenges();
  renderHint();
})();
