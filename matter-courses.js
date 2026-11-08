/* Two beginner courses — states of matter and reaction types. Each course
   renders its own reader body with native SVG plates, a cubic-cell explorer,
   practice MCQs and a persisted quiz. */

(() => {
  const I18N = window.SciLampI18n;
  const L = (en, zh) => (I18N?.isZh ? zh : en);
  const pad = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- small markup helpers ---------- */

  const fig = (svg, caption) => `<figure class="sci-figure">${svg}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;

  const table = (head, rows, wide = false) => `<div class="course-table-wrap"><table class="course-table${wide ? ' course-table-wide' : ''}">
    <thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;

  const mcqItem = (item, n, idPrefix, display = n) => `<li class="mcq" data-mcq="${n}" data-answer="${item.answer}" data-hint="${esc(L(item.hint[0], item.hint[1]))}" data-explain="${esc(L(item.explain[0], item.explain[1]))}">
    <div class="mcq-head">
      <span class="mcq-n" aria-hidden="true">${pad(display)}</span>
      <p class="mcq-q" id="${idPrefix}-${n}">${L(item.q[0], item.q[1])}</p>
    </div>
    <div class="mcq-options" role="group" aria-labelledby="${idPrefix}-${n}">
      ${item.options.map((option, j) => `<button class="mcq-opt" type="button" data-choice="${j}"><span class="mcq-key">${'ABCD'[j]}</span><span class="mcq-val">${L(option[0], option[1])}</span></button>`).join('')}
    </div>
    <div class="mcq-feedback" role="status" hidden><span class="mcq-feedback-ico" aria-hidden="true"></span><p></p></div>
  </li>`;

  const practice = (items, prefix) => `<div class="practice-mcq">
    <ol class="mcq-list">${items.map((item, i) => mcqItem(item, 101 + i, `${prefix}-p`, i + 1)).join('')}</ol>
  </div>`;

  function quiz(items, prefix) {
    const list = items.map((item, i) => mcqItem(item, i + 1, `${prefix}-q`, i + 1)).join('');

    return `<div class="mcq-summary">
      <span class="asset-ico asset-ico--edit" aria-hidden="true"></span>
      <div class="mcq-summary-copy">
        <strong>${L('Course checks', '整門課的檢查')}</strong>
        <span>${L('Practice and quiz answers are saved on this device. A wrong choice gives a hint.', '練習與測驗答案保存在此裝置。答錯時會給你提示。')}</span>
      </div>
      <div class="mcq-meter" data-mcq-bar role="progressbar" aria-label="${L('Course questions answered correctly', '答對的課程題數')}" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0"><span data-mcq-fill></span></div>
      <span class="mcq-count" data-mcq-count>0 / 0</span>
    </div>
    <ol class="mcq-list">${list}</ol>
    <div class="mcq-foot">
      <span class="mcq-foot-note" data-mcq-note>${L('Answers are saved on this device.', '答案保存在此裝置。')}</span>
      <button class="course-cta is-quiet" data-mcq-clear type="button">${L('Clear all answers', '清除所有答案')}</button>
    </div>`;
  }

  /* ---------- plates ---------- */

  function statesPlateSVG() {
    const panels = [
      { key: 'solid', label: L('solid', '固體'), x: 14 },
      { key: 'liquid', label: L('liquid', '液體'), x: 186 },
      { key: 'gas', label: L('gas', '氣體'), x: 358 },
      { key: 'plasma', label: L('plasma', '電漿'), x: 530 },
    ];

    const particles = {
      solid: Array.from({ length: 20 }, (_, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        return `<circle cx="${44 + panels[0].x + col * 19}" cy="${62 + row * 19}" r="7.4" fill="var(--cat-a)" fill-opacity="0.55" stroke="var(--cat-a)" stroke-width="1.2"/>`;
      }).join(''),
      liquid: Array.from({ length: 16 }, (_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const jitter = (i % 3) * 3.4;
        return `<circle cx="${40 + panels[1].x + col * 26 + jitter}" cy="${86 + row * 22 + (col % 2) * 4}" r="8" fill="var(--sky)" fill-opacity="0.62" stroke="var(--sky-ink)" stroke-width="1.2"/>`;
      }).join(''),
      gas: [
        [30, 66], [72, 52], [116, 78], [52, 112], [112, 122], [26, 136], [88, 152], [132, 158],
      ].map(([dx, dy], i) => {
        const x = panels[2].x + dx;
        const y = dy;
        const dir = i % 2 ? 1 : -1;
        return `<line x1="${x - 10 * dir}" y1="${y + 7}" x2="${x + 12 * dir}" y2="${y - 5}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 3"/>
          <circle cx="${x}" cy="${y}" r="7" fill="var(--cat-t)" fill-opacity="0.6" stroke="var(--cat-t)" stroke-width="1.2"/>`;
      }).join(''),
      plasma: [
        [52, 74, '+'], [102, 60, '−'], [132, 100, '+'], [66, 116, '−'], [34, 146, '+'], [104, 150, '−'], [132, 154, '+'],
      ].map(([dx, dy, sign]) => {
        const x = panels[3].x + dx;
        return `<circle cx="${x}" cy="${dy}" r="8" fill="var(--blush)" fill-opacity="0.5" stroke="var(--accent)" stroke-width="1.2"/>
          <text x="${x}" y="${dy + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--accent)">${sign}</text>`;
      }).join(''),
    };

    const cards = panels.map((panel) => `<g>
      <rect x="${panel.x}" y="30" width="156" height="150" rx="10" fill="none" stroke="var(--line)" stroke-width="1"/>
      ${particles[panel.key]}
      <text x="${panel.x + 78}" y="198" text-anchor="middle" font-size="12" letter-spacing="1.2" fill="var(--muted)">${panel.label.toUpperCase()}</text>
    </g>`).join('');

    const arrows = [178, 350, 522].map((x) => `<path d="M${x} 104 h14" stroke="var(--muted)" stroke-width="1.4" marker-end="url(#matterArrow)"/>`).join('');

    return `<svg class="sci-chart" viewBox="0 0 700 212" aria-hidden="true">
      ${cards}${arrows}
      <text x="350" y="14" text-anchor="middle" font-size="11" letter-spacing="2" fill="var(--muted)">${L('MORE HEAT → LESS ORDER', '更多熱 → 更少秩序')}</text>
      <defs>
        <marker id="matterArrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--muted)"/></marker>
      </defs>
    </svg>`;
  }

  function unitCellSVG(kind) {
    const x0 = 92;
    const y0 = 64;
    const s = 128;
    const ox = 46;
    const oy = -40;

    const front = `${x0},${y0} ${x0 + s},${y0} ${x0 + s},${y0 + s} ${x0},${y0 + s}`;
    const back = `${x0 + ox},${y0 + oy} ${x0 + s + ox},${y0 + oy} ${x0 + s + ox},${y0 + s + oy} ${x0 + ox},${y0 + s + oy}`;

    const edges = `<polygon points="${front}" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
      <polygon points="${back}" fill="none" stroke="var(--muted)" stroke-width="1"/>
      <path d="M${x0} ${y0} l${ox} ${oy} M${x0 + s} ${y0} l${ox} ${oy} M${x0 + s} ${y0 + s} l${ox} ${oy} M${x0} ${y0 + s} l${ox} ${oy}" stroke="var(--muted)" stroke-width="1"/>`;

    const corner = (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="var(--cat-t)" fill-opacity="0.55" stroke="var(--cat-t)" stroke-width="1.3"/>`;
    let atoms = [
      corner(x0, y0), corner(x0 + s, y0), corner(x0 + s, y0 + s), corner(x0, y0 + s),
      corner(x0 + ox, y0 + oy), corner(x0 + s + ox, y0 + oy), corner(x0 + s + ox, y0 + s + oy), corner(x0 + ox, y0 + s + oy),
    ].join('');

    if (kind === 'bcc') {
      const cx = x0 + s / 2 + ox / 2;
      const cy = y0 + s / 2 + oy / 2;
      atoms += `<circle cx="${cx}" cy="${cy}" r="9" fill="var(--accent)" fill-opacity="0.7" stroke="var(--accent)" stroke-width="1.4"/>`;
    }
    if (kind === 'fcc') {
      const fc = (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="var(--accent)" fill-opacity="0.68" stroke="var(--accent)" stroke-width="1.3"/>`;
      atoms += [
        fc(x0 + s / 2, y0), fc(x0 + s / 2, y0 + s),
        fc(x0, y0 + s / 2), fc(x0 + s, y0 + s / 2),
        fc(x0 + s / 2 + ox, y0 + oy), fc(x0 + s / 2 + ox, y0 + s + oy),
      ].join('');
    }

    const tag = { sc: 'SC', bcc: 'BCC', fcc: 'FCC' }[kind];
    return `<svg class="sci-chart" viewBox="0 0 340 300" aria-hidden="true">
      ${edges}${atoms}
      <text x="170" y="278" text-anchor="middle" font-size="12" letter-spacing="2" fill="var(--muted)">${tag}</text>
    </svg>`;
  }

  function liquidSVG() {
    let molecules = '';
    const rows = [
      [90, 232], [126, 244], [162, 236], [198, 248], [234, 240], [270, 250], [306, 238], [342, 246], [378, 234], [414, 246], [450, 238], [486, 248],
      [108, 264], [144, 272], [180, 262], [216, 274], [252, 266], [288, 276], [324, 264], [360, 272], [396, 262], [432, 274], [468, 266],
    ];
    molecules = rows.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7.5" fill="var(--sky)" fill-opacity="0.62" stroke="var(--sky-ink)" stroke-width="1.1"/>${i % 4 === 0 ? `<line x1="${x + 7}" y1="${y}" x2="${x + 15}" y2="${y - 4}" stroke="var(--sky-ink)" stroke-width="1"/>` : ''}`).join('');

    const vapour = [[150, 108], [250, 88], [352, 104], [448, 122], [520, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="var(--cat-t)" fill-opacity="0.55" stroke="var(--cat-t)" stroke-width="1"/>`).join('');

    return `<svg class="sci-chart" viewBox="0 0 620 330" aria-hidden="true">
      <rect x="58" y="34" width="504" height="258" rx="10" fill="none" stroke="var(--ink)" stroke-width="1.4"/>
      <line x1="58" y1="226" x2="562" y2="226" stroke="var(--sky-ink)" stroke-width="1.4"/>
      ${molecules}${vapour}
      <path d="M212 206 C200 182 206 160 220 138" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="4 4" marker-end="url(#vapArrow)"/>
      <path d="M386 138 C400 160 396 182 386 204" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="4 4" marker-end="url(#condArrow)"/>
      <text x="240" y="120" font-size="12" fill="var(--accent)">${L('escape', '逃逸')}</text>
      <text x="404" y="120" font-size="12" fill="var(--muted)">${L('condense', '凝結')}</text>
      <text x="310" y="318" text-anchor="middle" font-size="12" fill="var(--muted)">${L('liquid ⇌ vapour — dynamic equilibrium', '液體 ⇌ 蒸氣——動態平衡')}</text>
      <defs>
        <marker id="vapArrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--accent)"/></marker>
        <marker id="condArrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--muted)"/></marker>
      </defs>
    </svg>`;
  }

  function heatingCurveSVG() {
    const left = 64;
    const top = 34;
    const bottom = 292;
    const right = 690;

    const points = [
      [left, bottom], [150, 214], [262, 214], [430, 136], [566, 136], [right, 58],
    ];
    const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');

    const zone = (x, y, n) => `<circle cx="${x}" cy="${y}" r="13" fill="var(--paper-2)" stroke="var(--line)"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--ink)">${n}</text>`;
    const guide = (x) => `<line x1="${x}" y1="${bottom}" x2="${x}" y2="214" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 4"/>`;
    const guide2 = (x) => `<line x1="${x}" y1="${bottom}" x2="${x}" y2="136" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 4"/>`;

    return `<svg class="sci-chart" viewBox="0 0 720 330" aria-hidden="true">
      ${guide(150)}${guide(262)}${guide2(430)}${guide2(566)}
      <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
      <line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="var(--ink)" stroke-width="1.2" marker-end="url(#heatArrow)"/>
      <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="var(--ink)" stroke-width="1.2" marker-end="url(#heatArrow)"/>
      ${zone(108, 252, 1)}${zone(206, 190, 2)}${zone(348, 172, 3)}${zone(498, 112, 4)}${zone(628, 92, 5)}
      <text x="${left + 22}" y="${top + 6}" font-size="12" fill="var(--ink)">${L('temperature', '溫度')}</text>
      <text x="${right - 10}" y="${bottom + 24}" text-anchor="end" font-size="12" fill="var(--ink)">${L('heat added →', '加入的熱 →')}</text>
      <text x="272" y="206" font-size="11" fill="var(--muted)">${L('melting', '熔化')}</text>
      <text x="576" y="128" font-size="11" fill="var(--muted)">${L('boiling', '沸騰')}</text>
      <text x="92" y="188" font-size="11" fill="var(--accent)">${L('solid', '固體')}</text>
      <text x="330" y="118" font-size="11" fill="var(--sky-ink)">${L('liquid', '液體')}</text>
      <text x="600" y="46" font-size="11" fill="var(--cat-t)">${L('gas', '氣體')}</text>
      <defs>
        <marker id="heatArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--ink)"/></marker>
      </defs>
    </svg>`;
  }

  function phaseDiagramSVG() {
    const left = 70;
    const top = 30;
    const bottom = 330;
    const right = 690;

    const triple = [300, 268];
    const critical = [610, 108];

    return `<svg class="sci-chart" viewBox="0 0 720 380" aria-hidden="true">
      <rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" fill="none" stroke="var(--line)"/>
      <path d="M96 330 L${triple[0]} ${triple[1]}" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <path d="M${triple[0]} ${triple[1]} L${critical[0]} ${critical[1]}" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <path d="M${triple[0]} ${triple[1]} L282 40" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <path d="M${triple[0]} ${triple[1]} L450 40" fill="none" stroke="var(--muted)" stroke-width="1.4" stroke-dasharray="5 5"/>
      <line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="var(--ink)" stroke-width="1.2"/>
      <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="var(--ink)" stroke-width="1.2"/>
      <line x1="${left}" y1="292" x2="${right}" y2="292" stroke="var(--muted)" stroke-width="1" stroke-dasharray="4 5"/>
      <text x="${left - 12}" y="${bottom + 4}" text-anchor="end" font-size="12" fill="var(--muted)">0</text>
      <text x="${left - 12}" y="296" text-anchor="end" font-size="11" fill="var(--muted)">1 atm</text>
      <text x="34" y="${top + 150}" font-size="12" fill="var(--ink)" transform="rotate(-90 34 ${top + 150})">${L('pressure', '壓力')}</text>
      <text x="${right - 6}" y="${bottom + 24}" text-anchor="end" font-size="12" fill="var(--ink)">${L('temperature →', '溫度 →')}</text>
      <text x="176" y="140" font-size="14" letter-spacing="2" fill="var(--ink)">${L('SOLID', '固體')}</text>
      <text x="462" y="150" font-size="14" letter-spacing="2" fill="var(--ink)">${L('LIQUID', '液體')}</text>
      <text x="388" y="316" font-size="14" letter-spacing="2" fill="var(--ink)">${L('GAS', '氣體')}</text>
      <text x="636" y="74" text-anchor="end" font-size="10" fill="var(--muted)">${L('supercritical', '超臨界')}</text>
      <circle cx="${triple[0]}" cy="${triple[1]}" r="5" fill="var(--accent)" stroke="var(--paper)" stroke-width="2"/>
      <text x="${triple[0] - 8}" y="${triple[1] + 24}" text-anchor="middle" font-size="11" fill="var(--accent)">${L('triple point', '三相點')}</text>
      <circle cx="${critical[0]}" cy="${critical[1]}" r="5" fill="var(--sky-ink)" stroke="var(--paper)" stroke-width="2"/>
      <text x="${critical[0] - 60}" y="${critical[1] - 14}" font-size="11" fill="var(--sky-ink)">${L('critical point', '臨界點')}</text>
      <text x="150" y="364" font-size="11" fill="var(--muted)">${L('water: melting curve leans left', '水：熔化曲線向左傾')}</text>
      <text x="500" y="364" font-size="11" fill="var(--muted)">${L('CO₂: triple point above 1 atm', 'CO₂：三相點高於 1 atm')}</text>
      <defs>
        <marker id="pdArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--ink)"/></marker>
      </defs>
    </svg>`;
  }

  /* ---------- states course data ---------- */

  const STATE_TABS = [
    {
      key: 'sc', label: 'SC', atoms: '1', coord: '6', pack: '52%',
      example: ['Polonium (Po)', '釙（Po）'],
      note: ['Corners only — each corner atom is shared by eight cells, so 8 × ⅛ = 1 atom per cell.', '只有頂角——每個頂角原子由八個晶胞共用，所以 8 × ⅛ = 每晶胞 1 個原子。'],
    },
    {
      key: 'bcc', label: 'BCC', atoms: '2', coord: '8', pack: '68%',
      example: ['Iron (Fe), sodium (Na)', '鐵（Fe）、鈉（Na）'],
      note: ['Corners plus one atom at the body centre: 1 + 1 = 2 atoms per cell.', '頂角加上體心的一個原子：1 + 1 = 每晶胞 2 個原子。'],
    },
    {
      key: 'fcc', label: 'FCC', atoms: '4', coord: '12', pack: '74%',
      example: ['Copper (Cu), gold (Au)', '銅（Cu）、金（Au）'],
      note: ['Corners plus six face centres: 1 + 3 = 4 atoms per cell. FCC and HCP tie for the closest packing.', '頂角加上六個面心：1 + 3 = 每晶胞 4 個原子。FCC 與 HCP 並列最密堆積。'],
    },
  ];

  function unitCellTabs() {
    return `<div class="sci-tabs" data-sci-tabs>
      <div class="sci-tablist" role="tablist" aria-label="${L('Pick a cubic unit cell', '選擇一種立方晶胞')}">
        ${STATE_TABS.map((cell, i) => `<button class="sci-tab${i === 0 ? ' is-on' : ''}" type="button" role="tab" id="sm-cell-tab-${cell.key}" aria-selected="${i === 0}" aria-controls="sm-cell-panel-${cell.key}" tabindex="${i === 0 ? 0 : -1}" data-sci-tab="${cell.key}">${cell.label}</button>`).join('')}
      </div>
      <div class="sci-tabpanels">
        ${STATE_TABS.map((cell, i) => `<div class="sci-tabpanel${i === 0 ? ' is-on' : ''}" id="sm-cell-panel-${cell.key}" role="tabpanel" aria-labelledby="sm-cell-tab-${cell.key}" data-sci-panel="${cell.key}"${i === 0 ? '' : ' hidden'}>
          <figure class="sci-figure">${unitCellSVG(cell.key)}<figcaption>${L(`${cell.label} unit cell — coloured spheres mark interior and face-centre atoms.`, `${cell.label} 晶胞——彩色球標出內部與面心原子。`)}</figcaption></figure>
          <dl class="sci-tab-stats">
            <div><dt>${L('Atoms per cell', '每晶胞原子數')}</dt><dd>${cell.atoms}</dd></div>
            <div><dt>${L('Coordination', '配位數')}</dt><dd>${cell.coord}</dd></div>
            <div><dt>${L('Packing', '堆積效率')}</dt><dd>${cell.pack}</dd></div>
            <div><dt>${L('Example', '例子')}</dt><dd>${L(cell.example[0], cell.example[1])}</dd></div>
          </dl>
          <p class="sci-tab-note">${L(cell.note[0], cell.note[1])}</p>
        </div>`).join('')}
      </div>
    </div>`;
  }

  const STATES_PRACTICE = [
    {
      q: ['Classify ice (H₂O solid).', '把冰（固態 H₂O）分類。'],
      options: [['Ionic', '離子'], ['Molecular', '分子'], ['Covalent network', '共價網狀'], ['Metallic', '金屬']],
      answer: 1,
      hint: ['What particles sit at the lattice points — ions, molecules or atoms?', '晶格點上放的是離子、分子還是原子？'],
      explain: ['Ice is a molecular solid: H₂O molecules are held by hydrogen bonds, not by an ionic lattice.', '冰是分子固體：H₂O 分子靠氫鍵相吸，不是離子晶格。'],
    },
    {
      q: ['How many atoms are in one FCC unit cell?', '一個 FCC 晶胞含有幾個原子？'],
      options: [['1', '1'], ['2', '2'], ['4', '4'], ['8', '8']],
      answer: 2,
      hint: ['Count corners (8 × ⅛) and face centres (6 × ½).', '算頂角（8 × ⅛）與面心（6 × ½）。'],
      explain: ['FCC: 8 corners × ⅛ + 6 faces × ½ = 1 + 3 = 4 atoms per cell.', 'FCC：8 個頂角 × ⅛ + 6 個面心 × ½ = 1 + 3 = 4 個原子。'],
    },
    {
      q: ['Which has the higher melting point: NaCl or I₂?', '哪一個熔點較高：NaCl 還是 I₂？'],
      options: [['I₂ — larger molecules melt higher', 'I₂——分子較大，熔點較高'], ['NaCl — ionic lattice forces are much stronger', 'NaCl——離子晶格作用力強得多'], ['They are equal', '兩者相同'], ['Impossible to compare', '無法比較']],
      answer: 1,
      hint: ['Compare what holds the particles together, not the particle size.', '比較把粒子聚在一起的作用力，而不是粒子大小。'],
      explain: ['NaCl must break a full ionic lattice; I₂ only overcomes weak dispersion forces between molecules.', 'NaCl 要打斷完整的離子晶格；I₂ 只需克服分子間微弱的色散力。'],
    },
    {
      q: ['Name the change: gas → solid.', '說出這個變化：氣體 → 固體。'],
      options: [['Melting', '熔化'], ['Condensation', '凝結'], ['Deposition', '凝華'], ['Sublimation', '昇華']],
      answer: 2,
      hint: ['Going straight from gas to solid skips the liquid.', '由氣體直接到固體，跳過液體。'],
      explain: ['Gas → solid is deposition; the reverse, solid → gas, is sublimation.', '氣體 → 固體是凝華；相反方向固體 → 氣體是昇華。'],
    },
    {
      q: ['Energy needed to melt 50.0 g of ice at 0 °C? (ΔH_fus = 6.01 kJ/mol)', '在 0 °C 熔化 50.0 g 冰需要多少能量？（ΔH_fus = 6.01 kJ/mol）'],
      options: [['8.35 kJ', '8.35 kJ'], ['16.7 kJ', '16.7 kJ'], ['33.4 kJ', '33.4 kJ'], ['6.01 kJ', '6.01 kJ']],
      answer: 1,
      hint: ['Convert grams to moles first (M = 18.02 g/mol), then use q = nΔH.', '先把克換成莫耳（M = 18.02 g/mol），再用 q = nΔH。'],
      explain: ['n = 50.0 / 18.02 = 2.77 mol; q = 2.77 × 6.01 = 16.7 kJ.', 'n = 50.0 / 18.02 = 2.77 mol；q = 2.77 × 6.01 = 16.7 kJ。'],
    },
    {
      q: ['Energy needed to vaporize 25.0 g of water at 100 °C? (ΔH_vap = 40.7 kJ/mol)', '在 100 °C 汽化 25.0 g 水需要多少能量？（ΔH_vap = 40.7 kJ/mol）'],
      options: [['18.8 kJ', '18.8 kJ'], ['40.7 kJ', '40.7 kJ'], ['56.5 kJ', '56.5 kJ'], ['113 kJ', '113 kJ']],
      answer: 2,
      hint: ['n = 25.0 / 18.02 ≈ 1.39 mol.', 'n = 25.0 / 18.02 ≈ 1.39 mol。'],
      explain: ['q = 1.39 × 40.7 = 56.5 kJ — vaporization costs far more than melting.', 'q = 1.39 × 40.7 = 56.5 kJ——汽化所需的能量遠比熔化多。'],
    },
    {
      q: ['Why does temperature stay constant during melting?', '為什麼熔化時溫度保持不變？'],
      options: [['Heat is not entering the solid', '熱沒有進入固體'], ['Added energy breaks IMFs instead of raising average kinetic energy', '加入的能量用來打斷分子間作用力，而不是提高平均動能'], ['The particles stop moving', '粒子停止運動'], ['The thermometer is saturated', '溫度計飽和了']],
      answer: 1,
      hint: ['Where does the energy go if not into motion?', '如果能量不是用來增加運動，那去了哪裡？'],
      explain: ['The energy goes into overcoming intermolecular forces, so the average kinetic energy — and temperature — holds steady.', '能量用於克服分子間作用力，因此平均動能——也就是溫度——維持不變。'],
    },
    {
      q: ['At 1 atm, what does CO₂ do on warming?', '在 1 atm 下，CO₂ 升溫時會怎樣？'],
      options: [['Melts to a liquid', '熔化成液體'], ['Sublimes straight to gas', '直接昇華成氣體'], ['Stays solid', '保持固體'], ['Becomes plasma', '變成電漿']],
      answer: 1,
      hint: ['CO₂’s triple point is at 5.11 atm — above ordinary air pressure.', 'CO₂ 的三相點在 5.11 atm——高於一般大氣壓。'],
      explain: ['Because the triple point lies above 1 atm, the liquid phase is not stable at ordinary pressure: dry ice sublimes.', '因為三相點高於 1 atm，液態在常壓下不穩定：乾冰直接昇華。'],
    },
  ];

  const STATES_QUIZ = [
    {
      q: ['Solid particles…', '固體粒子……'],
      options: [['move freely', '自由移動'], ['slide past each other', '互相滑動'], ['vibrate in place', '原地振動'], ['are ionised', '被游離']],
      answer: 2,
      hint: ['A solid keeps its shape.', '固體保持形狀。'],
      explain: ['Solids vibrate around fixed positions; the lattice holds them in place.', '固體粒子在固定位置附近振動；晶格把它們固定在原位。'],
    },
    {
      q: ['Temperature measures…', '溫度測量的是……'],
      options: [['total heat content', '總熱量'], ['average kinetic energy', '平均動能'], ['number of particles', '粒子數'], ['bond strength', '鍵強度']],
      answer: 1,
      hint: ['A thermometer responds to particle motion.', '溫度計對粒子運動有反應。'],
      explain: ['Temperature is a measure of the average kinetic energy of the particles.', '溫度是粒子平均動能的度量。'],
    },
    {
      q: ['Which is an amorphous solid?', '哪一個是非晶質固體？'],
      options: [['NaCl', 'NaCl'], ['Diamond', '鑽石'], ['Glass', '玻璃'], ['Quartz', '石英']],
      answer: 2,
      hint: ['Its particles lack a long-range repeating order.', '它的粒子缺乏長程重複秩序。'],
      explain: ['Glass is amorphous: it softens over a range instead of melting sharply.', '玻璃是非晶質：它在一個溫度範圍內軟化，而不是在固定溫度熔化。'],
    },
    {
      q: ['Coordination number of a simple cubic (SC) cell?', '簡單立方（SC）晶胞的配位數是多少？'],
      options: [['4', '4'], ['6', '6'], ['8', '8'], ['12', '12']],
      answer: 1,
      hint: ['Each corner touches six neighbours — one along each axis.', '每個頂角與六個鄰居相接——每個軸向各一。'],
      explain: ['SC: 6 nearest neighbours, 1 atom per cell, 52% packing.', 'SC：6 個最近鄰、每晶胞 1 個原子、堆積效率 52%。'],
    },
    {
      q: ['Rank the packings: which is correct?', '堆積效率的排序，哪一個正確？'],
      options: [['FCC < BCC < SC', 'FCC < BCC < SC'], ['SC < BCC < FCC', 'SC < BCC < FCC'], ['BCC < SC < FCC', 'BCC < SC < FCC'], ['All are equal', '三者相同']],
      answer: 1,
      hint: ['Simple cubic leaves the most empty space.', '簡單立方留下的空隙最多。'],
      explain: ['SC 52% < BCC 68% < FCC 74%.', 'SC 52% < BCC 68% < FCC 74%。'],
    },
    {
      q: ['A liquid boils when…', '液體沸騰的時候是……'],
      options: [['its vapor pressure equals external pressure', '蒸氣壓等於外界壓力'], ['vapor pressure reaches zero', '蒸氣壓降為零'], ['all IMFs disappear', '所有分子間作用力消失'], ['it reaches 100 °C', '溫度達到 100 °C']],
      answer: 0,
      hint: ['At altitude, water boils below 100 °C.', '在高海拔，水在 100 °C 以下就沸騰。'],
      explain: ['Boiling happens when vapor pressure matches the external pressure; the normal boiling point is defined at 1 atm.', '當蒸氣壓等於外界壓力時就沸騰；正常沸點定義在 1 atm。'],
    },
    {
      q: ['Which phase change is exothermic?', '哪一個相變是放熱的？'],
      options: [['Melting', '熔化'], ['Sublimation', '昇華'], ['Vaporization', '汽化'], ['Condensation', '凝結']],
      answer: 3,
      hint: ['Going toward a more ordered state releases energy.', '趨向更有序的狀態會釋放能量。'],
      explain: ['Condensation (gas → liquid) releases energy; the three endothermic changes all go toward greater disorder.', '凝結（氣體 → 液體）釋放能量；其他三個吸熱變化都朝向更大的無序。'],
    },
    {
      q: ['Which relationship is correct?', '哪一個關係式正確？'],
      options: [['ΔH_sub = ΔH_fus − ΔH_vap', 'ΔH_sub = ΔH_fus − ΔH_vap'], ['ΔH_sub ≈ ΔH_fus + ΔH_vap', 'ΔH_sub ≈ ΔH_fus + ΔH_vap'], ['ΔH_vap ≈ ΔH_fus', 'ΔH_vap ≈ ΔH_fus'], ['ΔH_fus = ΔH_vap + ΔH_sub', 'ΔH_fus = ΔH_vap + ΔH_sub']],
      answer: 1,
      hint: ['Sublimation can be split into melting then vaporizing.', '昇華可拆成先熔化再汽化。'],
      explain: ['Solid → liquid → gas makes ΔH_sub ≈ ΔH_fus + ΔH_vap (water: 6.01 + 40.7 ≈ 46.7 kJ/mol).', '固體 → 液體 → 氣體，所以 ΔH_sub ≈ ΔH_fus + ΔH_vap（水：6.01 + 40.7 ≈ 46.7 kJ/mol）。'],
    },
    {
      q: ['Why does water’s melting curve slope left?', '為什麼水的熔化曲線向左傾？'],
      options: [['Ice is denser than water', '冰比水密'], ['Ice is less dense, so pressure favours the liquid', '冰密度較小，所以壓力有利於液體'], ['Water has no triple point', '水沒有三相點'], ['Steam is denser than water', '蒸氣比水密']],
      answer: 1,
      hint: ['Think about which phase shrinks when you squeeze it.', '想想壓縮時哪個相會收縮。'],
      explain: ['Ice is less dense than liquid water, so increasing pressure favours the denser liquid and lowers the melting point.', '冰的密度小於液態水，所以加壓有利於密度較大的液體，並降低熔點。'],
    },
    {
      q: ['The flat parts of a heating curve show…', '加熱曲線的平坦部分顯示……'],
      options: [['temperature rising slowly', '溫度緩慢上升'], ['no heat being added', '沒有加入熱'], ['a phase change at constant temperature', '恆溫下的相變'], ['a chemical reaction', '化學反應']],
      answer: 2,
      hint: ['Energy is going into IMFs, not motion.', '能量用於分子間作用力，而非運動。'],
      explain: ['The plateaus are melting and boiling: heat is absorbed while the temperature stays constant.', '平台就是熔化與沸騰：吸收熱量但溫度不變。'],
    },
  ];

  /* ---------- reaction course data ---------- */

  function flowSVG() {
    const box = (x, y, w, h, lines, tone = 'line') => `<g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${tone === 'accent' ? 'var(--butter)' : 'var(--white)'}" fill-opacity="${tone === 'accent' ? '0.7' : '0.6'}" stroke="${tone === 'accent' ? 'var(--butter-ink)' : 'var(--line)'}" stroke-width="1.2"/>
      ${lines.map((line, i) => `<text x="${x + w / 2}" y="${y + 20 + i * 15}" text-anchor="middle" font-size="${i === 0 ? 12 : 11}" font-weight="${i === lines.length - 1 ? 600 : 400}" fill="var(--ink)">${line}</text>`).join('')}
    </g>`;

    const arrow = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--muted)" stroke-width="1.2" marker-end="url(#flowArrow)"/>`;

    return `<svg class="sci-chart" viewBox="0 0 720 470" aria-hidden="true">
      ${box(240, 8, 240, 44, [L('How many reactants?', '反應物有幾個？')], 'accent')}
      ${arrow(300, 52, 160, 92)}
      ${arrow(420, 52, 520, 92)}
      ${box(70, 92, 180, 44, [L('One reactant', '一個反應物')])}
      ${arrow(160, 136, 160, 178)}
      ${box(70, 178, 180, 46, [L('AB → A + B', 'AB → A + B'), L('Decomposition', '分解')])}

      ${box(430, 92, 190, 44, [L('Two or more reactants', '兩個以上反應物')])}
      ${arrow(525, 136, 525, 170)}
      ${box(390, 170, 150, 58, [L('O₂ in; CO₂ + H₂O out', 'O₂ 進；CO₂ + H₂O 出'), L('Combustion', '燃燒')])}
      ${box(552, 170, 150, 58, [L('Two compounds', '兩個化合物'), L('Double replacement', '雙取代')])}
      ${box(390, 270, 150, 58, [L('Element + compound', '元素 + 化合物'), L('Single replacement', '單取代')])}
      ${box(552, 270, 150, 58, [L('Two elements', '兩個元素'), L('Synthesis', '合成')])}
      ${arrow(548, 228, 520, 270)}
      ${arrow(590, 228, 598, 270)}
      ${box(70, 270, 250, 74, [L('Special cases of double replacement', '雙取代的特例'), L('Acid + base → salt + water', '酸 + 鹼 → 鹽 + 水'), L('Ions → insoluble solid', '離子 → 不溶固體')])}
      ${arrow(340, 325, 480, 325)}
      <text x="360" y="418" text-anchor="middle" font-size="11.5" fill="var(--muted)">${L('Then ask: did any oxidation number change?', '接著問：有氧化數改變嗎？')}</text>
      <text x="360" y="440" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--accent)">${L('If yes, the reaction is also redox.', '若有，這個反應同時也是氧化還原。')}</text>
      <defs>
        <marker id="flowArrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--muted)"/></marker>
      </defs>
    </svg>`;
  }

  const REACTIONS_PRACTICE = [
    {
      q: ['Which observation alone does NOT prove a chemical reaction?', '哪一個現象單獨出現時不能證明發生化學反應？'],
      options: [['Bubbles of a new gas', '冒出新的氣體'], ['A precipitate forming', '生成沉澱'], ['Sugar dissolving in water', '糖溶於水'], ['A colour change', '顏色改變']],
      answer: 2,
      hint: ['Dissolving can happen without forming a new substance.', '溶解可能不生成新物質。'],
      explain: ['Dissolving sugar is physical: the sugar is still sugar. A reaction needs a new substance with new properties.', '糖溶解是物理變化：糖還是糖。化學反應需要生成具有新性質的新物質。'],
    },
    {
      q: ['Balance: __ C₄H₁₀ + __ O₂ → __ CO₂ + __ H₂O', '平衡：__ C₄H₁₀ + __ O₂ → __ CO₂ + __ H₂O'],
      options: [['1, 6, 4, 5', '1, 6, 4, 5'], ['2, 13, 8, 10', '2, 13, 8, 10'], ['1, 13, 8, 5', '1, 13, 8, 5'], ['2, 12, 8, 10', '2, 12, 8, 10']],
      answer: 1,
      hint: ['C: 4 → 4 CO₂; H: 10 → 5 H₂O; then count O.', 'C：4 → 4 CO₂；H：10 → 5 H₂O；再數 O。'],
      explain: ['4 CO₂ + 5 H₂O need 13 O atoms; doubling clears the fraction: 2 C₄H₁₀ + 13 O₂ → 8 CO₂ + 10 H₂O.', '4 CO₂ + 5 H₂O 需要 13 個 O 原子；乘以 2 消去分數：2 C₄H₁₀ + 13 O₂ → 8 CO₂ + 10 H₂O。'],
    },
    {
      q: ['Classify: CaCO₃ → CaO + CO₂ (heated)', '分類：CaCO₃ → CaO + CO₂（加熱）'],
      options: [['Synthesis', '合成'], ['Decomposition', '分解'], ['Combustion', '燃燒'], ['Single replacement', '單取代']],
      answer: 1,
      hint: ['One reactant becomes two products.', '一個反應物變成兩個產物。'],
      explain: ['One compound breaks apart on heating — decomposition, the reverse of synthesis.', '一個化合物受熱分解——分解反應，是合成的逆反應。'],
    },
    {
      q: ['Why does Zn + CuSO₄ react, but Cu + ZnSO₄ does not?', '為什麼 Zn + CuSO₄ 會反應，而 Cu + ZnSO₄ 不會？'],
      options: [['Zinc is above copper in the activity series', '鋅在活性序列中位於銅之上'], ['Copper is more reactive than zinc', '銅比鋅活潑'], ['Zinc is a non-metal', '鋅是非金屬'], ['Copper sulfate is insoluble', '硫酸銅不溶']],
      answer: 0,
      hint: ['A metal can displace one below it on the activity series.', '金屬可以置換活性序列中位於其下方的金屬。'],
      explain: ['Zn is above Cu, so Zn displaces Cu²⁺; Cu sits below Zn and cannot displace Zn²⁺.', 'Zn 在 Cu 之上，所以 Zn 可置換 Cu²⁺；Cu 在 Zn 之下，無法置換 Zn²⁺。'],
    },
    {
      q: ['Classify: AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)', '分類：AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)'],
      options: [['Synthesis', '合成'], ['Decomposition', '分解'], ['Single replacement', '單取代'], ['Double replacement (precipitation)', '雙取代（沉澱）']],
      answer: 3,
      hint: ['The ions swap partners and a solid appears.', '離子交換夥伴，並出現固體。'],
      explain: ['Cations and anions swap partners and AgCl precipitates — a double replacement driven by an insoluble product.', '陽離子與陰離子交換夥伴，AgCl 沉澱——由不溶產物驅動的雙取代反應。'],
    },
    {
      q: ['Incomplete combustion of methane mainly produces…', '甲烷不完全燃燒主要產生……'],
      options: [['CO₂ and H₂O only', '只有 CO₂ 與 H₂O'], ['CO (and possibly soot) plus H₂O', 'CO（可能還有碳黑）與 H₂O'], ['H₂ and O₂', 'H₂ 與 O₂'], ['O₃', 'O₃']],
      answer: 1,
      hint: ['Limited oxygen leaves carbon partly oxidised.', '氧氣不足使碳只被部分氧化。'],
      explain: ['With limited O₂, carbon is not fully oxidised: CO is toxic and soot can form.', '氧氣不足時，碳沒有完全氧化：生成有毒的 CO，也可能產生碳黑。'],
    },
    {
      q: ['Classify: HCl + NaOH → NaCl + H₂O', '分類：HCl + NaOH → NaCl + H₂O'],
      options: [['Acid–base neutralisation', '酸鹼中和'], ['Combustion', '燃燒'], ['Decomposition', '分解'], ['Precipitation', '沉澱']],
      answer: 0,
      hint: ['Acid + base gives a salt and water.', '酸 + 鹼生成鹽與水。'],
      explain: ['H⁺ and OH⁻ combine to form water: an acid–base neutralisation.', 'H⁺ 與 OH⁻ 結合生成水：酸鹼中和。'],
    },
    {
      q: ['What is the oxidation number of Cl in NaCl?', 'NaCl 中 Cl 的氧化數是多少？'],
      options: [['0', '0'], ['+1', '+1'], ['−1', '−1'], ['+7', '+7']],
      answer: 2,
      hint: ['Na⁺ balances the charge; the compound is neutral overall.', 'Na⁺ 平衡電荷；整個化合物電中性。'],
      explain: ['Na is +1, so Cl must be −1 to keep the compound neutral.', 'Na 是 +1，所以 Cl 必須是 −1，才能保持化合物電中性。'],
    },
  ];

  const REACTIONS_QUIZ = [
    {
      q: ['The law of conservation of mass says atoms are…', '質量守恆定律說明原子……'],
      options: [['created in reactions', '在反應中被創造'], ['destroyed in reactions', '在反應中被消滅'], ['rearranged but never created or destroyed', '重新排列，但從不被創造或消滅'], ['converted into energy', '轉換成能量']],
      answer: 2,
      hint: ['Balance the equation and count each element.', '平衡方程式後數一數每種元素。'],
      explain: ['Atoms are rearranged during a reaction; the total mass of reactants equals the mass of products.', '反應中原子只是重新排列；反應物質量總和等於產物質量總和。'],
    },
    {
      q: ['In 2 H₂ + O₂ → 2 H₂O, the coefficient “2” in front of H₂ tells you…', '在 2 H₂ + O₂ → 2 H₂O 中，H₂ 前面的係數「2」表示……'],
      options: [['two atoms of H', '兩個 H 原子'], ['two moles of H₂ molecules', '兩莫耳的 H₂ 分子'], ['two grams of hydrogen', '兩克氫'], ['a subscript of H', 'H 的下標']],
      answer: 1,
      hint: ['Coefficients count particles, not mass.', '係數數的是粒子，不是質量。'],
      explain: ['A coefficient counts moles (or formula units) of the substance; you may change coefficients, never subscripts.', '係數表示該物質的莫耳（或式量單位）數；可以改係數，絕不能改下標。'],
    },
    {
      q: ['Classify: N₂ + 3 H₂ → 2 NH₃', '分類：N₂ + 3 H₂ → 2 NH₃'],
      options: [['Synthesis', '合成'], ['Decomposition', '分解'], ['Combustion', '燃燒'], ['Double replacement', '雙取代']],
      answer: 0,
      hint: ['Two elements combine into one product.', '兩個元素結合成一個產物。'],
      explain: ['Two reactants form one product — a synthesis (combination) reaction.', '兩個反應物生成一個產物——合成（化合）反應。'],
    },
    {
      q: ['Classify: 2 H₂O → 2 H₂ + O₂ (electrolysis)', '分類：2 H₂O → 2 H₂ + O₂（電解）'],
      options: [['Synthesis', '合成'], ['Decomposition', '分解'], ['Single replacement', '單取代'], ['Neutralisation', '中和']],
      answer: 1,
      hint: ['Electricity splits one compound into elements.', '電將一個化合物拆成元素。'],
      explain: ['One compound is broken into two simpler substances by electrolysis — decomposition.', '一個化合物被電解成兩個較簡單的物質——分解。'],
    },
    {
      q: ['Which halogen displacement works?', '哪一個鹵素置換反應會發生？'],
      options: [['Br₂ + 2 KCl → 2 KBr + Cl₂', 'Br₂ + 2 KCl → 2 KBr + Cl₂'], ['Cl₂ + 2 KBr → 2 KCl + Br₂', 'Cl₂ + 2 KBr → 2 KCl + Br₂'], ['I₂ + 2 KBr → 2 KI + Br₂', 'I₂ + 2 KBr → 2 KI + Br₂'], ['Br₂ + 2 KF → 2 KBr + F₂', 'Br₂ + 2 KF → 2 KBr + F₂']],
      answer: 1,
      hint: ['Reactivity order: F₂ > Cl₂ > Br₂ > I₂.', '活性順序：F₂ > Cl₂ > Br₂ > I₂。'],
      explain: ['Chlorine is above bromine, so it displaces Br⁻; the others would need a halogen to displace something above it.', '氯在溴之上，所以能置換 Br⁻；其他選項都需要置換更上面的鹵素。'],
    },
    {
      q: ['Double replacement usually needs a driving force. Which is NOT one?', '雙取代通常需要驅動力。下列哪一項不是？'],
      options: [['A precipitate forms', '生成沉澱'], ['A gas forms', '生成氣體'], ['Water forms', '生成水'], ['All products stay soluble ions', '所有產物都是可溶離子']],
      answer: 3,
      hint: ['If nothing leaves the solution, the ions just mix.', '如果沒有東西離開溶液，離子只是混在一起。'],
      explain: ['With only soluble spectator ions there is no net reaction; a precipitate, gas or water is needed to drive it.', '若只有可溶的旁觀離子，就沒有淨反應；需要沉澱、氣體或水來驅動。'],
    },
    {
      q: ['Complete combustion of propane: C₃H₈ + __ O₂ → 3 CO₂ + 4 H₂O. The blank is…', '丙烷完全燃燒：C₃H₈ + __ O₂ → 3 CO₂ + 4 H₂O。空格是……'],
      options: [['3', '3'], ['5', '5'], ['7', '7'], ['4', '4']],
      answer: 1,
      hint: ['Count oxygen on the right: 6 + 4 = 10.', '數右邊的氧：6 + 4 = 10。'],
      explain: ['3 CO₂ + 4 H₂O need 10 O atoms, so 5 O₂.', '3 CO₂ + 4 H₂O 需要 10 個 O 原子，所以是 5 O₂。'],
    },
    {
      q: ['OIL RIG means…', 'OIL RIG 的意思是……'],
      options: [['Oxidation Is Loss of electrons, Reduction Is Gain', '氧化是失去電子，還原是得到電子'], ['Oxygen Is Lost, Radicals Increase Gain', '氧被失去，自由基增加'], ['Oxidation Is Gain, Reduction Is Loss', '氧化是得到電子，還原是失去電子'], ['Only Ionic Liquids React In Gases', '只有離子液體在氣體中反應']],
      answer: 0,
      hint: ['The species oxidised gives electrons away.', '被氧化的物質把電子交出去。'],
      explain: ['Oxidation is loss of electrons (oxidation number rises); reduction is gain.', '氧化是失去電子（氧化數上升）；還原是得到電子。'],
    },
    {
      q: ['The oxidising agent is the species that…', '氧化劑是……的物質'],
      options: [['gains electrons and is reduced', '得到電子並被還原'], ['loses electrons and is oxidised', '失去電子並被氧化'], ['never changes oxidation number', '氧化數永不改變'], ['is always oxygen gas', '永遠是氧氣']],
      answer: 0,
      hint: ['It oxidises the other species by taking its electrons.', '它奪取對方的電子，使對方被氧化。'],
      explain: ['The oxidising agent is itself reduced; the reducing agent is itself oxidised.', '氧化劑本身被還原；還原劑本身被氧化。'],
    },
    {
      q: ['Net ionic equation for AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq):', 'AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq) 的淨離子方程式：'],
      options: [['Ag⁺ + NO₃⁻ → AgNO₃', 'Ag⁺ + NO₃⁻ → AgNO₃'], ['Na⁺ + Cl⁻ → NaCl', 'Na⁺ + Cl⁻ → NaCl'], ['Ag⁺ + Cl⁻ → AgCl(s)', 'Ag⁺ + Cl⁻ → AgCl(s)'], ['Na⁺ + NO₃⁻ → NaNO₃', 'Na⁺ + NO₃⁻ → NaNO₃']],
      answer: 2,
      hint: ['Cancel the ions that stay dissolved on both sides.', '兩邊都保持溶解的離子可以消掉。'],
      explain: ['Na⁺ and NO₃⁻ are spectator ions; only Ag⁺ and Cl⁻ change, forming solid AgCl.', 'Na⁺ 與 NO₃⁻ 是旁觀離子；只有 Ag⁺ 與 Cl⁻ 改變，生成固體 AgCl。'],
    },
  ];

  /* ---------- courses ---------- */

  const COURSES = [
    {
      id: 'states-matter',
      rootId: 'course-body-states-matter',
      title: { en: 'States of Matter and Phase Changes', zh: '物質狀態與相變' },
      sections: [
        {
          title: { en: 'The four states', zh: '四種狀態' },
          body: () => L(`
            <p>Matter exists in different <strong>states</strong> depending on the balance between <strong>intermolecular forces (IMFs)</strong> and the <strong>kinetic energy</strong> of its particles.</p>
            ${fig(statesPlateSVG(), 'The same particles, four degrees of order: a fixed lattice, a loose liquid, a scattered gas and an ionised plasma.')}
            ${table(['State', 'Shape', 'Volume', 'Compressibility', 'Arrangement', 'Motion'], [
              ['Solid', 'Fixed', 'Fixed', 'Very low', 'Closely packed, ordered', 'Vibrate in place'],
              ['Liquid', 'Takes container shape', 'Fixed', 'Low', 'Close but disordered', 'Slide past each other'],
              ['Gas', 'Fills container', 'Fills container', 'High', 'Far apart, random', 'Fast, free motion'],
              ['Plasma', 'Fills container', 'Fills container', 'High', 'Ionised gas', 'Very fast, charged'],
            ])}
            <p class="course-example">Strong IMFs and low kinetic energy give a solid. Weak IMFs and high kinetic energy give a gas. Liquids sit in between — their particles can slide, but they still cling together.</p>
          `, `
            <p>物質以不同的<strong>狀態</strong>存在，取決於<strong>分子間作用力（IMFs）</strong>與粒子<strong>動能</strong>之間的平衡。</p>
            ${fig(statesPlateSVG(), '相同的粒子，四種秩序程度：固定晶格、鬆散液體、散亂氣體與游離電漿。')}
            ${table(['狀態', '形狀', '體積', '壓縮性', '排列', '運動'], [
              ['固態', '固定', '固定', '極低', '緊密有序', '原地振動'],
              ['液態', '隨容器改變', '固定', '低', '緊密但無序', '互相滑動'],
              ['氣態', '填滿容器', '填滿容器', '高', '相距很遠、隨機', '快速自由運動'],
              ['電漿', '填滿容器', '填滿容器', '高', '游離氣體', '極快、帶電'],
            ])}
            <p class="course-example">強 IMFs 與低動能形成固體；弱 IMFs 與高動能形成氣體。液體介於兩者之間——粒子可以滑動，但仍彼此相吸。</p>
          `),
        },
        {
          title: { en: 'Kinetic molecular theory', zh: '分子動力論' },
          body: () => L(`
            <p><strong>Kinetic molecular theory (KMT)</strong> explains why each state behaves as it does.</p>
            <ol>
              <li>All matter is made of tiny particles in <strong>constant motion</strong>.</li>
              <li>Particle <strong>kinetic energy increases with temperature</strong>.</li>
              <li>Ideal collisions are elastic — no energy is lost.</li>
              <li><strong>IMFs</strong> attract particles to each other.</li>
              <li>The state depends on the competition between kinetic energy (pushing apart) and IMFs (pulling together).</li>
            </ol>
            <p class="course-example"><strong>Temperature is a measure of average kinetic energy — not a measure of heat.</strong> Two cups can hold the same temperature but very different total heat.</p>
            <h4>A simple rule</h4>
            <p>Higher temperature → more kinetic energy → particles escape IMFs → <strong>gas</strong>. Lower temperature → less kinetic energy → IMFs dominate → <strong>solid</strong>.</p>
          `, `
            <p><strong>分子動力論（KMT）</strong>說明了各狀態的行為。</p>
            <ol>
              <li>所有物質都由<strong>不停運動</strong>的微小粒子組成。</li>
              <li>粒子的<strong>動能隨溫度升高</strong>。</li>
              <li>理想碰撞是彈性的——不損失能量。</li>
              <li><strong>IMFs</strong> 使粒子互相吸引。</li>
              <li>狀態取決於動能（推開）與 IMFs（拉近）之間的競爭。</li>
            </ol>
            <p class="course-example"><strong>溫度是平均動能的度量——不是熱量的度量。</strong>兩杯水可以溫度相同，但總熱量差很多。</p>
            <h4>一條簡單規則</h4>
            <p>溫度升高 → 動能增加 → 粒子脫離 IMFs → <strong>氣體</strong>。溫度降低 → 動能減少 → IMFs 主導 → <strong>固體</strong>。</p>
          `),
        },
        {
          title: { en: 'Solids: order and disorder', zh: '固體：有序與無序' },
          body: () => L(`
            <p>A solid keeps its own shape because its particles are locked in place by strong IMFs or bonds.</p>
            <h4>Crystalline vs amorphous</h4>
            ${table(['Type', 'Arrangement', 'Melting', 'Examples'], [
              ['Crystalline', 'Ordered, repeating lattice', 'Sharp melting point', 'NaCl, ice, diamond, quartz'],
              ['Amorphous', 'Disordered, random', 'Softens over a range', 'Glass, rubber, plastics'],
            ])}
            <h4>Four kinds of crystalline solid</h4>
            ${table(['Type', 'Particles', 'Held by', 'Properties', 'Examples'], [
              ['Ionic', 'Cations and anions', 'Electrostatic (ionic bonds)', 'Hard, brittle, high mp, conducts when molten', 'NaCl, MgO, CaF₂'],
              ['Molecular', 'Molecules', 'IMFs (dispersion, dipole, H-bonds)', 'Soft, low mp, poor conductors', 'Ice, sugar, CO₂(s)'],
              ['Covalent network', 'Atoms', 'Covalent bonds throughout', 'Very hard, very high mp, poor conductors', 'Diamond, quartz (SiO₂), SiC'],
              ['Metallic', 'Cations + delocalised electrons', 'Metallic bonds', 'Malleable, conductive, variable mp', 'Cu, Fe, Na, Au'],
            ], true)}
            <p class="course-example"><strong>Beginner tip:</strong> to predict a melting point, ask what holds the particles together. Stronger forces → higher melting point.</p>
          `, `
            <p>固體能保持自己的形狀，是因為粒子被強 IMFs 或鍵固定住。</p>
            <h4>晶質與非晶質</h4>
            ${table(['類型', '排列', '熔化', '例子'], [
              ['晶質', '有序、重複的晶格', '明確的熔點', 'NaCl、冰、鑽石、石英'],
              ['非晶質', '無序、隨機', '在一段範圍內軟化', '玻璃、橡膠、塑膠'],
            ])}
            <h4>四種晶質固體</h4>
            ${table(['類型', '粒子', '靠什麼結合', '性質', '例子'], [
              ['離子', '陽離子與陰離子', '靜電（離子鍵）', '硬、脆、熔點高、熔融時導電', 'NaCl、MgO、CaF₂'],
              ['分子', '分子', 'IMFs（色散、偶極、氫鍵）', '軟、熔點低、導電性差', '冰、糖、CO₂(s)'],
              ['共價網狀', '原子', '整塊以共價鍵相連', '極硬、熔點極高、導電性差', '鑽石、石英（SiO₂）、SiC'],
              ['金屬', '金屬陽離子 + 游離電子', '金屬鍵', '延展、導電、熔點不一', 'Cu、Fe、Na、Au'],
            ], true)}
            <p class="course-example"><strong>初學者提示：</strong>要預測熔點，先問「什麼把粒子聚在一起？」作用力越強 → 熔點越高。</p>
          `),
        },
        {
          title: { en: 'Unit cells and packing', zh: '晶胞與堆積' },
          body: () => L(`
            <p>A <strong>unit cell</strong> is the smallest repeating unit of a crystal. Repeating it in three dimensions builds the whole crystal.</p>
            ${unitCellTabs()}
            <p><strong>Coordination number</strong> = how many nearest neighbours touch a given particle. <strong>Packing efficiency</strong> = the fraction of the cell volume actually occupied by particles.</p>
            <h4>Ionic crystal structures</h4>
            ${table(['Structure', 'Coordination', 'Example'], [
              ['Rock salt (NaCl)', '6:6', 'NaCl, KCl, MgO'],
              ['Caesium chloride (CsCl)', '8:8', 'CsCl, CsBr'],
              ['Zinc blende', '4:4', 'ZnS'],
              ['Fluorite', '8:4', 'CaF₂'],
            ])}
            <p class="course-example"><strong>Radius ratio idea:</strong> larger differences between cation and anion size generally favour higher coordination numbers.</p>
          `, `
            <p><strong>晶胞</strong>是晶體最小的重複單位。把它在三維空間重複，就能建出整塊晶體。</p>
            ${unitCellTabs()}
            <p><strong>配位數</strong>＝與某粒子相接的最近鄰數。<strong>堆積效率</strong>＝晶胞體積中實際被粒子佔據的比例。</p>
            <h4>離子晶體結構</h4>
            ${table(['結構', '配位', '例子'], [
              ['岩鹽（NaCl）', '6:6', 'NaCl、KCl、MgO'],
              ['氯化銫（CsCl）', '8:8', 'CsCl、CsBr'],
              ['閃鋅礦', '4:4', 'ZnS'],
              ['螢石', '8:4', 'CaF₂'],
            ])}
            <p class="course-example"><strong>半徑比概念：</strong>陽離子與陰離子尺寸差越大，通常越傾向較高的配位數。</p>
          `),
        },
        {
          title: { en: 'Liquids and vapour pressure', zh: '液體與蒸氣壓' },
          body: () => L(`
            <p>A liquid has fixed volume but no fixed shape: particles slide past one another while IMFs still hold them together.</p>
            ${table(['Property', 'What it means', 'Affected by'], [
              ['Surface tension', 'Energy needed to stretch the surface', 'Stronger IMFs → higher'],
              ['Viscosity', 'Resistance to flow', 'Stronger IMFs, larger molecules → higher'],
              ['Vapour pressure', 'Pressure of vapour above a liquid in a closed container', 'Weaker IMFs, higher temperature → higher'],
              ['Boiling point', 'Temperature where vapour pressure = external pressure', 'Stronger IMFs → higher'],
              ['Capillary action', 'Liquid rising in a narrow tube', 'Adhesion to walls + cohesion between molecules'],
            ], true)}
            ${fig(liquidSVG(), 'In a closed container, molecules escape and condense at equal rates at equilibrium. The gas pressure is the vapour pressure.')}
            <h4>Boiling</h4>
            <p>A liquid <strong>boils</strong> when its vapour pressure equals the external (atmospheric) pressure. The <strong>normal boiling point</strong> is measured at <strong>1 atm</strong>.</p>
            <ul>
              <li>Lower external pressure (high altitude) → lower boiling point.</li>
              <li>Higher external pressure (pressure cooker) → higher boiling point.</li>
            </ul>
            ${table(['Substance', 'IMFs', 'Normal boiling point'], [
              ['Diethyl ether', 'Dipole–dipole, dispersion', '35 °C'],
              ['Ethanol', 'Hydrogen bonding', '78 °C'],
              ['Water', 'Strong hydrogen bonding', '100 °C'],
            ])}
            <p class="course-example">Stronger IMFs → higher boiling point. Ether evaporates quickly; water holds on tightly.</p>
          `, `
            <p>液體有固定體積但沒有固定形狀：粒子互相滑動，同時仍被 IMFs 拉住。</p>
            ${table(['性質', '意義', '受什麼影響'], [
              ['表面張力', '拉伸表面所需的能量', 'IMFs 越強 → 越高'],
              ['黏度', '流動的阻力', 'IMFs 越強、分子越大 → 越高'],
              ['蒸氣壓', '密閉容器中液面上方蒸氣的壓力', 'IMFs 越弱、溫度越高 → 越高'],
              ['沸點', '蒸氣壓＝外界壓力時的溫度', 'IMFs 越強 → 越高'],
              ['毛細現象', '液體在細管中上升', '對管壁的附著力 + 分子間的內聚力'],
            ], true)}
            ${fig(liquidSVG(), '在密閉容器中，平衡時分子逃逸與凝結的速率相等。此時氣體壓力就是蒸氣壓。')}
            <h4>沸騰</h4>
            <p>當<strong>蒸氣壓等於外界（大氣）壓力</strong>時，液體<strong>沸騰</strong>。<strong>正常沸點</strong>在 <strong>1 atm</strong> 下測量。</p>
            <ul>
              <li>外界壓力較低（高海拔）→ 沸點較低。</li>
              <li>外界壓力較高（壓力鍋）→ 沸點較高。</li>
            </ul>
            ${table(['物質', 'IMFs', '正常沸點'], [
              ['乙醚', '偶極－偶極、色散', '35 °C'],
              ['乙醇', '氫鍵', '78 °C'],
              ['水', '強氫鍵', '100 °C'],
            ])}
            <p class="course-example">IMFs 越強 → 沸點越高。乙醚很快蒸發；水則抓得很緊。</p>
          `),
        },
        {
          title: { en: 'Gases, briefly', zh: '氣體簡述' },
          body: () => L(`
            <p>Gases have weak IMFs and high kinetic energy, so particles are far apart and move freely.</p>
            <ul>
              <li><strong>Compressible</strong> — lots of empty space.</li>
              <li>Fill their container completely.</li>
              <li><strong>Exert pressure</strong> from collisions with the walls.</li>
              <li><strong>Mix freely</strong> by diffusion.</li>
            </ul>
            <p>Ideal behaviour is described by the ideal gas law:</p>
            <p class="atomic-eq">\\(PV = nRT\\)</p>
            <p>At high pressure and low temperature, real gases deviate: IMFs and molecular volume become significant.</p>
          `, `
            <p>氣體的 IMFs 很弱、動能很高，所以粒子相距很遠、自由運動。</p>
            <ul>
              <li><strong>可壓縮</strong>——有很多空隙。</li>
              <li>完全填滿容器。</li>
              <li><strong>產生壓力</strong>——粒子撞擊容器壁。</li>
              <li><strong>自由混合</strong>——擴散。</li>
            </ul>
            <p>理想行為由理想氣體定律描述：</p>
            <p class="atomic-eq">\\(PV = nRT\\)</p>
            <p>在高壓與低溫下，真實氣體會偏離理想行為：IMFs 與分子體積變得不可忽略。</p>
          `),
        },
        {
          title: { en: 'Phase changes and enthalpy', zh: '相變與焓' },
          body: () => L(`
            <p>A <strong>phase change</strong> is a physical change, not a chemical one.</p>
            ${table(['Phase change', 'Direction', 'Energy', 'Example'], [
              ['Melting (fusion)', 'solid → liquid', 'Endothermic', 'Ice melting'],
              ['Freezing', 'liquid → solid', 'Exothermic', 'Water freezing'],
              ['Vaporization', 'liquid → gas', 'Endothermic', 'Boiling, evaporation'],
              ['Condensation', 'gas → liquid', 'Exothermic', 'Dew forming'],
              ['Sublimation', 'solid → gas', 'Endothermic', 'Dry ice, snow in dry air'],
              ['Deposition', 'gas → solid', 'Exothermic', 'Frost forming'],
            ])}
            <p class="course-example"><strong>Memory aid:</strong> going to a <em>less ordered</em> state (solid → liquid → gas) requires energy. Going to a <em>more ordered</em> state releases energy.</p>
            <h4>Enthalpy of phase change</h4>
            <ul>
              <li><strong>ΔH_fus</strong> — heat to melt 1 mol of solid at its melting point.</li>
              <li><strong>ΔH_vap</strong> — heat to vaporize 1 mol of liquid at its boiling point.</li>
              <li><strong>ΔH_sub</strong> — heat to sublime 1 mol of solid.</li>
            </ul>
            <p class="atomic-eq">\\(\\Delta H_{\\text{sub}} \\approx \\Delta H_{\\text{fus}} + \\Delta H_{\\text{vap}}\\)</p>
            <p>For water: ΔH_fus = 6.01 kJ/mol, ΔH_vap = 40.7 kJ/mol, so ΔH_sub ≈ 46.7 kJ/mol.</p>
            <p class="course-example"><strong>Important:</strong> temperature stays constant during a phase change. Added energy goes into overcoming IMFs, not into raising kinetic energy.</p>
          `, `
            <p><strong>相變</strong>是物理變化，不是化學變化。</p>
            ${table(['相變', '方向', '能量', '例子'], [
              ['熔化', '固體 → 液體', '吸熱', '冰熔化'],
              ['凝固', '液體 → 固體', '放熱', '水結冰'],
              ['汽化', '液體 → 氣體', '吸熱', '沸騰、蒸發'],
              ['凝結', '氣體 → 液體', '放熱', '結露'],
              ['昇華', '固體 → 氣體', '吸熱', '乾冰、乾燥空氣中的雪'],
              ['凝華', '氣體 → 固體', '放熱', '結霜'],
            ])}
            <p class="course-example"><strong>記憶法：</strong>前往<em>較無序</em>的狀態（固體 → 液體 → 氣體）需要能量；前往<em>較有序</em>的狀態則釋放能量。</p>
            <h4>相變焓</h4>
            <ul>
              <li><strong>ΔH_fus</strong>——在熔點熔化 1 mol 固體所需的熱。</li>
              <li><strong>ΔH_vap</strong>——在沸點汽化 1 mol 液體所需的熱。</li>
              <li><strong>ΔH_sub</strong>——昇華 1 mol 固體所需的熱。</li>
            </ul>
            <p class="atomic-eq">\\(\\Delta H_{\\text{sub}} \\approx \\Delta H_{\\text{fus}} + \\Delta H_{\\text{vap}}\\)</p>
            <p>水：ΔH_fus = 6.01 kJ/mol、ΔH_vap = 40.7 kJ/mol，所以 ΔH_sub ≈ 46.7 kJ/mol。</p>
            <p class="course-example"><strong>重點：</strong>相變期間溫度保持不變。加入的能量用於克服 IMFs，而不是提高動能。</p>
          `),
        },
        {
          title: { en: 'Heating curves and energy', zh: '加熱曲線與能量' },
          body: () => L(`
            <p>A <strong>heating curve</strong> plots temperature against heat added as a substance warms from solid to gas.</p>
            ${fig(heatingCurveSVG(), 'Five regions: solid warming, melting plateau, liquid warming, boiling plateau, gas warming.')}
            ${table(['Region', 'Phase', 'What happens', 'Temperature'], [
              ['1', 'Solid', 'Particles vibrate faster', 'Rises'],
              ['2', 'Solid + liquid', 'IMFs break; melting', 'Constant'],
              ['3', 'Liquid', 'Particles move faster', 'Rises'],
              ['4', 'Liquid + gas', 'IMFs break; boiling', 'Constant'],
              ['5', 'Gas', 'Particles move faster', 'Rises'],
            ])}
            <h4>Calculating energy</h4>
            <p>For temperature changes (no phase change):</p>
            <p class="atomic-eq">\\(q = mc\\Delta T\\)</p>
            <p>For phase changes (temperature constant):</p>
            <p class="atomic-eq">\\(q = n\\Delta H\\)</p>
            ${table(['Phase', 'Specific heat c'], [
              ['Ice (solid)', '2.09 J/g·°C'],
              ['Liquid water', '4.18 J/g·°C'],
              ['Steam (gas)', '2.01 J/g·°C'],
            ])}
            <h4>Worked example: 20.0 g of ice from −10 °C to 110 °C</h4>
            <ol>
              <li>Warm ice: q₁ = (20.0)(2.09)(10) = <strong>418 J</strong></li>
              <li>Melt ice: n = 20.0 / 18.02 = 1.11 mol; q₂ = 1.11 × 6.01 = <strong>6.67 kJ</strong></li>
              <li>Warm water: q₃ = (20.0)(4.18)(100) = <strong>8360 J</strong></li>
              <li>Boil water: q₄ = 1.11 × 40.7 = <strong>45.2 kJ</strong></li>
              <li>Warm steam: q₅ = (20.0)(2.01)(10) = <strong>402 J</strong></li>
            </ol>
            <p>Total ≈ 418 + 6670 + 8360 + 45200 + 402 ≈ <strong>61.1 kJ</strong>.</p>
            <p class="course-example">Boiling takes about 74% of the total energy here — which is why steam burns are so severe: condensing steam releases that energy again.</p>
          `, `
            <p><strong>加熱曲線</strong>把溫度對加入的熱作圖，描述物質從固體升溫到氣體的過程。</p>
            ${fig(heatingCurveSVG(), '五個區域：固體升溫、熔化平台、液體升溫、沸騰平台、氣體升溫。')}
            ${table(['區域', '相', '發生什麼', '溫度'], [
              ['1', '固體', '粒子振動加快', '上升'],
              ['2', '固體 + 液體', 'IMFs 被打斷；熔化', '不變'],
              ['3', '液體', '粒子運動加快', '上升'],
              ['4', '液體 + 氣體', 'IMFs 被打斷；沸騰', '不變'],
              ['5', '氣體', '粒子運動加快', '上升'],
            ])}
            <h4>計算能量</h4>
            <p>溫度變化（沒有相變）時：</p>
            <p class="atomic-eq">\\(q = mc\\Delta T\\)</p>
            <p>相變（溫度不變）時：</p>
            <p class="atomic-eq">\\(q = n\\Delta H\\)</p>
            ${table(['相', '比熱 c'], [
              ['冰（固體）', '2.09 J/g·°C'],
              ['液態水', '4.18 J/g·°C'],
              ['蒸氣（氣體）', '2.01 J/g·°C'],
            ])}
            <h4>例題：20.0 g 冰從 −10 °C 到 110 °C</h4>
            <ol>
              <li>冰升溫：q₁ = (20.0)(2.09)(10) = <strong>418 J</strong></li>
              <li>冰熔化：n = 20.0 / 18.02 = 1.11 mol；q₂ = 1.11 × 6.01 = <strong>6.67 kJ</strong></li>
              <li>水升溫：q₃ = (20.0)(4.18)(100) = <strong>8360 J</strong></li>
              <li>水沸騰：q₄ = 1.11 × 40.7 = <strong>45.2 kJ</strong></li>
              <li>蒸氣升溫：q₅ = (20.0)(2.01)(10) = <strong>402 J</strong></li>
            </ol>
            <p>總計 ≈ 418 + 6670 + 8360 + 45200 + 402 ≈ <strong>61.1 kJ</strong>。</p>
            <p class="course-example">沸騰約佔總能量的 74%——這也說明蒸氣燙傷為何特別嚴重：凝結時會把這股能量釋放回來。</p>
          `),
        },
        {
          title: { en: 'Phase diagrams', zh: '相圖' },
          body: () => L(`
            <p>A <strong>phase diagram</strong> shows which phase is stable at a given temperature and pressure.</p>
            ${fig(phaseDiagramSVG(), 'Regions are phases; lines are coexistence; the triple point has all three; the critical point ends the liquid–gas boundary.')}
            ${table(['Feature', 'Meaning'], [
              ['Regions', 'Stable phase under those conditions'],
              ['Lines', 'Two phases coexist in equilibrium'],
              ['Triple point', 'All three phases coexist at equilibrium'],
              ['Critical point', 'Above it: no distinction between liquid and gas — a supercritical fluid'],
              ['Normal melting point', 'Melting temperature at 1 atm'],
              ['Normal boiling point', 'Boiling temperature at 1 atm'],
            ])}
            <h4>The three boundary curves</h4>
            <ol>
              <li><strong>Sublimation curve</strong> (solid–gas): below the triple-point pressure.</li>
              <li><strong>Melting curve</strong> (solid–liquid): usually slopes right, because pressure favours the denser solid.</li>
              <li><strong>Vaporization curve</strong> (liquid–gas): ends at the critical point.</li>
            </ol>
            <h4>Water is unusual</h4>
            <p>Water’s melting curve slopes <strong>left</strong>: ice is less dense than liquid water, so pressure favours the liquid and lowers the melting point.</p>
            <h4>CO₂ is different</h4>
            <p>CO₂’s triple point is at 5.11 atm and −56.6 °C — above 1 atm. So at ordinary pressure, dry ice <strong>sublimes</strong> directly to gas.</p>
            <p class="course-example"><strong>Reading a phase diagram:</strong> 1) locate T and P; 2) name the region; 3) check whether the point is on a line (coexistence) or a special point.</p>
          `, `
            <p><strong>相圖</strong>顯示在特定溫度與壓力下，哪個相是穩定的。</p>
            ${fig(phaseDiagramSVG(), '區域是相；線是共存；三相點三態共存；臨界點是液－氣邊界的終點。')}
            ${table(['特徵', '意義'], [
              ['區域', '該條件下的穩定相'],
              ['線', '兩相平衡共存'],
              ['三相點', '三相同時平衡共存'],
              ['臨界點', '在其之上：液體與氣體無區別——超臨界流體'],
              ['正常熔點', '1 atm 下的熔化溫度'],
              ['正常沸點', '1 atm 下的沸騰溫度'],
            ])}
            <h4>三條邊界曲線</h4>
            <ol>
              <li><strong>昇華曲線</strong>（固－氣）：在三相點壓力以下。</li>
              <li><strong>熔化曲線</strong>（固－液）：通常向右傾，因為壓力有利於密度較大的固體。</li>
              <li><strong>汽化曲線</strong>（液－氣）：終止於臨界點。</li>
            </ol>
            <h4>水很特別</h4>
            <p>水的熔化曲線向<strong>左</strong>傾：冰的密度小於液態水，所以壓力有利於液體，並降低熔點。</p>
            <h4>CO₂ 不一樣</h4>
            <p>CO₂ 的三相點在 5.11 atm、−56.6 °C——高於 1 atm。所以在常壓下，乾冰會直接<strong>昇華</strong>成氣體。</p>
            <p class="course-example"><strong>讀相圖：</strong>1）找出 T 與 P；2）說出所在區域；3）判斷點是否在線上（共存）或特殊點上。</p>
          `),
        },
        {
          title: { en: 'Summary and practice', zh: '總結與練習' },
          body: () => L(`
            <ul class="course-checklist">
              <li>The state of matter balances <strong>kinetic energy</strong> against <strong>IMFs</strong>.</li>
              <li><strong>Temperature</strong> measures average kinetic energy, not heat.</li>
              <li>Crystalline solids have ordered lattices and sharp melting points; amorphous solids soften over a range.</li>
              <li>Four crystal types: <strong>ionic, molecular, covalent network, metallic</strong>.</li>
              <li>Unit cells: <strong>SC (1 atom, 6, 52%)</strong>, <strong>BCC (2, 8, 68%)</strong>, <strong>FCC (4, 12, 74%)</strong>.</li>
              <li>A liquid boils when vapour pressure equals external pressure.</li>
              <li>Melting and vaporization absorb heat; freezing and condensation release it.</li>
              <li>Temperature is constant during a phase change; use \\(q = n\\Delta H\\) there.</li>
              <li>For temperature changes use \\(q = mc\\Delta T\\).</li>
              <li>Water’s melting curve slopes left; CO₂ sublimes at 1 atm.</li>
            </ul>
            ${practice(STATES_PRACTICE, 'sm')}
          `, `
            <ul class="course-checklist">
              <li>物質狀態是<strong>動能</strong>與<strong>IMFs</strong>之間的平衡。</li>
              <li><strong>溫度</strong>測量平均動能，不是熱量。</li>
              <li>晶質固體有有序晶格與明確熔點；非晶質固體在一段範圍內軟化。</li>
              <li>四種晶體：<strong>離子、分子、共價網狀、金屬</strong>。</li>
              <li>晶胞：<strong>SC（1 原子、6、52%）</strong>、<strong>BCC（2、8、68%）</strong>、<strong>FCC（4、12、74%）</strong>。</li>
              <li>蒸氣壓等於外界壓力時，液體沸騰。</li>
              <li>熔化與汽化吸熱；凝固與凝結放熱。</li>
              <li>相變期間溫度不變；此時使用 \\(q = n\\Delta H\\)。</li>
              <li>溫度變化使用 \\(q = mc\\Delta T\\)。</li>
              <li>水的熔化曲線向左傾；CO₂ 在 1 atm 下昇華。</li>
            </ul>
            ${practice(STATES_PRACTICE, 'sm')}
          `),
        },
        {
          title: { en: 'Course checks', zh: '課程檢查' },
          body: () => L(quiz(STATES_QUIZ, 'sm'), quiz(STATES_QUIZ, 'sm')),
        },
      ],
    },
    {
      id: 'reaction-types',
      rootId: 'course-body-reaction-types',
      title: { en: 'Chemical Reactions and Reaction Types', zh: '化學反應與反應類型' },
      sections: [
        {
          title: { en: 'What is a chemical reaction?', zh: '什麼是化學反應？' },
          body: () => L(`
            <p>A chemical reaction converts <strong>reactants</strong> into <strong>products</strong> by breaking and forming bonds. Atoms are rearranged but <strong>never created or destroyed</strong> — the law of conservation of mass.</p>
            <p class="atomic-eq">\\(\\text{Reactants} \\rightarrow \\text{Products}\\)</p>
            <h4>Evidence that a reaction occurred</h4>
            <ul>
              <li>Colour change</li>
              <li>Formation of a gas (bubbles)</li>
              <li>Formation of a solid (precipitate)</li>
              <li>Temperature change (heat released or absorbed)</li>
              <li>Light given off</li>
              <li>A new odour appears</li>
            </ul>
            <p class="course-example">None of these alone proves a reaction — dissolving sugar changes nothing chemically. You need a <strong>new substance with new properties</strong>.</p>
          `, `
            <p>化學反應把<strong>反應物</strong>轉變成<strong>產物</strong>，過程中舊鍵斷裂、新鍵形成。原子只是重新排列，<strong>從不被創造或消滅</strong>——這就是質量守恆定律。</p>
            <p class="atomic-eq">\\(\\text{反應物} \\rightarrow \\text{產物}\\)</p>
            <h4>反應發生的證據</h4>
            <ul>
              <li>顏色改變</li>
              <li>生成氣體（氣泡）</li>
              <li>生成固體（沉澱）</li>
              <li>溫度改變（放熱或吸熱）</li>
              <li>發出光</li>
              <li>出現新的氣味</li>
            </ul>
            <p class="course-example">這些現象任一項都無法單獨證明反應發生——糖溶於水沒有任何化學變化。你需要<strong>具有新性質的新物質</strong>。</p>
          `),
        },
        {
          title: { en: 'Anatomy and balancing', zh: '方程式的解剖與平衡' },
          body: () => L(`
            <p>Take a familiar reaction:</p>
            <p class="atomic-eq">\\(2\\text{H}_2(g) + \\text{O}_2(g) \\rightarrow 2\\text{H}_2\\text{O}(l)\\)</p>
            ${table(['Part', 'Meaning'], [
              ['2, 2 (coefficients)', 'Number of moles / formula units'],
              ['H₂, O₂, H₂O (formulas)', 'The substances involved'],
              ['(g), (l), (s), (aq)', 'Gas, liquid, solid, aqueous'],
              ['→', '“Yields” or “produces”'],
              ['⇌', 'Reversible reaction (equilibrium)'],
              ['Δ or heat above arrow', 'Heat is added'],
              ['Catalyst above arrow', 'Speeds up the reaction'],
            ])}
            <h4>State symbols</h4>
            ${table(['Symbol', 'Meaning'], [
              ['(s)', 'solid'],
              ['(l)', 'liquid'],
              ['(g)', 'gas'],
              ['(aq)', 'dissolved in water'],
              ['↓', 'precipitate forms'],
              ['↑', 'gas evolves'],
            ])}
            <h4>Balancing rules</h4>
            <ol>
              <li>Never change subscripts — only coefficients.</li>
              <li>Balance one element at a time; leave H and O for later.</li>
              <li>Check every atom at the end.</li>
              <li>Remember the diatomic elements: <strong>H₂, N₂, O₂, F₂, Cl₂, Br₂, I₂</strong>.</li>
            </ol>
            <h4>Worked example</h4>
            <p>Balance \\(\\text{C}_4\\text{H}_{10} + \\text{O}_2 \\rightarrow \\text{CO}_2 + \\text{H}_2\\text{O}\\): 4 C → 4 CO₂; 10 H → 5 H₂O; the right side needs 8 + 5 = 13 O, so use \\(\\tfrac{13}{2}\\) O₂ and double:</p>
            <p class="atomic-eq">\\(2\\text{C}_4\\text{H}_{10} + 13\\text{O}_2 \\rightarrow 8\\text{CO}_2 + 10\\text{H}_2\\text{O}\\)</p>
          `, `
            <p>以一個熟悉的反應為例：</p>
            <p class="atomic-eq">\\(2\\text{H}_2(g) + \\text{O}_2(g) \\rightarrow 2\\text{H}_2\\text{O}(l)\\)</p>
            ${table(['部分', '意義'], [
              ['2、2（係數）', '莫耳數／式量單位數'],
              ['H₂、O₂、H₂O（化學式）', '參與的物質'],
              ['(g)、(l)、(s)、(aq)', '氣體、液體、固體、水溶液'],
              ['→', '「生成」'],
              ['⇌', '可逆反應（平衡）'],
              ['箭號上的 Δ 或加熱', '加入熱'],
              ['箭號上的催化劑', '加快反應'],
            ])}
            <h4>狀態符號</h4>
            ${table(['符號', '意義'], [
              ['(s)', '固體'],
              ['(l)', '液體'],
              ['(g)', '氣體'],
              ['(aq)', '溶於水'],
              ['↓', '生成沉澱'],
              ['↑', '放出氣體'],
            ])}
            <h4>平衡規則</h4>
            <ol>
              <li>絕不改下標——只改係數。</li>
              <li>一次平衡一種元素；H 與 O 留到最後。</li>
              <li>最後檢查每個原子。</li>
              <li>記住雙原子元素：<strong>H₂、N₂、O₂、F₂、Cl₂、Br₂、I₂</strong>。</li>
            </ol>
            <h4>例題</h4>
            <p>平衡 \\(\\text{C}_4\\text{H}_{10} + \\text{O}_2 \\rightarrow \\text{CO}_2 + \\text{H}_2\\text{O}\\)：4 個 C → 4 CO₂；10 個 H → 5 H₂O；右邊需要 8 + 5 = 13 個 O，所以用 \\(\\tfrac{13}{2}\\) O₂，再全部乘以 2：</p>
            <p class="atomic-eq">\\(2\\text{C}_4\\text{H}_{10} + 13\\text{O}_2 \\rightarrow 8\\text{CO}_2 + 10\\text{H}_2\\text{O}\\)</p>
          `),
        },
        {
          title: { en: 'Synthesis and decomposition', zh: '合成與分解' },
          body: () => L(`
            <h4>Synthesis (combination): A + B → AB</h4>
            <p>Two or more substances combine into <strong>one</strong> product.</p>
            <p class="atomic-eq">\\(2\\text{Na} + \\text{Cl}_2 \\rightarrow 2\\text{NaCl}\\)</p>
            <p class="atomic-eq">\\(\\text{N}_2 + 3\\text{H}_2 \\rightarrow 2\\text{NH}_3\\)</p>
            <p class="atomic-eq">\\(\\text{CaO} + \\text{H}_2\\text{O} \\rightarrow \\text{Ca(OH)}_2\\)</p>
            ${table(['Reactants', 'Typical product'], [
              ['Metal + nonmetal', 'Ionic compound'],
              ['Metal oxide + water', 'Metal hydroxide (base)'],
              ['Nonmetal oxide + water', 'Acid'],
              ['Metal + oxygen', 'Metal oxide'],
            ])}
            <h4>Decomposition: AB → A + B</h4>
            <p><strong>One</strong> reactant breaks into two or more products; heat, electricity or light is usually needed. It is the reverse of synthesis.</p>
            <p class="atomic-eq">\\(2\\text{H}_2\\text{O} \\rightarrow 2\\text{H}_2 + \\text{O}_2\\) &nbsp;(electrolysis)</p>
            <p class="atomic-eq">\\(\\text{CaCO}_3 \\rightarrow \\text{CaO} + \\text{CO}_2\\) &nbsp;(heat)</p>
            <p class="atomic-eq">\\(2\\text{H}_2\\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O} + \\text{O}_2\\)</p>
            <p class="course-example">Pattern check: count the reactants. One reactant → decomposition; several reactants forming one product → synthesis.</p>
          `, `
            <h4>合成（化合）：A + B → AB</h4>
            <p>兩種或更多物質結合成<strong>一個</strong>產物。</p>
            <p class="atomic-eq">\\(2\\text{Na} + \\text{Cl}_2 \\rightarrow 2\\text{NaCl}\\)</p>
            <p class="atomic-eq">\\(\\text{N}_2 + 3\\text{H}_2 \\rightarrow 2\\text{NH}_3\\)</p>
            <p class="atomic-eq">\\(\\text{CaO} + \\text{H}_2\\text{O} \\rightarrow \\text{Ca(OH)}_2\\)</p>
            ${table(['反應物', '典型產物'], [
              ['金屬 + 非金屬', '離子化合物'],
              ['金屬氧化物 + 水', '金屬氫氧化物（鹼）'],
              ['非金屬氧化物 + 水', '酸'],
              ['金屬 + 氧', '金屬氧化物'],
            ])}
            <h4>分解：AB → A + B</h4>
            <p><strong>一個</strong>反應物裂成兩個或更多產物；通常需要熱、電或光。它是合成的逆反應。</p>
            <p class="atomic-eq">\\(2\\text{H}_2\\text{O} \\rightarrow 2\\text{H}_2 + \\text{O}_2\\) &nbsp;（電解）</p>
            <p class="atomic-eq">\\(\\text{CaCO}_3 \\rightarrow \\text{CaO} + \\text{CO}_2\\) &nbsp;（加熱）</p>
            <p class="atomic-eq">\\(2\\text{H}_2\\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O} + \\text{O}_2\\)</p>
            <p class="course-example">判斷模式：數反應物。一個反應物 → 分解；多個反應物生成一個產物 → 合成。</p>
          `),
        },
        {
          title: { en: 'Single replacement', zh: '單取代' },
          body: () => L(`
            <p><strong>Pattern:</strong> A + BC → AC + B. One element replaces another element in a compound. Whether it works depends on <strong>reactivity</strong>.</p>
            <p class="atomic-eq">\\(\\text{Zn} + 2\\text{HCl} \\rightarrow \\text{ZnCl}_2 + \\text{H}_2\\)</p>
            <p class="atomic-eq">\\(\\text{Fe} + \\text{CuSO}_4 \\rightarrow \\text{FeSO}_4 + \\text{Cu}\\)</p>
            <h4>Metal activity series (most reactive first)</h4>
            <p class="atomic-eq">Li K Ba Ca Na Mg Al Zn Fe Ni Sn Pb (H) Cu Hg Ag Au Pt</p>
            <p>A metal <strong>higher</strong> on the list can displace a metal <strong>lower</strong> from a compound. Metals above (H) displace hydrogen from acids.</p>
            <p class="course-example">Zn + CuSO₄ works because Zn is above Cu. Cu + ZnSO₄ does <strong>not</strong> work because Cu is below Zn.</p>
            <h4>Halogen activity series</h4>
            <p class="atomic-eq">F₂ &gt; Cl₂ &gt; Br₂ &gt; I₂</p>
            <p>A halogen higher on the list displaces one lower down: Cl₂ + 2 KBr → 2 KCl + Br₂ works; Br₂ + 2 KCl → no reaction.</p>
          `, `
            <p><strong>模式：</strong>A + BC → AC + B。一個元素取代化合物中的另一個元素。是否發生取決於<strong>活性</strong>。</p>
            <p class="atomic-eq">\\(\\text{Zn} + 2\\text{HCl} \\rightarrow \\text{ZnCl}_2 + \\text{H}_2\\)</p>
            <p class="atomic-eq">\\(\\text{Fe} + \\text{CuSO}_4 \\rightarrow \\text{FeSO}_4 + \\text{Cu}\\)</p>
            <h4>金屬活性序列（活性最高在前）</h4>
            <p class="atomic-eq">Li K Ba Ca Na Mg Al Zn Fe Ni Sn Pb (H) Cu Hg Ag Au Pt</p>
            <p>序列中<strong>較上面</strong>的金屬可以置換化合物中<strong>較下面</strong>的金屬。位於 (H) 之上的金屬能從酸中置換氫。</p>
            <p class="course-example">Zn + CuSO₄ 會反應，因為 Zn 在 Cu 之上。Cu + ZnSO₄ <strong>不會</strong>反應，因為 Cu 在 Zn 之下。</p>
            <h4>鹵素活性序列</h4>
            <p class="atomic-eq">F₂ &gt; Cl₂ &gt; Br₂ &gt; I₂</p>
            <p>序列中較上面的鹵素能置換較下面的鹵素：Cl₂ + 2 KBr → 2 KCl + Br₂ 會反應；Br₂ + 2 KCl → 不反應。</p>
          `),
        },
        {
          title: { en: 'Double replacement and precipitation', zh: '雙取代與沉澱' },
          body: () => L(`
            <p><strong>Pattern:</strong> AB + CD → AD + CB. The cations (or anions) swap partners, usually in aqueous solution.</p>
            <p class="atomic-eq">\\(\\text{AgNO}_3 + \\text{NaCl} \\rightarrow \\text{AgCl} + \\text{NaNO}_3\\)</p>
            <p class="atomic-eq">\\(\\text{BaCl}_2 + \\text{Na}_2\\text{SO}_4 \\rightarrow \\text{BaSO}_4 + 2\\text{NaCl}\\)</p>
            <h4>Driving forces</h4>
            <ul>
              <li>A <strong>precipitate</strong> forms.</li>
              <li>A <strong>gas</strong> forms.</li>
              <li><strong>Water</strong> forms (acid–base neutralisation).</li>
            </ul>
            <p>If all products are soluble aqueous ions, no reaction occurs.</p>
            <h4>Solubility rules (beginner version)</h4>
            ${table(['Rule', 'Soluble?'], [
              ['Group 1 (Li⁺, Na⁺, K⁺…) and NH₄⁺ salts', 'Soluble'],
              ['Nitrates, acetates, perchlorates', 'Soluble'],
              ['Chlorides, bromides, iodides', 'Soluble except Ag⁺, Pb²⁺, Hg₂²⁺'],
              ['Sulfates', 'Soluble except BaSO₄, PbSO₄, SrSO₄, Ag₂SO₄'],
              ['Carbonates, phosphates, sulfides', 'Insoluble except group 1 and NH₄⁺'],
              ['Hydroxides', 'Insoluble except group 1, NH₄⁺, Ca²⁺/Sr²⁺/Ba²⁺ (slightly)'],
            ], true)}
            <p class="course-example">Precipitation is a double replacement with a visible result: Pb(NO₃)₂(aq) + 2 KI(aq) → PbI₂(s)↓ + 2 KNO₃(aq).</p>
          `, `
            <p><strong>模式：</strong>AB + CD → AD + CB。陽離子（或陰離子）交換夥伴，通常在 aqueous 溶液中進行。</p>
            <p class="atomic-eq">\\(\\text{AgNO}_3 + \\text{NaCl} \\rightarrow \\text{AgCl} + \\text{NaNO}_3\\)</p>
            <p class="atomic-eq">\\(\\text{BaCl}_2 + \\text{Na}_2\\text{SO}_4 \\rightarrow \\text{BaSO}_4 + 2\\text{NaCl}\\)</p>
            <h4>驅動力</h4>
            <ul>
              <li>生成<strong>沉澱</strong>。</li>
              <li>生成<strong>氣體</strong>。</li>
              <li>生成<strong>水</strong>（酸鹼中和）。</li>
            </ul>
            <p>若所有產物都是可溶的水合離子，就不會發生反應。</p>
            <h4>溶解度規則（初階版）</h4>
            ${table(['規則', '可溶？'], [
              ['第 1 族（Li⁺、Na⁺、K⁺…）與 NH₄⁺ 鹽', '可溶'],
              ['硝酸鹽、醋酸鹽、過氯酸鹽', '可溶'],
              ['氯化物、溴化物、碘化物', '可溶，但 Ag⁺、Pb²⁺、Hg₂²⁺ 例外'],
              ['硫酸鹽', '可溶，但 BaSO₄、PbSO₄、SrSO₄、Ag₂SO₄ 例外'],
              ['碳酸鹽、磷酸鹽、硫化物', '不可溶，但第 1 族與 NH₄⁺ 例外'],
              ['氫氧化物', '不可溶，但第 1 族、NH₄⁺、Ca²⁺/Sr²⁺/Ba²⁺（微溶）例外'],
            ], true)}
            <p class="course-example">沉澱是看得見結果的雙取代：Pb(NO₃)₂(aq) + 2 KI(aq) → PbI₂(s)↓ + 2 KNO₃(aq)。</p>
          `),
        },
        {
          title: { en: 'Combustion', zh: '燃燒' },
          body: () => L(`
            <p><strong>Pattern (hydrocarbon):</strong> CₓH_y + O₂ → CO₂ + H₂O. A substance reacts rapidly with oxygen, releasing heat and light.</p>
            <h4>Complete combustion (plenty of O₂)</h4>
            <p class="atomic-eq">\\(\\text{CH}_4 + 2\\text{O}_2 \\rightarrow \\text{CO}_2 + 2\\text{H}_2\\text{O}\\)</p>
            <p class="atomic-eq">\\(\\text{C}_3\\text{H}_8 + 5\\text{O}_2 \\rightarrow 3\\text{CO}_2 + 4\\text{H}_2\\text{O}\\)</p>
            <h4>Incomplete combustion (limited O₂)</h4>
            <p>Produces carbon monoxide or soot instead of CO₂:</p>
            <p class="atomic-eq">\\(2\\text{CH}_4 + 3\\text{O}_2 \\rightarrow 2\\text{CO} + 4\\text{H}_2\\text{O}\\)</p>
            <p class="atomic-eq">\\(\\text{CH}_4 + \\text{O}_2 \\rightarrow \\text{C} + 2\\text{H}_2\\text{O}\\)</p>
            <p class="course-example">Incomplete combustion is dangerous (CO is toxic) and wastes energy. Combustion is also a <strong>redox</strong> reaction — oxygen is reduced.</p>
            <h4>Burning elements</h4>
            <p class="atomic-eq">\\(2\\text{Mg} + \\text{O}_2 \\rightarrow 2\\text{MgO}\\)</p>
            <p class="atomic-eq">\\(\\text{S} + \\text{O}_2 \\rightarrow \\text{SO}_2\\)</p>
          `, `
            <p><strong>模式（烴類）：</strong>CₓH_y + O₂ → CO₂ + H₂O。物質與氧快速反應，釋放熱與光。</p>
            <h4>完全燃燒（氧氣充足）</h4>
            <p class="atomic-eq">\\(\\text{CH}_4 + 2\\text{O}_2 \\rightarrow \\text{CO}_2 + 2\\text{H}_2\\text{O}\\)</p>
            <p class="atomic-eq">\\(\\text{C}_3\\text{H}_8 + 5\\text{O}_2 \\rightarrow 3\\text{CO}_2 + 4\\text{H}_2\\text{O}\\)</p>
            <h4>不完全燃燒（氧氣不足）</h4>
            <p>生成一氧化碳或碳黑，而不是 CO₂：</p>
            <p class="atomic-eq">\\(2\\text{CH}_4 + 3\\text{O}_2 \\rightarrow 2\\text{CO} + 4\\text{H}_2\\text{O}\\)</p>
            <p class="atomic-eq">\\(\\text{CH}_4 + \\text{O}_2 \\rightarrow \\text{C} + 2\\text{H}_2\\text{O}\\)</p>
            <p class="course-example">不完全燃燒既危險（CO 有毒）又浪費能量。燃燒同時也是<strong>氧化還原</strong>反應——氧被還原。</p>
            <h4>元素燃燒</h4>
            <p class="atomic-eq">\\(2\\text{Mg} + \\text{O}_2 \\rightarrow 2\\text{MgO}\\)</p>
            <p class="atomic-eq">\\(\\text{S} + \\text{O}_2 \\rightarrow \\text{SO}_2\\)</p>
          `),
        },
        {
          title: { en: 'Acid–base neutralisation', zh: '酸鹼中和' },
          body: () => L(`
            <p><strong>Pattern:</strong> Acid + Base → Salt + Water.</p>
            <p class="atomic-eq">\\(\\text{HCl} + \\text{NaOH} \\rightarrow \\text{NaCl} + \\text{H}_2\\text{O}\\)</p>
            <p class="atomic-eq">\\(\\text{H}_2\\text{SO}_4 + 2\\text{KOH} \\rightarrow \\text{K}_2\\text{SO}_4 + 2\\text{H}_2\\text{O}\\)</p>
            <h4>Acid + carbonate or bicarbonate</h4>
            <p class="atomic-eq">\\(2\\text{HCl} + \\text{Na}_2\\text{CO}_3 \\rightarrow 2\\text{NaCl} + \\text{H}_2\\text{O} + \\text{CO}_2\\)</p>
            <p class="atomic-eq">\\(\\text{HCl} + \\text{NaHCO}_3 \\rightarrow \\text{NaCl} + \\text{H}_2\\text{O} + \\text{CO}_2\\)</p>
            <h4>Acid + metal → salt + hydrogen (also redox)</h4>
            <p class="atomic-eq">\\(\\text{Zn} + 2\\text{HCl} \\rightarrow \\text{ZnCl}_2 + \\text{H}_2\\)</p>
            <h4>Acid + sulfite → salt + water + SO₂</h4>
            <p class="atomic-eq">\\(2\\text{HCl} + \\text{Na}_2\\text{SO}_3 \\rightarrow 2\\text{NaCl} + \\text{H}_2\\text{O} + \\text{SO}_2\\)</p>
            <h4>Ammonia as a base</h4>
            <p class="atomic-eq">\\(\\text{NH}_3 + \\text{HCl} \\rightarrow \\text{NH}_4\\text{Cl}\\)</p>
            <p class="course-example">The tell-tale sign of an acid–base reaction is water (or CO₂ with a carbonate).</p>
          `, `
            <p><strong>模式：</strong>酸 + 鹼 → 鹽 + 水。</p>
            <p class="atomic-eq">\\(\\text{HCl} + \\text{NaOH} \\rightarrow \\text{NaCl} + \\text{H}_2\\text{O}\\)</p>
            <p class="atomic-eq">\\(\\text{H}_2\\text{SO}_4 + 2\\text{KOH} \\rightarrow \\text{K}_2\\text{SO}_4 + 2\\text{H}_2\\text{O}\\)</p>
            <h4>酸 + 碳酸鹽或碳酸氫鹽</h4>
            <p class="atomic-eq">\\(2\\text{HCl} + \\text{Na}_2\\text{CO}_3 \\rightarrow 2\\text{NaCl} + \\text{H}_2\\text{O} + \\text{CO}_2\\)</p>
            <p class="atomic-eq">\\(\\text{HCl} + \\text{NaHCO}_3 \\rightarrow \\text{NaCl} + \\text{H}_2\\text{O} + \\text{CO}_2\\)</p>
            <h4>酸 + 金屬 → 鹽 + 氫（也是氧化還原）</h4>
            <p class="atomic-eq">\\(\\text{Zn} + 2\\text{HCl} \\rightarrow \\text{ZnCl}_2 + \\text{H}_2\\)</p>
            <h4>酸 + 亞硫酸鹽 → 鹽 + 水 + SO₂</h4>
            <p class="atomic-eq">\\(2\\text{HCl} + \\text{Na}_2\\text{SO}_3 \\rightarrow 2\\text{NaCl} + \\text{H}_2\\text{O} + \\text{SO}_2\\)</p>
            <h4>氨作為鹼</h4>
            <p class="atomic-eq">\\(\\text{NH}_3 + \\text{HCl} \\rightarrow \\text{NH}_4\\text{Cl}\\)</p>
            <p class="course-example">酸鹼反應的線索是水（若與碳酸鹽反應則還有 CO₂）。</p>
          `),
        },
        {
          title: { en: 'Redox and net ionic equations', zh: '氧化還原與淨離子方程式' },
          body: () => L(`
            <p><strong>Redox is a category, not a single reaction type.</strong> Single replacement, combustion and element synthesis are also redox.</p>
            <ul>
              <li><strong>Oxidation</strong> = loss of electrons (oxidation number rises).</li>
              <li><strong>Reduction</strong> = gain of electrons (oxidation number falls).</li>
            </ul>
            <p class="atomic-eq">\\(\\text{OIL RIG}\\) — Oxidation Is Loss, Reduction Is Gain</p>
            <p>Example: Zn + Cu²⁺ → Zn²⁺ + Cu. Zn: 0 → +2 (oxidised, loses 2 e⁻); Cu²⁺: +2 → 0 (reduced, gains 2 e⁻).</p>
            ${table(['Term', 'Meaning'], [
              ['Oxidising agent', 'The species that is reduced (takes electrons)'],
              ['Reducing agent', 'The species that is oxidised (gives electrons)'],
            ])}
            <h4>Oxidation number reminders</h4>
            ${table(['Rule', 'Example'], [
              ['Free element = 0', 'Na, O₂, Cl₂'],
              ['Monatomic ion = its charge', 'Na⁺ = +1, Cl⁻ = −1'],
              ['Oxygen usually −2', 'H₂O: O = −2 (peroxides: −1)'],
              ['Hydrogen usually +1', 'HCl: H = +1 (metal hydrides: −1)'],
              ['Sum = overall charge', 'KMnO₄: Mn = +7'],
            ])}
            <h4>Disproportionation</h4>
            <p>One element is simultaneously oxidised and reduced: 2 H₂O₂ → 2 H₂O + O₂. Oxygen is −1 in H₂O₂, −2 in H₂O and 0 in O₂.</p>
            <h4>Net ionic equations</h4>
            <p>Molecular: AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)</p>
            <p>Complete ionic: Ag⁺ + NO₃⁻ + Na⁺ + Cl⁻ → AgCl(s) + Na⁺ + NO₃⁻</p>
            <p class="atomic-eq">\\(\\text{Net ionic: } \\text{Ag}^+ + \\text{Cl}^- \\rightarrow \\text{AgCl(s)}\\)</p>
            <p><strong>Spectator ions</strong> (Na⁺, NO₃⁻ here) appear unchanged on both sides and are cancelled.</p>
          `, `
            <p><strong>氧化還原是一個類別，不是單一反應類型。</strong>單取代、燃燒與元素合成也都屬於氧化還原。</p>
            <ul>
              <li><strong>氧化</strong>＝失去電子（氧化數上升）。</li>
              <li><strong>還原</strong>＝得到電子（氧化數下降）。</li>
            </ul>
            <p class="atomic-eq">\\(\\text{氧化失電子、還原得電子}\\)</p>
            <p>例：Zn + Cu²⁺ → Zn²⁺ + Cu。Zn：0 → +2（被氧化，失去 2 e⁻）；Cu²⁺：+2 → 0（被還原，得到 2 e⁻）。</p>
            ${table(['名詞', '意義'], [
              ['氧化劑', '被還原的物質（奪取電子）'],
              ['還原劑', '被氧化的物質（給出電子）'],
            ])}
            <h4>氧化數複習</h4>
            ${table(['規則', '例子'], [
              ['游離元素 = 0', 'Na、O₂、Cl₂'],
              ['單原子離子 = 其電荷', 'Na⁺ = +1、Cl⁻ = −1'],
              ['氧通常 −2', 'H₂O：O = −2（過氧化物：−1）'],
              ['氫通常 +1', 'HCl：H = +1（金屬氫化物：−1）'],
              ['總和 = 整體電荷', 'KMnO₄：Mn = +7'],
            ])}
            <h4>自身氧化還原（歧化）</h4>
            <p>同一元素同時被氧化與還原：2 H₂O₂ → 2 H₂O + O₂。氧在 H₂O₂ 是 −1、在 H₂O 是 −2、在 O₂ 是 0。</p>
            <h4>淨離子方程式</h4>
            <p>分子式：AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)</p>
            <p>完全離子式：Ag⁺ + NO₃⁻ + Na⁺ + Cl⁻ → AgCl(s) + Na⁺ + NO₃⁻</p>
            <p class="atomic-eq">\\(\\text{淨離子式：} \\text{Ag}^+ + \\text{Cl}^- \\rightarrow \\text{AgCl(s)}\\)</p>
            <p><strong>旁觀離子</strong>（此例的 Na⁺、NO₃⁻）在兩邊不變，可以消去。</p>
          `),
        },
        {
          title: { en: 'Classifying a reaction', zh: '判斷反應類型' },
          body: () => L(`
            <p>Use the flowchart below. Start with the number of reactants, then look at what they are.</p>
            ${fig(flowSVG(), 'A decision tree for the common reaction types. Redox can overlap any branch.')}
            <h4>Worked classifications</h4>
            <ul>
              <li><strong>Al + O₂ → Al₂O₃</strong> — two elements, one product → synthesis (and redox).</li>
              <li><strong>CaCO₃ → CaO + CO₂</strong> — one reactant → decomposition.</li>
              <li><strong>Zn + CuSO₄ → ZnSO₄ + Cu</strong> — element + compound → single replacement (and redox).</li>
              <li><strong>AgNO₃ + NaCl → AgCl↓ + NaNO₃</strong> — two compounds, solid forms → precipitation (a double replacement).</li>
              <li><strong>CH₄ + O₂ → CO₂ + H₂O</strong> — O₂ in, CO₂ + H₂O out → combustion.</li>
            </ul>
            <p class="course-example">Also ask: <strong>did any oxidation number change?</strong> If yes, the reaction is also redox — types can overlap.</p>
          `, `
            <p>使用下方的流程圖。先看反應物數量，再看它們是什麼。</p>
            ${fig(flowSVG(), '常見反應類型的決策樹。氧化還原可以與任何分支重疊。')}
            <h4>分類例題</h4>
            <ul>
              <li><strong>Al + O₂ → Al₂O₃</strong>——兩個元素、一個產物 → 合成（也是氧化還原）。</li>
              <li><strong>CaCO₃ → CaO + CO₂</strong>——一個反應物 → 分解。</li>
              <li><strong>Zn + CuSO₄ → ZnSO₄ + Cu</strong>——元素 + 化合物 → 單取代（也是氧化還原）。</li>
              <li><strong>AgNO₃ + NaCl → AgCl↓ + NaNO₃</strong>——兩個化合物、生成固體 → 沉澱（雙取代）。</li>
              <li><strong>CH₄ + O₂ → CO₂ + H₂O</strong>——O₂ 進入、CO₂ + H₂O 出來 → 燃燒。</li>
            </ul>
            <p class="course-example">再問：<strong>有氧化數改變嗎？</strong>若有，反應同時也是氧化還原——類型可以重疊。</p>
          `),
        },
        {
          title: { en: 'Summary and practice', zh: '總結與練習' },
          body: () => L(`
            <ul class="course-checklist">
              <li>Atoms are rearranged, never created or destroyed.</li>
              <li>Balance with coefficients only — never change subscripts.</li>
              <li>Synthesis: A + B → AB. Decomposition: AB → A + B.</li>
              <li>Single replacement needs the activity series.</li>
              <li>Double replacement is driven by a precipitate, gas or water.</li>
              <li>Complete combustion gives CO₂ + H₂O; incomplete gives CO or soot.</li>
              <li>Acid + base → salt + water; acid + carbonate → salt + water + CO₂.</li>
              <li>Oxidation is loss of electrons; reduction is gain.</li>
              <li>Net ionic equations cancel spectator ions.</li>
            </ul>
            ${practice(REACTIONS_PRACTICE, 'rt')}
          `, `
            <ul class="course-checklist">
              <li>原子只是重新排列，從不被創造或消滅。</li>
              <li>只用係數平衡——絕不改下標。</li>
              <li>合成：A + B → AB。分解：AB → A + B。</li>
              <li>單取代需要活性序列。</li>
              <li>雙取代由沉澱、氣體或水驅動。</li>
              <li>完全燃燒生成 CO₂ + H₂O；不完全燃燒生成 CO 或碳黑。</li>
              <li>酸 + 鹼 → 鹽 + 水；酸 + 碳酸鹽 → 鹽 + 水 + CO₂。</li>
              <li>氧化是失去電子；還原是得到電子。</li>
              <li>淨離子方程式會消去旁觀離子。</li>
            </ul>
            ${practice(REACTIONS_PRACTICE, 'rt')}
          `),
        },
        {
          title: { en: 'Course checks', zh: '課程檢查' },
          body: () => L(quiz(REACTIONS_QUIZ, 'rt'), quiz(REACTIONS_QUIZ, 'rt')),
        },
      ],
    },
  ];

  /* ---------- shared rendering ---------- */

  function lessonHTML(course, section, index) {
    const title = L(section.title.en, section.title.zh);
    return `<article class="lesson" id="${course.id}-lesson-${index}" data-lesson="${index}" aria-labelledby="${course.id}-lesson-${index}-title">
      <header class="lesson-head">
        <span class="lesson-num" aria-hidden="true">${pad(index)}</span>
        <h3 class="lesson-title" id="${course.id}-lesson-${index}-title">${title}</h3>
        <span class="lesson-state" aria-hidden="true">${L('Completed', '已完成')}</span>
      </header>
      <div class="lesson-body">${section.body()}</div>
      <footer class="lesson-foot">
        <button class="lesson-done" data-complete="${index}" type="button" aria-pressed="false">
          <span class="lesson-done-box" aria-hidden="true"></span>
          <span class="lesson-done-label">${L('Mark as complete', '標記完成')}</span>
        </button>
        <span class="lesson-foot-note">${L('Saved in this browser', '保存在此瀏覽器')}</span>
      </footer>
    </article>`;
  }

  function renderCourse(course) {
    const root = document.getElementById(course.rootId);
    if (!root) return null;
    root.innerHTML = `
      <div class="lesson-list">
        ${course.sections.map((section, i) => lessonHTML(course, section, i + 1)).join('')}
      </div>
      <footer class="course-finish">
        <p class="lesson-kicker"><span class="asset-ico asset-ico--heart" aria-hidden="true"></span> ${L('End of course', '課程結束')}</p>
        <h4>${L(course.title.en, course.title.zh)}</h4>
        <p data-finish-text>${L(`0 of ${course.sections.length} sections complete. Mark each section as you finish it.`, `已完成 0 / ${course.sections.length} 小節。每完成一節就標記一次。`)}</p>
        <div class="course-finish-actions">
          <button class="course-cta" data-finish-back type="button">&larr; ${L('Back to all courses', '回到所有課程')}</button>
          <button class="course-cta is-quiet" data-finish-top type="button">${L('Back to top', '回到頂端')}</button>
        </div>
      </footer>`;
    enhance(root);
    return root;
  }

  function enhance(root) {
    if (!root.dataset.matterBound) {
      root.dataset.matterBound = '1';
      root.addEventListener('click', onRootClick);
      root.addEventListener('keydown', onRootKeydown);
    }
  }

  function onRootClick(event) {
    const tab = event.target.closest('[data-sci-tab]');
    if (!tab) return;
    const group = tab.closest('[data-sci-tabs]');
    if (!group) return;
    const key = tab.dataset.sciTab;

    group.querySelectorAll('[data-sci-tab]').forEach((button) => {
      const isOn = button === tab;
      button.classList.toggle('is-on', isOn);
      button.setAttribute('aria-selected', String(isOn));
      button.tabIndex = isOn ? 0 : -1;
    });
    group.querySelectorAll('[data-sci-panel]').forEach((panel) => {
      const isOn = panel.dataset.sciPanel === key;
      panel.hidden = !isOn;
      panel.classList.toggle('is-on', isOn);
    });
  }

  function onRootKeydown(event) {
    const tab = event.target.closest('[data-sci-tab]');
    if (!tab) return;
    const group = tab.closest('[data-sci-tabs]');
    if (!group) return;
    const tabs = [...group.querySelectorAll('[data-sci-tab]')];
    const index = tabs.indexOf(tab);
    let next = null;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    else if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
    else if (event.key === 'Home') next = tabs[0];
    else if (event.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    event.preventDefault();
    next.focus();
    next.click();
  }

  function renderAll() {
    COURSES.forEach((course) => renderCourse(course));
  }

  renderAll();

  window.SciLampMatterCourses = {
    repaint: renderAll,
  };
})();
