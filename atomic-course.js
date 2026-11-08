/* Atomic Structure and Electron Configuration — the second beginner course.
   Content is rendered here so the reader can rebuild it on a language switch,
   and three small learning instruments live inside the lessons: an atom
   builder, an Aufbau explorer and a block map. */

(() => {
  const root = document.getElementById('course-body-atomic');
  if (!root) return;

  const I18N = window.SciLampI18n;
  const t = (en, zh) => I18N?.t(en, zh) ?? en;
  const isZh = () => Boolean(I18N?.isZh);
  const L = (en, zh) => (isZh() ? zh : en);
  const pad = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- content ---------- */

  const ATOMIC_PRACTICE = [
    {
      q: ['How many protons, neutrons and electrons are in \\(^{35}_{17}\\text{Cl}\\)?', '\\(^{35}_{17}\\text{Cl}\\) 中有多少質子、中子與電子？'],
      options: [['17 p, 18 n, 17 e', '17 個質子、18 個中子、17 個電子'], ['17 p, 35 n, 17 e', '17 個質子、35 個中子、17 個電子'], ['17 p, 18 n, 18 e', '17 個質子、18 個中子、18 個電子'], ['18 p, 17 n, 17 e', '18 個質子、17 個中子、17 個電子']],
      answer: 0,
      hint: ['The mass number is protons plus neutrons; a neutral atom has equal protons and electrons.', '質量數 = 質子 + 中子；中性原子的質子數等於電子數。'],
      explain: ['35 − 17 = 18 neutrons, and 17 electrons balance the 17 protons.', '35 − 17 = 18 個中子，17 個電子平衡 17 個質子。'],
    },
    {
      q: ['How many neutrons are in \\(^{56}_{26}\\text{Fe}\\)?', '\\(^{56}_{26}\\text{Fe}\\) 中有多少中子？'],
      options: [['26', '26'], ['30', '30'], ['56', '56'], ['82', '82']],
      answer: 1,
      hint: ['Subtract the atomic number from the mass number.', '質量數減去原子序。'],
      explain: ['56 − 26 = 30 neutrons.', '56 − 26 = 30 個中子。'],
    },
    {
      q: ['Which is the electron configuration of oxygen (Z = 8)?', '氧（Z = 8）的電子組態是哪一個？'],
      options: [['\\(1s^2\\,2s^2\\,2p^4\\)', '\\(1s^2\\,2s^2\\,2p^4\\)'], ['\\(1s^2\\,2s^2\\,2p^6\\)', '\\(1s^2\\,2s^2\\,2p^6\\)'], ['\\(1s^2\\,2s^1\\,2p^5\\)', '\\(1s^2\\,2s^1\\,2p^5\\)'], ['\\(1s^2\\,2s^2\\,2p^3\\,3s^1\\)', '\\(1s^2\\,2s^2\\,2p^3\\,3s^1\\)']],
      answer: 0,
      hint: ['Fill 1s (2), 2s (2), then place the rest in 2p.', '先填滿 1s（2 個）、2s（2 個），其餘放入 2p。'],
      explain: ['2 + 2 + 4 = 8 electrons.', '2 + 2 + 4 = 8 個電子。'],
    },
    {
      q: ['Which is the noble gas shorthand for calcium (Z = 20)?', '鈣（Z = 20）的惰性氣體簡寫是哪一個？'],
      options: [['\\([\\text{Ne}]\\,3s^2\\)', '\\([\\text{Ne}]\\,3s^2\\)'], ['\\([\\text{Ar}]\\,4s^2\\)', '\\([\\text{Ar}]\\,4s^2\\)'], ['\\([\\text{Ar}]\\,3d^2\\)', '\\([\\text{Ar}]\\,3d^2\\)'], ['\\([\\text{Kr}]\\,4s^2\\)', '\\([\\text{Kr}]\\,4s^2\\)']],
      answer: 1,
      hint: ['The noble gas before calcium is argon, with 18 electrons.', '鈣之前的惰性氣體是氬，有 18 個電子。'],
      explain: ['After [Ar], the last two electrons enter 4s.', '[Ar] 之後，最後兩個電子進入 4s。'],
    },
    {
      q: ['Which is the electron configuration of \\(^{27}_{13}\\text{Al}^{3+}\\)?', '\\(^{27}_{13}\\text{Al}^{3+}\\) 的電子組態是哪一個？'],
      options: [['\\(1s^2\\,2s^2\\,2p^6\\)', '\\(1s^2\\,2s^2\\,2p^6\\)'], ['\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^1\\)', '\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^1\\)'], ['\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\)', '\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\)'], ['\\(1s^2\\,2s^2\\,2p^3\\)', '\\(1s^2\\,2s^2\\,2p^3\\)']],
      answer: 0,
      hint: ['Al³⁺ has lost three electrons, leaving 13 − 3 = 10.', 'Al³⁺ 失去三個電子，剩 13 − 3 = 10 個。'],
      explain: ['Ten electrons fill 1s, 2s and 2p — the neon configuration.', '10 個電子填滿 1s、2s、2p——氖的組態。'],
    },
    {
      q: ['Which orbital diagram matches nitrogen (Z = 7)?', '哪個軌域圖符合氮（Z = 7）？'],
      options: [
        ['1s ↑↓&nbsp;&nbsp;2s ↑↓&nbsp;&nbsp;2p ↑ ↑ ↑', '1s ↑↓&nbsp;&nbsp;2s ↑↓&nbsp;&nbsp;2p ↑ ↑ ↑'],
        ['1s ↑↓&nbsp;&nbsp;2s ↑↓&nbsp;&nbsp;2p ↑↓ ↑ _', '1s ↑↓&nbsp;&nbsp;2s ↑↓&nbsp;&nbsp;2p ↑↓ ↑ _'],
        ['1s ↑↓&nbsp;&nbsp;2s ↑&nbsp;&nbsp;2p ↑ ↑ ↑', '1s ↑↓&nbsp;&nbsp;2s ↑&nbsp;&nbsp;2p ↑ ↑ ↑'],
        ['1s ↑&nbsp;&nbsp;2s ↑↓&nbsp;&nbsp;2p ↑↓ ↑', '1s ↑&nbsp;&nbsp;2s ↑↓&nbsp;&nbsp;2p ↑↓ ↑'],
      ],
      answer: 0,
      hint: ['Fill 1s and 2s first, then place the three 2p electrons singly (Hund’s rule).', '先填滿 1s、2s，再把三個 2p 電子以單佔方式放入（洪德規則）。'],
      explain: ['Nitrogen has 7 electrons: 1s² 2s² 2p³, with three unpaired 2p electrons.', '氮有 7 個電子：1s² 2s² 2p³，2p 有三個未成對電子。'],
    },
    {
      q: ['How many valence electrons does sulfur have?', '硫有幾個價電子？'],
      options: [['2', '2'], ['4', '4'], ['6', '6'], ['16', '16']],
      answer: 2,
      hint: ['Sulfur is in group 16.', '硫在第 16 族。'],
      explain: ['Group 16 elements have six valence electrons (3s² 3p⁴).', '第 16 族元素有六個價電子（3s² 3p⁴）。'],
    },
    {
      q: ['Which element has the configuration \\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^6\\,4s^1\\)?', '哪個元素的電子組態是 \\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^6\\,4s^1\\)？'],
      options: [['Na', 'Na'], ['K', 'K'], ['Ca', 'Ca'], ['Ar', 'Ar']],
      answer: 1,
      hint: ['Count the electrons; the total is the atomic number.', '數一數電子；總數就是原子序。'],
      explain: ['2 + 2 + 6 + 2 + 6 + 1 = 19, so the element is potassium (K).', '2 + 2 + 6 + 2 + 6 + 1 = 19，所以是鉀（K）。'],
    },
    {
      q: ['Which is the electron configuration of \\(^{34}_{16}\\text{S}^{2-}\\)?', '\\(^{34}_{16}\\text{S}^{2-}\\) 的電子組態是哪一個？'],
      options: [['\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^6\\)', '\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^6\\)'], ['\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^4\\)', '\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^4\\)'], ['\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^5\\)', '\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^5\\)'], ['\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^6\\,4s^2\\)', '\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^6\\,4s^2\\)']],
      answer: 0,
      hint: ['S²⁻ has gained two electrons: 16 + 2 = 18.', 'S²⁻ 得到兩個電子：16 + 2 = 18。'],
      explain: ['Eighteen electrons give the argon configuration.', '18 個電子形成氬的組態。'],
    },
    {
      q: ['Why does 4s fill before 3d?', '為什麼 4s 會比 3d 先填？'],
      options: [['The 4s orbital is lower in energy than 3d for these atoms', '對這些原子而言，4s 軌域能量低於 3d'], ['4s is closer to the nucleus', '4s 比 3d 更靠近原子核'], ['3d can hold only one electron', '3d 只能容納一個電子'], ['Electrons always fill higher shells first', '電子總是先填較高殼層']],
      answer: 0,
      hint: ['Compare orbital energies rather than shell numbers alone.', '比較軌域能量，而不只看殼層編號。'],
      explain: ['For these atoms the 4s orbital lies below 3d, so it fills first.', '對這些原子而言，4s 軌域低於 3d，所以先填。'],
    },
  ];

  const LESSONS = [
    {
      title: { en: 'What is an atom?', zh: '什麼是原子？' },
      body: () => L(`
        <p>An atom is the smallest unit of an element that keeps that element’s properties. It has a tiny, dense <strong>nucleus</strong> surrounded by <strong>electrons</strong>.</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>Particle</th><th>Symbol</th><th>Charge</th><th>Location</th><th>Relative mass</th></tr></thead>
            <tbody>
              <tr><td>Proton</td><td>p<sup>+</sup></td><td>+1</td><td>nucleus</td><td>≈ 1 amu</td></tr>
              <tr><td>Neutron</td><td>n<sup>0</sup></td><td>0</td><td>nucleus</td><td>≈ 1 amu</td></tr>
              <tr><td>Electron</td><td>e<sup>−</sup></td><td>−1</td><td>outside the nucleus</td><td>≈ 1/1836 amu</td></tr>
            </tbody>
          </table>
        </div>
        <ul class="atomic-list">
          <li>The nucleus holds <strong>protons and neutrons</strong>.</li>
          <li>Electrons occupy regions called <strong>orbitals</strong> around the nucleus.</li>
          <li>An atom is neutral when protons = electrons.</li>
        </ul>
        ${atomLabMarkup()}
      `, `
        <p>原子是仍保有元素性質的最小單位。中央是極小、極密的<strong>原子核</strong>，外圍由<strong>電子</strong>環繞。</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>粒子</th><th>符號</th><th>電荷</th><th>位置</th><th>相對質量</th></tr></thead>
            <tbody>
              <tr><td>質子</td><td>p<sup>+</sup></td><td>+1</td><td>原子核</td><td>≈ 1 amu</td></tr>
              <tr><td>中子</td><td>n<sup>0</sup></td><td>0</td><td>原子核</td><td>≈ 1 amu</td></tr>
              <tr><td>電子</td><td>e<sup>−</sup></td><td>−1</td><td>原子核外</td><td>≈ 1/1836 amu</td></tr>
            </tbody>
          </table>
        </div>
        <ul class="atomic-list">
          <li>原子核內有<strong>質子與中子</strong>。</li>
          <li>電子佔據原子核外稱為<strong>軌域</strong>的區域。</li>
          <li>質子數等於電子數時，原子呈電中性。</li>
        </ul>
        ${atomLabMarkup()}
      `),
    },
    {
      title: { en: 'Atomic number, mass number and isotopes', zh: '原子序、質量數與同位素' },
      body: () => L(`
        <h4>Atomic number (Z)</h4>
        <p class="atomic-eq">\\[Z = \\text{number of protons}\\]</p>
        <p><strong>Z defines the element.</strong> Carbon always has \\(Z = 6\\).</p>
        <h4>Mass number (A)</h4>
        <p class="atomic-eq">\\[A = \\text{protons} + \\text{neutrons}\\]</p>
        <p>So \\(\\text{neutrons} = A - Z\\).</p>
        <h4>Notation</h4>
        <p class="atomic-eq">\\[^{A}_{Z}\\text{X}\\]</p>
        <p>Example: \\(^{23}_{11}\\text{Na}\\) has 11 protons, 23 − 11 = 12 neutrons and, when neutral, 11 electrons.</p>
        <h4>Isotopes</h4>
        <p>Isotopes are atoms of the <strong>same element</strong> with <strong>different numbers of neutrons</strong>.</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>Name</th><th>Symbol</th><th>Protons</th><th>Neutrons</th></tr></thead>
            <tbody>
              <tr><td>Protium</td><td>\\(^{1}_{1}\\text{H}\\)</td><td>1</td><td>0</td></tr>
              <tr><td>Deuterium</td><td>\\(^{2}_{1}\\text{H}\\)</td><td>1</td><td>1</td></tr>
              <tr><td>Tritium</td><td>\\(^{3}_{1}\\text{H}\\)</td><td>1</td><td>2</td></tr>
            </tbody>
          </table>
        </div>
        <p class="course-example">Isotopes behave the same chemically but have different masses.</p>
      `, `
        <h4>原子序（Z）</h4>
        <p class="atomic-eq">\\[Z = \\text{質子數}\\]</p>
        <p><strong>Z 決定元素身分。</strong>碳的原子序永遠是 \\(Z = 6\\)。</p>
        <h4>質量數（A）</h4>
        <p class="atomic-eq">\\[A = \\text{質子} + \\text{中子}\\]</p>
        <p>因此 \\(\\text{中子數} = A - Z\\)。</p>
        <h4>符號表示法</h4>
        <p class="atomic-eq">\\[^{A}_{Z}\\text{X}\\]</p>
        <p>例如 \\(^{23}_{11}\\text{Na}\\) 有 11 個質子、23 − 11 = 12 個中子；電中性時有 11 個電子。</p>
        <h4>同位素</h4>
        <p>同位素是<strong>同一元素</strong>、但<strong>中子數不同</strong>的原子。</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>名稱</th><th>符號</th><th>質子</th><th>中子</th></tr></thead>
            <tbody>
              <tr><td>氕</td><td>\\(^{1}_{1}\\text{H}\\)</td><td>1</td><td>0</td></tr>
              <tr><td>氘</td><td>\\(^{2}_{1}\\text{H}\\)</td><td>1</td><td>1</td></tr>
              <tr><td>氚</td><td>\\(^{3}_{1}\\text{H}\\)</td><td>1</td><td>2</td></tr>
            </tbody>
          </table>
        </div>
        <p class="course-example">同位素的化學性質相同，但質量不同。</p>
      `),
    },
    {
      title: { en: 'Ions', zh: '離子' },
      body: () => L(`
        <p>An ion is an atom that has gained or lost electrons.</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>Type</th><th>Electrons vs. protons</th><th>Charge</th><th>Example</th></tr></thead>
            <tbody>
              <tr><td>Cation</td><td>fewer electrons</td><td>positive</td><td>Na<sup>+</sup> (lost 1 e<sup>−</sup>)</td></tr>
              <tr><td>Anion</td><td>more electrons</td><td>negative</td><td>Cl<sup>−</sup> (gained 1 e<sup>−</sup>)</td></tr>
            </tbody>
          </table>
        </div>
        <p>Example: \\(^{24}_{12}\\text{Mg}^{2+}\\) has 12 protons, 24 − 12 = 12 neutrons and 12 − 2 = <strong>10 electrons</strong>.</p>
        <p class="course-example">Beginner tip: the mass number and atomic number do <strong>not</strong> change when an atom becomes an ion. Only electrons change.</p>
      `, `
        <p>離子是得到或失去電子的原子。</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>種類</th><th>電子與質子</th><th>電荷</th><th>例子</th></tr></thead>
            <tbody>
              <tr><td>陽離子</td><td>電子較少</td><td>正電</td><td>Na<sup>+</sup>（失去 1 個 e<sup>−</sup>）</td></tr>
              <tr><td>陰離子</td><td>電子較多</td><td>負電</td><td>Cl<sup>−</sup>（得到 1 個 e<sup>−</sup>）</td></tr>
            </tbody>
          </table>
        </div>
        <p>例如 \\(^{24}_{12}\\text{Mg}^{2+}\\) 有 12 個質子、24 − 12 = 12 個中子，以及 12 − 2 = <strong>10 個電子</strong>。</p>
        <p class="course-example">初學者提示：原子變成離子時，質量數與原子序<strong>不會</strong>改變，只有電子數改變。</p>
      `),
    },
    {
      title: { en: 'Average atomic mass', zh: '平均原子質量' },
      body: () => L(`
        <p>The mass shown on the periodic table is a <strong>weighted average</strong> of the isotope masses.</p>
        <p class="atomic-eq">\\[\\text{Average mass} = \\sum (\\text{fractional abundance} \\times \\text{isotope mass})\\]</p>
        <h4>Example: chlorine</h4>
        <ul class="atomic-list">
          <li>\\(^{35}\\text{Cl}\\): 75.77% abundance, mass ≈ 34.97 amu</li>
          <li>\\(^{37}\\text{Cl}\\): 24.23% abundance, mass ≈ 36.97 amu</li>
        </ul>
        <p class="atomic-eq">\\[(0.7577)(34.97) + (0.2423)(36.97) \\approx 26.50 + 8.96 = 35.46\\ \\text{amu}\\]</p>
        <p>This matches the periodic table value of about 35.45 amu.</p>
      `, `
        <p>週期表上顯示的質量，是各同位素質量的<strong>加權平均</strong>。</p>
        <p class="atomic-eq">\\[\\text{平均質量} = \\sum (\\text{豐度分數} \\times \\text{同位素質量})\\]</p>
        <h4>例子：氯</h4>
        <ul class="atomic-list">
          <li>\\(^{35}\\text{Cl}\\)：豐度 75.77%，質量 ≈ 34.97 amu</li>
          <li>\\(^{37}\\text{Cl}\\)：豐度 24.23%，質量 ≈ 36.97 amu</li>
        </ul>
        <p class="atomic-eq">\\[(0.7577)(34.97) + (0.2423)(36.97) \\approx 26.50 + 8.96 = 35.46\\ \\text{amu}\\]</p>
        <p>這與週期表上約 35.45 amu 的數值相符。</p>
      `),
    },
    {
      title: { en: 'Historical models, briefly', zh: '歷史模型簡述' },
      body: () => L(`
        <p>You do not need every detail, but know the progression.</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>Model</th><th>Key idea</th></tr></thead>
            <tbody>
              <tr><td>Dalton</td><td>Atoms are indivisible spheres.</td></tr>
              <tr><td>Thomson</td><td>“Plum pudding”: electrons embedded in positive material.</td></tr>
              <tr><td>Rutherford</td><td>A dense positive nucleus with electrons outside.</td></tr>
              <tr><td>Bohr</td><td>Electrons occupy fixed energy levels (shells).</td></tr>
              <tr><td>Quantum model</td><td>Electrons occupy orbitals with probability distributions.</td></tr>
            </tbody>
          </table>
        </div>
        <p>The modern model uses <strong>orbitals</strong>, not fixed circular paths.</p>
      `, `
        <p>不必記住每個細節，但要掌握演進順序。</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>模型</th><th>核心想法</th></tr></thead>
            <tbody>
              <tr><td>道耳吞</td><td>原子是不可分割的球體。</td></tr>
              <tr><td>湯姆森</td><td>「葡萄乾布丁」：電子嵌在帶正電的物質中。</td></tr>
              <tr><td>拉塞福</td><td>中央是緻密的正電原子核，電子在外圍。</td></tr>
              <tr><td>波耳</td><td>電子佔據固定的能階（殼層）。</td></tr>
              <tr><td>量子模型</td><td>電子存在於具有機率分佈的軌域中。</td></tr>
            </tbody>
          </table>
        </div>
        <p>現代模型使用<strong>軌域</strong>，而不是固定的圓形路徑。</p>
      `),
    },
    {
      title: { en: 'Energy levels, sublevels and orbitals', zh: '能階、次殼層與軌域' },
      body: () => L(`
        <h4>Shells (principal energy levels)</h4>
        <p>Shells are labelled \\(n = 1, 2, 3, \\dots\\). Higher \\(n\\) means higher energy and a greater distance from the nucleus. Each shell holds up to \\(2n^2\\) electrons.</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table atomic-table--narrow">
            <thead><tr><th>Shell</th><th>Max electrons</th></tr></thead>
            <tbody><tr><td>n = 1</td><td>2</td></tr><tr><td>n = 2</td><td>8</td></tr><tr><td>n = 3</td><td>18</td></tr><tr><td>n = 4</td><td>32</td></tr></tbody>
          </table>
        </div>
        <h4>Sublevels (subshells)</h4>
        <p>Within each shell: <strong>s, p, d, f</strong>.</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table atomic-table--narrow">
            <thead><tr><th>Sublevel</th><th>Orbitals</th><th>Max electrons</th></tr></thead>
            <tbody><tr><td>s</td><td>1</td><td>2</td></tr><tr><td>p</td><td>3</td><td>6</td></tr><tr><td>d</td><td>5</td><td>10</td></tr><tr><td>f</td><td>7</td><td>14</td></tr></tbody>
          </table>
        </div>
        <p>Each <strong>orbital</strong> holds a maximum of <strong>2 electrons</strong>.</p>
        <div class="orbital-shapes" aria-label="Orbital shapes">
          <div class="orbital-shape"><span class="shape-s" aria-hidden="true"></span><strong>s</strong><small>spherical</small></div>
          <div class="orbital-shape"><span class="shape-p" aria-hidden="true"><i></i><i></i></span><strong>p</strong><small>three orientations</small></div>
          <div class="orbital-shape"><span class="shape-d" aria-hidden="true"></span><strong>d / f</strong><small>more complex</small></div>
        </div>
      `, `
        <h4>殼層（主能階）</h4>
        <p>殼層以 \\(n = 1, 2, 3, \\dots\\) 標示。\\(n\\) 越大，能量越高、離核越遠。每層最多容納 \\(2n^2\\) 個電子。</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table atomic-table--narrow">
            <thead><tr><th>殼層</th><th>最多電子數</th></tr></thead>
            <tbody><tr><td>n = 1</td><td>2</td></tr><tr><td>n = 2</td><td>8</td></tr><tr><td>n = 3</td><td>18</td></tr><tr><td>n = 4</td><td>32</td></tr></tbody>
          </table>
        </div>
        <h4>次殼層</h4>
        <p>每個殼層內有 <strong>s、p、d、f</strong> 四種次殼層。</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table atomic-table--narrow">
            <thead><tr><th>次殼層</th><th>軌域數</th><th>最多電子數</th></tr></thead>
            <tbody><tr><td>s</td><td>1</td><td>2</td></tr><tr><td>p</td><td>3</td><td>6</td></tr><tr><td>d</td><td>5</td><td>10</td></tr><tr><td>f</td><td>7</td><td>14</td></tr></tbody>
          </table>
        </div>
        <p>每個<strong>軌域</strong>最多容納 <strong>2 個電子</strong>。</p>
        <div class="orbital-shapes" aria-label="軌域形狀">
          <div class="orbital-shape"><span class="shape-s" aria-hidden="true"></span><strong>s</strong><small>球形</small></div>
          <div class="orbital-shape"><span class="shape-p" aria-hidden="true"><i></i><i></i></span><strong>p</strong><small>三種方向</small></div>
          <div class="orbital-shape"><span class="shape-d" aria-hidden="true"></span><strong>d / f</strong><small>更複雜</small></div>
        </div>
      `),
    },
    {
      title: { en: 'Rules for filling electrons', zh: '電子填入規則' },
      body: () => L(`
        <h4>Rule 1 — Aufbau principle</h4>
        <p>Electrons fill the <strong>lowest-energy orbitals first</strong>.</p>
        <p class="atomic-eq">\\[1s \\rightarrow 2s \\rightarrow 2p \\rightarrow 3s \\rightarrow 3p \\rightarrow 4s \\rightarrow 3d \\rightarrow 4p \\rightarrow 5s \\rightarrow 4d \\rightarrow 5p \\dots\\]</p>
        <p>Memory aid: use the diagonal diagram — write orbitals in columns by sublevel and read diagonally.</p>
        <h4>Rule 2 — Pauli exclusion principle</h4>
        <p>An orbital holds <strong>at most 2 electrons</strong>, with <strong>opposite spins</strong> (↑↓).</p>
        <h4>Rule 3 — Hund’s rule</h4>
        <p>Within equal-energy orbitals, place <strong>one electron in each</strong> before pairing.</p>
        <div class="orbital-diagram" aria-label="2p3 orbital diagram">
          <span class="orb-label">2p<sup>3</sup></span>
          <span class="orbital-box"><i>↑</i></span>
          <span class="orbital-box"><i>↑</i></span>
          <span class="orbital-box"><i>↑</i></span>
        </div>
        <p>Not this:</p>
        <div class="orbital-diagram is-wrong" aria-label="Incorrect pairing">
          <span class="orb-label">2p<sup>3</sup></span>
          <span class="orbital-box"><i>↑↓</i></span>
          <span class="orbital-box"><i>↑</i></span>
          <span class="orbital-box"><i></i></span>
        </div>
      `, `
        <h4>規則一 — 構築原理（Aufbau）</h4>
        <p>電子先填入<strong>能量最低的軌域</strong>。</p>
        <p class="atomic-eq">\\[1s \\rightarrow 2s \\rightarrow 2p \\rightarrow 3s \\rightarrow 3p \\rightarrow 4s \\rightarrow 3d \\rightarrow 4p \\rightarrow 5s \\rightarrow 4d \\rightarrow 5p \\dots\\]</p>
        <p>記憶法：用對角線圖——把軌域按次殼層排成欄，沿對角線讀。</p>
        <h4>規則二 — 包立不相容原理</h4>
        <p>每個軌域最多 <strong>2 個電子</strong>，且自旋方向<strong>相反</strong>（↑↓）。</p>
        <h4>規則三 — 洪德定則</h4>
        <p>在能量相同的軌域中，先<strong>每個軌域各放一個</strong>電子，再開始配對。</p>
        <div class="orbital-diagram" aria-label="2p3 軌域圖">
          <span class="orb-label">2p<sup>3</sup></span>
          <span class="orbital-box"><i>↑</i></span>
          <span class="orbital-box"><i>↑</i></span>
          <span class="orbital-box"><i>↑</i></span>
        </div>
        <p>而不是這樣：</p>
        <div class="orbital-diagram is-wrong" aria-label="錯誤配對">
          <span class="orb-label">2p<sup>3</sup></span>
          <span class="orbital-box"><i>↑↓</i></span>
          <span class="orbital-box"><i>↑</i></span>
          <span class="orbital-box"><i></i></span>
        </div>
      `),
    },
    {
      title: { en: 'Writing electron configurations', zh: '寫出電子組態' },
      body: () => L(`
        <h4>Method</h4>
        <ol class="atomic-list is-ordered">
          <li>Find the number of electrons (the atomic number for a neutral atom).</li>
          <li>Fill orbitals in Aufbau order.</li>
          <li>Write the configuration.</li>
        </ol>
        <h4>Examples</h4>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>Element</th><th>Configuration</th></tr></thead>
            <tbody>
              <tr><td>Hydrogen (Z = 1)</td><td>\\(1s^1\\)</td></tr>
              <tr><td>Helium (Z = 2)</td><td>\\(1s^2\\)</td></tr>
              <tr><td>Carbon (Z = 6)</td><td>\\(1s^2\\,2s^2\\,2p^2\\)</td></tr>
              <tr><td>Sodium (Z = 11)</td><td>\\(1s^2\\,2s^2\\,2p^6\\,3s^1\\)</td></tr>
              <tr><td>Iron (Z = 26)</td><td>\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^6\\,4s^2\\,3d^6\\)</td></tr>
            </tbody>
          </table>
        </div>
        <p>Notice that <strong>4s fills before 3d</strong>.</p>
        <h4>Noble gas shorthand</h4>
        <p>Use the previous noble gas in brackets: sodium becomes \\([\\text{Ne}]\\,3s^1\\) and iron becomes \\([\\text{Ar}]\\,4s^2\\,3d^6\\). Bromine (Z = 35) is \\([\\text{Ar}]\\,4s^2\\,3d^{10}\\,4p^5\\).</p>
        ${configLabMarkup()}
      `, `
        <h4>方法</h4>
        <ol class="atomic-list is-ordered">
          <li>找出電子數（電中性原子的電子數等於原子序）。</li>
          <li>依構築順序填入軌域。</li>
          <li>寫出電子組態。</li>
        </ol>
        <h4>例子</h4>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>元素</th><th>電子組態</th></tr></thead>
            <tbody>
              <tr><td>氫（Z = 1）</td><td>\\(1s^1\\)</td></tr>
              <tr><td>氦（Z = 2）</td><td>\\(1s^2\\)</td></tr>
              <tr><td>碳（Z = 6）</td><td>\\(1s^2\\,2s^2\\,2p^2\\)</td></tr>
              <tr><td>鈉（Z = 11）</td><td>\\(1s^2\\,2s^2\\,2p^6\\,3s^1\\)</td></tr>
              <tr><td>鐵（Z = 26）</td><td>\\(1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^6\\,4s^2\\,3d^6\\)</td></tr>
            </tbody>
          </table>
        </div>
        <p>注意 <strong>4s 會比 3d 先填</strong>。</p>
        <h4>惰性氣體簡寫</h4>
        <p>用前一個惰性氣體放在方括號中：鈉寫成 \\([\\text{Ne}]\\,3s^1\\)，鐵寫成 \\([\\text{Ar}]\\,4s^2\\,3d^6\\)。溴（Z = 35）則是 \\([\\text{Ar}]\\,4s^2\\,3d^{10}\\,4p^5\\)。</p>
        ${configLabMarkup()}
      `),
    },
    {
      title: { en: 'Orbital diagrams', zh: '軌域圖' },
      body: () => L(`
        <p>Show electrons as arrows in boxes. Hund’s rule puts the 2p electrons in separate orbitals with parallel spins.</p>
        <div class="orbital-diagram" aria-label="Carbon orbital diagram">
          <span class="orb-label">1s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2p</span><span class="orbital-box"><i>↑</i></span><span class="orbital-box"><i>↑</i></span><span class="orbital-box"><i></i></span>
        </div>
        <p class="diagram-caption">Carbon — \\(1s^2\\,2s^2\\,2p^2\\)</p>
        <div class="orbital-diagram" aria-label="Nitrogen orbital diagram">
          <span class="orb-label">1s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2p</span><span class="orbital-box"><i>↑</i></span><span class="orbital-box"><i>↑</i></span><span class="orbital-box"><i>↑</i></span>
        </div>
        <p class="diagram-caption">Nitrogen — \\(1s^2\\,2s^2\\,2p^3\\)</p>
        <div class="orbital-diagram" aria-label="Oxygen orbital diagram">
          <span class="orb-label">1s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2p</span><span class="orbital-box"><i>↑↓</i></span><span class="orbital-box"><i>↑</i></span><span class="orbital-box"><i>↑</i></span>
        </div>
        <p class="diagram-caption">Oxygen — \\(1s^2\\,2s^2\\,2p^4\\)</p>
      `, `
        <p>用方框中的箭頭表示電子。洪德定則讓 2p 的電子分佔不同軌域，且自旋平行。</p>
        <div class="orbital-diagram" aria-label="碳的軌域圖">
          <span class="orb-label">1s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2p</span><span class="orbital-box"><i>↑</i></span><span class="orbital-box"><i>↑</i></span><span class="orbital-box"><i></i></span>
        </div>
        <p class="diagram-caption">碳 — \\(1s^2\\,2s^2\\,2p^2\\)</p>
        <div class="orbital-diagram" aria-label="氮的軌域圖">
          <span class="orb-label">1s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2p</span><span class="orbital-box"><i>↑</i></span><span class="orbital-box"><i>↑</i></span><span class="orbital-box"><i>↑</i></span>
        </div>
        <p class="diagram-caption">氮 — \\(1s^2\\,2s^2\\,2p^3\\)</p>
        <div class="orbital-diagram" aria-label="氧的軌域圖">
          <span class="orb-label">1s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2s</span><span class="orbital-box"><i>↑↓</i></span>
          <span class="orb-label">2p</span><span class="orbital-box"><i>↑↓</i></span><span class="orbital-box"><i>↑</i></span><span class="orbital-box"><i>↑</i></span>
        </div>
        <p class="diagram-caption">氧 — \\(1s^2\\,2s^2\\,2p^4\\)</p>
      `),
    },
    {
      title: { en: 'Valence electrons and the periodic table', zh: '價電子與週期表' },
      body: () => L(`
        <p><strong>Valence electrons</strong> sit in the outermost shell and determine chemical behaviour.</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>Group</th><th>Valence electrons</th><th>Example</th></tr></thead>
            <tbody>
              <tr><td>1 (alkali metals)</td><td>1</td><td>Na: \\(3s^1\\)</td></tr>
              <tr><td>2 (alkaline earth)</td><td>2</td><td>Mg: \\(3s^2\\)</td></tr>
              <tr><td>13</td><td>3</td><td>Al: \\(3s^2\\,3p^1\\)</td></tr>
              <tr><td>14</td><td>4</td><td>C: \\(2s^2\\,2p^2\\)</td></tr>
              <tr><td>15</td><td>5</td><td>N: \\(2s^2\\,2p^3\\)</td></tr>
              <tr><td>16</td><td>6</td><td>O: \\(2s^2\\,2p^4\\)</td></tr>
              <tr><td>17 (halogens)</td><td>7</td><td>Cl: \\(3s^2\\,3p^5\\)</td></tr>
              <tr><td>18 (noble gases)</td><td>8 (2 for He)</td><td>Ne: \\(2s^2\\,2p^6\\)</td></tr>
            </tbody>
          </table>
        </div>
        <h4>Blocks</h4>
        <ul class="atomic-list">
          <li><strong>s-block</strong>: groups 1–2</li>
          <li><strong>p-block</strong>: groups 13–18</li>
          <li><strong>d-block</strong>: transition metals</li>
          <li><strong>f-block</strong>: lanthanides and actinides</li>
        </ul>
        <p>The block tells you which sublevel is filled last.</p>
        ${blockMapMarkup()}
      `, `
        <p><strong>價電子</strong>位於最外層殼層，決定元素的化學行為。</p>
        <div class="atomic-table-wrap">
          <table class="atomic-table">
            <thead><tr><th>族</th><th>價電子數</th><th>例子</th></tr></thead>
            <tbody>
              <tr><td>1（鹼金屬）</td><td>1</td><td>Na：\\(3s^1\\)</td></tr>
              <tr><td>2（鹼土金屬）</td><td>2</td><td>Mg：\\(3s^2\\)</td></tr>
              <tr><td>13</td><td>3</td><td>Al：\\(3s^2\\,3p^1\\)</td></tr>
              <tr><td>14</td><td>4</td><td>C：\\(2s^2\\,2p^2\\)</td></tr>
              <tr><td>15</td><td>5</td><td>N：\\(2s^2\\,2p^3\\)</td></tr>
              <tr><td>16</td><td>6</td><td>O：\\(2s^2\\,2p^4\\)</td></tr>
              <tr><td>17（鹵素）</td><td>7</td><td>Cl：\\(3s^2\\,3p^5\\)</td></tr>
              <tr><td>18（惰性氣體）</td><td>8（He 為 2）</td><td>Ne：\\(2s^2\\,2p^6\\)</td></tr>
            </tbody>
          </table>
        </div>
        <h4>區塊</h4>
        <ul class="atomic-list">
          <li><strong>s 區</strong>：第 1–2 族</li>
          <li><strong>p 區</strong>：第 13–18 族</li>
          <li><strong>d 區</strong>：過渡金屬</li>
          <li><strong>f 區</strong>：鑭系與錒系元素</li>
        </ul>
        <p>區塊告訴你最後填入的是哪個次殼層。</p>
        ${blockMapMarkup()}
      `),
    },
    {
      title: { en: 'Common exceptions', zh: '常見例外' },
      body: () => L(`
        <p>Some transition metals have unexpected configurations because half-filled or fully filled d sublevels are especially stable.</p>
        <ul class="atomic-list">
          <li><strong>Cr (Z = 24):</strong> \\([\\text{Ar}]\\,4s^1\\,3d^5\\) — not \\(4s^2\\,3d^4\\).</li>
          <li><strong>Cu (Z = 29):</strong> \\([\\text{Ar}]\\,4s^1\\,3d^{10}\\) — not \\(4s^2\\,3d^9\\).</li>
        </ul>
        <p class="course-example">For a beginner course, know that these exceptions exist. Your instructor will tell you if you need to memorize them.</p>
      `, `
        <p>有些過渡金屬的電子組態不如預期，因為半滿或全滿的 d 次殼層特別穩定。</p>
        <ul class="atomic-list">
          <li><strong>鉻（Z = 24）：</strong>\\([\\text{Ar}]\\,4s^1\\,3d^5\\)，而不是 \\(4s^2\\,3d^4\\)。</li>
          <li><strong>銅（Z = 29）：</strong>\\([\\text{Ar}]\\,4s^1\\,3d^{10}\\)，而不是 \\(4s^2\\,3d^9\\)。</li>
        </ul>
        <p class="course-example">初學階段只要知道這些例外存在即可。是否需要背誦，請依老師指示。</p>
      `),
    },
    {
      title: { en: 'Practice problems', zh: '練習題' },
      body: () => L(`
        <p>Pick one answer per question. A wrong choice gives you a hint.</p>
        ${practiceQuiz(ATOMIC_PRACTICE)}
      `, `
        <p>每題選一個答案。答錯時會給你提示。</p>
        ${practiceQuiz(ATOMIC_PRACTICE)}
      `),
    },
    {
      title: { en: 'Beginner checklist', zh: '初學者檢查表' },
      body: () => L(`
        <ul class="atomic-checklist">
          <li><strong>Atomic number</strong> = protons; <strong>mass number</strong> = protons + neutrons.</li>
          <li>Isotopes differ only in <strong>neutrons</strong>.</li>
          <li>Ions differ only in <strong>electrons</strong>.</li>
          <li>Average atomic mass is a <strong>weighted average</strong> of isotopes.</li>
          <li>Fill orbitals in <strong>Aufbau order</strong>: \\(1s\\,2s\\,2p\\,3s\\,3p\\,4s\\,3d\\,4p\\dots\\)</li>
          <li>Each orbital holds <strong>at most 2 electrons</strong> with opposite spins (<strong>Pauli</strong>).</li>
          <li>In equal-energy orbitals, fill singly first (<strong>Hund’s rule</strong>).</li>
          <li>Use <strong>noble gas shorthand</strong> for larger atoms.</li>
          <li><strong>Valence electrons</strong> are in the outermost shell and drive chemistry.</li>
          <li>The <strong>block</strong> of the periodic table tells you the last sublevel filled.</li>
        </ul>
      `, `
        <ul class="atomic-checklist">
          <li><strong>原子序</strong> = 質子數；<strong>質量數</strong> = 質子 + 中子。</li>
          <li>同位素只差在<strong>中子數</strong>。</li>
          <li>離子只差在<strong>電子數</strong>。</li>
          <li>平均原子質量是同位的<strong>加權平均</strong>。</li>
          <li>依<strong>構築順序</strong>填入軌域：\\(1s\\,2s\\,2p\\,3s\\,3p\\,4s\\,3d\\,4p\\dots\\)</li>
          <li>每個軌域最多 <strong>2 個電子</strong>，自旋相反（<strong>包立</strong>）。</li>
          <li>能量相同的軌域先各填一個（<strong>洪德定則</strong>）。</li>
          <li>較大的原子使用<strong>惰性氣體簡寫</strong>。</li>
          <li><strong>價電子</strong>在最外層，決定化學性質。</li>
          <li>元素在週期表的<strong>區塊</strong>，告訴你最後填入的次殼層。</li>
        </ul>
      `),
    },
  ];

  /* ---------- interactive markup ---------- */

  function atomLabMarkup() {
    return `<div class="atom-lab" data-atom-lab>
      <div class="atom-lab-stage" data-atom-stage>
        <div class="atom-lab-ring" data-atom-rings></div>
        <div class="atom-lab-nucleus" data-atom-nucleus></div>
        <span class="atom-lab-symbol" data-atom-symbol aria-hidden="true">C</span>
      </div>
      <div class="atom-lab-readout">
        <p class="atom-lab-kicker">${L('Build an atom', '建造一顆原子')}</p>
        <p class="atom-lab-name" data-atom-name>Carbon</p>
        <dl class="atom-lab-facts">
          <div><dt>${L('Mass number', '質量數')}</dt><dd data-atom-mass>12</dd></div>
          <div><dt>${L('Charge', '電荷')}</dt><dd data-atom-charge>0</dd></div>
          <div><dt>${L('Electrons', '電子數')}</dt><dd data-atom-electrons>6</dd></div>
        </dl>
        <div class="atom-lab-controls">
          ${['p', 'n', 'e'].map((key) => `<div class="atom-lab-control">
            <span>${key === 'p' ? L('Protons', '質子') : key === 'n' ? L('Neutrons', '中子') : L('Electrons', '電子')}</span>
            <span class="atom-lab-stepper">
              <button type="button" data-atom-step="${key}:-1" aria-label="${L('One fewer', '減少一個')}">−</button>
              <b data-atom-${key}>${key === 'p' || key === 'e' ? 6 : 6}</b>
              <button type="button" data-atom-step="${key}:1" aria-label="${L('One more', '增加一個')}">+</button>
            </span>
          </div>`).join('')}
        </div>
        <button class="atomic-text-btn" type="button" data-atom-reset>${L('Reset to carbon', '回到碳原子')}</button>
      </div>
    </div>`;
  }

  function configLabMarkup() {
    return `<div class="config-lab" data-config-lab>
      <div class="config-lab-head">
        <label for="atomic-z-range">${L('Choose an element', '選擇元素')}</label>
        <span class="config-lab-z">Z = <b data-config-z>11</b></span>
      </div>
      <input class="config-lab-range" id="atomic-z-range" type="range" min="1" max="36" value="11" data-config-range />
      <div class="config-lab-display">
        <p class="config-lab-element"><span data-config-symbol>Na</span><strong data-config-name>Sodium</strong></p>
        <p class="config-lab-short" data-config-short></p>
        <p class="config-lab-full" data-config-full></p>
      </div>
      <div class="config-orbitals" data-config-orbitals aria-label="${L('Orbital diagram', '軌域圖')}"></div>
      <div class="config-lab-actions">
        <button type="button" class="atomic-text-btn" data-config-step="-1">← ${L('Previous', '上一個')}</button>
        <button type="button" class="atomic-text-btn" data-config-step="1">${L('Next', '下一個')} →</button>
      </div>
    </div>`;
  }

  function blockMapMarkup() {
    const cells = [];
    for (let row = 0; row < 4; row += 1) {
      for (let col = 1; col <= 18; col += 1) {
        const block = col <= 2 ? 's' : col >= 13 ? 'p' : 'd';
        cells.push(`<button class="block-map-cell is-${block}" type="button" data-block="${block}" style="grid-column:${col};grid-row:${row + 1}" aria-label="${block}-block"></button>`);
      }
    }
    cells.push(`<button class="block-map-cell is-f block-map-f" type="button" data-block="f" style="grid-column:3 / span 14;grid-row:5" aria-label="f-block"></button>`);
    return `<div class="block-map" data-block-map>
      <div class="block-map-grid">${cells.join('')}</div>
      <div class="block-map-readout">
        <div class="block-map-legend">
          <button type="button" class="block-chip is-s" data-block="s">s</button>
          <button type="button" class="block-chip is-p" data-block="p">p</button>
          <button type="button" class="block-chip is-d" data-block="d">d</button>
          <button type="button" class="block-chip is-f" data-block="f">f</button>
        </div>
        <p data-block-note>${L('Pick a block to see which sublevel fills last.', '選一個區塊，看看最後填入的是哪個次殼層。')}</p>
      </div>
    </div>`;
  }

  function practiceQuiz(items) {
    const list = items.map((item, i) => {
      const n = 101 + i;
      return `<li class="mcq" data-mcq="${n}" data-answer="${item.answer}" data-hint="${esc(L(item.hint[0], item.hint[1]))}" data-explain="${esc(L(item.explain[0], item.explain[1]))}">
        <div class="mcq-head">
          <span class="mcq-n" aria-hidden="true">${pad(i + 1)}</span>
          <p class="mcq-q" id="at-p-${n}">${L(item.q[0], item.q[1])}</p>
        </div>
        <div class="mcq-options" role="group" aria-labelledby="at-p-${n}">
          ${item.options.map((option, j) => `<button class="mcq-opt" type="button" data-choice="${j}"><span class="mcq-key">${'ABCD'[j]}</span><span class="mcq-val">${L(option[0], option[1])}</span></button>`).join('')}
        </div>
        <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
      </li>`;
    }).join('');

    return `<div class="mcq-summary">
      <span class="asset-ico asset-ico--edit" aria-hidden="true"></span>
      <div class="mcq-summary-copy">
        <strong>${L(`${items.length} practice checks`, `${items.length} 個練習檢查`)}</strong>
        <span>${L('Pick an answer. A wrong choice gives you a hint.', '選一個答案。答錯時會給你提示。')}</span>
      </div>
      <div class="mcq-meter" data-mcq-bar role="progressbar" aria-label="${L('Practice questions answered correctly', '答對的練習題數')}" aria-valuemin="0" aria-valuemax="${items.length}" aria-valuenow="0"><span data-mcq-fill></span></div>
      <span class="mcq-count" data-mcq-count>0 / ${items.length}</span>
    </div>
    <ol class="mcq-list">${list}</ol>`;
  }

  /* ---------- lesson rendering ---------- */

  function lessonHTML(lesson, index) {
    return `<article class="lesson" id="atomic-lesson-${index}" data-lesson="${index}" aria-labelledby="atomic-lesson-${index}-title">
      <header class="lesson-head">
        <span class="lesson-num" aria-hidden="true">${pad(index)}</span>
        <h3 class="lesson-title" id="atomic-lesson-${index}-title">${lesson.title[isZh() ? 'zh' : 'en']}</h3>
        <span class="lesson-state" aria-hidden="true">${L('Completed', '已完成')}</span>
      </header>
      <div class="lesson-body">${lesson.body()}</div>
      <footer class="lesson-foot">
        <button class="lesson-done" data-complete="${index}" type="button" aria-pressed="false">
          <span class="lesson-done-box" aria-hidden="true"></span>
          <span class="lesson-done-label">${L('Mark as complete', '標記完成')}</span>
        </button>
        <span class="lesson-foot-note">${L('Saved in this browser', '保存在此瀏覽器')}</span>
      </footer>
    </article>`;
  }

  function render() {
    root.innerHTML = `
      <div class="lesson-list" id="atomic-lesson-list">
        ${LESSONS.map((lesson, i) => lessonHTML(lesson, i + 1)).join('')}
      </div>
      <footer class="course-finish">
        <p class="lesson-kicker"><span class="asset-ico asset-ico--heart" aria-hidden="true"></span> ${L('End of course', '課程結束')}</p>
        <h4>${L('Atomic Structure and Electron Configuration', '原子結構與電子組態')}</h4>
        <p data-finish-text>${L('0 of 13 sections complete. Mark each section as you finish it.', '已完成 0 / 13 小節。每完成一節就標記一次。')}</p>
        <div class="course-finish-actions">
          <button class="course-cta" data-finish-back type="button">&larr; ${L('Back to all courses', '回到所有課程')}</button>
          <button class="course-cta is-quiet" data-finish-top type="button">${L('Back to top', '回到頂端')}</button>
        </div>
      </footer>`;
    enhance();
  }

  /* ---------- atom builder ---------- */

  const atomState = { p: 6, n: 6, e: 6 };

  function elementFor(z) {
    return ELEMENTS.find((row) => row[0] === z) || null;
  }

  function shellElectrons(count) {
    const caps = [2, 8, 8, 2];
    let left = count;
    return caps.map((cap) => {
      const n = Math.max(0, Math.min(cap, left));
      left -= n;
      return n;
    });
  }

  function paintAtomLab() {
    const lab = root.querySelector('[data-atom-lab]');
    if (!lab) return;
    const { p, n, e } = atomState;
    const element = elementFor(p);
    const symbol = element ? element[1] : '?';
    const name = element ? (I18N?.elementName(element) || element[2]) : L('Unknown', '未知');
    const charge = p - e;

    lab.querySelector('[data-atom-symbol]').textContent = symbol;
    lab.querySelector('[data-atom-name]').textContent = name;
    lab.querySelector('[data-atom-mass]').textContent = String(p + n);
    lab.querySelector('[data-atom-charge]').textContent = charge === 0 ? '0' : charge > 0 ? `+${charge}` : `−${Math.abs(charge)}`;
    lab.querySelector('[data-atom-electrons]').textContent = String(e);
    ['p', 'n', 'e'].forEach((key) => {
      const out = lab.querySelector(`[data-atom-${key}]`);
      if (out) out.textContent = String(atomState[key]);
    });

    const nucleus = lab.querySelector('[data-atom-nucleus]');
    const total = Math.min(p + n, 28);
    const protons = Math.min(p, total);
    nucleus.innerHTML = Array.from({ length: total }, (_, i) => {
      const angle = i * 2.399963;
      const radius = 2.5 + Math.sqrt(i) * 3.4;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return `<i class="${i < protons ? 'is-p' : 'is-n'}" style="transform:translate(${x.toFixed(1)}px,${y.toFixed(1)}px)"></i>`;
    }).join('');

    const rings = lab.querySelector('[data-atom-rings]');
    const shells = shellElectrons(e);
    rings.innerHTML = shells.map((count, shellIndex) => {
      if (!count) return '';
      const radius = 40 + shellIndex * 20;
      const dots = Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return `<i class="atom-dot" style="transform:translate(${x.toFixed(1)}px,${y.toFixed(1)}px)"></i>`;
      }).join('');
      return `<span class="atom-ring" style="--ring:${radius * 2}px">${dots}</span>`;
    }).join('');
  }

  /* ---------- configuration explorer ---------- */

  const ORDER = [
    ['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 6], ['4s', 2],
    ['3d', 10], ['4p', 6], ['5s', 2], ['4d', 10], ['5p', 6],
  ];
  const CORES = [
    { z: 2, sym: 'He' }, { z: 10, sym: 'Ne' }, { z: 18, sym: 'Ar' }, { z: 36, sym: 'Kr' },
  ];
  let explorerZ = 11;

  function configuration(z) {
    let left = z;
    const terms = [];
    ORDER.forEach(([label, cap]) => {
      if (left <= 0) return;
      const count = Math.min(cap, left);
      terms.push([label, count]);
      left -= count;
    });
    if (z === 24 || z === 29) {
      terms.forEach((term) => {
        if (term[0] === '4s') term[1] = 1;
        if (term[0] === '3d') term[1] = z === 24 ? 5 : 10;
      });
    }
    return terms;
  }

  function sup(value) {
    const digits = String(value).split('');
    const map = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
    return digits.map((d) => map[d] || d).join('');
  }

  function fullConfiguration(terms) {
    return terms.map(([label, count]) => `${label}${sup(count)}`).join(' ');
  }

  function shortConfiguration(z, terms) {
    const core = [...CORES].reverse().find((item) => item.z < z);
    if (!core) return fullConfiguration(terms);
    let left = core.z;
    const rest = [];
    terms.forEach(([label, count]) => {
      if (left <= 0) {
        rest.push([label, count]);
        return;
      }
      const used = Math.min(count, left);
      left -= used;
      if (count - used > 0) rest.push([label, count - used]);
    });
    return `[${core.sym}] ${fullConfiguration(rest)}`;
  }

  function orbitalBoxes(terms) {
    return terms.map(([label, count]) => {
      const boxes = Math.max(1, Math.min(7, Math.ceil(Number(label.slice(-1)) === 1 ? 1 : label.includes('p') ? 3 : label.includes('d') ? 5 : label.includes('f') ? 7 : 1)));
      const perBox = Math.floor(count / boxes);
      const extra = count % boxes;
      const html = Array.from({ length: boxes }, (_, i) => {
        const n = perBox + (i < extra ? 1 : 0);
        const arrows = n === 2 ? '↑↓' : n === 1 ? '↑' : '';
        return `<span class="orbital-box"><i>${arrows}</i></span>`;
      }).join('');
      return `<div class="config-term"><span class="orb-label">${label}${sup(count)}</span>${html}</div>`;
    }).join('');
  }

  function paintConfigLab() {
    const lab = root.querySelector('[data-config-lab]');
    if (!lab) return;
    const z = explorerZ;
    const element = ELEMENTS.find((row) => row[0] === z);
    const symbol = element ? element[1] : '?';
    const name = element ? (I18N?.elementName(element) || element[2]) : '';
    const terms = configuration(z);
    lab.querySelector('[data-config-z]').textContent = String(z);
    lab.querySelector('[data-config-symbol]').textContent = symbol;
    lab.querySelector('[data-config-name]').textContent = name;
    const range = lab.querySelector('[data-config-range]');
    if (range && Number(range.value) !== z) range.value = String(z);
    lab.querySelector('[data-config-full]').innerHTML = `${L('Full', '完整')}: ${fullConfiguration(terms)}`;
    lab.querySelector('[data-config-short]').innerHTML = `${L('Shorthand', '簡寫')}: ${shortConfiguration(z, terms)}`;
    lab.querySelector('[data-config-orbitals]').innerHTML = orbitalBoxes(terms);
  }

  /* ---------- block map ---------- */

  const BLOCK_NOTES = {
    en: {
      s: 's-block — groups 1–2. The last electron enters an s orbital: one or two valence electrons.',
      p: 'p-block — groups 13–18. The p sublevel is filling; these include the halogens and noble gases.',
      d: 'd-block — the transition metals, where the d sublevel is filling.',
      f: 'f-block — lanthanides and actinides, where the f sublevel is filling.',
    },
    zh: {
      s: 's 區——第 1–2 族。最後一個電子進入 s 軌域：一或兩個價電子。',
      p: 'p 區——第 13–18 族。p 次殼層正在填入；包含鹵素與惰性氣體。',
      d: 'd 區——過渡金屬，d 次殼層正在填入。',
      f: 'f 區——鑭系與錒系元素，f 次殼層正在填入。',
    },
  };

  function paintBlockMap(block) {
    const map = root.querySelector('[data-block-map]');
    if (!map) return;
    const note = map.querySelector('[data-block-note]');
    if (note) note.textContent = BLOCK_NOTES[isZh() ? 'zh' : 'en'][block] || '';
    map.querySelectorAll('[data-block]').forEach((item) => {
      item.classList.toggle('is-on', item.dataset.block === block);
    });
  }

  /* ---------- delegated interactions ---------- */

  function onRootClick(event) {
    const atomStep = event.target.closest('[data-atom-step]');
    if (atomStep) {
      const [key, delta] = atomStep.dataset.atomStep.split(':');
      const limits = { p: [1, 20], n: [0, 30], e: [0, 20] };
      atomState[key] = Math.max(limits[key][0], Math.min(limits[key][1], atomState[key] + Number(delta)));
      paintAtomLab();
      return;
    }

    if (event.target.closest('[data-atom-reset]')) {
      atomState.p = 6;
      atomState.n = 6;
      atomState.e = 6;
      paintAtomLab();
      return;
    }

    const configStep = event.target.closest('[data-config-step]');
    if (configStep) {
      explorerZ = Math.max(1, Math.min(36, explorerZ + Number(configStep.dataset.configStep)));
      paintConfigLab();
      return;
    }

    const block = event.target.closest('[data-block]');
    if (block) {
      paintBlockMap(block.dataset.block);
    }
  }

  function onRootInput(event) {
    if (!event.target.matches('[data-config-range]')) return;
    explorerZ = Number(event.target.value);
    paintConfigLab();
  }

  function enhance() {
    if (!root.dataset.enhanced) {
      root.dataset.enhanced = '1';
      root.addEventListener('click', onRootClick);
      root.addEventListener('input', onRootInput);
    }
    paintAtomLab();
    paintConfigLab();
    paintBlockMap('s');
  }

  function paintLanguage() {
    const label = document.querySelector('[data-course-card="atomic-structure"] .level-head-count');
    if (label) label.textContent = label.textContent;
  }

  render();

  window.SciLampAtomicCourse = {
    render,
    lessons: () => LESSONS.length,
    title: () => L('Atomic Structure and Electron Configuration', '原子結構與電子組態'),
    deck: () => L('Build the atom from its particles, then follow electrons into shells, subshells and orbitals.', '從粒子開始建造原子，再跟著電子進入殼層、次殼層與軌域。'),
    repaint: () => {
      render();
      paintLanguage();
    },
  };
})();
