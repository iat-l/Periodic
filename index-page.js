/* Compound index — every catalogued compound, with undiscovered identities kept hidden.
   The catalog (compounds.js) is the only source: this page only decides how each entry
   is painted and what its card opens. */

(() => {
  const grid = document.getElementById('index-grid');
  const filters = document.getElementById('index-filters');
  const progressText = document.getElementById('index-progress-text');
  const fill = document.getElementById('index-fill');
  const bar = document.getElementById('index-bar');
  const sandboxBtn = document.getElementById('index-sandbox');
  if (!grid) return;

  const TOTAL = COMPOUNDS.length;
  const I18N = window.SciLampI18n;
  const t = (en, zh) => I18N?.t(en, zh) ?? en;
  const STAR = 'M12 3.6l2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.61 6.9 19.3l.98-5.68L3.75 9.6l5.7-.83z';

  const ACID_IDS = new Set(['hydrogen-chloride', 'hydrogen-fluoride', 'hydrogen-sulfide', 'sulfuric-acid', 'nitric-acid']);
  const PEROXIDE_IDS = new Set(['hydrogen-peroxide']);

  /* A compound belongs to one teaching category. Binary oxygen compounds are
     oxides; ionic compounds with polyatomic partners stay salts; peroxides and
     the remaining covalent formulas are molecules. */
  const categoryOf = (c) => {
    if (c.kind === 'alloy') return 'alloy';
    if (c.id.endsWith('-hydroxide')) return 'hydroxide';
    if (ACID_IDS.has(c.id)) return 'acid';
    const elements = c.atoms ? Object.keys(c.atoms) : [];
    if (elements.includes('O') && elements.length === 2 && !PEROXIDE_IDS.has(c.id)) return 'oxide';
    if (c.kind === 'ionic') return 'salt';
    return 'molecule';
  };

  const CATEGORIES = [
    { id: 'all', en: 'All', zh: '全部', manyEn: 'All', manyZh: '全部' },
    { id: 'molecule', en: 'Molecule', zh: '分子', manyEn: 'Molecules', manyZh: '分子' },
    { id: 'oxide', en: 'Oxide', zh: '氧化物', manyEn: 'Oxides', manyZh: '氧化物' },
    { id: 'acid', en: 'Acid', zh: '酸', manyEn: 'Acids', manyZh: '酸' },
    { id: 'salt', en: 'Salt', zh: '鹽', manyEn: 'Salts', manyZh: '鹽' },
    { id: 'hydroxide', en: 'Hydroxide', zh: '氫氧化物', manyEn: 'Hydroxides', manyZh: '氫氧化物' },
    { id: 'alloy', en: 'Alloy', zh: '合金', manyEn: 'Alloys', manyZh: '合金' },
  ];

  const categoryCopy = (id) => CATEGORIES.find((cat) => cat.id === id) || CATEGORIES[0];
  const categoryLabel = (id) => {
    const cat = categoryCopy(id);
    return I18N?.isZh ? cat.zh : cat.en;
  };
  const isZh = () => Boolean(I18N?.isZh);

  let activeCategory = 'all';

  const atomCount = (c) => {
    if (c.metals) return null;
    if (!c.atoms) return null;
    return Object.values(c.atoms).reduce((sum, n) => sum + n, 0);
  };

  const atomText = (c) => {
    if (c.metals) return t('variable composition', '組成可變');
    const n = atomCount(c);
    return I18N?.isZh ? `化學式中 ${n} 顆原子` : `${n} atom${n === 1 ? '' : 's'} in the formula`;
  };

  const metaText = (c) => {
    if (c.metals) return t('variable composition', '組成可變');
    const n = atomCount(c);
    return I18N?.isZh ? `${n} 顆原子` : `${n} atom${n === 1 ? '' : 's'}`;
  };

  /* a catalog entry becomes the same product object the sandbox produces */
  function productFor(c) {
    const atoms = c.atoms || Object.fromEntries((c.metals || []).map((s) => [s, 1]));
    const mode = c.kind === 'alloy' ? 'alloy' : 'auto';
    const result = SB.resolve(atoms, mode);
    return result.ok ? result.product : null;
  }

  function foundIds() {
    return new Set(window.SciLampStore ? SciLampStore.discoveries() : []);
  }

  function paintProgress(found) {
    const count = COMPOUNDS.filter((c) => found.has(c.id)).length;
    progressText.textContent = I18N?.isZh ? `已發現 ${count} / ${TOTAL}` : `${count} of ${TOTAL} discovered`;
    fill.style.width = `${(count / TOTAL) * 100}%`;
    bar.setAttribute('aria-valuemax', String(TOTAL));
    bar.setAttribute('aria-valuenow', String(count));
  }

  function paintFilters(found, visibleCount) {
    if (!filters) return;
    filters.innerHTML = CATEGORIES.map((cat) => {
      const items = cat.id === 'all' ? COMPOUNDS : COMPOUNDS.filter((c) => categoryOf(c) === cat.id);
      const seen = items.filter((c) => found.has(c.id)).length;
      const active = activeCategory === cat.id;
      const label = I18N?.isZh ? cat.manyZh : cat.manyEn;
      return `<button class="index-filter${active ? ' is-on' : ''}" type="button"
        data-category-filter="${cat.id}" aria-pressed="${active}">
        <span class="index-filter-dot" aria-hidden="true"></span>
        <span>${label}</span>
        <small>${seen}/${items.length}</small>
      </button>`;
    }).join('');
    filters.setAttribute('aria-label', isZh()
      ? `依類別篩選，目前顯示 ${visibleCount} 個化合物`
      : `Filter by category, showing ${visibleCount} compounds`);
  }

  function render() {
    const found = foundIds();
    paintProgress(found);

    const visible = activeCategory === 'all'
      ? COMPOUNDS
      : COMPOUNDS.filter((c) => categoryOf(c) === activeCategory);
    paintFilters(found, visible.length);

    grid.innerHTML = visible.map((c, i) => {
      const isFound = found.has(c.id);
      const category = categoryOf(c);
      const kind = categoryLabel(category);
      const name = I18N?.compoundName(c) || c.name;
      const kindLine = `${kind} · ${metaText(c)}`;
      const stagger = ` style="--ci:${i % 14}"`;
      if (!isFound) {
        return `<article class="ix-card is-locked" data-kind="${c.kind}" data-category="${category}"${stagger}>
          <button class="ix-open" type="button" data-locked="${c.id}"
            aria-label="${I18N?.isZh ? `未發現的${kind}，${atomText(c)}。打開看提示。` : `Undiscovered ${kind.toLowerCase()}, ${atomText(c)}. Open for a hint.`}">
            <span class="ix-kind">${kindLine}</span>
            <span class="ix-formula" aria-hidden="true">???</span>
            <span class="ix-teaser">${t('tap for a hint', '點一下看提示')}</span>
          </button>
        </article>`;
      }
      return `<article class="ix-card is-found" data-kind="${c.kind}" data-category="${category}"${stagger}>
        <button class="ix-open" type="button" data-found="${c.id}"
          aria-label="${I18N?.isZh ? `${esc(name)}，${esc(c.formula)}。打開化合物卡片。` : `${esc(name)}, ${esc(c.formula)}. Open the compound card.`}">
          <span class="ix-kind">${kindLine}</span>
          <span class="ix-formula">${esc(c.formula)}</span>
          <span class="ix-name">${esc(name)}</span>
          <span class="ix-teaser">${t('open card', '打開卡片')}</span>
        </button>
        <button class="ix-star" type="button" data-fav="${c.id}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR}"/></svg>
        </button>
      </article>`;
    }).join('');

    syncStars();
  }

  function syncStars() {
    if (!window.SciLampFx) return;
    const saved = new Set(window.SciLampStore ? SciLampStore.favoriteIds() : []);
    grid.querySelectorAll('[data-fav]').forEach((btn) => {
      SciLampFx.syncFavorite(btn, saved.has(`compound:${btn.dataset.fav}`));
    });
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  filters?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-category-filter]');
    if (!btn) return;
    activeCategory = btn.dataset.categoryFilter;
    render();
  });

  grid.addEventListener('click', (event) => {
    const star = event.target.closest('[data-fav]');
    if (star) {
      const c = COMPOUND_BY_ID.get(star.dataset.fav);
      if (!c || !window.SciLampFx) return;
      const active = SciLampFx.toggle(SciLampFx.catalogRecord(c));
      SciLampFx.syncFavorite(star, active);
      SciLampFx.pop(star);
      return;
    }

    const btn = event.target.closest('[data-found], [data-locked]');
    if (!btn || !window.SciLampSheet) return;

    if (btn.dataset.found) {
      const c = COMPOUND_BY_ID.get(btn.dataset.found);
      const product = c ? productFor(c) : null;
      if (product) SciLampSheet.openProduct(product, { mode: 'detail', trigger: btn });
      return;
    }

    const c = COMPOUND_BY_ID.get(btn.dataset.locked);
    if (c) SciLampSheet.openHint(c, { trigger: btn });
  });

  sandboxBtn.addEventListener('click', () => {
    if (window.SciLampNav) SciLampNav.openSandbox();
  });

  document.addEventListener('scilamp:discoveries', render);
  document.addEventListener('scilamp:favorites', syncStars);
  document.addEventListener('scilamp:lang', render);

  render();
})();
