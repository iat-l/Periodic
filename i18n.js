/* English / Traditional Chinese switch.
   Static English strings are translated by exact text-node matches; dynamic
   strings call t()/elementName()/compoundName() and re-render on scilamp:lang. */

const SciLampI18n = (() => {
  const KEY = 'scilamp-lang';
  const SUPPORTED = new Set(['en', 'zh']);
  const read = () => {
    try {
      const saved = localStorage.getItem(KEY);
      return SUPPORTED.has(saved) ? saved : 'en';
    } catch (error) {
      return 'en';
    }
  };

  let current = read();
  const isZh = () => current === 'zh';
  const t = (en, zh) => (isZh() ? zh : en);

  const ZH = {
    /* top bar */
    'Sci-lab home': 'Sci-lab 首頁',
    'Sections': '單元',
    'Periodic table': '元素週期表',
    'Sandbox': '實驗台',
    'Courses': '課程',
    'Compound index': '化合物索引',
    'Table': '元素表',
    'Index': '索引',
    'More': '更多',
    'More options': '更多選項',
    'Switch to dark theme': '切換至深色主題',
    'Switch to light theme': '切換至淺色主題',
    'Tutorial': '導覽',
    'Tour the whole site': '帶你逛完整個網站',
    'Profile & favorites': '個人檔案與收藏',
    'Streaks, badges and saved items': '連續學習、徽章與收藏',
    'Help': '說明',
    'How it works': '運作方式',
    'Settings': '設定',
    'Drag sensitivity': '拖曳靈敏度',
    'Turn': '旋轉',
    'Zoom': '縮放',
    'Scales drag and wheel gestures on the 3D views.': '調整 3D 檢視的拖曳與滾輪靈敏度。',

    /* cover */
    'Interactive field guide · 118 elements': '互動元素指南 · 118 種元素',
    'A calm visual guide to the elements — explore, name and build.': '一份平靜的視覺元素指南——探索、命名、建造。',
    'Open the table': '打開週期表',
    'Take the tour': '開始導覽',
    'Immerse yourself in': '沉浸在',
    'the elements': '元素世界',
    'Reactor study · live matter': '反應爐研究 · 活物質',
    'Fig. 01 · a study in matter': '圖 01 · 物質研究',
    'Specimen rail': '元素標本帶',
    'A slow rotation through the table': '慢慢巡遊整張元素表',
    'A field guide to the elements': '元素野外指南',
    'Field guide · 118 elements': '元素指南 · 118 種元素',
    'Electron arrangement': '電子排布',
    'Choose a section': '選擇一個區域',
    'Five quiet ways in': '五種安靜的入口',
    'Periodic Table': '元素週期表',
    'All 118 elements, searchable and heat-mapped.': '全部 118 種元素，可搜尋、可看熱圖。',
    'Short, self-paced lessons with saved progress.': '短篇自學課程，進度會保存。',
    'Build compounds atom by atom on a quiet bench.': '在安靜的實驗台上，一顆顆原子建出化合物。',
    'Compound Index': '化合物索引',
    'Keep every compound the bench discovers.': '收藏實驗台發現的每一個化合物。',
    'A gentle twelve-stop tour of the whole site.': '十二站，慢慢逛完整個網站。',
    'Sci-lab · an independent study project': 'Sci-lab · 獨立學習計畫',
    'Progress stays on this device': '進度只留在這台裝置',
    '© 2026': '© 2026',

    /* table */
    'Explore': '探索',
    'Hover an element': '移到元素上',
    '118 entries · 18 groups': '118 個項目 · 18 族',
    'Open bench': '打開實驗台',
    'Search elements by name, symbol or number': '依名稱、符號或原子序搜尋元素',
    'Search an element': '搜尋元素',
    'Heatmap': '熱圖',
    'Off': '關閉',
    'Electronegativity': '電負度',
    'Atomic radius': '原子半徑',
    'Melting point': '熔點',
    'Boiling point': '沸點',
    'Ionisation energy': '游離能',
    'First ionisation': '第一游離能',
    'Reset': '重設',
    'Drag to turn · scroll to zoom': '拖曳旋轉 · 滾輪縮放',
    'Nothing here': '這裡沒有東西',
    'No elements match — try clearing the filters.': '沒有符合的元素——試著清除篩選。',
    'No data': '無資料',
    'Categories — click to filter': '類別——點擊篩選',
    'View': '檢視',
    'Flat': '平面',
    'Sphere': '球體',
    'Helix': '螺旋',
    'Grid': '網格',
    'Open the sandbox': '打開實驗台',

    /* element sheet */
    'Safety': '安全資訊',
    'Atomic number': '原子序',
    'Relative atomic mass': '相對原子質量',
    'most stable isotope': '最穩定同位素',
    'Electron arrangement': '電子組態',
    'Shells': '電子殼層',
    'Common oxidation states': '常見氧化態',
    'Electron configuration': '電子組態',
    'Density': '密度',
    'Discovery': '發現',
    'Oxidation states': '氧化態',
    'Emission spectrum (Wikimedia Commons)': '發射光譜（維基共享資源）',
    'Bohr model — electrons per shell from the ground state': '波耳模型——基態各殼層電子數',
    'No hazard classification': '無危害分類',
    'Still worth treating as a laboratory chemical: no eating, wash hands, avoid dust.': '仍應視為實驗室化學品：勿食、洗手、避免粉塵。',
    'Flammable': '易燃',
    'Ignites or burns readily; keep away from sparks and heat.': '容易點燃或燃燒；遠離火花與熱源。',
    'Water-reactive': '遇水反應',
    'Attacks moisture or water, releasing flammable gas and heat.': '接觸濕氣或水會放出可燃氣體與熱。',
    'Oxidiser': '氧化劑',
    'Feeds other fires; store apart from fuels and reducers.': '助長其他火焰；與燃料、還原劑分開存放。',
    'Corrosive': '腐蝕性',
    'Attacks skin, eyes and metal on contact.': '接觸會侵蝕皮膚、眼睛與金屬。',
    'Toxic': '有毒',
    'Poisonous by inhalation, ingestion or skin uptake; avoid dust and vapour.': '吸入、吞食或經皮膚吸收會中毒；避免粉塵與蒸氣。',
    'Radioactive': '放射性',
    'Ionising emission, so distance, shielding and time limits are mandatory.': '會發出游離輻射；必須保持距離、屏蔽並限制時間。',
    'Asphyxiant': '窒息性',
    'Displaces oxygen; chemically harmless, lethal in a closed room.': '排擠氧氣；化學上無害，但在密閉空間會致命。',
    'Close details': '關閉詳細資料',
    'Close ×': '關閉 ×',
    'This compound stays hidden until the bench makes it. Discover it in the sandbox and its name and formula appear here.': '這個化合物要等實驗台做出來才會揭曉。在實驗台發現它，名稱與化學式就會出現在這裡。',
    'Undiscovered compound': '未發現的化合物',
    'identity hidden': '身分隱藏',
    'variable composition': '組成可變',
    'formula unit': '化學式單位',
    'formula units': '化學式單位',
    'Element notes': '元素筆記',

    /* help */
    'Field notes': '野外筆記',
    'Find an element': '找一個元素',
    'Search by name, symbol or number, or tap any tile.': '依名稱、符號或原子序搜尋，或點任何一格。',
    'Read its card': '讀它的卡片',
    'Facts, safety notes and a Bohr model open over the table.': '事實、安全須知與波耳模型會在元素表上方打開。',
    'Build a compound': '建造化合物',
    'Add atoms on the bench, then press Combine.': '在實驗台加入原子，然後按「結合」。',
    'Keep what you make': '留住你做的東西',
    'Products save to this device and light up the index.': '產物會保存在這台裝置，並點亮索引。',
    'No account, no server — everything stays in this browser.': '不用帳號、不用伺服器——一切都留在這個瀏覽器。',
    'Got it': '知道了',
    'Close help': '關閉說明',

    /* tour */
    'Step 1 of 12': '第 1 站，共 12 站',
    'Skip tour': '跳過導覽',
    'Back': '上一步',
    'Next': '下一步',

    /* courses */
    'Learn': '學習',
    'Progress saved on this device': '進度保存在此裝置',
    'Study at your own pace': '按自己的步調學習',
    'A short curriculum, in plain language.': '用平實語言寫成的小課程。',
    'Beginner, intermediate and advanced courses in chemistry — each broken into small sections you can finish in a sitting. Progress stays in this browser.': '初級、中級與高級化學課程，每門都切成能在一次坐下時完成的小節。進度保存在這個瀏覽器。',
    'Overall progress': '整體進度',
    'Overall course progress': '整體課程進度',
    '10 short sections': '10 個小節',
    'Interactive quiz': '互動測驗',
    'Fig. 02 · measured, twice': '圖 02 · 量兩次',
    'Beginner': '初級',
    'Intermediate': '中級',
    'Advanced': '高級',
    'Foundations': '基礎',
    'Reactions': '反應',
    'Physical chemistry': '物理化學',
    '1 course': '1 門課程',
    '2 courses': '2 門課程',
    '1 course planned': '1 門課程規劃中',
    'Measurement, Units, and Significant Figures': '測量、單位與有效數字',
    'Read a measurement correctly, convert units with confidence and round every answer to the right number of significant figures.': '正確讀出測量值、有信心地換算單位，並把每個答案四捨五入到正確的有效數字。',
    'Chemical Reactions and Stoichiometry': '化學反應與計量',
    'Balance equations, read the mole and predict how much product a reaction can make.': '平衡方程式、讀懂莫耳，並預測反應能產生多少產物。',
    'Thermochemistry and Equilibrium': '熱化學與平衡',
    'Follow energy through a reaction and see how systems settle at equilibrium.': '追蹤反應中的能量，並看系統如何達到平衡。',
    'Atomic Structure and Electron Configuration': '原子結構與電子組態',
    'Build the atom from its particles, then follow electrons into shells, subshells and orbitals.': '從粒子開始建造原子，再跟著電子進入殼層、次殼層與軌域。',
    'Periodic Trends': '週期趨勢',
    'Read the table like a map: how size, ionisation energy and electronegativity shift across periods and down groups.': '把週期表當成地圖：尺寸、游離能與電負度如何橫向與縱向改變。',
    'Chemical Bonding': '化學鍵',
    'Why atoms join: ionic transfer, covalent sharing, metallic seas and the forces that hold molecules together.': '原子為何結合：離子轉移、共價共享、金屬海，以及把分子聚在一起的作用力。',
    'States of Matter and Phase Changes': '物質狀態與相變',
    'From crystal lattices to supercritical fluids: why solids hold, liquids flow, gases fill and matter changes phase.': '從晶格到超臨界流體：固體為何成形、液體為何流動、氣體為何充滿容器，以及物質如何改變狀態。',
    'Chemical Reactions and Reaction Types': '化學反應與反應類型',
    'Read an equation, balance it and name what happened: synthesis, decomposition, replacement, combustion and redox.': '讀方程式、平衡它，並說出發生了什麼：合成、分解、取代、燃燒與氧化還原。',
    'Beginner · Matter': '初級 · 物質',
    'Beginner · Reactions': '初級 · 反應',
    '6 courses': '6 門課程',
    'Stoichiometry and the Mole Concept': '計量與莫耳概念',
    'Count particles by weighing them, balance equations and predict the limiting reactant and the yield.': '用稱重來數粒子、平衡方程式，並預測限量反應物與產率。',
    'Electrolysis': '電解',
    'Drive non-spontaneous redox with current, choose the ion that discharges and calculate what deposits.': '用電流驅動非自發的氧化還原，判斷哪個離子放電，並計算析出量。',
    'Beginner · Foundations': '初級 · 基礎',
    'Intermediate · Reactions': '中級 · 反應',
    'Advanced · Electrochemistry': '高級 · 電化學',
    'Intermediate course': '中級課程',
    'Advanced course': '高級課程',
    '11 sections': '11 小節',
    'About 35 min': '約 35 分鐘',
    'About 45 min': '約 45 分鐘',
    '4 courses': '4 門課程',
    'Clear quiz answers': '清除測驗答案',
    'Planned course': '規劃中的課程',
    'Coming soon': '即將推出',
    'In preparation': '準備中',
    '10 sections': '10 小節',
    '13 sections': '13 小節',
    'About 40 min': '約 40 分鐘',
    'About 50 min': '約 50 分鐘',
    'Start course': '開始課程',
    'Continue course': '繼續課程',
    'Review course': '複習課程',
    'All courses': '所有課程',
    'Beginner course': '初級課程',
    'Reset progress': '重設進度',
    'Press again to reset': '再按一次重設',
    'Progress reset': '進度已重設',
    'No progress yet': '尚未有進度',
    'A practical first course in reading measurements, converting units and keeping significant figures honest.': '第一門實用課程：讀測量、換單位，讓有效數字保持誠實。',
    'Worked examples': '例題',
    'Progress saved': '進度已保存',
    'Sections': '小節',
    'Course sections': '課程小節',
    'Course progress': '課程進度',
    'Mark as complete': '標記完成',
    'Completed': '已完成',
    'Saved in this browser': '保存在此瀏覽器',
    'End of course': '課程結束',
    'Back to all courses': '回到所有課程',
    'Back to top': '回到頂端',
    'Toggle section': '展開或收起小節',
    'to': '至',
    'Section': '小節',
    'Correct.': '正確。',
    'Not quite — try another option.': '還不對——再試另一個選項。',
    'Answers are saved on this device.': '答案保存在此裝置。',
    'Clear answers': '清除答案',
    'sections complete': '小節完成',
    'quiz correct': '題答對',
    'Quiz': '測驗',
    'Question': '題目',
    'of': '/',
    'All': '全部',
    'correct': '答對',
    'is complete.': '已完成。',
    'Mark each section as you finish it.': '每完成一節就標記一次。',
    '1 day': '1 天',
    'Daily streak': '每日連續',

    /* profile */
    'Notebook': '筆記本',
    'Profile': '個人檔案',
    'Profile and favorites': '個人檔案與收藏',
    'Saved on this device': '保存在此裝置',
    'Field notebook': '野外筆記',
    'Your quiet record of': '靜靜記錄你的',
    'curiosity.': '好奇心。',
    'A daily streak, a shelf of badges and every element or compound you have starred — kept in this browser, never on a server.': '每日連續、一排徽章，以及你收藏的每一個元素或化合物——全都留在這個瀏覽器，不會上傳到伺服器。',
    'day streak': '連續天數',
    'Best: 1 day': '最佳：1 天',
    'Your totals': '你的總計',
    'Compounds discovered': '已發現化合物',
    'Products saved': '已保存產物',
    'Checks answered': '已答測驗',
    'Favorites': '我的收藏',
    'Milestones': '里程碑',
    'Achievements': '成就',
    '0 of 6': '0 / 6',
    'Saved': '已收藏',
    '0 starred': '0 個收藏',

    /* notes */
    'Notes': '筆記',
    'Course pads and loose pages': '課程筆記本與自由頁面',
    'Six quiet ways in': '六種安靜的入口',
    'Field Notes': '野外筆記',
    'A pad for every course, and a loose page for anything else.': '每門課一本筆記，其餘寫在自由頁面。',
    'Saved notes': '已存筆記',
    'Title': '標題',
    'Note': '筆記',
    'A title for this page': '為這一頁取個標題',
    "Write it while it's fresh…": '趁記憶還新鮮，寫下來⋯',
    'New page': '新頁面',
    'Start a note': '開始寫一則筆記',
    'Loose page': '自由頁面',
    'All notes': '所有筆記',
    'Loose pages': '自由頁面',
    'Filter notes': '篩選筆記',
    'No notes yet.': '還沒有筆記。',
    '0 notes': '0 則筆記',
    'A pad for each course, and a loose page for everything else. Your notes stay in this browser — never on a server.': '每門課一本筆記，其餘寫在自由頁面。筆記只留在這個瀏覽器——不會上傳到伺服器。',

    /* sandbox */
    'Build': '建造',
    'The Bench': '實驗台',
    'Workspace': '工作區',
    'Reaction mixture': '反應混合物',
    'Reaction mixture. Drop elements here.': '反應混合物。把元素拖到這裡。',
    'Empty bench': '空實驗台',
    'Drag an element onto the bench.': '把元素拖到實驗台上。',
    'Nothing on the bench yet.': '實驗台上還沒有東西。',
    'Add a few atoms, then press Combine.': '加幾顆原子，然後按「結合」。',
    'Combine': '結合',
    'Auto': '自動',
    'Alloy': '合金',
    'Ionic': '離子',
    'Covalent': '共價',
    'Clear bench': '清空實驗台',
    'Elements': '元素',
    'Drag to add · click to inspect': '拖曳加入 · 點擊查看',
    'Element palette': '元素面板',
    'Full details': '完整資料',
    'Challenges': '挑戰',
    '0 / 7': '0 / 7',
    'Field notebook · theory, not recipes': '野外筆記 · 理論，不是配方',
    'Field notebook · hints, not answers': '野外筆記 · 只給提示，不給答案',
    'The discovery manual': '探索手冊',
    'Read the rule, make a prediction, then test it on the bench. Every catalogued compound and alloy is reachable from these clues.': '讀提示、做預測，再到實驗台測試。每個化合物與合金都能靠這些線索找到。',
    'Short hints for every compound and alloy. The bench is the answer key.': '每個化合物與合金的短提示。答案要自己在實驗台上找。',
    'Catalogued products discovered': '已發現的目錄產物',
    'found': '已找到',
    'Hide manual': '收起手冊',
    'Open manual': '打開手冊',
    'Not quite': '差一點',
    'That mixture does not form a product here. Change the atoms and try again.': '這個組合在這裡不會形成產物。換幾顆原子再試一次。',
    'Add a few atoms, then press Combine.': '加幾顆原子，然後按「結合」。',
    'Diatomic element': '雙原子元素',
    'Ionic compound': '離子化合物',
    'Covalent compound': '共價化合物',
    'Alloy': '合金',
    'Compound': '化合物',
    'Challenge complete —': '挑戰完成——',
    'No product formed — change the atoms and try again.': '沒有形成產物——換幾顆原子再試一次。',
    'Click an element to read what it is, how it behaves and where it is used. Drag it onto the bench to add an atom.': '點一個元素，讀它是什麼、有什麼性質、用在哪裡。把它拖到實驗台上就能加入一顆原子。',
    'Mass': '質量',
    'Oxidation': '氧化態',
    'at 25 °C': '在 25 °C',
    'Remove': '移除',
    'Drag one': '拖曳一顆',
    'atom to the bench; press Enter to add one': '原子到實驗台；按 Enter 加入一顆',
    'Clear the bench': '清空實驗台',
    'Saved in this browser': '保存在此瀏覽器',

    /* compound index */
    'Collect': '收藏',
    '0 of 61 discovered': '已發現 0 / 61',
    'Field guide': '野外指南',
    'Every compound the bench can make.': '實驗台能做出的每一個化合物。',
    'Every product the bench saves is kept here. Build one to reveal its name.': '實驗台保存的每一個產物都會收在這裡。做出一個，就能揭曉它的名字。',
    'Open the sandbox': '打開實驗台',
    'Discovered': '已發現',
    'Undiscovered': '未發現',
    'Undiscovered compound': '未發現的化合物',
    'Compound index': '化合物索引',
    'Hint': '提示',
    'Properties': '性質',
    'Composition': '組成',
    'Compound type': '化合物類型',
    'Molar mass': '莫耳質量',
    'Ion ratio': '離子比',
    'How it forms': '如何形成',
    'On the bench': '實驗台上',
    'Saved': '已保存',
    'full details': '完整資料',
    'open the sandbox': '打開實驗台',
    'remove from my products': '從我的產物中移除',
    'done': '完成',
    'Variable — an alloy has no fixed formula': '可變——合金沒有固定化學式',
    'Atoms in formula': '化學式中的原子數',
    'Elements involved': '涉及元素',
    'variable': '可變',
    'This compound stays hidden until the bench makes it. Discover it in the sandbox and its name and formula appear here.': '這個化合物要在實驗台做出來才會揭曉。到實驗台發現它，名稱與化學式就會出現在這裡。',
    'Unknown alloy': '未知合金',
    'Unknown ionic compound': '未知離子化合物',
    'Unknown covalent compound': '未知共價化合物',
    'Unknown compound': '未知化合物',

    /* categories */
    'alkali metal': '鹼金屬',
    'alkaline earth metal': '鹼土金屬',
    'transition metal': '過渡金屬',
    'post-transition metal': '後過渡金屬',
    'metalloid': '類金屬',
    'reactive nonmetal': '活性非金屬',
    'halogen': '鹵素',
    'noble gas': '稀有氣體',
    'lanthanide': '鑭系元素',
    'actinide': '錒系元素',
    'unknown properties': '性質未知',
    'solid': '固態',
    'liquid': '液態',
    'gas': '氣態',
    'unknown state': '狀態未知',
    'group': '族',
    'period': '週期',
    'f-block': 'f 區',
    'at 25 °C': '在 25 °C',
  };

  const ELEMENT_ZH = {
    H: '氫', He: '氦', Li: '鋰', Be: '鈹', B: '硼', C: '碳', N: '氮', O: '氧', F: '氟', Ne: '氖',
    Na: '鈉', Mg: '鎂', Al: '鋁', Si: '矽', P: '磷', S: '硫', Cl: '氯', Ar: '氬', K: '鉀', Ca: '鈣',
    Sc: '鈧', Ti: '鈦', V: '釩', Cr: '鉻', Mn: '錳', Fe: '鐵', Co: '鈷', Ni: '鎳', Cu: '銅', Zn: '鋅',
    Ga: '鎵', Ge: '鍺', As: '砷', Se: '硒', Br: '溴', Kr: '氪', Rb: '銣', Sr: '鍶', Y: '釔', Zr: '鋯',
    Nb: '鈮', Mo: '鉬', Tc: '鎝', Ru: '釕', Rh: '銠', Pd: '鈀', Ag: '銀', Cd: '鎘', In: '銦', Sn: '錫',
    Sb: '銻', Te: '碲', I: '碘', Xe: '氙', Cs: '銫', Ba: '鋇', La: '鑭', Ce: '鈰', Pr: '鐠', Nd: '釹',
    Pm: '鉕', Sm: '釤', Eu: '銪', Gd: '釓', Tb: '鋱', Dy: '鏑', Ho: '鈥', Er: '鉺', Tm: '銩', Yb: '鐿',
    Lu: '鑥', Hf: '鉿', Ta: '鉭', W: '鎢', Re: '錸', Os: '鋨', Ir: '銥', Pt: '鉑', Au: '金', Hg: '汞',
    Tl: '鉈', Pb: '鉛', Bi: '鉍', Po: '釙', At: '砈', Rn: '氡', Fr: '鍅', Ra: '鐳', Ac: '錒', Th: '釷',
    Pa: '鏷', U: '鈾', Np: '錼', Pu: '鈽', Am: '鋂', Cm: '鋦', Bk: '鉳', Cf: '鉲', Es: '鑀', Fm: '鐨',
    Md: '鍆', No: '鍩', Lr: '鐒', Rf: '鑪', Db: '𨧀', Sg: '𨭎', Bh: '𨨏', Hs: '𨭆', Mt: '䥑',
    Ds: '鐽', Rg: '錀', Cn: '鎶', Nh: '鉨', Fl: '鈇', Mc: '鏌', Lv: '鉝', Ts: '鿬', Og: '鿫',
  };

  /* one compact Chinese note per element: what it is, one use, one fact */
  const ELEMENT_DESC_ZH = {
    H: '宇宙中最輕、最豐富的元素；無色易燃氣體，用於煉油、製氨與燃料電池。',
    He: '無色惰性氣體，沸點最低；冷卻 MRI 磁鐵、保護焊接電弧，也用於氣球。',
    Li: '柔軟的銀色鹼金屬，能浮在水面並緩慢反應；用於充電電池與部分藥物。',
    Be: '淺色、堅硬又輕的金屬，能穿透 X 射線且耐高溫；用於航太零件。鈹粉塵劇毒。',
    B: '深色硬類金屬，常溫下導電性差；強化硼矽玻璃，吸收中子，用於控制棒。',
    C: '能形成最多化合物的非金屬；以石墨、鑽石、石墨烯存在，是生命與鋼的骨架。',
    N: '無色、大致惰性的氣體，約占空氣五分之四；堅固的三鍵需高能量才能打斷。',
    O: '無色氣體，約占空氣五分之一；支持呼吸、燃燒與生鏽，液氧可作火箭燃料。',
    F: '淡黃綠色、反應性最強的元素；侵蝕玻璃與水，需特殊設備處理。',
    Ne: '無色惰性氣體，放電時發橙紅光；用於霓虹燈與高壓指示燈。',
    Na: '柔軟銀色金屬，遇水劇烈反應，須存於油中；食鹽的一半，也是神經訊號要角。',
    Mg: '輕盈銀色金屬，燃燒時發出耀眼白光；用於輕合金與煙火，也是葉綠素的核心。',
    Al: '地殼中最豐富的金屬；輕、強且靠氧化膜抗腐蝕，用於易開罐、飛機與電線。',
    Si: '堅硬易碎的類金屬，地殼含量第二；晶片與太陽能板的基底，氧化物就是沙。',
    P: '反應性非金屬，有多種同素異形體；紅磷用於火柴，也是 DNA 與骨骼的必需元素。',
    S: '黃色易碎非金屬，常見於火山與地下礦床；用於製硫酸與硫化橡膠。',
    Cl: '黃綠色、有刺鼻味的強氧化氣體；消毒飲用水、漂白紙張，並製造多種塑膠。',
    Ar: '空氣中最豐富的稀有氣體，完全惰性；填充燈泡、保護焊接電弧。',
    K: '柔軟銀色鹼金屬，遇水起火；神經訊號與肌肉收縮必需，也是肥料的主要成分。',
    Ca: '柔軟活潑的銀色金屬，自然界中不以單質存在；構成骨骼、貝殼與水泥。',
    Sc: '輕盈銀色過渡金屬，月球上比地球更豐富；強化航太鋁合金，也用於鹵化物燈。',
    Ti: '強韌、輕盈且抗腐蝕的金屬；氧化物惰性且生物相容，用於植入物與防曬。',
    V: '堅硬銀色過渡金屬，以女神 Vanadis 命名；少量可強化鋼材，也用於催化劑。',
    Cr: '光亮堅硬的過渡金屬，賦予不鏽鋼抗鏽能力；電鍍裝飾，化合物可作顏料。',
    Mn: '堅硬易碎的過渡金屬，煉鋼必需；也位於植物分解水的放氧複合物中。',
    Fe: '銀色過渡金屬，地球核心的主要成分；血紅素攜氧、構成鋼鐵，使用已數千年。',
    Co: '堅硬磁性的過渡金屬，自古用於染藍玻璃；參與維生素 B12，強化超合金。',
    Ni: '銀色抗腐蝕的過渡金屬；電鍍其他金屬、強化不鏽鋼，也用於充電電池。',
    Cu: '偏紅的過渡金屬，人類最早使用的金屬之一；導電導熱極佳，接觸可殺菌。',
    Zn: '藍白色金屬，易氧化而能犧牲保護鋼材；多種酵素必需，氧化鋅是防曬顏料。',
    Ga: '柔軟銀色金屬，熔點略高於室溫，能在手中融化；氮化物製藍光 LED。',
    Ge: '易碎類金屬，造就第一批電晶體；今用於光纖與紅外光學，門得列夫曾預言。',
    As: '著名毒物，也用作半導體摻雜劑；地下水中的砷是嚴重的健康危害。',
    Se: '對光敏感的非金屬，光照下導電性更佳；曾用於影印機，今為微量營養素。',
    Br: '深紅棕色液體，常溫下僅有的兩種液態元素之一；化合物用於阻燃劑與藥物。',
    Kr: '比空氣重的無色稀有氣體；填充高性能窗戶與準分子雷射，曾用於閃光燈。',
    Rb: '柔軟銀色鹼金屬，在空氣中點燃、遇水爆炸；用於原子鐘與部分電子元件。',
    Sr: '柔軟銀色鹼土金屬；讓煙火呈鮮紅色，也會隨鈣進入骨骼。鍶-90 具放射性。',
    Y: '銀色過渡金屬，常與稀土並列；用於雷射晶體與白光 LED 螢光粉。',
    Zr: '強韌抗腐蝕的過渡金屬，能耐反應爐中子；包覆核燃料棒，也用於陶瓷。',
    Nb: '柔軟灰色過渡金屬，低溫下超導；製造 MRI 與加速器磁鐵，並強化鋼材。',
    Mo: '堅硬銀色過渡金屬，熔點極高；強化鋼材、作固體潤滑劑，也是固氮酵素要角。',
    Tc: '銀色放射性過渡金屬，無穩定同位素；第一個人造元素，同位素用於醫學掃描。',
    Ru: '堅硬抗腐蝕的鉑族金屬；硬化電接點、催化工業反應，也用於太陽能電池。',
    Rh: '銀白色、極抗腐蝕的鉑族金屬；汽車廢氣與化工的關鍵催化劑，價格昂貴。',
    Pd: '柔軟銀色鉑族金屬，能吸收大量氫；催化廢氣與有機反應，也用於珠寶。',
    Ag: '明亮柔軟的過渡金屬，導電導熱性最佳；用於珠寶、鏡子、太陽能板，遇硫變黑。',
    Cd: '柔軟藍白色有毒金屬；曾用於電池與顏料，因傷腎損骨而受限。',
    In: '極柔軟的銀色金屬，可用刀切割；氧化銦透明又導電，驅動觸控螢幕。',
    Sn: '柔軟銀色金屬，數千年來與銅合金化為青銅；鍍鋼罐、製焊料，低溫下會碎化。',
    Sb: '易碎銀色類金屬，古埃及曾用作眼妝；強化鉛合金、作阻燃劑，化合物有毒。',
    Te: '稀有銀白色類金屬、半導體；用於薄膜太陽能與可重寫光碟。',
    I: '有光澤的深紫色非金屬，昇華成紫色蒸氣；甲狀腺荷爾蒙必需，也用於消毒。',
    Xe: '沉重的無色稀有氣體，特殊條件下能成化合物；用於離子推進器與高強度燈。',
    Cs: '柔軟金色鹼金屬，熔點略高於室溫、遇水爆炸；原子鐘以它定義秒。',
    Ba: '柔軟銀色鹼土金屬，遇水反應；硫酸鋇作 X 射線顯影劑，煙火中呈綠色。',
    La: '柔軟銀色鑭系元素，開啟稀土系列；用於鏡頭、儲氫合金與鎳氫電池。',
    Ce: '柔軟灰色鑭系元素，最豐富的稀土；拋光玻璃、淨化廢氣，打火石中會冒火花。',
    Pr: '柔軟銀色鑭系元素，使護目鏡與玻璃呈黃綠色；強化永久磁鐵與引擎合金。',
    Nd: '銀色鑭系元素，能造出最強的永久磁鐵；驅動喇叭、硬碟與電動馬達。',
    Pm: '無穩定同位素的放射性鑭系元素；曾用於發光錶盤，今研究用於核電池。',
    Sm: '銀色鑭系元素，能造出耐高溫磁鐵；釤鈷磁鐵用於航太與軍事設備。',
    Eu: '銀色鑭系元素，提供螢幕與螢光燈的紅光；也用於歐元防偽墨。',
    Gd: '具強磁性的銀色鑭系元素；化合物能銳化 MRI 影像，並在反應爐中吸收中子。',
    Tb: '柔軟銀色鑭系元素，使螢光粉發綠光；用於固態元件與磁致伸縮合金。',
    Dy: '銀色鑭系元素，讓磁鐵在高溫下仍保有磁性；添加於電動車與風機磁鐵。',
    Ho: '柔軟銀色鑭系元素，磁矩數一數二高；用於外科雷射與強磁場研究。',
    Er: '銀色鑭系元素，能放大光纖中的光；鉺摻雜放大器讓網路訊號跨越大洋。',
    Tm: '最稀少的穩定稀土元素；用於攜帶式 X 射線源與部分雷射。',
    Yb: '柔軟銀色鑭系元素，用於超精密原子鐘；也能強化不鏽鋼並用於雷射。',
    Lu: '堅硬銀色鑭系元素，系列的最後一員；用於 PET 偵測晶體與石油裂解催化劑。',
    Hf: '光亮的過渡金屬，耐腐蝕且吸收中子；用於反應爐控制棒與高效能晶片。',
    Ta: '堅硬抗腐蝕的過渡金屬；製造電子電容器與外科植入物，也耐化學腐蝕。',
    W: '熔點最高的金屬之一，堅硬且密度大；用於燈絲、切削工具與穿甲彈。',
    Re: '稀有且熔點極高的過渡金屬；用於噴射引擎葉片、熱電偶與催化劑。',
    Os: '密度最大的元素之一，堅硬易碎；用於筆尖、電接點與合金，粉末有毒。',
    Ir: '極抗腐蝕的鉑族金屬，密度很高；用於火星塞、坩堝與催化劑。',
    Pt: '沉重、抗腐蝕的貴金屬；催化汽車廢氣與化工反應，也用於珠寶與藥物。',
    Au: '沉重柔軟的黃色金屬，不會失去光澤；數千年來用於貨幣與珠寶，也是可靠接點。',
    Hg: '常溫下唯一的液態金屬；蒸氣會傷害神經與腎臟，今已大幅受限。',
    Tl: '柔軟灰色後過渡金屬，無味卻劇毒；曾作滅鼠藥，今用於紅外線偵測。',
    Pb: '柔軟沉重的藍灰色金屬，易於加工；能屏蔽輻射、製電池，但會損害神經。',
    Bi: '易碎的粉白色後過渡金屬，最重的近穩定元素；形成彩色晶體，也用於胃藥。',
    Po: '居禮夫婦發現的稀有放射性後過渡金屬；放射線極強，用於靜電消除與熱源。',
    At: '自然界最稀有的元素，地殼中任何時刻僅有數克；極不穩定，主要供研究。',
    Rn: '無色放射性稀有氣體，會從土壤滲入建築；衰變產物是重要的室內致癌物。',
    Fr: '高度放射性的鹼金屬，僅以短暫痕跡存在；是最不穩定的天然元素之一。',
    Ra: '銀白色放射性鹼土金屬；曾用於發光塗料，卻造成致命中毒，今多用於研究。',
    Ac: '柔軟銀色放射性錒系元素，黑暗中微微發藍光；用於標靶 α 粒子治療。',
    Th: '銀色、弱放射性的錒系元素，比鈾更豐富；曾用於氣燈紗罩，今被視為核燃料。',
    Pa: '稀有、高度放射性的錒系元素，從鈾礦中提取；是鈾衰變鏈的一環。',
    U: '沉重銀色放射性錒系元素；可裂變的 U-235 驅動反應爐與武器。',
    Np: '放射性錒系元素，第一個被製造出的超鈾元素；在反應爐中形成。',
    Pu: '放射性錒系元素，因持續衰變而摸起來溫熱；用於核武、燃料與太空電源。',
    Am: '放射性錒系元素，用於家用煙霧偵測器；α 粒子使空氣游離而觸發警報。',
    Cm: '以居禮夫婦命名的放射性錒系元素；為火星探測器的儀器燈供能。',
    Bk: '以加州柏克萊命名的放射性錒系元素；僅在研究反應爐中以極少量製造。',
    Cf: '放射性錒系元素，是強力的中子發射源；用於啟動反應爐與探測油井。',
    Es: '以愛因斯坦命名的放射性錒系元素；是最後一個能以可秤量數量製造的元素。',
    Fm: '以費米命名的高度放射性錒系元素；曾在氫彈殘骸中發現，今僅供研究。',
    Md: '以門得列夫命名的放射性錒系元素；只能一次製造一個原子。',
    No: '以諾貝爾命名的放射性錒系元素；僅能製造極少量，沒有商業用途。',
    Lr: '結束錒系系列的放射性元素；逐原子製造，化學性質仍在研究中。',
    Rf: '高度放射性的合成過渡金屬，是鋯的較重親戚；在加速器中逐原子製造。',
    Db: '第 5 族的高度放射性合成過渡金屬；逐原子製造，性質依理論推測。',
    Sg: '第 6 族的高度放射性合成過渡金屬；在實驗中表現得像鎢。',
    Bh: '第 7 族的高度放射性合成過渡金屬；數秒內衰變，從未被大量製造。',
    Hs: '第 8 族的高度放射性合成過渡金屬；能形成類似鋨的揮發性氧化物。',
    Mt: '第 9 族的高度放射性合成元素；僅製造過極少數原子，沒有實際用途。',
    Ds: '第 10 族的高度放射性合成元素；至今只製造過幾個原子。',
    Rg: '第 11 族的高度放射性合成元素；在加速器中逐原子製造，半衰期極短。',
    Cn: '第 12 族的高度放射性合成元素；相對論效應可能使它成為揮發性液體。',
    Nh: '第 13 族的高度放射性合成元素；透過核碰撞製造，迅速衰變。',
    Fl: '第 14 族的高度放射性合成元素；化學性質可能偏向稀有氣體。',
    Mc: '第 15 族的高度放射性合成元素；不到一秒就衰變，沒有實際用途。',
    Lv: '第 16 族的高度放射性合成元素；在加速器中製造，只能靠衰變產物研究。',
    Ts: '第 17 族的高度放射性合成元素；電腦模型推測它可能比碘更具金屬性。',
    Og: '第 18 族的高度放射性合成元素；理論計算推測它可能是固體，而非氣體。',
  };

  const COMPOUND_ZH = {
    water: '水',
    'carbon-dioxide': '二氧化碳',
    'carbon-monoxide': '一氧化碳',
    methane: '甲烷',
    ammonia: '氨',
    'hydrogen-chloride': '氯化氫',
    'hydrogen-fluoride': '氟化氫',
    'hydrogen-sulfide': '硫化氫',
    'hydrogen-peroxide': '過氧化氫',
    'sulfur-dioxide': '二氧化硫',
    'sulfur-trioxide': '三氧化硫',
    'nitric-oxide': '一氧化氮',
    'nitrogen-dioxide': '二氧化氮',
    'nitrous-oxide': '氧化亞氮',
    'silicon-dioxide': '二氧化矽',
    'carbon-tetrachloride': '四氯化碳',
    'phosphorus-trichloride': '三氯化磷',
    'sulfuric-acid': '硫酸',
    'nitric-acid': '硝酸',
    'sodium-chloride': '氯化鈉',
    'potassium-chloride': '氯化鉀',
    'potassium-bromide': '溴化鉀',
    'sodium-iodide': '碘化鈉',
    'magnesium-oxide': '氧化鎂',
    'calcium-oxide': '氧化鈣',
    'sodium-oxide': '氧化鈉',
    'aluminium-oxide': '氧化鋁',
    'iron-ii-oxide': '氧化亞鐵',
    'iron-iii-oxide': '氧化鐵',
    'iron-ii-iii-oxide': '四氧化三鐵',
    'copper-ii-oxide': '氧化銅(II)',
    'copper-i-oxide': '氧化亞銅',
    'zinc-oxide': '氧化鋅',
    'titanium-dioxide': '二氧化鈦',
    'calcium-chloride': '氯化鈣',
    'magnesium-chloride': '氯化鎂',
    'aluminium-chloride': '氯化鋁',
    'silver-nitrate': '硝酸銀',
    'sodium-hydroxide': '氫氧化鈉',
    'calcium-hydroxide': '氫氧化鈣',
    'sodium-carbonate': '碳酸鈉',
    'sodium-bicarbonate': '碳酸氫鈉',
    'calcium-carbonate': '碳酸鈣',
    'ammonium-chloride': '氯化銨',
    'barium-chloride': '氯化鋇',
    'lead-ii-oxide': '氧化鉛(II)',
    'chromium-iii-oxide': '氧化鉻(III)',
    'manganese-dioxide': '二氧化錳',
    'copper-ii-sulfate': '硫酸銅(II)',
    'potassium-permanganate': '過錳酸鉀',
    'sodium-phosphate': '磷酸鈉',
    'calcium-phosphate': '磷酸鈣',
    brass: '黃銅',
    bronze: '青銅',
    'stainless-steel': '不鏽鋼',
    duralumin: '硬鋁',
    solder: '焊錫',
    electrum: '琥珀金',
    invar: '因瓦合金',
    nitinol: '鎳鈦記憶合金',
    amalgam: '銀汞合金',
  };

  const COMPOUND_TEXT_ZH = {
    water: {
      description: '構成海洋、雨水與每個活細胞的分子。它有極性、能溶解鹽類，沸點以它的體積而言異常地高。氫鍵讓冰的結構比液態水更疏鬆，所以冰會浮在水面。',
      formation: '兩顆氫原子與一顆氧共用電子，分子彎曲成約 104.5 度。',
      properties: '無色液體；在 100 °C 沸騰；結冰時膨脹。',
      why: '氧需要兩個電子，每顆氫能共用一個。兩顆氫以一個角度接到一顆氧上，形成 H₂O。',
      hint: '每顆氧原子配上兩顆最輕的原子。',
    },
    'carbon-dioxide': {
      description: '呼吸、燃燒與發酵產生的無色氣體。植物在光合作用中使用它，它也會在大氣中困住熱量。固態二氧化碳（乾冰）會直接昇華成氣體。',
      formation: '一顆碳與兩顆氧各共用兩對電子，形成直線分子。',
      properties: '無色氣體；比空氣重；溶於水形成碳酸。',
      why: '碳形成四個鍵，氧形成兩個，因此一顆碳以雙鍵配上兩顆氧：O=C=O。',
      hint: '一顆碳，氧原子數是它的兩倍。',
    },
    'carbon-monoxide': {
      description: '碳在氧氣不足時燃燒產生的無色、無味、有毒氣體。它與血紅素的結合遠強於氧。工業上在鼓風爐中用來還原鐵礦。',
      formation: '一顆碳與一顆氧共用三對電子，形成很短的參鍵。',
      properties: '無色氣體；幾乎不溶於水；燃燒時呈藍色火焰。',
      why: '碳與氧分別需要四個和兩個電子；參鍵讓各一顆原子互相滿足。',
      hint: '一顆碳只配一顆氧原子。',
    },
    methane: {
      description: '最簡單的烴，也是天然氣的主要成分。它燃燒後生成二氧化碳與水，並放出大量熱。甲烷也是一種強效溫室氣體，由濕地與牲畜釋放。',
      formation: '一顆碳與四顆氫各共用一對電子。',
      properties: '無色氣體；比空氣輕；沸點 −161 °C。',
      why: '碳形成四個鍵，每顆氫形成一個，所以一顆碳剛好接四顆氫：CH₄。',
      hint: '一顆碳周圍接滿四顆氫原子。',
    },
    ammonia: {
      description: '有刺鼻氣味的氣體，用於製造肥料與清潔工業設備。它容易溶於水形成鹼性溶液。氨也是許多藥物與塑膠中氮的來源。',
      formation: '一顆氮與三顆氫共用三對電子，並保留一對孤對電子。',
      properties: '無色氣體；極易溶於水；使濕潤的石蕊試紙變藍。',
      why: '氮形成三個鍵，每顆氫形成一個，所以一顆氮配三顆氫：NH₃。',
      hint: '一顆氮配三顆氫原子。',
    },
    'hydrogen-chloride': {
      description: '在潮濕空氣中冒白煙的無色氣體，溶於水形成鹽酸。鹽酸用於清洗鋼材、加工食品與調節酸鹼值。氯化氫本身是極性共價分子，不是離子鹽。',
      formation: '氫與氯共用一對電子，形成極性很強的單鍵。',
      properties: '無色氣體；極易溶於水；溶解後形成強酸。',
      why: '氫形成一個鍵，氯形成一個鍵，所以各一顆就足夠：HCl。',
      hint: '最輕的原子與鹵素一對一配對。',
    },
    'hydrogen-fluoride': {
      description: '溶於水會形成氫氟酸、能蝕刻玻璃的無色氣體。它腐蝕性極強，必須用特殊塑膠容器處理。少量用於製造氟化合物與冷媒。',
      formation: '氫與氟共用一對電子，但氟會把電子強力拉向自己。',
      properties: '無色氣體；沸點 19.5 °C；形成弱但極腐蝕的酸。',
      why: '氫與氟都各形成一個鍵，所以比例是 1:1：HF。',
      hint: '氫與反應性最強的鹵素配對。',
    },
    'hydrogen-sulfide': {
      description: '帶有臭雞蛋味的無色氣體。它有毒性且可燃，天然存在於火山氣體與原油中。有些細菌在光合作用中以它取代水。',
      formation: '一顆硫與兩顆氫共用兩對電子。',
      properties: '無色氣體；有臭雞蛋味；可溶於水。',
      why: '硫形成兩個鍵，每顆氫形成一個，所以一顆硫配兩顆氫：H₂S。',
      hint: '一顆硫配兩顆氫原子。',
    },
    'hydrogen-peroxide': {
      description: '會分解成水與氧氣的淡藍色液體。稀釋液可消毒傷口、漂白頭髮與紙張。濃過氧化氫是強氧化劑，可能危險。',
      formation: '兩顆氧彼此成鍵，每顆氧再各接一顆氫。',
      properties: '淡藍色液體；照光會分解；強氧化劑。',
      why: '每顆氧形成兩個鍵。兩顆氧相連後各接一顆氫，形成 H₂O₂ 而不是 H₂O。',
      hint: '與水相同的兩種元素，但每顆氧只配一顆氫。',
    },
    'sulfur-dioxide': {
      description: '火山與燃煤釋放的刺鼻氣體。溶於水形成亞硫酸，也是酸雨的來源之一。它還用作乾果與葡萄酒的防腐劑。',
      formation: '一顆硫與兩顆氧共用電子，並保留一對孤對電子。',
      properties: '無色氣體；氣味刺鼻；溶於水。',
      why: '硫通常形成四個鍵，每顆氧形成兩個，所以一顆硫配兩顆氧：SO₂。',
      hint: '一顆硫配兩顆氧原子。',
    },
    'sulfur-trioxide': {
      description: '遇水劇烈反應形成硫酸的無色氣體。它是接觸法製硫酸的關鍵中間體。在潮濕空氣中會形成濃密白霧。',
      formation: '一顆硫與三顆氧共用電子，其中兩個是雙鍵。',
      properties: '無色氣體；潮濕空氣中冒煙；與水劇烈反應。',
      why: '硫用盡所有價電子時可形成六個鍵，所以一顆硫配三顆氧：SO₃。',
      hint: '一顆硫配三顆氧原子。',
    },
    'nitric-oxide': {
      description: '車輛引擎與人體內產生的無色氣體。在體內它放鬆血管並協助傳遞神經訊號。在空氣中會迅速與氧化合成棕色二氧化氮。',
      formation: '一顆氮與一顆氧共用一個雙鍵，並留下一個未成對電子。',
      properties: '無色氣體；微溶於水；迅速與氧反應。',
      why: '氮與氧各可提供兩個電子形成雙鍵，所以各一顆就足夠：NO。',
      hint: '一顆氮配一顆氧原子。',
    },
    'nitrogen-dioxide': {
      description: '讓煙霧帶有顏色的棕色有毒氣體。空氣中的一氧化氮與氧反應時形成，也是酸雨來源。它還用於製造硝酸與某些火箭推進劑。',
      formation: '一顆氮與兩顆氧共用電子，分子上留下一個奇數電子。',
      properties: '紅棕色氣體；有毒；與水反應形成硝酸。',
      why: '氮最多可形成五個鍵。與兩顆氧搭配時採 1:2 比例，並帶一個未成對電子：NO₂。',
      hint: '一顆氮配兩顆氧原子。',
    },
    'nitrous-oxide': {
      description: '用作麻醉劑與鮮奶油推進劑的無色氣體。它也是強效溫室氣體與臭氧消耗物質。吸入會引人發笑與麻木，因此又叫笑氣。',
      formation: '兩顆氮彼此成鍵，其中一顆再與氧成鍵。',
      properties: '無色氣體；氣味微甜；助燃。',
      why: '兩顆氮與一顆氧以共振形成直線分子：N₂O。',
      hint: '每顆氧原子配上兩顆氮原子。',
    },
    'silicon-dioxide': {
      description: '由矽與氧構成的網狀固體，是石英、沙與多數玻璃的主要成分。它堅硬、不易反應、熔點極高。每顆矽在連續晶格中與四顆氧成鍵。',
      formation: '矽與氧形成巨大的共價網狀結構；實驗式比例是一矽對兩氧。',
      properties: '堅硬的無色固體；約 1710 °C 熔化；不溶於水。',
      why: '矽形成四個鍵，氧形成兩個。連續網狀結構重複最簡單的比例 SiO₂。',
      hint: '一顆矽配兩顆氧，沙子的主要成分。',
    },
    'carbon-tetrachloride': {
      description: '曾用作乾洗溶劑與滅火劑的緻密非極性液體。它有毒性且會破壞臭氧層，如今用途受到嚴格限制。四個對稱的鍵使它成為典型的非極性分子。',
      formation: '一顆碳與四顆氯在四面體中共用四對電子。',
      properties: '無色液體；緻密；非極性；有毒。',
      why: '碳形成四個鍵，每顆氯形成一個，所以一顆碳配四顆氯：CCl₄。',
      hint: '一顆碳配四顆鹵素原子。',
    },
    'phosphorus-trichloride': {
      description: '在潮濕空氣中冒煙、氣味刺鼻的無色液體。用於製造農藥、阻燃劑與某些藥物。遇水反應生成亞磷酸與氯化氫。',
      formation: '一顆磷與三顆氯共用三對電子，並保留一對孤對電子。',
      properties: '無色液體；空氣中冒煙；與水反應。',
      why: '此化合物中磷形成三個鍵，氯形成一個，所以比例是 1:3：PCl₃。',
      hint: '一顆磷配三顆氯原子。',
    },
    'sulfuric-acid': {
      description: '緻密油狀的酸，也是全球產量最大的工業化學品。用於肥料、電池與礦石處理。它是強酸，在水中會釋放兩個質子。',
      formation: '三氧化硫與水反應，在分子中加入兩顆氫與一顆氧。',
      properties: '無色油狀液體；強酸性；腐蝕性；沸點高。',
      why: '兩顆氫、一顆硫與四顆氧形成穩定的硫酸根結構，並帶兩個酸性質子。',
      hint: '兩顆氫、一顆硫與四顆氧。',
    },
    'nitric-acid': {
      description: '無色會冒煙的酸，分解時轉為黃色。用於製造肥料、炸藥與金屬硝酸鹽。它是強氧化劑，會侵蝕多數金屬。',
      formation: '二氧化氮溶於水，加入氫與氧形成硝酸根。',
      properties: '無色冒煙液體；強酸；強氧化劑。',
      why: '一顆氫、一顆氮與三顆氧形成帶一個酸性質子的硝酸結構。',
      hint: '一顆氫、一顆氮與三顆氧。',
    },
    'sodium-chloride': {
      description: '日常食鹽，礦物名為岩鹽。生命必需，能調味也能融化道路結冰。它的離子排列成立方晶格，所以鹽結晶是立方體。',
      formation: '鈉失去一個電子，氯得到一個，離子再堆疊成重複的立方晶格。',
      properties: '白色結晶固體；801 °C 熔化；熔融時導電。',
      why: '鈉形成 Na⁺，氯形成 Cl⁻。各一顆即可抵銷電荷，比例為 1:1：NaCl。',
      hint: '第 1 族金屬與鹵素，各一顆原子。',
    },
    'potassium-chloride': {
      description: '外觀像食鹽但味道苦澀的白色鹽。用作食鹽替代品與鉀肥。醫療上用於治療低血鉀。',
      formation: '鉀把一個電子給氯，形成互相吸引的 K⁺ 與 Cl⁻。',
      properties: '白色結晶固體；熔點高；熔融時導電。',
      why: '鉀形成 K⁺，氯形成 Cl⁻，各一顆即可平衡電荷：KCl。',
      hint: '第 4 週期的第 1 族金屬與鹵素。',
    },
    'potassium-bromide': {
      description: '十九世紀曾用作鎮靜劑的白色結晶鹽。如今用於攝影與某些紅外線光學。與其他溴化物一樣，它是溴離子的來源。',
      formation: '鉀把一個電子給溴，形成 K⁺ 與 Br⁻。',
      properties: '白色結晶固體；溶於水；熔點高。',
      why: '鉀形成 K⁺，溴形成 Br⁻，各一顆形成中性晶格：KBr。',
      hint: '第 4 週期第 1 族金屬與較重的鹵素。',
    },
    'sodium-iodide': {
      description: '醫療上用作碘來源、也用作輻射閃爍偵測器的白色鹽。有些國家將它加入食鹽以預防碘缺乏。它很容易溶於水。',
      formation: '鈉把一個電子轉給碘，形成 Na⁺ 與 I⁻。',
      properties: '白色結晶固體；極易溶於水；熔點高。',
      why: '鈉形成 Na⁺，碘形成 I⁻，各一顆即可平衡電荷：NaI。',
      hint: '第 1 族金屬與最重的必需鹵素。',
    },
    'magnesium-oxide': {
      description: '熔點極高的白色粉末。用於爐襯、耐火磚與胃藥。鎂在空氣中以耀眼白焰燃燒時形成。',
      formation: '鎂把兩個電子給氧，形成 Mg²⁺ 與 O²⁻。',
      properties: '白色固體；約 2852 °C 熔化；與水緩慢反應。',
      why: '鎂形成 Mg²⁺，氧形成 O²⁻。各一顆即可抵銷兩個電荷，比例 1:1：MgO。',
      hint: '第 2 族金屬與氧，各一顆原子。',
    },
    'calcium-oxide': {
      description: '又稱生石灰，是加熱石灰石得到的白色固體。遇水形成熟石灰並放出大量熱。用於水泥、煉鋼與水處理。',
      formation: '鈣把兩個電子轉給氧，形成 Ca²⁺ 與 O²⁻。',
      properties: '白色固體；熔點極高；與水劇烈反應。',
      why: '鈣形成 Ca²⁺，氧形成 O²⁻，1:1 的比例形成中性晶格：CaO。',
      hint: '第 2 族金屬與氧，各一顆原子。',
    },
    'sodium-oxide': {
      description: '遇水形成氫氧化鈉的白色固體。用於玻璃與陶瓷製造。它是鈉在有限氧氣中燃燒形成的簡單氧化物。',
      formation: '兩顆鈉各把一個電子給一顆氧。',
      properties: '白色固體；與水反應；熔點高。',
      why: '氧形成 O²⁻，需要兩個 Na⁺ 抵銷 2− 電荷。比例為 2:1：Na₂O。',
      hint: '每顆氧原子配上兩顆第 1 族金屬原子。',
    },
    'aluminium-oxide': {
      description: '礦物剛玉，微量其他金屬使其著色時成為藍寶石與紅寶石。它極硬，用作磨料與陶瓷。薄薄一層可保護鋁不被腐蝕。',
      formation: '兩顆鋁各失去三個電子，三顆氧各得到兩個。',
      properties: '白色固體；極硬；約 2072 °C 熔化；電絕緣。',
      why: '鋁形成 Al³⁺，氧形成 O²⁻。最小中性組合是 2 個 Al³⁺ 對 3 個 O²⁻：Al₂O₃。',
      hint: '每三顆氧原子配上兩顆第 13 族金屬原子。',
    },
    'iron-ii-oxide': {
      description: '又叫氧化亞鐵的黑色固體。用於陶瓷與顏料，也存在於某些隕石。它在空氣中不穩定，會慢慢氧化成氧化鐵(III)。',
      formation: '處於 +2 態的鐵把兩個電子給氧。',
      properties: '黑色固體；鹼性；空氣中會氧化。',
      why: '這裡鐵是 Fe²⁺、氧是 O²⁻，各一顆即可平衡：FeO。',
      hint: '一顆處於較低常見氧化態的鐵配一顆氧。',
    },
    'iron-iii-oxide': {
      description: '我們稱為鐵鏽的紅棕色化合物，也是赤鐵礦的主要成分。用於顏料、磁記錄與鋁熱反應。它讓火星呈紅色。',
      formation: '兩顆鐵各失去三個電子，三顆氧各得到兩個。',
      properties: '紅棕色固體；不溶於水；某些形態具磁性。',
      why: '這裡鐵是 Fe³⁺、氧是 O²⁻。電荷平衡需要 2 個 Fe³⁺ 對 3 個 O²⁻：Fe₂O₃。',
      hint: '每三顆氧原子配上兩顆 +3 態的鐵。',
    },
    'iron-ii-iii-oxide': {
      description: '礦物磁鐵礦，也是常見鐵氧化物中磁性最強者。它存在於早期航海者當作指南針的天然磁石。用於磁記錄與催化劑。',
      formation: '晶格同時含 Fe²⁺ 與 Fe³⁺，平均電荷與四顆 O²⁻ 平衡。',
      properties: '黑色固體；磁性強；熔點高。',
      why: '三個鐵離子合計 +8 電荷，正好平衡四個 O²⁻。比例為 3:4：Fe₃O₄。',
      hint: '每四顆氧原子配上三顆鐵原子。',
    },
    'copper-ii-oxide': {
      description: '用作顏料、催化劑與其他銅化合物原料的黑色固體。銅在空氣中加熱時形成。與酸反應生成藍色或綠色銅鹽。',
      formation: '處於 +2 態的銅把兩個電子給氧。',
      properties: '黑色固體；不溶於水；溶於酸。',
      why: '銅形成 Cu²⁺，氧形成 O²⁻，各一顆即可平衡：CuO。',
      hint: '一顆常見 +2 態的銅配一顆氧。',
    },
    'copper-i-oxide': {
      description: '用作顏料、殺菌劑與催化劑的紅色固體。銅在氧氣有限時加熱形成。某些古代紅玻璃的顏色就來自它。',
      formation: '兩顆銅各把一個電子給一顆氧。',
      properties: '紅色固體；不溶於水；與酸反應。',
      why: '這裡銅是 Cu⁺、氧是 O²⁻，每顆氧需要兩顆銅：Cu₂O。',
      hint: '每顆氧配上兩顆 +1 態的銅。',
    },
    'zinc-oxide': {
      description: '用於防曬乳、油漆與橡膠的白色粉末。它也是半導體與壓電材料。鋅在空氣中燃燒時形成。',
      formation: '鋅把兩個電子給氧，形成 Zn²⁺ 與 O²⁻。',
      properties: '白色固體；不溶於水；吸收紫外線。',
      why: '鋅形成 Zn²⁺，氧形成 O²⁻，比例為 1:1：ZnO。',
      hint: '一顆鋅配一顆氧原子。',
    },
    'titanium-dioxide': {
      description: '油漆、紙張與防曬乳中最亮的白色顏料。也用於光催化與某些太陽能電池。天然以金紅石、銳鈦礦與板鈦礦存在。',
      formation: '鈦失去四個電子，每顆氧各得到兩個。',
      properties: '白色固體；熔點極高；折射率高。',
      why: '鈦形成 Ti⁴⁺，氧形成 O²⁻，所以一顆鈦需要兩顆氧：TiO₂。',
      hint: '一顆鈦配兩顆氧原子。',
    },
    'calcium-chloride': {
      description: '吸水性強、能在低溫融化冰雪的白色鹽。用作融冰劑、乾燥劑與混凝土促凝劑。溶於水時會感到溫熱。',
      formation: '一顆鈣把兩個電子分別給兩顆氯。',
      properties: '白色固體；極易溶於水；易潮解。',
      why: '鈣形成 Ca²⁺，氯形成 Cl⁻。需要兩個氯離子抵銷 2+ 電荷，比例 1:2：CaCl₂。',
      hint: '每兩顆鹵素原子配一顆第 2 族金屬。',
    },
    'magnesium-chloride': {
      description: '存在於海水、用於製造鎂金屬的白色鹽。它也能融冰，某些豆腐食譜用它作凝固劑。它極易溶解並吸收空氣中的水分。',
      formation: '鎂把兩個電子分別給兩顆氯。',
      properties: '白色固體；極易溶於水；易潮解。',
      why: '鎂形成 Mg²⁺，氯形成 Cl⁻，所以兩個氯平衡一顆鎂：MgCl₂。',
      hint: '一顆第 2 族金屬配兩顆鹵素原子。',
    },
    'aluminium-chloride': {
      description: '在潮濕空氣中冒煙、在中等溫度昇華的白色固體。它是強路易斯酸，也是有機化學的催化劑。氣相時以 Al₂Cl₆ 二聚體存在。',
      formation: '一顆鋁失去三個電子，分別給三顆氯。',
      properties: '白色固體；潮濕空氣中冒煙；具催化性。',
      why: '鋁形成 Al³⁺，氯形成 Cl⁻，所以需要三個氯：AlCl₃。',
      hint: '一顆第 13 族金屬配三顆鹵素原子。',
    },
    'silver-nitrate': {
      description: '遇光變暗的無色結晶鹽。用於攝影、鏡子與消毒液。遇氯離子會形成白色氯化銀沉澱。',
      formation: '銀離子與硝酸根 NO₃⁻ 以 1:1 排列成晶格。',
      properties: '無色晶體；極易溶於水；感光。',
      why: '銀形成 Ag⁺，硝酸根帶一個負電，各一顆即可平衡：AgNO₃。',
      hint: '一種錢幣金屬配上硝酸根。',
    },
    'sodium-hydroxide': {
      description: '又稱燒鹼或苛性鈉，是溶於水會放熱的白色固體。用於製皂、造紙與煉鋁。它是強鹼且具腐蝕性。',
      formation: '鈉離子與氫氧根 OH⁻ 配對，氫氧根把氧與氫結合在一起。',
      properties: '白色固體；極易溶解；強鹼且腐蝕。',
      why: '鈉形成 Na⁺，氫氧根帶一個負電，比例 1:1：NaOH。',
      hint: '第 1 族金屬配上氫氧根。',
    },
    'calcium-hydroxide': {
      description: '又稱熟石灰或建築石灰，是把水加入生石灰得到的白色粉末。用於灰泥、石膏與水處理。它僅微溶，形成乳狀的石灰水。',
      formation: '鈣離子與兩個氫氧根配對，每個氫氧根由一顆氧與一顆氫組成。',
      properties: '白色固體；微溶；強鹼性。',
      why: '鈣形成 Ca²⁺，每個氫氧根帶一個負電，所以需要兩個 OH⁻：Ca(OH)₂。',
      hint: '一顆第 2 族金屬配兩個氫氧根。',
    },
    'sodium-carbonate': {
      description: '又稱洗滌鹼，是用於玻璃、清潔劑與軟水的白色固體。它呈弱鹼性，存在於某些乾涸湖床。自古以來就有貿易。',
      formation: '兩個鈉離子與一個碳酸根 CO₃²⁻ 配對。',
      properties: '白色固體；溶於水；鹼性。',
      why: '每個 Na⁺ 帶一個正電，碳酸根帶兩個負電，所以需要兩個鈉：Na₂CO₃。',
      hint: '兩顆第 1 族金屬配上碳酸根。',
    },
    'sodium-bicarbonate': {
      description: '小蘇打，加熱或遇酸時釋放二氧化碳的白色粉末。用於烘焙、胃藥與滅火器。它也是牙膏中的溫和磨料。',
      formation: '鈉離子與碳酸氫根 HCO₃⁻ 配對。',
      properties: '白色固體；溶於水；加熱會分解。',
      why: '鈉形成 Na⁺，碳酸氫根帶一個負電，比例 1:1：NaHCO₃。',
      hint: '第 1 族金屬配上碳酸氫根。',
    },
    'calcium-carbonate': {
      description: '礦物方解石，形成石灰岩、白堊、大理石與貝殼。用於製造水泥、紙張與胃藥。溶於酸時會放出二氧化碳而冒泡。',
      formation: '鈣離子與碳酸根 CO₃²⁻ 以 1:1 排列成晶格。',
      properties: '白色固體；不溶於水；溶於酸時冒泡。',
      why: '鈣形成 Ca²⁺，碳酸根帶兩個負電，各一顆即中性：CaCO₃。',
      hint: '第 2 族金屬配上碳酸根。',
    },
    'ammonium-chloride': {
      description: '氨與氯化氫反應形成的白色鹽。用於乾電池、焊接助焊劑與某些藥物。加熱時昇華成氨與氯化氫。',
      formation: '銨離子 NH₄⁺ 與氯離子 Cl⁻ 配對。',
      properties: '白色固體；溶於水；加熱昇華。',
      why: '銨根帶一個正電，氯帶一個負電，比例 1:1：NH₄Cl。',
      hint: '銨根配上一個鹵素。',
    },
    'barium-chloride': {
      description: '用於煙火產生綠色、也用於實驗室硫酸根檢驗的白色鹽。它可溶且有毒性，須小心處理。它形成加熱會脫水的結晶水合物。',
      formation: '一顆鋇把兩個電子分別給兩顆氯。',
      properties: '白色固體；溶於水；有毒。',
      why: '鋇形成 Ba²⁺，氯形成 Cl⁻，所以兩個氯平衡一顆鋇：BaCl₂。',
      hint: '一種重的第 2 族金屬配兩顆鹵素。',
    },
    'lead-ii-oxide': {
      description: '用於玻璃、陶瓷與鉛酸電池的黃色或紅色固體。它有毒性，用途受限。曾被稱為密陀僧並用作顏料。',
      formation: '處於 +2 態的鉛把兩個電子給氧。',
      properties: '黃色或紅色固體；不溶於水；有毒。',
      why: '鉛形成 Pb²⁺，氧形成 O²⁻，比例 1:1：PbO。',
      hint: '一種重的後過渡金屬配一顆氧。',
    },
    'chromium-iii-oxide': {
      description: '用作顏料與拋光磨料的綠色固體。它是許多綠色釉中的鉻形態。也是某些工業反應的催化劑。',
      formation: '兩顆鉻各失去三個電子，三顆氧各得到兩個。',
      properties: '綠色固體；極硬；不溶於水。',
      why: '這裡鉻是 Cr³⁺、氧是 O²⁻，最小中性組合是 2:3：Cr₂O₃。',
      hint: '每三顆氧原子配上兩顆 +3 態的鉻。',
    },
    'manganese-dioxide': {
      description: '用作鹼性電池陰極與催化劑的黑色固體。天然以軟錳礦存在，數世紀來用於玻璃脫色。它既能作氧化劑也能作還原劑。',
      formation: '處於 +4 態的錳從兩顆氧取得電子。',
      properties: '黑色固體；不溶於水；具催化性。',
      why: '這裡錳是 Mn⁴⁺、氧是 O²⁻，所以一顆錳需要兩顆氧：MnO₂。',
      hint: '一顆 +4 態的錳配兩顆氧原子。',
    },
    'copper-ii-sulfate': {
      description: '用於殺菌劑、電鍍與學校化學的藍色結晶鹽。藍色來自與銅離子結合的水分子。加熱變白，加水又變回藍色。',
      formation: '銅離子與硫酸根 SO₄²⁻ 以 1:1 排列成晶格。',
      properties: '藍色晶體；溶於水；加熱變白。',
      why: '銅形成 Cu²⁺，硫酸根帶兩個負電，各一顆即中性：CuSO₄。',
      hint: '銅離子配上硫酸根。',
    },
    'potassium-permanganate': {
      description: '深紫色晶體，也是強氧化劑。用於消毒水、治療皮膚問題與實驗室滴定。在酸性溶液中錳被還原，顏色會消失。',
      formation: '鉀離子與過錳酸根 MnO₄⁻ 配對。',
      properties: '紫色晶體；溶於水；強氧化劑。',
      why: '鉀形成 K⁺，過錳酸根帶一個負電，比例 1:1：KMnO₄。',
      hint: '第 1 族金屬配上紫色的過錳酸根。',
    },
    'sodium-phosphate': {
      description: '用於清潔劑、水處理與食品添加物的白色鹽。其溶液呈強鹼性。也是肥料的磷來源。',
      formation: '三個鈉離子與一個磷酸根 PO₄³⁻ 配對。',
      properties: '白色固體；溶於水；鹼性。',
      why: '磷酸根帶三個負電，每個鈉帶一個正電，所以需要三個鈉：Na₃PO₄。',
      hint: '三顆第 1 族金屬配上磷酸根。',
    },
    'calcium-phosphate': {
      description: '存在於骨骼、牙齒與磷礦中的礦物。用於製造肥料與食品鈣補充劑。它僅微溶於水。',
      formation: '三個鈣離子與兩個磷酸根在重複晶格中配對。',
      properties: '白色固體；不溶於水；骨骼礦物的重要成分。',
      why: '每個 Ca²⁺ 需要兩個負電，每個磷酸根帶三個負電。最小中性組合是 3 個 Ca²⁺ 對 2 個 PO₄³⁻：Ca₃(PO₄)₂。',
      hint: '三顆第 2 族金屬配上兩個磷酸根。',
    },
    brass: {
      description: '銅與鋅的黃色合金，比銅堅硬且不易失去光澤。用於水龍頭、樂器與裝飾金屬。顏色會隨鋅含量改變。',
      formation: '銅與鋅都是金屬，熔融時形成固溶體，冷卻後仍保持混合。',
      properties: '金黃色；比銅硬；耐腐蝕。',
      why: '兩種元素都是金屬，在此不形成固定離子，而是以可變組成共用金屬晶格。',
      hint: '兩種常見的錢幣與鍍鋅金屬混合。',
    },
    bronze: {
      description: '銅與錫的合金，曾為人類一整個時代命名。它比銅硬且易鑄造。現代青銅用於雕像、鐘與船舶配件。',
      formation: '銅與錫熔合，冷卻時形成固溶體。',
      properties: '紅棕色；堅硬；耐腐蝕。',
      why: '兩者都是金屬，因此以金屬晶格混合，而不是形成帶電離子。',
      hint: '銅配上造就青銅時代的金屬。',
    },
    'stainless-steel': {
      description: '含足夠鉻、能形成自我修復氧化層的鐵合金。用於餐具、手術工具與廚房設備。鉻層保護下方的鐵不生鏽。',
      formation: '鐵與鉻熔合；鉻在表面形成一層薄的鈍化氧化膜。',
      properties: '光亮；堅硬；耐腐蝕。',
      why: '兩者都是金屬。鉻不形成獨立離子，而是強化金屬晶格並產生保護性氧化物。',
      hint: '鐵配上讓它不鏽的金屬。',
    },
    duralumin: {
      description: '與銅合金化的鋁，輕盈而堅固，足以用於飛機。它對早期飛船與飛機製造至關重要。比純鋁硬，但較不耐腐蝕。',
      formation: '鋁與銅熔合，形成含強化顆粒的固溶體。',
      properties: '輕；堅固；耐腐蝕性低於純鋁。',
      why: '兩種元素都是金屬，因此以可變組成共用金屬晶格。',
      hint: '輕盈的結構金屬配上紅色導體。',
    },
    solder: {
      description: '鉛與錫的合金，熔點低且能潤濕金屬表面。數世紀來用於連接電子零件與管路。由於鉛的毒性，許多產品已改用無鉛焊錫。',
      formation: '鉛與錫在熔融狀態混合，凝固成低熔點固體。',
      properties: '灰色；熔點低；導電接觸良好。',
      why: '兩者都是金屬，因此以金屬晶格結合，而不是形成離子。',
      hint: '兩種低熔點金屬，用來連接電線。',
    },
    electrum: {
      description: '自古用於錢幣與珠寶的金銀天然合金。淡黃色澤容易與純金混淆。它存在於某些金礦床中。',
      formation: '金與銀因金屬結構相似而形成固溶體。',
      properties: '淡黃色；柔軟；不易失去光澤。',
      why: '兩者都是金屬，因此共用金屬晶格，組成可自然變化。',
      hint: '兩種經典的貴金屬錢幣材料。',
    },
    invar: {
      description: '加熱時幾乎不膨脹的鐵鎳合金。用於精密儀器、鐘擺與航太工具。名稱來自「不變」。',
      formation: '鐵與鎳在金屬晶格中混合，抑制熱膨脹。',
      properties: '灰色；熱膨脹極低；堅固。',
      why: '兩種元素都是金屬，因此形成可變組成的固溶體。',
      hint: '鐵配上用於充電電池與電鍍的金屬。',
    },
    nitinol: {
      description: '鎳與鈦的形狀記憶合金。可在低溫彎曲，加熱後回復原形。用於醫療支架、眼鏡框與太空機構。',
      formation: '鎳與鈦形成有序金屬晶格，會隨溫度改變晶體結構。',
      properties: '灰色；形狀記憶；超彈性；生物相容。',
      why: '兩者都是金屬，因此以金屬晶格混合，而不是形成獨立離子。',
      hint: '鎳配上堅固輕盈的植入金屬。',
    },
    amalgam: {
      description: '銀與汞的混合物，柔軟到能壓入蛀洞，之後硬化。牙科汞齊填補牙齒已超過一世紀。汞也會與金等其他金屬形成汞齊。',
      formation: '汞溶解銀，形成會隨時間硬化的金屬膏。',
      properties: '銀色；初軟；會硬化；導電。',
      why: '兩者都是金屬，因此汞與銀以可變組成共用金屬晶格。',
      hint: '貴金屬溶在唯一常溫液態的金屬裡。',
    },
  };

  const REVERSE = {};
  const ELEMENT_NAMES = Object.fromEntries(ELEMENTS.map((e) => [e[2], ELEMENT_ZH[e[1]] || e[2]]));
  const COMPOUND_NAMES = Object.fromEntries(COMPOUNDS.map((c) => [c.name, COMPOUND_ZH[c.id] || c.name]));
  const ALL_ZH = { ...ZH, ...ELEMENT_NAMES, ...COMPOUND_NAMES };
  Object.entries(ALL_ZH).forEach(([en, zh]) => { if (zh && !(zh in REVERSE)) REVERSE[zh] = en; });

  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'SVG']);
  const ATTRS = ['aria-label', 'title', 'placeholder', 'alt'];
  let applying = false;

  function mapValue(value) {
    const trimmed = value.trim();
    if (!trimmed) return value;
    const mapped = current === 'zh' ? ALL_ZH[trimmed] : REVERSE[trimmed];
    if (!mapped) return value;
    const lead = value.match(/^\s*/)[0];
    const tail = value.match(/\s*$/)[0];
    return `${lead}${mapped}${tail}`;
  }

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const next = mapValue(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
  }

  function translateAttrs(el) {
    ATTRS.forEach((attr) => {
      if (!el.hasAttribute(attr)) return;
      const next = mapValue(el.getAttribute(attr));
      if (next !== el.getAttribute(attr)) el.setAttribute(attr, next);
    });
  }

  function translateTree(root) {
    if (!root || applying) return;
    if (root.nodeType === Node.ELEMENT_NODE && root.closest('[data-no-i18n]')) return;
    applying = true;
    if (root.nodeType === Node.TEXT_NODE) {
      translateNode(root);
      applying = false;
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      applying = false;
      return;
    }
    if (root.nodeType === Node.ELEMENT_NODE) {
      if (SKIP.has(root.tagName) || root.classList?.contains('katex')) { applying = false; return; }
      translateAttrs(root);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (SKIP.has(node.tagName) || node.classList?.contains('katex') || node.hasAttribute('data-no-i18n')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.ELEMENT_NODE) translateAttrs(node);
      else translateNode(node);
    }
    applying = false;
  }

  function elementName(input) {
    const sym = typeof input === 'string' ? input : input?.[1];
    if (!sym) return '';
    if (isZh() && ELEMENT_ZH[sym]) return ELEMENT_ZH[sym];
    const row = typeof input === 'string' ? ELEMENTS.find((e) => e[1] === sym) : input;
    return row ? row[2] : sym;
  }

  function elementDescription(input) {
    const row = typeof input === 'string' ? ELEMENTS.find((e) => e[1] === input) : input;
    if (!row) return '';
    if (isZh() && ELEMENT_DESC_ZH[row[1]]) return ELEMENT_DESC_ZH[row[1]];
    return row[9] || row[8] || '';
  }

  function compoundName(input) {
    const id = typeof input === 'string' ? input : input?.compoundId || input?.id;
    const zh = id ? COMPOUND_ZH[id] : null;
    if (isZh() && zh) return zh;
    if (typeof input === 'object' && input?.name) return input.name;
    const entry = id ? COMPOUNDS.find((c) => c.id === id) : null;
    return entry ? entry.name : (typeof input === 'string' ? input : '');
  }

  function compoundText(input) {
    if (!isZh()) return null;
    const id = typeof input === 'string' ? input : input?.compoundId || input?.id;
    return id ? (COMPOUND_TEXT_ZH[id] || null) : null;
  }

  function categoryName(cat) {
    return isZh() ? (ZH[CATEGORIES[cat]] || CATEGORIES[cat]) : CATEGORIES[cat];
  }

  function hazardName(code) {
    const entry = HAZARDS[code];
    if (!entry) return '';
    return isZh() ? (ZH[entry[0]] || entry[0]) : entry[0];
  }

  function hazardText(code) {
    const entry = HAZARDS[code];
    if (!entry) return '';
    return isZh() ? (ZH[entry[1]] || entry[1]) : entry[1];
  }

  function stateName(state) {
    const value = state || 'unknown state';
    return isZh() ? (ZH[value] || value) : value;
  }

  function kindLabel(kind) {
    if (isZh()) return { alloy: '合金', ionic: '離子化合物', covalent: '共價化合物' }[kind] || '化合物';
    return SB?.KIND_LABEL?.[kind] || 'Compound';
  }

  function paintToggle() {
    const btn = document.getElementById('nav-lang');
    if (!btn) return;
    const label = btn.querySelector('.lang-toggle-text');
    if (label) label.textContent = isZh() ? '繁' : 'EN';
    btn.setAttribute('aria-pressed', String(isZh()));
    btn.setAttribute('aria-label', isZh() ? '切換至英文' : 'Switch to Traditional Chinese');
    btn.setAttribute('title', isZh() ? '語言：繁體中文' : 'Language: English');
  }

  function setLang(next) {
    if (!SUPPORTED.has(next) || next === current) return;
    current = next;
    try { localStorage.setItem(KEY, current); } catch (error) { /* session-only is fine */ }
    document.documentElement.lang = isZh() ? 'zh-Hant' : 'en';
    document.title = isZh() ? 'Sci-lab — 元素野外指南' : 'Sci-lab — a field guide to the elements';
    translateTree(document.body);
    paintToggle();
    document.dispatchEvent(new CustomEvent('scilamp:lang', { detail: { lang: current } }));
  }

  function bind() {
    const btn = document.getElementById('nav-lang');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => setLang(isZh() ? 'en' : 'zh'));
    paintToggle();
  }

  function observe() {
    if (!document.body || window.__scilampI18nObserver) return;
    const observer = new MutationObserver((records) => {
      if (applying) return;
      records.forEach((record) => {
        record.addedNodes.forEach((node) => translateTree(node));
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__scilampI18nObserver = observer;
  }

  function init() {
    document.documentElement.lang = isZh() ? 'zh-Hant' : 'en';
    if (isZh()) document.title = 'Sci-lab — 元素野外指南';
    translateTree(document.body);
    bind();
    observe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.addEventListener('storage', (event) => {
    if (event.key === KEY && SUPPORTED.has(event.newValue) && event.newValue !== current) {
      current = event.newValue;
      document.documentElement.lang = isZh() ? 'zh-Hant' : 'en';
      translateTree(document.body);
      paintToggle();
      document.dispatchEvent(new CustomEvent('scilamp:lang', { detail: { lang: current } }));
    }
  });

  return {
    get lang() { return current; },
    get isZh() { return isZh(); },
    t,
    setLang,
    refresh: translateTree,
    elementName,
    elementDescription,
    compoundName,
    compoundText,
    categoryName,
    hazardName,
    hazardText,
    stateName,
    kindLabel,
  };
})();

window.SciLampI18n = SciLampI18n;
