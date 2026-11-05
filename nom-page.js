/* Nomenclature & Formula Writing — page controller.
   Views: entry -> docs | paths -> runner.
   Content comes from learn-data.js (NOM_DOCS, NOM_PATHS, CHEM); this file only
   builds UI and keeps per-path progress in localStorage. */

(() => {
  const page = document.getElementById('page-nom');
  const app = document.getElementById('nom-app');
  if (!page || !app) return;

  const STORE_KEY = 'scilamp.nom.v1';

  const views = {
    entry: document.getElementById('nom-entry'),
    docs: document.getElementById('nom-docs'),
    paths: document.getElementById('nom-paths'),
    runner: document.getElementById('nom-runner'),
  };

  const docsSearch = document.getElementById('docs-search');
  const docsNav = document.getElementById('docs-nav');
  const docsList = document.getElementById('docs-list');
  const docsStatus = document.getElementById('docs-status');
  const pathsGrid = document.getElementById('paths-grid');
  const resumeBtn = document.getElementById('nom-resume');
  const runnerTitle = document.getElementById('runner-title');
  const runnerMeta = document.getElementById('runner-meta');
  const runnerDots = document.getElementById('runner-dots');
  const runnerProgress = document.getElementById('runner-progress');
  const runnerStage = document.getElementById('runner-stage');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- persistence ---------- */

  function blank() {
    return { paths: {}, last: null };
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return blank();
      const data = JSON.parse(raw);
      const out = blank();
      if (data && data.paths && typeof data.paths === 'object') {
        Object.keys(data.paths).forEach((id) => {
          const rec = data.paths[id];
          if (!rec || typeof rec !== 'object') return;
          const total = (NOM_PATHS.find((p) => p.id === id) || { steps: [] }).steps.length;
          if (!total) return;
          const step = Math.min(total, Math.max(0, Math.round(Number(rec.step) || 0)));
          const best = Math.min(total, Math.max(0, Math.round(Number(rec.best) || 0)));
          out.paths[id] = { step, best, complete: rec.complete === true };
        });
      }
      if (data && data.last && NOM_PATHS.some((p) => p.id === data.last.id)) {
        out.last = { id: data.last.id };
      }
      return out;
    } catch {
      return blank();
    }
  }

  const store = loadStore();

  function saveStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
      /* private mode or a full quota: progress simply lasts for this visit */
    }
  }

  function pathState(id) {
    if (!store.paths[id]) store.paths[id] = { step: 0, best: 0, complete: false };
    return store.paths[id];
  }

  /* ---------- view switching ---------- */

  let currentView = 'entry';

  function showView(name) {
    currentView = name;
    Object.keys(views).forEach((key) => {
      const view = views[key];
      if (!view) return;
      const on = key === name;
      view.hidden = !on;
      view.classList.toggle('is-on', on);
    });
    app.scrollTop = 0;
    const view = views[name];
    if (view) view.focus({ preventScroll: true });
  }

  /* ---------- entry ---------- */

  function paintEntry() {
    const docCount = document.getElementById('nom-stat-docs');
    const pathCount = document.getElementById('nom-stat-paths');
    if (docCount) docCount.textContent = `${NOM_DOCS.length} handbook sections`;
    if (pathCount) pathCount.textContent = `${NOM_PATHS.length} guided paths`;
    if (!resumeBtn) return;

    const last = store.last && NOM_PATHS.find((p) => p.id === store.last.id);
    const lastState = last ? store.paths[last.id] : null;
    if (last && lastState && !lastState.complete && lastState.step > 0) {
      resumeBtn.hidden = false;
      resumeBtn.textContent = `Resume ${last.title} — step ${lastState.step + 1} of ${last.steps.length}`;
      resumeBtn.dataset.path = last.id;
    } else {
      resumeBtn.hidden = true;
      resumeBtn.removeAttribute('data-path');
    }
  }

  /* ---------- docs ---------- */

  function renderDocs() {
    docsList.innerHTML = NOM_DOCS.map((doc) => {
      const rules = doc.rules.map((rule) => `<li>${rule}</li>`).join('');
      const examples = doc.examples.map((ex) => `
        <div class="doc-ex">
          <span class="doc-ex-left">${ex.left}</span>
          <span class="doc-ex-arrow" aria-hidden="true">&rarr;</span>
          <span class="doc-ex-right">${ex.right}</span>
          ${ex.note ? `<span class="doc-ex-note">${ex.note}</span>` : ''}
        </div>`).join('');
      return `
        <section class="doc-sec" id="doc-${doc.id}" aria-labelledby="doc-h-${doc.id}">
          <h3 id="doc-h-${doc.id}">${doc.title}</h3>
          <ul class="doc-rules">${rules}</ul>
          <div class="doc-examples">${examples}</div>
        </section>`;
    }).join('');

    docsNav.innerHTML = NOM_DOCS.map((doc, i) => `
      <button class="docs-chip" type="button" data-doc="${doc.id}" aria-pressed="false">
        <span class="docs-chip-num">${String(i + 1).padStart(2, '0')}</span>${doc.title}
      </button>`).join('');

    docsNav.querySelectorAll('.docs-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (docsSearch.value) {
          docsSearch.value = '';
          filterDocs('');
        }
        const section = document.getElementById(`doc-${chip.dataset.doc}`);
        if (!section) return;
        section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        docsNav.querySelectorAll('.docs-chip').forEach((c) => {
          const on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', String(on));
        });
      });
    });

    filterDocs('');
  }

  function filterDocs(query) {
    const q = query.trim().toLowerCase();
    let matches = 0;
    docsList.querySelectorAll('.doc-sec').forEach((section) => {
      const text = section.textContent.toLowerCase();
      const hit = !q || text.includes(q);
      section.hidden = !hit;
      if (hit) matches += 1;
    });

    if (!q) {
      docsStatus.textContent = `${NOM_DOCS.length} sections — type to filter, or jump with the list above.`;
    } else if (matches) {
      docsStatus.textContent = `${matches} section${matches === 1 ? '' : 's'} match “${query.trim()}”.`;
    } else {
      docsStatus.textContent = `No sections match “${query.trim()}”. Try “ion”, “acid” or “prefix”.`;
    }

    if (q) {
      docsNav.querySelectorAll('.docs-chip').forEach((c) => {
        c.classList.remove('is-on');
        c.setAttribute('aria-pressed', 'false');
      });
    }
  }

  /* ---------- paths ---------- */

  function renderPaths() {
    pathsGrid.innerHTML = NOM_PATHS.map((path, i) => {
      const state = store.paths[path.id] || { step: 0, best: 0, complete: false };
      const total = path.steps.length;
      const filled = state.complete ? total : state.step;
      const dots = Array.from({ length: total }, (_, d) =>
        `<span class="path-dot${d < filled ? ' is-filled' : ''}"></span>`).join('');
      let status;
      if (state.complete) {
        status = state.best ? `complete · best ${state.best}/${total} first try` : 'complete — replay any time';
      } else if (state.step > 0) {
        status = `in progress · step ${state.step + 1} of ${total}`;
      } else {
        status = 'not started';
      }
      return `
        <button class="path-card${state.complete ? ' is-complete' : ''}" type="button" data-path="${path.id}">
          <span class="path-top">
            <span class="path-index">path ${String(i + 1).padStart(2, '0')}</span>
            <span class="path-dots" aria-hidden="true">${dots}</span>
          </span>
          <span class="path-title">${path.title}</span>
          <span class="path-blurb">${path.blurb}</span>
          <span class="path-status">${status}</span>
        </button>`;
    }).join('');

    pathsGrid.querySelectorAll('.path-card').forEach((card) => {
      card.addEventListener('click', () => startPath(card.dataset.path));
    });
  }

  /* ---------- runner ---------- */

  let session = null;

  function startPath(id) {
    const path = NOM_PATHS.find((p) => p.id === id);
    if (!path) return;
    const state = pathState(id);
    const resume = !state.complete && state.step > 0 && state.step < path.steps.length;
    session = {
      path,
      idx: resume ? state.step : 0,
      startIdx: resume ? state.step : 0,
      firstTry: [],
      missedThisStep: false,
    };
    store.last = { id };
    saveStore();
    renderRunner();
    if (currentView !== 'runner') showView('runner');
  }

  function advance() {
    if (!session) return;
    const { path } = session;
    session.firstTry.push(!session.missedThisStep);
    session.missedThisStep = false;
    session.idx += 1;

    const state = pathState(path.id);
    state.step = Math.min(session.idx, path.steps.length);
    if (session.idx >= path.steps.length) {
      state.complete = true;
      const score = session.firstTry.filter(Boolean).length;
      if (session.startIdx === 0) state.best = Math.max(state.best || 0, score);
    }
    saveStore();
    renderRunner();
  }

  function renderRunner() {
    const { path, idx } = session;
    const total = path.steps.length;
    runnerTitle.textContent = path.title;
    runnerMeta.textContent = idx < total ? `step ${idx + 1} of ${total}` : 'complete';
    runnerDots.innerHTML = Array.from({ length: total }, (_, d) =>
      `<span class="runner-dot${d < idx ? ' is-done' : d === idx ? ' is-now' : ''}"></span>`).join('');
    runnerProgress.textContent = idx < total
      ? `Step ${idx + 1} of ${total}: ${path.steps[idx].type === 'mcq' ? 'multiple choice' : path.steps[idx].type}.`
      : 'Path complete.';

    runnerStage.innerHTML = '';
    if (idx >= total) {
      renderSummary();
      return;
    }
    const step = path.steps[idx];
    const card = document.createElement('article');
    card.className = 'step';
    card.innerHTML = `<span class="step-kind">${stepLabel(step.type)}</span>
      <h4 class="step-prompt" tabindex="-1">${step.prompt}</h4>`;

    const body = document.createElement('div');
    body.className = 'step-body';
    card.appendChild(body);

    const feedbackBox = document.createElement('div');
    feedbackBox.className = 'step-feedback';
    feedbackBox.setAttribute('role', 'status');
    feedbackBox.setAttribute('aria-live', 'polite');

    const actions = document.createElement('div');
    actions.className = 'step-actions';

    const nextBtn = button('nom-btn primary step-next', 'next step');
    nextBtn.hidden = true;
    nextBtn.addEventListener('click', advance);
    if (idx === total - 1) nextBtn.textContent = 'finish path';
    actions.appendChild(nextBtn);

    card.append(feedbackBox, actions);
    runnerStage.appendChild(card);

    if (step.type === 'mcq') buildMcq(step, body, feedbackBox, actions, nextBtn);
    else if (step.type === 'formula' || step.type === 'name') buildTokens(step, body, feedbackBox, actions, nextBtn);
    else if (step.type === 'balance') buildBalance(step, body, feedbackBox, actions, nextBtn);

    card.querySelector('.step-prompt').focus({ preventScroll: true });
  }

  function stepLabel(type) {
    if (type === 'mcq') return 'multiple choice';
    if (type === 'formula') return 'build the formula';
    if (type === 'name') return 'build the name';
    return 'balance the charges';
  }

  function button(cls, label) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = label;
    return b;
  }

  function say(box, kind, title, text) {
    box.className = `step-feedback is-${kind}`;
    box.innerHTML = `<span class="fb-title">${title}</span><span class="fb-text">${text}</span>`;
  }

  function clearSay(box) {
    box.className = 'step-feedback';
    box.innerHTML = '';
  }

  function solved(step, feedbackBox, actions, nextBtn) {
    say(feedbackBox, 'good', 'Correct', step.explain);
    const card = actions.closest('.step');
    if (card) {
      card.querySelectorAll('.mcq-opt, .piece, .coef-btn, .build-undo, .build-clear, .build-check').forEach((b) => {
        b.disabled = true;
      });
    }
    nextBtn.hidden = false;
    nextBtn.focus({ preventScroll: true });
  }

  function buildMcq(step, body, feedbackBox, actions, nextBtn) {
    const group = document.createElement('div');
    group.className = 'mcq-options';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'answer choices');

    step.options.forEach((option, i) => {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'mcq-opt';
      opt.innerHTML = `<span class="mcq-key" aria-hidden="true">${String.fromCharCode(65 + i)}</span><span class="mcq-text">${option}</span>`;
      opt.addEventListener('click', () => {
        if (opt.disabled || opt.classList.contains('is-right')) return;
        if (i === step.answer) {
          opt.classList.add('is-right');
          solved(step, feedbackBox, actions, nextBtn);
        } else {
          session.missedThisStep = true;
          opt.classList.add('is-wrong');
          opt.disabled = true;
          say(feedbackBox, 'bad', 'Not quite', step.explain);
        }
      });
      group.appendChild(opt);
    });

    body.appendChild(group);
  }

  function buildTokens(step, body, feedbackBox, actions, nextBtn) {
    const isFormula = step.type === 'formula';
    const expectedLength = step.expected.length;
    let tokens = [];

    const preview = document.createElement('div');
    preview.className = 'build-preview';
    preview.setAttribute('aria-live', 'polite');
    const pieces = document.createElement('div');
    pieces.className = 'build-pieces';
    pieces.setAttribute('role', 'group');
    pieces.setAttribute('aria-label', isFormula ? 'formula pieces' : 'name pieces');

    const undo = button('nom-btn ghost build-undo', 'undo');
    const clear = button('nom-btn ghost build-clear', 'clear');
    const check = button('nom-btn primary build-check', 'check');

    const paint = () => {
      preview.innerHTML = tokens.length
        ? tokens.map((t) => `<span class="build-token">${isFormula ? CHEM.withDigits(t) : t}</span>`).join('')
        : '<span class="build-empty">tap the pieces below to build your answer</span>';
      undo.disabled = tokens.length === 0;
      clear.disabled = tokens.length === 0;
      check.disabled = tokens.length === 0;
      pieces.querySelectorAll('.piece').forEach((p) => {
        p.disabled = tokens.length >= expectedLength;
      });
    };

    step.pieces.forEach((raw) => {
      const piece = document.createElement('button');
      piece.type = 'button';
      piece.className = 'piece';
      piece.dataset.token = raw;
      piece.innerHTML = isFormula ? CHEM.withDigits(raw) : raw;
      piece.addEventListener('click', () => {
        if (tokens.length >= expectedLength) return;
        tokens.push(raw);
        clearSay(feedbackBox);
        paint();
      });
      pieces.appendChild(piece);
    });

    undo.addEventListener('click', () => {
      tokens.pop();
      clearSay(feedbackBox);
      paint();
    });
    clear.addEventListener('click', () => {
      tokens = [];
      clearSay(feedbackBox);
      paint();
    });
    check.addEventListener('click', () => {
      if (!tokens.length) return;
      const correct = tokens.length === expectedLength && tokens.join('|') === step.expected.join('|');
      if (correct) {
        solved(step, feedbackBox, actions, nextBtn);
      } else {
        session.missedThisStep = true;
        say(feedbackBox, 'bad', 'Not quite', step.explain);
      }
    });

    body.append(preview, pieces);
    actions.prepend(clear, undo, check);
    paint();
  }

  function buildBalance(step, body, feedbackBox, actions, nextBtn) {
    let a = 1;
    let b = 1;

    const wrap = document.createElement('div');
    wrap.className = 'balance';

    const equation = document.createElement('div');
    equation.className = 'balance-eq';

    const totalLine = document.createElement('p');
    totalLine.className = 'balance-total';

    const preview = document.createElement('p');
    preview.className = 'balance-preview';

    function stepper(label, get, set, who) {
      const row = document.createElement('div');
      row.className = 'balance-ion';
      const ion = document.createElement('span');
      ion.className = 'ion-chip';
      ion.textContent = label;

      const controls = document.createElement('div');
      controls.className = 'coef';
      const minus = button('coef-btn', '−');
      const value = document.createElement('output');
      value.className = 'coef-val';
      value.setAttribute('aria-live', 'polite');
      const plus = button('coef-btn', '+');
      minus.setAttribute('aria-label', `decrease ${who} coefficient`);
      plus.setAttribute('aria-label', `increase ${who} coefficient`);

      minus.addEventListener('click', () => {
        set(Math.max(1, get() - 1));
        clearSay(feedbackBox);
        paint();
      });
      plus.addEventListener('click', () => {
        set(Math.min(6, get() + 1));
        clearSay(feedbackBox);
        paint();
      });

      controls.append(minus, value, plus);
      row.append(ion, controls);
      return row;
    }

    const catLabel = CHEM.chargeSym(step.cation.sym, step.cation.charge);
    const anLabel = CHEM.chargeSym(step.anion.sym, step.anion.charge);

    const catRow = stepper(catLabel, () => a, (v) => { a = v; }, 'cation');
    const anRow = stepper(anLabel, () => b, (v) => { b = v; }, 'anion');

    equation.append(catRow, anRow);

    function paint() {
      equation.querySelectorAll('.coef-val')[0].textContent = String(a);
      equation.querySelectorAll('.coef-val')[1].textContent = String(b);
      equation.querySelectorAll('.coef-btn')[0].disabled = a <= 1;
      equation.querySelectorAll('.coef-btn')[1].disabled = a >= 6;
      equation.querySelectorAll('.coef-btn')[2].disabled = b <= 1;
      equation.querySelectorAll('.coef-btn')[3].disabled = b >= 6;

      const total = a * step.cation.charge + b * step.anion.charge;
      const signed = (v) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0');
      totalLine.textContent = `${a}×(${signed(step.cation.charge)}) + ${b}×(${signed(step.anion.charge)}) = ${signed(total)}`;
      totalLine.classList.toggle('is-zero', total === 0);

      const tokens = Array.from({ length: a }, () => step.cation.sym)
        .concat(Array.from({ length: b }, () => step.anion.sym));
      preview.innerHTML = `formula: <strong>${CHEM.tokensToFormula(tokens)}</strong>`;
    }

    const check = button('nom-btn primary build-check', 'check');
    check.addEventListener('click', () => {
      const total = a * step.cation.charge + b * step.anion.charge;
      if (total !== 0) {
        session.missedThisStep = true;
        say(feedbackBox, 'bad', 'Not neutral yet', `The charges total ${total > 0 ? '+' : '−'}${Math.abs(total)}. Adjust the coefficients until they cancel. ${step.explain}`);
        return;
      }
      if (a !== step.answer.a || b !== step.answer.b) {
        session.missedThisStep = true;
        say(feedbackBox, 'bad', 'Balanced, but not smallest', `Those charges do cancel, but the coefficients must be the simplest whole-number ratio. ${step.explain}`);
        return;
      }
      solved(step, feedbackBox, actions, nextBtn);
    });

    wrap.append(equation, totalLine, preview);
    body.append(wrap);
    actions.prepend(check);
    paint();
  }

  function renderSummary() {
    const { path, firstTry } = session;
    const total = path.steps.length;
    const score = firstTry.filter(Boolean).length;
    const state = pathState(path.id);

    const done = document.createElement('article');
    done.className = 'runner-done';
    const scoreLine = session.startIdx > 0
      ? `${score} of ${firstTry.length} steps this run answered first try${state.best ? ` · best ${state.best}/${total}` : ''}`
      : `${score} of ${total} answered first try${state.best > score ? ` · best ${state.best}/${total}` : ''}`;
    done.innerHTML = `
      <span class="step-kind">path complete</span>
      <h4 tabindex="-1">${path.title} — finished</h4>
      <p class="done-score">${scoreLine}</p>
      <p class="done-note">Every step is saved on this device. Replay the path to sharpen the score, or try another trail.</p>
      <div class="done-actions"></div>`;
    const actions = done.querySelector('.done-actions');

    const back = button('nom-btn primary', 'back to paths');
    back.addEventListener('click', () => {
      renderPaths();
      showView('paths');
    });
    const replay = button('nom-btn ghost', 'replay path');
    replay.addEventListener('click', () => startPath(path.id));

    actions.append(back, replay);
    runnerStage.appendChild(done);
    done.querySelector('h4').focus({ preventScroll: true });
  }

  /* ---------- wiring ---------- */

  document.getElementById('nom-go-docs').addEventListener('click', () => {
    filterDocs(docsSearch.value);
    showView('docs');
  });
  document.getElementById('nom-go-paths').addEventListener('click', () => {
    renderPaths();
    showView('paths');
  });
  document.getElementById('docs-back').addEventListener('click', () => showView('entry'));
  document.getElementById('paths-back').addEventListener('click', () => showView('entry'));
  document.getElementById('runner-back').addEventListener('click', () => {
    renderPaths();
    showView('paths');
  });
  document.getElementById('runner-restart').addEventListener('click', () => {
    if (!session) return;
    const state = pathState(session.path.id);
    state.step = 0;
    saveStore();
    startPath(session.path.id);
  });
  resumeBtn.addEventListener('click', () => {
    if (resumeBtn.dataset.path) startPath(resumeBtn.dataset.path);
  });
  docsSearch.addEventListener('input', () => filterDocs(docsSearch.value));

  /* entering the page always starts at the choice screen; progress survives */
  new MutationObserver(() => {
    if (!page.classList.contains('is-open')) return;
    paintEntry();
    renderPaths();
    showView('entry');
  }).observe(page, { attributes: true, attributeFilter: ['class'] });

  renderDocs();
  renderPaths();
  paintEntry();
})();
