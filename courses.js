/* Courses — a small library of self-paced courses. Each course owns its own
   reader body, progress record and quiz, so the second course can be added
   without touching the first one's content. */

(() => {
  const page = document.getElementById('page-courses');
  if (!page) return;

  const app = document.getElementById('courses-app');
  const landing = document.getElementById('courses-landing');
  const reader = document.getElementById('course-reader');
  const courseTitle = document.getElementById('course-title');
  const courseDeck = document.getElementById('course-deck');
  const courseLevelTag = document.getElementById('course-level-tag');
  const courseHeroImage = document.getElementById('course-hero-image');
  const courseBack = document.getElementById('course-back');
  const courseBackLabel = courseBack?.querySelector('.course-player-back-label');
  const courseReset = document.getElementById('course-reset');
  const courseSelect = document.getElementById('course-select');
  const sectionSelect = document.getElementById('section-select');
  const coursePrev = document.getElementById('course-prev');
  const courseNext = document.getElementById('course-next');

  const overallFill = document.getElementById('courses-overall-fill');
  const overallBar = document.getElementById('courses-overall-bar');
  const overallText = document.getElementById('courses-overall-text');
  const headNote = document.querySelector('.courses-head-note');

  const readerFill = document.getElementById('course-progress-fill');
  const readerBar = document.getElementById('course-progress-bar');
  const readerText = document.getElementById('course-progress-text');

  const I18N = window.SciLampI18n;
  const t = (en, zh) => I18N?.t(en, zh) ?? en;
  const isZh = () => Boolean(I18N?.isZh);

  const STORE_KEY = 'scilamp.courses.v1';

  const measurementBody = document.getElementById('course-body-measurement');
  const measurementEnglish = measurementBody?.innerHTML || '';

  function paintMeasurement() {
    if (!measurementBody) return;
    measurementBody.innerHTML = isZh() && window.SciLampMeasurementZh
      ? window.SciLampMeasurementZh.render(measurementEnglish)
      : measurementEnglish;
  }

  const COURSE_DEFS = [
    {
      id: 'measurement-units',
      bodyId: 'course-body-measurement',
      quizLesson: 9,
      meta: {
        en: {
          title: 'Measurement, Units, and Significant Figures',
          deck: 'A practical first course in reading measurements, converting units and keeping significant figures honest.',
          level: 'Beginner course',
          tag: 'Beginner · Foundations',
          image: 'Assets/scilab/element-ferrum.svg',
        },
        zh: {
          title: '測量、單位與有效數字',
          deck: '第一門實用課程：讀測量、換單位，讓有效數字保持誠實。',
          level: '初級課程',
          tag: '初級 · 基礎',
          image: 'Assets/scilab/element-ferrum.svg',
        },
      },
    },
    {
      id: 'atomic-structure',
      bodyId: 'course-body-atomic',
      quizLesson: null,
      meta: {
        en: {
          title: 'Atomic Structure and Electron Configuration',
          deck: 'Build the atom from its particles, then follow electrons into shells, subshells and orbitals.',
          level: 'Beginner course',
          tag: 'Beginner · Foundations',
          image: 'Assets/scilab/orbital-study.svg',
        },
        zh: {
          title: '原子結構與電子組態',
          deck: '從粒子開始建造原子，再跟著電子進入殼層、次殼層與軌域。',
          level: '初級課程',
          tag: '初級 · 基礎',
          image: 'Assets/scilab/orbital-study.svg',
        },
      },
    },
    {
      id: 'periodic-trends',
      bodyId: 'course-body-periodic-trends',
      quizLesson: 10,
      meta: {
        en: {
          title: 'Periodic Trends',
          deck: 'Read the table like a map: how size, ionisation energy and electronegativity shift across periods and down groups.',
          level: 'Beginner course',
          tag: 'Beginner · Foundations',
          image: 'Assets/scilab/course-periodic-trends.jpg',
        },
        zh: {
          title: '週期趨勢',
          deck: '把週期表當成地圖：尺寸、游離能與電負度如何橫向與縱向改變。',
          level: '初級課程',
          tag: '初級 · 基礎',
          image: 'Assets/scilab/course-periodic-trends.jpg',
        },
      },
    },
    {
      id: 'chemical-bonding',
      bodyId: 'course-body-chemical-bonding',
      quizLesson: 10,
      meta: {
        en: {
          title: 'Chemical Bonding',
          deck: 'Why atoms join: ionic transfer, covalent sharing, metallic seas and the forces that hold molecules together.',
          level: 'Beginner course',
          tag: 'Beginner · Foundations',
          image: 'Assets/scilab/course-chemical-bonding.jpg',
        },
        zh: {
          title: '化學鍵結',
          deck: '原子為何結合：離子轉移、共價共用、金屬電子海，以及把分子聚在一起的作用力。',
          level: '初級課程',
          tag: '初級 · 基礎',
          image: 'Assets/scilab/course-chemical-bonding.jpg',
        },
      },
    },
    {
      id: 'states-matter',
      bodyId: 'course-body-states-matter',
      quizLesson: 11,
      meta: {
        en: {
          title: 'States of Matter and Phase Changes',
          deck: 'From crystal lattices to supercritical fluids: why solids hold, liquids flow, gases fill and matter changes phase.',
          level: 'Beginner course',
          tag: 'Beginner · Matter',
          image: 'Assets/scilab/course-states-matter.jpg',
        },
        zh: {
          title: '物質狀態與相變',
          deck: '從晶格到超臨界流體：固體為何成形、液體為何流動、氣體為何充滿容器，以及物質如何改變狀態。',
          level: '初級課程',
          tag: '初級 · 物質',
          image: 'Assets/scilab/course-states-matter.jpg',
        },
      },
    },
    {
      id: 'reaction-types',
      bodyId: 'course-body-reaction-types',
      quizLesson: 11,
      meta: {
        en: {
          title: 'Chemical Reactions and Reaction Types',
          deck: 'Read an equation, balance it and name what happened: synthesis, decomposition, replacement, combustion and redox.',
          level: 'Beginner course',
          tag: 'Beginner · Reactions',
          image: 'Assets/scilab/course-reaction-types.jpg',
        },
        zh: {
          title: '化學反應與反應類型',
          deck: '讀方程式、平衡它，並說出發生了什麼：合成、分解、取代、燃燒與氧化還原。',
          level: '初級課程',
          tag: '初級 · 反應',
          image: 'Assets/scilab/course-reaction-types.jpg',
        },
      },
    },
    {
      id: 'stoichiometry',
      bodyId: 'course-body-stoichiometry',
      quizLesson: 12,
      meta: {
        en: {
          title: 'Stoichiometry and the Mole Concept',
          deck: 'Count particles by weighing them, balance equations and predict the limiting reactant and the yield.',
          level: 'Intermediate course',
          tag: 'Intermediate · Reactions',
          image: 'Assets/scilab/course-stoichiometry.jpg',
        },
        zh: {
          title: '計量與莫耳概念',
          deck: '用稱重來數粒子、平衡方程式，並預測限量試劑與產率。',
          level: '中級課程',
          tag: '中級 · 反應',
          image: 'Assets/scilab/course-stoichiometry.jpg',
        },
      },
    },
    {
      id: 'solubility',
      bodyId: 'course-body-solubility',
      quizLesson: 9,
      meta: {
        en: {
          title: 'Solubility and Precipitation',
          deck: 'Read a solubility product, find molar solubility and predict the precipitate before it forms.',
          level: 'Intermediate course',
          tag: 'Intermediate · Equilibrium',
          image: 'Assets/scilab/course-solubility.jpg',
        },
        zh: {
          title: '溶解度與沉澱',
          deck: '讀懂溶度積、求出莫耳溶解度，在沉澱生成之前先預測它。',
          level: '中級課程',
          tag: '中級 · 平衡',
          image: 'Assets/scilab/course-solubility.jpg',
        },
      },
    },
    {
      id: 'acids-bases',
      bodyId: 'course-body-acids-bases',
      quizLesson: 10,
      meta: {
        en: {
          title: 'Acids, Bases, and pH',
          deck: 'From proton transfer to titration curves: calculate pH, tame buffers and read an indicator.',
          level: 'Intermediate course',
          tag: 'Intermediate · Equilibrium',
          image: 'Assets/scilab/course-acids-bases.jpg',
        },
        zh: {
          title: '酸、鹼與 pH',
          deck: '從質子轉移到滴定曲線：計算 pH、掌握緩衝液，讀懂指示劑。',
          level: '中級課程',
          tag: '中級 · 平衡',
          image: 'Assets/scilab/course-acids-bases.jpg',
        },
      },
    },
    {
      id: 'electrolysis',
      bodyId: 'course-body-electrolysis',
      quizLesson: 10,
      meta: {
        en: {
          title: 'Electrolysis',
          deck: 'Drive non-spontaneous redox with current, choose the ion that discharges and calculate what deposits.',
          level: 'Advanced course',
          tag: 'Advanced · Electrochemistry',
          image: 'Assets/scilab/course-electrolysis.jpg',
        },
        zh: {
          title: '電解',
          deck: '用電流驅動非自發的氧化還原，判斷哪個離子放電，並計算析出量。',
          level: '高級課程',
          tag: '高級 · 電化學',
          image: 'Assets/scilab/course-electrolysis.jpg',
        },
      },
    },
  ];

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const courses = new Map();
  const bodyControllers = new Map();
  let activeId = null;
  let resetArmed = false;
  let resetTimer = 0;

  const metaFor = (def) => def.meta[isZh() ? 'zh' : 'en'];

  /* ---------- storage ---------- */

  function readAll() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      return data && typeof data === 'object' ? data : {};
    } catch (error) {
      return {};
    }
  }

  function saveAll(data) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (error) {
      /* a private window may refuse storage; the page still works for this visit */
    }
  }

  /* ---------- one course ---------- */

  function createCourse(def) {
    const body = document.getElementById(def.bodyId);
    if (!body) return null;

    const lessons = [...body.querySelectorAll('.lesson')];
    const questions = [...body.querySelectorAll('.mcq')];
    const lessonCount = lessons.length;
    const quizTotal = questions.length;
    const quizLesson = def.quizLesson;

    const card = document.querySelector(`[data-course-card="${def.id}"]`);
    const cardFill = card?.querySelector('[data-course-fill]');
    const cardBar = card?.querySelector('[data-course-progress]');
    const cardPercent = card?.querySelector('[data-course-percent]');
    const cardCta = card?.querySelector('[data-course-cta]');
    const finishText = body.querySelector('[data-finish-text], #course-finish-text');
    const finishPanel = body.querySelector('.course-finish');

    const mcqFill = body.querySelector('#mcq-fill, [data-mcq-fill]');
    const mcqBar = body.querySelector('#mcq-bar, [data-mcq-bar]');
    const mcqCount = body.querySelector('#mcq-count, [data-mcq-count]');
    const mcqNote = body.querySelector('#mcq-note, [data-mcq-note]');
    const mcqClear = body.querySelector('#mcq-clear, [data-mcq-clear]');

    let done = new Set();
    let solved = new Map();
    let openLessonId = null;
    let scrollTimer = 0;

    function load() {
      const saved = readAll()?.courses?.[def.id] || {};
      const savedDone = Array.isArray(saved.done) ? saved.done : [];
      const savedMcq = saved.mcq && typeof saved.mcq === 'object' ? saved.mcq : {};

      done = new Set(savedDone.filter((n) => Number.isInteger(n) && n >= 1 && n <= lessonCount));
      solved = new Map();

      questions.forEach((question) => {
        const number = Number(question.dataset.mcq);
        const choice = Number(savedMcq[number]);
        const answer = Number(question.dataset.answer);
        const option = question.querySelector(`.mcq-opt[data-choice="${choice}"]`);
        if (!Number.isInteger(number)) return;
        if (choice === answer && option) solved.set(number, choice);
      });
    }

    function save() {
      const data = readAll();
      if (!data.courses || typeof data.courses !== 'object') data.courses = {};
      data.version = 1;
      data.courses[def.id] = {
        done: [...done].sort((a, b) => a - b),
        mcq: Object.fromEntries([...solved].sort((a, b) => a[0] - b[0])),
        updated: new Date().toISOString(),
      };
      saveAll(data);
      document.dispatchEvent(new CustomEvent('scilamp:courses', { detail: { course: def.id } }));
    }

    function quizLine() {
      if (!quizTotal) return '';
      return isZh()
        ? ` 答對 ${solved.size} / ${quizTotal} 題。`
        : ` Checks: ${solved.size} of ${quizTotal} correct.`;
    }

    function updateFinish() {
      if (!finishText) return;
      const count = done.size;
      finishText.textContent = count === lessonCount
        ? (isZh()
          ? `已完成全部 ${lessonCount} 小節。${quizLine()}`
          : `All ${lessonCount} sections complete.${quizLine()}`)
        : (isZh()
          ? `已完成 ${count} / ${lessonCount} 小節。${quizLine()} 每完成一節就標記一次。`
          : `${count} of ${lessonCount} sections complete.${quizLine()} Mark each section as you finish it.`);
    }

    function renderQuizMeter() {
      if (!quizTotal) return;
      const count = solved.size;
      const pct = Math.round((count / quizTotal) * 100);

      if (mcqFill) mcqFill.style.width = `${pct}%`;
      mcqBar?.setAttribute('aria-valuemax', String(quizTotal));
      mcqBar?.setAttribute('aria-valuenow', String(count));
      mcqBar?.setAttribute('aria-valuetext', isZh()
        ? `答對 ${count} / ${quizTotal} 題`
        : `${count} of ${quizTotal} questions correct`);
      if (mcqCount) mcqCount.textContent = `${count} / ${quizTotal}`;

      if (mcqNote) {
        if (count === quizTotal) {
          const sectionNo = String(quizLesson).padStart(2, '0');
          mcqNote.textContent = done.has(quizLesson)
            ? (isZh() ? `全部 ${quizTotal} 題答對——第 ${sectionNo} 節已完成。` : `All ${quizTotal} correct — section ${sectionNo} is complete.`)
            : (isZh() ? `全部 ${quizTotal} 題答對。已保存在此裝置。` : `All ${quizTotal} correct. Saved on this device.`);
        } else if (count) {
          mcqNote.textContent = isZh()
            ? `答對 ${count} / ${quizTotal} 題。已保存在此裝置。`
            : `${count} of ${quizTotal} correct. Saved on this device.`;
        } else {
          mcqNote.textContent = t('Answers are saved on this device.', '答案保存在此裝置。');
        }
      }

      if (mcqClear) mcqClear.disabled = count === 0;
      updateFinish();
    }

    function updateCard() {
      if (!card) return;
      const count = done.size;
      const pct = Math.round((count / lessonCount) * 100);
      const complete = count === lessonCount;
      card.classList.toggle('is-complete', complete);
      if (cardFill) cardFill.style.width = `${pct}%`;
      cardBar?.setAttribute('aria-valuemax', String(lessonCount));
      cardBar?.setAttribute('aria-valuenow', String(count));
      cardBar?.setAttribute('aria-valuetext', isZh()
        ? `已完成 ${count} / ${lessonCount} 小節`
        : `${count} of ${lessonCount} sections complete`);
      if (cardPercent) cardPercent.textContent = `${pct}%`;
      if (cardCta) {
        cardCta.textContent = count === 0
          ? t('Start course', '開始課程')
          : complete
            ? t('Review course', '複習課程')
            : t('Continue course', '繼續課程');
      }
    }

    function updateReader() {
      if (activeId !== def.id) return;
      const count = done.size;
      const pct = Math.round((count / lessonCount) * 100);
      if (readerFill) readerFill.style.width = `${pct}%`;
      readerBar?.setAttribute('aria-valuemax', String(lessonCount));
      readerBar?.setAttribute('aria-valuenow', String(count));
      readerBar?.setAttribute('aria-valuetext', isZh()
        ? `已完成 ${count} / ${lessonCount} 小節`
        : `${count} of ${lessonCount} sections complete`);
      if (readerText) {
        readerText.textContent = isZh()
          ? `已完成 ${count} / ${lessonCount} 小節`
          : `${count} of ${lessonCount} sections`;
      }
      if (headNote) {
        headNote.textContent = count === 0
          ? t('Progress saved on this device', '進度保存在此裝置')
          : (isZh() ? `已完成 ${count} / ${lessonCount} 小節` : `${count} of ${lessonCount} sections complete`);
      }
    }

    function updateLessons() {
      lessons.forEach((lesson) => {
        const id = Number(lesson.dataset.lesson);
        const isDone = done.has(id);
        lesson.classList.toggle('is-done', isDone);
        const state = lesson.querySelector('.lesson-state');
        if (state) state.textContent = t('Completed', '已完成');
        const button = lesson.querySelector('.lesson-done');
        if (!button) return;
        button.setAttribute('aria-pressed', String(isDone));
        button.title = isDone ? t('Press to mark this section incomplete', '按一下標記為未完成') : '';
        const label = button.querySelector('.lesson-done-label');
        if (label) label.textContent = isDone ? t('Completed', '已完成') : t('Mark as complete', '標記完成');
      });
    }

    function update() {
      updateLessons();
      updateCard();
      updateReader();
      renderQuizMeter();
      updateFinish();
    }

    function toggleLesson(id) {
      if (done.has(id)) done.delete(id);
      else done.add(id);
      save();
      update();
      paintOverall();
    }

    function buildPlayer() {
      lessons.forEach((lesson) => {
        lesson.hidden = true;
        lesson.classList.remove('is-open');
      });
      if (finishPanel) finishPanel.hidden = true;
    }

    function openLesson(id, { scroll = false, instant = false } = {}) {
      const target = lessons.find((lesson) => Number(lesson.dataset.lesson) === id);
      if (!target) return;

      openLessonId = id;
      lessons.forEach((lesson) => {
        const isActive = lesson === target;
        lesson.hidden = !isActive;
        lesson.classList.toggle('is-active', isActive);
        lesson.classList.remove('is-open');
      });
      if (finishPanel) finishPanel.hidden = id !== lessonCount;
      syncPlayer(def.id, id, lessonCount);

      if (!scroll) return;

      const behavior = instant || motionQuery.matches ? 'auto' : 'smooth';
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (openLessonId !== id) return;
        lessons.find((lesson) => Number(lesson.dataset.lesson) === id)?.scrollIntoView({ behavior, block: 'start' });
      }, instant || motionQuery.matches ? 0 : 40);
    }

    function defaultLessonId() {
      return lessons.find((lesson) => !done.has(Number(lesson.dataset.lesson)))?.dataset.lesson
        || lessons[0]?.dataset.lesson;
    }

    function feedbackFor(question, state, text) {
      const feedback = question.querySelector('.mcq-feedback');
      if (!feedback) return;
      feedback.hidden = false;
      feedback.className = `mcq-feedback${state ? ` is-${state}` : ''}`;
      const copy = feedback.querySelector('p');
      if (copy) copy.textContent = text;
    }

    function applySolved(question, choice) {
      const number = Number(question.dataset.mcq);
      const answer = Number(question.dataset.answer);
      const options = [...question.querySelectorAll('.mcq-opt')];

      options.forEach((option) => {
        const isAnswer = Number(option.dataset.choice) === answer;
        option.classList.remove('is-wrong');
        option.classList.toggle('is-correct', isAnswer);
        option.disabled = true;
        option.setAttribute('aria-pressed', String(isAnswer));
      });

      question.classList.add('is-solved');
      feedbackFor(question, 'correct', question.dataset.explain || t('Correct.', '正確。'));
      solved.set(number, choice);
      save();
      renderQuizMeter();
      paintOverall();

      if (window.SciLampFx) {
        SciLampFx.pop(question);
        SciLampFx.burstAt(question.querySelector('.mcq-opt.is-correct') || question, { count: 18 });
      }

      if (quizLesson && solved.size === quizTotal && !done.has(quizLesson)) {
        done.add(quizLesson);
        save();
        update();
        paintOverall();
      }
    }

    function answerQuestion(question, choice) {
      if (!question || question.classList.contains('is-solved')) return;
      const number = Number(question.dataset.mcq);
      const answer = Number(question.dataset.answer);
      const picked = question.querySelector(`.mcq-opt[data-choice="${choice}"]`);
      if (!picked || !Number.isInteger(number)) return;

      if (choice === answer) {
        applySolved(question, choice);
        return;
      }

      question.querySelectorAll('.mcq-opt').forEach((option) => {
        option.classList.toggle('is-wrong', option === picked);
        option.setAttribute('aria-pressed', 'false');
      });
      feedbackFor(question, 'hint', question.dataset.hint || t('Not quite — try another option.', '還不對——再試另一個選項。'));
    }

    function restoreQuiz() {
      questions.forEach((question) => {
        const number = Number(question.dataset.mcq);
        const answer = Number(question.dataset.answer);
        const options = [...question.querySelectorAll('.mcq-opt')];

        if (solved.has(number)) {
          options.forEach((option) => {
            const isAnswer = Number(option.dataset.choice) === answer;
            option.classList.toggle('is-correct', isAnswer);
            option.disabled = true;
            option.setAttribute('aria-pressed', String(isAnswer));
          });
          question.classList.add('is-solved');
          feedbackFor(question, 'correct', question.dataset.explain || t('Correct.', '正確。'));
        } else {
          options.forEach((option) => {
            option.disabled = false;
            option.classList.remove('is-correct', 'is-wrong');
            option.removeAttribute('aria-pressed');
          });
          question.classList.remove('is-solved');
          const feedback = question.querySelector('.mcq-feedback');
          if (feedback) {
            feedback.hidden = true;
            feedback.className = 'mcq-feedback';
            const copy = feedback.querySelector('p');
            if (copy) copy.textContent = '';
          }
        }
      });

      renderQuizMeter();
    }

    function resetProgress() {
      done = new Set();
      solved.clear();
      save();
      restoreQuiz();
      update();
      paintOverall();
    }

    function clearQuiz() {
      if (!solved.size) return;
      solved.clear();
      save();
      restoreQuiz();
      update();
      paintOverall();
    }

    function hasProgress() {
      return done.size > 0 || solved.size > 0;
    }

    return {
      def,
      body,
      get done() { return done; },
      get solved() { return solved; },
      get lessonCount() { return lessonCount; },
      get quizTotal() { return quizTotal; },
      get openLessonId() { return openLessonId; },
      load,
      save,
      update,
      updateCard,
      buildPlayer,
      openLesson,
      defaultLessonId,
      answerQuestion,
      restoreQuiz,
      clearQuiz,
      resetProgress,
      hasProgress,
      toggleLesson,
    };
  }

  /* ---------- shared chrome ---------- */

  function paintOverall() {
    const list = [...courses.values()];
    const total = list.reduce((sum, course) => sum + course.lessonCount, 0);
    const count = list.reduce((sum, course) => sum + course.done.size, 0);
    const pct = total ? Math.round((count / total) * 100) : 0;

    if (overallFill) overallFill.style.width = `${pct}%`;
    overallBar?.setAttribute('aria-valuemax', String(total));
    overallBar?.setAttribute('aria-valuenow', String(count));
    overallBar?.setAttribute('aria-valuetext', isZh()
      ? `已完成 ${count} / ${total} 小節`
      : `${count} of ${total} sections complete`);
    if (overallText) {
      overallText.textContent = isZh() ? `已完成 ${count} / ${total} 小節` : `${count} of ${total} sections`;
    }
  }

  function renderCourseOptions() {
    if (!courseSelect) return;
    const fragment = document.createDocumentFragment();
    COURSE_DEFS.forEach((def, index) => {
      const option = document.createElement('option');
      option.value = def.id;
      option.textContent = `C${index + 1}: ${metaFor(def).title}`;
      fragment.append(option);
    });
    courseSelect.replaceChildren(fragment);
    if (activeId) courseSelect.value = activeId;
  }

  function renderSectionOptions(course) {
    if (!sectionSelect || !course) return;
    const fragment = document.createDocumentFragment();
    [...course.body.querySelectorAll('.lesson')].forEach((lesson) => {
      const id = Number(lesson.dataset.lesson);
      if (!Number.isInteger(id)) return;
      const option = document.createElement('option');
      option.value = String(id);
      const title = lesson.querySelector('.lesson-title')?.textContent.trim() || '';
      option.textContent = `L${id}: ${title}`;
      fragment.append(option);
    });
    sectionSelect.replaceChildren(fragment);
  }

  function syncPlayer(courseId, lessonId, lessonCount) {
    if (!courseId || courseId !== activeId) return;
    if (courseSelect) courseSelect.value = courseId;
    const id = Number(lessonId);
    if (sectionSelect) {
      sectionSelect.value = Number.isInteger(id) ? String(id) : '';
      sectionSelect.disabled = !Number.isInteger(id);
    }
    if (coursePrev) coursePrev.disabled = !Number.isInteger(id) || id <= 1;
    if (courseNext) courseNext.disabled = !Number.isInteger(id) || id >= lessonCount;
  }

  function refreshChrome() {
    const def = COURSE_DEFS.find((item) => item.id === activeId) || COURSE_DEFS[0];
    const meta = metaFor(def);
    if (courseTitle) courseTitle.textContent = meta.title;
    if (courseDeck) courseDeck.textContent = meta.deck;
    if (courseLevelTag) {
      courseLevelTag.textContent = meta.tag;
      const card = document.querySelector(`[data-course-card="${activeId}"]`);
      const levelClass = [...(card?.classList || [])].find((name) => name.startsWith('level-'));
      if (levelClass) {
        courseLevelTag.classList.remove('level-beginner', 'level-intermediate', 'level-advanced');
        courseLevelTag.classList.add(levelClass);
      }
    }
    if (courseHeroImage) courseHeroImage.src = meta.image;
    if (courseSelect && activeId) courseSelect.value = activeId;
    if (courseBackLabel) courseBackLabel.textContent = t('All courses', '所有課程');
    courseBack?.setAttribute('aria-label', t('Back to all courses', '回到所有課程'));
    courseBack?.setAttribute('title', t('All courses', '所有課程'));
    courseSelect?.setAttribute('aria-label', t('Choose a course', '選擇課程'));
    sectionSelect?.setAttribute('aria-label', t('Choose a section', '選擇章節'));
    coursePrev?.setAttribute('aria-label', t('Previous section', '上一節'));
    coursePrev?.setAttribute('title', t('Previous section', '上一節'));
    courseNext?.setAttribute('aria-label', t('Next section', '下一節'));
    courseNext?.setAttribute('title', t('Next section', '下一節'));
    if (headNote) {
      const active = courses.get(activeId);
      const onLanding = landing && !landing.hidden;
      headNote.textContent = !onLanding && active && active.done.size
        ? (isZh() ? `已完成 ${active.done.size} / ${active.lessonCount} 小節` : `${active.done.size} of ${active.lessonCount} sections complete`)
        : t('Progress saved on this device', '進度保存在此裝置');
    }
  }

  function showView(view) {
    const alreadyOn = view.classList.contains('is-on') && !view.hidden;
    [landing, reader].forEach((part) => {
      if (!part) return;
      part.hidden = part !== view;
      if (!alreadyOn) part.classList.remove('is-on');
    });
    if (!alreadyOn) {
      void view.offsetWidth;
      view.classList.add('is-on');
    }
    app.scrollTop = 0;
  }

  function showLanding({ focusReturn = false } = {}) {
    showView(landing);
    refreshChrome();
    if (focusReturn) {
      document.querySelector(`[data-course-card="${activeId}"] [data-course-open]`)?.focus({ preventScroll: true });
    }
  }

  function showReader(courseId) {
    const course = courses.get(courseId) || [...courses.values()][0];
    if (!course) return;
    activeId = course.def.id;
    courses.forEach((entry) => {
      entry.body.hidden = entry.def.id !== activeId;
    });
    showView(reader);
    refreshChrome();
    renderSectionOptions(course);
    typesetMath(course.body);
    if (course.openLessonId === null) {
      const first = Number(course.defaultLessonId());
      if (Number.isInteger(first)) course.openLesson(first, { instant: true });
    } else {
      syncPlayer(course.def.id, course.openLessonId, course.lessonCount);
    }
    course.update();
    paintOverall();
    courseTitle?.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('scilamp:reader', { detail: { course: course.def.id } }));
  }

  /* ---------- delegation ---------- */

  function ensureBodyDelegation(body, courseId) {
    if (body.dataset.courseBound) {
      bodyControllers.set(body, courseId);
      return;
    }
    body.dataset.courseBound = '1';
    bodyControllers.set(body, courseId);

    body.addEventListener('click', (event) => {
      const course = courses.get(bodyControllers.get(body));
      if (!course) return;

      const doneBtn = event.target.closest('.lesson-done');
      if (doneBtn) {
        const id = Number(doneBtn.dataset.complete);
        if (!Number.isInteger(id)) return;
        course.toggleLesson(id);
        if (course.done.has(id) && id < course.lessonCount) {
          course.openLesson(id + 1, { scroll: true });
        }
        return;
      }

      const option = event.target.closest('.mcq-opt');
      if (option && body.contains(option)) {
        course.answerQuestion(option.closest('.mcq'), Number(option.dataset.choice));
        return;
      }

      if (event.target.closest('#mcq-clear, [data-mcq-clear]')) {
        course.clearQuiz();
      }
    });
  }

  /* ---------- reset, with a second press ---------- */

  function disarmReset() {
    clearTimeout(resetTimer);
    resetArmed = false;
    courseReset.classList.remove('is-armed');
    courseReset.textContent = t('Reset progress', '重設進度');
  }

  courseReset?.addEventListener('click', () => {
    const course = courses.get(activeId);
    if (!course) return;
    if (!course.hasProgress()) {
      courseReset.textContent = t('No progress yet', '尚未有進度');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(disarmReset, 2200);
      return;
    }
    if (!resetArmed) {
      resetArmed = true;
      courseReset.classList.add('is-armed');
      courseReset.textContent = t('Press again to reset', '再按一次重設');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(disarmReset, 4200);
      return;
    }
    course.resetProgress();
    clearTimeout(resetTimer);
    resetArmed = false;
    courseReset.classList.remove('is-armed');
    courseReset.textContent = t('Progress reset', '進度已重設');
    resetTimer = setTimeout(disarmReset, 2200);
  });

  /* ---------- wiring ---------- */

  landing?.addEventListener('click', (event) => {
    const open = event.target.closest('[data-course-open]');
    if (open) showReader(open.dataset.courseOpen);
  });

  courseBack?.addEventListener('click', () => showLanding({ focusReturn: true }));

  reader?.addEventListener('click', (event) => {
    if (event.target.closest('[data-finish-back], #course-finish-back')) {
      showLanding({ focusReturn: true });
      return;
    }
    if (event.target.closest('[data-finish-top], #course-finish-top')) {
      app.scrollTo({ top: 0, behavior: motionQuery.matches ? 'auto' : 'smooth' });
      courseTitle?.focus({ preventScroll: true });
    }
  });

  function stepLesson(delta) {
    const course = courses.get(activeId);
    if (!course) return;
    const current = Number(course.openLessonId);
    if (!Number.isInteger(current)) return;
    const next = current + delta;
    if (next < 1 || next > course.lessonCount) return;
    course.openLesson(next, { scroll: true });
  }

  coursePrev?.addEventListener('click', () => stepLesson(-1));
  courseNext?.addEventListener('click', () => stepLesson(1));

  courseSelect?.addEventListener('change', () => {
    if (courses.has(courseSelect.value)) showReader(courseSelect.value);
  });

  sectionSelect?.addEventListener('change', () => {
    const course = courses.get(activeId);
    const id = Number(sectionSelect.value);
    if (!course || !Number.isInteger(id)) return;
    course.openLesson(id, { scroll: true });
  });

  document.querySelectorAll('[data-nav="courses"], [data-open="courses"]').forEach((button) => {
    button.addEventListener('click', () => showLanding());
  });

  /* ---------- KaTeX ---------- */

  function typesetMath(rootEl) {
    if (!rootEl || typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(rootEl, {
        delimiters: [
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
        strict: 'ignore',
      });
    } catch (error) {
      /* leave the source visible if a formula cannot be parsed */
    }
  }

  document.addEventListener('DOMContentLoaded', () => typesetMath(reader));
  window.addEventListener('load', () => typesetMath(reader));

  /* ---------- build ---------- */

  paintMeasurement();

  COURSE_DEFS.forEach((def) => {
    const course = createCourse(def);
    if (!course) return;
    course.load();
    course.buildPlayer();
    course.restoreQuiz();
    course.update();
    courses.set(def.id, course);
    ensureBodyDelegation(course.body, def.id);
    const first = Number(course.defaultLessonId());
    if (Number.isInteger(first)) course.openLesson(first, { instant: true });
  });

  activeId = COURSE_DEFS[0].id;
  renderCourseOptions();
  paintOverall();
  refreshChrome();
  typesetMath(reader);

  /* ---------- language switch ---------- */

  document.addEventListener('scilamp:lang', () => {
    const wasActive = activeId;
    const openBefore = new Map([...courses].map(([id, course]) => [id, course.openLessonId]));

    if (window.SciLampAtomicCourse) window.SciLampAtomicCourse.repaint();
    if (window.SciLampScienceCourses) window.SciLampScienceCourses.repaint();
    if (window.SciLampMatterCourses) window.SciLampMatterCourses.repaint();
    paintMeasurement();

    COURSE_DEFS.forEach((def) => {
      const rebuilt = createCourse(def);
      if (!rebuilt) return;
      rebuilt.load();
      rebuilt.buildPlayer();
      rebuilt.restoreQuiz();
      rebuilt.update();
      courses.set(def.id, rebuilt);
      ensureBodyDelegation(rebuilt.body, def.id);
      const openId = openBefore.get(def.id);
      if (openId !== null && openId !== undefined) rebuilt.openLesson(openId, { instant: true });
    });

    courses.forEach((course) => course.update());
    if (wasActive) activeId = wasActive;
    renderCourseOptions();
    const active = courses.get(activeId);
    if (active) {
      renderSectionOptions(active);
      syncPlayer(active.def.id, active.openLessonId, active.lessonCount);
    }
    refreshChrome();
    paintOverall();
    typesetMath(reader);
  });

  /* progress edited in another tab lands here without a refresh */
  window.addEventListener('storage', (event) => {
    if (event.key !== STORE_KEY) return;
    courses.forEach((course) => {
      const openId = course.openLessonId;
      course.load();
      course.restoreQuiz();
      course.update();
      if (openId !== null && openId !== undefined) course.openLesson(openId, { instant: true });
    });
    paintOverall();
    refreshChrome();
  });

  window.SciLampCourses = {
    landing: showLanding,
    open: showReader,
    current: () => activeId,
    catalog: () => COURSE_DEFS.map((def) => ({ id: def.id, title: metaFor(def).title })),
  };
})();
