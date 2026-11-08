/* Profile — a quiet record of what this browser has earned: a daily streak,
   milestones and every starred element or compound. Everything is derived from
   SciLampStore and the courses record, so the page stays true without a reload. */

(() => {
  const page = document.getElementById('page-profile');
  const badgesEl = document.getElementById('profile-badges');
  const favoritesEl = document.getElementById('favorites-list');
  if (!page || !badgesEl || !favoritesEl) return;

  const STORE = window.SciLampStore;
  if (!STORE) return;

  const I18N = window.SciLampI18n;
  const t = (en, zh) => I18N?.t(en, zh) ?? en;
  const isZh = () => Boolean(I18N?.isZh);
  const FX = () => window.SciLampFx;

  const streakCount = document.getElementById('profile-streak-count');
  const streakLabel = document.getElementById('profile-streak-label');
  const streakBest = document.getElementById('profile-streak-best');
  const streakWeek = document.getElementById('profile-week');
  const statDiscoveries = document.getElementById('profile-stat-discoveries');
  const statProducts = document.getElementById('profile-stat-products');
  const statQuiz = document.getElementById('profile-stat-quiz');
  const statFavorites = document.getElementById('profile-stat-favorites');
  const badgeCount = document.getElementById('profile-badge-count');
  const favCount = document.getElementById('profile-fav-count');
  const headNote = document.getElementById('profile-head-note');

  const courseStreak = document.getElementById('courses-streak');
  const courseStreakCount = document.getElementById('courses-streak-count');
  const courseStreakNote = document.getElementById('courses-streak-note');
  const courseStreakDots = document.getElementById('courses-streak-dots');

  const STAR = 'M12 3.6l2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.61 6.9 19.3l.98-5.68L3.75 9.6l5.7-.83z';

  const ICONS = {
    flask: '<path d="M9 3.5h6"/><path d="M10 3.5v5l-4.7 7.6A2.4 2.4 0 0 0 7.4 20h9.2a2.4 2.4 0 0 0 2.1-3.9L14 8.5v-5"/><path d="M7.6 14.5h8.8"/>',
    layers: '<path d="M12 3.8l8 4.1-8 4.1-8-4.1z"/><path d="M4.5 11.6l7.5 3.8 7.5-3.8"/><path d="M4.5 15.4l7.5 3.8 7.5-3.8"/>',
    star: `<path d="${STAR}"/>`,
    flame: '<path d="M12 3.5c2.3 3.1 5.1 4.5 5.1 8.1a5.1 5.1 0 0 1-10.2 0c0-1.7.7-2.9 1.8-4.1.2 1.4.8 2.2 1.7 2.6.5-2.4.7-4.3 1.6-6.6z"/>',
    book: '<path d="M12 6.5C10.4 5.1 8.2 4.5 5 4.5v13c3.2 0 5.4.6 7 2 1.6-1.4 3.8-2 7-2v-13c-3.2 0-5.4.6-7 2z"/><path d="M12 6.5v13"/>',
    check: '<circle cx="12" cy="12" r="8.6"/><path d="M8.5 12.2l2.5 2.5 4.6-5.2"/>',
  };

  const ACHIEVEMENTS = [
    {
      id: 'first-compound',
      en: 'First compound',
      zh: '第一個化合物',
      descEn: 'Discover one compound on the sandbox bench.',
      descZh: '在實驗台發現一個化合物。',
      icon: ICONS.flask,
      test: (s) => s.discoveries >= 1,
    },
    {
      id: 'ten-compounds',
      en: 'Ten compounds',
      zh: '十個化合物',
      descEn: 'Discover ten catalogued compounds.',
      descZh: '發現十個目錄中的化合物。',
      icon: ICONS.layers,
      test: (s) => s.discoveries >= 10,
    },
    {
      id: 'first-favorite',
      en: 'First favorite',
      zh: '第一個收藏',
      descEn: 'Star an element or a compound.',
      descZh: '收藏一個元素或化合物。',
      icon: ICONS.star,
      test: (s) => s.favorites >= 1,
    },
    {
      id: 'three-day-streak',
      en: 'Three days running',
      zh: '連續三天',
      descEn: 'Open Sci-lab three days in a row.',
      descZh: '連續三天打開 Sci-lab。',
      icon: ICONS.flame,
      test: (s) => s.streak >= 3 || s.best >= 3,
    },
    {
      id: 'three-courses',
      en: 'Three courses',
      zh: '三門課程',
      descEn: 'Complete every section of three courses.',
      descZh: '完成三門課程的每一個小節。',
      icon: ICONS.book,
      test: (s) => s.completedCourses >= 3,
    },
    {
      id: 'twenty-five-checks',
      en: 'Twenty-five checks',
      zh: '二十五道測驗',
      descEn: 'Answer twenty-five multiple-choice checks correctly.',
      descZh: '答對二十五道選擇題。',
      icon: ICONS.check,
      test: (s) => s.quiz >= 25,
    },
  ];

  const esc = (value) => String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let primed = false;

  /* ---------- reading the rest of the site ---------- */

  function courseRecord() {
    try {
      const data = JSON.parse(localStorage.getItem('scilamp.courses.v1') || '{}');
      return data && data.courses && typeof data.courses === 'object' ? data.courses : {};
    } catch {
      return {};
    }
  }

  function quizCorrect() {
    return Object.values(courseRecord()).reduce((sum, course) => {
      const mcq = course && typeof course === 'object' && course.mcq && typeof course.mcq === 'object' ? course.mcq : {};
      return sum + Object.keys(mcq).length;
    }, 0);
  }

  function readStats() {
    const streak = STORE.streakInfo();
    return {
      discoveries: STORE.discoveries().length,
      products: STORE.products().length,
      favorites: STORE.favorites().length,
      quiz: quizCorrect(),
      completedCourses: document.querySelectorAll('#page-courses .course-card.is-complete').length,
      streak: streak.current,
      best: streak.best,
      days: streak.days,
    };
  }

  /* ---------- streak ---------- */

  const dayKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  function weekMarkup(days) {
    const seen = new Set(days);
    const today = new Date();
    const cells = [];
    for (let back = 6; back >= 0; back -= 1) {
      const date = new Date(today);
      date.setDate(date.getDate() - back);
      const on = seen.has(dayKey(date));
      cells.push(`<span class="${on ? 'is-on' : ''}${back === 0 ? ' is-today' : ''}"></span>`);
    }
    return cells.join('');
  }

  const daysWord = (count) => (isZh() ? `${count} 天` : `${count} day${count === 1 ? '' : 's'}`);

  function paintStreak(stats) {
    if (streakCount) streakCount.textContent = String(stats.streak);
    if (streakLabel) {
      streakLabel.textContent = isZh()
        ? '連續天數'
        : `${stats.streak === 1 ? 'day' : 'days'} streak`;
    }
    if (streakBest) {
      streakBest.textContent = isZh() ? `最佳：${daysWord(stats.best)}` : `Best: ${daysWord(stats.best)}`;
    }
    if (streakWeek) streakWeek.innerHTML = weekMarkup(stats.days);
  }

  function paintCourseStreak(stats) {
    if (!courseStreak) return;
    if (courseStreakCount) courseStreakCount.textContent = daysWord(stats.streak);
    if (courseStreakNote) {
      courseStreakNote.textContent = stats.best > stats.streak
        ? t(`Daily streak · best ${daysWord(stats.best)}`, `每日連續 · 最佳 ${daysWord(stats.best)}`)
        : t('Daily streak', '每日連續');
    }
    if (courseStreakDots) courseStreakDots.innerHTML = weekMarkup(stats.days);
    courseStreak.setAttribute('title', isZh()
      ? `連續 ${stats.streak} 天，最佳 ${stats.best} 天`
      : `${stats.streak}-day streak, best ${stats.best} days`);
  }

  /* ---------- stats ---------- */

  function paintStats(stats) {
    if (statDiscoveries) statDiscoveries.textContent = String(stats.discoveries);
    if (statProducts) statProducts.textContent = String(stats.products);
    if (statQuiz) statQuiz.textContent = String(stats.quiz);
    if (statFavorites) statFavorites.textContent = String(stats.favorites);
    if (headNote) headNote.textContent = t('Saved on this device', '保存在此裝置');
  }

  /* ---------- achievements ---------- */

  function paintBadges(unlocked, fresh) {
    const total = ACHIEVEMENTS.length;
    if (badgeCount) {
      badgeCount.textContent = isZh() ? `${unlocked.size} / ${total}` : `${unlocked.size} of ${total}`;
    }
    badgesEl.innerHTML = ACHIEVEMENTS.map((a) => {
      const on = unlocked.has(a.id);
      const title = isZh() ? a.zh : a.en;
      const desc = isZh() ? a.descZh : a.descEn;
      return `<article class="profile-badge${on ? '' : ' is-locked'}${fresh.includes(a.id) ? ' is-fresh' : ''}" data-badge="${a.id}">
        <span class="profile-badge-mark" aria-hidden="true"><svg viewBox="0 0 24 24">${a.icon}</svg></span>
        <span class="profile-badge-copy"><strong>${esc(title)}</strong><small>${esc(desc)}</small></span>
      </article>`;
    }).join('');
  }

  function celebrate(fresh) {
    if (!FX()) return;
    fresh.forEach((id, index) => {
      const a = ACHIEVEMENTS.find((item) => item.id === id);
      if (!a) return;
      setTimeout(() => {
        FX().toast(isZh() ? `成就解鎖——${a.zh}` : `Achievement unlocked — ${a.en}`);
        if (!page.classList.contains('is-open')) return;
        const badge = badgesEl.querySelector(`[data-badge="${id}"]`);
        if (badge) FX().burstAt(badge, { count: 22 });
      }, index * 520);
    });
  }

  /* ---------- favorites ---------- */

  function elementNameOf(item) {
    const sym = item.symbol || String(item.id || '').split(':')[1];
    return I18N?.elementName(sym) || item.name || sym;
  }

  function compoundNameOf(item) {
    return I18N?.compoundName({ compoundId: item.compoundId, name: item.name }) || item.name || item.formula || '';
  }

  function productFor(item) {
    if (item.compoundId && window.COMPOUND_BY_ID) {
      const c = COMPOUND_BY_ID.get(item.compoundId);
      if (c && window.SB) {
        const atoms = c.atoms || Object.fromEntries((c.metals || []).map((sym) => [sym, 1]));
        const result = SB.resolve(atoms, c.kind === 'alloy' ? 'alloy' : 'auto');
        if (result.ok) return result.product;
      }
    }
    return STORE.products().find((p) => (
      (item.key && p.key === item.key) || (item.compoundId && p.compoundId === item.compoundId)
    )) || null;
  }

  function paintFavorites() {
    const items = STORE.favorites();
    if (favCount) {
      favCount.textContent = isZh() ? `${items.length} 個收藏` : `${items.length} starred`;
    }

    if (!items.length) {
      favoritesEl.innerHTML = `<div class="fav-empty">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR}"/></svg>
        <p>${esc(t(
          'Nothing starred yet. Open an element or a compound card and press the star to keep it here.',
          '還沒有收藏。打開元素或化合物卡片，按下星星就能保存在這裡。'
        ))}</p>
      </div>`;
      return;
    }

    favoritesEl.innerHTML = items.map((item, index) => {
      const element = item.type === 'element';
      const title = element ? elementNameOf(item) : compoundNameOf(item);
      const mark = element ? (item.symbol || '·') : (item.formula || '·');
      const subtitle = element
        ? (item.number ? t(`Element ${item.number}`, `元素 ${item.number}`) : t('Element', '元素'))
        : `${item.formula ? `${item.formula} · ` : ''}${I18N?.kindLabel(item.kind) || t('Compound', '化合物')}`;
      const openLabel = isZh() ? `打開${title}` : `Open ${title}`;
      const removeLabel = isZh() ? `從收藏移除${title}` : `Remove ${title} from favorites`;
      return `<article class="fav-card" data-type="${element ? 'element' : 'compound'}" style="--fi:${Math.min(index, 12)}">
        <button class="fav-open" type="button" data-fav-open="${esc(item.id)}" aria-label="${esc(openLabel)}">
          <span class="fav-mark${String(mark).length > 4 ? ' is-long' : ''}" aria-hidden="true">${esc(mark)}</span>
          <span class="fav-copy"><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></span>
        </button>
        <button class="fav-remove" type="button" data-fav-remove="${esc(item.id)}" aria-label="${esc(removeLabel)}" title="${esc(removeLabel)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR}"/></svg>
        </button>
      </article>`;
    }).join('');
  }

  function openFavorite(id, trigger) {
    const item = STORE.favorites().find((entry) => entry.id === id);
    if (!item) return;
    if (item.type === 'element') {
      const sym = item.symbol || String(item.id).split(':')[1];
      if (window.SciLampSheet?.openElementSheet) {
        SciLampSheet.openElementSheet(sym, { trigger });
      }
      return;
    }
    const product = productFor(item);
    if (product && window.SciLampSheet) {
      SciLampSheet.openProduct(product, { mode: 'detail', trigger });
      return;
    }
    FX()?.toast(t('This compound is no longer saved on this device.', '這個化合物已不在本機保存。'), { tone: 'warn' });
  }

  favoritesEl.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-fav-remove]');
    if (remove) {
      const item = STORE.favorites().find((entry) => entry.id === remove.dataset.favRemove);
      if (item) FX()?.toggle(item);
      return;
    }
    const open = event.target.closest('[data-fav-open]');
    if (open) openFavorite(open.dataset.favOpen, open);
  });

  /* ---------- refresh ---------- */

  function refresh({ announce = primed } = {}) {
    const stats = readStats();
    const unlocked = new Set(STORE.achievements().map((item) => item.id));
    const fresh = [];

    ACHIEVEMENTS.forEach((a) => {
      if (!a.test(stats) || unlocked.has(a.id)) return;
      if (STORE.unlockAchievement(a.id)) {
        unlocked.add(a.id);
        fresh.push(a.id);
      }
    });

    paintStreak(stats);
    paintCourseStreak(stats);
    paintStats(stats);
    paintFavorites();
    paintBadges(unlocked, fresh);

    if (fresh.length && announce) celebrate(fresh);
    primed = true;
  }

  document.addEventListener('scilamp:favorites', () => refresh());
  document.addEventListener('scilamp:discoveries', () => refresh());
  document.addEventListener('scilamp:products', () => refresh());
  document.addEventListener('scilamp:activity', () => refresh());
  document.addEventListener('scilamp:courses', () => window.setTimeout(() => refresh(), 0));
  document.addEventListener('scilamp:achievements', (event) => {
    if (event.detail?.external) refresh();
  });
  document.addEventListener('scilamp:lang', () => refresh({ announce: false }));

  refresh({ announce: false });
})();
