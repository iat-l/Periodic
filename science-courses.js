/* Four further courses — periodic trends, bonding, stoichiometry and
   electrolysis. Each course renders its own reader body, with native SVG
   plates, reveal-answer practice and a persisted quiz. */

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

  /* ---------- charts ---------- */

  function lineChart(labels, values, opts = {}) {
    const W = 720, H = 300, left = 62, right = 26, top = 30, bottom = 48;
    const pw = W - left - right, ph = H - top - bottom;
    const lo = opts.min ?? 0;
    const hi = opts.max ?? Math.max(...values) * 1.08;
    const x = (i) => left + (i * pw) / Math.max(1, labels.length - 1);
    const y = (v) => top + (1 - (v - lo) / (hi - lo)) * ph;
    const ticks = opts.ticks ?? 4;
    const grid = Array.from({ length: ticks + 1 }, (_, i) => {
      const v = lo + ((hi - lo) * i) / ticks;
      const yy = y(v);
      return `<line x1="${left}" y1="${yy}" x2="${W - right}" y2="${yy}" stroke="var(--line)" stroke-width="1"/>`
        + `<text x="${left - 10}" y="${yy + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${Math.round(v)}</text>`;
    }).join('');
    const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const dots = values.map((v, i) => {
      const hot = opts.highlight?.includes(i);
      return `<circle cx="${x(i)}" cy="${y(v)}" r="${hot ? 6 : 4.2}" fill="${hot ? 'var(--accent)' : 'var(--ink)'}" stroke="var(--paper)" stroke-width="2"/>`;
    }).join('');
    const names = labels.map((label, i) => `<text x="${x(i)}" y="${H - 20}" text-anchor="middle" font-size="12" fill="var(--ink)">${label}</text>`).join('');
    return `<svg class="sci-chart" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      ${grid}
      <line x1="${left}" y1="${top}" x2="${left}" y2="${H - bottom}" stroke="var(--ink)" stroke-width="1.2"/>
      <line x1="${left}" y1="${H - bottom}" x2="${W - right}" y2="${H - bottom}" stroke="var(--ink)" stroke-width="1.2"/>
      <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}${names}
    </svg>`;
  }

  function barChart(labels, values, opts = {}) {
    const W = 720, H = 290, left = 54, right = 24, top = 34, bottom = 54;
    const pw = W - left - right, ph = H - top - bottom;
    const max = opts.max ?? Math.max(...values) * 1.12;
    const step = pw / values.length;
    const bw = Math.min(64, step * 0.56);
    const bars = values.map((v, i) => {
      const h = Math.max(2, (v / max) * ph);
      const xx = left + step * i + (step - bw) / 2;
      const color = opts.colors?.[i] || 'var(--sky-ink)';
      const label = opts.display?.[i] ?? v;
      return `<rect x="${xx}" y="${top + ph - h}" width="${bw}" height="${h}" rx="4" fill="${color}" opacity="0.85"/>
        <text x="${xx + bw / 2}" y="${top + ph - h - 8}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">${label}</text>`;
    }).join('');
    const names = labels.map((label, i) => `<text x="${left + step * i + step / 2}" y="${H - 24}" text-anchor="middle" font-size="12" fill="var(--ink)">${label}</text>`).join('');
    return `<svg class="sci-chart" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <line x1="${left}" y1="${top + ph}" x2="${W - right}" y2="${top + ph}" stroke="var(--ink)" stroke-width="1.2"/>
      ${bars}${names}
    </svg>`;
  }

  function miniTableSVG() {
    const cellW = 29, cellH = 21, gap = 3, x0 = 88, y0 = 26;
    const color = { s: 'var(--cat-a)', d: 'var(--cat-e)', p: 'var(--cat-t)', f: 'var(--cat-m)' };
    let cells = '';
    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 18; col += 1) {
        let block = null;
        if (col < 2) block = 's';
        else if (col < 12 && row >= 2) block = 'd';
        else if (col >= 12) block = 'p';
        if (!block) continue;
        const x = x0 + col * (cellW + gap);
        const y = y0 + row * (cellH + gap);
        cells += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="2" fill="${color[block]}" fill-opacity="0.26" stroke="${color[block]}" stroke-opacity="0.55"/>`;
      }
    }
    for (let col = 2; col < 16; col += 1) {
      const x = x0 + col * (cellW + gap);
      const y = y0 + 6.6 * (cellH + gap);
      cells += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="2" fill="${color.f}" fill-opacity="0.26" stroke="${color.f}" stroke-opacity="0.55"/>`;
    }
    return `<svg class="sci-chart" viewBox="0 0 720 236" aria-hidden="true">${cells}
      <path d="M${x0 + 2 * (cellW + gap) - 10} ${y0 + 2 * (cellH + gap)} v${4 * (cellH + gap) - gap}" stroke="var(--muted)" stroke-dasharray="3 4"/>
    </svg>`;
  }

  function pullSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 220" aria-hidden="true">
      <circle cx="150" cy="104" r="36" fill="var(--blush)" stroke="var(--accent)" stroke-width="2"/>
      <text x="150" y="110" text-anchor="middle" font-size="16" font-family="Georgia, serif" fill="var(--ink)">+11</text>
      <ellipse cx="150" cy="104" rx="92" ry="66" fill="none" stroke="var(--muted)" stroke-dasharray="4 6"/>
      <circle cx="68" cy="72" r="8" fill="var(--muted)"/><circle cx="232" cy="72" r="8" fill="var(--muted)"/>
      <circle cx="86" cy="150" r="8" fill="var(--muted)"/><circle cx="214" cy="150" r="8" fill="var(--muted)"/>
      <circle cx="510" cy="104" r="18" fill="var(--sky)" stroke="var(--sky-ink)" stroke-width="2"/>
      <text x="510" y="109" text-anchor="middle" font-size="13" fill="var(--sky-ink)">e⁻</text>
      <path d="M254 104 H474" stroke="var(--accent)" stroke-width="2" marker-end="url(#pullArrow)"/>
      <text x="364" y="86" text-anchor="middle" font-size="12" fill="var(--accent)">pull of the nucleus</text>
      <path d="M490 170 H100" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="5 5" marker-end="url(#shieldArrow)"/>
      <text x="330" y="194" text-anchor="middle" font-size="12" fill="var(--muted)">push-back from inner electrons</text>
      <defs>
        <marker id="pullArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--accent)"/></marker>
        <marker id="shieldArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--muted)"/></marker>
      </defs>
    </svg>`;
  }

  function isoSeriesSVG() {
    const ions = [
      ['N³⁻', 52], ['O²⁻', 60], ['F⁻', 68], ['Ne', 76], ['Na⁺', 88], ['Mg²⁺', 100], ['Al³⁺', 112],
    ];
    const row = ions.map(([label, r], i) => {
      const x = 92 + i * 90;
      return `<circle cx="${x}" cy="112" r="${r * 0.56}" fill="var(--sky)" fill-opacity="0.5" stroke="var(--sky-ink)" stroke-width="1.8"/>
        <text x="${x}" y="117" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">${label}</text>`;
    }).join('');
    return `<svg class="sci-chart" viewBox="0 0 720 210" aria-hidden="true">
      ${row}
      <path d="M48 184 H674" stroke="var(--line)" stroke-width="1.4" marker-end="url(#isoArrow)"/>
      <text x="58" y="204" font-size="12" fill="var(--muted)">more electrons · larger</text>
      <text x="662" y="204" text-anchor="end" font-size="12" fill="var(--muted)">more protons · smaller</text>
      <defs><marker id="isoArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--muted)"/></marker></defs>
    </svg>`;
  }

  function enScale() {
    return `<div class="sci-scale" aria-hidden="true">
      <div class="sci-scale-seg is-nonpolar"><span>0</span><strong>${L('nonpolar', '非極性')}</strong><span>0.4</span></div>
      <div class="sci-scale-seg is-polar"><span>0.4</span><strong>${L('polar covalent', '極性共價')}</strong><span>1.7</span></div>
      <div class="sci-scale-seg is-ionic"><span>1.7</span><strong>${L('often ionic', '常為離子')}</strong><span>4.0</span></div>
    </div>`;
  }

  function transferSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 250" aria-hidden="true">
      <circle cx="150" cy="120" r="58" fill="var(--butter)" fill-opacity="0.65" stroke="var(--butter-ink)" stroke-width="2"/>
      <circle cx="150" cy="120" r="22" fill="var(--butter-ink)" fill-opacity="0.18"/>
      <text x="150" y="126" text-anchor="middle" font-size="15" font-weight="600" fill="var(--ink)">Na</text>
      <circle cx="214" cy="86" r="7" fill="var(--accent)"/>
      <path d="M246 92 C320 62 370 62 430 92" fill="none" stroke="var(--accent)" stroke-width="2" marker-end="url(#mvArrow)"/>
      <text x="338" y="52" text-anchor="middle" font-size="12" fill="var(--accent)">${L('one electron moves', '一顆電子轉移')}</text>
      <circle cx="540" cy="120" r="70" fill="var(--mint)" fill-opacity="0.7" stroke="var(--mint-ink)" stroke-width="2"/>
      <circle cx="540" cy="120" r="24" fill="var(--mint-ink)" fill-opacity="0.18"/>
      <text x="540" y="126" text-anchor="middle" font-size="15" font-weight="600" fill="var(--ink)">Cl</text>
      <circle cx="598" cy="78" r="6.5" fill="var(--mint-ink)"/><circle cx="614" cy="110" r="6.5" fill="var(--mint-ink)"/>
      <circle cx="600" cy="148" r="6.5" fill="var(--mint-ink)"/><circle cx="570" cy="180" r="6.5" fill="var(--mint-ink)"/>
      <text x="150" y="222" text-anchor="middle" font-size="13" fill="var(--muted)">${L('Na loses 1 e⁻ → Na⁺', 'Na 失去 1 e⁻ → Na⁺')}</text>
      <text x="540" y="222" text-anchor="middle" font-size="13" fill="var(--muted)">${L('Cl gains 1 e⁻ → Cl⁻', 'Cl 得到 1 e⁻ → Cl⁻')}</text>
      <defs><marker id="mvArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--accent)"/></marker></defs>
    </svg>`;
  }

  function overlapSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 250" aria-hidden="true">
      <circle cx="290" cy="120" r="82" fill="var(--sky)" fill-opacity="0.42" stroke="var(--sky-ink)" stroke-width="1.8"/>
      <circle cx="410" cy="120" r="82" fill="var(--mint)" fill-opacity="0.42" stroke="var(--mint-ink)" stroke-width="1.8"/>
      <circle cx="290" cy="120" r="15" fill="var(--sky-ink)" fill-opacity="0.35"/>
      <circle cx="410" cy="120" r="15" fill="var(--mint-ink)" fill-opacity="0.35"/>
      <circle cx="350" cy="104" r="5.5" fill="var(--ink)"/><circle cx="350" cy="136" r="5.5" fill="var(--ink)"/>
      <text x="290" y="126" text-anchor="middle" font-size="15" font-weight="600" fill="var(--ink)">H</text>
      <text x="410" y="126" text-anchor="middle" font-size="15" font-weight="600" fill="var(--ink)">H</text>
      <text x="360" y="216" text-anchor="middle" font-size="12" fill="var(--muted)">${L('one shared pair = one single bond', '一對共用電子 = 一個單鍵')}</text>
    </svg>`;
  }

  function dipoleSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 190" aria-hidden="true">
      <text x="280" y="104" text-anchor="middle" font-size="22" font-family="Georgia, serif" fill="var(--ink)">H</text>
      <line x1="304" y1="96" x2="420" y2="96" stroke="var(--ink)" stroke-width="2.4"/>
      <text x="450" y="104" text-anchor="middle" font-size="22" font-family="Georgia, serif" fill="var(--ink)">Cl</text>
      <text x="262" y="66" font-size="14" fill="var(--muted)">δ+</text>
      <text x="464" y="66" font-size="14" fill="var(--muted)">δ−</text>
      <path d="M360 128 H448" stroke="var(--accent)" stroke-width="2" marker-end="url(#dipArrow)"/>
      <text x="404" y="154" text-anchor="middle" font-size="12" fill="var(--accent)">${L('electron pull', '電子被拉向')}</text>
      <defs><marker id="dipArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--accent)"/></marker></defs>
    </svg>`;
  }

  function lewisSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 260" aria-hidden="true">
      <g transform="translate(90 10)">
        <circle cx="90" cy="110" r="3" fill="var(--ink)"/><circle cx="60" cy="86" r="3" fill="var(--ink)"/>
        <circle cx="60" cy="134" r="3" fill="var(--ink)"/><circle cx="122" cy="86" r="3" fill="var(--ink)"/>
        <circle cx="122" cy="134" r="3" fill="var(--ink)"/>
        <text x="90" y="116" text-anchor="middle" font-size="18" font-family="Georgia, serif" fill="var(--ink)">O</text>
        <line x1="82" y1="98" x2="52" y2="64" stroke="var(--ink)" stroke-width="2"/><text x="38" y="58" font-size="16" fill="var(--ink)">H</text>
        <line x1="98" y1="98" x2="128" y2="64" stroke="var(--ink)" stroke-width="2"/><text x="136" y="58" font-size="16" fill="var(--ink)">H</text>
        <text x="90" y="214" text-anchor="middle" font-size="12" fill="var(--muted)">H₂O · ${L('2 lone pairs', '2 對孤電子')}</text>
      </g>
      <g transform="translate(300 10)">
        <text x="90" y="116" text-anchor="middle" font-size="18" font-family="Georgia, serif" fill="var(--ink)">N</text>
        <circle cx="90" cy="84" r="3" fill="var(--ink)"/>
        <line x1="80" y1="98" x2="52" y2="64" stroke="var(--ink)" stroke-width="2"/><text x="38" y="58" font-size="16" fill="var(--ink)">H</text>
        <line x1="100" y1="98" x2="128" y2="64" stroke="var(--ink)" stroke-width="2"/><text x="136" y="58" font-size="16" fill="var(--ink)">H</text>
        <line x1="90" y1="112" x2="90" y2="152" stroke="var(--ink)" stroke-width="2"/><text x="82" y="170" font-size="16" fill="var(--ink)">H</text>
        <text x="90" y="214" text-anchor="middle" font-size="12" fill="var(--muted)">NH₃ · ${L('1 lone pair', '1 對孤電子')}</text>
      </g>
      <g transform="translate(510 10)">
        <text x="30" y="116" text-anchor="middle" font-size="18" font-family="Georgia, serif" fill="var(--ink)">O</text>
        <line x1="46" y1="104" x2="76" y2="104" stroke="var(--ink)" stroke-width="2"/><line x1="46" y1="116" x2="76" y2="116" stroke="var(--ink)" stroke-width="2"/>
        <text x="90" y="116" text-anchor="middle" font-size="18" font-family="Georgia, serif" fill="var(--ink)">C</text>
        <line x1="104" y1="104" x2="134" y2="104" stroke="var(--ink)" stroke-width="2"/><line x1="104" y1="116" x2="134" y2="116" stroke="var(--ink)" stroke-width="2"/>
        <text x="150" y="116" text-anchor="middle" font-size="18" font-family="Georgia, serif" fill="var(--ink)">O</text>
        <text x="90" y="214" text-anchor="middle" font-size="12" fill="var(--muted)">CO₂ · ${L('2 double bonds', '2 個雙鍵')}</text>
      </g>
    </svg>`;
  }

  function metalSeaSVG() {
    let ions = '', electrons = '';
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const x = 90 + c * 78 + (r % 2) * 22;
        const y = 66 + r * 62;
        ions += `<circle cx="${x}" cy="${y}" r="21" fill="var(--sky)" stroke="var(--sky-ink)" stroke-width="1.5"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="12" fill="var(--sky-ink)">+</text>`;
      }
    }
    for (let i = 0; i < 20; i += 1) {
      const x = 82 + (i * 97) % 570;
      const y = 54 + (i * 53) % 146;
      electrons += `<circle cx="${x}" cy="${y}" r="4.5" fill="var(--accent)"/>`;
    }
    return `<svg class="sci-chart" viewBox="0 0 720 250" aria-hidden="true">${ions}${electrons}
      <text x="360" y="236" text-anchor="middle" font-size="12" fill="var(--muted)">${L('positive ions fixed · electrons free to drift', '正離子固定 · 電子自由漂移')}</text>
    </svg>`;
  }

  function roadMapSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 300" aria-hidden="true">
      <rect x="52" y="86" width="150" height="66" rx="10" fill="var(--butter)" stroke="var(--butter-ink)"/>
      <text x="127" y="116" text-anchor="middle" font-size="14" font-weight="600" fill="var(--ink)">${L('Mass', '質量')}</text>
      <text x="127" y="136" text-anchor="middle" font-size="12" fill="var(--muted)">g</text>
      <rect x="286" y="86" width="150" height="66" rx="10" fill="var(--blush)" stroke="var(--accent)"/>
      <text x="361" y="116" text-anchor="middle" font-size="14" font-weight="600" fill="var(--ink)">${L('Moles', '莫耳')}</text>
      <text x="361" y="136" text-anchor="middle" font-size="12" fill="var(--muted)">mol</text>
      <rect x="520" y="86" width="150" height="66" rx="10" fill="var(--sky)" stroke="var(--sky-ink)"/>
      <text x="595" y="116" text-anchor="middle" font-size="14" font-weight="600" fill="var(--ink)">${L('Particles', '粒子')}</text>
      <text x="595" y="136" text-anchor="middle" font-size="12" fill="var(--muted)">atoms · molecules</text>
      <path d="M206 112 H278" stroke="var(--accent)" stroke-width="2" marker-end="url(#rmArrow)"/>
      <path d="M278 128 H206" stroke="var(--muted)" stroke-width="1.4" marker-end="url(#rmArrow2)"/>
      <text x="242" y="100" text-anchor="middle" font-size="11" fill="var(--accent)">÷ M</text>
      <text x="242" y="148" text-anchor="middle" font-size="11" fill="var(--muted)">× M</text>
      <path d="M440 112 H512" stroke="var(--accent)" stroke-width="2" marker-end="url(#rmArrow)"/>
      <path d="M512 128 H440" stroke="var(--muted)" stroke-width="1.4" marker-end="url(#rmArrow2)"/>
      <text x="476" y="100" text-anchor="middle" font-size="11" fill="var(--accent)">× N<tspan dy="3" font-size="8">A</tspan></text>
      <text x="476" y="148" text-anchor="middle" font-size="11" fill="var(--muted)">÷ N<tspan dy="3" font-size="8">A</tspan></text>
      <rect x="286" y="210" width="150" height="62" rx="10" fill="var(--mint)" stroke="var(--mint-ink)"/>
      <text x="361" y="238" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink)">${L('Gas volume', '氣體體積')}</text>
      <text x="361" y="257" text-anchor="middle" font-size="12" fill="var(--muted)">L at STP</text>
      <path d="M361 156 V202" stroke="var(--accent)" stroke-width="2" marker-end="url(#rmArrow)"/>
      <path d="M345 202 V156" stroke="var(--muted)" stroke-width="1.4" marker-end="url(#rmArrow2)"/>
      <text x="390" y="182" font-size="11" fill="var(--accent)">× 22.4</text>
      <defs>
        <marker id="rmArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--accent)"/></marker>
        <marker id="rmArrow2" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--muted)"/></marker>
      </defs>
    </svg>`;
  }

  function donutSVG() {
    const c = 2 * Math.PI * 74;
    const h = 0.1119 * c;
    return `<svg class="sci-chart" viewBox="0 0 720 250" aria-hidden="true">
      <circle cx="220" cy="125" r="74" fill="none" stroke="var(--line)" stroke-width="28"/>
      <circle cx="220" cy="125" r="74" fill="none" stroke="var(--sky-ink)" stroke-width="28" stroke-dasharray="${c - h} ${c}" transform="rotate(-90 220 125)"/>
      <circle cx="220" cy="125" r="74" fill="none" stroke="var(--accent)" stroke-width="28" stroke-dasharray="${h} ${c}" transform="rotate(-90 220 125)"/>
      <text x="220" y="132" text-anchor="middle" font-size="24" font-family="Georgia, serif" fill="var(--ink)">H₂O</text>
      <circle cx="400" cy="98" r="7" fill="var(--accent)"/><text x="416" y="103" font-size="14" fill="var(--ink)">H 11.19%</text>
      <circle cx="400" cy="142" r="7" fill="var(--sky-ink)"/><text x="416" y="147" font-size="14" fill="var(--ink)">O 88.79%</text>
      <text x="400" y="186" font-size="12" fill="var(--muted)">${L('mass percent, by definition', '依定義的質量百分比')}</text>
    </svg>`;
  }

  function empiricalSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 220" aria-hidden="true">
      <rect x="74" y="58" width="170" height="94" rx="12" fill="var(--butter)" stroke="var(--butter-ink)"/>
      <text x="159" y="98" text-anchor="middle" font-size="24" font-family="Georgia, serif" fill="var(--ink)">CH₂O</text>
      <text x="159" y="124" text-anchor="middle" font-size="12" fill="var(--muted)">${L('empirical · simplest ratio', '實驗式 · 最簡整數比')}</text>
      <path d="M258 104 H356" stroke="var(--accent)" stroke-width="2" marker-end="url(#empArrow)"/>
      <text x="306" y="88" text-anchor="middle" font-size="12" fill="var(--accent)">× 6</text>
      <rect x="370" y="58" width="270" height="94" rx="12" fill="var(--mint)" stroke="var(--mint-ink)"/>
      <text x="505" y="98" text-anchor="middle" font-size="24" font-family="Georgia, serif" fill="var(--ink)">C₆H₁₂O₆</text>
      <text x="505" y="124" text-anchor="middle" font-size="12" fill="var(--muted)">${L('molecular · actual count', '分子式 · 實際原子數')}</text>
      <text x="360" y="190" text-anchor="middle" font-size="12" fill="var(--muted)">${L('molar mass 180 ÷ empirical mass 30 = 6', '莫耳質量 180 ÷ 實驗式質量 30 = 6')}</text>
      <defs><marker id="empArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--accent)"/></marker></defs>
    </svg>`;
  }

  function beakerSVG() {
    let dots = '';
    const spots = [[150, 120], [178, 96], [210, 132], [236, 104], [260, 150], [190, 168], [240, 186], [126, 164]];
    spots.forEach(([x, y]) => { dots += `<circle cx="${x}" cy="${y}" r="6" fill="var(--accent)" fill-opacity="0.75"/>`; });
    return `<svg class="sci-chart" viewBox="0 0 720 250" aria-hidden="true">
      <path d="M110 54 v128 a58 58 0 0 0 58 58 h96 a58 58 0 0 0 58 -58 V54" fill="var(--sky)" fill-opacity="0.35" stroke="var(--sky-ink)" stroke-width="2"/>
      <path d="M126 138 h180" stroke="var(--sky-ink)" stroke-width="1.4" stroke-dasharray="4 5"/>
      ${dots}
      <text x="216" y="88" text-anchor="middle" font-size="12" fill="var(--muted)">${L('solvent + solute', '溶劑 + 溶質')}</text>
      <text x="410" y="92" font-size="15" font-style="italic" font-family="Georgia, serif" fill="var(--ink)">M = mol ÷ L</text>
      <text x="410" y="124" font-size="13" fill="var(--muted)">${L('molarity, in mol per litre', '體積莫耳濃度，每公升莫耳數')}</text>
      <text x="410" y="164" font-size="15" font-style="italic" font-family="Georgia, serif" fill="var(--ink)">M₁V₁ = M₂V₂</text>
      <text x="410" y="190" font-size="12" fill="var(--muted)">${L('dilution keeps the same moles', '稀釋前後莫耳數不變')}</text>
    </svg>`;
  }

  let cellSeq = 0;

  function cellSVG() {
    const arrowId = `cellArrow-${++cellSeq}`;
    let ions = '';
    for (let i = 0; i < 8; i += 1) {
      const x = 190 + (i * 53) % 300;
      const y = 240 + (i * 37) % 70;
      const plus = i % 2 === 0;
      ions += `<circle cx="${x}" cy="${y}" r="8" fill="${plus ? 'var(--accent)' : 'var(--sky-ink)'}" fill-opacity="0.18" stroke="${plus ? 'var(--accent)' : 'var(--sky-ink)'}"/>
        <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" fill="var(--ink)">${plus ? '+' : '−'}</text>`;
    }
    return `<svg class="sci-chart" viewBox="0 0 720 400" aria-hidden="true">
      <rect x="252" y="26" width="196" height="52" rx="8" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.6"/>
      <rect x="252" y="26" width="98" height="52" fill="var(--accent)" fill-opacity="0.2"/>
      <text x="350" y="58" text-anchor="middle" font-size="13" fill="var(--ink)">${L('power supply', '電源')}</text>
      <path d="M252 52 H148 V118" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <path d="M448 52 H572 V118" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <path d="M160 78 H238" stroke="var(--accent)" stroke-width="2" marker-end="url(#${arrowId})"/>
      <text x="198" y="70" text-anchor="middle" font-size="11" fill="var(--accent)">e⁻</text>
      <path d="M560 78 H466" stroke="var(--accent)" stroke-width="2" marker-end="url(#${arrowId})"/>
      <text x="512" y="70" text-anchor="middle" font-size="11" fill="var(--accent)">e⁻</text>
      <path d="M128 142 v72 a34 34 0 0 0 34 34 h396 a34 34 0 0 0 34 -34 v-72" fill="var(--sky)" fill-opacity="0.3" stroke="var(--sky-ink)" stroke-width="2"/>
      <rect x="206" y="118" width="24" height="160" rx="5" fill="var(--accent)" fill-opacity="0.55" stroke="var(--accent)"/>
      <rect x="490" y="118" width="24" height="160" rx="5" fill="var(--ink)" fill-opacity="0.35" stroke="var(--ink)"/>
      <text x="218" y="108" text-anchor="middle" font-size="12" font-weight="600" fill="var(--accent)">${L('anode +', '陽極 +')}</text>
      <text x="502" y="108" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">${L('cathode −', '陰極 −')}</text>
      ${ions}
      <text x="360" y="372" text-anchor="middle" font-size="12" fill="var(--muted)">${L('anode: oxidation · cathode: reduction', '陽極：氧化 · 陰極：還原')}</text>
      <defs><marker id="${arrowId}" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--accent)"/></marker></defs>
    </svg>`;
  }

  function yieldRing() {
    const c = 2 * Math.PI * 70;
    return `<svg class="sci-chart" viewBox="0 0 720 230" aria-hidden="true">
      <circle cx="180" cy="115" r="70" fill="none" stroke="var(--line)" stroke-width="26"/>
      <circle cx="180" cy="115" r="70" fill="none" stroke="var(--accent)" stroke-width="26" stroke-dasharray="${0.867 * c} ${c}" transform="rotate(-90 180 115)"/>
      <text x="180" y="122" text-anchor="middle" font-size="26" font-family="Georgia, serif" fill="var(--ink)">86.7%</text>
      <text x="376" y="92" font-size="14" fill="var(--ink)">${L('actual 9.80 g', '實際 9.80 g')}</text>
      <text x="376" y="124" font-size="14" fill="var(--ink)">${L('theoretical 11.3 g', '理論 11.3 g')}</text>
      <text x="376" y="162" font-size="12" fill="var(--muted)">${L('percent yield = actual ÷ theoretical × 100%', '產率 = 實際 ÷ 理論 × 100%')}</text>
    </svg>`;
  }

  /* ---------- practice sets (MCQs; counted with each course’s quiz) ---------- */

  const BONDING_PRACTICE = [
    {
      q: ['Classify the bond in <strong>MgO</strong>.', '判斷 <strong>MgO</strong> 中的鍵型。'],
      options: [['Ionic', '離子鍵'], ['Nonpolar covalent', '非極性共價'], ['Polar covalent', '極性共價'], ['Metallic', '金屬鍵']],
      answer: 0,
      hint: ['A group-2 metal with a nonmetal; the electronegativity difference is large.', '第 2 族金屬加非金屬；電負度差很大。'],
      explain: ['Magnesium transfers two electrons to oxygen, and the ions attract in a lattice.', '鎂把兩個電子轉移給氧，形成的離子以晶格互相吸引。'],
    },
    {
      q: ['In CO₂, the C=O bonds are… and the molecule is…', 'CO₂ 的 C=O 鍵是……，而分子整體是……'],
      options: [['Polar bonds; nonpolar molecule', '極性鍵；非極性分子'], ['Polar bonds; polar molecule', '極性鍵；極性分子'], ['Nonpolar bonds; nonpolar molecule', '非極性鍵；非極性分子'], ['Nonpolar bonds; polar molecule', '非極性鍵；極性分子']],
      answer: 0,
      hint: ['The molecule is linear, so its two bond dipoles point in opposite directions.', '分子是直線形，兩個鍵偶極方向相反。'],
      explain: ['Each C=O bond is polar, but the linear shape cancels the dipoles.', '每個 C=O 鍵都有極性，但直線形狀使偶極抵消。'],
    },
    {
      q: ['Which has the higher melting point: <strong>NaCl</strong> or <strong>H₂O</strong>?', '哪個熔點較高：<strong>NaCl</strong> 還是 <strong>H₂O</strong>？'],
      options: [['NaCl', 'NaCl'], ['H₂O', 'H₂O'], ['They are equal', '兩者相等'], ['Both are gases at room temperature', '兩者在常溫都是氣體']],
      answer: 0,
      hint: ['Compare a whole ionic lattice with the forces between molecules.', '把整個離子晶格與分子間作用力相比。'],
      explain: ['Breaking a strong ionic lattice needs far more energy than overcoming hydrogen bonds between water molecules.', '破壞強離子晶格比克服水分子間的氫鍵需要更多能量。'],
    },
    {
      q: ['What is the strongest intermolecular force in liquid <strong>NH₃</strong>?', '液態 <strong>NH₃</strong> 中最強的分子間作用力是什麼？'],
      options: [['London dispersion', '倫敦分散力'], ['Dipole–dipole only', '只有偶極－偶極'], ['Hydrogen bonding', '氫鍵'], ['Ionic bonding', '離子鍵']],
      answer: 2,
      hint: ['H is bonded directly to N, one of the three small, highly electronegative atoms.', 'H 直接與 N 相連——N 是三個高電負度小原子之一。'],
      explain: ['N–H hydrogen bonds dominate and are stronger than ordinary dipole–dipole attractions.', 'N–H 氫鍵主導，強於一般偶極－偶極吸引。'],
    },
    {
      q: ['Which bond is shorter: <strong>C–C</strong> or <strong>C=C</strong>?', '哪個鍵較短：<strong>C–C</strong> 還是 <strong>C=C</strong>？'],
      options: [['C–C', 'C–C'], ['C=C', 'C=C'], ['They are equal', '兩者相等'], ['Cannot be compared', '無法比較']],
      answer: 1,
      hint: ['More shared pairs pull the nuclei closer together.', '共用電子對越多，原子核越靠近。'],
      explain: ['The double bond has a higher bond order, so it is shorter and stronger than the single bond.', '雙鍵鍵級較高，因此比單鍵短也更強。'],
    },
    {
      q: ['Which has the highest boiling point: <strong>CH₄</strong>, <strong>HCl</strong> or <strong>H₂O</strong>?', '哪個沸點最高：<strong>CH₄</strong>、<strong>HCl</strong> 還是 <strong>H₂O</strong>？'],
      options: [['CH₄', 'CH₄'], ['HCl', 'HCl'], ['H₂O', 'H₂O'], ['All three are equal', '三者相等']],
      answer: 2,
      hint: ['The strongest intermolecular force wins.', '最強的分子間作用力勝出。'],
      explain: ['H₂O hydrogen-bonds; HCl has dipole–dipole forces; CH₄ has only dispersion forces.', 'H₂O 有氫鍵；HCl 有偶極－偶極；CH₄ 只有分散力。'],
    },
  ];

  const STOICH_PRACTICE = [
    {
      q: ['How many moles are in <strong>12.5 g CaCO₃</strong>? (M = 100.09 g/mol)', '<strong>12.5 g CaCO₃</strong> 有多少莫耳？（M = 100.09 g/mol）'],
      options: [['0.125 mol', '0.125 mol'], ['0.250 mol', '0.250 mol'], ['0.800 mol', '0.800 mol'], ['1.25 mol', '1.25 mol']],
      answer: 0,
      hint: ['Divide mass by molar mass.', '質量除以莫耳質量。'],
      explain: ['12.5 ÷ 100.09 = 0.125 mol.', '12.5 ÷ 100.09 = 0.125 mol。'],
    },
    {
      q: ['How many molecules are in <strong>0.250 mol CO₂</strong>?', '<strong>0.250 mol CO₂</strong> 有多少個分子？'],
      options: [['1.51 × 10²³', '1.51 × 10²³'], ['3.01 × 10²³', '3.01 × 10²³'], ['6.02 × 10²³', '6.02 × 10²³'], ['1.51 × 10²²', '1.51 × 10²²']],
      answer: 0,
      hint: ['Multiply moles by Avogadro’s number.', '莫耳數乘以亞佛加厥常數。'],
      explain: ['0.250 × 6.022 × 10²³ = 1.51 × 10²³ molecules.', '0.250 × 6.022 × 10²³ = 1.51 × 10²³ 個分子。'],
    },
    {
      q: ['What is the mass of <strong>3.00 mol NaCl</strong>? (M = 58.44 g/mol)', '<strong>3.00 mol NaCl</strong> 的質量是多少？（M = 58.44 g/mol）'],
      options: [['58.4 g', '58.4 g'], ['117 g', '117 g'], ['175 g', '175 g'], ['351 g', '351 g']],
      answer: 2,
      hint: ['Rearrange n = m ÷ M to solve for mass.', '把 n = m ÷ M 移項求質量。'],
      explain: ['3.00 × 58.44 = 175 g.', '3.00 × 58.44 = 175 g。'],
    },
    {
      q: ['Balance: <strong>Al + O₂ → Al₂O₃</strong>', '平衡：<strong>Al + O₂ → Al₂O₃</strong>'],
      options: [['2Al + O₂ → Al₂O₃', '2Al + O₂ → Al₂O₃'], ['4Al + 3O₂ → 2Al₂O₃', '4Al + 3O₂ → 2Al₂O₃'], ['3Al + 2O₂ → Al₂O₃', '3Al + 2O₂ → Al₂O₃'], ['Al + O₂ → AlO₂', 'Al + O₂ → AlO₂']],
      answer: 1,
      hint: ['Balance oxygen first, then aluminium.', '先平衡氧，再平衡鋁。'],
      explain: ['4Al + 3O₂ → 2Al₂O₃ has 4 Al and 6 O on each side.', '4Al + 3O₂ → 2Al₂O₃ 兩側各有 4 個 Al 與 6 個 O。'],
    },
    {
      q: ['How many grams of H₂O form from <strong>4.00 g H₂</strong> with excess O₂?', '<strong>4.00 g H₂</strong> 與過量 O₂ 可生成多少克 H₂O？'],
      options: [['18.0 g', '18.0 g'], ['35.7 g', '35.7 g'], ['71.4 g', '71.4 g'], ['4.00 g', '4.00 g']],
      answer: 1,
      hint: ['Convert H₂ to moles, apply the 2:2 ratio, then multiply by 18.02 g/mol.', '把 H₂ 換成莫耳，用 2:2 比例，再乘以 18.02 g/mol。'],
      explain: ['4.00 g H₂ = 1.98 mol; the ratio gives 1.98 mol H₂O = 35.7 g.', '4.00 g H₂ = 1.98 mol；比例給出 1.98 mol H₂O = 35.7 g。'],
    },
    {
      q: ['How many grams of NH₃ can form from <strong>5.00 g N₂</strong> with excess H₂? (N₂ + 3H₂ → 2NH₃)', '<strong>5.00 g N₂</strong> 與過量 H₂ 可生成多少克 NH₃？（N₂ + 3H₂ → 2NH₃）'],
      options: [['3.04 g', '3.04 g'], ['6.08 g', '6.08 g'], ['12.2 g', '12.2 g'], ['17.0 g', '17.0 g']],
      answer: 1,
      hint: ['Find moles of N₂, use the 1:2 ratio, then multiply by 17.03 g/mol.', '先求 N₂ 莫耳數，用 1:2 比例，再乘以 17.03 g/mol。'],
      explain: ['5.00 g N₂ = 0.178 mol → 0.357 mol NH₃ → 6.08 g.', '5.00 g N₂ = 0.178 mol → 0.357 mol NH₃ → 6.08 g。'],
    },
  ];

  const ELECTROLYSIS_PRACTICE = [
    {
      q: ['In an electrolytic cell, which electrode is the cathode, and what happens there?', '電解池中哪個電極是陰極？那裡發生什麼？'],
      options: [['Negative electrode; reduction', '負電極；還原'], ['Positive electrode; oxidation', '正電極；氧化'], ['Negative electrode; oxidation', '負電極；氧化'], ['Positive electrode; reduction', '正電極；還原']],
      answer: 0,
      hint: ['Reduction always happens at the cathode; electrolysis drives it with a power supply.', '還原總在陰極發生；電解用電源驅動它。'],
      explain: ['The cathode is negative in electrolysis, and reduction (gain of electrons) occurs there.', '電解時陰極為負，還原（得電子）在陰極發生。'],
    },
    {
      q: ['Calculate the mass of Cu deposited by <strong>2.00 A</strong> for <strong>30.0 min</strong> from CuSO₄(aq). (F = 96,485 C/mol)', '<strong>2.00 A</strong> 通電 <strong>30.0 分鐘</strong>，可從 CuSO₄(aq) 析出多少克銅？（F = 96,485 C/mol）'],
      options: [['0.593 g', '0.593 g'], ['1.19 g', '1.19 g'], ['2.37 g', '2.37 g'], ['4.74 g', '4.74 g']],
      answer: 1,
      hint: ['Q = It; n(e⁻) = Q ÷ F; Cu²⁺ needs two electrons per atom.', 'Q = It；n(e⁻) = Q ÷ F；每個 Cu²⁺ 需要兩個電子。'],
      explain: ['Q = 3600 C; 0.0373 mol e⁻; 0.0187 mol Cu; 1.19 g.', 'Q = 3600 C；0.0373 mol e⁻；0.0187 mol Cu；1.19 g。'],
    },
    {
      q: ['What volume of H₂ at STP forms when <strong>0.500 A</strong> passes for <strong>1.00 h</strong> through acidified water? (F = 96,485 C/mol; Vm = 22.4 L/mol)', '<strong>0.500 A</strong> 通電 <strong>1.00 小時</strong>通過酸化水，STP 下產生多少體積的 H₂？（F = 96,485 C/mol；Vm = 22.4 L/mol）'],
      options: [['0.104 L', '0.104 L'], ['0.209 L', '0.209 L'], ['0.418 L', '0.418 L'], ['0.837 L', '0.837 L']],
      answer: 1,
      hint: ['2H⁺ + 2e⁻ → H₂; then multiply moles of H₂ by 22.4 L/mol.', '2H⁺ + 2e⁻ → H₂；再把 H₂ 莫耳數乘以 22.4 L/mol。'],
      explain: ['Q = 1800 C; 0.0187 mol e⁻; 0.00933 mol H₂; 0.209 L.', 'Q = 1800 C；0.0187 mol e⁻；0.00933 mol H₂；0.209 L。'],
    },
    {
      q: ['Why is H₂ produced instead of Na at the cathode in aqueous NaCl?', '為何食鹽水電解時陰極產生 H₂ 而不是 Na？'],
      options: [['Na⁺ is too reactive to be reduced in water; water is reduced instead', 'Na⁺ 太活潑，在水中不會被還原；水先被還原'], ['Cl⁻ blocks the cathode', 'Cl⁻ 阻擋陰極'], ['Water is a nonpolar solvent', '水是非極性溶劑'], ['Na is a gas at room temperature', 'Na 在常溫是氣體']],
      answer: 0,
      hint: ['Check the reactivity series; very reactive cations stay in solution.', '看看活性序列；非常活潑的陽離子會留在溶液中。'],
      explain: ['Water is reduced to H₂ and OH⁻, while Na⁺ remains in solution.', '水被還原成 H₂ 與 OH⁻，Na⁺ 則留在溶液中。'],
    },
    {
      q: ['What happens at the anode when CuSO₄(aq) is electrolyzed with <strong>inert</strong> electrodes?', 'CuSO₄(aq) 用<strong>惰性</strong>電極電解時，陽極發生什麼？'],
      options: [['O₂ is produced', '產生 O₂'], ['Copper dissolves', '銅溶解'], ['Sulfate is oxidized', '硫酸根被氧化'], ['Nothing happens', '什麼都不發生']],
      answer: 0,
      hint: ['With inert electrodes, water is oxidized before sulfate.', '使用惰性電極時，水比硫酸根先被氧化。'],
      explain: ['2H₂O → O₂ + 4H⁺ + 4e⁻ at the anode; sulfate stays in solution.', '陽極：2H₂O → O₂ + 4H⁺ + 4e⁻；硫酸根留在溶液中。'],
    },
    {
      q: ['How long does it take to deposit <strong>1.00 g of Ag</strong> from Ag⁺ solution at <strong>2.00 A</strong>? (F = 96,485 C/mol; M(Ag) = 107.87 g/mol)', '<strong>2.00 A</strong> 從 Ag⁺ 溶液析出 <strong>1.00 g 銀</strong>需要多久？（F = 96,485 C/mol；M(Ag) = 107.87 g/mol）'],
      options: [['224 s', '224 秒'], ['447 s', '447 秒'], ['894 s', '894 秒'], ['1,790 s', '1,790 秒']],
      answer: 1,
      hint: ['Ag⁺ + e⁻ → Ag, so moles of electrons equal moles of silver.', 'Ag⁺ + e⁻ → Ag，所以電子莫耳數等於銀莫耳數。'],
      explain: ['n(Ag) = 9.27 × 10⁻³ mol; Q = 894 C; t ≈ 447 s (about 7.5 min).', 'n(Ag) = 9.27 × 10⁻³ mol；Q = 894 C；t 約 447 秒（約 7.5 分鐘）。'],
    },
  ];

  const KSP_PRACTICE = [
    {
      q: ['Which is the correct <strong>Ksp expression</strong> for PbI₂?', 'PbI₂ 正確的 <strong>Ksp 表示式</strong>是哪一個？'],
      options: [['[Pb²⁺][I⁻]', '[Pb²⁺][I⁻]'], ['[Pb²⁺][I⁻]²', '[Pb²⁺][I⁻]²'], ['[Pb²⁺]²[I⁻]', '[Pb²⁺]²[I⁻]'], ['[PbI₂]', '[PbI₂]']],
      answer: 1,
      hint: ['The exponent of each ion equals its coefficient in the dissociation equation.', '每個離子的指數等於解離方程式中它的係數。'],
      explain: ['PbI₂(s) ⇌ Pb²⁺ + 2I⁻, so Ksp = [Pb²⁺][I⁻]². The solid is omitted.', 'PbI₂(s) ⇌ Pb²⁺ + 2I⁻，所以 Ksp = [Pb²⁺][I⁻]²。固體不列入。'],
    },
    {
      q: ['The Ksp of BaSO₄ is <strong>1.1 × 10⁻¹⁰</strong>. What is its molar solubility in pure water?', 'BaSO₄ 的 Ksp 是 <strong>1.1 × 10⁻¹⁰</strong>。它在純水中的莫耳溶解度是多少？'],
      options: [['1.05 × 10⁻⁵ M', '1.05 × 10⁻⁵ M'], ['1.1 × 10⁻¹⁰ M', '1.1 × 10⁻¹⁰ M'], ['5.5 × 10⁻¹¹ M', '5.5 × 10⁻¹¹ M'], ['2.1 × 10⁻⁵ M', '2.1 × 10⁻⁵ M']],
      answer: 0,
      hint: ['BaSO₄ is a 1:1 salt, so Ksp = s².', 'BaSO₄ 是 1:1 鹽，所以 Ksp = s²。'],
      explain: ['s = √(1.1 × 10⁻¹⁰) = 1.05 × 10⁻⁵ M.', 's = √(1.1 × 10⁻¹⁰) = 1.05 × 10⁻⁵ M。'],
    },
    {
      q: ['The molar solubility of Ag₂S is <strong>1.0 × 10⁻¹⁷ M</strong>. What is Ksp?', 'Ag₂S 的莫耳溶解度是 <strong>1.0 × 10⁻¹⁷ M</strong>。Ksp 是多少？'],
      options: [['1.0 × 10⁻³⁴', '1.0 × 10⁻³⁴'], ['2.0 × 10⁻³⁴', '2.0 × 10⁻³⁴'], ['4.0 × 10⁻⁵¹', '4.0 × 10⁻⁵¹'], ['1.0 × 10⁻⁵¹', '1.0 × 10⁻⁵¹']],
      answer: 2,
      hint: ['Ag₂S gives 2Ag⁺ + S²⁻, so Ksp = (2s)²(s) = 4s³.', 'Ag₂S 給出 2Ag⁺ + S²⁻，所以 Ksp = (2s)²(s) = 4s³。'],
      explain: ['Ksp = 4(1.0 × 10⁻¹⁷)³ = 4.0 × 10⁻⁵¹.', 'Ksp = 4(1.0 × 10⁻¹⁷)³ = 4.0 × 10⁻⁵¹。'],
    },
    {
      q: ['What is the molar solubility of CaF₂ in <strong>0.10 M NaF</strong>? Ksp = 3.9 × 10⁻¹¹.', 'CaF₂ 在 <strong>0.10 M NaF</strong> 中的莫耳溶解度是多少？Ksp = 3.9 × 10⁻¹¹。'],
      options: [['2.1 × 10⁻⁴ M', '2.1 × 10⁻⁴ M'], ['3.9 × 10⁻⁹ M', '3.9 × 10⁻⁹ M'], ['3.9 × 10⁻¹⁰ M', '3.9 × 10⁻¹⁰ M'], ['6.2 × 10⁻⁶ M', '6.2 × 10⁻⁶ M']],
      answer: 1,
      hint: ['The common ion F⁻ fixes [F⁻] ≈ 0.10 M.', '同離子 F⁻ 使 [F⁻] ≈ 0.10 M。'],
      explain: ['3.9 × 10⁻¹¹ = s(0.10)² → s = 3.9 × 10⁻⁹ M.', '3.9 × 10⁻¹¹ = s(0.10)² → s = 3.9 × 10⁻⁹ M。'],
    },
    {
      q: ['Equal volumes of <strong>0.020 M AgNO₃</strong> and <strong>0.020 M NaCl</strong> are mixed. What happens? Ksp(AgCl) = 1.8 × 10⁻¹⁰.', '等體積的 <strong>0.020 M AgNO₃</strong> 與 <strong>0.020 M NaCl</strong> 混合，會發生什麼？Ksp(AgCl) = 1.8 × 10⁻¹⁰。'],
      options: [['No precipitate: Q < Ksp', '不沉澱：Q < Ksp'], ['Precipitate forms: Q > Ksp', '形成沉澱：Q > Ksp'], ['Exactly saturated: Q = Ksp', '恰好飽和：Q = Ksp'], ['AgCl dissolves further', 'AgCl 會繼續溶解']],
      answer: 1,
      hint: ['Equal volumes halve each concentration; then Q = [Ag⁺][Cl⁻].', '等體積使各濃度減半；再算 Q = [Ag⁺][Cl⁻]。'],
      explain: ['[Ag⁺] = [Cl⁻] = 0.010 M; Q = 1.0 × 10⁻⁴ > Ksp, so AgCl precipitates.', '[Ag⁺] = [Cl⁻] = 0.010 M；Q = 1.0 × 10⁻⁴ > Ksp，所以 AgCl 沉澱。'],
    },
    {
      q: ['100.0 mL of <strong>0.0050 M Pb(NO₃)₂</strong> is mixed with 100.0 mL of <strong>0.010 M KCl</strong>. Will PbCl₂ precipitate? Ksp = 1.6 × 10⁻⁵.', '<strong>0.0050 M Pb(NO₃)₂</strong> 100.0 mL 與 <strong>0.010 M KCl</strong> 100.0 mL 混合，會生成 PbCl₂ 沉澱嗎？Ksp = 1.6 × 10⁻⁵。'],
      options: [['Yes: Q = 6.25 × 10⁻⁸ > Ksp', '會：Q = 6.25 × 10⁻⁸ > Ksp'], ['No: Q = 6.25 × 10⁻⁸ < Ksp', '不會：Q = 6.25 × 10⁻⁸ < Ksp'], ['Yes: Q = 2.5 × 10⁻⁷ > Ksp', '會：Q = 2.5 × 10⁻⁷ > Ksp'], ['No: Q = 1.25 × 10⁻⁷ < Ksp', '不會：Q = 1.25 × 10⁻⁷ < Ksp']],
      answer: 1,
      hint: ['After mixing: [Pb²⁺] = 0.0025 M and [Cl⁻] = 0.0050 M. Use Q = [Pb²⁺][Cl⁻]².', '混合後：[Pb²⁺] = 0.0025 M、[Cl⁻] = 0.0050 M。用 Q = [Pb²⁺][Cl⁻]²。'],
      explain: ['Q = (0.0025)(0.0050)² = 6.25 × 10⁻⁸, which is below 1.6 × 10⁻⁵, so no precipitate forms.', 'Q = (0.0025)(0.0050)² = 6.25 × 10⁻⁸，低於 1.6 × 10⁻⁵，所以不形成沉澱。'],
    },
  ];

  const ACIDS_PRACTICE = [
    {
      q: ['What is the pH of <strong>0.010 M HCl</strong>?', '<strong>0.010 M HCl</strong> 的 pH 是多少？'],
      options: [['1.00', '1.00'], ['2.00', '2.00'], ['7.00', '7.00'], ['12.00', '12.00']],
      answer: 1,
      hint: ['HCl is a strong monoprotic acid: [H⁺] equals the acid concentration.', 'HCl 是強單質子酸：[H⁺] 等於酸的濃度。'],
      explain: ['pH = −log(0.010) = 2.00.', 'pH = −log(0.010) = 2.00。'],
    },
    {
      q: ['What is the pH of <strong>0.020 M NaOH</strong> at 25 °C?', '25 °C 下 <strong>0.020 M NaOH</strong> 的 pH 是多少？'],
      options: [['1.70', '1.70'], ['12.30', '12.30'], ['2.00', '2.00'], ['13.30', '13.30']],
      answer: 1,
      hint: ['Find pOH first, then subtract from 14.00.', '先求 pOH，再從 14.00 減去。'],
      explain: ['pOH = −log(0.020) = 1.70; pH = 14.00 − 1.70 = 12.30.', 'pOH = −log(0.020) = 1.70；pH = 14.00 − 1.70 = 12.30。'],
    },
    {
      q: ['What is the pH of <strong>0.10 M acetic acid</strong>? Ka = 1.8 × 10⁻⁵.', '<strong>0.10 M 醋酸</strong>的 pH 是多少？Ka = 1.8 × 10⁻⁵。'],
      options: [['1.00', '1.00'], ['2.87', '2.87'], ['4.74', '4.74'], ['11.13', '11.13']],
      answer: 1,
      hint: ['Use x = √(Ka · C) for a weak acid.', '弱酸使用 x = √(Ka · C)。'],
      explain: ['x = √(1.8 × 10⁻⁵ × 0.10) = 1.34 × 10⁻³ M; pH = 2.87.', 'x = √(1.8 × 10⁻⁵ × 0.10) = 1.34 × 10⁻³ M；pH = 2.87。'],
    },
    {
      q: ['What is the pH of <strong>0.10 M NH₃</strong>? Kb = 1.8 × 10⁻⁵.', '<strong>0.10 M NH₃</strong> 的 pH 是多少？Kb = 1.8 × 10⁻⁵。'],
      options: [['2.87', '2.87'], ['11.13', '11.13'], ['4.74', '4.74'], ['9.26', '9.26']],
      answer: 1,
      hint: ['Find [OH⁻], then pOH, then pH = 14.00 − pOH.', '先求 [OH⁻]，再求 pOH，最後 pH = 14.00 − pOH。'],
      explain: ['x = 1.34 × 10⁻³ M OH⁻; pOH = 2.87; pH = 11.13.', 'x = 1.34 × 10⁻³ M OH⁻；pOH = 2.87；pH = 11.13。'],
    },
    {
      q: ['A buffer has <strong>0.10 M acetic acid</strong> and <strong>0.20 M sodium acetate</strong>. pKa = 4.74. What is its pH?', '緩衝液含 <strong>0.10 M 醋酸</strong>與 <strong>0.20 M 醋酸鈉</strong>，pKa = 4.74。pH 是多少？'],
      options: [['4.44', '4.44'], ['4.74', '4.74'], ['5.04', '5.04'], ['9.26', '9.26']],
      answer: 2,
      hint: ['Use pH = pKa + log([A⁻]/[HA]).', '使用 pH = pKa + log([A⁻]/[HA])。'],
      explain: ['pH = 4.74 + log(0.20 / 0.10) = 4.74 + 0.30 = 5.04.', 'pH = 4.74 + log(0.20 / 0.10) = 4.74 + 0.30 = 5.04。'],
    },
    {
      q: ['25.0 mL of <strong>0.100 M acetic acid</strong> is titrated with 0.100 M NaOH. What is the pH at the <strong>half-equivalence point</strong>?', '<strong>0.100 M 醋酸</strong> 25.0 mL 用 0.100 M NaOH 滴定。<strong>半當量點</strong>的 pH 是多少？'],
      options: [['4.74', '4.74'], ['7.00', '7.00'], ['8.72', '8.72'], ['2.87', '2.87']],
      answer: 0,
      hint: ['At half-equivalence [HA] = [A⁻], so pH = pKa.', '半當量點時 [HA] = [A⁻]，所以 pH = pKa。'],
      explain: ['For acetic acid pKa = 4.74, and at half-equivalence pH = pKa = 4.74.', '醋酸的 pKa = 4.74；半當量點 pH = pKa = 4.74。'],
    },
  ];

  /* ---------- solubility figures and interactions ---------- */

  function kspEquilibriumSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 260" aria-hidden="true">
      <rect x="56" y="30" width="250" height="194" rx="12" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <path d="M68 92 H294 V210 A12 12 0 0 1 282 222 H80 A12 12 0 0 1 68 210 Z" fill="var(--sky)" fill-opacity="0.18"/>
      <path d="M92 208 l20 -18 22 18 z" fill="var(--butter-deep)" stroke="var(--butter-ink)" stroke-width="1.4"/>
      <path d="M132 212 l15 -13 18 13 z" fill="var(--butter-deep)" stroke="var(--butter-ink)" stroke-width="1.4"/>
      <circle cx="112" cy="122" r="11" fill="var(--mint)" stroke="var(--mint-ink)" stroke-width="1.5"/>
      <text x="112" y="126" text-anchor="middle" font-size="10" font-weight="600" fill="var(--mint-ink)">Ag⁺</text>
      <circle cx="170" cy="102" r="10" fill="var(--sky)" stroke="var(--sky-ink)" stroke-width="1.5"/>
      <text x="170" y="106" text-anchor="middle" font-size="10" font-weight="600" fill="var(--sky-ink)">Cl⁻</text>
      <circle cx="228" cy="136" r="11" fill="var(--mint)" stroke="var(--mint-ink)" stroke-width="1.5"/>
      <text x="228" y="140" text-anchor="middle" font-size="10" font-weight="600" fill="var(--mint-ink)">Ag⁺</text>
      <circle cx="252" cy="96" r="10" fill="var(--sky)" stroke="var(--sky-ink)" stroke-width="1.5"/>
      <text x="252" y="100" text-anchor="middle" font-size="10" font-weight="600" fill="var(--sky-ink)">Cl⁻</text>
      <circle cx="150" cy="172" r="10" fill="var(--sky)" stroke="var(--sky-ink)" stroke-width="1.5"/>
      <text x="150" y="176" text-anchor="middle" font-size="10" font-weight="600" fill="var(--sky-ink)">Cl⁻</text>
      <circle cx="214" cy="186" r="11" fill="var(--mint)" stroke="var(--mint-ink)" stroke-width="1.5"/>
      <text x="214" y="190" text-anchor="middle" font-size="10" font-weight="600" fill="var(--mint-ink)">Ag⁺</text>
      <text x="181" y="248" text-anchor="middle" font-size="12" fill="var(--muted)">${L('saturated solution with solid present', '有固體存在的飽和溶液')}</text>

      <path d="M348 158 V98" fill="none" stroke="var(--mint-ink)" stroke-width="2" marker-end="url(#kspUp)"/>
      <path d="M406 98 V158" fill="none" stroke="var(--accent)" stroke-width="2" marker-end="url(#kspDown)"/>
      <text x="348" y="82" text-anchor="middle" font-size="12" fill="var(--mint-ink)">${L('dissolves', '溶解')}</text>
      <text x="406" y="178" text-anchor="middle" font-size="12" fill="var(--accent)">${L('precipitates', '沉澱')}</text>

      <text x="478" y="94" font-size="13" fill="var(--muted)">${L('equilibrium constant', '平衡常數')}</text>
      <text x="478" y="128" font-family="Georgia, serif" font-size="25" fill="var(--ink)">Ksp = [Ag⁺][Cl⁻]</text>
      <text x="478" y="158" font-size="13" fill="var(--muted)">${L('The solid AgCl is left out.', '固體 AgCl 不列入。')}</text>
      <text x="478" y="180" font-size="13" fill="var(--muted)">${L('Temperature changes Ksp; amount of solid does not.', '溫度會改變 Ksp；固體量則不會。')}</text>
      <defs>
        <marker id="kspUp" markerWidth="9" markerHeight="9" refX="4.5" refY="1" orient="auto"><path d="M0 9 L4.5 0 L9 9 z" fill="var(--mint-ink)"/></marker>
        <marker id="kspDown" markerWidth="9" markerHeight="9" refX="4.5" refY="8" orient="auto"><path d="M0 0 L4.5 9 L9 0 z" fill="var(--accent)"/></marker>
      </defs>
    </svg>`;
  }

  function commonIonSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 260" aria-hidden="true">
      <rect x="54" y="34" width="238" height="168" rx="12" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <path d="M66 88 H280 V186 A10 10 0 0 1 270 196 H76 A10 10 0 0 1 66 186 Z" fill="var(--sky)" fill-opacity="0.16"/>
      ${[
        [100, 120], [150, 108], [206, 132], [246, 112], [130, 160], [222, 168],
      ].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="var(--mint)" stroke="var(--mint-ink)" stroke-width="1.5"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="9" font-weight="600" fill="var(--mint-ink)">Ag⁺</text>`).join('')}
      ${[
        [120, 136], [180, 150], [232, 96], [98, 176], [190, 118],
      ].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="var(--sky)" stroke="var(--sky-ink)" stroke-width="1.5"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="9" font-weight="600" fill="var(--sky-ink)">Cl⁻</text>`).join('')}
      <text x="173" y="226" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink)">${L('pure water', '純水')}</text>
      <text x="173" y="246" text-anchor="middle" font-size="12" fill="var(--muted)">s ≈ 1.3 × 10⁻⁵ M</text>

      <path d="M330 118 H400" stroke="var(--muted)" stroke-width="1.8" stroke-dasharray="5 5" marker-end="url(#ciArrow)"/>
      <text x="365" y="102" text-anchor="middle" font-size="12" fill="var(--muted)">${L('add Cl⁻', '加入 Cl⁻')}</text>

      <rect x="428" y="34" width="238" height="168" rx="12" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <path d="M440 88 H654 V186 A10 10 0 0 1 644 196 H450 A10 10 0 0 1 440 186 Z" fill="var(--sky)" fill-opacity="0.24"/>
      <circle cx="540" cy="140" r="10" fill="var(--mint)" stroke="var(--mint-ink)" stroke-width="1.5"/>
      <text x="540" y="144" text-anchor="middle" font-size="9" font-weight="600" fill="var(--mint-ink)">Ag⁺</text>
      ${[[480, 110], [510, 168], [570, 112], [610, 158], [590, 188], [470, 148], [620, 112], [545, 188]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="var(--sky)" stroke="var(--sky-ink)" stroke-width="1.5"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="9" font-weight="600" fill="var(--sky-ink)">Cl⁻</text>`).join('')}
      <text x="547" y="226" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink)">0.10 M NaCl</text>
      <text x="547" y="246" text-anchor="middle" font-size="12" fill="var(--muted)">s ≈ 1.8 × 10⁻⁹ M</text>
      <defs><marker id="ciArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--muted)"/></marker></defs>
    </svg>`;
  }

  function qkspSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 220" aria-hidden="true">
      <rect x="62" y="92" width="258" height="18" rx="9" fill="var(--mint)" stroke="var(--mint-ink)" stroke-opacity="0.35"/>
      <rect x="320" y="92" width="338" height="18" rx="9" fill="var(--blush)" stroke="var(--blush-ink)" stroke-opacity="0.35"/>
      <line x1="320" y1="78" x2="320" y2="126" stroke="var(--ink)" stroke-width="2" stroke-dasharray="4 4"/>
      <text x="191" y="72" text-anchor="middle" font-size="14" font-weight="600" fill="var(--mint-ink)">Q &lt; Ksp</text>
      <text x="320" y="146" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink)">Q = Ksp</text>
      <text x="489" y="72" text-anchor="middle" font-size="14" font-weight="600" fill="var(--accent)">Q &gt; Ksp</text>
      <text x="191" y="174" text-anchor="middle" font-size="12" fill="var(--muted)">${L('unsaturated — no precipitate', '未飽和——不沉澱')}</text>
      <text x="320" y="194" text-anchor="middle" font-size="12" fill="var(--muted)">${L('saturated', '飽和')}</text>
      <text x="489" y="174" text-anchor="middle" font-size="12" fill="var(--muted)">${L('supersaturated — precipitate forms', '過飽和——形成沉澱')}</text>
      <path d="M489 112 V132" stroke="var(--accent)" stroke-width="2"/>
      <circle cx="489" cy="112" r="4" fill="var(--accent)"/>
      <text x="489" y="152" text-anchor="middle" font-size="11" fill="var(--accent)">${L('Q of this mixture', '此混合液的 Q')}</text>
    </svg>`;
  }

  function selectiveSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 250" aria-hidden="true">
      <rect x="60" y="48" width="210" height="150" rx="10" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <path d="M72 96 H258 V182 A10 10 0 0 1 248 192 H82 A10 10 0 0 1 72 182 Z" fill="var(--sky)" fill-opacity="0.16"/>
      <text x="165" y="78" text-anchor="middle" font-size="11" fill="var(--muted)">Cl⁻ · I⁻</text>
      <path d="M96 184 l18 -16 20 16 z" fill="var(--butter)" stroke="var(--butter-ink)" stroke-width="1.5"/>
      <path d="M132 186 l14 -12 18 12 z" fill="var(--butter)" stroke="var(--butter-ink)" stroke-width="1.5"/>
      <circle cx="200" cy="170" r="5" fill="var(--butter-ink)"/><circle cx="218" cy="178" r="4" fill="var(--butter-ink)"/>
      <text x="165" y="220" text-anchor="middle" font-size="13" font-weight="600" fill="var(--butter-ink)">${L('AgI(s) first', '先沉澱 AgI(s)')}</text>
      <text x="165" y="238" text-anchor="middle" font-size="11" fill="var(--muted)">${L('smaller Ksp: 8.3 × 10⁻¹⁷', '較小的 Ksp：8.3 × 10⁻¹⁷')}</text>

      <path d="M286 128 H382" stroke="var(--muted)" stroke-width="1.8" stroke-dasharray="5 5" marker-end="url(#selArrow)"/>
      <text x="334" y="112" text-anchor="middle" font-size="12" fill="var(--muted)">${L('more Ag⁺', '再加 Ag⁺')}</text>

      <rect x="398" y="48" width="210" height="150" rx="10" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <path d="M410 96 H596 V182 A10 10 0 0 1 586 192 H420 A10 10 0 0 1 410 182 Z" fill="var(--sky)" fill-opacity="0.16"/>
      <text x="503" y="78" text-anchor="middle" font-size="11" fill="var(--muted)">${L('Cl⁻ (I⁻ used up)', 'Cl⁻（I⁻ 已耗盡）')}</text>
      <path d="M438 186 l20 -18 22 18 z" fill="var(--paper-3)" stroke="var(--muted)" stroke-width="1.4"/>
      <path d="M478 188 l15 -13 18 13 z" fill="var(--paper-3)" stroke="var(--muted)" stroke-width="1.4"/>
      <circle cx="530" cy="176" r="5" fill="var(--muted)"/><circle cx="548" cy="184" r="4" fill="var(--muted)"/>
      <text x="503" y="220" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink)">${L('AgCl(s) later', '後沉澱 AgCl(s)')}</text>
      <text x="503" y="238" text-anchor="middle" font-size="11" fill="var(--muted)">${L('larger Ksp: 1.8 × 10⁻¹⁰', '較大的 Ksp：1.8 × 10⁻¹⁰')}</text>
      <defs><marker id="selArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--muted)"/></marker></defs>
    </svg>`;
  }

  function saltExplorer() {
    const salts = [
      {
        key: 'agcl',
        label: 'AgCl',
        dissociation: 'AgCl(s) ⇌ Ag⁺ + Cl⁻',
        expression: 'Ksp = [Ag⁺][Cl⁻]',
        value: '1.8 × 10⁻¹⁰',
        formula: 'Ksp = s²',
        result: '1.3 × 10⁻⁵ M',
        note: ['One of each ion: Ksp = s².', '每種離子各一個：Ksp = s²。'],
      },
      {
        key: 'caf2',
        label: 'CaF₂',
        dissociation: 'CaF₂(s) ⇌ Ca²⁺ + 2F⁻',
        expression: 'Ksp = [Ca²⁺][F⁻]²',
        value: '3.9 × 10⁻¹¹',
        formula: 'Ksp = (s)(2s)² = 4s³',
        result: '2.1 × 10⁻⁴ M',
        note: ['Two fluoride ions per formula unit, so [F⁻] = 2s.', '每個化學式單位有兩個氟離子，所以 [F⁻] = 2s。'],
      },
      {
        key: 'ag2cro4',
        label: 'Ag₂CrO₄',
        dissociation: 'Ag₂CrO₄(s) ⇌ 2Ag⁺ + CrO₄²⁻',
        expression: 'Ksp = [Ag⁺]²[CrO₄²⁻]',
        value: '1.1 × 10⁻¹²',
        formula: 'Ksp = (2s)²(s) = 4s³',
        result: '6.5 × 10⁻⁵ M',
        note: ['Same 4s³ shape as CaF₂, but the ions are swapped.', '與 CaF₂ 同為 4s³ 形式，只是離子對調。'],
      },
      {
        key: 'aloh3',
        label: 'Al(OH)₃',
        dissociation: 'Al(OH)₃(s) ⇌ Al³⁺ + 3OH⁻',
        expression: 'Ksp = [Al³⁺][OH⁻]³',
        value: '1.9 × 10⁻³³',
        formula: 'Ksp = (s)(3s)³ = 27s⁴',
        result: '2.9 × 10⁻⁹ M',
        note: ['Three hydroxides per unit: the cube creates a large 27.', '每個單位有三個氫氧根：三次方產生很大的 27。'],
      },
    ];

    return `<div class="sci-tabs" data-sci-tabs>
      <div class="sci-tablist" role="tablist" aria-label="${L('Pick a salt', '選一種鹽')}">
        ${salts.map((salt, i) => `<button class="sci-tab${i === 0 ? ' is-on' : ''}" type="button" role="tab" id="ksp-tab-${salt.key}" aria-selected="${i === 0}" aria-controls="ksp-panel-${salt.key}" tabindex="${i === 0 ? 0 : -1}" data-sci-tab="${salt.key}">${salt.label}</button>`).join('')}
      </div>
      <div class="sci-tabpanels">
        ${salts.map((salt, i) => `<div class="sci-tabpanel${i === 0 ? ' is-on' : ''}" id="ksp-panel-${salt.key}" role="tabpanel" aria-labelledby="ksp-tab-${salt.key}" data-sci-panel="${salt.key}"${i === 0 ? '' : ' hidden'}>
          <p class="sci-tab-dissociation">${salt.dissociation}</p>
          <p class="sci-tab-equation">${salt.expression}</p>
          <dl class="sci-tab-stats">
            <div><dt>Ksp</dt><dd>${salt.value}</dd></div>
            <div><dt>${L('Molar solubility', '莫耳溶解度')}</dt><dd>${salt.formula} → s = ${salt.result}</dd></div>
          </dl>
          <p class="sci-tab-note">${L(salt.note[0], salt.note[1])}</p>
        </div>`).join('')}
      </div>
    </div>`;
  }

  /* ---------- acid–base figures and interactions ---------- */

  function phLabMarkup() {
    return `<div class="sci-lab" data-ph-lab>
      <div class="sci-lab-top">
        <div class="sci-lab-readout">
          <span class="sci-lab-kicker">pH</span>
          <span class="sci-lab-value" data-ph-value>7.0</span>
          <span class="sci-lab-tag" data-ph-label data-kind="neutral">${L('Neutral', '中性')}</span>
        </div>
        <div class="sci-lab-stats">
          <span>[H⁺] <strong data-ph-h>1.0 × 10⁻⁷ M</strong></span>
          <span>[OH⁻] <strong data-ph-oh>1.0 × 10⁻⁷ M</strong></span>
        </div>
      </div>
      <div class="sci-ph-track" aria-hidden="true">${'<i></i>'.repeat(15)}<span class="sci-ph-marker" data-ph-marker></span></div>
      <input class="sci-range" type="range" min="0" max="14" step="0.1" value="7" data-ph-range aria-label="${L('Drag to explore the pH scale', '拖動以探索 pH 尺度')}" />
      <div class="sci-lab-scale" aria-hidden="true"><span>0 · ${L('acidic', '酸性')}</span><span>7 · ${L('neutral', '中性')}</span><span>14 · ${L('basic', '鹼性')}</span></div>
    </div>`;
  }

  function bufferActionSVG() {
    return `<svg class="sci-chart" viewBox="0 0 720 240" aria-hidden="true">
      <circle cx="108" cy="112" r="34" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
      <text x="108" y="118" text-anchor="middle" font-size="16" font-weight="600" fill="var(--accent-deep)">H⁺</text>
      <path d="M150 112 H266" stroke="var(--accent)" stroke-width="2" marker-end="url(#bufArrowA)"/>
      <text x="208" y="96" text-anchor="middle" font-size="11" fill="var(--accent)">${L('consumed by A⁻', '被 A⁻ 消耗')}</text>
      <rect x="272" y="78" width="176" height="68" rx="34" fill="var(--mint)" stroke="var(--mint-ink)" stroke-width="1.8"/>
      <text x="360" y="109" text-anchor="middle" font-size="16" font-weight="600" fill="var(--mint-ink)">HA ⇌ H⁺ + A⁻</text>
      <text x="360" y="132" text-anchor="middle" font-size="11" fill="var(--mint-ink)">${L('the reservoir', '儲備池')}</text>
      <path d="M454 112 H566" stroke="var(--sky-ink)" stroke-width="2" marker-end="url(#bufArrowB)"/>
      <text x="510" y="96" text-anchor="middle" font-size="11" fill="var(--sky-ink)">${L('consumed by HA', '被 HA 消耗')}</text>
      <circle cx="612" cy="112" r="34" fill="var(--sky)" stroke="var(--sky-ink)" stroke-width="2"/>
      <text x="612" y="118" text-anchor="middle" font-size="16" font-weight="600" fill="var(--sky-ink)">OH⁻</text>
      <text x="208" y="166" text-anchor="middle" font-size="12" fill="var(--muted)">A⁻ + H⁺ → HA</text>
      <text x="510" y="166" text-anchor="middle" font-size="12" fill="var(--muted)">HA + OH⁻ → A⁻ + H₂O</text>
      <text x="360" y="212" text-anchor="middle" font-size="12" fill="var(--muted)">${L('added acid or base is absorbed; pH changes only a little', '加入的酸或鹼被吸收；pH 只會小幅改變')}</text>
      <defs>
        <marker id="bufArrowA" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--accent)"/></marker>
        <marker id="bufArrowB" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="var(--sky-ink)"/></marker>
      </defs>
    </svg>`;
  }

  function smoothPath(points) {
    if (!points.length) return '';
    let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }

  function titrationSVG() {
    const W = 720, H = 340, left = 60, right = 26, top = 28, bottom = 56;
    const pw = W - left - right, ph = H - top - bottom;
    const x = (v) => left + (v / 50) * pw;
    const y = (p) => top + (1 - p / 14) * ph;

    const grid = [0, 2, 4, 6, 8, 10, 12, 14].map((p) => {
      const yy = y(p);
      return `<line x1="${left}" y1="${yy}" x2="${W - right}" y2="${yy}" stroke="var(--line)" stroke-width="1"/>
        <text x="${left - 10}" y="${yy + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${p}</text>`;
    }).join('');

    const vgrid = [0, 10, 20, 30, 40, 50].map((v) => {
      const xx = x(v);
      return `<line x1="${xx}" y1="${top}" x2="${xx}" y2="${H - bottom}" stroke="var(--line-soft)" stroke-width="1"/>
        <text x="${xx}" y="${H - bottom + 20}" text-anchor="middle" font-size="11" fill="var(--muted)">${v}</text>`;
    }).join('');

    const strong = [[0, 1], [5, 1.18], [10, 1.37], [15, 1.6], [20, 1.95], [22, 2.2], [23, 2.45], [24, 2.85], [24.5, 3.5], [24.8, 5.0], [25, 7], [25.2, 9], [25.5, 10.5], [26, 11.1], [27, 11.6], [29, 12.0], [33, 12.4], [40, 12.7], [50, 12.9]];
    const weak = [[0, 2.87], [2, 3.6], [5, 4.1], [8, 4.42], [10, 4.56], [12.5, 4.74], [15, 4.92], [18, 5.15], [20, 5.35], [22, 5.65], [23.5, 6.05], [24.5, 6.7], [25, 8.72], [25.4, 9.9], [26, 10.6], [27, 11.2], [29, 11.7], [33, 12.1], [40, 12.5], [50, 12.8]];

    const strongPath = smoothPath(strong.map(([v, p]) => [x(v), y(p)]));
    const weakPath = smoothPath(weak.map(([v, p]) => [x(v), y(p)]));

    return `<svg class="sci-chart" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      ${grid}${vgrid}
      <line x1="${left}" y1="${top}" x2="${left}" y2="${H - bottom}" stroke="var(--ink)" stroke-width="1.2"/>
      <line x1="${left}" y1="${H - bottom}" x2="${W - right}" y2="${H - bottom}" stroke="var(--ink)" stroke-width="1.2"/>
      <line x1="${x(25)}" y1="${top}" x2="${x(25)}" y2="${H - bottom}" stroke="var(--muted)" stroke-width="1.1" stroke-dasharray="4 5"/>
      <text x="${x(25) + 6}" y="${top + 14}" font-size="11" fill="var(--muted)">${L('equivalence', '當量點')}</text>
      <path d="${strongPath}" fill="none" stroke="var(--sky-ink)" stroke-width="2.6" stroke-linecap="round"/>
      <path d="${weakPath}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="${x(12.5)}" cy="${y(4.74)}" r="4.5" fill="var(--accent)" stroke="var(--paper)" stroke-width="2"/>
      <text x="${x(12.5) + 10}" y="${y(4.74) - 10}" font-size="11" fill="var(--accent)">${L('half-equivalence: pH = pKa', '半當量點：pH = pKa')}</text>
      <line x1="${W - 210}" y1="${top + 10}" x2="${W - 186}" y2="${top + 10}" stroke="var(--sky-ink)" stroke-width="2.6"/>
      <text x="${W - 180}" y="${top + 14}" font-size="11" fill="var(--ink)">${L('strong acid', '強酸')}</text>
      <line x1="${W - 210}" y1="${top + 30}" x2="${W - 186}" y2="${top + 30}" stroke="var(--accent)" stroke-width="2.6"/>
      <text x="${W - 180}" y="${top + 34}" font-size="11" fill="var(--ink)">${L('weak acid', '弱酸')}</text>
      <text x="${left + pw / 2}" y="${H - 12}" text-anchor="middle" font-size="12" fill="var(--ink)">${L('volume of NaOH added / mL', '加入的 NaOH 體積 / mL')}</text>
      <text x="22" y="${top + ph / 2}" text-anchor="middle" font-size="12" fill="var(--ink)" transform="rotate(-90 22 ${top + ph / 2})">pH</text>
    </svg>`;
  }

  /* ---------- courses ---------- */

  const COURSES = [
    {
      id: 'periodic-trends',
      rootId: 'course-body-periodic-trends',
      title: { en: 'Periodic Trends', zh: '週期趨勢' },
      sections: [
        {
          title: { en: 'The shape of the table', zh: '週期表的形狀' },
          body: () => L(`
            <p>The periodic table is arranged by <strong>increasing atomic number</strong> — the number of protons. Elements in the same <strong>group</strong> (column) share the same number of valence electrons, so they behave in similar ways.</p>
            ${fig(miniTableSVG(), 'A stylised table: s, d, p and f blocks in four tints. Periods run across; groups run down.')}
            <h4>Periods, groups and blocks</h4>
            <ul>
              <li><strong>Periods</strong> are the horizontal rows.</li>
              <li><strong>Groups</strong> are the vertical columns; group number tells you the valence count for the main-group elements.</li>
              <li><strong>Blocks</strong> — s, p, d and f — name the sublevel being filled.</li>
            </ul>
            ${table(['Group', 'Family', 'Valence electrons'], [
              ['1', 'Alkali metals', '1'],
              ['2', 'Alkaline earth metals', '2'],
              ['17', 'Halogens', '7'],
              ['18', 'Noble gases', '8 (2 for He)'],
            ])}
            <p class="course-example">Periodic trends are the patterns in size, energy and attraction that repeat as you move across or down this map.</p>
          `, `
            <p>週期表依<strong>原子序遞增</strong>排列——也就是質子數。同一<strong>族</strong>（行）的元素有相同數量的價電子，因此行為相似。</p>
            ${fig(miniTableSVG(), '風格化的週期表：s、d、p、f 四個區塊以四種色調表示。週期橫向，族縱向。')}
            <h4>週期、族與區塊</h4>
            <ul>
              <li><strong>週期</strong>是水平列。</li>
              <li><strong>族</strong>是垂直行；主族元素的族號告訴你價電子數。</li>
              <li><strong>區塊</strong>——s、p、d、f——表示正在填入的次殼層。</li>
            </ul>
            ${table(['族', '家族', '價電子'], [
              ['1', '鹼金屬', '1'],
              ['2', '鹼土金屬', '2'],
              ['17', '鹵素', '7'],
              ['18', '惰性氣體', '8（He 為 2）'],
            ])}
            <p class="course-example">週期趨勢就是沿著這張地圖橫向或縱向移動時，尺寸、能量與吸引力重複出現的規律。</p>
          `),
        },
        {
          title: { en: 'A tug of war: Z_eff and shielding', zh: '拔河：有效核電荷與遮蔽' },
          body: () => L(`
            <p>Nearly every trend comes from two competing pulls:</p>
            <ol>
              <li><strong>Nuclear charge</strong> — more protons pull the outer electrons inward.</li>
              <li><strong>Shielding</strong> — inner electrons cancel part of that pull.</li>
            </ol>
            <p>The net pull felt by a valence electron is the <strong>effective nuclear charge</strong>:</p>
            <p class="atomic-eq">\\[Z_{\\text{eff}} \\approx Z - S\\]</p>
            <p>Here \\(Z\\) is the atomic number and \\(S\\) is roughly the number of inner electrons.</p>
            ${fig(pullSVG(), 'The nucleus pulls the outer electron in; the inner shells screen part of that pull.')}
            ${table(['Element', 'Protons', 'Inner electrons (approx.)', 'Pull on valence shell'], [
              ['Na', '11', '10', 'weak'],
              ['Mg', '12', '10', 'stronger'],
              ['Al', '13', '10', 'strongest of the three'],
            ])}
            <p class="course-example">Across a period, protons are added while shielding stays almost the same — so \\(Z_{\\text{eff}}\\) rises and the atom tightens.</p>
          `, `
            <p>幾乎每個趨勢都來自兩股互相競爭的拉力：</p>
            <ol>
              <li><strong>核電荷</strong>——質子越多，外層電子被拉得越緊。</li>
              <li><strong>遮蔽</strong>——內層電子抵消部分拉力。</li>
            </ol>
            <p>價電子實際感受到的淨拉力稱為<strong>有效核電荷</strong>：</p>
            <p class="atomic-eq">\\[Z_{\\text{eff}} \\approx Z - S\\]</p>
            <p>其中 \\(Z\\) 是原子序，\\(S\\) 大約是內層電子數。</p>
            ${fig(pullSVG(), '原子核把外層電子往內拉；內層電子則擋住部分拉力。')}
            ${table(['元素', '質子', '內層電子（約）', '對價殼層的拉力'], [
              ['Na', '11', '10', '弱'],
              ['Mg', '12', '10', '較強'],
              ['Al', '13', '10', '三者中最強'],
            ])}
            <p class="course-example">同一週期由左至右，質子增加而遮蔽幾乎不變——所以 \\(Z_{\\text{eff}}\\) 上升，原子收緊。</p>
          `),
        },
        {
          title: { en: 'Atomic radius', zh: '原子半徑' },
          body: () => L(`
            <p><strong>Atomic radius</strong> is half the distance between the nuclei of two bonded atoms of the same element.</p>
            <h4>Across a period: smaller</h4>
            ${fig(lineChart(['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl'], [186, 160, 143, 117, 110, 104, 99], { min: 0, max: 210, ticks: 3 }), 'Atomic radius in picometres, period 3. The trend is downward.')}
            <p>Protons increase, shielding barely changes, so \\(Z_{\\text{eff}}\\) climbs and pulls the outer shell closer.</p>
            <h4>Down a group: larger</h4>
            ${fig(lineChart(['Li', 'Na', 'K', 'Rb', 'Cs'], [152, 186, 227, 248, 265], { min: 0, max: 300, ticks: 3 }), 'Atomic radius in picometres, group 1. Each step adds a new shell.')}
            <p>Each new period adds a principal shell, so the outer electrons sit farther from the nucleus even though the charge grows.</p>
            <p class="course-example">Across period 3: Na &gt; Mg &gt; Al &gt; Si &gt; P &gt; S &gt; Cl. Down group 1: Li &lt; Na &lt; K &lt; Rb &lt; Cs.</p>
          `, `
            <p><strong>原子半徑</strong>是同種元素的兩個成鍵原子，其原子核間距的一半。</p>
            <h4>同週期：變小</h4>
            ${fig(lineChart(['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl'], [186, 160, 143, 117, 110, 104, 99], { min: 0, max: 210, ticks: 3 }), '第三週期原子半徑（皮米），趨勢向下。')}
            <p>質子增加、遮蔽幾乎不變，所以 \\(Z_{\\text{eff}}\\) 上升，把外層拉得更近。</p>
            <h4>同族：變大</h4>
            ${fig(lineChart(['Li', 'Na', 'K', 'Rb', 'Cs'], [152, 186, 227, 248, 265], { min: 0, max: 300, ticks: 3 }), '第一族原子半徑（皮米），每往下一列就多一層電子殼。')}
            <p>每進入新週期就多一個主殼層，即使核電荷增加，外層電子仍離核更遠。</p>
            <p class="course-example">第三週期：Na &gt; Mg &gt; Al &gt; Si &gt; P &gt; S &gt; Cl。第一族：Li &lt; Na &lt; K &lt; Rb &lt; Cs。</p>
          `),
        },
        {
          title: { en: 'Ionic radius and isoelectronic ions', zh: '離子半徑與等電子離子' },
          body: () => L(`
            <p>A <strong>cation</strong> is smaller than its parent atom: electrons are lost, and often an entire shell disappears. An <strong>anion</strong> is larger: extra electrons repel each other and the cloud expands.</p>
            ${table(['Species', 'Electrons', 'Protons', 'Radius'], [
              ['Na', '11', '11', '186 pm'],
              ['Na⁺', '10', '11', '102 pm'],
              ['Cl', '17', '17', '99 pm'],
              ['Cl⁻', '18', '17', '181 pm'],
            ])}
            <h4>The isoelectronic series</h4>
            <p>Isoelectronic species have the <strong>same number of electrons</strong>. More protons then pull that same cloud tighter.</p>
            ${fig(isoSeriesSVG(), 'N³⁻, O²⁻, F⁻, Ne, Na⁺, Mg²⁺ and Al³⁺ all have 10 electrons; radius falls as the nuclear charge rises.')}
            <p class="course-example">N³⁻ &gt; O²⁻ &gt; F⁻ &gt; Ne &gt; Na⁺ &gt; Mg²⁺ &gt; Al³⁺</p>
          `, `
            <p><strong>陽離子</strong>比母原子小：失去電子，常常還少了一整層。<strong>陰離子</strong>則更大：多出的電子互相排斥，電子雲膨脹。</p>
            ${table(['物種', '電子', '質子', '半徑'], [
              ['Na', '11', '11', '186 pm'],
              ['Na⁺', '10', '11', '102 pm'],
              ['Cl', '17', '17', '99 pm'],
              ['Cl⁻', '18', '17', '181 pm'],
            ])}
            <h4>等電子系列</h4>
            <p>等電子物種有<strong>相同電子數</strong>。此時質子越多，同一團電子雲就被拉得越緊。</p>
            ${fig(isoSeriesSVG(), 'N³⁻、O²⁻、F⁻、Ne、Na⁺、Mg²⁺、Al³⁺ 都有 10 個電子；核電荷越大，半徑越小。')}
            <p class="course-example">N³⁻ &gt; O²⁻ &gt; F⁻ &gt; Ne &gt; Na⁺ &gt; Mg²⁺ &gt; Al³⁺</p>
          `),
        },
        {
          title: { en: 'Ionization energy', zh: '游離能' },
          body: () => L(`
            <p><strong>First ionization energy</strong> is the energy needed to remove one electron from a gaseous atom:</p>
            <p class="atomic-eq">\\[\\text{X}(g) \\rightarrow \\text{X}^{+}(g) + e^{-}\\]</p>
            <p>Across a period it <strong>increases</strong> (stronger pull, harder to remove). Down a group it <strong>decreases</strong> (outer electrons are farther away).</p>
            ${fig(lineChart(['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'], [520, 899, 801, 1086, 1402, 1314, 1681, 2081], { min: 0, max: 2300, ticks: 4, highlight: [2, 5] }), 'First ionization energy in kJ/mol, period 2. The small dips at B and O are the two exceptions.')}
            <h4>Two exceptions to know</h4>
            <ul>
              <li><strong>Group 2 → 13</strong> (Mg → Al): removing a p electron is easier than breaking a filled s subshell.</li>
              <li><strong>Group 15 → 16</strong> (N → O): removing a paired p electron costs less because of electron–electron repulsion.</li>
            </ul>
            <p><strong>Second ionization energy</strong> is always higher — pulling an electron from a positive ion is harder.</p>
          `, `
            <p><strong>第一游離能</strong>是從氣態原子移除一顆電子所需的能量：</p>
            <p class="atomic-eq">\\[\\text{X}(g) \\rightarrow \\text{X}^{+}(g) + e^{-}\\]</p>
            <p>同週期由左至右<strong>增加</strong>（拉力更強，更難移除）；同族由上往下<strong>減少</strong>（外層電子更遠）。</p>
            ${fig(lineChart(['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'], [520, 899, 801, 1086, 1402, 1314, 1681, 2081], { min: 0, max: 2300, ticks: 4, highlight: [2, 5] }), '第二週期第一游離能（kJ/mol）。B 與 O 的兩個小凹陷就是例外。')}
            <h4>要記住的兩個例外</h4>
            <ul>
              <li><strong>第 2 族 → 第 13 族</strong>（Mg → Al）：移除 p 電子比破壞填滿的 s 次殼層容易。</li>
              <li><strong>第 15 族 → 第 16 族</strong>（N → O）：移除成對 p 電子較省能量，因為電子間排斥。</li>
            </ul>
            <p><strong>第二游離能</strong>一定更高——從帶正電的離子再拔電子更難。</p>
          `),
        },
        {
          title: { en: 'Electron affinity', zh: '電子親和能' },
          body: () => L(`
            <p><strong>Electron affinity</strong> is the energy change when a gaseous atom gains an electron:</p>
            <p class="atomic-eq">\\[\\text{X}(g) + e^{-} \\rightarrow \\text{X}^{-}(g)\\]</p>
            <p>A <strong>more negative</strong> value means the atom grabs the electron more strongly. Magnitude generally increases across a period and decreases down a group.</p>
            ${fig(barChart(['F', 'Cl', 'Br', 'I'], [328, 349, 325, 295], { display: ['−328', '−349', '−325', '−295'], colors: ['var(--mint-ink)', 'var(--accent)', 'var(--mint-ink)', 'var(--mint-ink)'] }), 'Electron affinity of the halogens in kJ/mol. Chlorine beats fluorine: a small atom has crowded electrons.')}
            <p>Halogens have very negative values. Noble gases have full shells, so their electron affinity is near zero.</p>
            <p class="course-example">Fluorine is the most reactive halogen, but chlorine has the more negative electron affinity — adding an electron to tiny F packs it into a crowded shell.</p>
          `, `
            <p><strong>電子親和能</strong>是氣態原子獲得一顆電子時的能量變化：</p>
            <p class="atomic-eq">\\[\\text{X}(g) + e^{-} \\rightarrow \\text{X}^{-}(g)\\]</p>
            <p>數值<strong>越負</strong>表示抓電子越強。其大小通常同週期由左至右增加、同族由上往下減少。</p>
            ${fig(barChart(['F', 'Cl', 'Br', 'I'], [328, 349, 325, 295], { display: ['−328', '−349', '−325', '−295'], colors: ['var(--mint-ink)', 'var(--accent)', 'var(--mint-ink)', 'var(--mint-ink)'] }), '鹵素電子親和能（kJ/mol）。氯勝過氟：原子太小，電子太擁擠。')}
            <p>鹵素的數值很負。惰性氣體殼層已滿，電子親和能接近零。</p>
            <p class="course-example">氟是最活潑的鹵素，但氯的電子親和能更負——把電子塞進極小的氟原子會太擁擠。</p>
          `),
        },
        {
          title: { en: 'Electronegativity', zh: '電負度' },
          body: () => L(`
            <p><strong>Electronegativity</strong> is an atom’s ability to attract shared electrons in a bond. The Pauling scale runs from about 0.7 to 4.0.</p>
            <p>It <strong>increases across a period</strong> and <strong>decreases down a group</strong>. Fluorine is the most electronegative element.</p>
            ${fig(enScale(), 'The electronegativity difference between two bonded atoms gives a first guess at bond type.')}
            <p>The difference, \\(\\Delta EN\\), predicts the bond:</p>
            <ul>
              <li>Small difference → nonpolar covalent.</li>
              <li>Moderate difference → polar covalent.</li>
              <li>Large difference → often ionic.</li>
            </ul>
            <p class="course-example">Fluorine ≈ 4.0; caesium ≈ 0.79. A caesium–fluorine pair is about as lopsided as a bond gets.</p>
          `, `
            <p><strong>電負度</strong>是原子在鍵中吸引共用電子的能力。鮑林標度大約從 0.7 到 4.0。</p>
            <p>它<strong>同週期由左至右增加</strong>、<strong>同族由上往下減少</strong>。氟是電負度最高的元素。</p>
            ${fig(enScale(), '兩成鍵原子的電負度差，可以初步判斷鍵型。')}
            <p>差值 \\(\\Delta EN\\) 可預測鍵型：</p>
            <ul>
              <li>差值小 → 非極性共價。</li>
              <li>差值中等 → 極性共價。</li>
              <li>差值大 → 常為離子鍵。</li>
            </ul>
            <p class="course-example">氟約 4.0；銫約 0.79。銫－氟可說是最失衡的組合之一。</p>
          `),
        },
        {
          title: { en: 'Metallic character', zh: '金屬性' },
          body: () => L(`
            <p><strong>Metallic character</strong> is how readily an element loses electrons — how metal-like it is.</p>
            <ul>
              <li>Across a period it <strong>decreases</strong>; elements become less willing to give electrons away.</li>
              <li>Down a group it <strong>increases</strong>; the outer electron is farther from the nucleus and easier to lose.</li>
            </ul>
            ${table(['Property', 'Across a period →', 'Down a group ↓'], [
              ['Atomic radius', 'decreases', 'increases'],
              ['Ionization energy', 'increases', 'decreases'],
              ['Electron affinity (magnitude)', 'increases', 'decreases'],
              ['Electronegativity', 'increases', 'decreases'],
              ['Metallic character', 'decreases', 'increases'],
            ])}
            <p class="course-example">Metals sit at the left and centre, nonmetals at the right, and metalloids along the staircase between them.</p>
          `, `
            <p><strong>金屬性</strong>是元素失去電子的容易程度——有多像金屬。</p>
            <ul>
              <li>同週期由左至右<strong>減少</strong>；元素越來越不願給出電子。</li>
              <li>同族由上往下<strong>增加</strong>；外層電子離核更遠，更容易失去。</li>
            </ul>
            ${table(['性質', '同週期 →', '同族 ↓'], [
              ['原子半徑', '減少', '增加'],
              ['游離能', '增加', '減少'],
              ['電子親和能（大小）', '增加', '減少'],
              ['電負度', '增加', '減少'],
              ['金屬性', '減少', '增加'],
            ])}
            <p class="course-example">金屬在左側與中央，非金屬在右側，類金屬則沿著階梯線分布。</p>
          `),
        },
        {
          title: { en: 'Trends at a glance', zh: '趨勢總覽' },
          body: () => L(`
            <p>One sentence carries the whole map: <strong>across a period atoms get smaller, tighter and more electronegative; down a group they get bigger, looser and more metallic.</strong></p>
            ${table(['Trend', 'Across →', 'Down ↓', 'Reason'], [
              ['Atomic radius', '↓', '↑', 'Z_eff vs. added shells'],
              ['Ionization energy', '↑', '↓', 'pull on the outer electron'],
              ['Electron affinity', '↑', '↓', 'attraction for an extra electron'],
              ['Electronegativity', '↑', '↓', 'pull on shared electrons'],
              ['Metallic character', '↓', '↑', 'ease of losing electrons'],
            ])}
            <h4>Check yourself</h4>
            <ul>
              <li>Cations are smaller than their atoms; anions are larger.</li>
              <li>In an isoelectronic series, more protons means a smaller radius.</li>
              <li>Know the two ionization-energy dips: 2 → 13 and 15 → 16.</li>
              <li>Use \\(Z_{\\text{eff}}\\) and shielding to explain, not just recite.</li>
            </ul>
          `, `
            <p>一句話總結整張地圖：<strong>同週期由左至右，原子更小、更緊、電負度更高；同族由上往下，原子更大、更鬆、更像金屬。</strong></p>
            ${table(['趨勢', '同週期 →', '同族 ↓', '原因'], [
              ['原子半徑', '↓', '↑', 'Z_eff 與新增殼層'],
              ['游離能', '↑', '↓', '對外層電子的拉力'],
              ['電子親和能', '↑', '↓', '對額外電子的吸引'],
              ['電負度', '↑', '↓', '對共用電子的拉力'],
              ['金屬性', '↓', '↑', '失去電子的容易程度'],
            ])}
            <h4>自我檢查</h4>
            <ul>
              <li>陽離子比原子小；陰離子比原子大。</li>
              <li>等電子系列中，質子越多半徑越小。</li>
              <li>記住兩個游離能凹陷：2 → 13 與 15 → 16。</li>
              <li>用 \\(Z_{\\text{eff}}\\) 與遮蔽來解釋，不要只背結論。</li>
            </ul>
          `),
        },
        {
          title: { en: 'Quick quiz', zh: '快速測驗' },
          body: () => quiz([
            {
              q: ['Which atom is larger: <strong>Na</strong> or <strong>K</strong>?', '哪個原子較大：<strong>Na</strong> 還是 <strong>K</strong>？'],
              options: [['Na', 'Na'], ['K', 'K'], ['They are equal', '一樣大'], ['Cannot be compared', '無法比較']],
              answer: 1,
              hint: ['One of them sits one period lower.', '其中一個位於下一個週期。'],
              explain: ['K is larger — a whole extra shell sits below the valence shell.', 'K 較大——價殼層下方多了一整層電子。'],
            },
            {
              q: ['Which has the higher first ionization energy: <strong>Mg</strong> or <strong>Al</strong>?', '哪個第一游離能較高：<strong>Mg</strong> 還是 <strong>Al</strong>？'],
              options: [['Mg', 'Mg'], ['Al', 'Al'], ['Equal', '相等'], ['Depends on temperature', '取決於溫度']],
              answer: 0,
              hint: ['Look at the 2 → 13 exception.', '想想 2 → 13 族的例外。'],
              explain: ['Mg: removing a 3s electron; Al: removing a 3p electron is easier, so Al is lower.', 'Mg 要移除 3s 電子；Al 的 3p 電子較易移除，所以 Al 較低。'],
            },
            {
              q: ['Which element is the most electronegative?', '哪個元素電負度最高？'],
              options: [['O', 'O'], ['F', 'F'], ['Cl', 'Cl'], ['Ne', 'Ne']],
              answer: 1,
              hint: ['It sits at the top-right corner of the main-group map.', '它在主族地圖的右上角。'],
              explain: ['Fluorine, about 4.0 on the Pauling scale.', '氟，鮑林標度約 4.0。'],
            },
            {
              q: ['In the isoelectronic series O²⁻, F⁻, Na⁺, Mg²⁺, which is smallest?', '等電子系列 O²⁻、F⁻、Na⁺、Mg²⁺ 中，哪個最小？'],
              options: [['O²⁻', 'O²⁻'], ['F⁻', 'F⁻'], ['Na⁺', 'Na⁺'], ['Mg²⁺', 'Mg²⁺']],
              answer: 3,
              hint: ['Same electrons; count the protons.', '電子數相同；數一數質子。'],
              explain: ['Mg²⁺ has 12 protons pulling 10 electrons — the tightest of the four.', 'Mg²⁺ 有 12 個質子拉 10 個電子——四個中最緊。'],
            },
            {
              q: ['Across a period from left to right, atomic radius generally…', '同週期由左至右，原子半徑通常……'],
              options: [['decreases', '減少'], ['increases', '增加'], ['stays constant', '不變'], ['changes randomly', '隨機變化']],
              answer: 0,
              hint: ['More protons, similar shielding.', '更多質子，遮蔽相近。'],
              explain: ['Radius decreases as Z_eff rises and pulls the outer shell inward.', '半徑隨 Z_eff 上升、外殼被拉近而減少。'],
            },
            {
              q: ['Which is larger: <strong>Cl⁻</strong> or <strong>K⁺</strong>? Both have 18 electrons.', '哪個較大：<strong>Cl⁻</strong> 還是 <strong>K⁺</strong>？兩者都有 18 個電子。'],
              options: [['Cl⁻', 'Cl⁻'], ['K⁺', 'K⁺'], ['Equal', '相等'], ['Neither has a radius', '兩者都沒有半徑']],
              answer: 0,
              hint: ['The one with fewer protons holds its electrons less tightly.', '質子較少者對電子拉力較弱。'],
              explain: ['K has 19 protons vs. Cl’s 17, so K⁺ is pulled tighter and is smaller; Cl⁻ is larger.', 'K 有 19 個質子，Cl 只有 17 個，所以 K⁺ 被拉得更緊、較小；Cl⁻ 較大。'],
            },
          ], 'pt'),
        },
        {
          title: { en: 'Beginner checklist', zh: '初學者檢查表' },
          body: () => L(`
            <ul class="course-checklist">
              <li>Across a period: radius ↓, ionization energy ↑, electronegativity ↑, metallic character ↓.</li>
              <li>Down a group: radius ↑, ionization energy ↓, electronegativity ↓, metallic character ↑.</li>
              <li>Cations are smaller than their parent atoms; anions are larger.</li>
              <li>In an isoelectronic series, more protons → smaller radius.</li>
              <li>Know the ionization-energy exceptions at groups 2 → 13 and 15 → 16.</li>
              <li>Fluorine is the most electronegative element.</li>
              <li>Explain trends with \\(Z_{\\text{eff}}\\) and shielding.</li>
            </ul>
          `, `
            <ul class="course-checklist">
              <li>同週期：半徑 ↓、游離能 ↑、電負度 ↑、金屬性 ↓。</li>
              <li>同族：半徑 ↑、游離能 ↓、電負度 ↓、金屬性 ↑。</li>
              <li>陽離子比母原子小；陰離子比母原子大。</li>
              <li>等電子系列中，質子越多 → 半徑越小。</li>
              <li>記住游離能的例外：第 2 → 13 族、第 15 → 16 族。</li>
              <li>氟是電負度最高的元素。</li>
              <li>用 \\(Z_{\\text{eff}}\\) 與遮蔽來解釋趨勢。</li>
            </ul>
          `),
        },
      ],
    },

    {
      id: 'chemical-bonding',
      rootId: 'course-body-chemical-bonding',
      title: { en: 'Chemical Bonding', zh: '化學鍵結' },
      sections: [
        {
          title: { en: 'Why atoms bond', zh: '原子為何結合' },
          body: () => L(`
            <p>Atoms bond to become more <strong>stable</strong> — usually by reaching a noble-gas electron arrangement. The shorthand is the <strong>octet rule</strong>: atoms tend to gain, lose or share electrons until they have eight valence electrons (two for hydrogen and helium).</p>
            <p>Bonding lowers the energy of the system. The main kinds are:</p>
            <ul>
              <li><strong>Ionic</strong> — electron transfer.</li>
              <li><strong>Covalent</strong> — electron sharing.</li>
              <li><strong>Metallic</strong> — delocalized electrons in a metal lattice.</li>
              <li><strong>Intermolecular forces</strong> — attractions between molecules, not true bonds.</li>
            </ul>
            <p class="course-example">A useful first question: are the two atoms metals, nonmetals, or a mix? The answer narrows the bond type immediately.</p>
          `, `
            <p>原子結合是為了變得更<strong>穩定</strong>——通常是達到惰性氣體的電子組態。簡記為<strong>八隅體規則</strong>：原子傾向得到、失去或共用電子，直到有八個價電子（氫與氦為兩個）。</p>
            <p>鍵結會降低系統能量。主要類型有：</p>
            <ul>
              <li><strong>離子鍵</strong>——電子轉移。</li>
              <li><strong>共價鍵</strong>——電子共用。</li>
              <li><strong>金屬鍵</strong>——金屬晶格中的非定域電子。</li>
              <li><strong>分子間作用力</strong>——分子之間的吸引，不是真正的化學鍵。</li>
            </ul>
            <p class="course-example">先問：兩顆原子是金屬、非金屬，還是混合？答案會立刻縮小鍵型範圍。</p>
          `),
        },
        {
          title: { en: 'Ionic bonds: give and take', zh: '離子鍵：給予與接受' },
          body: () => L(`
            <p>An <strong>ionic bond</strong> forms when one atom transfers electrons to another, creating ions that attract electrostatically.</p>
            <ul>
              <li>Metals lose electrons → <strong>cations</strong> (+).</li>
              <li>Nonmetals gain electrons → <strong>anions</strong> (−).</li>
            </ul>
            ${fig(transferSVG(), 'Sodium gives one electron to chlorine; the resulting Na⁺ and Cl⁻ attract in a lattice.')}
            <p>For NaCl: Na (group 1) loses one electron to become Na⁺; Cl (group 17) gains one to become Cl⁻.</p>
            <p class="atomic-eq">\\[\\text{Na} \\rightarrow \\text{Na}^{+} + e^{-}\\]</p>
            <p class="atomic-eq">\\[\\text{Cl} + e^{-} \\rightarrow \\text{Cl}^{-}\\]</p>
            <p class="course-example">The compound is neutral overall: one +1 charge balances one −1 charge.</p>
          `, `
            <p><strong>離子鍵</strong>在一顆原子把電子轉移給另一顆時形成，產生的離子以靜電吸引。</p>
            <ul>
              <li>金屬失去電子 → <strong>陽離子</strong>（+）。</li>
              <li>非金屬得到電子 → <strong>陰離子</strong>（−）。</li>
            </ul>
            ${fig(transferSVG(), '鈉把一顆電子交給氯；產生的 Na⁺ 與 Cl⁻ 在晶格中相吸。')}
            <p>以 NaCl 為例：Na（第 1 族）失去一顆電子成 Na⁺；Cl（第 17 族）得到一顆成 Cl⁻。</p>
            <p class="atomic-eq">\\[\\text{Na} \\rightarrow \\text{Na}^{+} + e^{-}\\]</p>
            <p class="atomic-eq">\\[\\text{Cl} + e^{-} \\rightarrow \\text{Cl}^{-}\\]</p>
            <p class="course-example">整體呈電中性：一個 +1 電荷抵銷一個 −1 電荷。</p>
          `),
        },
        {
          title: { en: 'Ionic properties and lattice energy', zh: '離子性質與晶格能' },
          body: () => L(`
            ${table(['Property', 'Explanation'], [
              ['High melting and boiling points', 'Strong electrostatic attractions throughout the lattice'],
              ['Hard and brittle', 'Layers shift and like charges repel'],
              ['Conducts when molten or dissolved', 'Ions are free to move'],
              ['Does not conduct as a solid', 'Ions are fixed in place'],
              ['Often soluble in water', 'Ion–dipole interactions with water'],
            ])}
            <p><strong>Lattice energy</strong> is the energy released when gaseous ions assemble into a solid lattice. It grows with:</p>
            <ul>
              <li><strong>Higher charges</strong>: Mg²⁺O²⁻ holds together more strongly than Na⁺Cl⁻.</li>
              <li><strong>Smaller ions</strong>: the centres of charge sit closer.</li>
            </ul>
            <p class="course-example">This is why MgO melts near 2,850 °C while NaCl melts near 801 °C.</p>
          `, `
            ${table(['性質', '解釋'], [
              ['熔點、沸點高', '晶格中到處都是強靜電吸引'],
              ['硬而脆', '層與層錯位後，同種電荷相斥'],
              ['熔融或溶解時導電', '離子可以自由移動'],
              ['固態不導電', '離子固定在晶格中'],
              ['通常溶於水', '與水產生離子－偶極作用'],
            ])}
            <p><strong>晶格能</strong>是氣態離子組成固體晶格時釋放的能量。它會隨以下因素增大：</p>
            <ul>
              <li><strong>電荷更高</strong>：Mg²⁺O²⁻ 的結合力強於 Na⁺Cl⁻。</li>
              <li><strong>離子更小</strong>：電荷中心更靠近。</li>
            </ul>
            <p class="course-example">所以 MgO 約在 2,850 °C 熔化，而 NaCl 約在 801 °C。</p>
          `),
        },
        {
          title: { en: 'Covalent bonds: share and share alike', zh: '共價鍵：共用電子' },
          body: () => L(`
            <p>A <strong>covalent bond</strong> forms when two atoms share electrons. Each shared pair counts toward both atoms’ octets.</p>
            ${fig(overlapSVG(), 'Two hydrogen atoms overlap their electron clouds and share one pair.')}
            <ul>
              <li><strong>Nonpolar covalent</strong>: electrons shared equally (H–H, Cl–Cl).</li>
              <li><strong>Polar covalent</strong>: electrons shared unequally because of an electronegativity difference (H–Cl).</li>
            </ul>
            ${table(['Bond', 'Electrons', 'Typical result'], [
              ['H–H', 'equal sharing', 'nonpolar molecule'],
              ['Cl–Cl', 'equal sharing', 'nonpolar molecule'],
              ['H–Cl', 'pulled toward Cl', 'polar bond, dipole'],
            ])}
            <p class="course-example">A shared pair is a single bond; two pairs make a double bond; three pairs make a triple bond.</p>
          `, `
            <p><strong>共價鍵</strong>在兩顆原子共用電子時形成。每一對共用電子都同時計入兩顆原子的八隅體。</p>
            ${fig(overlapSVG(), '兩個氫原子讓電子雲重疊，共用一對電子。')}
            <ul>
              <li><strong>非極性共價</strong>：電子平均共用（H–H、Cl–Cl）。</li>
              <li><strong>極性共價</strong>：因電負度差而共用不均（H–Cl）。</li>
            </ul>
            ${table(['鍵', '電子', '典型結果'], [
              ['H–H', '平均共用', '非極性分子'],
              ['Cl–Cl', '平均共用', '非極性分子'],
              ['H–Cl', '偏向 Cl', '極性鍵、偶極'],
            ])}
            <p class="course-example">一對共用電子是單鍵；兩對是雙鍵；三對是三鍵。</p>
          `),
        },
        {
          title: { en: 'Polarity and dipoles', zh: '極性與偶極' },
          body: () => L(`
            <p>In a polar bond, the more electronegative atom carries a partial negative charge (δ−); the other carries δ+.</p>
            ${fig(dipoleSVG(), 'In H–Cl, chlorine wins the shared electrons and the bond points toward Cl.')}
            ${table(['ΔEN', 'Bond type'], [
              ['0 to ~0.4', 'nonpolar covalent'],
              ['~0.4 to ~1.7', 'polar covalent'],
              ['> ~1.7', 'ionic (often)'],
            ])}
            <p>The cutoffs are approximate; your course may use slightly different numbers. Bond polarity is not the same as molecular polarity:</p>
            <ul>
              <li>CO₂ has polar C=O bonds, but the linear shape cancels them — the molecule is nonpolar.</li>
              <li>H₂O has polar O–H bonds and a bent shape — the molecule is polar.</li>
            </ul>
            <p class="course-example">Always check shape before calling a molecule polar.</p>
          `, `
            <p>極性鍵中，電負度較高的原子帶部分負電（δ−），另一顆帶部分正電（δ+）。</p>
            ${fig(dipoleSVG(), 'H–Cl 中，氯搶到共用電子，鍵的方向指向 Cl。')}
            ${table(['ΔEN', '鍵型'], [
              ['0 到約 0.4', '非極性共價'],
              ['約 0.4 到 1.7', '極性共價'],
              ['大於約 1.7', '常為離子鍵'],
            ])}
            <p>界線只是近似；你的課程可能用略有不同的數值。鍵的極性不等於分子的極性：</p>
            <ul>
              <li>CO₂ 有極性 C=O 鍵，但直線形狀使它們互相抵消——分子非極性。</li>
              <li>H₂O 有極性 O–H 鍵，且形狀彎曲——分子是極性的。</li>
            </ul>
            <p class="course-example">判斷分子極性前，先看形狀。</p>
          `),
        },
        {
          title: { en: 'Lewis structures and bond order', zh: '路易斯結構與鍵級' },
          body: () => L(`
            <p>A <strong>Lewis structure</strong> shows valence electrons as dots and bonds as lines.</p>
            <ol>
              <li>Count the total valence electrons.</li>
              <li>Connect atoms with single bonds.</li>
              <li>Complete the octets of the outer atoms.</li>
              <li>Put remaining electrons on the central atom.</li>
              <li>Form multiple bonds if an octet is still short.</li>
            </ol>
            ${fig(lewisSVG(), 'Three simple Lewis structures: water, ammonia and carbon dioxide.')}
            <h4>Bond order, length and strength</h4>
            ${table(['Bond', 'Length', 'Strength'], [
              ['Single (C–C)', 'longest', 'weakest'],
              ['Double (C=C)', 'shorter', 'stronger'],
              ['Triple (C≡C)', 'shortest', 'strongest'],
            ])}
            <p class="course-example">Bond length: single &gt; double &gt; triple. Bond strength: triple &gt; double &gt; single.</p>
          `, `
            <p><strong>路易斯結構</strong>以點表示價電子，以線表示鍵。</p>
            <ol>
              <li>計算價電子總數。</li>
              <li>用單鍵連接原子。</li>
              <li>補滿外圍原子的八隅體。</li>
              <li>剩下的電子放在中心原子上。</li>
              <li>若八隅體仍不足，形成多重鍵。</li>
            </ol>
            ${fig(lewisSVG(), '三個簡單路易斯結構：水、氨與二氧化碳。')}
            <h4>鍵級、鍵長與鍵能</h4>
            ${table(['鍵', '長度', '強度'], [
              ['單鍵（C–C）', '最長', '最弱'],
              ['雙鍵（C=C）', '較短', '較強'],
              ['三鍵（C≡C）', '最短', '最強'],
            ])}
            <p class="course-example">鍵長：單鍵 &gt; 雙鍵 &gt; 三鍵。鍵能：三鍵 &gt; 雙鍵 &gt; 單鍵。</p>
          `),
        },
        {
          title: { en: 'Metallic bonds and alloys', zh: '金屬鍵與合金' },
          body: () => L(`
            <p>In a metal, valence electrons are <strong>delocalized</strong> across the whole lattice of positive ions. This is the “sea of electrons” model.</p>
            ${fig(metalSeaSVG(), 'Positive metal ions stay in place while electrons roam through the lattice.')}
            ${table(['Property', 'Explanation'], [
              ['Conducts heat and electricity', 'delocalized electrons move freely'],
              ['Malleable and ductile', 'ion layers slide without breaking the bonding'],
              ['Lustrous', 'electrons absorb and re-emit light'],
              ['Variable melting points', 'depends on lattice and electron count'],
            ])}
            <p>An <strong>alloy</strong> is a mixture of metals, or a metal with a nonmetal, made to improve properties.</p>
            ${table(['Alloy', 'Composition'], [
              ['Steel', 'iron + carbon'],
              ['Brass', 'copper + zinc'],
              ['Bronze', 'copper + tin'],
            ])}
          `, `
            <p>金屬中，價電子<strong>非定域化</strong>，分布於整個正離子晶格——這就是「電子海」模型。</p>
            ${fig(metalSeaSVG(), '正金屬離子固定在原位，電子則在晶格間游走。')}
            ${table(['性質', '解釋'], [
              ['導熱、導電', '非定域電子可自由移動'],
              ['延性、展性', '離子層可滑動而不破壞鍵結'],
              ['有光澤', '電子吸收並重新放出光'],
              ['熔點差異大', '取決於晶格與電子數'],
            ])}
            <p><strong>合金</strong>是金屬混合物，或金屬與非金屬的混合物，用來改善性質。</p>
            ${table(['合金', '組成'], [
              ['鋼', '鐵 + 碳'],
              ['黃銅', '銅 + 鋅'],
              ['青銅', '銅 + 錫'],
            ])}
          `),
        },
        {
          title: { en: 'Intermolecular forces', zh: '分子間作用力' },
          body: () => L(`
            <p><strong>Intermolecular forces</strong> (IMFs) attract molecules to one another. They are weaker than ionic or covalent bonds, but they decide boiling points, viscosity and solubility.</p>
            ${table(['Force', 'What it is', 'Example'], [
              ['London dispersion', 'temporary dipoles; grows with size', 'CH₄, noble gases'],
              ['Dipole–dipole', 'between polar molecules', 'HCl, acetone'],
              ['Hydrogen bonding', 'strong dipole when H is bonded to N, O or F', 'H₂O, NH₃, HF'],
              ['Ion–dipole', 'an ion and a polar molecule', 'Na⁺ in water'],
            ])}
            ${fig(barChart(['CH₄', 'HCl', 'H₂O'], [39, 115, 300], { display: ['−161 °C', '−85 °C', '100 °C'], colors: ['var(--muted-2)', 'var(--sky-ink)', 'var(--accent)'] }), 'Boiling points climb as the dominant force changes: dispersion → dipole–dipole → hydrogen bonding.')}
            <h4>Hydrogen bonding</h4>
            <p>It needs H covalently bonded to <strong>N, O or F</strong>, interacting with a lone pair on another N, O or F. It explains water’s high boiling point, ice floating and water’s high surface tension.</p>
            <p class="course-example">Stronger IMFs → higher melting and boiling points, higher viscosity and more surface tension.</p>
          `, `
            <p><strong>分子間作用力</strong>（IMFs）把分子彼此吸引。它們比離子鍵或共價鍵弱，但決定沸點、黏度與溶解度。</p>
            ${table(['作用力', '是什麼', '例子'], [
              ['倫敦分散力', '暫時偶極；隨尺寸增大', 'CH₄、惰性氣體'],
              ['偶極－偶極', '極性分子之間', 'HCl、丙酮'],
              ['氫鍵', 'H 與 N、O、F 相連時的強偶極作用', 'H₂O、NH₃、HF'],
              ['離子－偶極', '離子與極性分子', '水中的 Na⁺'],
            ])}
            ${fig(barChart(['CH₄', 'HCl', 'H₂O'], [39, 115, 300], { display: ['−161 °C', '−85 °C', '100 °C'], colors: ['var(--muted-2)', 'var(--sky-ink)', 'var(--accent)'] }), '主要作用力由分散力→偶極－偶極→氫鍵，沸點也隨之上升。')}
            <h4>氫鍵</h4>
            <p>需要 H 與 <strong>N、O、F</strong> 共價相連，並與另一個 N、O、F 的孤對電子作用。它解釋了水的高沸點、冰會浮，以及水的高表面張力。</p>
            <p class="course-example">分子間作用力越強 → 熔沸點越高、黏度越大、表面張力越大。</p>
          `),
        },
        {
          title: { en: 'Putting it together', zh: '綜合整理' },
          body: () => L(`
            ${table(['Bond or force', 'What happens', 'Typical partners', 'Key property'], [
              ['Ionic', 'electron transfer', 'metal + nonmetal', 'high melting point; conducts when molten'],
              ['Covalent', 'electron sharing', 'nonmetal + nonmetal', 'lower melting point; molecular'],
              ['Metallic', 'delocalized electrons', 'metal lattice', 'conducts; malleable'],
              ['IMF', 'attraction between molecules', 'molecule + molecule', 'sets boiling and melting points'],
            ])}
            <h4>Practice</h4>
            ${practice(BONDING_PRACTICE, 'cb')}
          `, `
            ${table(['鍵或作用力', '發生什麼', '典型組合', '關鍵性質'], [
              ['離子鍵', '電子轉移', '金屬 + 非金屬', '熔點高；熔融時導電'],
              ['共價鍵', '電子共用', '非金屬 + 非金屬', '熔點較低；分子型'],
              ['金屬鍵', '非定域電子', '金屬晶格', '導電；有延展性'],
              ['分子間作用力', '分子間吸引', '分子 + 分子', '決定熔沸點'],
            ])}
            <h4>練習</h4>
            ${practice(BONDING_PRACTICE, 'cb')}
          `),
        },
        {
          title: { en: 'Quick quiz', zh: '快速測驗' },
          body: () => quiz([
            {
              q: ['What type of bond is in <strong>KBr</strong>?', '<strong>KBr</strong> 是什麼鍵？'],
              options: [['Ionic', '離子鍵'], ['Nonpolar covalent', '非極性共價'], ['Polar covalent', '極性共價'], ['Metallic', '金屬鍵']],
              answer: 0,
              hint: ['One partner is a group-1 metal.', '其中一個夥伴是第 1 族金屬。'],
              explain: ['A metal with a nonmetal and a large electronegativity difference gives an ionic bond.', '金屬加非金屬、電負度差大，形成離子鍵。'],
            },
            {
              q: ['The C=O bonds in CO₂ are… and the molecule is…', 'CO₂ 的 C=O 鍵是……，而分子整體是……'],
              options: [['polar; polar', '極性；極性'], ['polar; nonpolar', '極性；非極性'], ['nonpolar; polar', '非極性；極性'], ['nonpolar; nonpolar', '非極性；非極性']],
              answer: 1,
              hint: ['Bond dipoles can cancel in a symmetric shape.', '在對稱形狀中，鍵偶極可以抵銷。'],
              explain: ['Each C=O bond is polar, but the linear molecule cancels the dipoles; CO₂ is nonpolar overall.', '每個 C=O 鍵有極性，但直線分子使偶極抵消；CO₂ 整體非極性。'],
            },
            {
              q: ['Which has the higher melting point: <strong>NaCl</strong> or <strong>H₂O</strong>?', '哪個熔點較高：<strong>NaCl</strong> 還是 <strong>H₂O</strong>？'],
              options: [['NaCl', 'NaCl'], ['H₂O', 'H₂O'], ['Equal', '相等'], ['Both are gases', '兩者都是氣體']],
              answer: 0,
              hint: ['Compare a whole lattice with forces between molecules.', '把整個晶格與分子間作用力相比。'],
              explain: ['NaCl has a strong ionic lattice; water’s hydrogen bonds are strong for IMFs but weaker than ionic attractions.', 'NaCl 有強離子晶格；水的氫鍵在分子間作用力中算強，但仍弱於離子吸引。'],
            },
            {
              q: ['What is the strongest intermolecular force in liquid <strong>HF</strong>?', '液態 <strong>HF</strong> 中最強的分子間作用力是什麼？'],
              options: [['London dispersion', '倫敦分散力'], ['Dipole–dipole only', '只有偶極－偶極'], ['Hydrogen bonding', '氫鍵'], ['Ionic bonding', '離子鍵']],
              answer: 2,
              hint: ['H is bonded directly to a very electronegative small atom.', 'H 直接連到一個電負度很高的小原子。'],
              explain: ['H–F hydrogen bonds dominate because H is bonded to F.', 'H–F 氫鍵主導，因為 H 與 F 直接相連。'],
            },
            {
              q: ['Which bond is shortest?', '哪個鍵最短？'],
              options: [['C–C', 'C–C'], ['C=C', 'C=C'], ['C≡C', 'C≡C'], ['All are equal', '三者相等']],
              answer: 2,
              hint: ['More shared pairs pull the nuclei closer.', '共用電子對越多，原子核越靠近。'],
              explain: ['A triple bond has the highest bond order and the shortest length.', '三鍵的鍵級最高，鍵長最短。'],
            },
            {
              q: ['Which of these is an <strong>alloy</strong>?', '下列哪一個是<strong>合金</strong>？'],
              options: [['Steel', '鋼'], ['NaCl', 'NaCl'], ['CO₂', 'CO₂'], ['H₂O', 'H₂O']],
              answer: 0,
              hint: ['Look for a mixture of metals.', '尋找金屬的混合物。'],
              explain: ['Steel is iron with carbon — an alloy. The others are a salt, a covalent oxide and a molecular liquid.', '鋼是鐵加碳——合金。其他分別是鹽、共價氧化物與分子液體。'],
            },
          ], 'cb'),
        },
        {
          title: { en: 'Beginner checklist', zh: '初學者檢查表' },
          body: () => L(`
            <ul class="course-checklist">
              <li>Ionic = transfer; covalent = sharing; metallic = sea of electrons.</li>
              <li>Use ΔEN to estimate bond polarity.</li>
              <li>Intermolecular forces act between molecules and are weaker than bonds.</li>
              <li>Hydrogen bonding requires H bonded to N, O or F.</li>
              <li>Stronger IMFs → higher melting and boiling points.</li>
              <li>Metals conduct because their electrons are delocalized.</li>
              <li>Lewis structures show valence electrons; bond order predicts length and strength.</li>
            </ul>
          `, `
            <ul class="course-checklist">
              <li>離子鍵 = 轉移；共價鍵 = 共用；金屬鍵 = 電子海。</li>
              <li>用 ΔEN 估計鍵的極性。</li>
              <li>分子間作用力作用於分子之間，比化學鍵弱。</li>
              <li>氫鍵需要 H 與 N、O、F 相連。</li>
              <li>分子間作用力越強 → 熔沸點越高。</li>
              <li>金屬導電是因為電子非定域化。</li>
              <li>路易斯結構表示價電子；鍵級可預測鍵長與鍵能。</li>
            </ul>
          `),
        },
      ],
    },

    {
      id: 'stoichiometry',
      rootId: 'course-body-stoichiometry',
      title: { en: 'Stoichiometry and the Mole Concept', zh: '計量與莫耳概念' },
      sections: [
        {
          title: { en: 'The chemist’s dozen', zh: '化學家的「打」' },
          body: () => L(`
            <p>A <strong>mole</strong> is the amount of substance that contains as many elementary entities as there are atoms in exactly 12 g of carbon-12. That number is <strong>Avogadro’s number</strong>:</p>
            <p class="atomic-eq">\\[N_A = 6.022 \\times 10^{23}\\ \\text{particles/mol}\\]</p>
            <div class="sci-big-number">
              <strong>6.022 × 10²³</strong>
              <span>one mole — a chemist’s dozen</span>
            </div>
            <p>“Particles” can mean atoms, molecules, ions, formula units or electrons, depending on what you are counting. The mole is simply a counting unit for very large numbers.</p>
            <p class="course-example">One mole of water contains 6.022 × 10²³ water molecules — and three times as many atoms.</p>
          `, `
            <p><strong>莫耳</strong>是所含基本粒子數等於 12 g 碳-12 中原子數的物質量。這個數就是<strong>亞佛加厥常數</strong>：</p>
            <p class="atomic-eq">\\[N_A = 6.022 \\times 10^{23}\\ \\text{粒子/mol}\\]</p>
            <div class="sci-big-number">
              <strong>6.022 × 10²³</strong>
              <span>一莫耳——化學家的「打」</span>
            </div>
            <p>「粒子」可以是原子、分子、離子、式量單位或電子，取決於你在數什麼。莫耳只是用來數極大數量的計數單位。</p>
            <p class="course-example">一莫耳水含有 6.022 × 10²³ 個水分子——原子數則是它的三倍。</p>
          `),
        },
        {
          title: { en: 'Molar mass', zh: '莫耳質量' },
          body: () => L(`
            <p><strong>Molar mass</strong> \\(M\\) is the mass of one mole of a substance, in grams per mole.</p>
            <ul>
              <li>For an element, take the atomic mass from the periodic table in g/mol.</li>
              <li>For a compound, add the atomic masses of every atom in the formula.</li>
            </ul>
            ${table(['Substance', 'Calculation', 'Molar mass'], [
              ['H₂O', '2(1.008) + 16.00', '18.02 g/mol'],
              ['NaCl', '22.99 + 35.45', '58.44 g/mol'],
              ['CaCO₃', '40.08 + 12.01 + 3(16.00)', '100.09 g/mol'],
              ['C₆H₁₂O₆', '6(12.01) + 12(1.008) + 6(16.00)', '180.16 g/mol'],
            ])}
            <p class="course-example">Molar mass is the bridge between a balance reading in grams and a count of particles in moles.</p>
          `, `
            <p><strong>莫耳質量</strong> \\(M\\) 是一莫耳物質的質量，單位為 g/mol。</p>
            <ul>
              <li>元素：直接取週期表上的原子量，單位 g/mol。</li>
              <li>化合物：把化學式中所有原子的原子量相加。</li>
            </ul>
            ${table(['物質', '計算', '莫耳質量'], [
              ['H₂O', '2(1.008) + 16.00', '18.02 g/mol'],
              ['NaCl', '22.99 + 35.45', '58.44 g/mol'],
              ['CaCO₃', '40.08 + 12.01 + 3(16.00)', '100.09 g/mol'],
              ['C₆H₁₂O₆', '6(12.01) + 12(1.008) + 6(16.00)', '180.16 g/mol'],
            ])}
            <p class="course-example">莫耳質量是天平讀數（克）與粒子數（莫耳）之間的橋樑。</p>
          `),
        },
        {
          title: { en: 'The mole road map', zh: '莫耳地圖' },
          body: () => L(`
            <p>Almost every calculation goes <strong>through moles</strong>:</p>
            ${fig(roadMapSVG(), 'Mass, particles and gas volume all connect through the mole.')}
            <ul>
              <li>Mass → moles: divide by molar mass.</li>
              <li>Moles → mass: multiply by molar mass.</li>
              <li>Moles → particles: multiply by \\(N_A\\).</li>
              <li>Moles of gas at STP → litres: multiply by 22.4 L/mol.</li>
            </ul>
            <p>At STP (0 °C, 1 atm), one mole of any ideal gas occupies <strong>22.4 L</strong>. Modern IUPAC STP uses 1 bar and gives <strong>22.7 L/mol</strong>; check which value your course uses.</p>
            <h4>Worked example</h4>
            <p>How many water molecules are in 36.0 g of H₂O?</p>
            <p class="atomic-eq">\\[36.0\\ \\text{g} \\div 18.02\\ \\text{g/mol} = 2.00\\ \\text{mol}\\]</p>
            <p class="atomic-eq">\\[2.00 \\times 6.022 \\times 10^{23} = 1.20 \\times 10^{24}\\ \\text{molecules}\\]</p>
          `, `
            <p>幾乎所有計算都要<strong>經過莫耳</strong>：</p>
            ${fig(roadMapSVG(), '質量、粒子與氣體體積都透過莫耳相連。')}
            <ul>
              <li>質量 → 莫耳：除以莫耳質量。</li>
              <li>莫耳 → 質量：乘以莫耳質量。</li>
              <li>莫耳 → 粒子：乘以 \\(N_A\\)。</li>
              <li>STP 下的氣體莫耳 → 公升：乘以 22.4 L/mol。</li>
            </ul>
            <p>在 STP（0 °C、1 atm）下，一莫耳任何理想氣體佔 <strong>22.4 L</strong>。現代 IUPAC 的 STP 用 1 bar，得到 <strong>22.7 L/mol</strong>；請確認課程採用哪個值。</p>
            <h4>範例</h4>
            <p>36.0 g 的水中有多少個水分子？</p>
            <p class="atomic-eq">\\[36.0\\ \\text{g} \\div 18.02\\ \\text{g/mol} = 2.00\\ \\text{mol}\\]</p>
            <p class="atomic-eq">\\[2.00 \\times 6.022 \\times 10^{23} = 1.20 \\times 10^{24}\\ \\text{個分子}\\]</p>
          `),
        },
        {
          title: { en: 'Percent composition', zh: '質量百分組成' },
          body: () => L(`
            <p>Percent composition is the mass percent of each element in a compound:</p>
            <p class="atomic-eq">\\[\\%\\ \\text{element} = \\frac{\\text{mass of element in 1 mol}}{\\text{molar mass}} \\times 100\\%\\]</p>
            ${fig(donutSVG(), 'Water by mass: oxygen dominates, even though hydrogen atoms outnumber oxygen atoms two to one.')}
            <p>For H₂O:</p>
            <p class="atomic-eq">\\[\\%\\text{H} = \\frac{2(1.008)}{18.02} \\times 100\\% = 11.19\\%\\]</p>
            <p class="atomic-eq">\\[\\%\\text{O} = \\frac{16.00}{18.02} \\times 100\\% = 88.79\\%\\]</p>
            <p class="course-example">Check: 11.19% + 88.79% = 100.00%. Percent composition is a useful fingerprint for an unknown compound.</p>
          `, `
            <p>質量百分組成是化合物中每個元素的質量百分比：</p>
            <p class="atomic-eq">\\[\\%\\ \\text{元素} = \\frac{\\text{一莫耳中該元素的質量}}{\\text{莫耳質量}} \\times 100\\%\\]</p>
            ${fig(donutSVG(), '以質量計，水由氧主導——即使氫原子數是氧的兩倍。')}
            <p>以 H₂O 為例：</p>
            <p class="atomic-eq">\\[\\%\\text{H} = \\frac{2(1.008)}{18.02} \\times 100\\% = 11.19\\%\\]</p>
            <p class="atomic-eq">\\[\\%\\text{O} = \\frac{16.00}{18.02} \\times 100\\% = 88.79\\%\\]</p>
            <p class="course-example">檢查：11.19% + 88.79% = 100.00%。質量百分組成是辨識未知化合物的實用指紋。</p>
          `),
        },
        {
          title: { en: 'Empirical and molecular formulas', zh: '實驗式與分子式' },
          body: () => L(`
            <p>The <strong>empirical formula</strong> is the simplest whole-number ratio of atoms. The <strong>molecular formula</strong> is the actual number of atoms per molecule — a whole-number multiple of the empirical formula.</p>
            ${fig(empiricalSVG(), 'Glucose shares the empirical formula CH₂O with formaldehyde; the molar mass decides the multiplier.')}
            <h4>Finding the empirical formula</h4>
            <ol>
              <li>Assume 100 g of compound, so grams equal percent.</li>
              <li>Convert grams of each element to moles.</li>
              <li>Divide every mole value by the smallest one.</li>
              <li>Multiply if needed to reach whole numbers.</li>
            </ol>
            ${table(['Element', 'Mass (g)', 'Moles', 'Divide by smallest'], [
              ['C', '40.0', '3.33', '1'],
              ['H', '6.7', '6.65', '2'],
              ['O', '53.3', '3.33', '1'],
            ])}
            <p>Empirical formula: <strong>CH₂O</strong>. If the molar mass is 180 g/mol, \\(n = 180 / 30.03 = 6\\), so the molecular formula is <strong>C₆H₁₂O₆</strong>.</p>
          `, `
            <p><strong>實驗式</strong>是原子最簡整數比。<strong>分子式</strong>是分子中實際原子數——為實驗式的整數倍。</p>
            ${fig(empiricalSVG(), '葡萄糖與甲醛共享實驗式 CH₂O；由莫耳質量決定倍數。')}
            <h4>求實驗式</h4>
            <ol>
              <li>假設有 100 g 化合物，克數就等於百分比。</li>
              <li>把各元素的克數換成莫耳。</li>
              <li>所有莫耳數除以最小值。</li>
              <li>必要時乘上倍數得到整數。</li>
            </ol>
            ${table(['元素', '質量（g）', '莫耳', '除以最小值'], [
              ['C', '40.0', '3.33', '1'],
              ['H', '6.7', '6.65', '2'],
              ['O', '53.3', '3.33', '1'],
            ])}
            <p>實驗式：<strong>CH₂O</strong>。若莫耳質量為 180 g/mol，\\(n = 180 / 30.03 = 6\\)，分子式就是 <strong>C₆H₁₂O₆</strong>。</p>
          `),
        },
        {
          title: { en: 'Balancing equations', zh: '平衡方程式' },
          body: () => L(`
            <p>A balanced equation obeys the <strong>law of conservation of mass</strong>: atoms are neither created nor destroyed.</p>
            <ol>
              <li>Never change subscripts — only coefficients.</li>
              <li>Balance metals first, then nonmetals, then hydrogen, then oxygen.</li>
              <li>Check that every atom and every charge balances.</li>
            </ol>
            <h4>Example: propane burns</h4>
            <p class="atomic-eq">\\[\\_\\,\\text{C}_3\\text{H}_8 + \\_\\,\\text{O}_2 \\rightarrow \\_\\,\\text{CO}_2 + \\_\\,\\text{H}_2\\text{O}\\]</p>
            <ul>
              <li>Carbon: 3 CO₂.</li>
              <li>Hydrogen: 4 H₂O.</li>
              <li>Oxygen on the right: 6 + 4 = 10 atoms → 5 O₂.</li>
            </ul>
            <p class="atomic-eq">\\[\\text{C}_3\\text{H}_8 + 5\\text{O}_2 \\rightarrow 3\\text{CO}_2 + 4\\text{H}_2\\text{O}\\]</p>
            <p class="course-example">Remember the diatomic elements: H₂, N₂, O₂, F₂, Cl₂, Br₂, I₂.</p>
          `, `
            <p>平衡方程式遵守<strong>質量守恆定律</strong>：原子既不被創造也不被消滅。</p>
            <ol>
              <li>絕不改下標——只能改係數。</li>
              <li>先平衡金屬，再非金屬，再氫，最後氧。</li>
              <li>確認每個原子與每個電荷都平衡。</li>
            </ol>
            <h4>範例：丙烷燃燒</h4>
            <p class="atomic-eq">\\[\\_\\,\\text{C}_3\\text{H}_8 + \\_\\,\\text{O}_2 \\rightarrow \\_\\,\\text{CO}_2 + \\_\\,\\text{H}_2\\text{O}\\]</p>
            <ul>
              <li>碳：3 個 CO₂。</li>
              <li>氫：4 個 H₂O。</li>
              <li>右側氧：6 + 4 = 10 個原子 → 5 個 O₂。</li>
            </ul>
            <p class="atomic-eq">\\[\\text{C}_3\\text{H}_8 + 5\\text{O}_2 \\rightarrow 3\\text{CO}_2 + 4\\text{H}_2\\text{O}\\]</p>
            <p class="course-example">記住雙原子元素：H₂、N₂、O₂、F₂、Cl₂、Br₂、I₂。</p>
          `),
        },
        {
          title: { en: 'Mole ratios', zh: '莫耳比' },
          body: () => L(`
            <p>The coefficients in a balanced equation give <strong>mole ratios</strong>. For:</p>
            <p class="atomic-eq">\\[2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}\\]</p>
            <p>the ratios include \\(2\\ \\text{mol H}_2 / 1\\ \\text{mol O}_2\\) and \\(2\\ \\text{mol H}_2\\text{O} / 2\\ \\text{mol H}_2\\).</p>
            <h4>General method</h4>
            <ol>
              <li>Write and balance the equation.</li>
              <li>Convert the given quantity to moles.</li>
              <li>Use the mole ratio to find moles of the target.</li>
              <li>Convert to grams, litres or particles.</li>
            </ol>
            <h4>Worked example</h4>
            <p>How many grams of CO₂ form when 44.0 g of propane burns completely?</p>
            <p>Moles of C₃H₈: \\(44.0\\ \\text{g} \\div 44.10\\ \\text{g/mol} = 1.00\\ \\text{mol}\\).</p>
            <p>Ratio 1:3 → \\(1.00 \\times 3 = 3.00\\ \\text{mol CO}_2\\).</p>
            <p>Mass: \\(3.00 \\times 44.01 = 132\\ \\text{g CO}_2\\).</p>
          `, `
            <p>平衡方程式中的係數提供<strong>莫耳比</strong>。例如：</p>
            <p class="atomic-eq">\\[2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}\\]</p>
            <p>莫耳比包括 \\(2\\ \\text{mol H}_2 / 1\\ \\text{mol O}_2\\) 與 \\(2\\ \\text{mol H}_2\\text{O} / 2\\ \\text{mol H}_2\\)。</p>
            <h4>通用方法</h4>
            <ol>
              <li>寫出並平衡方程式。</li>
              <li>把已知量換成莫耳。</li>
              <li>用莫耳比求目標物的莫耳數。</li>
              <li>換成克、公升或粒子數。</li>
            </ol>
            <h4>範例</h4>
            <p>44.0 g 丙烷完全燃燒會生成多少克 CO₂？</p>
            <p>C₃H₈ 的莫耳數：\\(44.0\\ \\text{g} \\div 44.10\\ \\text{g/mol} = 1.00\\ \\text{mol}\\)。</p>
            <p>比例 1:3 → \\(1.00 \\times 3 = 3.00\\ \\text{mol CO}_2\\)。</p>
            <p>質量：\\(3.00 \\times 44.01 = 132\\ \\text{g CO}_2\\)。</p>
          `),
        },
        {
          title: { en: 'Limiting reactant', zh: '限量試劑' },
          body: () => L(`
            <p>The <strong>limiting reactant</strong> runs out first and decides the maximum product. The <strong>excess reactant</strong> is left over.</p>
            <ol>
              <li>Balance the equation.</li>
              <li>Convert every reactant to moles.</li>
              <li>Divide each mole value by its coefficient.</li>
              <li>The smallest quotient is the limiting reactant.</li>
              <li>Use its moles to calculate product.</li>
            </ol>
            <h4>Worked example</h4>
            <p>10.0 g H₂ reacts with 10.0 g O₂:</p>
            <p class="atomic-eq">\\[2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}\\]</p>
            <p>H₂: \\(10.0 / 2.016 = 4.96\\ \\text{mol}\\); O₂: \\(10.0 / 32.00 = 0.3125\\ \\text{mol}\\).</p>
            <ul>
              <li>H₂ quotient: 4.96 / 2 = 2.48.</li>
              <li>O₂ quotient: 0.3125 / 1 = 0.3125 ← smallest.</li>
            </ul>
            <div class="sci-compare" aria-hidden="true">
              <div class="sci-compare-row"><span>H₂</span><div class="sci-compare-bar"><i style="width:100%"></i></div><em>plenty</em></div>
              <div class="sci-compare-row"><span>O₂</span><div class="sci-compare-bar"><i class="is-low" style="width:13%"></i></div><em>runs out</em></div>
            </div>
            <p>O₂ is limiting. Moles H₂O = \\(2 \\times 0.3125 = 0.625\\ \\text{mol}\\), or <strong>11.3 g</strong>. H₂ used = 1.26 g, so <strong>8.74 g H₂ remains</strong>.</p>
          `, `
            <p><strong>限量試劑</strong>最先用完，決定最大產量。<strong>過量試劑</strong>則會剩下。</p>
            <ol>
              <li>平衡方程式。</li>
              <li>把每個反應物換成莫耳。</li>
              <li>各莫耳數除以係數。</li>
              <li>商最小者就是限量試劑。</li>
              <li>用它的莫耳數計算產物。</li>
            </ol>
            <h4>範例</h4>
            <p>10.0 g H₂ 與 10.0 g O₂ 反應：</p>
            <p class="atomic-eq">\\[2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}\\]</p>
            <p>H₂：\\(10.0 / 2.016 = 4.96\\ \\text{mol}\\)；O₂：\\(10.0 / 32.00 = 0.3125\\ \\text{mol}\\)。</p>
            <ul>
              <li>H₂ 商：4.96 / 2 = 2.48。</li>
              <li>O₂ 商：0.3125 / 1 = 0.3125 ← 最小。</li>
            </ul>
            <div class="sci-compare" aria-hidden="true">
              <div class="sci-compare-row"><span>H₂</span><div class="sci-compare-bar"><i style="width:100%"></i></div><em>充足</em></div>
              <div class="sci-compare-row"><span>O₂</span><div class="sci-compare-bar"><i class="is-low" style="width:13%"></i></div><em>先用完</em></div>
            </div>
            <p>O₂ 是限量試劑。H₂O 莫耳數 = \\(2 \\times 0.3125 = 0.625\\ \\text{mol}\\)，即 <strong>11.3 g</strong>。H₂ 用掉 1.26 g，所以<strong>剩下 8.74 g H₂</strong>。</p>
          `),
        },
        {
          title: { en: 'Theoretical, actual and percent yield', zh: '理論、實際與產率' },
          body: () => L(`
            <ul>
              <li><strong>Theoretical yield</strong>: the maximum product calculated from stoichiometry.</li>
              <li><strong>Actual yield</strong>: the amount obtained in the lab.</li>
              <li><strong>Percent yield</strong>:</li>
            </ul>
            <p class="atomic-eq">\\[\\%\\ \\text{yield} = \\frac{\\text{actual}}{\\text{theoretical}} \\times 100\\%\\]</p>
            ${fig(yieldRing(), 'A theoretical yield of 11.3 g and an actual yield of 9.80 g gives 86.7%.')}
            <p>Percent yield can never exceed 100% in a correct calculation. If it does, suspect impure product, wet product or a calculation error.</p>
            <p class="course-example">Percent yield measures lab technique, not how much product the equation allows.</p>
          `, `
            <ul>
              <li><strong>理論產量</strong>：由計量關係算出的最大產物量。</li>
              <li><strong>實際產量</strong>：實驗中真正得到的量。</li>
              <li><strong>產率</strong>：</li>
            </ul>
            <p class="atomic-eq">\\[\\%\\ \\text{產率} = \\frac{\\text{實際}}{\\text{理論}} \\times 100\\%\\]</p>
            ${fig(yieldRing(), '理論產量 11.3 g、實際產量 9.80 g，產率為 86.7%。')}
            <p>正確計算下產率不可能超過 100%。若超過，要懷疑產物不純、含水分或計算錯誤。</p>
            <p class="course-example">產率衡量的是實驗技術，不是方程式允許的產量。</p>
          `),
        },
        {
          title: { en: 'Solution stoichiometry', zh: '溶液計量' },
          body: () => L(`
            <p><strong>Molarity</strong> is moles of solute per litre of solution:</p>
            <p class="atomic-eq">\\[M = \\frac{\\text{mol solute}}{\\text{L solution}}\\]</p>
            ${fig(beakerSVG(), 'Molarity counts particles per litre; dilution changes the volume but not the number of moles.')}
            <p>Dilution: \\(M_1V_1 = M_2V_2\\).</p>
            <h4>Titration-style example</h4>
            <p>25.0 mL of 0.100 M HCl is neutralized by NaOH:</p>
            <p class="atomic-eq">\\[\\text{HCl} + \\text{NaOH} \\rightarrow \\text{NaCl} + \\text{H}_2\\text{O}\\]</p>
            <p>Moles HCl = \\(0.0250 \\times 0.100 = 2.50 \\times 10^{-3}\\ \\text{mol}\\).</p>
            <p>The ratio is 1:1, so NaOH also supplies \\(2.50 \\times 10^{-3}\\ \\text{mol}\\). If 20.0 mL is used:</p>
            <p class="atomic-eq">\\[M_{\\text{NaOH}} = \\frac{2.50 \\times 10^{-3}}{0.0200} = 0.125\\ \\text{M}\\]</p>
          `, `
            <p><strong>體積莫耳濃度</strong>是每公升溶液中的溶質莫耳數：</p>
            <p class="atomic-eq">\\[M = \\frac{\\text{溶質莫耳數}}{\\text{溶液公升數}}\\]</p>
            ${fig(beakerSVG(), '體積莫耳濃度是每公升的粒子數；稀釋改變體積，但不改變莫耳數。')}
            <p>稀釋：\\(M_1V_1 = M_2V_2\\)。</p>
            <h4>滴定型範例</h4>
            <p>25.0 mL 的 0.100 M HCl 被 NaOH 中和：</p>
            <p class="atomic-eq">\\[\\text{HCl} + \\text{NaOH} \\rightarrow \\text{NaCl} + \\text{H}_2\\text{O}\\]</p>
            <p>HCl 莫耳數 = \\(0.0250 \\times 0.100 = 2.50 \\times 10^{-3}\\ \\text{mol}\\)。</p>
            <p>比例 1:1，所以 NaOH 也提供 \\(2.50 \\times 10^{-3}\\ \\text{mol}\\)。若用掉 20.0 mL：</p>
            <p class="atomic-eq">\\[M_{\\text{NaOH}} = \\frac{2.50 \\times 10^{-3}}{0.0200} = 0.125\\ \\text{M}\\]</p>
          `),
        },
        {
          title: { en: 'Practice problems', zh: '練習題' },
          body: () => L(`
            ${practice(STOICH_PRACTICE, 'st')}
          `, `
            ${practice(STOICH_PRACTICE, 'st')}
          `),
        },
        {
          title: { en: 'Quick quiz', zh: '快速測驗' },
          body: () => quiz([
            {
              q: ['How many moles are in <strong>25.0 g CaCO₃</strong>?', '<strong>25.0 g CaCO₃</strong> 有多少莫耳？'],
              options: [['0.250 mol', '0.250 mol'], ['0.500 mol', '0.500 mol'], ['2.50 mol', '2.50 mol'], ['25.0 mol', '25.0 mol']],
              answer: 0,
              hint: ['Divide mass by molar mass (100.09 g/mol).', '質量除以莫耳質量（100.09 g/mol）。'],
              explain: ['25.0 ÷ 100.09 = 0.250 mol.', '25.0 ÷ 100.09 = 0.250 mol。'],
            },
            {
              q: ['How many molecules are in <strong>0.500 mol CO₂</strong>?', '<strong>0.500 mol CO₂</strong> 有多少個分子？'],
              options: [['3.01 × 10²³', '3.01 × 10²³'], ['6.02 × 10²³', '6.02 × 10²³'], ['1.20 × 10²⁴', '1.20 × 10²⁴'], ['3.01 × 10²²', '3.01 × 10²²']],
              answer: 0,
              hint: ['Multiply by Avogadro’s number.', '乘以亞佛加厥常數。'],
              explain: ['0.500 × 6.022 × 10²³ = 3.01 × 10²³.', '0.500 × 6.022 × 10²³ = 3.01 × 10²³。'],
            },
            {
              q: ['Balance: <strong>Fe + O₂ → Fe₂O₃</strong>', '平衡：<strong>Fe + O₂ → Fe₂O₃</strong>'],
              options: [['2Fe + O₂ → Fe₂O₃', '2Fe + O₂ → Fe₂O₃'], ['4Fe + 3O₂ → 2Fe₂O₃', '4Fe + 3O₂ → 2Fe₂O₃'], ['3Fe + 2O₂ → Fe₂O₃', '3Fe + 2O₂ → Fe₂O₃'], ['Fe + O₂ → FeO₂', 'Fe + O₂ → FeO₂']],
              answer: 1,
              hint: ['Balance oxygen first, then iron.', '先平衡氧，再平衡鐵。'],
              explain: ['4Fe + 3O₂ → 2Fe₂O₃ balances 4 Fe and 6 O on both sides.', '4Fe + 3O₂ → 2Fe₂O₃ 兩側各有 4 個 Fe、6 個 O。'],
            },
            {
              q: ['5.00 g N₂ + 5.00 g H₂ → NH₃. Which is limiting?', '5.00 g N₂ + 5.00 g H₂ → NH₃。哪個是限量試劑？'],
              options: [['N₂', 'N₂'], ['H₂', 'H₂'], ['Both run out together', '兩者同時用完'], ['Neither reacts', '兩者都不反應']],
              answer: 0,
              hint: ['Divide moles by the coefficients in N₂ + 3H₂ → 2NH₃.', '把莫耳數除以 N₂ + 3H₂ → 2NH₃ 的係數。'],
              explain: ['N₂: 0.1785/1 = 0.1785; H₂: 2.48/3 = 0.827. N₂ is limiting.', 'N₂：0.1785/1 = 0.1785；H₂：2.48/3 = 0.827。N₂ 是限量試劑。'],
            },
            {
              q: ['The theoretical yield is 6.08 g and the actual yield is 4.50 g. What is the percent yield?', '理論產量 6.08 g、實際產量 4.50 g，產率是多少？'],
              options: [['74.0%', '74.0%'], ['86.7%', '86.7%'], ['135%', '135%'], ['4.50%', '4.50%']],
              answer: 0,
              hint: ['Actual ÷ theoretical × 100%.', '實際 ÷ 理論 × 100%。'],
              explain: ['4.50 ÷ 6.08 × 100% = 74.0%.', '4.50 ÷ 6.08 × 100% = 74.0%。'],
            },
            {
              q: ['What is the molarity of 5.85 g NaCl in 250.0 mL of solution?', '5.85 g NaCl 溶於 250.0 mL 溶液，體積莫耳濃度是多少？'],
              options: [['0.100 M', '0.100 M'], ['0.400 M', '0.400 M'], ['1.00 M', '1.00 M'], ['2.50 M', '2.50 M']],
              answer: 1,
              hint: ['Moles NaCl = 0.100; volume = 0.2500 L.', 'NaCl 莫耳數 = 0.100；體積 = 0.2500 L。'],
              explain: ['0.100 mol ÷ 0.2500 L = 0.400 M.', '0.100 mol ÷ 0.2500 L = 0.400 M。'],
            },
          ], 'st'),
        },
        {
          title: { en: 'Beginner checklist', zh: '初學者檢查表' },
          body: () => L(`
            <ul class="course-checklist">
              <li>1 mol = 6.022 × 10²³ particles; molar mass is in g/mol.</li>
              <li>Convert through moles for every stoichiometry problem.</li>
              <li>Balance the equation first — coefficients are mole ratios.</li>
              <li>Use the limiting reactant to find the maximum product.</li>
              <li>Percent yield = actual ÷ theoretical × 100%.</li>
              <li>Empirical formula = simplest ratio; molecular formula = actual ratio.</li>
              <li>At STP, 1 mol gas ≈ 22.4 L (or 22.7 L at 1 bar).</li>
              <li>Molarity = mol/L; dilution uses M₁V₁ = M₂V₂.</li>
            </ul>
          `, `
            <ul class="course-checklist">
              <li>1 mol = 6.022 × 10²³ 個粒子；莫耳質量單位是 g/mol。</li>
              <li>每個計量問題都經由莫耳換算。</li>
              <li>先平衡方程式——係數就是莫耳比。</li>
              <li>用限量試劑求最大產量。</li>
              <li>產率 = 實際 ÷ 理論 × 100%。</li>
              <li>實驗式 = 最簡比；分子式 = 實際比。</li>
              <li>STP 下 1 mol 氣體約 22.4 L（1 bar 時為 22.7 L）。</li>
              <li>體積莫耳濃度 = mol/L；稀釋用 M₁V₁ = M₂V₂。</li>
            </ul>
          `),
        },
      ],
    },

    {
      id: 'electrolysis',
      rootId: 'course-body-electrolysis',
      title: { en: 'Electrolysis', zh: '電解' },
      sections: [
        {
          title: { en: 'Redox review', zh: '氧化還原複習' },
          body: () => L(`
            <p>Electrolysis is a <strong>redox</strong> process, so begin with the basics.</p>
            <ul>
              <li><strong>Oxidation</strong> = loss of electrons (oxidation number increases).</li>
              <li><strong>Reduction</strong> = gain of electrons (oxidation number decreases).</li>
            </ul>
            <p class="course-example"><strong>OIL RIG</strong>: Oxidation Is Loss, Reduction Is Gain.</p>
            ${table(['Rule', 'Example'], [
              ['Free element = 0', 'Na, O₂, Cl₂'],
              ['Monatomic ion = its charge', 'Na⁺ = +1, Cl⁻ = −1'],
              ['O usually −2 (peroxides −1; OF₂ +2)', 'H₂O: O = −2'],
              ['H usually +1 (metal hydrides −1)', 'HCl: H = +1'],
              ['Sum = overall charge', 'KMnO₄: Mn = +7'],
            ])}
            <h4>Example</h4>
            <p class="atomic-eq">\\[\\text{Zn} + \\text{Cu}^{2+} \\rightarrow \\text{Zn}^{2+} + \\text{Cu}\\]</p>
            <p>Zn: 0 → +2 (oxidized, loses 2 e⁻). Cu²⁺: +2 → 0 (reduced, gains 2 e⁻).</p>
          `, `
            <p>電解是<strong>氧化還原</strong>過程，先複習基礎。</p>
            <ul>
              <li><strong>氧化</strong> = 失去電子（氧化數上升）。</li>
              <li><strong>還原</strong> = 得到電子（氧化數下降）。</li>
            </ul>
            <p class="course-example"><strong>OIL RIG</strong>：Oxidation Is Loss，Reduction Is Gain。</p>
            ${table(['規則', '例子'], [
              ['游離元素 = 0', 'Na、O₂、Cl₂'],
              ['單原子離子 = 其電荷', 'Na⁺ = +1、Cl⁻ = −1'],
              ['O 通常 −2（過氧化物 −1；OF₂ +2）', 'H₂O：O = −2'],
              ['H 通常 +1（金屬氫化物 −1）', 'HCl：H = +1'],
              ['總和 = 整體電荷', 'KMnO₄：Mn = +7'],
            ])}
            <h4>例子</h4>
            <p class="atomic-eq">\\[\\text{Zn} + \\text{Cu}^{2+} \\rightarrow \\text{Zn}^{2+} + \\text{Cu}\\]</p>
            <p>Zn：0 → +2（被氧化，失去 2 e⁻）。Cu²⁺：+2 → 0（被還原，得到 2 e⁻）。</p>
          `),
        },
        {
          title: { en: 'Two kinds of cell', zh: '兩種電池' },
          body: () => L(`
            ${table(['Feature', 'Galvanic (voltaic) cell', 'Electrolytic cell'], [
              ['Energy conversion', 'chemical → electrical', 'electrical → chemical'],
              ['Spontaneity', 'spontaneous', 'nonspontaneous (driven)'],
              ['Power source', 'none — produces current', 'external supply'],
              ['Anode sign', 'negative (−)', '<strong>positive (+)</strong>'],
              ['Cathode sign', 'positive (+)', '<strong>negative (−)</strong>'],
            ])}
            <p><strong>In both cell types:</strong> anode = oxidation; cathode = reduction. Only the electrode signs differ.</p>
            ${fig(cellSVG(), 'An electrolytic cell: the power supply forces electrons in the nonspontaneous direction.')}
            <p class="course-example">Remember the labels, not the signs: oxidation always happens at the anode.</p>
          `, `
            ${table(['特徵', '伏打電池', '電解池'], [
              ['能量轉換', '化學 → 電能', '電能 → 化學'],
              ['自發性', '自發', '非自發（被驅動）'],
              ['電源', '無——產生電流', '外部電源'],
              ['陽極電性', '負（−）', '<strong>正（+）</strong>'],
              ['陰極電性', '正（+）', '<strong>負（−）</strong>'],
            ])}
            <p><strong>兩種電池中：</strong>陽極 = 氧化；陰極 = 還原。只有電極電性不同。</p>
            ${fig(cellSVG(), '電解池：電源把電子推向非自發方向。')}
            <p class="course-example">記住標籤，不要只記電性：氧化永遠發生在陽極。</p>
          `),
        },
        {
          title: { en: 'Inside the electrolysis cell', zh: '電解池內部' },
          body: () => L(`
            <ul>
              <li><strong>Electrolyte</strong>: a molten ionic compound or an aqueous solution containing ions.</li>
              <li><strong>Electrodes</strong>: usually inert (graphite, platinum), but sometimes active (Cu, Ag).</li>
              <li><strong>External power supply</strong>: forces electrons in the nonspontaneous direction.</li>
            </ul>
            <p>At the <strong>anode (+)</strong>, electrons are pulled away — oxidation. At the <strong>cathode (−)</strong>, electrons are pushed in — reduction.</p>
            ${fig(cellSVG(), 'The anode is positive in electrolysis; the cathode is negative. Electrons flow through the wire, ions carry charge through the liquid.')}
            <p class="course-example">Electrons do not travel through the solution; ions do. The wire carries electrons, the electrolyte carries ions.</p>
          `, `
            <ul>
              <li><strong>電解質</strong>：熔融離子化合物，或含離子的水溶液。</li>
              <li><strong>電極</strong>：通常為惰性（石墨、鉑），有時為活性（Cu、Ag）。</li>
              <li><strong>外部電源</strong>：把電子推向非自發方向。</li>
            </ul>
            <p><strong>陽極（+）</strong>把電子拉走——氧化。<strong>陰極（−）</strong>把電子推入——還原。</p>
            ${fig(cellSVG(), '電解時陽極為正、陰極為負。電子走導線，離子則在液體中導電。')}
            <p class="course-example">電子不穿過溶液；是離子在移動。導線載電子，電解質載離子。</p>
          `),
        },
        {
          title: { en: 'Molten salts', zh: '熔融鹽' },
          body: () => L(`
            <p>In a <strong>molten</strong> salt, only the ions from the salt are present — no water.</p>
            <h4>Molten NaCl</h4>
            <p>Cathode (−):</p>
            <p class="atomic-eq">\\[\\text{Na}^{+} + e^{-} \\rightarrow \\text{Na}\\]</p>
            <p>Anode (+):</p>
            <p class="atomic-eq">\\[2\\text{Cl}^{-} \\rightarrow \\text{Cl}_2 + 2e^{-}\\]</p>
            <p>Overall:</p>
            <p class="atomic-eq">\\[2\\text{NaCl} \\rightarrow 2\\text{Na} + \\text{Cl}_2\\]</p>
            <p>This is how sodium metal is produced industrially in a Downs cell.</p>
            <p class="course-example">No water means no competing H⁺ or OH⁻ — the salt’s own ions must discharge.</p>
          `, `
            <p><strong>熔融</strong>鹽中只有鹽本身的離子——沒有水。</p>
            <h4>熔融 NaCl</h4>
            <p>陰極（−）：</p>
            <p class="atomic-eq">\\[\\text{Na}^{+} + e^{-} \\rightarrow \\text{Na}\\]</p>
            <p>陽極（+）：</p>
            <p class="atomic-eq">\\[2\\text{Cl}^{-} \\rightarrow \\text{Cl}_2 + 2e^{-}\\]</p>
            <p>總反應：</p>
            <p class="atomic-eq">\\[2\\text{NaCl} \\rightarrow 2\\text{Na} + \\text{Cl}_2\\]</p>
            <p>工業上在唐斯電解槽中就是這樣生產鈉金屬。</p>
            <p class="course-example">沒有水就沒有 H⁺ 或 OH⁻ 競爭——鹽本身的離子必須放電。</p>
          `),
        },
        {
          title: { en: 'Aqueous solutions: who discharges?', zh: '水溶液：誰放電？' },
          body: () => L(`
            <p>Water is always present as a competing source of ions:</p>
            <p class="atomic-eq">\\[\\text{H}_2\\text{O} \\rightleftharpoons \\text{H}^{+} + \\text{OH}^{-}\\]</p>
            <h4>At the cathode (−)</h4>
            <ul>
              <li>Very reactive metal cations (K⁺, Na⁺, Ca²⁺, Mg²⁺, Al³⁺) are <strong>not</strong> reduced in water. Water is reduced instead: \\(2\\text{H}_2\\text{O} + 2e^{-} \\rightarrow \\text{H}_2 + 2\\text{OH}^{-}\\).</li>
              <li>Less reactive cations (Cu²⁺, Ag⁺, Pb²⁺) are reduced to metal.</li>
            </ul>
            <h4>At the anode (+)</h4>
            <ul>
              <li>Concentrated halides (Cl⁻, Br⁻, I⁻) are oxidized to halogen.</li>
              <li>Dilute halides and sulfate or nitrate solutions: water is oxidized: \\(2\\text{H}_2\\text{O} \\rightarrow \\text{O}_2 + 4\\text{H}^{+} + 4e^{-}\\).</li>
              <li>Active anodes (Cu, Ag) dissolve instead.</li>
            </ul>
            ${table(['Situation', 'Cathode product', 'Anode product'], [
              ['Molten NaCl', 'Na', 'Cl₂'],
              ['Concentrated aqueous NaCl', 'H₂', 'Cl₂'],
              ['Dilute aqueous NaCl', 'H₂', 'O₂'],
              ['Acidified water', 'H₂', 'O₂'],
              ['CuSO₄(aq), inert electrodes', 'Cu', 'O₂'],
              ['CuSO₄(aq), Cu electrodes', 'Cu deposited', 'Cu dissolves'],
            ])}
            <p class="course-example">The reactivity series, concentration and electrode material all help decide who wins.</p>
          `, `
            <p>水中永遠有可競爭的離子：</p>
            <p class="atomic-eq">\\[\\text{H}_2\\text{O} \\rightleftharpoons \\text{H}^{+} + \\text{OH}^{-}\\]</p>
            <h4>陰極（−）</h4>
            <ul>
              <li>非常活潑的金屬陽離子（K⁺、Na⁺、Ca²⁺、Mg²⁺、Al³⁺）在水中<strong>不會</strong>被還原。水會先被還原：\\(2\\text{H}_2\\text{O} + 2e^{-} \\rightarrow \\text{H}_2 + 2\\text{OH}^{-}\\)。</li>
              <li>較不活潑的陽離子（Cu²⁺、Ag⁺、Pb²⁺）還原成金屬。</li>
            </ul>
            <h4>陽極（+）</h4>
            <ul>
              <li>濃鹵化物（Cl⁻、Br⁻、I⁻）氧化成鹵素。</li>
              <li>稀鹵化物與硫酸根、硝酸根溶液：水被氧化：\\(2\\text{H}_2\\text{O} \\rightarrow \\text{O}_2 + 4\\text{H}^{+} + 4e^{-}\\)。</li>
              <li>活性陽極（Cu、Ag）會溶解。</li>
            </ul>
            ${table(['情況', '陰極產物', '陽極產物'], [
              ['熔融 NaCl', 'Na', 'Cl₂'],
              ['濃食鹽水', 'H₂', 'Cl₂'],
              ['稀食鹽水', 'H₂', 'O₂'],
              ['酸化水', 'H₂', 'O₂'],
              ['CuSO₄(aq)、惰性電極', 'Cu', 'O₂'],
              ['CuSO₄(aq)、銅電極', '銅析出', '銅溶解'],
            ])}
            <p class="course-example">活性序列、濃度與電極材料一起決定誰勝出。</p>
          `),
        },
        {
          title: { en: 'Worked examples', zh: '範例解析' },
          body: () => L(`
            <h4>A. Concentrated brine</h4>
            <p>Cathode: \\(2\\text{H}_2\\text{O} + 2e^{-} \\rightarrow \\text{H}_2 + 2\\text{OH}^{-}\\)</p>
            <p>Anode: \\(2\\text{Cl}^{-} \\rightarrow \\text{Cl}_2 + 2e^{-}\\)</p>
            <p class="atomic-eq">\\[2\\text{NaCl} + 2\\text{H}_2\\text{O} \\rightarrow 2\\text{NaOH} + \\text{H}_2 + \\text{Cl}_2\\]</p>
            <p>This is the industrial <strong>chlor-alkali</strong> process.</p>
            <h4>B. Acidified water</h4>
            <p>Cathode: \\(2\\text{H}^{+} + 2e^{-} \\rightarrow \\text{H}_2\\). Anode: \\(2\\text{H}_2\\text{O} \\rightarrow \\text{O}_2 + 4\\text{H}^{+} + 4e^{-}\\). Overall: \\(2\\text{H}_2\\text{O} \\rightarrow 2\\text{H}_2 + \\text{O}_2\\), with a <strong>2:1</strong> volume ratio.</p>
            <h4>C. CuSO₄ with inert electrodes</h4>
            <p>Cathode: \\(\\text{Cu}^{2+} + 2e^{-} \\rightarrow \\text{Cu}\\). Anode: water is oxidized to O₂. The solution becomes more acidic as Cu²⁺ leaves.</p>
            <h4>D. CuSO₄ with copper electrodes</h4>
            <p>Copper deposits at the cathode and dissolves from the anode; Cu²⁺ concentration stays roughly constant. This is <strong>electrorefining</strong> and <strong>electroplating</strong>.</p>
          `, `
            <h4>A. 濃食鹽水</h4>
            <p>陰極：\\(2\\text{H}_2\\text{O} + 2e^{-} \\rightarrow \\text{H}_2 + 2\\text{OH}^{-}\\)</p>
            <p>陽極：\\(2\\text{Cl}^{-} \\rightarrow \\text{Cl}_2 + 2e^{-}\\)</p>
            <p class="atomic-eq">\\[2\\text{NaCl} + 2\\text{H}_2\\text{O} \\rightarrow 2\\text{NaOH} + \\text{H}_2 + \\text{Cl}_2\\]</p>
            <p>這就是工業<strong>氯鹼</strong>製程。</p>
            <h4>B. 酸化水</h4>
            <p>陰極：\\(2\\text{H}^{+} + 2e^{-} \\rightarrow \\text{H}_2\\)。陽極：\\(2\\text{H}_2\\text{O} \\rightarrow \\text{O}_2 + 4\\text{H}^{+} + 4e^{-}\\)。總反應：\\(2\\text{H}_2\\text{O} \\rightarrow 2\\text{H}_2 + \\text{O}_2\\)，體積比 <strong>2:1</strong>。</p>
            <h4>C. CuSO₄ 惰性電極</h4>
            <p>陰極：\\(\\text{Cu}^{2+} + 2e^{-} \\rightarrow \\text{Cu}\\)。陽極：水被氧化成 O₂。Cu²⁺ 減少，溶液變得更酸。</p>
            <h4>D. CuSO₄ 銅電極</h4>
            <p>銅在陰極析出、在陽極溶解；Cu²⁺ 濃度大致不變。這就是<strong>電精煉</strong>與<strong>電鍍</strong>。</p>
          `),
        },
        {
          title: { en: 'Faraday’s laws', zh: '法拉第定律' },
          body: () => L(`
            <p>The charge passed is current × time:</p>
            <p class="atomic-eq">\\[Q = I \\times t\\]</p>
            <p>where \\(Q\\) is in coulombs, \\(I\\) in amperes and \\(t\\) in seconds.</p>
            <p>Moles of electrons:</p>
            <p class="atomic-eq">\\[n(e^{-}) = \\frac{Q}{F}\\]</p>
            <p>with <strong>Faraday’s constant</strong> \\(F = 96{,}485\\ \\text{C/mol } e^{-}\\).</p>
            <p class="atomic-eq">\\[\\text{mass} = \\frac{I \\times t}{z \\times F} \\times M\\]</p>
            <p>Here \\(z\\) is the number of electrons per ion (2 for Cu²⁺, 1 for Ag⁺, 3 for Al³⁺).</p>
            <h4>Copper deposition</h4>
            <p>2.00 A for 1.00 h:</p>
            <ul>
              <li>\\(Q = 2.00 \\times 3600 = 7200\\ \\text{C}\\).</li>
              <li>\\(n(e^{-}) = 7200 / 96{,}485 = 0.0746\\ \\text{mol}\\).</li>
              <li>\\(n(\\text{Cu}) = 0.0746 / 2 = 0.0373\\ \\text{mol}\\).</li>
              <li>mass = \\(0.0373 \\times 63.55 = 2.37\\ \\text{g}\\).</li>
            </ul>
            <p class="course-example">0.500 A for 2.00 h at a hydrogen cathode gives 0.0187 mol H₂, or about 418 mL at STP.</p>
          `, `
            <p>通過的電荷等於電流乘以時間：</p>
            <p class="atomic-eq">\\[Q = I \\times t\\]</p>
            <p>其中 \\(Q\\) 單位庫侖，\\(I\\) 安培，\\(t\\) 秒。</p>
            <p>電子莫耳數：</p>
            <p class="atomic-eq">\\[n(e^{-}) = \\frac{Q}{F}\\]</p>
            <p><strong>法拉第常數</strong> \\(F = 96{,}485\\ \\text{C/mol } e^{-}\\)。</p>
            <p class="atomic-eq">\\[\\text{質量} = \\frac{I \\times t}{z \\times F} \\times M\\]</p>
            <p>\\(z\\) 是每個離子需要的電子數（Cu²⁺ 為 2、Ag⁺ 為 1、Al³⁺ 為 3）。</p>
            <h4>銅析出</h4>
            <p>2.00 A 通電 1.00 小時：</p>
            <ul>
              <li>\\(Q = 2.00 \\times 3600 = 7200\\ \\text{C}\\)。</li>
              <li>\\(n(e^{-}) = 7200 / 96{,}485 = 0.0746\\ \\text{mol}\\)。</li>
              <li>\\(n(\\text{Cu}) = 0.0746 / 2 = 0.0373\\ \\text{mol}\\)。</li>
              <li>質量 = \\(0.0373 \\times 63.55 = 2.37\\ \\text{g}\\)。</li>
            </ul>
            <p class="course-example">0.500 A 通電 2.00 小時，在氫陰極可得到 0.0187 mol H₂，STP 下約 418 mL。</p>
          `),
        },
        {
          title: { en: 'Applications', zh: '應用' },
          body: () => L(`
            ${table(['Application', 'What happens'], [
              ['Electroplating', 'metal deposits on an object at the cathode'],
              ['Electrorefining', 'impure anode dissolves; pure metal deposits at the cathode'],
              ['Reactive-metal extraction', 'Na from molten NaCl; Al from Al₂O₃'],
              ['Chlor-alkali process', 'brine → Cl₂, H₂ and NaOH'],
              ['Anodizing', 'a thick oxide layer forms on aluminium'],
              ['Water splitting', 'H₂ and O₂ production'],
            ])}
            <h4>Hall–Héroult process</h4>
            <p>Al₂O₃ is dissolved in molten cryolite and electrolyzed with carbon electrodes.</p>
            <p>Cathode: \\(\\text{Al}^{3+} + 3e^{-} \\rightarrow \\text{Al}\\).</p>
            <p>Anode: \\(2\\text{O}^{2-} \\rightarrow \\text{O}_2 + 4e^{-}\\).</p>
            <p>The oxygen reacts with the hot carbon anode, producing CO₂ — so the anodes are gradually consumed.</p>
            <p class="course-example">Electrolysis is how we trade electrical energy for otherwise stubborn chemical changes.</p>
          `, `
            ${table(['應用', '發生什麼'], [
              ['電鍍', '金屬在陰極附著到物件上'],
              ['電精煉', '不純陽極溶解；純金屬在陰極析出'],
              ['活潑金屬提煉', '熔融 NaCl 製 Na；Al₂O₃ 製 Al'],
              ['氯鹼製程', '食鹽水 → Cl₂、H₂、NaOH'],
              ['陽極氧化', '鋁表面形成厚氧化層'],
              ['水電解', '產生 H₂ 與 O₂'],
            ])}
            <h4>霍爾－埃魯法</h4>
            <p>Al₂O₃ 溶於熔融冰晶石，用碳電極電解。</p>
            <p>陰極：\\(\\text{Al}^{3+} + 3e^{-} \\rightarrow \\text{Al}\\)。</p>
            <p>陽極：\\(2\\text{O}^{2-} \\rightarrow \\text{O}_2 + 4e^{-}\\)。</p>
            <p>氧與高溫碳陽極反應生成 CO₂——所以陽極會逐漸消耗。</p>
            <p class="course-example">電解讓我們用電能換取原本難以發生的化學變化。</p>
          `),
        },
        {
          title: { en: 'Practice problems', zh: '練習題' },
          body: () => L(`
            ${practice(ELECTROLYSIS_PRACTICE, 'el')}
          `, `
            ${practice(ELECTROLYSIS_PRACTICE, 'el')}
          `),
        },
        {
          title: { en: 'Quick quiz', zh: '快速測驗' },
          body: () => quiz([
            {
              q: ['In an electrolytic cell, the cathode is the…', '電解池中，陰極是……'],
              options: [['positive electrode', '正電極'], ['negative electrode', '負電極'], ['salt bridge', '鹽橋'], ['power supply', '電源']],
              answer: 1,
              hint: ['Reduction happens there; electrons are pushed in.', '還原在那裡發生；電子被推入。'],
              explain: ['The cathode is negative in electrolysis, and reduction occurs there.', '電解時陰極為負，還原發生在陰極。'],
            },
            {
              q: ['What are the products of electrolyzing <strong>molten NaCl</strong>?', '電解<strong>熔融 NaCl</strong> 的產物是什麼？'],
              options: [['Na and Cl₂', 'Na 與 Cl₂'], ['H₂ and Cl₂', 'H₂ 與 Cl₂'], ['NaOH and Cl₂', 'NaOH 與 Cl₂'], ['H₂ and O₂', 'H₂ 與 O₂']],
              answer: 0,
              hint: ['No water is present.', '沒有水存在。'],
              explain: ['The salt’s own ions discharge: Na at the cathode, Cl₂ at the anode.', '鹽本身的離子放電：陰極得 Na，陽極得 Cl₂。'],
            },
            {
              q: ['Concentrated aqueous NaCl gives which three products?', '濃食鹽水電解產生哪三種產物？'],
              options: [['Na, Cl₂, O₂', 'Na、Cl₂、O₂'], ['NaOH, H₂, Cl₂', 'NaOH、H₂、Cl₂'], ['HCl, H₂, O₂', 'HCl、H₂、O₂'], ['NaCl, H₂, O₂', 'NaCl、H₂、O₂']],
              answer: 1,
              hint: ['This is the chlor-alkali process.', '這是氯鹼製程。'],
              explain: ['Water is reduced at the cathode and chloride oxidized at the anode, leaving NaOH in solution.', '水在陰極還原、氯離子在陽極氧化，溶液中留下 NaOH。'],
            },
            {
              q: ['A current of 3.00 A flows for 30.0 min through CuSO₄(aq). What mass of Cu deposits?', '3.00 A 通電 30.0 分鐘通過 CuSO₄(aq)，析出多少銅？'],
              options: [['0.890 g', '0.890 g'], ['1.78 g', '1.78 g'], ['3.56 g', '3.56 g'], ['7.12 g', '7.12 g']],
              answer: 1,
              hint: ['Q = It; divide by 96,485; then divide by 2 for Cu²⁺.', 'Q = It；除以 96,485；Cu²⁺ 再除以 2。'],
              explain: ['Q = 5400 C; 0.0560 mol e⁻; 0.0280 mol Cu; 1.78 g.', 'Q = 5400 C；0.0560 mol e⁻；0.0280 mol Cu；1.78 g。'],
            },
            {
              q: ['With copper electrodes in CuSO₄(aq), what happens at the anode?', 'CuSO₄(aq) 用銅電極時，陽極發生什麼？'],
              options: [['O₂ is produced', '產生 O₂'], ['Copper dissolves', '銅溶解'], ['Sulfate is oxidized', '硫酸根被氧化'], ['Nothing happens', '什麼都不發生']],
              answer: 1,
              hint: ['An active anode can take part in the reaction.', '活性陽極可以參與反應。'],
              explain: ['Copper dissolves as Cu → Cu²⁺ + 2e⁻; copper plates onto the cathode.', '銅以 Cu → Cu²⁺ + 2e⁻ 溶解；同時在陰極析出。'],
            },
            {
              q: ['Why does aqueous NaCl give H₂ at the cathode rather than Na?', '為何食鹽水在陰極產生 H₂ 而不是 Na？'],
              options: [['Na⁺ is too reactive to be reduced in water', 'Na⁺ 太活潑，在水中不會被還原'], ['Cl⁻ blocks the cathode', 'Cl⁻ 阻擋陰極'], ['Water is a nonpolar solvent', '水是非極性溶劑'], ['Na is a gas at room temperature', 'Na 在常溫是氣體']],
              answer: 0,
              hint: ['Compare the reactivity series.', '比較活性序列。'],
              explain: ['Na⁺ is not reduced in water; water is reduced to H₂ and OH⁻ instead.', 'Na⁺ 在水中不被還原；水反而被還原成 H₂ 與 OH⁻。'],
            },
          ], 'el'),
        },
        {
          title: { en: 'Beginner checklist', zh: '初學者檢查表' },
          body: () => L(`
            <ul class="course-checklist">
              <li>Anode = oxidation; cathode = reduction — always.</li>
              <li>In electrolysis, the anode is positive and the cathode is negative.</li>
              <li>Molten salts: only the salt’s ions discharge.</li>
              <li>Aqueous solutions: use selective-discharge rules.</li>
              <li>Very reactive cations (Na⁺, K⁺, Mg²⁺, Al³⁺) are not reduced in water; H₂ forms instead.</li>
              <li>Active anodes dissolve; inert anodes let water or anions oxidize.</li>
              <li>Use Q = It and n(e⁻) = Q/F with F = 96,485 C/mol.</li>
              <li>Divide moles of electrons by z to find moles of product.</li>
            </ul>
          `, `
            <ul class="course-checklist">
              <li>陽極 = 氧化；陰極 = 還原——永遠如此。</li>
              <li>電解時陽極為正、陰極為負。</li>
              <li>熔融鹽：只有鹽本身的離子放電。</li>
              <li>水溶液：使用選擇性放電規則。</li>
              <li>非常活潑的陽離子（Na⁺、K⁺、Mg²⁺、Al³⁺）在水中不被還原，改為產生 H₂。</li>
              <li>活性陽極會溶解；惰性陽極讓水或陰離子氧化。</li>
              <li>用 Q = It 與 n(e⁻) = Q/F，F = 96,485 C/mol。</li>
              <li>電子莫耳數除以 z，得到產物莫耳數。</li>
            </ul>
          `),
        },
      ],
    },
    {
      id: 'solubility',
      rootId: 'course-body-solubility',
      title: { en: 'Solubility and Precipitation', zh: '溶解度與沉澱' },
      sections: [
        {
          title: { en: 'Solubility and Ksp', zh: '溶解度與 Ksp' },
          body: () => L(`
            <p><strong>Solubility</strong> is the amount of a substance that dissolves in a given amount of solvent — usually reported in g/L or mol/L. A <strong>slightly soluble</strong> salt does not simply vanish: a tiny amount dissolves, and the rest stays as solid in equilibrium with its ions.</p>
            <p class="atomic-eq">\\[\\text{M}_a\\text{X}_b(s) \\rightleftharpoons a\\,\\text{M}^{b+}(aq) + b\\,\\text{X}^{a-}(aq)\\]</p>
            <p>The <strong>solubility product constant</strong>, \\(K_{sp}\\), describes that equilibrium. It has the same form as any equilibrium constant:</p>
            <p class="atomic-eq">\\[K_{sp} = [\\text{M}^{b+}]^a[\\text{X}^{a-}]^b\\]</p>
            ${fig(kspEquilibriumSVG(), 'A saturated solution keeps undissolved solid in equilibrium with its ions. The solid is not part of the Ksp expression.')}
            <ul>
              <li>The <strong>solid is left out</strong>: its concentration does not change.</li>
              <li>Ksp depends on <strong>temperature</strong>, not on how much solid is present.</li>
              <li>A <strong>smaller Ksp</strong> means the salt is less soluble — for salts of the same formula type.</li>
            </ul>
            <p class="course-example">Solubility is an amount (mol/L); Ksp is an equilibrium constant. They are related, but they are not the same number.</p>
          `, `
            <p><strong>溶解度</strong>是某物質在定量溶劑中能溶解的量，通常以 g/L 或 mol/L 表示。<strong>微溶性</strong>鹽并不是憑空消失：少量溶解，其餘以固體形式與離子保持平衡。</p>
            <p class="atomic-eq">\\[\\text{M}_a\\text{X}_b(s) \\rightleftharpoons a\\,\\text{M}^{b+}(aq) + b\\,\\text{X}^{a-}(aq)\\]</p>
            <p><strong>溶度積常數</strong> \\(K_{sp}\\) 描述這個平衡，形式與一般平衡常數相同：</p>
            <p class="atomic-eq">\\[K_{sp} = [\\text{M}^{b+}]^a[\\text{X}^{a-}]^b\\]</p>
            ${fig(kspEquilibriumSVG(), '飽和溶液讓未溶解的固體與其離子保持平衡。固體不列入 Ksp 表示式。')}
            <ul>
              <li><strong>固體不列入</strong>：它的濃度不會改變。</li>
              <li>Ksp 只取決於<strong>溫度</strong>，與固體量無關。</li>
              <li>對同型式的鹽而言，<strong>Ksp 越小</strong>表示越難溶。</li>
            </ul>
            <p class="course-example">溶解度是「量」（mol/L）；Ksp 是平衡常數。兩者相關，但不是同一個數值。</p>
          `),
        },
        {
          title: { en: 'Writing Ksp expressions', zh: '寫出 Ksp 表示式' },
          body: () => L(`
            <p>Write the dissociation first, then raise each ion concentration to the coefficient in front of it.</p>
            ${table(['Salt', 'Dissociation', 'Ksp expression'], [
              ['AgCl', 'AgCl(s) ⇌ Ag⁺ + Cl⁻', 'Ksp = [Ag⁺][Cl⁻]'],
              ['CaF₂', 'CaF₂(s) ⇌ Ca²⁺ + 2F⁻', 'Ksp = [Ca²⁺][F⁻]²'],
              ['Ag₂CrO₄', 'Ag₂CrO₄(s) ⇌ 2Ag⁺ + CrO₄²⁻', 'Ksp = [Ag⁺]²[CrO₄²⁻]'],
              ['Al(OH)₃', 'Al(OH)₃(s) ⇌ Al³⁺ + 3OH⁻', 'Ksp = [Al³⁺][OH⁻]³'],
              ['PbCl₂', 'PbCl₂(s) ⇌ Pb²⁺ + 2Cl⁻', 'Ksp = [Pb²⁺][Cl⁻]²'],
            ], true)}
            ${saltExplorer()}
            <p class="course-example"><strong>Beginner tip:</strong> the exponent on each ion is exactly its coefficient in the balanced dissociation equation. If there is no coefficient written, the exponent is 1.</p>
          `, `
            <p>先寫解離方程式，再把每個離子濃度取「方程式中的係數」次方。</p>
            ${table(['鹽', '解離', 'Ksp 表示式'], [
              ['AgCl', 'AgCl(s) ⇌ Ag⁺ + Cl⁻', 'Ksp = [Ag⁺][Cl⁻]'],
              ['CaF₂', 'CaF₂(s) ⇌ Ca²⁺ + 2F⁻', 'Ksp = [Ca²⁺][F⁻]²'],
              ['Ag₂CrO₄', 'Ag₂CrO₄(s) ⇌ 2Ag⁺ + CrO₄²⁻', 'Ksp = [Ag⁺]²[CrO₄²⁻]'],
              ['Al(OH)₃', 'Al(OH)₃(s) ⇌ Al³⁺ + 3OH⁻', 'Ksp = [Al³⁺][OH⁻]³'],
              ['PbCl₂', 'PbCl₂(s) ⇌ Pb²⁺ + 2Cl⁻', 'Ksp = [Pb²⁺][Cl⁻]²'],
            ], true)}
            ${saltExplorer()}
            <p class="course-example"><strong>初學者提示：</strong>每個離子的指數，就是平衡解離方程式中的係數；沒寫係數就是 1。</p>
          `),
        },
        {
          title: { en: 'From Ksp to molar solubility', zh: '由 Ksp 求莫耳溶解度' },
          body: () => L(`
            <p><strong>Molar solubility</strong>, \\(s\\), is the moles of salt that dissolve per litre of saturated solution.</p>
            <h4>1:1 salts — AgCl</h4>
            <p class="atomic-eq">\\[\\text{AgCl}(s) \\rightleftharpoons \\text{Ag}^+ + \\text{Cl}^-\\]</p>
            <p>If \\(s\\) moles dissolve per litre, then \\([\\text{Ag}^+] = s\\) and \\([\\text{Cl}^-] = s\\).</p>
            <p class="atomic-eq">\\[K_{sp} = s^2 \\quad\\Rightarrow\\quad s = \\sqrt{K_{sp}}\\]</p>
            <p>With \\(K_{sp}(\\text{AgCl}) = 1.8 \\times 10^{-10}\\):</p>
            <p class="atomic-eq">\\[s = \\sqrt{1.8 \\times 10^{-10}} = 1.34 \\times 10^{-5}\\ \\text{M}\\]</p>
            <h4>1:2 and 2:1 salts — CaF₂</h4>
            <p class="atomic-eq">\\[\\text{CaF}_2(s) \\rightleftharpoons \\text{Ca}^{2+} + 2\\text{F}^-\\]</p>
            <p>Now \\([\\text{Ca}^{2+}] = s\\) but \\([\\text{F}^-] = 2s\\), so:</p>
            <p class="atomic-eq">\\[K_{sp} = (s)(2s)^2 = 4s^3 \\quad\\Rightarrow\\quad s = \\sqrt[3]{K_{sp}/4}\\]</p>
            <p>With \\(K_{sp}(\\text{CaF}_2) = 3.9 \\times 10^{-11}\\):</p>
            <p class="atomic-eq">\\[s = \\sqrt[3]{3.9 \\times 10^{-11}/4} \\approx 2.14 \\times 10^{-4}\\ \\text{M}\\]</p>
            <h4>The general formula</h4>
            <p>For \\(\\text{M}_a\\text{X}_b\\):</p>
            <p class="atomic-eq">\\[K_{sp} = (as)^a(bs)^b \\quad\\Rightarrow\\quad s = \\left(\\frac{K_{sp}}{a^a b^b}\\right)^{1/(a+b)}\\]</p>
            <p class="course-example">Ag₂CrO₄ also gives \\(K_{sp} = 4s^3\\). Its molar solubility is \\(s = \\sqrt[3]{1.1 \\times 10^{-12}/4} \\approx 6.5 \\times 10^{-5}\\) M.</p>
          `, `
            <p><strong>莫耳溶解度</strong> \\(s\\) 是每公升飽和溶液中溶解的鹽的莫耳數。</p>
            <h4>1:1 鹽——AgCl</h4>
            <p class="atomic-eq">\\[\\text{AgCl}(s) \\rightleftharpoons \\text{Ag}^+ + \\text{Cl}^-\\]</p>
            <p>若每公升溶解 \\(s\\) 莫耳，則 \\([\\text{Ag}^+] = s\\)、\\([\\text{Cl}^-] = s\\)。</p>
            <p class="atomic-eq">\\[K_{sp} = s^2 \\quad\\Rightarrow\\quad s = \\sqrt{K_{sp}}\\]</p>
            <p>代入 \\(K_{sp}(\\text{AgCl}) = 1.8 \\times 10^{-10}\\)：</p>
            <p class="atomic-eq">\\[s = \\sqrt{1.8 \\times 10^{-10}} = 1.34 \\times 10^{-5}\\ \\text{M}\\]</p>
            <h4>1:2 與 2:1 鹽——CaF₂</h4>
            <p class="atomic-eq">\\[\\text{CaF}_2(s) \\rightleftharpoons \\text{Ca}^{2+} + 2\\text{F}^-\\]</p>
            <p>此時 \\([\\text{Ca}^{2+}] = s\\)，但 \\([\\text{F}^-] = 2s\\)，所以：</p>
            <p class="atomic-eq">\\[K_{sp} = (s)(2s)^2 = 4s^3 \\quad\\Rightarrow\\quad s = \\sqrt[3]{K_{sp}/4}\\]</p>
            <p>代入 \\(K_{sp}(\\text{CaF}_2) = 3.9 \\times 10^{-11}\\)：</p>
            <p class="atomic-eq">\\[s = \\sqrt[3]{3.9 \\times 10^{-11}/4} \\approx 2.14 \\times 10^{-4}\\ \\text{M}\\]</p>
            <h4>一般公式</h4>
            <p>對 \\(\\text{M}_a\\text{X}_b\\)：</p>
            <p class="atomic-eq">\\[K_{sp} = (as)^a(bs)^b \\quad\\Rightarrow\\quad s = \\left(\\frac{K_{sp}}{a^a b^b}\\right)^{1/(a+b)}\\]</p>
            <p class="course-example">Ag₂CrO₄ 也是 \\(K_{sp} = 4s^3\\)。其莫耳溶解度為 \\(s = \\sqrt[3]{1.1 \\times 10^{-12}/4} \\approx 6.5 \\times 10^{-5}\\) M。</p>
          `),
        },
        {
          title: { en: 'From solubility to Ksp', zh: '由溶解度求 Ksp' },
          body: () => L(`
            <p>The direction reverses: write the dissociation, express every ion concentration in terms of \\(s\\), then substitute.</p>
            <h4>Example: PbCl₂</h4>
            <p>The molar solubility of PbCl₂ is \\(1.6 \\times 10^{-2}\\) M.</p>
            <p class="atomic-eq">\\[\\text{PbCl}_2(s) \\rightleftharpoons \\text{Pb}^{2+} + 2\\text{Cl}^-\\]</p>
            <p class="atomic-eq">\\[[\\text{Pb}^{2+}] = s = 1.6 \\times 10^{-2}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[[\\text{Cl}^-] = 2s = 3.2 \\times 10^{-2}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[K_{sp} = (1.6 \\times 10^{-2})(3.2 \\times 10^{-2})^2 = 1.6 \\times 10^{-5}\\]</p>
            <h4>Example: Mg(OH)₂</h4>
            <p>The molar solubility of Mg(OH)₂ is \\(1.4 \\times 10^{-4}\\) M.</p>
            <p class="atomic-eq">\\[\\text{Mg(OH)}_2(s) \\rightleftharpoons \\text{Mg}^{2+} + 2\\text{OH}^-\\]</p>
            <p class="atomic-eq">\\[K_{sp} = (1.4 \\times 10^{-4})(2.8 \\times 10^{-4})^2 = 1.1 \\times 10^{-11}\\]</p>
            <p class="course-example">Always double-check the ion ratio before substituting. The most common error is using \\(s\\) for an ion that should be \\(2s\\) or \\(3s\\).</p>
          `, `
            <p>反過來做：先寫解離方程式，把每個離子濃度用 \\(s\\) 表示，再代入。</p>
            <h4>例：PbCl₂</h4>
            <p>PbCl₂ 的莫耳溶解度為 \\(1.6 \\times 10^{-2}\\) M。</p>
            <p class="atomic-eq">\\[\\text{PbCl}_2(s) \\rightleftharpoons \\text{Pb}^{2+} + 2\\text{Cl}^-\\]</p>
            <p class="atomic-eq">\\[[\\text{Pb}^{2+}] = s = 1.6 \\times 10^{-2}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[[\\text{Cl}^-] = 2s = 3.2 \\times 10^{-2}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[K_{sp} = (1.6 \\times 10^{-2})(3.2 \\times 10^{-2})^2 = 1.6 \\times 10^{-5}\\]</p>
            <h4>例：Mg(OH)₂</h4>
            <p>Mg(OH)₂ 的莫耳溶解度為 \\(1.4 \\times 10^{-4}\\) M。</p>
            <p class="atomic-eq">\\[\\text{Mg(OH)}_2(s) \\rightleftharpoons \\text{Mg}^{2+} + 2\\text{OH}^-\\]</p>
            <p class="atomic-eq">\\[K_{sp} = (1.4 \\times 10^{-4})(2.8 \\times 10^{-4})^2 = 1.1 \\times 10^{-11}\\]</p>
            <p class="course-example">代入前務必確認離子比例。最常見的錯誤，是把應該是 \\(2s\\) 或 \\(3s\\) 的離子寫成 \\(s\\)。</p>
          `),
        },
        {
          title: { en: 'The common ion effect', zh: '同離子效應' },
          body: () => L(`
            <p>Adding an ion that is <strong>already part of the salt</strong> pushes the equilibrium back toward the solid. By Le Chatelier’s principle, the salt becomes <strong>less soluble</strong>.</p>
            ${fig(commonIonSVG(), 'Pure water (left) dissolves far more AgCl than 0.10 M NaCl (right). The extra Cl⁻ suppresses AgCl dissolution.')}
            <h4>AgCl in 0.10 M NaCl</h4>
            <p class="atomic-eq">\\[K_{sp} = [\\text{Ag}^+][\\text{Cl}^-] = 1.8 \\times 10^{-10}\\]</p>
            <p>The NaCl contribution dominates: \\([\\text{Cl}^-] \\approx 0.10\\) M.</p>
            <p class="atomic-eq">\\[[\\text{Ag}^+] = \\frac{1.8 \\times 10^{-10}}{0.10} = 1.8 \\times 10^{-9}\\ \\text{M}\\]</p>
            <p>So the molar solubility is \\(1.8 \\times 10^{-9}\\) M, compared with \\(1.3 \\times 10^{-5}\\) M in pure water — about 7,000 times smaller.</p>
            <h4>CaF₂ in 0.10 M NaF</h4>
            <p class="atomic-eq">\\[3.9 \\times 10^{-11} = s(0.10)^2\\]</p>
            <p class="atomic-eq">\\[s = 3.9 \\times 10^{-9}\\ \\text{M}\\]</p>
            <p class="course-example">The approximation works because the added common ion is present in huge excess compared with what the salt contributes.</p>
          `, `
            <p>加入一個<strong>本來就屬於該鹽</strong>的離子，會把平衡推回固體方向。依勒沙特列原理，鹽會變得<strong>更難溶</strong>。</p>
            ${fig(commonIonSVG(), '純水（左）能溶解的 AgCl 遠多於 0.10 M NaCl（右）。多出的 Cl⁻ 抑制 AgCl 溶解。')}
            <h4>AgCl 在 0.10 M NaCl 中</h4>
            <p class="atomic-eq">\\[K_{sp} = [\\text{Ag}^+][\\text{Cl}^-] = 1.8 \\times 10^{-10}\\]</p>
            <p>NaCl 的貢獻遠大於 AgCl：\\([\\text{Cl}^-] \\approx 0.10\\) M。</p>
            <p class="atomic-eq">\\[[\\text{Ag}^+] = \\frac{1.8 \\times 10^{-10}}{0.10} = 1.8 \\times 10^{-9}\\ \\text{M}\\]</p>
            <p>所以莫耳溶解度為 \\(1.8 \\times 10^{-9}\\) M；純水中則是 \\(1.3 \\times 10^{-5}\\) M，相差約 7,000 倍。</p>
            <h4>CaF₂ 在 0.10 M NaF 中</h4>
            <p class="atomic-eq">\\[3.9 \\times 10^{-11} = s(0.10)^2\\]</p>
            <p class="atomic-eq">\\[s = 3.9 \\times 10^{-9}\\ \\text{M}\\]</p>
            <p class="course-example">這個近似成立，因為加入的同離子量遠大於鹽本身貢獻的量。</p>
          `),
        },
        {
          title: { en: 'Q versus Ksp', zh: 'Q 與 Ksp 的比較' },
          body: () => L(`
            <p>The <strong>ion product</strong>, \\(Q\\), has the same form as Ksp but uses the concentrations that are actually present at that moment.</p>
            ${fig(qkspSVG(), 'Compare Q with Ksp before you declare a precipitate. Only Q > Ksp produces a solid.')}
            ${table(['Condition', 'Meaning'], [
              ['Q &lt; Ksp', 'Unsaturated — no precipitate'],
              ['Q = Ksp', 'Saturated — at the brink of precipitation'],
              ['Q &gt; Ksp', 'Supersaturated — precipitate forms'],
            ])}
            <h4>Mixing AgNO₃ and NaCl</h4>
            <p>Equal volumes of 0.010 M AgNO₃ and 0.010 M NaCl are mixed. Each concentration is halved:</p>
            <p class="atomic-eq">\\[[\\text{Ag}^+] = [\\text{Cl}^-] = 0.0050\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[Q = (0.0050)(0.0050) = 2.5 \\times 10^{-5}\\]</p>
            <p>\\(Q > K_{sp}\\) (1.8 × 10⁻¹⁰), so <strong>AgCl precipitates</strong>.</p>
            <h4>Will CaF₂ precipitate?</h4>
            <p>Mix equal volumes of 0.010 M Ca(NO₃)₂ and 0.020 M NaF:</p>
            <p class="atomic-eq">\\[[\\text{Ca}^{2+}] = 0.0050\\ \\text{M},\\quad [\\text{F}^-] = 0.010\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[Q = (0.0050)(0.010)^2 = 5.0 \\times 10^{-7} > K_{sp}\\]</p>
            <p>So <strong>CaF₂ precipitates</strong> too.</p>
            <p class="course-example">When volumes differ, dilute each ion with \\(M_1V_1 = M_2V_2\\) before calculating Q.</p>
          `, `
            <p><strong>離子積</strong> \\(Q\\) 的形式與 Ksp 相同，但使用<strong>當下實際存在</strong>的濃度。</p>
            ${fig(qkspSVG(), '在下結論前先比較 Q 與 Ksp。只有 Q > Ksp 才會產生固體。')}
            ${table(['條件', '意義'], [
              ['Q &lt; Ksp', '未飽和——不沉澱'],
              ['Q = Ksp', '飽和——處於沉澱邊緣'],
              ['Q &gt; Ksp', '過飽和——形成沉澱'],
            ])}
            <h4>混合 AgNO₃ 與 NaCl</h4>
            <p>等體積的 0.010 M AgNO₃ 與 0.010 M NaCl 混合，各濃度減半：</p>
            <p class="atomic-eq">\\[[\\text{Ag}^+] = [\\text{Cl}^-] = 0.0050\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[Q = (0.0050)(0.0050) = 2.5 \\times 10^{-5}\\]</p>
            <p>\\(Q > K_{sp}\\)（1.8 × 10⁻¹⁰），所以 <strong>AgCl 會沉澱</strong>。</p>
            <h4>CaF₂ 會沉澱嗎？</h4>
            <p>等體積的 0.010 M Ca(NO₃)₂ 與 0.020 M NaF 混合：</p>
            <p class="atomic-eq">\\[[\\text{Ca}^{2+}] = 0.0050\\ \\text{M},\\quad [\\text{F}^-] = 0.010\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[Q = (0.0050)(0.010)^2 = 5.0 \\times 10^{-7} > K_{sp}\\]</p>
            <p>所以 <strong>CaF₂ 也會沉澱</strong>。</p>
            <p class="course-example">體積不同時，先用 \\(M_1V_1 = M_2V_2\\) 稀釋各離子，再計算 Q。</p>
          `),
        },
        {
          title: { en: 'Selective precipitation', zh: '選擇性沉澱' },
          body: () => L(`
            <p>If one added ion can precipitate several different ions, the salt that needs the <strong>lowest added-ion concentration</strong> forms first. For salts of the same formula type, that is usually the one with the <strong>smaller Ksp</strong>.</p>
            ${fig(selectiveSVG(), 'Adding Ag⁺ to a mixture of Cl⁻ and I⁻: AgI appears first because far less Ag⁺ is needed to satisfy its Ksp.')}
            <h4>AgCl versus AgI</h4>
            <p>For equal halide concentrations of 0.10 M:</p>
            <p class="atomic-eq">\\[[\\text{Ag}^+]_{\\text{AgCl}} = \\frac{1.8 \\times 10^{-10}}{0.10} = 1.8 \\times 10^{-9}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[[\\text{Ag}^+]_{\\text{AgI}} = \\frac{8.3 \\times 10^{-17}}{0.10} = 8.3 \\times 10^{-16}\\ \\text{M}\\]</p>
            <p>AgI begins to precipitate at a far lower silver concentration, so it separates first. Adding more Ag⁺ eventually reaches the threshold for AgCl.</p>
            <p class="course-example">Compare the <strong>required ion concentration</strong>, not just the raw Ksp, when the salts have different stoichiometries.</p>
          `, `
            <p>若同一種加入的離子能與多種離子形成沉澱，需要<strong>最低加入離子濃度</strong>的鹽會先沉澱。對同型式的鹽而言，通常就是 <strong>Ksp 較小</strong>的那個。</p>
            ${fig(selectiveSVG(), '向含 Cl⁻ 與 I⁻ 的混合液加入 Ag⁺：AgI 先出現，因為只需極低的 Ag⁺ 就能達到其 Ksp。')}
            <h4>AgCl 與 AgI</h4>
            <p>假設兩種鹵離子濃度皆為 0.10 M：</p>
            <p class="atomic-eq">\\[[\\text{Ag}^+]_{\\text{AgCl}} = \\frac{1.8 \\times 10^{-10}}{0.10} = 1.8 \\times 10^{-9}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[[\\text{Ag}^+]_{\\text{AgI}} = \\frac{8.3 \\times 10^{-17}}{0.10} = 8.3 \\times 10^{-16}\\ \\text{M}\\]</p>
            <p>AgI 在低得多的銀離子濃度就開始沉澱，因此先分離出來。繼續加入 Ag⁺，才會達到 AgCl 的門檻。</p>
            <p class="course-example">當鹽的化學計量不同時，要比<strong>所需離子濃度</strong>，而不是只比 Ksp 的原始數值。</p>
          `),
        },
        {
          title: { en: 'Worked examples', zh: '綜合例題' },
          body: () => L(`
            <h4>A · Molar solubility of Ag₂CrO₄</h4>
            <p>\\(K_{sp} = 1.1 \\times 10^{-12}\\). The salt gives two Ag⁺ for every CrO₄²⁻:</p>
            <p class="atomic-eq">\\[K_{sp} = (2s)^2(s) = 4s^3\\]</p>
            <p class="atomic-eq">\\[s = \\sqrt[3]{1.1 \\times 10^{-12}/4} \\approx 6.5 \\times 10^{-5}\\ \\text{M}\\]</p>
            <h4>B · Ksp from solubility</h4>
            <p>The molar solubility of Mg(OH)₂ is \\(1.4 \\times 10^{-4}\\) M:</p>
            <p class="atomic-eq">\\[K_{sp} = (1.4 \\times 10^{-4})(2.8 \\times 10^{-4})^2 = 1.1 \\times 10^{-11}\\]</p>
            <h4>C · Precipitation decision</h4>
            <p>100.0 mL of 0.0050 M Pb(NO₃)₂ is mixed with 100.0 mL of 0.010 M KCl. After mixing:</p>
            <p class="atomic-eq">\\[[\\text{Pb}^{2+}] = 0.0025\\ \\text{M},\\quad [\\text{Cl}^-] = 0.0050\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[Q = (0.0025)(0.0050)^2 = 6.25 \\times 10^{-8}\\]</p>
            <p>\\(Q < K_{sp}\\) (1.6 × 10⁻⁵), so <strong>no precipitate forms</strong>.</p>
            ${practice(KSP_PRACTICE, 'ksp')}
          `, `
            <h4>A · Ag₂CrO₄ 的莫耳溶解度</h4>
            <p>\\(K_{sp} = 1.1 \\times 10^{-12}\\)。每個 CrO₄²⁻ 伴隨兩個 Ag⁺：</p>
            <p class="atomic-eq">\\[K_{sp} = (2s)^2(s) = 4s^3\\]</p>
            <p class="atomic-eq">\\[s = \\sqrt[3]{1.1 \\times 10^{-12}/4} \\approx 6.5 \\times 10^{-5}\\ \\text{M}\\]</p>
            <h4>B · 由溶解度求 Ksp</h4>
            <p>Mg(OH)₂ 的莫耳溶解度為 \\(1.4 \\times 10^{-4}\\) M：</p>
            <p class="atomic-eq">\\[K_{sp} = (1.4 \\times 10^{-4})(2.8 \\times 10^{-4})^2 = 1.1 \\times 10^{-11}\\]</p>
            <h4>C · 沉澱判斷</h4>
            <p>100.0 mL 的 0.0050 M Pb(NO₃)₂ 與 100.0 mL 的 0.010 M KCl 混合。混合後：</p>
            <p class="atomic-eq">\\[[\\text{Pb}^{2+}] = 0.0025\\ \\text{M},\\quad [\\text{Cl}^-] = 0.0050\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[Q = (0.0025)(0.0050)^2 = 6.25 \\times 10^{-8}\\]</p>
            <p>\\(Q < K_{sp}\\)（1.6 × 10⁻⁵），所以 <strong>不形成沉澱</strong>。</p>
            ${practice(KSP_PRACTICE, 'ksp')}
          `),
        },
        {
          title: { en: 'Quick quiz', zh: '快速測驗' },
          body: () => L(`
            <p>Six checks on the ideas that matter most. A wrong choice gives a hint; a correct choice is saved.</p>
            ${quiz([
              {
                q: ['Why is the solid left out of a Ksp expression?', '為何 Ksp 表示式中不含固體？'],
                options: [['Its concentration is constant', '它的濃度固定'], ['It has no mass', '它沒有質量'], ['It is always soluble', '它永遠可溶'], ['It reacts completely', '它完全反應']],
                answer: 0,
                hint: ['A pure solid has a fixed concentration, so it is folded into the constant.', '純固體的濃度固定，因此被併入常數中。'],
                explain: ['The activity of a pure solid is taken as 1, so it does not appear in Ksp.', '純固體的活性視為 1，所以不出現在 Ksp 中。'],
              },
              {
                q: ['For a salt MX₂, which relationship between Ksp and molar solubility <em>s</em> is correct?', '對 MX₂ 鹽而言，Ksp 與莫耳溶解度 <em>s</em> 的關係何者正確？'],
                options: [['Ksp = s²', 'Ksp = s²'], ['Ksp = 2s³', 'Ksp = 2s³'], ['Ksp = 4s³', 'Ksp = 4s³'], ['Ksp = s³', 'Ksp = s³']],
                answer: 2,
                hint: ['[M²⁺] = s and [X⁻] = 2s. Substitute and square the 2.', '[M²⁺] = s、[X⁻] = 2s。代入後把 2 平方。'],
                explain: ['Ksp = (s)(2s)² = 4s³.', 'Ksp = (s)(2s)² = 4s³。'],
              },
              {
                q: ['Adding NaCl to a saturated AgCl solution does what?', '向飽和 AgCl 溶液加入 NaCl 會如何？'],
                options: [['Increases AgCl solubility', '增加 AgCl 溶解度'], ['Decreases AgCl solubility', '降低 AgCl 溶解度'], ['Has no effect', '沒有影響'], ['Dissolves all the solid', '溶解所有固體']],
                answer: 1,
                hint: ['Cl⁻ is a common ion; Le Chatelier pushes the equilibrium toward solid.', 'Cl⁻ 是同離子；勒沙特列會把平衡推向固體。'],
                explain: ['The added Cl⁻ shifts AgCl(s) ⇌ Ag⁺ + Cl⁻ to the left, so solubility falls.', '加入的 Cl⁻ 使 AgCl(s) ⇌ Ag⁺ + Cl⁻ 左移，因此溶解度下降。'],
              },
              {
                q: ['A mixture has <strong>Q &gt; Ksp</strong>. What happens?', '某混合液 <strong>Q &gt; Ksp</strong>，會發生什麼？'],
                options: [['No precipitate forms', '不形成沉澱'], ['The solution is unsaturated', '溶液未飽和'], ['A precipitate forms', '形成沉澱'], ['Ksp changes', 'Ksp 會改變']],
                answer: 2,
                hint: ['Q above the equilibrium value means there are too many ions in solution.', 'Q 高於平衡值，表示溶液中的離子過多。'],
                explain: ['The excess ions leave solution as solid until Q falls back to Ksp.', '過多離子會以固體析出，直到 Q 回到 Ksp。'],
              },
              {
                q: ['The molar solubility of Mg(OH)₂ is <strong>1.4 × 10⁻⁴ M</strong>. What is Ksp?', 'Mg(OH)₂ 的莫耳溶解度為 <strong>1.4 × 10⁻⁴ M</strong>，Ksp 是多少？'],
                options: [['1.1 × 10⁻¹¹', '1.1 × 10⁻¹¹'], ['2.0 × 10⁻⁸', '2.0 × 10⁻⁸'], ['3.9 × 10⁻¹²', '3.9 × 10⁻¹²'], ['1.4 × 10⁻¹¹', '1.4 × 10⁻¹¹']],
                answer: 0,
                hint: ['[Mg²⁺] = s and [OH⁻] = 2s; use Ksp = 4s³.', '[Mg²⁺] = s、[OH⁻] = 2s；用 Ksp = 4s³。'],
                explain: ['Ksp = 4(1.4 × 10⁻⁴)³ = 1.1 × 10⁻¹¹.', 'Ksp = 4(1.4 × 10⁻⁴)³ = 1.1 × 10⁻¹¹。'],
              },
              {
                q: ['Ag⁺ is added slowly to equal concentrations of Cl⁻ and I⁻. Which salt precipitates first?', '向等濃度的 Cl⁻ 與 I⁻ 緩慢加入 Ag⁺，哪種鹽先沉澱？'],
                options: [['AgCl, because its Ksp is larger', 'AgCl，因為它的 Ksp 較大'], ['AgI, because it needs less Ag⁺', 'AgI，因為它需要的 Ag⁺ 較少'], ['Both at exactly the same time', '兩者完全同時'], ['Neither can precipitate', '兩者都不會沉澱']],
                answer: 1,
                hint: ['Compare the [Ag⁺] required: Ksp divided by the halide concentration.', '比較所需的 [Ag⁺]：Ksp 除以鹵離子濃度。'],
                explain: ['AgI reaches its much smaller Ksp at a far lower [Ag⁺], so it precipitates first.', 'AgI 在低得多的 [Ag⁺] 就達到其小得多的 Ksp，所以先沉澱。'],
              },
            ], 'ksp')}
          `, `
            <p>六題檢查最重要的觀念。答錯會給提示；答對會自動保存。</p>
            ${quiz([
              {
                q: ['為何 Ksp 表示式中不含固體？', '為何 Ksp 表示式中不含固體？'],
                options: [['它的濃度固定', '它的濃度固定'], ['它沒有質量', '它沒有質量'], ['它永遠可溶', '它永遠可溶'], ['它完全反應', '它完全反應']],
                answer: 0,
                hint: ['純固體的濃度固定，因此被併入常數中。', '純固體的濃度固定，因此被併入常數中。'],
                explain: ['純固體的活性視為 1，所以不出現在 Ksp 中。', '純固體的活性視為 1，所以不出現在 Ksp 中。'],
              },
              {
                q: ['對 MX₂ 鹽而言，Ksp 與莫耳溶解度 <em>s</em> 的關係何者正確？', '對 MX₂ 鹽而言，Ksp 與莫耳溶解度 <em>s</em> 的關係何者正確？'],
                options: [['Ksp = s²', 'Ksp = s²'], ['Ksp = 2s³', 'Ksp = 2s³'], ['Ksp = 4s³', 'Ksp = 4s³'], ['Ksp = s³', 'Ksp = s³']],
                answer: 2,
                hint: ['[M²⁺] = s、[X⁻] = 2s。代入後把 2 平方。', '[M²⁺] = s、[X⁻] = 2s。代入後把 2 平方。'],
                explain: ['Ksp = (s)(2s)² = 4s³。', 'Ksp = (s)(2s)² = 4s³。'],
              },
              {
                q: ['向飽和 AgCl 溶液加入 NaCl 會如何？', '向飽和 AgCl 溶液加入 NaCl 會如何？'],
                options: [['增加 AgCl 溶解度', '增加 AgCl 溶解度'], ['降低 AgCl 溶解度', '降低 AgCl 溶解度'], ['沒有影響', '沒有影響'], ['溶解所有固體', '溶解所有固體']],
                answer: 1,
                hint: ['Cl⁻ 是同離子；勒沙特列會把平衡推向固體。', 'Cl⁻ 是同離子；勒沙特列會把平衡推向固體。'],
                explain: ['加入的 Cl⁻ 使 AgCl(s) ⇌ Ag⁺ + Cl⁻ 左移，因此溶解度下降。', '加入的 Cl⁻ 使 AgCl(s) ⇌ Ag⁺ + Cl⁻ 左移，因此溶解度下降。'],
              },
              {
                q: ['某混合液 <strong>Q &gt; Ksp</strong>，會發生什麼？', '某混合液 <strong>Q &gt; Ksp</strong>，會發生什麼？'],
                options: [['不形成沉澱', '不形成沉澱'], ['溶液未飽和', '溶液未飽和'], ['形成沉澱', '形成沉澱'], ['Ksp 會改變', 'Ksp 會改變']],
                answer: 2,
                hint: ['Q 高於平衡值，表示溶液中的離子過多。', 'Q 高於平衡值，表示溶液中的離子過多。'],
                explain: ['過多離子會以固體析出，直到 Q 回到 Ksp。', '過多離子會以固體析出，直到 Q 回到 Ksp。'],
              },
              {
                q: ['Mg(OH)₂ 的莫耳溶解度為 <strong>1.4 × 10⁻⁴ M</strong>，Ksp 是多少？', 'Mg(OH)₂ 的莫耳溶解度為 <strong>1.4 × 10⁻⁴ M</strong>，Ksp 是多少？'],
                options: [['1.1 × 10⁻¹¹', '1.1 × 10⁻¹¹'], ['2.0 × 10⁻⁸', '2.0 × 10⁻⁸'], ['3.9 × 10⁻¹²', '3.9 × 10⁻¹²'], ['1.4 × 10⁻¹¹', '1.4 × 10⁻¹¹']],
                answer: 0,
                hint: ['[Mg²⁺] = s、[OH⁻] = 2s；用 Ksp = 4s³。', '[Mg²⁺] = s、[OH⁻] = 2s；用 Ksp = 4s³。'],
                explain: ['Ksp = 4(1.4 × 10⁻⁴)³ = 1.1 × 10⁻¹¹。', 'Ksp = 4(1.4 × 10⁻⁴)³ = 1.1 × 10⁻¹¹。'],
              },
              {
                q: ['向等濃度的 Cl⁻ 與 I⁻ 緩慢加入 Ag⁺，哪種鹽先沉澱？', '向等濃度的 Cl⁻ 與 I⁻ 緩慢加入 Ag⁺，哪種鹽先沉澱？'],
                options: [['AgCl，因為它的 Ksp 較大', 'AgCl，因為它的 Ksp 較大'], ['AgI，因為它需要的 Ag⁺ 較少', 'AgI，因為它需要的 Ag⁺ 較少'], ['兩者完全同時', '兩者完全同時'], ['兩者都不會沉澱', '兩者都不會沉澱']],
                answer: 1,
                hint: ['比較所需的 [Ag⁺]：Ksp 除以鹵離子濃度。', '比較所需的 [Ag⁺]：Ksp 除以鹵離子濃度。'],
                explain: ['AgI 在低得多的 [Ag⁺] 就達到其小得多的 Ksp，所以先沉澱。', 'AgI 在低得多的 [Ag⁺] 就達到其小得多的 Ksp，所以先沉澱。'],
              },
            ], 'ksp')}
          `),
        },
        {
          title: { en: 'Beginner checklist', zh: '初學者檢查表' },
          body: () => L(`
            <ul class="course-checklist">
              <li>Ksp expressions <strong>exclude the solid</strong>; exponents equal dissociation coefficients.</li>
              <li>For 1:1 salts, \\(s = \\sqrt{K_{sp}}\\).</li>
              <li>For 1:2 or 2:1 salts, \\(K_{sp} = 4s^3\\) and \\(s = \\sqrt[3]{K_{sp}/4}\\).</li>
              <li>A <strong>common ion decreases solubility</strong> (Le Chatelier).</li>
              <li>Compare <strong>Q</strong> with <strong>Ksp</strong>: Q &gt; Ksp means precipitate; Q &lt; Ksp means none.</li>
              <li>When equal volumes are mixed, concentrations are <strong>halved</strong>; otherwise use \\(M_1V_1 = M_2V_2\\).</li>
              <li>A <strong>smaller Ksp</strong> usually means precipitation begins at a lower added-ion concentration.</li>
              <li>Ksp depends on <strong>temperature</strong>; solubility also depends on pH if the anion is basic.</li>
            </ul>
          `, `
            <ul class="course-checklist">
              <li>Ksp 表示式<strong>不含固體</strong>；指數等於解離係數。</li>
              <li>1:1 鹽：\\(s = \\sqrt{K_{sp}}\\)。</li>
              <li>1:2 或 2:1 鹽：\\(K_{sp} = 4s^3\\)，\\(s = \\sqrt[3]{K_{sp}/4}\\)。</li>
              <li><strong>同離子會降低溶解度</strong>（勒沙特列）。</li>
              <li>比較 <strong>Q</strong> 與 <strong>Ksp</strong>：Q &gt; Ksp 會沉澱；Q &lt; Ksp 不會。</li>
              <li>等體積混合時濃度<strong>減半</strong>；否則使用 \\(M_1V_1 = M_2V_2\\)。</li>
              <li><strong>Ksp 越小</strong>通常表示在較低的加入離子濃度就開始沉澱。</li>
              <li>Ksp 取決於<strong>溫度</strong>；若陰離子具鹼性，溶解度也受 pH 影響。</li>
            </ul>
          `),
        },
      ],
    },
    {
      id: 'acids-bases',
      rootId: 'course-body-acids-bases',
      title: { en: 'Acids, Bases, and pH', zh: '酸、鹼與 pH' },
      sections: [
        {
          title: { en: 'Three definitions and conjugates', zh: '三種定義與共軛酸鹼' },
          body: () => L(`
            <p>Three definitions frame the same behaviour from different angles:</p>
            ${table(['Definition', 'Acid', 'Base'], [
              ['Arrhenius', 'Produces H⁺ in water', 'Produces OH⁻ in water'],
              ['Brønsted–Lowry', 'Proton (H⁺) donor', 'Proton (H⁺) acceptor'],
              ['Lewis', 'Electron-pair acceptor', 'Electron-pair donor'],
            ], true)}
            <p>For introductory chemistry, <strong>Brønsted–Lowry</strong> is the most useful: it covers acids that do not contain OH and bases that do not contain OH⁻.</p>
            <h4>Conjugate acid–base pairs</h4>
            <p class="atomic-eq">\\[\\text{HA} + \\text{H}_2\\text{O} \\rightleftharpoons \\text{H}_3\\text{O}^+ + \\text{A}^-\\]</p>
            <ul>
              <li>HA / A⁻ is a conjugate pair: HA donates a proton, A⁻ is what remains.</li>
              <li>H₂O / H₃O⁺ is the other pair: water accepts a proton and becomes hydronium.</li>
              <li><strong>Stronger acid → weaker conjugate base.</strong> The reverse is also true.</li>
            </ul>
            <p class="course-example">A base does not have to be hydroxide. Ammonia, NH₃, accepts H⁺ to become NH₄⁺ — a classic Brønsted–Lowry base.</p>
          `, `
            <p>三種定義從不同角度描述同一件事：</p>
            ${table(['定義', '酸', '鹼'], [
              ['阿瑞尼斯', '在水中產生 H⁺', '在水中產生 OH⁻'],
              ['布忍斯特－羅瑞', '質子（H⁺）提供者', '質子（H⁺）接受者'],
              ['路易斯', '電子對接受者', '電子對提供者'],
            ], true)}
            <p>入門化學最常用<strong>布忍斯特－羅瑞</strong>定義：它能涵蓋不含 OH 的酸，也能涵蓋不含 OH⁻ 的鹼。</p>
            <h4>共軛酸鹼對</h4>
            <p class="atomic-eq">\\[\\text{HA} + \\text{H}_2\\text{O} \\rightleftharpoons \\text{H}_3\\text{O}^+ + \\text{A}^-\\]</p>
            <ul>
              <li>HA / A⁻ 是共軛對：HA 給出質子，A⁻ 是剩下的部分。</li>
              <li>H₂O / H₃O⁺ 是另一對：水接受質子後成為水合氫離子。</li>
              <li><strong>酸越強，其共軛鹼越弱。</strong>反之亦然。</li>
            </ul>
            <p class="course-example">鹼不一定含有氫氧根。氨 NH₃ 接受 H⁺ 成為 NH₄⁺，就是典型的布忍斯特－羅瑞鹼。</p>
          `),
        },
        {
          title: { en: 'Strong vs weak acids and bases', zh: '強酸、弱酸與 Ka' },
          body: () => L(`
            <p>The difference is not “concentrated versus dilute”; it is <strong>how completely the substance ionizes</strong>.</p>
            <h4>Strong acids (memorize)</h4>
            <ul>
              <li>HCl, HBr, HI</li>
              <li>HNO₃, HClO₄</li>
              <li>H₂SO₄ — the first proton is strong; the second is weak</li>
            </ul>
            <h4>Strong bases (memorize)</h4>
            <ul>
              <li>Group 1 hydroxides: LiOH, NaOH, KOH, RbOH, CsOH</li>
              <li>Soluble group 2 hydroxides: Ca(OH)₂, Sr(OH)₂, Ba(OH)₂</li>
            </ul>
            <p>Strong acids and bases dissociate <strong>completely</strong>. Weak ones reach equilibrium and only partially ionize.</p>
            <p class="atomic-eq">\\[\\text{HA} \\rightleftharpoons \\text{H}^+ + \\text{A}^- \\qquad K_a = \\frac{[\\text{H}^+][\\text{A}^-]}{[\\text{HA}]}\\]</p>
            <p class="atomic-eq">\\[\\text{B} + \\text{H}_2\\text{O} \\rightleftharpoons \\text{BH}^+ + \\text{OH}^- \\qquad K_b = \\frac{[\\text{BH}^+][\\text{OH}^-]}{[\\text{B}]}\\]</p>
            <p><strong>Larger Ka → stronger weak acid. Larger Kb → stronger weak base.</strong></p>
            <p class="atomic-eq">\\[pK_a = -\\log K_a \\qquad pK_b = -\\log K_b\\]</p>
            <p>A <strong>smaller pKa</strong> means a stronger acid.</p>
            ${table(['Weak acid', 'Ka', 'pKa'], [
              ['HF', '6.8 × 10⁻⁴', '3.17'],
              ['HCOOH (formic)', '1.8 × 10⁻⁴', '3.74'],
              ['CH₃COOH (acetic)', '1.8 × 10⁻⁵', '4.74'],
              ['HCN', '6.2 × 10⁻¹⁰', '9.21'],
            ])}
            <p class="course-example">“Weak” does not mean harmless: concentrated weak acids can still be corrosive, and pH depends on both Ka and concentration.</p>
          `, `
            <p>差別不在「濃或稀」，而在<strong>物質解離的完全程度</strong>。</p>
            <h4>強酸（要記住）</h4>
            <ul>
              <li>HCl、HBr、HI</li>
              <li>HNO₃、HClO₄</li>
              <li>H₂SO₄——第一個質子為強酸，第二個為弱酸</li>
            </ul>
            <h4>強鹼（要記住）</h4>
            <ul>
              <li>第 1 族氫氧化物：LiOH、NaOH、KOH、RbOH、CsOH</li>
              <li>可溶的第 2 族氫氧化物：Ca(OH)₂、Sr(OH)₂、Ba(OH)₂</li>
            </ul>
            <p>強酸與強鹼<strong>完全解離</strong>；弱酸與弱鹼則達到平衡，只部分解離。</p>
            <p class="atomic-eq">\\[\\text{HA} \\rightleftharpoons \\text{H}^+ + \\text{A}^- \\qquad K_a = \\frac{[\\text{H}^+][\\text{A}^-]}{[\\text{HA}]}\\]</p>
            <p class="atomic-eq">\\[\\text{B} + \\text{H}_2\\text{O} \\rightleftharpoons \\text{BH}^+ + \\text{OH}^- \\qquad K_b = \\frac{[\\text{BH}^+][\\text{OH}^-]}{[\\text{B}]}\\]</p>
            <p><strong>Ka 越大 → 弱酸越強。Kb 越大 → 弱鹼越強。</strong></p>
            <p class="atomic-eq">\\[pK_a = -\\log K_a \\qquad pK_b = -\\log K_b\\]</p>
            <p><strong>pKa 越小</strong>表示酸越強。</p>
            ${table(['弱酸', 'Ka', 'pKa'], [
              ['HF', '6.8 × 10⁻⁴', '3.17'],
              ['HCOOH（甲酸）', '1.8 × 10⁻⁴', '3.74'],
              ['CH₃COOH（醋酸）', '1.8 × 10⁻⁵', '4.74'],
              ['HCN', '6.2 × 10⁻¹⁰', '9.21'],
            ])}
            <p class="course-example">「弱」不等於無害：濃的弱酸仍可能腐蝕，而 pH 同時取決於 Ka 與濃度。</p>
          `),
        },
        {
          title: { en: 'Water, Kw, and the pH scale', zh: '水的自偶離子、Kw 與 pH' },
          body: () => L(`
            <p>Water reacts with itself in a tiny but important equilibrium:</p>
            <p class="atomic-eq">\\[2\\text{H}_2\\text{O} \\rightleftharpoons \\text{H}_3\\text{O}^+ + \\text{OH}^-\\]</p>
            <p>At 25 °C:</p>
            <p class="atomic-eq">\\[K_w = [\\text{H}^+][\\text{OH}^-] = 1.0 \\times 10^{-14}\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = -\\log[\\text{H}^+] \\qquad \\text{pOH} = -\\log[\\text{OH}^-]\\]</p>
            <p class="atomic-eq">\\[\\text{pH} + \\text{pOH} = 14.00 \\quad (25\\ ^\\circ\\text{C})\\]</p>
            ${phLabMarkup()}
            <p class="course-example">The pH scale is logarithmic. pH 3 is ten times more acidic than pH 4, and one hundred times more acidic than pH 5.</p>
            ${table(['Solution', 'pH', 'Ion comparison'], [
              ['Acidic', '&lt; 7', '[H⁺] &gt; [OH⁻]'],
              ['Neutral', '= 7', '[H⁺] = [OH⁻]'],
              ['Basic', '&gt; 7', '[H⁺] &lt; [OH⁻]'],
            ])}
          `, `
            <p>水本身會進行一個微弱但重要的平衡：</p>
            <p class="atomic-eq">\\[2\\text{H}_2\\text{O} \\rightleftharpoons \\text{H}_3\\text{O}^+ + \\text{OH}^-\\]</p>
            <p>在 25 °C 下：</p>
            <p class="atomic-eq">\\[K_w = [\\text{H}^+][\\text{OH}^-] = 1.0 \\times 10^{-14}\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = -\\log[\\text{H}^+] \\qquad \\text{pOH} = -\\log[\\text{OH}^-]\\]</p>
            <p class="atomic-eq">\\[\\text{pH} + \\text{pOH} = 14.00 \\quad (25\\ ^\\circ\\text{C})\\]</p>
            ${phLabMarkup()}
            <p class="course-example">pH 是對數尺度。pH 3 比 pH 4 酸十倍，比 pH 5 酸一百倍。</p>
            ${table(['溶液', 'pH', '離子比較'], [
              ['酸性', '&lt; 7', '[H⁺] &gt; [OH⁻]'],
              ['中性', '= 7', '[H⁺] = [OH⁻]'],
              ['鹼性', '&gt; 7', '[H⁺] &lt; [OH⁻]'],
            ])}
          `),
        },
        {
          title: { en: 'pH of strong acids and bases', zh: '強酸與強鹼的 pH' },
          body: () => L(`
            <p>Because strong acids ionize completely, the hydrogen ion concentration equals the acid concentration — for a monoprotic acid.</p>
            <h4>Strong acid: 0.010 M HCl</h4>
            <p class="atomic-eq">\\[[\\text{H}^+] = 0.010\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = -\\log(0.010) = 2.00\\]</p>
            <h4>Strong base: 0.020 M NaOH</h4>
            <p class="atomic-eq">\\[[\\text{OH}^-] = 0.020\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[\\text{pOH} = -\\log(0.020) = 1.70\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = 14.00 - 1.70 = 12.30\\]</p>
            <h4>Count the hydroxides: 0.010 M Ba(OH)₂</h4>
            <p>Each formula unit gives two OH⁻:</p>
            <p class="atomic-eq">\\[[\\text{OH}^-] = 2(0.010) = 0.020\\ \\text{M}\\]</p>
            <p>So the pOH is 1.70 and the pH is 12.30 — the same as 0.020 M NaOH.</p>
            ${table(['Solution', '[H⁺] or [OH⁻]', 'pH'], [
              ['0.010 M HCl', '[H⁺] = 0.010 M', '2.00'],
              ['0.020 M NaOH', '[OH⁻] = 0.020 M', '12.30'],
              ['0.010 M Ba(OH)₂', '[OH⁻] = 0.020 M', '12.30'],
            ])}
            <p class="course-example">For H₂SO₄, only the first proton is treated as strong in this course; the second ionization is weak.</p>
          `, `
            <p>強酸完全解離，所以對單質子酸而言，氫離子濃度等於酸的濃度。</p>
            <h4>強酸：0.010 M HCl</h4>
            <p class="atomic-eq">\\[[\\text{H}^+] = 0.010\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = -\\log(0.010) = 2.00\\]</p>
            <h4>強鹼：0.020 M NaOH</h4>
            <p class="atomic-eq">\\[[\\text{OH}^-] = 0.020\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[\\text{pOH} = -\\log(0.020) = 1.70\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = 14.00 - 1.70 = 12.30\\]</p>
            <h4>數氫氧根：0.010 M Ba(OH)₂</h4>
            <p>每個化學式單位給出兩個 OH⁻：</p>
            <p class="atomic-eq">\\[[\\text{OH}^-] = 2(0.010) = 0.020\\ \\text{M}\\]</p>
            <p>所以 pOH 為 1.70，pH 為 12.30——與 0.020 M NaOH 相同。</p>
            ${table(['溶液', '[H⁺] 或 [OH⁻]', 'pH'], [
              ['0.010 M HCl', '[H⁺] = 0.010 M', '2.00'],
              ['0.020 M NaOH', '[OH⁻] = 0.020 M', '12.30'],
              ['0.010 M Ba(OH)₂', '[OH⁻] = 0.020 M', '12.30'],
            ])}
            <p class="course-example">本課程把 H₂SO₄ 的第一個質子視為強酸，第二個解離則視為弱酸。</p>
          `),
        },
        {
          title: { en: 'Weak acids: ICE and the 5% rule', zh: '弱酸：ICE 表與 5% 規則' },
          body: () => L(`
            <p>For a weak acid HA with initial concentration \\(C\\):</p>
            ${table(['', 'HA', 'H⁺', 'A⁻'], [
              ['Initial', 'C', '0', '0'],
              ['Change', '−x', '+x', '+x'],
              ['Equilibrium', 'C − x', 'x', 'x'],
            ])}
            <p class="atomic-eq">\\[K_a = \\frac{x^2}{C - x}\\]</p>
            <p>If \\(x\\) is small compared with \\(C\\), the <strong>5% rule</strong> lets us approximate \\(C - x \\approx C\\):</p>
            <p class="atomic-eq">\\[K_a \\approx \\frac{x^2}{C} \\quad\\Rightarrow\\quad x = \\sqrt{K_a C}\\]</p>
            <h4>Example: 0.10 M acetic acid, Ka = 1.8 × 10⁻⁵</h4>
            <p class="atomic-eq">\\[x = \\sqrt{(1.8 \\times 10^{-5})(0.10)} = 1.34 \\times 10^{-3}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[\\text{Check: } \\frac{1.34 \\times 10^{-3}}{0.10} = 1.34\\% < 5\\%\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = -\\log(1.34 \\times 10^{-3}) = 2.87\\]</p>
            <h4>Percent ionization</h4>
            <p class="atomic-eq">\\[\\%\\ \\text{ionization} = \\frac{x}{C} \\times 100\\%\\]</p>
            <p>For this example it is <strong>1.34%</strong>. Weak acids ionize <strong>more</strong> when diluted, even though the pH rises toward 7.</p>
            <p class="course-example">If the 5% check fails, do not use the shortcut: solve the quadratic or use successive approximations.</p>
          `, `
            <p>對初始濃度為 \\(C\\) 的弱酸 HA：</p>
            ${table(['', 'HA', 'H⁺', 'A⁻'], [
              ['初始', 'C', '0', '0'],
              ['變化', '−x', '+x', '+x'],
              ['平衡', 'C − x', 'x', 'x'],
            ])}
            <p class="atomic-eq">\\[K_a = \\frac{x^2}{C - x}\\]</p>
            <p>若 \\(x\\) 相對 \\(C\\) 很小，<strong>5% 規則</strong>允許近似 \\(C - x \\approx C\\)：</p>
            <p class="atomic-eq">\\[K_a \\approx \\frac{x^2}{C} \\quad\\Rightarrow\\quad x = \\sqrt{K_a C}\\]</p>
            <h4>例：0.10 M 醋酸，Ka = 1.8 × 10⁻⁵</h4>
            <p class="atomic-eq">\\[x = \\sqrt{(1.8 \\times 10^{-5})(0.10)} = 1.34 \\times 10^{-3}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[\\text{檢查：} \\frac{1.34 \\times 10^{-3}}{0.10} = 1.34\\% < 5\\%\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = -\\log(1.34 \\times 10^{-3}) = 2.87\\]</p>
            <h4>游離百分率</h4>
            <p class="atomic-eq">\\[\\text{游離百分率} = \\frac{x}{C} \\times 100\\%\\]</p>
            <p>本例為 <strong>1.34%</strong>。弱酸<strong>稀釋時游離程度反而增加</strong>，即使 pH 會往 7 靠近。</p>
            <p class="course-example">若 5% 檢查不通過，就不要用捷徑：解二次式或使用逐次近似。</p>
          `),
        },
        {
          title: { en: 'Weak bases and Ka · Kb = Kw', zh: '弱鹼與 Ka · Kb = Kw' },
          body: () => L(`
            <p>A weak base B accepts a proton from water, producing its conjugate acid and OH⁻:</p>
            <p class="atomic-eq">\\[\\text{B} + \\text{H}_2\\text{O} \\rightleftharpoons \\text{BH}^+ + \\text{OH}^-\\]</p>
            <p class="atomic-eq">\\[K_b = \\frac{x^2}{C - x} \\approx \\frac{x^2}{C} \\quad\\Rightarrow\\quad x = [\\text{OH}^-] = \\sqrt{K_b C}\\]</p>
            <h4>Example: 0.10 M NH₃, Kb = 1.8 × 10⁻⁵</h4>
            <p class="atomic-eq">\\[x = \\sqrt{(1.8 \\times 10^{-5})(0.10)} = 1.34 \\times 10^{-3}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[\\text{pOH} = -\\log(1.34 \\times 10^{-3}) = 2.87\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = 14.00 - 2.87 = 11.13\\]</p>
            <h4>Conjugate pairs are linked</h4>
            <p>For a conjugate acid–base pair at 25 °C:</p>
            <p class="atomic-eq">\\[K_a \\times K_b = K_w = 1.0 \\times 10^{-14}\\]</p>
            <p class="atomic-eq">\\[pK_a + pK_b = 14.00\\]</p>
            ${table(['Base', 'Conjugate acid', 'Kb', 'Ka of conjugate acid'], [
              ['NH₃', 'NH₄⁺', '1.8 × 10⁻⁵', '5.6 × 10⁻¹⁰'],
              ['CH₃COO⁻', 'CH₃COOH', '5.6 × 10⁻¹⁰', '1.8 × 10⁻⁵'],
              ['F⁻', 'HF', '1.5 × 10⁻¹¹', '6.8 × 10⁻⁴'],
            ], true)}
            <p class="course-example">If an acid is stronger, its conjugate base is weaker — exactly what Ka × Kb = Kw requires.</p>
          `, `
            <p>弱鹼 B 從水中接受質子，生成共軛酸與 OH⁻：</p>
            <p class="atomic-eq">\\[\\text{B} + \\text{H}_2\\text{O} \\rightleftharpoons \\text{BH}^+ + \\text{OH}^-\\]</p>
            <p class="atomic-eq">\\[K_b = \\frac{x^2}{C - x} \\approx \\frac{x^2}{C} \\quad\\Rightarrow\\quad x = [\\text{OH}^-] = \\sqrt{K_b C}\\]</p>
            <h4>例：0.10 M NH₃，Kb = 1.8 × 10⁻⁵</h4>
            <p class="atomic-eq">\\[x = \\sqrt{(1.8 \\times 10^{-5})(0.10)} = 1.34 \\times 10^{-3}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[\\text{pOH} = -\\log(1.34 \\times 10^{-3}) = 2.87\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = 14.00 - 2.87 = 11.13\\]</p>
            <h4>共軛對彼此相連</h4>
            <p>在 25 °C 下，共軛酸鹼對滿足：</p>
            <p class="atomic-eq">\\[K_a \\times K_b = K_w = 1.0 \\times 10^{-14}\\]</p>
            <p class="atomic-eq">\\[pK_a + pK_b = 14.00\\]</p>
            ${table(['鹼', '共軛酸', 'Kb', '共軛酸的 Ka'], [
              ['NH₃', 'NH₄⁺', '1.8 × 10⁻⁵', '5.6 × 10⁻¹⁰'],
              ['CH₃COO⁻', 'CH₃COOH', '5.6 × 10⁻¹⁰', '1.8 × 10⁻⁵'],
              ['F⁻', 'HF', '1.5 × 10⁻¹¹', '6.8 × 10⁻⁴'],
            ], true)}
            <p class="course-example">酸越強，其共軛鹼就越弱——這正是 Ka × Kb = Kw 所要求的。</p>
          `),
        },
        {
          title: { en: 'Buffers and Henderson–Hasselbalch', zh: '緩衝液與 Henderson–Hasselbalch' },
          body: () => L(`
            <p>A <strong>buffer</strong> resists large pH changes when a small amount of acid or base is added. It contains either:</p>
            <ul>
              <li>a <strong>weak acid and its conjugate base</strong> — for example CH₃COOH / CH₃COO⁻, or</li>
              <li>a <strong>weak base and its conjugate acid</strong> — for example NH₃ / NH₄⁺.</li>
            </ul>
            ${fig(bufferActionSVG(), 'Added H⁺ is consumed by A⁻; added OH⁻ is consumed by HA. The pH barely moves while both members remain.')}
            <h4>How the buffer works</h4>
            <ul>
              <li>Added H⁺: \\(\\text{A}^- + \\text{H}^+ \\rightarrow \\text{HA}\\)</li>
              <li>Added OH⁻: \\(\\text{HA} + \\text{OH}^- \\rightarrow \\text{A}^- + \\text{H}_2\\text{O}\\)</li>
            </ul>
            <p class="atomic-eq">\\[\\text{pH} = pK_a + \\log\\frac{[\\text{A}^-]}{[\\text{HA}]}\\]</p>
            <h4>Example: 0.10 M acetic acid + 0.10 M sodium acetate</h4>
            <p class="atomic-eq">\\[\\text{pH} = 4.74 + \\log\\frac{0.10}{0.10} = 4.74\\]</p>
            <p>When \\([\\text{HA}] = [\\text{A}^-]\\), the pH equals the pKa. With 0.20 M acetate and 0.10 M acid:</p>
            <p class="atomic-eq">\\[\\text{pH} = 4.74 + \\log 2 = 5.04\\]</p>
            <p>A buffer works best when the pH is within about <strong>±1 of pKa</strong> and the ratio \\([\\text{A}^-]/[\\text{HA}]\\) lies between about <strong>0.1 and 10</strong>. Buffers have a finite capacity.</p>
            <p class="course-example">For a base buffer, invert the equation: \\(\\text{pOH} = pK_b + \\log([\\text{BH}^+]/[\\text{B}])\\).</p>
          `, `
            <p><strong>緩衝液</strong>能在加入少量酸或鹼時抵抗大幅 pH 變化。它含有：</p>
            <ul>
              <li><strong>弱酸與其共軛鹼</strong>——例如 CH₃COOH / CH₃COO⁻，或</li>
              <li><strong>弱鹼與其共軛酸</strong>——例如 NH₃ / NH₄⁺。</li>
            </ul>
            ${fig(bufferActionSVG(), '加入的 H⁺ 被 A⁻ 消耗；加入的 OH⁻ 被 HA 消耗。只要兩者都還在，pH 幾乎不動。')}
            <h4>緩衝液如何運作</h4>
            <ul>
              <li>加入 H⁺：\\(\\text{A}^- + \\text{H}^+ \\rightarrow \\text{HA}\\)</li>
              <li>加入 OH⁻：\\(\\text{HA} + \\text{OH}^- \\rightarrow \\text{A}^- + \\text{H}_2\\text{O}\\)</li>
            </ul>
            <p class="atomic-eq">\\[\\text{pH} = pK_a + \\log\\frac{[\\text{A}^-]}{[\\text{HA}]}\\]</p>
            <h4>例：0.10 M 醋酸 + 0.10 M 醋酸鈉</h4>
            <p class="atomic-eq">\\[\\text{pH} = 4.74 + \\log\\frac{0.10}{0.10} = 4.74\\]</p>
            <p>當 \\([\\text{HA}] = [\\text{A}^-]\\) 時，pH 等於 pKa。若醋酸根為 0.20 M、酸為 0.10 M：</p>
            <p class="atomic-eq">\\[\\text{pH} = 4.74 + \\log 2 = 5.04\\]</p>
            <p>緩衝液在 pH 約在 <strong>pKa ±1</strong> 之內、且 \\([\\text{A}^-]/[\\text{HA}]\\) 約在 <strong>0.1 到 10</strong> 之間時效果最好。緩衝能力有限。</p>
            <p class="course-example">鹼性緩衝液則改用：\\(\\text{pOH} = pK_b + \\log([\\text{BH}^+]/[\\text{B}])\\)。</p>
          `),
        },
        {
          title: { en: 'Titrations and indicators', zh: '滴定與指示劑' },
          body: () => L(`
            <p>A <strong>titration</strong> delivers a solution of known concentration (the titrant) to a solution of unknown concentration until the reaction is complete.</p>
            ${fig(titrationSVG(), 'Strong acid–strong base jumps sharply through pH 7. The weak acid curve has a buffer plateau and reaches a basic equivalence point.')}
            ${table(['Point', 'Strong acid–strong base', 'Weak acid–strong base'], [
              ['Initial pH', 'Low', 'Higher than a strong acid of the same concentration'],
              ['Buffer region', 'None', 'Around pKa'],
              ['Half-equivalence', '—', 'pH = pKa'],
              ['Equivalence pH', '7.00', '&gt; 7 (basic)'],
              ['Steep jump', 'Large', 'Smaller'],
            ], true)}
            <h4>Equivalence points to remember</h4>
            <ul>
              <li><strong>Strong acid + strong base:</strong> neutral, pH = 7.00 at 25 °C.</li>
              <li><strong>Weak acid + strong base:</strong> the conjugate base remains, so pH &gt; 7.</li>
              <li><strong>Weak base + strong acid:</strong> the conjugate acid remains, so pH &lt; 7.</li>
              <li>At the <strong>half-equivalence point</strong> of a weak acid titration, \\([\\text{HA}] = [\\text{A}^-]\\) and pH = pKa.</li>
            </ul>
            <h4>Indicators</h4>
            <p>An indicator changes colour over roughly \\(pK_a \\pm 1\\). Choose one whose range brackets the equivalence pH.</p>
            ${table(['Indicator', 'Colour change (approx.)', 'Useful for'], [
              ['Methyl orange', '3.1 – 4.4', 'Strong acid–strong base, acid side'],
              ['Bromothymol blue', '6.0 – 7.6', 'Strong acid–strong base'],
              ['Phenolphthalein', '8.2 – 10.0', 'Weak acid–strong base'],
            ], true)}
            <p class="course-example">Phenolphthalein is a good choice for a weak acid–strong base titration because its colour change overlaps the basic equivalence pH.</p>
          `, `
            <p><strong>滴定</strong>是把已知濃度溶液（滴定劑）加入未知濃度溶液，直到反應完成。</p>
            ${fig(titrationSVG(), '強酸－強鹼曲線在 pH 7 附近陡降。弱酸曲線有緩衝平台，當量點呈鹼性。')}
            ${table(['位置', '強酸－強鹼', '弱酸－強鹼'], [
              ['初始 pH', '低', '高於同濃度的強酸'],
              ['緩衝區', '無', '約在 pKa 附近'],
              ['半當量點', '—', 'pH = pKa'],
              ['當量點 pH', '7.00', '&gt; 7（鹼性）'],
              ['陡降幅度', '大', '較小'],
            ], true)}
            <h4>要記住的當量點</h4>
            <ul>
              <li><strong>強酸 + 強鹼：</strong>中性，25 °C 時 pH = 7.00。</li>
              <li><strong>弱酸 + 強鹼：</strong>留下共軛鹼，所以 pH &gt; 7。</li>
              <li><strong>弱鹼 + 強酸：</strong>留下共軛酸，所以 pH &lt; 7。</li>
              <li>弱酸滴定的<strong>半當量點</strong>：\\([\\text{HA}] = [\\text{A}^-]\\)，pH = pKa。</li>
            </ul>
            <h4>指示劑</h4>
            <p>指示劑的變色範圍大約是 \\(pK_a \\pm 1\\)。選擇變色範圍涵蓋當量 pH 的指示劑。</p>
            ${table(['指示劑', '變色範圍（約）', '適用'], [
              ['甲基橙', '3.1 – 4.4', '強酸－強鹼，酸性端'],
              ['溴瑞香草酚藍', '6.0 – 7.6', '強酸－強鹼'],
              ['酚酞', '8.2 – 10.0', '弱酸－強鹼'],
            ], true)}
            <p class="course-example">弱酸－強鹼滴定適合用酚酞，因為它的變色範圍與鹼性當量點重疊。</p>
          `),
        },
        {
          title: { en: 'Worked examples', zh: '綜合例題' },
          body: () => L(`
            <h4>A · Strong acid</h4>
            <p>0.0050 M HNO₃:</p>
            <p class="atomic-eq">\\[\\text{pH} = -\\log(0.0050) = 2.30\\]</p>
            <h4>B · Weak acid</h4>
            <p>0.20 M formic acid, Ka = 1.8 × 10⁻⁴:</p>
            <p class="atomic-eq">\\[x = \\sqrt{(1.8 \\times 10^{-4})(0.20)} = 6.0 \\times 10^{-3}\\ \\text{M}\\]</p>
            <p>Check: 6.0 × 10⁻³ / 0.20 = 3.0% &lt; 5%, so the approximation is valid.</p>
            <p class="atomic-eq">\\[\\text{pH} = -\\log(6.0 \\times 10^{-3}) = 2.22\\]</p>
            <h4>C · Buffer</h4>
            <p>A buffer contains 0.15 M NH₃ and 0.10 M NH₄⁺. Kb(NH₃) = 1.8 × 10⁻⁵, so pKb = 4.74.</p>
            <p class="atomic-eq">\\[\\text{pOH} = 4.74 + \\log\\frac{0.10}{0.15} = 4.56\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = 14.00 - 4.56 = 9.44\\]</p>
            <h4>D · Weak acid titration at equivalence</h4>
            <p>25.0 mL of 0.100 M acetic acid is titrated with 0.100 M NaOH. At equivalence, all acid has become acetate:</p>
            <p class="atomic-eq">\\[[\\text{A}^-] = 0.0500\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[K_b = K_w/K_a = \\frac{1.0 \\times 10^{-14}}{1.8 \\times 10^{-5}} = 5.56 \\times 10^{-10}\\]</p>
            <p class="atomic-eq">\\[x = \\sqrt{(5.56 \\times 10^{-10})(0.0500)} = 5.27 \\times 10^{-6}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[\\text{pOH} = 5.28 \\quad \\text{pH} = 8.72\\]</p>
            ${practice(ACIDS_PRACTICE, 'acid')}
          `, `
            <h4>A · 強酸</h4>
            <p>0.0050 M HNO₃：</p>
            <p class="atomic-eq">\\[\\text{pH} = -\\log(0.0050) = 2.30\\]</p>
            <h4>B · 弱酸</h4>
            <p>0.20 M 甲酸，Ka = 1.8 × 10⁻⁴：</p>
            <p class="atomic-eq">\\[x = \\sqrt{(1.8 \\times 10^{-4})(0.20)} = 6.0 \\times 10^{-3}\\ \\text{M}\\]</p>
            <p>檢查：6.0 × 10⁻³ / 0.20 = 3.0% &lt; 5%，近似成立。</p>
            <p class="atomic-eq">\\[\\text{pH} = -\\log(6.0 \\times 10^{-3}) = 2.22\\]</p>
            <h4>C · 緩衝液</h4>
            <p>緩衝液含 0.15 M NH₃ 與 0.10 M NH₄⁺。Kb(NH₃) = 1.8 × 10⁻⁵，所以 pKb = 4.74。</p>
            <p class="atomic-eq">\\[\\text{pOH} = 4.74 + \\log\\frac{0.10}{0.15} = 4.56\\]</p>
            <p class="atomic-eq">\\[\\text{pH} = 14.00 - 4.56 = 9.44\\]</p>
            <h4>D · 弱酸滴定至當量點</h4>
            <p>25.0 mL 的 0.100 M 醋酸用 0.100 M NaOH 滴定。當量點時，所有酸都變成醋酸根：</p>
            <p class="atomic-eq">\\[[\\text{A}^-] = 0.0500\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[K_b = K_w/K_a = \\frac{1.0 \\times 10^{-14}}{1.8 \\times 10^{-5}} = 5.56 \\times 10^{-10}\\]</p>
            <p class="atomic-eq">\\[x = \\sqrt{(5.56 \\times 10^{-10})(0.0500)} = 5.27 \\times 10^{-6}\\ \\text{M}\\]</p>
            <p class="atomic-eq">\\[\\text{pOH} = 5.28 \\quad \\text{pH} = 8.72\\]</p>
            ${practice(ACIDS_PRACTICE, 'acid')}
          `),
        },
        {
          title: { en: 'Quick quiz', zh: '快速測驗' },
          body: () => L(`
            <p>Six checks on the ideas that matter most.</p>
            ${quiz([
              {
                q: ['A Brønsted–Lowry acid is a…', '布忍斯特－羅瑞酸是……'],
                options: [['proton donor', '質子提供者'], ['proton acceptor', '質子接受者'], ['electron-pair acceptor', '電子對接受者'], ['hydroxide source', '氫氧根來源']],
                answer: 0,
                hint: ['Think about what the acid gives away in the reaction.', '想想酸在反應中給出什麼。'],
                explain: ['A Brønsted–Lowry acid donates H⁺; a base accepts H⁺.', '布忍斯特－羅瑞酸提供 H⁺；鹼接受 H⁺。'],
              },
              {
                q: ['A strong acid in water…', '強酸在水中……'],
                options: [['partially ionizes', '部分解離'], ['completely ionizes', '完全解離'], ['does not ionize', '不解離'], ['always has pH 0', 'pH 一定是 0']],
                answer: 1,
                hint: ['“Strong” refers to the extent of ionization, not concentration.', '「強」指的是解離程度，不是濃度。'],
                explain: ['Strong acids dissociate completely, so [H⁺] equals the acid concentration for a monoprotic acid.', '強酸完全解離，因此單質子酸的 [H⁺] 等於酸濃度。'],
              },
              {
                q: ['How many times greater is [H⁺] at pH 3 than at pH 5?', 'pH 3 的 [H⁺] 是 pH 5 的幾倍？'],
                options: [['2 times', '2 倍'], ['10 times', '10 倍'], ['100 times', '100 倍'], ['1,000 times', '1,000 倍']],
                answer: 2,
                hint: ['Each pH unit is a factor of ten.', '每個 pH 單位相差十倍。'],
                explain: ['A difference of 2 pH units is 10² = 100 times.', '相差 2 個 pH 單位，就是 10² = 100 倍。'],
              },
              {
                q: ['A weak acid has <strong>Ka = 4.0 × 10⁻⁶</strong>. What is Kb of its conjugate base?', '某弱酸 <strong>Ka = 4.0 × 10⁻⁶</strong>，其共軛鹼的 Kb 是多少？'],
                options: [['2.5 × 10⁻⁹', '2.5 × 10⁻⁹'], ['4.0 × 10⁻⁶', '4.0 × 10⁻⁶'], ['2.5 × 10⁻⁸', '2.5 × 10⁻⁸'], ['4.0 × 10⁻²⁰', '4.0 × 10⁻²⁰']],
                answer: 0,
                hint: ['Use Ka × Kb = 1.0 × 10⁻¹⁴.', '使用 Ka × Kb = 1.0 × 10⁻¹⁴。'],
                explain: ['Kb = 1.0 × 10⁻¹⁴ / 4.0 × 10⁻⁶ = 2.5 × 10⁻⁹.', 'Kb = 1.0 × 10⁻¹⁴ / 4.0 × 10⁻⁶ = 2.5 × 10⁻⁹。'],
              },
              {
                q: ['A buffer works best when…', '緩衝液在什麼情況下效果最好？'],
                options: [['pH is far from pKa', 'pH 遠離 pKa'], ['pH ≈ pKa and the ratio is near 1', 'pH ≈ pKa 且比值接近 1'], ['it contains only strong acid', '只含強酸'], ['it is very dilute', '非常稀釋']],
                answer: 1,
                hint: ['Look at the Henderson–Hasselbalch equation: the log term is zero when the ratio is 1.', '看 Henderson–Hasselbalch 方程式：比值為 1 時對數項為零。'],
                explain: ['Buffering is strongest near pH = pKa, where the acid and conjugate base are comparable in amount.', '在 pH = pKa 附近，酸與共軛鹼量相當，緩衝能力最強。'],
              },
              {
                q: ['At the equivalence point of a <strong>weak acid–strong base</strong> titration, the pH is…', '<strong>弱酸－強鹼</strong>滴定在當量點時，pH 是……'],
                options: [['exactly 7.00', '正好 7.00'], ['below 7', '低於 7'], ['above 7', '高於 7'], ['impossible to predict', '無法預測']],
                answer: 2,
                hint: ['At equivalence, the solution contains the conjugate base of the weak acid.', '當量點時，溶液中含有弱酸的共軛鹼。'],
                explain: ['The conjugate base hydrolyzes water to make OH⁻, so the equivalence pH is basic.', '共軛鹼水解產生 OH⁻，所以當量點呈鹼性。'],
              },
            ], 'acid')}
          `, `
            <p>六題檢查最重要的觀念。</p>
            ${quiz([
              {
                q: ['布忍斯特－羅瑞酸是……', '布忍斯特－羅瑞酸是……'],
                options: [['質子提供者', '質子提供者'], ['質子接受者', '質子接受者'], ['電子對接受者', '電子對接受者'], ['氫氧根來源', '氫氧根來源']],
                answer: 0,
                hint: ['想想酸在反應中給出什麼。', '想想酸在反應中給出什麼。'],
                explain: ['布忍斯特－羅瑞酸提供 H⁺；鹼接受 H⁺。', '布忍斯特－羅瑞酸提供 H⁺；鹼接受 H⁺。'],
              },
              {
                q: ['強酸在水中……', '強酸在水中……'],
                options: [['部分解離', '部分解離'], ['完全解離', '完全解離'], ['不解離', '不解離'], ['pH 一定是 0', 'pH 一定是 0']],
                answer: 1,
                hint: ['「強」指的是解離程度，不是濃度。', '「強」指的是解離程度，不是濃度。'],
                explain: ['強酸完全解離，因此單質子酸的 [H⁺] 等於酸濃度。', '強酸完全解離，因此單質子酸的 [H⁺] 等於酸濃度。'],
              },
              {
                q: ['pH 3 的 [H⁺] 是 pH 5 的幾倍？', 'pH 3 的 [H⁺] 是 pH 5 的幾倍？'],
                options: [['2 倍', '2 倍'], ['10 倍', '10 倍'], ['100 倍', '100 倍'], ['1,000 倍', '1,000 倍']],
                answer: 2,
                hint: ['每個 pH 單位相差十倍。', '每個 pH 單位相差十倍。'],
                explain: ['相差 2 個 pH 單位，就是 10² = 100 倍。', '相差 2 個 pH 單位，就是 10² = 100 倍。'],
              },
              {
                q: ['某弱酸 <strong>Ka = 4.0 × 10⁻⁶</strong>，其共軛鹼的 Kb 是多少？', '某弱酸 <strong>Ka = 4.0 × 10⁻⁶</strong>，其共軛鹼的 Kb 是多少？'],
                options: [['2.5 × 10⁻⁹', '2.5 × 10⁻⁹'], ['4.0 × 10⁻⁶', '4.0 × 10⁻⁶'], ['2.5 × 10⁻⁸', '2.5 × 10⁻⁸'], ['4.0 × 10⁻²⁰', '4.0 × 10⁻²⁰']],
                answer: 0,
                hint: ['使用 Ka × Kb = 1.0 × 10⁻¹⁴。', '使用 Ka × Kb = 1.0 × 10⁻¹⁴。'],
                explain: ['Kb = 1.0 × 10⁻¹⁴ / 4.0 × 10⁻⁶ = 2.5 × 10⁻⁹。', 'Kb = 1.0 × 10⁻¹⁴ / 4.0 × 10⁻⁶ = 2.5 × 10⁻⁹。'],
              },
              {
                q: ['緩衝液在什麼情況下效果最好？', '緩衝液在什麼情況下效果最好？'],
                options: [['pH 遠離 pKa', 'pH 遠離 pKa'], ['pH ≈ pKa 且比值接近 1', 'pH ≈ pKa 且比值接近 1'], ['只含強酸', '只含強酸'], ['非常稀釋', '非常稀釋']],
                answer: 1,
                hint: ['看 Henderson–Hasselbalch 方程式：比值為 1 時對數項為零。', '看 Henderson–Hasselbalch 方程式：比值為 1 時對數項為零。'],
                explain: ['在 pH = pKa 附近，酸與共軛鹼量相當，緩衝能力最強。', '在 pH = pKa 附近，酸與共軛鹼量相當，緩衝能力最強。'],
              },
              {
                q: ['<strong>弱酸－強鹼</strong>滴定在當量點時，pH 是……', '<strong>弱酸－強鹼</strong>滴定在當量點時，pH 是……'],
                options: [['正好 7.00', '正好 7.00'], ['低於 7', '低於 7'], ['高於 7', '高於 7'], ['無法預測', '無法預測']],
                answer: 2,
                hint: ['當量點時，溶液中含有弱酸的共軛鹼。', '當量點時，溶液中含有弱酸的共軛鹼。'],
                explain: ['共軛鹼水解產生 OH⁻，所以當量點呈鹼性。', '共軛鹼水解產生 OH⁻，所以當量點呈鹼性。'],
              },
            ], 'acid')}
          `),
        },
        {
          title: { en: 'Beginner checklist', zh: '初學者檢查表' },
          body: () => L(`
            <ul class="course-checklist">
              <li><strong>Strong acids and bases dissociate completely</strong>; weak ones reach equilibrium.</li>
              <li>\\(K_w = [\\text{H}^+][\\text{OH}^-] = 1.0 \\times 10^{-14}\\) at 25 °C.</li>
              <li>\\(\\text{pH} + \\text{pOH} = 14.00\\) at 25 °C.</li>
              <li>For weak acids, use \\(x = \\sqrt{K_a C}\\) and check the <strong>5% rule</strong>.</li>
              <li>\\(K_a \\times K_b = K_w\\) for a conjugate acid–base pair.</li>
              <li>Buffers work best when <strong>pH ≈ pKa</strong> and the ratio is near 1.</li>
              <li>Henderson–Hasselbalch: \\(\\text{pH} = pK_a + \\log([\\text{A}^-]/[\\text{HA}])\\).</li>
              <li>At the <strong>half-equivalence point</strong> of a weak acid titration, pH = pKa.</li>
              <li>At <strong>equivalence</strong>: strong–strong → pH 7; weak acid–strong base → pH &gt; 7; weak base–strong acid → pH &lt; 7.</li>
              <li>Choose an indicator whose range brackets the equivalence pH.</li>
            </ul>
          `, `
            <ul class="course-checklist">
              <li><strong>強酸與強鹼完全解離</strong>；弱酸與弱鹼則達到平衡。</li>
              <li>25 °C 下 \\(K_w = [\\text{H}^+][\\text{OH}^-] = 1.0 \\times 10^{-14}\\)。</li>
              <li>25 °C 下 \\(\\text{pH} + \\text{pOH} = 14.00\\)。</li>
              <li>弱酸使用 \\(x = \\sqrt{K_a C}\\)，並檢查 <strong>5% 規則</strong>。</li>
              <li>共軛酸鹼對滿足 \\(K_a \\times K_b = K_w\\)。</li>
              <li>緩衝液在 <strong>pH ≈ pKa</strong> 且比值接近 1 時效果最好。</li>
              <li>Henderson–Hasselbalch：\\(\\text{pH} = pK_a + \\log([\\text{A}^-]/[\\text{HA}])\\)。</li>
              <li>弱酸滴定的<strong>半當量點</strong>：pH = pKa。</li>
              <li><strong>當量點</strong>：強－強 → pH 7；弱酸－強鹼 → pH &gt; 7；弱鹼－強酸 → pH &lt; 7。</li>
              <li>選擇變色範圍涵蓋當量 pH 的指示劑。</li>
            </ul>
          `),
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
    if (!root.dataset.sciBound) {
      root.dataset.sciBound = '1';
      root.addEventListener('click', onRootClick);
      root.addEventListener('input', onRootInput);
      root.addEventListener('keydown', onRootKeydown);
    }
    paintLabs(root);
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

  function onRootInput(event) {
    const slider = event.target.closest('[data-ph-range]');
    if (slider) paintPhLab(slider.closest('[data-ph-lab]'));
  }

  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };

  function scientific(value, unit = 'M') {
    if (!Number.isFinite(value) || value <= 0) return `0 ${unit}`;
    const exponent = Math.floor(Math.log10(value));
    const mantissa = value / 10 ** exponent;
    if (exponent === 0) return `${mantissa.toFixed(1)} ${unit}`;
    return `${mantissa.toFixed(1)} × 10${String(exponent).split('').map((ch) => SUP[ch]).join('')} ${unit}`;
  }

  function paintPhLab(lab) {
    if (!lab) return;
    const range = lab.querySelector('[data-ph-range]');
    if (!range) return;
    const ph = Number(range.value);
    const h = 10 ** -ph;
    const oh = 1e-14 / h;

    const value = lab.querySelector('[data-ph-value]');
    const label = lab.querySelector('[data-ph-label]');
    const hOut = lab.querySelector('[data-ph-h]');
    const ohOut = lab.querySelector('[data-ph-oh]');
    const marker = lab.querySelector('[data-ph-marker]');

    if (value) value.textContent = ph.toFixed(1);
    if (hOut) hOut.textContent = scientific(h);
    if (ohOut) ohOut.textContent = scientific(oh);
    if (marker) marker.style.left = `${(ph / 14) * 100}%`;
    if (label) {
      const kind = ph < 7 ? 'acid' : ph > 7 ? 'base' : 'neutral';
      label.dataset.kind = kind;
      label.textContent = kind === 'acid'
        ? L('Acidic', '酸性')
        : kind === 'base'
          ? L('Basic', '鹼性')
          : L('Neutral', '中性');
    }
  }

  function paintLabs(root) {
    root.querySelectorAll('[data-ph-lab]').forEach((lab) => paintPhLab(lab));
  }

  function renderAll() {
    COURSES.forEach((course) => renderCourse(course));
  }

  renderAll();

  window.SciLampScienceCourses = {
    repaint: renderAll,
  };
})();
