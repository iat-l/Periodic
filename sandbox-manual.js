/* The discovery manual: short, answer-free hints for every catalogued product.
   Each cue points at one or more catalog ids but never spells out a formula,
   count or recipe. Progress comes from the shared discovery store. */

(() => {
  const root = document.getElementById('sb-manual');
  const tabsEl = document.getElementById('sb-manual-tabs');
  const panelsEl = document.getElementById('sb-manual-panels');
  const countEl = document.getElementById('sb-manual-count');
  const fillEl = document.getElementById('sb-manual-fill');
  const barEl = document.getElementById('sb-manual-bar');
  const bodyEl = document.getElementById('sb-manual-body');
  const toggleEl = document.getElementById('sb-manual-toggle');
  if (!root || !tabsEl || !panelsEl || !countEl || !fillEl || !barEl || !bodyEl || !toggleEl) return;
  if (!window.SciLampStore || typeof COMPOUNDS === 'undefined') return;

  const TOTAL = COMPOUNDS.length;
  const lang = () => (window.SciLampI18n?.lang === 'zh' ? 'zh' : 'en');
  const T = (entry) => (entry && (entry[lang()] ?? entry.en)) || '';

  const CHAPTERS = [
    {
      id: 'basics',
      tab: { en: 'Basics', zh: '基礎' },
      kicker: { en: 'Start here', zh: '從這裡開始' },
      title: { en: 'Three simple rules', zh: '三個簡單規則' },
      lead: {
        en: 'Hints only — the bench is the answer key. Change one atom at a time and combine again.',
        zh: '這裡只給提示，答案要自己在實驗台上找。每次只改一顆原子，再按結合。',
      },
      tips: [
        { en: 'A metal and a nonmetal: balance the + and − charges.', zh: '金屬加非金屬：把正負電荷抵銷。' },
        { en: 'Two nonmetals: count the bonds each atom can share.', zh: '兩種非金屬：數一數每顆原子能共用幾個鍵。' },
        { en: 'Two metals: the pair itself makes the alloy.', zh: '兩種金屬：這一對金屬就會形成合金。' },
      ],
      cues: [],
    },
    {
      id: 'molecules',
      tab: { en: 'Molecules', zh: '分子' },
      kicker: { en: 'Chapter 01 · sharing', zh: '第 01 章 · 共用電子' },
      title: { en: 'Molecules from nonmetals', zh: '非金屬組成的分子' },
      lead: {
        en: 'Nonmetals share electrons. Start from the atom that can form the most bonds, then test its neighbours.',
        zh: '非金屬以共用電子結合。先從能形成最多鍵的原子開始，再試旁邊的組合。',
      },
      cues: [
        {
          text: {
            en: 'You drink this every day — I wonder what hydrogen must meet to form this liquid. Its sharp-tongued cousin hides in a brown bottle and bubbles on a scrape.',
            zh: '你每天都喝它——我真想知道，氫要遇見什麼，才能形成這杯液體。它脾氣更烈的表親躲在棕色瓶裡，一碰到傷口就冒泡。',
          },
          ids: ['water', 'hydrogen-peroxide'],
        },
        {
          text: {
            en: 'The fizz that escapes your drink and the blanket that snuffs a candle; then the silent thief that slips out of a faulty heater.',
            zh: '從飲料裡逃出的氣泡，與能悶熄蠟燭的毯子；還有從故障暖爐悄悄溜出的沉默小偷。',
          },
          ids: ['carbon-dioxide', 'carbon-monoxide'],
        },
        {
          text: {
            en: 'The blue ring on a stove asks carbon a simple question: how many of the lightest atoms can you hold?',
            zh: '爐子上的藍色火環問碳一個簡單問題：你能抱住幾顆最輕的原子？',
          },
          ids: ['methane'],
        },
        {
          text: {
            en: 'A sharp smell in fertiliser and glass cleaner — nitrogen, with a little help from the lightest atom.',
            zh: '肥料與玻璃清潔劑裡的刺鼻氣味——氮，加上最輕原子的一點幫忙。',
          },
          ids: ['ammonia'],
        },
        {
          text: {
            en: 'Two biting gases that turn water sour. The lighter halogen packs the fiercer bite.',
            zh: '兩種嗆人的氣體，一溶進水就變酸。較輕的鹵素，咬得更兇。',
          },
          ids: ['hydrogen-chloride', 'hydrogen-fluoride'],
        },
        {
          text: {
            en: 'Rotten eggs at the edge of a volcano; then two sulfur oxides — one keeps fruit from browning, one helps rain bite stone.',
            zh: '火山邊的臭雞蛋味；還有兩種硫氧化物——一種讓水果不變褐，一種讓雨咬穿石頭。',
          },
          ids: ['hydrogen-sulfide', 'sulfur-dioxide', 'sulfur-trioxide'],
        },
        {
          text: {
            en: 'Three nitrogen–oxygen gases: one vanishes almost as it forms, one paints the smog brown, one makes whipped cream giggle.',
            zh: '三種氮氧氣體：一種剛形成就幾乎消失，一種把霧霾染成褐色，一種讓鮮奶油笑出聲。',
          },
          ids: ['nitric-oxide', 'nitrogen-dioxide', 'nitrous-oxide'],
        },
        {
          text: {
            en: 'The beach is made of this; and a carbon wrapped in halogen coats once sent suits to the dry cleaner.',
            zh: '整片海灘都是用它做的；還有一個碳裹著鹵素外套，曾把西裝送進乾洗店。',
          },
          ids: ['silicon-dioxide', 'carbon-tetrachloride'],
        },
        {
          text: {
            en: 'Phosphorus meets a green-yellow halogen and fumes at the touch of air.',
            zh: '磷遇見黃綠色的鹵素，一碰到空氣就發煙。',
          },
          ids: ['phosphorus-trichloride'],
        },
        {
          text: {
            en: 'Two mineral acids with a taste for metal. Hydrogen first meets sulfur’s oxide, then nitrogen’s oxide — and each oxide must be fully oxygenated.',
            zh: '兩種愛啃金屬的礦酸。氫先遇見硫的氧化物，再遇見氮的氧化物——而且每個氧化物都要吸飽氧。',
          },
          ids: ['sulfuric-acid', 'nitric-acid'],
        },
      ],
    },
    {
      id: 'oxides',
      tab: { en: 'Oxides', zh: '氧化物' },
      kicker: { en: 'Chapter 02 · oxygen accepts', zh: '第 02 章 · 氧接受電子' },
      title: { en: 'Metal oxides and ceramics', zh: '金屬氧化物與陶瓷' },
      lead: {
        en: 'Oxygen accepts two electrons. Let the metal’s common charge decide how many metal atoms you need.',
        zh: '氧會接受兩個電子。由金屬的常見電荷決定你需要幾顆金屬原子。',
      },
      cues: [
        {
          text: {
            en: 'The soft metal in your salt shaker hides a fiery temper. Let oxygen get close and see what it leaves behind.',
            zh: '鹽罐裡那塊軟金屬藏著火爆脾氣。讓氧靠近，看看它會留下什麼。',
          },
          ids: ['sodium-oxide'],
        },
        {
          text: {
            en: 'A white flame leaves white ash; roast limestone and a white solid remains. Two different metals, the same quiet partner.',
            zh: '白色火焰留下白色灰燼；焙燒石灰石也留下白色固體。兩種不同的金屬，同一位安靜的夥伴。',
          },
          ids: ['magnesium-oxide', 'calcium-oxide'],
        },
        {
          text: {
            en: 'Rubies and sapphires wear it as a disguise. The metal beneath is light enough for aircraft.',
            zh: '紅寶石與藍寶石拿它當偽裝。裡面的金屬輕得能飛上天。',
          },
          ids: ['aluminium-oxide'],
        },
        {
          text: {
            en: 'Iron rusts in several moods: one pale, one red, one magnetic and mixed.',
            zh: '鐵生鏽有好幾種心情：一種蒼白、一種紅豔、一種帶磁性又混雜。',
          },
          ids: ['iron-ii-oxide', 'iron-iii-oxide', 'iron-ii-iii-oxide'],
        },
        {
          text: {
            en: 'Copper blushes red in one mood and turns black in another.',
            zh: '銅在一種心情下泛紅，在另一種心情下發黑。',
          },
          ids: ['copper-i-oxide', 'copper-ii-oxide'],
        },
        {
          text: {
            en: 'The white smear of old sunscreen, and the pigment in old yellow-red paint. Both metals like to give away two electrons.',
            zh: '舊防曬乳的白色塗痕，以及舊黃紅油漆裡的顏料。兩種金屬都喜歡交出兩個電子。',
          },
          ids: ['zinc-oxide', 'lead-ii-oxide'],
        },
        {
          text: {
            en: 'The bright white behind paint and sunscreen — titanium’s favourite partner.',
            zh: '油漆與防曬乳背後的亮白——鈦最愛的夥伴。',
          },
          ids: ['titanium-dioxide'],
        },
        {
          text: {
            en: 'A green jewel from chromium; a black powder inside a dry-cell battery from manganese. Same partner, different moods.',
            zh: '鉻的綠色寶石；錳在乾電池裡的黑色粉末。同一位夥伴，不同的心情。',
          },
          ids: ['chromium-iii-oxide', 'manganese-dioxide'],
        },
      ],
    },
    {
      id: 'salts',
      tab: { en: 'Salts', zh: '鹽類' },
      kicker: { en: 'Chapter 03 · opposite charges', zh: '第 03 章 · 正負相吸' },
      title: { en: 'Salts and hydroxides', zh: '鹽與氫氧化物' },
      lead: {
        en: 'A salt pairs a positive ion with a negative one. Treat each polyatomic group as one package.',
        zh: '鹽是正離子與負離子的配對。把每個多原子團當成一整個包裹。',
      },
      cues: [
        {
          text: {
            en: 'Start with the salt on your table, then swap the metal or the halogen. Which combinations still behave like salt?',
            zh: '從餐桌上的鹽開始，換掉金屬或鹵素。哪些組合仍然像鹽一樣？',
          },
          ids: ['sodium-chloride', 'potassium-chloride', 'potassium-bromide', 'sodium-iodide'],
        },
        {
          text: {
            en: 'Chalk’s metal, Epsom’s metal, foil’s metal and a heavy white metal each take a halogen partner. Match the charges, not the names.',
            zh: '白堊的金屬、瀉鹽的金屬、錫箔的金屬，還有一種沉重的白色金屬，各自找一個鹵素夥伴。配電荷，不是配名字。',
          },
          ids: ['calcium-chloride', 'magnesium-chloride', 'aluminium-chloride', 'barium-chloride'],
        },
        {
          text: {
            en: 'An old package called sal ammoniac: nitrogen and hydrogen travel together, then choose a halogen.',
            zh: '一個叫鹵砂的古老包裹：氮與氫結伴同行，再挑一個鹵素。',
          },
          ids: ['ammonium-chloride'],
        },
        {
          text: {
            en: 'Old photographs blushed when this silver salt met light. Which packages does silver need to make it?',
            zh: '舊照片一見光就臉紅，全靠這種銀鹽。銀需要哪幾個包裹才能做出它？',
          },
          ids: ['silver-nitrate'],
        },
        {
          text: {
            en: 'Drain cleaner and limewater: a group-1 metal and a group-2 metal share the same caustic partner.',
            zh: '通樂與石灰水：第 1 族金屬和第 2 族金屬，共用同一位腐蝕性夥伴。',
          },
          ids: ['sodium-hydroxide', 'calcium-hydroxide'],
        },
        {
          text: {
            en: 'Washing soda, baking soda and chalk share a carbonate family — with a bicarbonate cousin hiding in the cupboard.',
            zh: '洗滌鹼、小蘇打與白堊同屬碳酸家族——櫥櫃裡還藏著一個碳酸氫根的親戚。',
          },
          ids: ['sodium-carbonate', 'sodium-bicarbonate', 'calcium-carbonate'],
        },
        {
          text: {
            en: 'Blue crystals in school labs and a fungicide spray: copper with a sulfur-and-oxygen partner.',
            zh: '學校實驗室的藍色晶體與殺菌噴劑：銅配上一個硫加氧的夥伴。',
          },
          ids: ['copper-ii-sulfate'],
        },
        {
          text: {
            en: 'Deep purple crystals that stain your fingers and love to oxidise. The metal inside wears a group-1 crown.',
            zh: '深紫色晶體，染手又熱愛氧化。裡面的金屬戴著第 1 族的皇冠。',
          },
          ids: ['potassium-permanganate'],
        },
        {
          text: {
            en: 'Fertiliser salts: the phosphate package rides with sodium in one bottle and calcium in another.',
            zh: '肥料鹽：磷酸根包裹在一瓶裡跟著鈉，在另一瓶裡跟著鈣。',
          },
          ids: ['sodium-phosphate', 'calcium-phosphate'],
        },
      ],
    },
    {
      id: 'alloys',
      tab: { en: 'Alloys', zh: '合金' },
      kicker: { en: 'Chapter 04 · metals together', zh: '第 04 章 · 金屬共融' },
      title: { en: 'The named alloys', zh: '有名字的合金' },
      lead: {
        en: 'Alloys are the easiest products to make and the hardest to name. Pick two metals and read the clue.',
        zh: '合金最容易做，卻最難叫出名字。選兩種金屬，再看提示。',
      },
      cues: [
        {
          text: {
            en: 'Golden keys and trumpet bells: copper invites a grey metal that usually coats steel.',
            zh: '金色鑰匙與小號喇叭：銅邀請一位常替鋼鐵穿外套的灰色金屬。',
          },
          ids: ['brass'],
        },
        {
          text: {
            en: 'Bells and statues wear this brown: copper with the metal of old tin cans.',
            zh: '鐘與雕像披著這身褐：銅配上舊錫罐所用的金屬。',
          },
          ids: ['bronze'],
        },
        {
          text: {
            en: 'Cutlery that shrugs off rust: iron with a hard, shiny partner that loves a mirror polish.',
            zh: '對鏽跡不屑一顧的餐具：鐵配上一位堅硬發亮、愛照鏡子的夥伴。',
          },
          ids: ['stainless-steel'],
        },
        {
          text: {
            en: 'Early aircraft needed light and strong: aluminium with a red conductor.',
            zh: '早期飛機需要又輕又強：鋁加上一位紅色導體。',
          },
          ids: ['duralumin'],
        },
        {
          text: {
            en: 'The soft pair that joins wires and pipes — both melt without much persuasion.',
            zh: '連接電線與管線的柔軟搭檔——兩者都不太需要勸就融化。',
          },
          ids: ['solder'],
        },
        {
          text: {
            en: 'Ancient coins wore this pale gold: gold with a metal that loves moonlight.',
            zh: '古錢幣披著這層淡金：金配上一位愛月光的金屬。',
          },
          ids: ['electrum'],
        },
        {
          text: {
            en: 'A clockmaker’s alloy that barely grows when the room warms: iron with a partner that also resists rust.',
            zh: '鐘錶匠的合金，房間變暖也幾乎不長大：鐵配上一位同樣抗鏽的夥伴。',
          },
          ids: ['invar'],
        },
        {
          text: {
            en: 'Glasses frames and stents that remember their shape: nickel with a space-age lightweight metal.',
            zh: '記得自己形狀的眼鏡框與血管支架：鎳加上一種太空時代的輕金屬。',
          },
          ids: ['nitinol'],
        },
        {
          text: {
            en: 'A dentist’s filling: silver dissolved in the only metal that stays liquid at room temperature.',
            zh: '牙醫的補綴：銀溶在唯一在常溫下仍保持液態的金屬裡。',
          },
          ids: ['amalgam'],
        },
      ],
    },
  ];

  let activeId = CHAPTERS[0].id;

  const idsOf = (chapter) => [...new Set((chapter.cues || []).flatMap((cue) => cue.ids))];
  const totalOf = (chapter) => idsOf(chapter).length;
  const countOf = (chapter, found) => idsOf(chapter).filter((id) => found.has(id)).length;

  function currentFound() {
    const ids = SciLampStore.discoveries();
    return new Set(ids.filter((id) => COMPOUND_BY_ID.has(id)));
  }

  function tipsBlock(chapter) {
    if (!chapter.tips) return '';
    return `<div class="sb-manual-notes">
      <h5>${lang() === 'zh' ? '記住這三點' : 'Keep these three'}</h5>
      <ul>${chapter.tips.map((tip) => `<li>${esc(T(tip))}</li>`).join('')}</ul>
    </div>`;
  }

  function cueItem(cue, found) {
    const ids = cue.ids.filter((id) => COMPOUND_BY_ID.has(id));
    const hit = ids.filter((id) => found.has(id));
    const complete = ids.length > 0 && hit.length === ids.length;
    const partial = hit.length > 0 && !complete;
    const status = complete
      ? (lang() === 'zh' ? '完成' : 'Complete')
      : partial
        ? (lang() === 'zh' ? `${hit.length} / ${ids.length} 已找到` : `${hit.length} of ${ids.length} found`)
        : (lang() === 'zh' ? '尚未找到' : 'Not yet found');
    const names = hit.map((id) => window.SciLampI18n?.compoundName(id) || COMPOUND_BY_ID.get(id).name);
    return `<li class="sb-cue${complete ? ' is-complete' : ''}${partial ? ' is-partial' : ''}">
      <span class="sb-cue-mark" aria-hidden="true">${complete ? '&check;' : ''}</span>
      <div class="sb-cue-copy">
        <p>${esc(T(cue.text))}</p>
        <div class="sb-cue-foot">
          <span class="sb-cue-state">${status}</span>
          ${names.length ? `<span class="sb-cue-found">${names.map(esc).join(' · ')}</span>` : ''}
        </div>
      </div>
    </li>`;
  }

  function panel(chapter, found, hidden) {
    const total = totalOf(chapter);
    const count = countOf(chapter, found);
    return `<section class="sb-manual-panel" id="sb-mpanel-${chapter.id}" role="tabpanel"
      aria-labelledby="sb-mtab-${chapter.id}"${hidden ? ' hidden' : ''}>
      <header class="sb-manual-panel-head">
        <span class="sb-manual-chapter">${esc(T(chapter.kicker))}</span>
        <h4>${esc(T(chapter.title))}</h4>
        ${total ? `<span class="sb-manual-family-count">${lang() === 'zh' ? `${count} / ${total} 已找到` : `${count} / ${total} found`}</span>` : ''}
      </header>
      <p class="sb-manual-lead">${esc(T(chapter.lead))}</p>
      ${tipsBlock(chapter)}
      ${chapter.cues ? `<ul class="sb-cues">${chapter.cues.map((cue) => cueItem(cue, found)).join('')}</ul>` : ''}
    </section>`;
  }

  function renderTabs(found) {
    tabsEl.innerHTML = CHAPTERS.map((chapter) => {
      const total = totalOf(chapter);
      const on = chapter.id === activeId;
      return `<button class="sb-manual-tab${on ? ' is-on' : ''}" id="sb-mtab-${chapter.id}" type="button"
        role="tab" data-chapter="${chapter.id}" aria-selected="${on}" aria-controls="sb-mpanel-${chapter.id}"
        tabindex="${on ? '0' : '-1'}">
        <span>${esc(T(chapter.tab))}</span>
        ${total ? `<span class="sb-manual-tab-count" data-tab-count="${chapter.id}">${countOf(chapter, found)} / ${total}</span>` : ''}
      </button>`;
    }).join('');
  }

  function renderPanels(found) {
    panelsEl.innerHTML = CHAPTERS.map((chapter) => panel(chapter, found, chapter.id !== activeId)).join('');
  }

  function paint(found) {
    const count = COMPOUNDS.filter((compound) => found.has(compound.id)).length;
    countEl.textContent = lang() === 'zh' ? `${count} / ${TOTAL} 已找到` : `${count} / ${TOTAL} found`;
    fillEl.style.width = `${(count / TOTAL) * 100}%`;
    barEl.setAttribute('aria-valuemax', String(TOTAL));
    barEl.setAttribute('aria-valuenow', String(count));
    root.classList.toggle('is-complete', count === TOTAL);

    CHAPTERS.forEach((chapter) => {
      const el = tabsEl.querySelector(`[data-tab-count="${chapter.id}"]`);
      if (el) el.textContent = `${countOf(chapter, found)} / ${totalOf(chapter)}`;
    });

    const activeTab = tabsEl.querySelector(`[data-chapter="${activeId}"]`);
    if (activeTab) {
      tabsEl.querySelectorAll('[data-chapter]').forEach((tab) => {
        const on = tab === activeTab;
        tab.classList.toggle('is-on', on);
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      });
    }

    renderPanels(found);
  }

  function selectChapter(id) {
    if (!CHAPTERS.some((chapter) => chapter.id === id)) return;
    activeId = id;
    const tab = tabsEl.querySelector(`[data-chapter="${id}"]`);
    tabsEl.querySelectorAll('[data-chapter]').forEach((item) => {
      const on = item === tab;
      item.classList.toggle('is-on', on);
      item.setAttribute('aria-selected', String(on));
      item.tabIndex = on ? 0 : -1;
    });
    panelsEl.querySelectorAll('.sb-manual-panel').forEach((panelEl) => {
      panelEl.hidden = panelEl.id !== `sb-mpanel-${id}`;
    });
  }

  tabsEl.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-chapter]');
    if (tab) selectChapter(tab.dataset.chapter);
  });

  tabsEl.addEventListener('keydown', (event) => {
    const tabs = [...tabsEl.querySelectorAll('[data-chapter]')];
    const at = tabs.indexOf(event.target.closest('[data-chapter]'));
    if (at < 0) return;
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = tabs[(at + 1) % tabs.length];
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = tabs[(at - 1 + tabs.length) % tabs.length];
    else if (event.key === 'Home') next = tabs[0];
    else if (event.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    event.preventDefault();
    selectChapter(next.dataset.chapter);
    next.focus();
  });

  toggleEl.addEventListener('click', () => {
    const open = bodyEl.hidden;
    bodyEl.hidden = !open;
    toggleEl.setAttribute('aria-expanded', String(open));
    toggleEl.textContent = open
      ? (lang() === 'zh' ? '收起手冊' : 'Hide manual')
      : (lang() === 'zh' ? '打開手冊' : 'Open manual');
  });

  function repaint() {
    const found = currentFound();
    renderTabs(found);
    paint(found);
  }

  document.addEventListener('scilamp:discoveries', repaint);
  document.addEventListener('scilamp:lang', () => {
    toggleEl.textContent = bodyEl.hidden
      ? (lang() === 'zh' ? '打開手冊' : 'Open manual')
      : (lang() === 'zh' ? '收起手冊' : 'Hide manual');
    repaint();
  });

  repaint();
})();
