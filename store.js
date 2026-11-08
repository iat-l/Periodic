/* ============================================================
   Sci-lab storage — one versioned home for durable progress
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
    favorites: 'scilamp.favorites.v1',
    activity: 'scilamp.activity.v1',
    achievements: 'scilamp.achievements.v1',
    notes: 'scilamp.notes.v1',
  };

  let memoryProducts = [];
  let memoryDiscoveries = [];
  let memoryTutorial = null;
  let memoryFavorites = [];
  let memoryActivity = null;
  let memoryAchievements = [];
  let memoryNotes = [];

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

  /* ---------- favorites ---------- */

  function favorites() {
    const data = read(KEYS.favorites, null);
    const items = data && Array.isArray(data.items) ? data.items : memoryFavorites;
    memoryFavorites = items.filter((item) => item && typeof item.id === 'string');
    return memoryFavorites.slice();
  }

  function favoriteIds() {
    return favorites().map((item) => item.id);
  }

  function isFavorite(id) {
    return favorites().some((item) => item.id === id);
  }

  /* a snapshot travels with the id, so a favorite still renders if its
     source record is ever renamed or removed from the catalog */
  function toggleFavorite(record) {
    if (!record || typeof record.id !== 'string') return false;
    const items = favorites();
    const index = items.findIndex((item) => item.id === record.id);
    const active = index < 0;
    if (active) items.unshift({ ...record, at: Date.now() });
    else items.splice(index, 1);
    memoryFavorites = items;
    write(KEYS.favorites, { v: 1, items });
    emit('favorites', { id: record.id, active, items: items.slice() });
    return active;
  }

  /* ---------- daily activity ---------- */

  const dayKey = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isDayKey = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

  const nextDay = (day) => {
    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    return dayKey(date);
  };

  function activity() {
    const data = read(KEYS.activity, null) || memoryActivity;
    const days = data && Array.isArray(data.days) ? data.days.filter(isDayKey) : [];
    const unique = [...new Set(days)].sort();
    const best = Math.max(Number(data?.best) || 0, longestRun(unique));
    memoryActivity = { v: 1, days: unique, best };
    return { v: 1, days: unique.slice(), best };
  }

  function longestRun(days) {
    let best = 0;
    let run = 0;
    let previous = '';
    days.forEach((day) => {
      run = previous && nextDay(previous) === day ? run + 1 : 1;
      previous = day;
      if (run > best) best = run;
    });
    return best;
  }

  function streakInfo() {
    const data = activity();
    const seen = new Set(data.days);
    const today = new Date();
    const todayCounted = seen.has(dayKey(today));
    const cursor = new Date(today);
    if (!todayCounted) cursor.setDate(cursor.getDate() - 1);
    let current = 0;
    while (seen.has(dayKey(cursor))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return {
      current,
      best: Math.max(data.best, current),
      todayCounted,
      days: data.days.slice(),
    };
  }

  function visitToday() {
    const data = activity();
    const today = dayKey();
    if (!data.days.includes(today)) {
      const days = [...data.days, today].sort().slice(-400);
      memoryActivity = { v: 1, days, best: Math.max(data.best, longestRun(days)) };
      write(KEYS.activity, memoryActivity);
      emit('activity', { ...streakInfo(), external: false });
    }
    return streakInfo();
  }

  /* ---------- achievements ---------- */

  function achievements() {
    const data = read(KEYS.achievements, null);
    const items = data && Array.isArray(data.items) ? data.items : memoryAchievements;
    memoryAchievements = items.filter((item) => item && typeof item.id === 'string');
    return memoryAchievements.slice();
  }

  function hasAchievement(id) {
    return achievements().some((item) => item.id === id);
  }

  function unlockAchievement(id) {
    if (!id || hasAchievement(id)) return false;
    const items = achievements();
    items.push({ id, at: Date.now() });
    memoryAchievements = items;
    write(KEYS.achievements, { v: 1, items });
    emit('achievements', { id, items: items.slice() });
    return true;
  }

  /* ---------- notes ---------- */

  const NOTE_TITLE_MAX = 120;
  const NOTE_BODY_MAX = 6000;
  const NOTE_LIMIT = 160;

  const noteText = (value, max) => (
    typeof value === 'string' ? value.replace(/\r\n?/g, '\n').slice(0, max) : ''
  );

  function normalizeNote(item) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string') return null;
    const title = noteText(item.title, NOTE_TITLE_MAX);
    const body = noteText(item.body, NOTE_BODY_MAX);
    if (!title.trim() && !body.trim()) return null;
    const createdAt = Number(item.createdAt) || Date.now();
    return {
      id: item.id,
      title,
      body,
      courseId: typeof item.courseId === 'string' && item.courseId ? item.courseId : null,
      createdAt,
      updatedAt: Number(item.updatedAt) || createdAt,
    };
  }

  function notes() {
    const data = read(KEYS.notes, null);
    const items = data && Array.isArray(data.items) ? data.items : memoryNotes;
    memoryNotes = items.map(normalizeNote).filter(Boolean);
    return memoryNotes.slice();
  }

  function saveNotes(items) {
    memoryNotes = items;
    write(KEYS.notes, { v: 1, items });
    emit('notes', { items: items.slice() });
  }

  function addNote({ title = '', body = '', courseId = null } = {}) {
    const at = Date.now();
    const note = normalizeNote({
      id: `note-${at.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      body,
      courseId,
      createdAt: at,
      updatedAt: at,
    });
    if (!note) return null;
    const items = notes();
    items.unshift(note);
    saveNotes(items.slice(0, NOTE_LIMIT));
    return note;
  }

  function updateNote(id, patch = {}) {
    const items = notes();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const current = items[index];
    const updated = normalizeNote({
      ...current,
      title: patch.title !== undefined ? patch.title : current.title,
      body: patch.body !== undefined ? patch.body : current.body,
      courseId: patch.courseId !== undefined ? patch.courseId : current.courseId,
      updatedAt: Date.now(),
    });
    if (!updated) return null;
    items[index] = updated;
    items.sort((a, b) => b.updatedAt - a.updatedAt);
    saveNotes(items);
    return updated;
  }

  function removeNote(id) {
    const items = notes();
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) return false;
    saveNotes(next);
    return true;
  }

  function notesFor(courseId) {
    if (!courseId) return [];
    return notes().filter((item) => item.courseId === courseId);
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

  /* ---------- cross-tab sync ---------- */

  window.addEventListener('storage', (event) => {
    if (!event.key || !event.key.startsWith('scilamp')) return;
    if (event.key === KEYS.products) emit('products', products());
    else if (event.key === KEYS.discoveries) emit('discoveries', discoveries());
    else if (event.key === KEYS.favorites) emit('favorites', { id: null, items: favorites(), external: true });
    else if (event.key === KEYS.activity) emit('activity', { ...streakInfo(), external: true });
    else if (event.key === KEYS.achievements) emit('achievements', { id: null, items: achievements(), external: true });
    else if (event.key === KEYS.notes) emit('notes', { items: notes(), external: true });
    emit('storage', { key: event.key });
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) visitToday();
  });

  visitToday();

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
    favorites,
    favoriteIds,
    isFavorite,
    toggleFavorite,
    streakInfo,
    visitToday,
    achievements,
    hasAchievement,
    unlockAchievement,
    notes,
    addNote,
    updateNote,
    removeNote,
    notesFor,
    tutorialDone,
    setTutorialDone,
  };
})();

window.SciLampStore = SciLampStore;
