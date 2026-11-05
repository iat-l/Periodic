/* ============================================================
   Nomenclature & Formula Writing — shared content + helpers
   ------------------------------------------------------------
   The handbook, the guided paths and the small chemistry helpers
   all live here, so page structure, game logic and content never
   repeat each other.  Element records themselves stay in
   elements.js; nothing in this file re-states an element record.
   ============================================================ */

const CHEM = (() => {
  const SUB_DIGITS = '₀₁₂₃₄₅₆₇₈₉';
  const SUP_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

  const sub = (n) => String(n).split('').map((d) => SUB_DIGITS[Number(d)]).join('');
  const sup = (n) => String(n).split('').map((d) => SUP_DIGITS[Number(d)]).join('');

  /* formula tokens may carry plain digits (NH4, SO4); they render as subscripts */
  const withDigits = (token) => token.replace(/\d+/g, (m) => sub(m));

  /* groups of atoms that keep brackets when repeated: Ca(OH)2, Al2(SO4)3 */
  const POLY = new Set(['NH4', 'OH', 'NO3', 'NO2', 'SO4', 'SO3', 'CO3', 'PO4', 'HCO3']);

  /* tokens in order -> formula text, collapsing runs of the same token */
  function tokensToFormula(tokens) {
    const groups = [];
    tokens.forEach((token) => {
      const last = groups[groups.length - 1];
      if (last && last.token === token) last.count += 1;
      else groups.push({ token, count: 1 });
    });
    return groups.map(({ token, count }) => {
      const body = withDigits(token);
      const wrapped = POLY.has(token) && count > 1 ? `(${body})` : body;
      return count > 1 ? wrapped + sub(count) : wrapped;
    }).join('');
  }

  const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII' };
  const roman = (n) => ROMAN[n] || String(n);

  function chargeSym(sym, charge) {
    const sign = charge > 0 ? '⁺' : '⁻';
    const mag = Math.abs(charge);
    return sym + (mag > 1 ? sup(mag) : '') + sign;
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }

  return { sub, sup, withDigits, tokensToFormula, roman, chargeSym, gcd, POLY };
})();

/* ---------- the handbook ---------- */

const NOM_DOCS = [
  {
    id: 'ions',
    title: 'Ions and charges',
    rules: [
      'A metal atom loses electrons and becomes a positive ion (a cation).',
      'A nonmetal atom gains electrons and becomes a negative ion (an anion).',
      'Main-group shortcut: group 1 → 1+, group 2 → 2+, aluminium → 3+; group 17 → 1−, group 16 → 2−, group 15 → 3−.',
    ],
    examples: [
      { left: 'Na', right: 'Na⁺', note: 'sodium loses one electron' },
      { left: 'Mg', right: 'Mg²⁺', note: 'magnesium loses two' },
      { left: 'Al', right: 'Al³⁺', note: 'aluminium loses three' },
      { left: 'Cl', right: 'Cl⁻', note: 'chlorine gains one' },
      { left: 'O', right: 'O²⁻', note: 'oxygen gains two' },
      { left: 'N', right: 'N³⁻', note: 'nitrogen gains three' },
    ],
  },
  {
    id: 'ionic-names',
    title: 'Naming ionic compounds',
    rules: [
      'Name the cation first, then the anion.',
      'The anion takes the -ide ending: chlorine → chloride, oxygen → oxide, sulfur → sulfide, nitrogen → nitride.',
      'Never use covalent prefixes (mono-, di-…) in an ionic name.',
      'The charges must cancel; the subscripts themselves are never spoken.',
    ],
    examples: [
      { left: 'NaCl', right: 'sodium chloride', note: 'Na⁺ + Cl⁻' },
      { left: 'MgO', right: 'magnesium oxide', note: 'Mg²⁺ + O²⁻' },
      { left: 'CaCl₂', right: 'calcium chloride', note: 'Ca²⁺ + two Cl⁻' },
      { left: 'K₂S', right: 'potassium sulfide', note: 'two K⁺ + S²⁻' },
    ],
  },
  {
    id: 'ionic-formulas',
    title: 'Writing ionic formulas',
    rules: [
      'Write the ions with their charges.',
      'Criss-cross: the size of each charge becomes the other ion’s subscript.',
      'Reduce the subscripts to the simplest whole-number ratio.',
      'Put a polyatomic ion in brackets when it is used more than once.',
    ],
    examples: [
      { left: 'Al³⁺ + O²⁻', right: 'Al₂O₃', note: '3+ and 2− → two Al, three O' },
      { left: 'Ca²⁺ + Cl⁻', right: 'CaCl₂', note: '2+ and 1− → one Ca, two Cl' },
      { left: 'Ca²⁺ + OH⁻', right: 'Ca(OH)₂', note: 'brackets around the repeated ion' },
      { left: 'Mg²⁺ + SO₄²⁻', right: 'MgSO₄', note: 'equal charges → 1:1' },
    ],
  },
  {
    id: 'transition',
    title: 'Transition metals and Roman numerals',
    rules: [
      'Many transition metals form more than one ion, so the charge is written in Roman numerals after the metal name.',
      'The Roman numeral is the positive charge of that metal ion — not the number of atoms.',
      'If the charge is not given, work it out from the anion.',
    ],
    examples: [
      { left: 'FeCl₂', right: 'iron(II) chloride', note: 'two Cl⁻ mean Fe²⁺' },
      { left: 'FeCl₃', right: 'iron(III) chloride', note: 'three Cl⁻ mean Fe³⁺' },
      { left: 'CuO', right: 'copper(II) oxide', note: 'O²⁻ means Cu²⁺' },
      { left: 'Cu₂O', right: 'copper(I) oxide', note: 'two Cu⁺ balance O²⁻' },
    ],
  },
  {
    id: 'covalent',
    title: 'Covalent compounds and prefixes',
    rules: [
      'Use prefixes for the number of atoms: mono- 1, di- 2, tri- 3, tetra- 4, penta- 5, hexa- 6.',
      'The first element keeps its name; the second takes the -ide ending.',
      'Omit mono- on the first element.',
      'Covalent names describe molecules, not ions — there is no criss-cross.',
    ],
    examples: [
      { left: 'CO₂', right: 'carbon dioxide', note: 'one C, two O' },
      { left: 'CO', right: 'carbon monoxide', note: 'mono- only on the second element' },
      { left: 'N₂O₄', right: 'dinitrogen tetroxide', note: 'two N, four O' },
      { left: 'PCl₅', right: 'phosphorus pentachloride', note: 'one P, five Cl' },
    ],
  },
  {
    id: 'acids',
    title: 'Acids and bases',
    rules: [
      'Binary acids (hydrogen + one other element) are named hydro-…-ic acid.',
      'Oxyacids: an -ate ion becomes -ic acid; an -ite ion becomes -ous acid.',
      'Bases are named like ionic compounds: metal cation + hydroxide.',
    ],
    examples: [
      { left: 'HCl (aq)', right: 'hydrochloric acid', note: 'binary acid' },
      { left: 'H₂S (aq)', right: 'hydrosulfuric acid', note: 'binary acid' },
      { left: 'HNO₃', right: 'nitric acid', note: 'nitrate → nitric' },
      { left: 'HNO₂', right: 'nitrous acid', note: 'nitrite → nitrous' },
      { left: 'H₂SO₄', right: 'sulfuric acid', note: 'sulfate → sulfuric' },
      { left: 'NaOH', right: 'sodium hydroxide', note: 'a base, not an acid' },
    ],
  },
  {
    id: 'polyatomic',
    title: 'Polyatomic ions',
    rules: [
      'A polyatomic ion is a group of atoms with one overall charge.',
      'Its name and formula are memorised as a single unit.',
      'Keep it in brackets when it appears more than once in a formula.',
      'Hydrogen carbonate is also called bicarbonate.',
    ],
    examples: [
      { left: 'NH₄⁺', right: 'ammonium', note: 'the common positive ion' },
      { left: 'OH⁻', right: 'hydroxide', note: '' },
      { left: 'NO₃⁻', right: 'nitrate', note: '' },
      { left: 'NO₂⁻', right: 'nitrite', note: '' },
      { left: 'SO₄²⁻', right: 'sulfate', note: '' },
      { left: 'SO₃²⁻', right: 'sulfite', note: '' },
      { left: 'CO₃²⁻', right: 'carbonate', note: '' },
      { left: 'PO₄³⁻', right: 'phosphate', note: '' },
      { left: 'HCO₃⁻', right: 'hydrogen carbonate', note: 'bicarbonate' },
    ],
  },
  {
    id: 'oxidation',
    title: 'Oxidation states and balancing charges',
    rules: [
      'In a neutral compound the oxidation states add up to zero.',
      'Use the known charges to find an unknown subscript or charge.',
      'The criss-cross method is a shortcut for the same balance.',
    ],
    examples: [
      { left: 'Fe₂O₃', right: '2(+3) + 3(−2) = 0', note: 'iron(III) oxide' },
      { left: 'Ca₃(PO₄)₂', right: '3(+2) + 2(−3) = 0', note: 'calcium phosphate' },
      { left: 'Al₂S₃', right: '2(+3) + 3(−2) = 0', note: 'aluminium sulfide' },
    ],
  },
];

/* ---------- guided paths ----------
   Step types (each rendered by a reusable component in nom-page.js):
     mcq      multiple choice, instant feedback + explanation
     formula  build a formula by tapping pieces in order
     name     build a name by tapping word pieces in order
     balance  pick the coefficients that cancel the charges
   `pieces` always contain every token the answer needs, plus distractors. */

const NOM_PATHS = [
  {
    id: 'ionic',
    title: 'Ionic Compounds',
    blurb: 'Metal + nonmetal: name the ions and balance the charges.',
    steps: [
      {
        type: 'mcq',
        prompt: 'Which formula is correct for sodium chloride?',
        options: ['NaCl', 'NaCl₂', 'Na₂Cl', 'Na₂Cl₂'],
        answer: 0,
        explain: 'Na⁺ and Cl⁻ balance 1:1, so there is one of each: NaCl. A subscript is only written when the count is greater than one.',
      },
      {
        type: 'formula',
        prompt: 'Build the formula for calcium chloride.',
        pieces: ['Ca', 'Cl', 'O'],
        expected: ['Ca', 'Cl', 'Cl'],
        explain: 'Ca²⁺ needs two Cl⁻ to cancel its 2+ charge, so the formula is CaCl₂.',
      },
      {
        type: 'balance',
        prompt: 'Choose the smallest coefficients that balance magnesium chloride.',
        cation: { sym: 'Mg', charge: 2 },
        anion: { sym: 'Cl', charge: -1 },
        answer: { a: 1, b: 2 },
        explain: 'One Mg²⁺ gives +2; two Cl⁻ give −2. The total is zero, so one Mg and two Cl: MgCl₂.',
      },
      {
        type: 'name',
        prompt: 'Build the name of MgO.',
        pieces: ['magnesium', 'oxide', 'monoxide', 'oxygen'],
        expected: ['magnesium', 'oxide'],
        explain: 'Name the metal first, then the nonmetal with the -ide ending. Ionic names never use prefixes, so it is magnesium oxide.',
      },
    ],
  },
  {
    id: 'covalent',
    title: 'Covalent Compounds',
    blurb: 'Nonmetal + nonmetal: count atoms with prefixes.',
    steps: [
      {
        type: 'mcq',
        prompt: 'What does the prefix “tetra-” mean?',
        options: ['two', 'three', 'four', 'five'],
        answer: 2,
        explain: 'tetra- means four, as in CCl₄ (carbon tetrachloride).',
      },
      {
        type: 'formula',
        prompt: 'Build the formula for carbon dioxide.',
        pieces: ['C', 'O'],
        expected: ['C', 'O', 'O'],
        explain: 'di- means two oxygens. The first element keeps its plain name, so the formula is CO₂.',
      },
      {
        type: 'name',
        prompt: 'Build the name of N₂O₄.',
        pieces: ['dinitrogen', 'tetroxide', 'nitrogen', 'dioxide'],
        expected: ['dinitrogen', 'tetroxide'],
        explain: 'Two nitrogen atoms give dinitrogen; four oxygen atoms give tetroxide. The full name is dinitrogen tetroxide.',
      },
      {
        type: 'mcq',
        prompt: 'Which name is correct for CO?',
        options: ['carbon monoxide', 'monocarbon monoxide', 'carbon oxide', 'carbon dioxide'],
        answer: 0,
        explain: 'mono- is used only on the second element when there is one oxygen: carbon monoxide.',
      },
    ],
  },
  {
    id: 'acids',
    title: 'Acids & Bases',
    blurb: 'From HCl to H₂SO₄, plus the hydroxide bases.',
    steps: [
      {
        type: 'mcq',
        prompt: 'What is HCl called when it is dissolved in water?',
        options: ['hydrochloric acid', 'hydrogen chloride', 'chloric acid', 'chlorous acid'],
        answer: 0,
        explain: 'A binary acid takes hydro- + the element stem + -ic acid: hydrochloric acid.',
      },
      {
        type: 'name',
        prompt: 'Build the name of H₂SO₄.',
        pieces: ['sulfuric', 'acid', 'sulfurous', 'hydrosulfuric'],
        expected: ['sulfuric', 'acid'],
        explain: 'The sulfate ion (SO₄²⁻) becomes sulfuric acid: an -ate ion takes the -ic ending.',
      },
      {
        type: 'formula',
        prompt: 'Build the formula for nitric acid.',
        pieces: ['H', 'NO3', 'SO4', 'OH'],
        expected: ['H', 'NO3'],
        explain: 'The nitrate ion is NO₃⁻; one H⁺ balances it, so the formula is HNO₃.',
      },
      {
        type: 'mcq',
        prompt: 'Which formula is calcium hydroxide?',
        options: ['Ca(OH)₂', 'CaOH', 'Ca₂OH', 'CaH₂O'],
        answer: 0,
        explain: 'Ca²⁺ needs two OH⁻, so the repeated polyatomic ion takes brackets: Ca(OH)₂.',
      },
    ],
  },
  {
    id: 'polyatomic',
    title: 'Polyatomic Ions',
    blurb: 'Groups of atoms with one charge — formula and name as a unit.',
    steps: [
      {
        type: 'mcq',
        prompt: 'What is the formula of the sulfate ion?',
        options: ['SO₄²⁻', 'SO₃²⁻', 'SO₄⁻', 'S₂O₄²⁻'],
        answer: 0,
        explain: 'Sulfate is SO₄²⁻. Sulfite is SO₃²⁻ — one oxygen fewer.',
      },
      {
        type: 'formula',
        prompt: 'Build the formula for ammonium chloride.',
        pieces: ['NH4', 'Cl', 'OH', 'NO3'],
        expected: ['NH4', 'Cl'],
        explain: 'NH₄⁺ and Cl⁻ are both singly charged, so they pair 1:1: NH₄Cl.',
      },
      {
        type: 'balance',
        prompt: 'Balance aluminium sulfate. (Al³⁺ with SO₄²⁻)',
        cation: { sym: 'Al', charge: 3 },
        anion: { sym: 'SO4', charge: -2 },
        answer: { a: 2, b: 3 },
        explain: 'Two Al³⁺ give +6; three SO₄²⁻ give −6. The formula is Al₂(SO₄)₃, with brackets around the repeated ion.',
      },
      {
        type: 'name',
        prompt: 'Build the name of KNO₃.',
        pieces: ['potassium', 'nitrate', 'nitrite', 'nitrogen'],
        expected: ['potassium', 'nitrate'],
        explain: 'K⁺ is potassium and NO₃⁻ is nitrate, so the name is potassium nitrate.',
      },
    ],
  },
  {
    id: 'transition',
    title: 'Transition Metals',
    blurb: 'Variable charges, Roman numerals and working back from the anion.',
    steps: [
      {
        type: 'mcq',
        prompt: 'In iron(III) chloride, what is the charge on the iron ion?',
        options: ['3+', '3−', '1+', '2+'],
        answer: 0,
        explain: 'The Roman numeral III is the charge: iron is Fe³⁺ in this compound.',
      },
      {
        type: 'formula',
        prompt: 'Build the formula for iron(II) chloride.',
        pieces: ['Fe', 'Cl'],
        expected: ['Fe', 'Cl', 'Cl'],
        explain: 'Fe²⁺ needs two Cl⁻, so the formula is FeCl₂. Changing the Roman numeral changes the formula.',
      },
      {
        type: 'name',
        prompt: 'Build the name of CuO.',
        pieces: ['copper(II)', 'copper(I)', 'oxide', 'oxygen'],
        expected: ['copper(II)', 'oxide'],
        explain: 'O²⁻ forces copper to be Cu²⁺, which is written copper(II). The name is copper(II) oxide.',
      },
      {
        type: 'balance',
        prompt: 'Balance the charges for iron(III) oxide.',
        cation: { sym: 'Fe', charge: 3 },
        anion: { sym: 'O', charge: -2 },
        answer: { a: 2, b: 3 },
        explain: 'Two Fe³⁺ give +6; three O²⁻ give −6. The neutral formula is Fe₂O₃.',
      },
    ],
  },
];
