/* ============================================================
   Sci-lamp storage — one versioned home for durable progress
   ------------------------------------------------------------
   GitHub Pages has no backend, so every record lives in
   localStorage. Each key is versioned and every read is defensive:
   a corrupt or blocked store must never break the page.
   ============================================================ */

const SciLampStore = (() => {
  const KEYS = {
    products: 'scilamp.products.v1',
    discoveries: 'scilamp.discoveries.v1',
    tutorial: 'scilamp.tutorial.v1',
  };

  let memoryProducts = [];
  let memoryDiscoveries = [];
  let memoryTutorial = null;

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked: the in-memory copy still lasts this visit */
    }
  }

  const emit = (name, detail) => {
    document.dispatchEvent(new CustomEvent(`scilamp:${name}`, { detail }));
  };

  /* ---------- products ---------- */

  function products() {
    const data = read(KEYS.products, null);
    const items = data && Array.isArray(data.items) ? data.items : memoryProducts;
    memoryProducts = items.filter((p) => p && typeof p.key === 'string' && typeof p.name === 'string');
    return memoryProducts.slice();
  }

  function saveProducts(items) {
    memoryProducts = items;
    write(KEYS.products, { v: 1, items });
    emit('products', items);
  }

  function hasProduct(key) {
    return products().some((p) => p.key === key);
  }

  /* one entry per product key; a repeat updates the timestamp and count */
  function addProduct(product) {
    const items = products();
    const at = Date.now();
    const existing = items.find((p) => p.key === product.key);
    if (existing) {
      existing.lastAt = at;
      existing.times = (existing.times || 1) + 1;
      saveProducts(items);
      return { item: existing, existed: true };
    }
    const item = { ...product, createdAt: at, lastAt: at, times: 1 };
    items.unshift(item);
    saveProducts(items.slice(0, 120));
    return { item, existed: false };
  }

  function removeProduct(key) {
    const items = products().filter((p) => p.key !== key);
    saveProducts(items);
  }

  function clearProducts() {
    saveProducts([]);
  }

  /* ---------- discoveries ---------- */

  function discoveries() {
    const data = read(KEYS.discoveries, null);
    const ids = data && Array.isArray(data.ids) ? data.ids : memoryDiscoveries;
    memoryDiscoveries = ids.filter((id) => typeof id === 'string');
    return memoryDiscoveries.slice();
  }

  function isDiscovered(id) {
    return discoveries().includes(id);
  }

  /* returns true only the first time this catalog compound is found */
  function discover(id) {
    const ids = discoveries();
    if (ids.includes(id)) return false;
    ids.push(id);
    memoryDiscoveries = ids;
    write(KEYS.discoveries, { v: 1, ids });
    emit('discoveries', ids);
    return true;
  }

  /* ---------- tutorial ---------- */

  function tutorialDone() {
    const data = read(KEYS.tutorial, null);
    return Boolean(data && data.done);
  }

  function setTutorialDone() {
    memoryTutorial = { v: 1, done: true, at: Date.now() };
    write(KEYS.tutorial, memoryTutorial);
    emit('tutorial', memoryTutorial);
  }

  return {
    KEYS,
    products,
    hasProduct,
    addProduct,
    removeProduct,
    clearProducts,
    discoveries,
    isDiscovered,
    discover,
    tutorialDone,
    setTutorialDone,
  };
})();

window.SciLampStore = SciLampStore;
