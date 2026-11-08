/* Small shared feedback layer: paper confetti, quiet toasts, clipboard copy,
   shareable compound summaries and favorite records. Everything is optional
   and reduced-motion aware; nothing here changes layout while it runs. */

const SciLampFx = (() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tr = (en, zh) => window.SciLampI18n?.t(en, zh) ?? en;

  function palette() {
    const style = getComputedStyle(document.documentElement);
    return ['--accent', '--mint-ink', '--sky-ink', '--butter-ink', '--lav-ink', '--blush-ink']
      .map((token) => style.getPropertyValue(token).trim())
      .filter(Boolean);
  }

  /* ---------- confetti ---------- */

  function burst(x, y, { count = 26 } = {}) {
    if (reduce() || typeof document === 'undefined') return;
    const colors = palette();
    if (!colors.length) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'fx-confetti';
    canvas.setAttribute('aria-hidden', 'true');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    document.body.append(canvas);

    const parts = Array.from({ length: count }, (_, i) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 2.2 + Math.random() * 3.8;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed * (0.7 + Math.random() * 0.6),
        vy: Math.sin(angle) * speed - Math.random() * 1.6,
        w: 3 + Math.random() * 4,
        h: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.34,
        sway: 0.6 + Math.random() * 1.8,
        phase: i * 0.45,
        color: colors[i % colors.length],
      };
    });

    const started = performance.now();
    const duration = 1000;
    let frame = 0;

    function paint(now) {
      const t = Math.min((now - started) / duration, 1);
      ctx.clearRect(0, 0, width, height);
      parts.forEach((p) => {
        p.vy += 0.11;
        p.vx *= 0.992;
        p.x += p.vx + Math.sin(now * 0.006 + p.phase) * p.sway * 0.35;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - t * t);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (t < 1) frame = requestAnimationFrame(paint);
      else canvas.remove();
    }

    frame = requestAnimationFrame(paint);
    // cover the very unlikely case where rAF is throttled while the tab is hidden
    setTimeout(() => {
      if (canvas.isConnected && document.hidden) {
        cancelAnimationFrame(frame);
        canvas.remove();
      }
    }, 2400);
  }

  function burstAt(el, options = {}) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + Math.min(rect.height / 2, 220), options);
  }

  /* ---------- toasts ---------- */

  let toastHost = null;

  function host() {
    if (toastHost?.isConnected) return toastHost;
    toastHost = document.createElement('div');
    toastHost.className = 'fx-toasts';
    toastHost.setAttribute('role', 'status');
    toastHost.setAttribute('aria-live', 'polite');
    document.body.append(toastHost);
    return toastHost;
  }

  function toast(message, { tone = 'good', timeout = 2600 } = {}) {
    if (!message) return;
    const el = document.createElement('div');
    el.className = `fx-toast is-${tone}`;
    const mark = document.createElement('span');
    mark.className = 'fx-toast-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = tone === 'warn' ? '!' : '✓';
    const copy = document.createElement('span');
    copy.textContent = message;
    el.append(mark, copy);
    host().append(el);
    requestAnimationFrame(() => el.classList.add('is-on'));
    setTimeout(() => {
      el.classList.remove('is-on');
      setTimeout(() => el.remove(), 320);
    }, timeout);
  }

  /* ---------- clipboard ---------- */

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '0';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
    return ok;
  }

  async function copy(text, button = null) {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) ok = fallbackCopy(text);
    if (button && ok) {
      button.classList.add('is-copied');
      clearTimeout(button.fxCopyTimer);
      button.fxCopyTimer = setTimeout(() => button.classList.remove('is-copied'), 1600);
    }
    toast(
      ok ? tr('Copied to the clipboard.', '已複製到剪貼簿。') : tr('Could not copy — select the text and copy manually.', '無法複製——請手動選取文字。'),
      { tone: ok ? 'good' : 'warn' }
    );
    return ok;
  }

  /* ---------- compound summary ---------- */

  function localizedComposition(product) {
    const raw = product.compositionText || '';
    const I18N = window.SciLampI18n;
    if (!I18N?.isZh || !raw) return raw;
    if (/variable composition/i.test(raw)) return I18N.t('variable composition', '組成可變');
    return raw.replace(/(\d+)\s+([a-z]+)/g, (match, count, name) => {
      const row = (typeof ELEMENTS !== 'undefined' ? ELEMENTS : []).find((entry) => entry[2].toLowerCase() === name);
      return `${count} ${row ? I18N.elementName(row) : name}`;
    });
  }

  function productSummary(product) {
    if (!product) return '';
    const I18N = window.SciLampI18n;
    const name = I18N?.compoundName(product) || product.name || product.formula || '';
    const kind = product.diatomic
      ? tr('Diatomic element', '雙原子元素')
      : I18N?.kindLabel(product.kind) || product.kind || tr('Compound', '化合物');
    const zhText = I18N?.compoundText(product) || {};
    const composition = localizedComposition(product);
    const formation = zhText.formation || product.formation || '';
    const properties = zhText.properties || product.properties || '';
    const why = zhText.why || product.why || '';

    const lines = [`Sci-lab — ${name} (${product.formula})`, `${tr('Type', '類型')}: ${kind}`];
    if (composition) lines.push(`${tr('Composition', '組成')}: ${composition}`);
    if (product.ratio) lines.push(`${tr('Ion ratio', '離子比')}: ${product.ratio[0]}:${product.ratio[1]}`);
    if (product.units > 1) lines.push(`${tr('Formula units', '化學式單位')}: ${product.units}`);
    if (formation) lines.push('', `${tr('How it forms', '如何形成')}: ${formation}`);
    if (properties) lines.push('', `${tr('Properties', '性質')}: ${properties}`);
    if (why) lines.push('', `${tr('Why it holds together', '為何能結合')}: ${why}`);
    lines.push('', tr('Made in the Sci-lab sandbox.', '在 Sci-lab 實驗台製作。'), 'https://iat-l.github.io/Periodic/');
    return lines.join('\n');
  }

  /* ---------- favorite records ---------- */

  function elementRecord(row) {
    if (!row) return null;
    return {
      id: `element:${row[1]}`,
      type: 'element',
      symbol: row[1],
      number: row[0],
      name: row[2],
    };
  }

  function productRecord(product) {
    if (!product) return null;
    return {
      id: `compound:${product.compoundId || product.key}`,
      type: 'compound',
      compoundId: product.compoundId || '',
      key: product.key || '',
      name: product.name || '',
      formula: product.formula || '',
      kind: product.kind || '',
    };
  }

  function catalogRecord(compound) {
    if (!compound) return null;
    return {
      id: `compound:${compound.id}`,
      type: 'compound',
      compoundId: compound.id,
      key: `c:${compound.id}`,
      name: compound.name || '',
      formula: compound.formula || '',
      kind: compound.kind || '',
    };
  }

  function syncFavorite(button, active) {
    if (!button) return;
    button.classList.toggle('is-on', Boolean(active));
    button.setAttribute('aria-pressed', String(Boolean(active)));
    const label = active
      ? tr('Remove from favorites', '從收藏移除')
      : tr('Save to favorites', '收藏');
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
  }

  function toggle(record, { silent = false } = {}) {
    if (!record || !window.SciLampStore) return false;
    const active = SciLampStore.toggleFavorite(record);
    if (!silent) {
      toast(
        active ? tr('Saved to favorites.', '已加入收藏。') : tr('Removed from favorites.', '已從收藏移除。'),
        { tone: 'good' }
      );
    }
    return active;
  }

  function pop(el, className = 'is-pop', ms = 640) {
    if (!el || reduce()) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
    setTimeout(() => el.classList.remove(className), ms);
  }

  return {
    burst,
    burstAt,
    toast,
    copy,
    productSummary,
    elementRecord,
    productRecord,
    catalogRecord,
    syncFavorite,
    toggle,
    pop,
  };
})();

window.SciLampFx = SciLampFx;
