/* ============================================================
   Sandbox chemistry rules
   ------------------------------------------------------------
   A deliberately small, documented model — not a thermodynamic
   calculation.  Element facts come from ELEMENTS (elements.js)
   and compound facts from COMPOUNDS (compounds.js); this file
   adds only the bonding rules, palette and challenges.

   INPUT
     The bench supplies an atom multiset, e.g. { C: 1, O: 2 }.
     The resolver normalises it by its greatest common divisor
     and looks for an exact catalog signature first, so any
     whole-number multiple of a formula also resolves:
       1 C + 2 O      -> CO2        (catalog)
       4 H + 2 O      -> 2 x H2O    (catalog, two formula units)
       2 Na + 2 Cl    -> 2 x NaCl   (catalog)

   RULES, in order
     1. Noble gases never bond in this model.
     2. Exact catalog match by normalised atom multiset.  This is
        how CO2, H2O, NaCl, CaCl2, Fe2O3 and the polyatomic
        compounds (NaOH, Na2CO3, Ca(OH)2, NH4Cl ...) resolve.
     3. All atoms are metals -> an alloy.  Composition is variable,
        so the metal counts do not form a formula; known alloys are
        named, everything else is an A-B alloy.
     4. One metal + one nonmetal -> binary ionic charge balance
        using the primary charges below.  The smallest neutral
        counts become the formula.  If the supplied counts cannot
        make that ratio, the sandbox replies with the exact recipe
        instead of silently discarding atoms:
          1 Ca + 1 Cl -> asks for one more Cl, because CaCl2
        Metals with no primary charge (Au) are not modelled here.
     5. Nonmetals / metalloids -> curated covalent molecules only.
        A pair outside the catalog gets a friendly "not modelled"
        message and, when possible, the nearest catalog recipes:
          2 H + 2 O -> suggests H2O (2 H + 1 O) and H2O2 (2 H + 2 O)
     6. Anything else -> an explanation plus alternatives, never an
        invented formula.

   PRIMARY IONIC CHARGES (one common ion per element)
     Na+, K+, Ag+                 Mg2+, Ca2+, Ba2+, Zn2+, Cu2+, Pb2+,
     Sn2+, Ni2+, Mn2+, Hg2+       Al3+, Fe3+, Cr3+
     Ti4+                         F-, Cl-, Br-, I-, H-
     O2-, S2-                     N3-, P3-
     Fe, Cu, Pb, Sn, Mn, Cr and Ti take a Roman numeral when the
     name needs one, e.g. iron(III) oxide.  Catalog entries keep
     their curated names (FeO is iron(II) oxide, Fe3O4 is
     iron(II,III) oxide).

   EXAMPLES REQUIRED BY THE BRIEF
     1 C + 2 O   -> CO2, covalent
     2 H + 1 O   -> H2O, covalent
     1 Na + 1 Cl -> NaCl, ionic 1:1
     1 Ca + 2 Cl -> CaCl2, ionic 1:2
     2 Fe + 3 O  -> Fe2O3, ionic 2:3
   ============================================================ */

const SB = (() => {
  const record = new Map(ELEMENTS.map((e) => [e[1], e]));

  const METAL_CATS = new Set(['a', 'e', 't', 'p', 'l', 'c']);
  const NONMETAL_CATS = new Set(['n', 'h']);
  const METALLOID_CATS = new Set(['m']);

  /* curated palette: common metals, nonmetals and noble gases to show the limit */
  const PALETTE = [
    'H', 'C', 'N', 'O', 'F',
    'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl',
    'K', 'Ca', 'Ti', 'Cr', 'Mn', 'Fe', 'Ni', 'Cu', 'Zn',
    'Br', 'Ag', 'Sn', 'I', 'Ba', 'Au', 'Hg', 'Pb', 'Ne', 'Ar',
  ];

  /* one common cation charge per metal — see the header table */
  const PRIMARY_CATION = {
    Na: 1, K: 1, Ag: 1,
    Mg: 2, Ca: 2, Ba: 2, Zn: 2, Cu: 2, Pb: 2, Sn: 2, Ni: 2, Mn: 2, Hg: 2,
    Al: 3, Fe: 3, Cr: 3,
    Ti: 4,
  };

  const ANION_CHARGE = {
    F: -1, Cl: -1, Br: -1, I: -1, H: -1,
    O: -2, S: -2,
    N: -3, P: -3,
  };

  const HALOGENS = new Set(['F', 'Cl', 'Br', 'I']);
  const DIATOMIC = new Set(['H', 'N', 'O', 'F', 'Cl', 'Br', 'I']);

  /* metals whose sandbox charge needs a Roman numeral in the name */
  const NEEDS_ROMAN = new Set(['Fe', 'Cu', 'Pb', 'Sn', 'Mn', 'Cr', 'Ti', 'Hg']);

  const ANION_NAMES = {
    F: 'fluoride', Cl: 'chloride', Br: 'bromide', I: 'iodide',
    O: 'oxide', S: 'sulfide', N: 'nitride', P: 'phosphide', H: 'hydride',
  };

  const KIND_LABEL = { alloy: 'Alloy', ionic: 'Ionic compound', covalent: 'Covalent compound' };

  const fail = (message, extra = {}) => ({ ok: false, message, alternatives: [], ...extra });

  function EL(sym) {
    const e = record.get(sym);
    if (!e) return null;
    return {
      number: e[0],
      symbol: e[1],
      name: e[2],
      cat: e[3],
      mass: e[6],
      note: e[8],
      description: e[9] || e[8],
      state: e[10] || null,
      oxidation: e[11] || '—',
    };
  }

  function classify(sym) {
    const el = EL(sym);
    if (!el) return 'unknown';
    if (METAL_CATS.has(el.cat)) return 'metal';
    if (NONMETAL_CATS.has(el.cat)) return 'nonmetal';
    if (METALLOID_CATS.has(el.cat)) return 'metalloid';
    return 'noble';
  }

  const CLASS_WORD = { metal: 'a metal', nonmetal: 'a nonmetal', metalloid: 'a metalloid', noble: 'a noble gas' };

  function ionName(sym, charge) {
    const el = EL(sym);
    if (!el) return sym;
    if (charge > 0) {
      const base = el.name.toLowerCase();
      return NEEDS_ROMAN.has(sym) ? `${base}(${CHEM.roman(charge)})` : base;
    }
    return ANION_NAMES[sym] || `${el.name.toLowerCase()}ide`;
  }

  /* ---------- atom-multiset helpers ---------- */

  function cleanAtoms(atoms) {
    const out = {};
    if (!atoms) return out;
    Object.keys(atoms).forEach((sym) => {
      const n = Math.floor(Number(atoms[sym]));
      if (record.has(sym) && n > 0) out[sym] = n;
    });
    return out;
  }

  const symbolsOf = (atoms) => Object.keys(atoms).filter((s) => atoms[s] > 0).sort();
  const totalAtoms = (atoms) => symbolsOf(atoms).reduce((sum, s) => sum + atoms[s], 0);

  function gcdAll(atoms) {
    return symbolsOf(atoms).reduce((g, s) => CHEM.gcd(g, atoms[s]), 0) || 1;
  }

  function signature(atoms) {
    const g = gcdAll(atoms);
    return symbolsOf(atoms).map((s) => `${s}${atoms[s] / g}`).join('');
  }

  /* "2 hydrogen, 1 oxygen" — the names stay readable beside formulas */
  function compositionText(atoms) {
    return symbolsOf(atoms).map((s) => {
      const el = EL(s);
      return `${atoms[s]} ${el ? el.name.toLowerCase() : s}`;
    }).join(', ');
  }

  function ratioText(ratio) {
    if (!ratio) return '';
    return `${ratio[0]} cation${ratio[0] === 1 ? '' : 's'} : ${ratio[1]} anion${ratio[1] === 1 ? '' : 's'}`;
  }

  function alternativesFor(atoms, excludeId) {
    return alternativeCompounds(atoms, excludeId).slice(0, 3).map((c) => ({
      id: c.id,
      formula: c.formula,
      name: c.name,
      atoms: { ...c.atoms },
      hint: c.hint,
    }));
  }

  /* ratio for a binary ionic catalog entry; polyatomic entries return null */
  function binaryRatio(c) {
    if (c.kind !== 'ionic') return null;
    const syms = Object.keys(c.atoms);
    if (syms.length !== 2) return null;
    const metal = syms.find((s) => PRIMARY_CATION[s]);
    const nonmetal = syms.find((s) => ANION_CHARGE[s]);
    if (!metal || !nonmetal) return null;
    const g = CHEM.gcd(c.atoms[metal], c.atoms[nonmetal]);
    return [c.atoms[metal] / g, c.atoms[nonmetal] / g];
  }

  function anionOf(c) {
    const syms = Object.keys(c.atoms);
    return syms.find((s) => HALOGENS.has(s)) || syms.find((s) => ANION_CHARGE[s]) || null;
  }

  /* ---------- product builders ---------- */

  function catalogProduct(c, atoms) {
    const units = gcdAll(atoms);
    const suppliedText = compositionText(atoms);
    let note = c.why;
    if (units > 1) {
      note += ` You supplied ${suppliedText}: that is ${units} formula units of ${c.formula}.`;
    }
    return {
      ok: true,
      product: {
        key: `c:${c.id}`,
        compoundId: c.id,
        kind: c.kind,
        name: c.name,
        formula: c.formula,
        atoms: { ...c.atoms },
        note,
        why: c.why,
        formation: c.formation,
        description: c.description,
        properties: c.properties,
        compositionText: compositionText(c.atoms),
        suppliedText,
        units,
        contains: Object.keys(c.atoms),
        ratio: binaryRatio(c),
        anion: anionOf(c),
        alternatives: alternativesFor(c.atoms, c.id),
        catalog: true,
      },
    };
  }

  function alloyProduct(metals, atoms) {
    const syms = metals.slice().sort();
    const known = ALLOY_BY_METALS.get(syms.join('-'));
    const suppliedText = compositionText(atoms);
    if (known) {
      return {
        ok: true,
        product: {
          key: `c:${known.id}`,
          compoundId: known.id,
          kind: 'alloy',
          name: known.name,
          formula: known.formula,
          atoms: null,
          note: known.why,
          why: known.why,
          formation: known.formation,
          description: known.description,
          properties: known.properties,
          compositionText: 'variable composition',
          suppliedText,
          units: null,
          contains: known.metals.slice(),
          ratio: null,
          anion: null,
          alternatives: [],
          catalog: true,
        },
      };
    }
    const elA = EL(metals[0]);
    const elB = EL(metals[1]);
    return {
      ok: true,
      product: {
        key: `g:alloy:${syms.join('-')}`,
        kind: 'alloy',
        name: `${elA.name}–${elB.name} alloy`,
        formula: `${metals[0]}–${metals[1]}`,
        atoms: null,
        note: `${elA.name} and ${elB.name} are both metals; they mix as a solid solution, so the counts you place only choose the metals and no fixed formula is claimed.`,
        why: 'Both elements are metals. They share a metallic lattice instead of forming fixed ions, so the composition can vary.',
        formation: 'The metals melt together and freeze as a solid solution.',
        description: `An alloy of ${elA.name.toLowerCase()} and ${elB.name.toLowerCase()}. This particular mixture is not in the curated catalogue, so its exact colour and hardness are not listed.`,
        properties: 'Metallic solid with variable composition; usually harder than the pure metals.',
        compositionText: 'variable composition',
        suppliedText,
        units: null,
        contains: metals.slice(),
        ratio: null,
        anion: null,
        alternatives: [],
        catalog: false,
      },
    };
  }

  function diatomicProduct(sym, count) {
    const el = EL(sym);
    const units = count / 2;
    return {
      ok: true,
      product: {
        key: `g:molecule:${sym}2`,
        kind: 'covalent',
        name: el.name.toLowerCase(),
        formula: `${sym}₂`,
        atoms: { [sym]: 2 },
        note: `${el.name} travels as a diatomic molecule: two atoms share electrons.`,
        why: `${el.name} is more stable with two atoms sharing electrons than as a lone atom.`,
        formation: 'Two atoms of the same element share an electron pair.',
        description: `The element ${el.name.toLowerCase()} as a diatomic molecule. It is an element, not a compound, but the sandbox keeps it on the bench.`,
        properties: 'A simple diatomic molecule; its bulk properties follow the element itself.',
        compositionText: compositionText({ [sym]: 2 }),
        suppliedText: compositionText({ [sym]: count }),
        units,
        contains: [sym],
        ratio: null,
        anion: null,
        alternatives: [],
        diatomic: true,
        catalog: false,
      },
    };
  }

  function makeIonic(cation, anion, atoms) {
    const qCat = PRIMARY_CATION[cation];
    const qAn = ANION_CHARGE[anion];

    if (!qCat) {
      const el = EL(cation);
      return fail(`${el.name} has no simple fixed ion in this sandbox, so we cannot balance it. Try a main-group metal such as sodium, magnesium or calcium.`);
    }
    if (!qAn) {
      const el = EL(anion);
      return fail(`${el.name} has no simple fixed anion in this sandbox. The sandbox models oxides, halides, sulfides, nitrides, phosphides and hydrides as simple anions.`);
    }

    const g = CHEM.gcd(qCat, Math.abs(qAn));
    const nCat = Math.abs(qAn) / g;
    const nAn = qCat / g;
    const formula = cation + (nCat > 1 ? CHEM.sub(nCat) : '') + anion + (nAn > 1 ? CHEM.sub(nAn) : '');
    const name = `${ionName(cation, qCat)} ${ionName(anion, qAn)}`;
    const haveCat = atoms[cation] || 0;
    const haveAn = atoms[anion] || 0;
    const exact = haveCat >= nCat && haveAn >= nAn
      && haveCat % nCat === 0 && haveAn % nAn === 0;

    if (!exact) {
      let message = `${compositionText(atoms)} does not balance as ${formula}. The charge-balanced recipe is ${nCat} ${cation} + ${nAn} ${anion} → ${formula}.`;
      if (haveCat < nCat) message += ` Add ${nCat - haveCat} more ${EL(cation).name.toLowerCase()}.`;
      else if (haveAn < nAn) message += ` Add ${nAn - haveAn} more ${EL(anion).name.toLowerCase()}.`;
      else message += ' Use a whole-number multiple of that recipe so no atom is left over.';
      return fail(message, {
        alternatives: alternativesFor(atoms),
        recipe: { cation, anion, nCat, nAn, formula },
      });
    }

    const units = haveCat / nCat;
    const why = `${CHEM.chargeSym(cation, qCat)} and ${CHEM.chargeSym(anion, qAn)} carry opposite charges. `
      + `${nCat} ${nCat === 1 ? 'cation' : 'cations'} to ${nAn} ${nAn === 1 ? 'anion' : 'anions'} balances exactly, so the smallest formula is ${formula}.`;
    let note = why;
    if (units > 1) {
      note += ` You supplied ${compositionText(atoms)}: that is ${units} formula units.`;
    }

    return {
      ok: true,
      product: {
        key: `g:ionic:${signature({ [cation]: nCat, [anion]: nAn })}`,
        kind: 'ionic',
        name,
        formula,
        atoms: { [cation]: nCat, [anion]: nAn },
        note,
        why,
        formation: `The ions attract in a repeating lattice, with ${nCat} ${cation} ion${nCat === 1 ? '' : 's'} for every ${nAn} ${anion} ion${nAn === 1 ? '' : 's'}.`,
        description: `A ${name} compound formed by charge balance. It is not in the curated catalogue, so its exact colour and melting point are not listed.`,
        properties: 'Crystalline ionic solid at room temperature; conducts electricity when molten.',
        compositionText: compositionText({ [cation]: nCat, [anion]: nAn }),
        suppliedText: compositionText(atoms),
        units,
        contains: [cation, anion],
        ratio: [nCat, nAn],
        anion,
        alternatives: alternativesFor(atoms),
        catalog: false,
      },
    };
  }

  function noCovalentMatch(atoms) {
    const alts = alternativesFor(atoms);
    const supplied = compositionText(atoms);
    if (alts.length) {
      const first = alts[0];
      return fail(
        `${supplied} does not make a stable molecule in this sandbox. Try ${compositionText(first.atoms)} for ${first.formula} (${first.name}).`,
        { alternatives: alts }
      );
    }
    const pair = symbolsOf(atoms).map((s) => EL(s).name.toLowerCase()).join(' + ');
    return fail(`We do not model ${pair} as a covalent molecule yet. Try a curated recipe such as 1 carbon + 2 oxygen for CO₂.`);
  }

  function noCompoundMatch(atoms) {
    const alts = alternativesFor(atoms);
    const supplied = compositionText(atoms);
    if (alts.length) {
      const first = alts[0];
      return fail(
        `${supplied} does not match a compound in this model. With these elements, try ${compositionText(first.atoms)} for ${first.formula} (${first.name}).`,
        { alternatives: alts }
      );
    }
    return fail(`${supplied} does not match a compound in this model. Balance one metal with one nonmetal, or use a recognised group such as hydroxide (OH), nitrate (NO₃), sulfate (SO₄) or carbonate (CO₃).`);
  }

  /* ---------- resolver ----------
     mode: 'auto' uses the rules above; 'alloy', 'ionic' and
     'covalent' force one rule so a class can be demonstrated. */
  function resolve(inputAtoms, mode = 'auto') {
    const atoms = cleanAtoms(inputAtoms);
    const syms = symbolsOf(atoms);
    if (!syms.length) return fail('Add at least two atoms to the bench first.');

    const noble = syms.find((s) => classify(s) === 'noble');
    if (noble) {
      return fail(`${EL(noble).name} has a full outer shell, so it does not bond under these rules.`);
    }

    const total = totalAtoms(atoms);
    if (total < 2) {
      const sym = syms[0];
      if (DIATOMIC.has(sym)) {
        return fail(`A single ${EL(sym).name.toLowerCase()} atom is not a compound. Add one more atom to make ${sym}₂.`);
      }
      return fail('A single atom is not a compound. Add another atom — a different element — to react.');
    }

    const catalog = COMPOUND_BY_SIG.get(signature(atoms));
    const metals = syms.filter((s) => classify(s) === 'metal');
    const nonmetals = syms.filter((s) => classify(s) === 'nonmetal');
    const metalloids = syms.filter((s) => classify(s) === 'metalloid');

    if (mode === 'alloy') {
      if (metals.length !== syms.length) {
        const wrong = syms.find((s) => classify(s) !== 'metal');
        return fail(`An alloy needs two metals — ${EL(wrong).name.toLowerCase()} is ${CLASS_WORD[classify(wrong)]}.`);
      }
      if (syms.length < 2) return fail('An alloy mixes two different metals. Add a second metal.');
      if (syms.length > 2) return fail('This sandbox models alloys of exactly two metals. Remove the extra element.');
      return alloyProduct(syms, atoms);
    }

    if (mode === 'ionic') {
      if (syms.length !== 2) {
        return fail('The ionic rule balances one metal with one nonmetal. Remove the extra elements, or switch to Auto to match a polyatomic compound.');
      }
      if (!metals.length || !nonmetals.length) {
        return fail('An ionic compound needs a metal cation and a nonmetal anion. For two nonmetals, try the covalent process.');
      }
      if (catalog && catalog.kind === 'ionic') return catalogProduct(catalog, atoms);
      return makeIonic(metals[0], nonmetals[0], atoms);
    }

    if (mode === 'covalent') {
      if (metals.length) {
        const wrong = metals[0];
        return fail(`A covalent molecule needs nonmetals or metalloids — ${EL(wrong).name.toLowerCase()} is ${CLASS_WORD[classify(wrong)]}.`);
      }
      if (catalog && catalog.kind === 'covalent') return catalogProduct(catalog, atoms);
      if (syms.length === 1) {
        const sym = syms[0];
        if (DIATOMIC.has(sym)) {
          if (atoms[sym] % 2 === 0) return diatomicProduct(sym, atoms[sym]);
          return fail(`${EL(sym).name} atoms pair into ${sym}₂; add one more so none is left over.`);
        }
        return fail(`A lone ${EL(sym).name.toLowerCase()} atom is not a compound here — add a different element.`);
      }
      return noCovalentMatch(atoms);
    }

    /* auto */
    if (catalog) return catalogProduct(catalog, atoms);

    if (syms.length === 2 && metals.length === 2) {
      return alloyProduct(syms, atoms);
    }

    if (syms.length === 2 && metals.length === 1 && nonmetals.length === 1) {
      return makeIonic(metals[0], nonmetals[0], atoms);
    }

    if (syms.length === 1) {
      const sym = syms[0];
      if (DIATOMIC.has(sym)) {
        if (atoms[sym] % 2 === 0) return diatomicProduct(sym, atoms[sym]);
        return fail(`${EL(sym).name} atoms pair into ${sym}₂; add one more so none is left over.`);
      }
      if (classify(sym) === 'metal') {
        return fail('A single metal atom is not a compound here. Add a different metal to make an alloy.');
      }
      return fail(`A lone ${EL(sym).name.toLowerCase()} atom is not a compound here — add a different element.`);
    }

    if (syms.length === 2 && metals.length === 1 && metalloids.length === 1) {
      return fail(`${EL(metals[0]).name} is a metal and ${EL(metalloids[0]).name} is a metalloid; this sandbox does not model that pair as a bond. Try a metal with a nonmetal, or two metals for an alloy.`);
    }

    if (metals.length === 0) {
      return noCovalentMatch(atoms);
    }

    return noCompoundMatch(atoms);
  }

  /* goals — `test` receives the product from a successful combine */
  const CHALLENGES = [
    {
      id: 'alloy',
      title: 'Make any alloy',
      hint: 'Two metals walk onto the bench. What do they become when they cool together?',
      test: (p) => p.kind === 'alloy',
    },
    {
      id: 'ionic',
      title: 'Create an ionic compound',
      hint: 'One gives, one takes. Who is left holding the charge?',
      test: (p) => p.kind === 'ionic',
    },
    {
      id: 'two-one',
      title: 'Build a 2:1 ionic compound',
      hint: 'One negative ion wants two positive partners. Can you arrange the guest list?',
      test: (p) => p.kind === 'ionic' && p.ratio && p.ratio[0] === 2 && p.ratio[1] === 1,
    },
    {
      id: 'covalent',
      title: 'Create a covalent molecule',
      hint: 'Two nonmetals refuse to give up electrons. What do they do instead?',
      test: (p) => p.kind === 'covalent' && !p.diatomic,
    },
    {
      id: 'oxygen',
      title: 'Build a product containing oxygen',
      hint: 'Which breathable element wants to join almost anything on the bench?',
      test: (p) => p.contains.includes('O'),
    },
    {
      id: 'halide',
      title: 'Make an ionic halide',
      hint: 'A salt with a halogen’s name hidden inside — who will hold the other end?',
      test: (p) => p.kind === 'ionic' && ['F', 'Cl', 'Br', 'I'].includes(p.anion),
    },
    {
      id: 'three-elements',
      title: 'Build a compound from three elements',
      hint: 'Three different elements in one compound: perhaps oxygen, a metal and the lightest atom.',
      test: (p) => p.kind === 'ionic' && p.contains.length >= 3,
    },
  ];

  return {
    PALETTE,
    EL,
    classify,
    ionName,
    resolve,
    CHALLENGES,
    KIND_LABEL,
    compositionText,
    ratioText,
    signature,
  };
})();
