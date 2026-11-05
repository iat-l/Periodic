/* Compound index — every catalogued compound, with undiscovered identities kept hidden.
   The catalog (compounds.js) is the only source: this page only decides how each entry
   is painted and what its card opens. */

(() => {
  const grid = document.getElementById('index-grid');
  const progressText = document.getElementById('index-progress-text');
  const fill = document.getElementById('index-fill');
  const bar = document.getElementById('index-bar');
  const sandboxBtn = document.getElementById('index-sandbox');
  const backBtn = document.getElementById('index-back');
  const drawerBtn = document.getElementById('drawer-index');
  if (!grid) return;

  const TOTAL = COMPOUNDS.length;

  const kindLabel = (c) => (
    c.kind === 'alloy' ? 'Alloy' : c.kind === 'ionic' ? 'Ionic compound' : 'Covalent compound'
  );

  const atomCount = (c) => {
    if (c.metals) return null;
    if (!c.atoms) return null;
    return Object.values(c.atoms).reduce((sum, n) => sum + n, 0);
  };

  const atomText = (c) => {
    if (c.metals) return 'variable composition';
    const n = atomCount(c);
    return `${n} atom${n === 1 ? '' : 's'} in the formula`;
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
    progressText.textContent = `${count} of ${TOTAL} discovered`;
    fill.style.width = `${(count / TOTAL) * 100}%`;
    bar.setAttribute('aria-valuemax', String(TOTAL));
    bar.setAttribute('aria-valuenow', String(count));
  }

  function render() {
    const found = foundIds();
    paintProgress(found);

    grid.innerHTML = COMPOUNDS.map((c) => {
      const isFound = found.has(c.id);
      const kind = kindLabel(c);
      if (!isFound) {
        return `<article class="ix-card is-locked" data-kind="${c.kind}">
          <button class="ix-open" type="button" data-locked="${c.id}"
            aria-label="Undiscovered ${kind.toLowerCase()}, ${atomText(c)}. Open for a hint.">
            <span class="ix-kind">${kind} · ${atomText(c)}</span>
            <span class="ix-formula" aria-hidden="true">???</span>
            <span class="ix-name">identity hidden</span>
            <span class="ix-teaser">tap for a hint</span>
          </button>
        </article>`;
      }
      return `<article class="ix-card is-found" data-kind="${c.kind}">
        <button class="ix-open" type="button" data-found="${c.id}"
          aria-label="${esc(c.name)}, ${esc(c.formula)}. Open the compound card.">
          <span class="ix-kind">${kind} · ${atomText(c)}</span>
          <span class="ix-formula">${esc(c.formula)}</span>
          <span class="ix-name">${esc(c.name)}</span>
          <span class="ix-teaser">open the compound card</span>
        </button>
      </article>`;
    }).join('');
  }

  grid.addEventListener('click', (event) => {
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

  backBtn.addEventListener('click', () => {
    if (window.SciLampNav) SciLampNav.home();
  });

  if (drawerBtn) {
    drawerBtn.addEventListener('click', () => {
      if (window.SciLampNav) SciLampNav.page('index');
    });
  }

  document.addEventListener('scilamp:discoveries', render);

  render();
})();
