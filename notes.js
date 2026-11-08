/* Notes — a field notebook for the courses. Every note lives in
   SciLampStore (localStorage), can be attached to one course or kept as a
   loose page, and is written and edited on this page. */

(() => {
  const page = document.getElementById('page-notes');
  const list = document.getElementById('notes-list');
  const form = document.getElementById('notes-compose');
  const filterSelect = document.getElementById('notes-filter');
  if (!page || !list || !form || !filterSelect) return;

  const STORE = window.SciLampStore;
  if (!STORE) return;

  const I18N = window.SciLampI18n;
  const t = (en, zh) => I18N?.t(en, zh) ?? en;
  const isZh = () => Boolean(I18N?.isZh);
  const FX = () => window.SciLampFx;
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const titleInput = document.getElementById('note-title');
  const courseSelect = document.getElementById('note-course');
  const bodyInput = document.getElementById('note-body');
  const saveButton = document.getElementById('notes-save');
  const cancelButton = document.getElementById('notes-cancel');
  const composeKicker = document.getElementById('notes-compose-kicker');
  const composeTitle = document.getElementById('notes-compose-title');
  const saveState = document.getElementById('notes-save-state');
  const charCount = document.getElementById('notes-char-count');
  const tally = document.getElementById('notes-tally');
  const libraryCount = document.getElementById('notes-library-count');
  const notesLead = document.getElementById('notes-lead');
  const courseNotesButton = document.getElementById('course-notes');
  const courseNotesCount = document.getElementById('course-notes-count');

  const BODY_MAX = Number(bodyInput.getAttribute('maxlength')) || 6000;
  const TITLE_MAX = Number(titleInput.getAttribute('maxlength')) || 120;

  let editingId = null;
  let filter = 'all';
  let armedDelete = null;
  let armTimer = 0;
  let saveStateTimer = 0;

  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  const catalog = () => {
    try { return window.SciLampCourses?.catalog?.() || []; } catch { return []; }
  };

  const courseTitle = (id) => catalog().find((course) => course.id === id)?.title || '';

  const firstLine = (body) => (
    (body || '').split('\n').map((line) => line.trim()).find(Boolean) || ''
  );

  function noteTitle(note) {
    if (note.title.trim()) return note.title.trim();
    const line = firstLine(note.body);
    if (!line) return t('Untitled note', '無題筆記');
    return line.length > 88 ? `${line.slice(0, 88).trimEnd()}…` : line;
  }

  function dateText(ts) {
    try {
      return new Intl.DateTimeFormat(isZh() ? 'zh-Hant' : 'en', {
        month: 'short', day: 'numeric', year: 'numeric',
      }).format(new Date(ts));
    } catch {
      return '';
    }
  }

  /* ---------- filters ---------- */

  function renderFilters(items) {
    const counts = new Map();
    items.forEach((note) => {
      if (note.courseId) counts.set(note.courseId, (counts.get(note.courseId) || 0) + 1);
    });

    const previous = filter;
    const options = [
      { value: 'all', label: `${t('All notes', '所有筆記')} (${items.length})` },
      { value: 'loose', label: `${t('Loose pages', '自由頁面')} (${items.filter((note) => !note.courseId).length})` },
      ...[...counts.entries()].map(([id, count]) => ({
        value: `course:${id}`,
        label: `${courseTitle(id) || id} (${count})`,
      })),
    ];

    filterSelect.innerHTML = options.map((option) => (
      `<option value="${esc(option.value)}">${esc(option.label)}</option>`
    )).join('');

    const values = options.map((option) => option.value);
    if (!values.includes(previous)) filter = 'all';
    filterSelect.value = filter;
  }

  /* ---------- the library ---------- */

  function visibleNotes(items) {
    if (filter === 'loose') return items.filter((note) => !note.courseId);
    if (filter.startsWith('course:')) return items.filter((note) => note.courseId === filter.slice(7));
    return items;
  }

  function cardMarkup(note, index) {
    const course = note.courseId ? courseTitle(note.courseId) : '';
    const kind = course || t('Loose page', '自由頁面');
    const body = note.body.trim();
    const excerpt = body.length > 300 ? `${body.slice(0, 300).trimEnd()}…` : body;

    return `<article class="note-card${note.courseId ? ' is-course' : ''}" data-note="${esc(note.id)}" style="--ni:${Math.min(index, 12)}">
      <header class="note-card-head">
        <span class="note-card-tag">${esc(kind)}</span>
        <time class="note-card-date" datetime="${new Date(note.updatedAt).toISOString()}">${esc(dateText(note.updatedAt))}</time>
      </header>
      <h4 class="note-card-title">${esc(noteTitle(note))}</h4>
      ${excerpt
        ? `<p class="note-card-body">${esc(excerpt)}</p>`
        : `<p class="note-card-body is-empty">${esc(t('No text yet.', '尚無文字。'))}</p>`}
      <footer class="note-card-foot">
        ${note.courseId
          ? `<button class="note-card-open" type="button" data-note-course="${esc(note.courseId)}">${esc(t('Open course', '開啟課程'))} <span aria-hidden="true">&rarr;</span></button>`
          : `<span class="note-card-kind">${esc(t('Loose page', '自由頁面'))}</span>`}
        <span class="note-card-actions">
          <button class="note-card-edit" type="button" data-note-edit="${esc(note.id)}" aria-label="${esc(t('Edit note', '編輯筆記'))}">${esc(t('Edit', '編輯'))}</button>
          <button class="note-card-delete" type="button" data-note-delete="${esc(note.id)}" aria-label="${esc(t('Delete note', '刪除筆記'))}" title="${esc(t('Delete', '刪除'))}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14" /><path d="M10 7V4.5h4V7" /><path d="M8 7l1 13h6l1-13" /></svg>
          </button>
        </span>
      </footer>
    </article>`;
  }

  function emptyMarkup(total) {
    return `<div class="notes-empty">
      <span class="notes-empty-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48"><path d="M13 6.5h20.5A2.5 2.5 0 0 1 36 9v30a2.5 2.5 0 0 1-2.5 2.5H13A2.5 2.5 0 0 1 10.5 39V9A2.5 2.5 0 0 1 13 6.5z" /><path d="M17 6.5v35" /><path d="M22 15h8M22 21h8M22 27h5" /></svg>
      </span>
      <p class="notes-empty-title">${esc(total ? t('Nothing in this view.', '這個檢視沒有筆記。') : t('The first page is blank.', '第一頁還是空白。'))}</p>
      <p class="notes-empty-text">${esc(total
        ? t('Pick another notebook above, or start a new page.', '切換到其他筆記本，或開始寫一頁。')
        : t('Write a thought, a definition or a question — one pad per course, or a loose page.', '寫下一個想法、定義或問題——每門課一本筆記，或寫在自由頁面。'))}</p>
      <button class="notes-empty-cta" type="button" data-note-new>${esc(t('Write a note', '寫一則筆記'))}</button>
    </div>`;
  }

  function paintTally(items) {
    if (!items.length) {
      tally.textContent = t('No notes yet.', '還沒有筆記。');
      return;
    }
    const courseCount = new Set(items.map((note) => note.courseId).filter(Boolean)).size;
    const loose = items.filter((note) => !note.courseId).length;
    const plural = (count, one, many) => (count === 1 ? one : many);
    const parts = [isZh() ? `${items.length} 則筆記` : `${items.length} ${plural(items.length, 'note', 'notes')}`];
    if (courseCount) parts.push(isZh() ? `${courseCount} 門課程筆記` : `${courseCount} course ${plural(courseCount, 'pad', 'pads')}`);
    if (loose) parts.push(isZh() ? `${loose} 頁自由筆記` : `${loose} loose ${plural(loose, 'page', 'pages')}`);
    tally.textContent = parts.join(' · ');
  }

  function renderNotes() {
    const items = STORE.notes().sort((a, b) => b.updatedAt - a.updatedAt);
    renderFilters(items);
    paintTally(items);

    libraryCount.textContent = isZh()
      ? `${items.length} 則筆記`
      : `${items.length} ${items.length === 1 ? 'note' : 'notes'}`;

    const visible = visibleNotes(items);
    list.innerHTML = visible.length
      ? visible.map((note, index) => cardMarkup(note, index)).join('')
      : emptyMarkup(items.length);
  }

  /* ---------- composer ---------- */

  function paintCharCount() {
    charCount.textContent = `${bodyInput.value.length} / ${BODY_MAX}`;
  }

  function defaultSaveState() {
    setSaveState(t('Saved on this device', '保存在此裝置'));
  }

  function setSaveState(text) {
    saveState.textContent = text;
  }

  function paintPlaceholders() {
    titleInput.placeholder = t('A title for this page', '為這一頁取個標題');
    bodyInput.placeholder = t("Write it while it's fresh…", '趁記憶還新鮮，寫下來⋯');
  }

  function syncCompose() {
    const editing = Boolean(editingId);
    composeKicker.textContent = editing ? t('Editing page', '正在編輯頁面') : t('New page', '新頁面');
    composeTitle.textContent = editing ? t('Edit your note', '編輯你的筆記') : t('Start a note', '開始寫一則筆記');
    saveButton.textContent = editing ? t('Save changes', '儲存變更') : t('Save note', '儲存筆記');
    cancelButton.hidden = !editing;
    paintCharCount();
  }

  function renderCourseOptions(selected = courseSelect.value) {
    const options = [{
      value: '',
      label: t('Loose page', '自由頁面'),
    }, ...catalog().map((course) => ({ value: course.id, label: course.title }))];

    courseSelect.innerHTML = options.map((option) => (
      `<option value="${esc(option.value)}">${esc(option.label)}</option>`
    )).join('');

    if (options.some((option) => option.value === selected)) courseSelect.value = selected;
    else courseSelect.value = '';
  }

  function resetComposer({ courseId = '', focus = false } = {}) {
    editingId = null;
    titleInput.value = '';
    bodyInput.value = '';
    courseSelect.value = courseId;
    syncCompose();
    defaultSaveState();
    if (focus) bodyInput.focus({ preventScroll: true });
  }

  function scrollToForm() {
    form.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  function startForCourse(courseId) {
    if (!courseId) return;
    if (typeof window.showPage === 'function') window.showPage('notes');
    resetComposer({ courseId });
    renderNotes();
    if (STORE.notesFor(courseId).length) {
      filter = `course:${courseId}`;
      renderNotes();
    }
    window.setTimeout(() => {
      scrollToForm();
      bodyInput.focus({ preventScroll: true });
    }, 360);
  }

  function startEdit(id) {
    const note = STORE.notes().find((item) => item.id === id);
    if (!note) return;
    editingId = note.id;
    titleInput.value = note.title;
    bodyInput.value = note.body;
    courseSelect.value = note.courseId || '';
    if (courseSelect.value !== (note.courseId || '')) courseSelect.value = '';
    syncCompose();
    setSaveState(t('Editing — changes save to this device.', '編輯中——變更會保存在此裝置。'));
    scrollToForm();
    titleInput.focus({ preventScroll: true });
  }

  function saveNote() {
    const title = titleInput.value.slice(0, TITLE_MAX);
    const body = bodyInput.value.slice(0, BODY_MAX);
    if (!body.trim() && !title.trim()) {
      FX()?.toast(t('Write something first.', '先寫點東西。'), { tone: 'warn' });
      bodyInput.focus();
      return;
    }

    const payload = { title, body, courseId: courseSelect.value || null };
    const editing = Boolean(editingId);
    const note = editing ? STORE.updateNote(editingId, payload) : STORE.addNote(payload);
    if (!note) return;

    resetComposer({ courseId: payload.courseId || '' });
    setSaveState(t('Note saved.', '筆記已儲存。'));
    clearTimeout(saveStateTimer);
    saveStateTimer = setTimeout(defaultSaveState, 2400);
    if (FX()) {
      FX().toast(editing ? t('Note updated.', '筆記已更新。') : t('Note saved.', '筆記已儲存。'));
      FX().pop(form);
    }
  }

  function armDelete(button, id) {
    if (armedDelete === id) {
      clearTimeout(armTimer);
      armedDelete = null;
      STORE.removeNote(id);
      FX()?.toast(t('Note deleted.', '筆記已刪除。'));
      return;
    }

    armedDelete = id;
    button.classList.add('is-armed');
    button.setAttribute('aria-label', t('Press again to delete', '再按一次刪除'));
    button.title = t('Press again to delete', '再按一次刪除');
    FX()?.toast(t('Press the bin again to delete this note.', '再按一次垃圾桶即可刪除筆記。'), { tone: 'warn' });
    clearTimeout(armTimer);
    armTimer = setTimeout(() => {
      armedDelete = null;
      renderNotes();
    }, 3400);
  }

  function openCourse(id) {
    if (!id) return;
    window.SciLampCourses?.open?.(id);
    if (typeof window.showPage === 'function') window.showPage('courses');
  }

  /* ---------- course reader badge ---------- */

  function updateCourseBadge() {
    if (!courseNotesButton) return;
    const id = (typeof window.SciLampCourses?.current === 'function' && window.SciLampCourses.current()) || '';
    const count = id ? STORE.notesFor(id).length : 0;
    if (courseNotesCount) {
      courseNotesCount.textContent = String(count);
      courseNotesCount.hidden = count === 0;
    }
    const course = id ? courseTitle(id) : '';
    const label = course
      ? t(`Notes for ${course}`, `${course}的筆記`)
      : t('Course notes', '課程筆記');
    courseNotesButton.setAttribute('aria-label', label);
    courseNotesButton.setAttribute('title', label);
  }

  /* ---------- wiring ---------- */

  notesLead.innerHTML = t('Write in the <em>margins.</em>', '寫在<em>頁邊</em>。');

  renderCourseOptions();
  paintPlaceholders();
  syncCompose();
  renderNotes();
  updateCourseBadge();

  saveButton.addEventListener('click', saveNote);

  cancelButton.addEventListener('click', () => {
    resetComposer({ courseId: courseSelect.value });
  });

  bodyInput.addEventListener('input', paintCharCount);

  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      saveNote();
    }
  });

  filterSelect.addEventListener('change', () => {
    filter = filterSelect.value;
    renderNotes();
  });

  list.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-note-edit]');
    if (edit) {
      startEdit(edit.dataset.noteEdit);
      return;
    }

    const remove = event.target.closest('[data-note-delete]');
    if (remove) {
      armDelete(remove, remove.dataset.noteDelete);
      return;
    }

    const course = event.target.closest('[data-note-course]');
    if (course) {
      openCourse(course.dataset.noteCourse);
      return;
    }

    if (event.target.closest('[data-note-new]')) {
      const courseId = filter.startsWith('course:') ? filter.slice(7) : '';
      resetComposer({ courseId, focus: true });
      scrollToForm();
    }
  });

  courseNotesButton?.addEventListener('click', () => {
    const id = typeof window.SciLampCourses?.current === 'function' ? window.SciLampCourses.current() : '';
    startForCourse(id);
  });

  document.addEventListener('scilamp:notes', () => {
    renderNotes();
    updateCourseBadge();
  });

  document.addEventListener('scilamp:reader', updateCourseBadge);

  document.addEventListener('scilamp:lang', () => {
    notesLead.innerHTML = t('Write in the <em>margins.</em>', '寫在<em>頁邊</em>。');
    renderCourseOptions();
    paintPlaceholders();
    renderNotes();
    syncCompose();
    defaultSaveState();
    updateCourseBadge();
  });
})();
