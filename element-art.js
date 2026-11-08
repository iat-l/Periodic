/* Original specimen engravings for every element, drawn as small SVG data URIs.
   The motif comes from the element family and phase; the atomic number adds a
   stable, individual variation so no two cards share exactly the same plate. */

const SciLampArt = (() => {
  const INKS = { light: '#584e40', dark: '#cfc6b4' };
  const DISCS = { light: '#fffdf8', dark: '#232323' };
  let ink = INKS.light;
  const cache = new Map();

  const frac = (n) => n - Math.floor(n);
  const rand = (num, salt) => frac(Math.sin(num * 12.9898 + salt * 78.233) * 43758.5453);
  const wobble = (num, salt, span) => (rand(num, salt) - 0.5) * span;
  const fixed = (n) => n.toFixed(1);
  const dot = (x, y, r = 1.4, o = 0.45) =>
    `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="${r}" fill="${ink}" fill-opacity="${o}" stroke="none"/>`;

  /* One emblem per element, drawn around the origin at roughly 22 × 22.
     Each glyph takes the atomic number so members of the same family still
     differ in petal count, teeth, bars or rotation. */
  const GLYPHS = {
    spark: (n) => `<g transform="rotate(${n * 23 % 360})">
      <path d="M0 -10 L2.4 -2.4 L10 0 L2.4 2.4 L0 10 L-2.4 2.4 L-10 0 L-2.4 -2.4 Z" fill="${ink}" fill-opacity=".13"/>
      <path d="M0 -10 V10 M-10 0 H10" opacity=".55"/>
      <circle r="1.5" fill="${ink}" fill-opacity=".55" stroke="none"/>
    </g>`,
    balloon: () => `<path d="M0 7 C-7 7 -8 0 -5 -4 C-3 -7 3 -7 5 -4 C8 0 7 7 0 7 Z"/>
      <path d="M0 7 v7 M-2 14 q2 2 4 0" opacity=".55"/>
      <path d="M-2 3 q2 -2 4 0" opacity=".3"/>`,
    battery: (n) => `<rect x="-9" y="-6" width="18" height="12" rx="2"/>
      <path d="M9 -3 h3 v6 h-3"/>
      <path d="M-6 -2 v4 M-3 -2 v4 M0 -2 v4 M3 -2 v4" opacity="${0.28 + (n % 3) * 0.1}"/>`,
    diamond: () => `<path d="M0 -10 L9 -2 L5 9 L-5 9 L-9 -2 Z" fill="${ink}" fill-opacity=".11"/>
      <path d="M0 -10 V9 M-9 -2 H9 M-5 9 L-4 -2 M5 9 L4 -2"/>
      <path d="M-4 -2 H4" opacity=".4"/>`,
    prism: () => `<path d="M-9 8 L0 -10 L9 8 Z"/>
      <path d="M-13 -4 H-2 M-12 0 H2" opacity=".4"/>
      <path d="M2 4 L12 -2 M3 6 L13 2" opacity=".3"/>`,
    cloud: (n) => `<path d="M-10 6 q-4 0 -4 -4 q0 -4 4 -4 q0 -6 6 -6 q5 0 6 4 q5 0 5 5 q0 5 -5 5 Z"/>
      <path d="M-6 2 h${4 + (n % 3) * 2}" opacity=".4"/>`,
    bubbles: (n) => `<circle cx="-4" cy="3" r="${3 + (n % 3)}"/>
      <circle cx="5" cy="0" r="${1.8 + (n % 2)}" opacity=".7"/>
      <circle cx="1" cy="-7" r="1.8" opacity=".5"/>
      ${n % 2 ? `<circle cx="7" cy="7" r="1.2" opacity=".45"/>` : ''}`,
    drop: () => `<path d="M0 -10 C6 -3 9 1 9 5 a9 9 0 0 1 -18 0 C-9 1 -6 -3 0 -10 Z" fill="${ink}" fill-opacity=".08"/>
      <path d="M-3 5 a3 3 0 0 0 2 4" opacity=".4"/>`,
    bulb: (n) => `<path d="M-6 3 a7 7 0 1 1 12 0 c-1 2 -2 3 -2 6 h-8 c0 -3 -1 -4 -2 -6 Z"/>
      <path d="M-3 9 h6 M-3 12 h6 M-4 6 v4 M4 6 v4" opacity=".55"/>
      <path d="M-4 0 q4 -${2 + (n % 3)} 8 0" opacity=".35"/>`,
    flame: (n) => `<path d="M0 -11 C5 -4 9 0 8 5 a8 8 0 0 1 -16 0 C-8 0 -4 -4 0 -11 Z" fill="${ink}" fill-opacity=".1"/>
      <path d="M0 -4 C3 0 5 2 4 5 a4.5 4.5 0 0 1 -8 0 C-4 2 -2 0 0 -4 Z" opacity="${0.4 + (n % 3) * 0.1}"/>`,
    leaf: () => `<path d="M0 -10 C8 -6 9 2 0 10 C-9 2 -8 -6 0 -10 Z"/>
      <path d="M0 -7 V7 M0 0 L5 -3 M0 3 L-5 0" opacity=".4"/>`,
    bone: () => `<g transform="rotate(45)"><path d="M-3 -6 a2.5 2.5 0 1 1 3 2 v8 a2.5 2.5 0 1 1 -3 2 a2.5 2.5 0 1 1 3 -2 v-8 a2.5 2.5 0 1 1 -3 -2 Z"/></g>`,
    wing: (n) => `<path d="M-9 6 C-4 -6 4 -10 10 -10 C8 -4 5 4 -2 8 Z" fill="${ink}" fill-opacity=".06"/>
      <path d="M-5 5 C0 -2 4 -5 8 -7 M-2 7 C2 2 5 0 9 -2" opacity=".4"/>
      <path d="M${-7 + (n % 3)} 2 C-2 -4 2 -7 6 -9" opacity=".3"/>`,
    spring: (n) => `<path d="M0 10 L-6 6 L6 2 L-6 -2 L6 -6 L0 -10"/>
      <path d="M0 10 v3 M0 -10 v-3" opacity=".4"/>
      ${n % 2 ? `<path d="M-8 8 H8" opacity=".3"/>` : ''}`,
    gear: (n) => `<g transform="rotate(${n * 17 % 360})">
      <circle r="7"/><circle r="2.5"/>
      <path d="M0 -11 V-7 M0 7 V11 M-11 0 H-7 M7 0 H11 M-8 -8 L-5 -5 M5 5 L8 8 M8 -8 L5 -5 M-5 5 L-8 8"/>
    </g>`,
    anvil: () => `<path d="M-11 -6 H6 C6 -2 2 0 -2 1 V4 H6 L8 8 H-8 L-6 4 H-4 V1 C-7 0 -9 -2 -11 -6 Z"/>
      <path d="M-11 -3 h4" opacity=".5"/>
      <path d="M-1 -3 h5" opacity=".3"/>`,
    compass: (n) => `<circle r="9"/>
      <path d="M${4 - (n % 2)} -5 L-1 1 L-4 5 L1 -1 Z" fill="${ink}" fill-opacity=".35"/>
      <circle r="1.2" fill="${ink}" fill-opacity=".5" stroke="none"/>`,
    coin: (n) => `<circle r="9"/><circle r="6" opacity=".5"/>
      <path d="M0 -4 v8 M-3 -1 h6" opacity=".4"/>
      <circle cx="${6 - (n % 3)}" cy="-6" r="1" fill="${ink}" fill-opacity=".4" stroke="none"/>`,
    coil: (n) => `<path d="M-9 6 a4 4 0 0 1 4 -4 h10 a4 4 0 0 1 0 8 H-1 a4 4 0 0 1 0 -8 H9"/>
      <path d="M-9 6 v4 M9 -6 v-4" opacity=".4"/>
      ${n % 2 ? `<path d="M-4 10 H4" opacity=".3"/>` : ''}`,
    shield: (n) => `<path d="M0 -10 L8 -7 V1 C8 6 4 9 0 11 C-4 9 -8 6 -8 1 V-7 Z" fill="${ink}" fill-opacity=".06"/>
      <path d="M0 -6 V7" opacity=".4"/>
      ${n % 2 ? `<path d="M-4 -2 H4" opacity=".3"/>` : ''}`,
    thermo: () => `<path d="M3 -9 a3 3 0 0 0 -6 0 V4 a5 5 0 1 0 6 0 Z"/>
      <path d="M0 -8 V4" opacity=".5"/>
      <circle cx="0" cy="7" r="2" fill="${ink}" fill-opacity=".5" stroke="none"/>`,
    chip: (n) => `<rect x="-7" y="-7" width="14" height="14" rx="2"/>
      <rect x="-3" y="-3" width="6" height="6" opacity=".4"/>
      <path d="M-7 -4 H-10 M-7 0 H-10 M-7 4 H-10 M7 -4 H10 M7 0 H10 M7 4 H10 M-4 -7 V-10 M0 -7 V-10 M4 -7 V-10 M-4 7 V10 M0 7 V10 M4 7 V10" opacity="${0.35 + (n % 3) * 0.08}"/>`,
    moon: () => `<path d="M2 -10 A10 10 0 1 0 2 10 A8 8 0 1 1 2 -10 Z" fill="${ink}" fill-opacity=".1"/>
      <path d="M-6 -4 l-2 -2 M-5 4 l-2 2" opacity=".35"/>`,
    clock: (n) => `<circle r="9"/><path d="M0 -5 V0 L4 3"/>
      <circle r="1.2" fill="${ink}" fill-opacity=".5" stroke="none"/>
      <path d="M-6 -6 l-2 -2 M6 6 l2 2" opacity="${n % 2 ? '.3' : '.15'}"/>`,
    magnet: () => `<path d="M-8 -8 V2 a8 8 0 0 0 16 0 V-8 H4 V2 a4 4 0 0 1 -8 0 V-8 Z"/>
      <path d="M-8 -4 H-4 M4 -4 H8" opacity=".4"/>`,
    mesh: (n) => `<rect x="-9" y="-9" width="18" height="18" rx="2"/>
      <path d="M-3 -9 V9 M3 -9 V9 M-9 -3 H9 M-9 3 H9" opacity="${0.3 + (n % 3) * 0.08}"/>`,
    orbit: (n) => `<circle r="2" fill="${ink}" fill-opacity=".5" stroke="none"/>
      <ellipse rx="11" ry="4"/>
      <ellipse rx="11" ry="4" transform="rotate(${58 + n % 20})"/>
      ${dot(11 * Math.cos(n), 4 * Math.sin(n), 1.4, 0.45)}`,
    lens: () => `<path d="M0 -10 C6 -6 6 6 0 10 C-6 6 -6 -6 0 -10 Z"/>
      <path d="M-12 -6 H-6 M-12 0 H-7 M-12 6 H-6" opacity=".35"/>`,
    turbine: (n) => `<circle r="2.5"/>
      <g transform="rotate(${n * 11 % 360})">
        <path d="M0 -2 C4 -10 9 -9 8 -3 C7 1 2 0 0 1"/>
        <path d="M2 1 C9 5 8 10 2 9 C-2 8 -1 3 -1 1"/>
        <path d="M-2 1 C-8 6 -12 2 -9 -2 C-6 -5 -2 -1 0 -1"/>
      </g>`,
    nib: () => `<path d="M0 -11 L6 2 L0 11 L-6 2 Z"/>
      <path d="M0 -3 V11 M-3 1 H3" opacity=".45"/>
      <circle cy="-1" r="1" fill="${ink}" fill-opacity=".5" stroke="none"/>`,
    ring: (n) => `<circle r="7"/>
      <path d="M0 -7 L3 -10 L6 -7 L3 -4 Z" fill="${ink}" fill-opacity=".15"/>
      ${dot(0, 3, 1.2, 0.35)}
      ${n % 2 ? `<path d="M-10 0 H-7 M7 0 H10" opacity=".3"/>` : ''}`,
    crown: (n) => `<path d="M-10 7 L-9 -3 L-4 2 L0 -7 L4 2 L9 -3 L10 7 Z" fill="${ink}" fill-opacity=".06"/>
      <path d="M-9 3 H9" opacity=".4"/>
      ${dot(0, -5, 1.1, 0.45)}
      ${n % 3 === 0 ? `<path d="M-3 -1 v4 M3 -1 v4" opacity=".3"/>` : ''}`,
    stair: (n) => `<path d="M-9 9 H-3 V3 H3 V-3 H9 V-9"/>
      <path d="M-9 9 V-3 H-3 V3 H3 V9" opacity="${0.2 + (n % 3) * 0.08}"/>`,
    flower: (n) => `<g opacity=".65">
      <ellipse cx="0" cy="-6" rx="3" ry="6" transform="rotate(0)"/>
      <ellipse cx="0" cy="-6" rx="3" ry="6" transform="rotate(72)"/>
      <ellipse cx="0" cy="-6" rx="3" ry="6" transform="rotate(144)"/>
      <ellipse cx="0" cy="-6" rx="3" ry="6" transform="rotate(216)"/>
      <ellipse cx="0" cy="-6" rx="3" ry="6" transform="rotate(288)"/>
    </g>
    ${dot(0, 0, 1.6, 0.45)}
    ${n % 2 ? `<path d="M0 8 q3 3 0 6" opacity=".35"/>` : ''}`,
    wave: () => `<path d="M-11 2 q5 -10 10 0 t10 0"/>
      <path d="M-11 7 q5 -6 10 0 t10 0" opacity=".4"/>`,
    sun: (n) => `<circle r="4" fill="${ink}" fill-opacity=".08"/>
      <path d="M0 -10 V-6 M0 6 V10 M-10 0 H-6 M6 0 H10 M-7 -7 L-4 -4 M4 4 L7 7 M7 -7 L4 -4 M-4 4 L-7 7" opacity="${0.4 + (n % 3) * 0.08}"/>`,
    atom: (n) => `<circle r="2" fill="${ink}" fill-opacity=".55" stroke="none"/>
      <ellipse rx="11" ry="4"/>
      <ellipse rx="11" ry="4" transform="rotate(60)"/>
      <ellipse rx="11" ry="4" transform="rotate(120)" opacity="${n % 2 ? '.35' : '.55'}"/>`,
    snow: () => `<path d="M0 -10 V10 M-9 -5 L9 5 M-9 5 L9 -5"/>
      <path d="M0 -6 l-3 3 M0 -6 l3 3 M0 6 l-3 -3 M0 6 l3 -3" opacity=".5"/>`,
    target: (n) => `<circle r="9"/><circle r="5" opacity=".5"/>
      ${dot(0, 0, 1.5 + (n % 2) * 0.4, 0.5)}`,
    tooth: () => `<path d="M-7 -8 q7 -4 14 0 q2 4 -1 8 l-2 9 l-3 -7 q-1 -2 -2 0 l-3 7 l-2 -9 q-3 -4 -1 -8 Z"/>`,
    triple: (n) => `<path d="M-8 -5 H8 M-8 0 H8 M-8 5 H8" opacity="${0.35 + (n % 3) * 0.1}"/>
      <circle cx="10" cy="-5" r="1.2" fill="${ink}" fill-opacity=".4" stroke="none"/>
      <circle cx="10" cy="5" r="1.2" fill="${ink}" fill-opacity=".4" stroke="none"/>`,
  };

  const GLYPH_BY_SYMBOL = {
    H: 'spark', He: 'balloon', Li: 'battery', Be: 'diamond', B: 'prism', C: 'diamond',
    N: 'triple', O: 'bubbles', F: 'drop', Ne: 'bulb',
    Na: 'flame', Mg: 'spark', Al: 'wing', Si: 'chip', P: 'flame', S: 'crown',
    Cl: 'bubbles', Ar: 'bulb', K: 'leaf', Ca: 'bone',
    Sc: 'wing', Ti: 'wing', V: 'spring', Cr: 'gear', Mn: 'battery', Fe: 'anvil',
    Co: 'compass', Ni: 'coin', Cu: 'coil', Zn: 'shield', Ga: 'thermo', Ge: 'chip',
    As: 'prism', Se: 'moon', Br: 'drop', Kr: 'bulb',
    Rb: 'clock', Sr: 'flame', Y: 'prism', Zr: 'diamond', Nb: 'magnet', Mo: 'gear',
    Tc: 'orbit', Ru: 'mesh', Rh: 'compass', Pd: 'mesh', Ag: 'moon', Cd: 'battery',
    In: 'drop', Sn: 'coin', Sb: 'flame', Te: 'lens', I: 'flower', Xe: 'bulb',
    Cs: 'clock', Ba: 'flame', La: 'lens', Ce: 'spark', Pr: 'prism', Nd: 'magnet',
    Pm: 'spark', Sm: 'magnet', Eu: 'flower', Gd: 'magnet', Tb: 'bulb', Dy: 'magnet',
    Ho: 'sun', Er: 'wave', Tm: 'lens', Yb: 'clock', Lu: 'diamond',
    Hf: 'chip', Ta: 'battery', W: 'bulb', Re: 'turbine', Os: 'nib', Ir: 'spark',
    Pt: 'ring', Au: 'crown', Hg: 'drop', Tl: 'thermo', Pb: 'shield', Bi: 'stair',
    Po: 'spark', At: 'ring', Rn: 'cloud',
    Fr: 'clock', Ra: 'spark', Ac: 'orbit', Th: 'atom', Pa: 'orbit', U: 'atom',
  };

  const POST_GLYPHS = ['atom', 'orbit', 'target', 'spark', 'ring', 'turbine'];

  function glyphFor(sym, num) {
    const key = GLYPH_BY_SYMBOL[sym] || POST_GLYPHS[num % POST_GLYPHS.length];
    return (GLYPHS[key] || GLYPHS.atom)(num);
  }

  /* Seven vertical assay marks encode the atomic number in binary, so even
     elements that share an emblem still carry a unique catalogue stamp. */
  function fingerprint(num) {
    let out = '';
    for (let bit = 0; bit < 7; bit += 1) {
      const x = 57.5 + bit * 4;
      out += (num >> bit) & 1
        ? `<path d="M${fixed(x)} 26 v5" opacity=".34" stroke-width="1.4"/>`
        : `<path d="M${fixed(x)} 28 v2.4" opacity=".2" stroke-width="1.2"/>`;
    }
    return out;
  }

  function ingot(num, glyph) {
    const rot = wobble(num, 1, 9);
    return `<g transform="rotate(${fixed(rot)} 48 64)">
      <path d="M20 53 L48 38 L76 53 L48 68 Z" fill="${ink}" fill-opacity=".14" stroke="none"/>
      <path d="M20 53 L48 68 L48 97 L20 82 Z"/>
      <path d="M76 53 L48 68 L48 97 L76 82 Z"/>
      <path d="M20 53 L48 38 L76 53 M48 68 L48 97"/>
      <path d="M28 59 l12 6 M28 66 l12 6 M28 73 l12 6" opacity=".38"/>
      <path d="M61 71 l9 -5 M61 78 l9 -5" opacity=".3"/>
      <path d="M32 46 l9 -4" opacity=".5"/>
      <g transform="translate(48 53) scale(.55)" opacity=".9">${glyph}</g>
      <circle cx="${fixed(67 + wobble(num, 5, 4))}" cy="${fixed(35 + wobble(num, 6, 5))}" r="1.3" fill="${ink}" fill-opacity=".45" stroke="none"/>
    </g>`;
  }

  function ampoule(num, content) {
    const rot = wobble(num, 2, 7);
    return `<g transform="rotate(${fixed(rot)} 48 64)">
      <path d="M40 22 h16 v13 l9 15 v33 a9 9 0 0 1 -9 9 h-16 a9 9 0 0 1 -9 -9 v-33 l9 -15 z"/>
      <path d="M36 58 h24" stroke-dasharray="1.5 4.5" opacity=".4"/>
      ${content}
      <path d="M34 88 h28" opacity=".35"/>
      <circle cx="${fixed(58 + wobble(num, 3, 3))}" cy="48" r="1.4" fill="${ink}" fill-opacity=".4" stroke="none"/>
      <circle cx="${fixed(63 + wobble(num, 4, 3))}" cy="54" r="1" fill="${ink}" fill-opacity=".35" stroke="none"/>
    </g>`;
  }

  function metalInVial(num, glyph) {
    const block = `<path d="M40 86 h16 v6 h-16 z" fill="${ink}" fill-opacity=".14" stroke-width="1.4"/>
      <path d="M40 89 h16" opacity=".3" stroke-width="1.2"/>`;
    const emblem = `<g transform="translate(48 70) scale(.62)" opacity=".9">${glyph}</g>`;
    return ampoule(num, block + emblem);
  }

  function halogenVial(num, state, glyph) {
    let content = '';
    if (state === 'liquid') {
      content = `<path d="M36 84 h24 v5 a3 3 0 0 1 -3 3 h-18 a3 3 0 0 1 -3 -3 z" fill="${ink}" fill-opacity=".16" stroke="none"/>
        <path d="M36 84 h24" opacity=".5" stroke-width="1.6"/>`;
    } else if (state === 'solid') {
      content = `<path d="M39 92 l4 -7 l4 7 z M47 92 l3 -5 l3 5 z" fill="${ink}" fill-opacity=".2" stroke-width="1.2"/>
        <path d="M36 92 h24" opacity=".3"/>`;
    } else {
      content = `<path d="M38 89 q5 -6 10 0 t10 0" opacity=".28" stroke-width="1.4"/>
        <circle cx="44" cy="92" r="1.4" fill="${ink}" fill-opacity=".35" stroke="none"/>
        <circle cx="55" cy="90" r="1" fill="${ink}" fill-opacity=".3" stroke="none"/>`;
    }
    return ampoule(num, content + `<g transform="translate(48 68) scale(.55)" opacity=".9">${glyph}</g>`);
  }

  function molecule(num, sym, glyph) {
    const rot = wobble(num, 7, 10);
    let backdrop = '';
    if (sym === 'H' || sym === 'N' || sym === 'O') {
      backdrop = `<path d="M26 64 H70" stroke-dasharray="2 4" opacity=".22"/>
        <circle cx="24" cy="64" r="3.2" fill="${ink}" fill-opacity=".12" stroke-width="1.3"/>
        <circle cx="72" cy="64" r="3.2" fill="${ink}" fill-opacity=".12" stroke-width="1.3"/>`;
    } else {
      for (let i = 0; i < 6; i += 1) {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const x = 48 + Math.cos(a) * 27;
        const y = 64 + Math.sin(a) * 24;
        const x2 = 48 + Math.cos(a + Math.PI / 3) * 27;
        const y2 = 64 + Math.sin(a + Math.PI / 3) * 24;
        backdrop += `<path d="M${fixed(x)} ${fixed(y)} L${fixed(x2)} ${fixed(y2)}" opacity=".16" stroke-width="1.3"/>`;
        backdrop += `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="1.8" fill="${ink}" fill-opacity=".15" stroke-width="1.1"/>`;
      }
    }

    return `<g transform="rotate(${fixed(rot)} 48 64)">
      <circle cx="48" cy="64" r="33" stroke-dasharray="1.5 5" opacity=".24"/>
      ${backdrop}
      <g transform="translate(48 63) scale(.92)" opacity=".95">${glyph}</g>
    </g>`;
  }

  function crystal(num, glyph) {
    const rot = wobble(num, 12, 10);
    const extra = num % 3;
    return `<g transform="rotate(${fixed(rot)} 48 64)">
      <g opacity=".48">
        <path d="M48 20 L63 42 L57 82 L37 93 L30 50 Z" fill="${ink}" fill-opacity=".12" stroke="none"/>
        <path d="M48 20 L63 42 L57 82 L37 93 L30 50 Z"/>
        <path d="M48 20 L48 64 L37 93 M48 64 L57 82 M48 64 L63 42 M30 50 L48 64"/>
        <path d="M64 66 l10 9 l-1 13 l-12 -7 z" opacity=".55" stroke-width="1.6"/>
        ${extra > 0 ? `<path d="M24 74 l8 7 l-1 10 l-9 -6 z" opacity=".38" stroke-width="1.4"/>` : ''}
        ${extra > 1 ? `<path d="M68 34 l6 4 l-1 7 l-6 -3 z" opacity=".3" stroke-width="1.3"/>` : ''}
      </g>
      <g transform="translate(47 61) scale(.6)" opacity=".95">${glyph}</g>
      <circle cx="${fixed(30 + wobble(num, 13, 8))}" cy="${fixed(34 + wobble(num, 14, 8))}" r="1.2" fill="${ink}" fill-opacity=".45" stroke="none"/>
    </g>`;
  }

  function nobleTube(num, glyph) {
    const rot = wobble(num, 15, 6);
    const start = 30 + Math.round(rand(num, 16) * 4);
    return `<g transform="rotate(${fixed(rot)} 48 64)">
      <rect x="15" y="48" width="66" height="31" rx="15.5"/>
      <path d="M12 56 v15 M84 56 v15" opacity=".4"/>
      <ellipse cx="48" cy="63.5" rx="28" ry="8" fill="${ink}" fill-opacity=".07" stroke="none"/>
      <path d="M${start} 75 q5 -4 10 0 t10 0" opacity=".22" stroke-width="1.4"/>
      <g transform="translate(48 62.5) scale(.6)" opacity=".95">${glyph}</g>
      <path d="M34 42 l4 -7 M48 41 v-8 M62 42 l-4 -7" opacity=".3"/>
    </g>`;
  }

  function atomPlate(num, radioactive, glyph) {
    const rot = wobble(num, 17, 12);
    return `<g transform="rotate(${fixed(rot)} 48 64)">
      <circle cx="48" cy="64" r="10" fill="${ink}" fill-opacity=".06" stroke="none"/>
      <g transform="rotate(-24 48 64)">
        <ellipse cx="48" cy="64" rx="31" ry="11"/>
        <circle cx="79" cy="64" r="2.2" fill="${ink}" fill-opacity=".5" stroke="none"/>
      </g>
      <g transform="rotate(42 48 64)">
        <ellipse cx="48" cy="64" rx="31" ry="11" opacity=".68"/>
        <circle cx="17" cy="64" r="2.2" fill="${ink}" fill-opacity=".4" stroke="none"/>
      </g>
      <g transform="rotate(96 48 64)">
        <ellipse cx="48" cy="64" rx="31" ry="11" opacity=".45"/>
        <circle cx="79" cy="64" r="1.8" fill="${ink}" fill-opacity=".35" stroke="none"/>
      </g>
      <g transform="translate(48 64) scale(.56)" opacity=".95">${glyph}</g>
      ${radioactive ? '<circle cx="48" cy="64" r="40" stroke-dasharray="2 7" opacity=".3"/>' : ''}
      <path d="M22 34 l3 -5 M74 34 l-3 -5 M48 24 v-6" opacity=".26"/>
    </g>`;
  }

  function droplet(num, glyph) {
    const rot = wobble(num, 18, 8);
    return `<g transform="rotate(${fixed(rot)} 48 64)">
      <path d="M48 26 C60 48 68 57 68 70 a20 20 0 0 1 -40 0 C28 57 36 48 48 26 Z" fill="${ink}" fill-opacity=".08"/>
      <path d="M48 38 C57 54 62 61 62 70 a14 14 0 0 1 -28 0 C34 61 39 54 48 38 Z" opacity=".6"/>
      <path d="M39 70 a9 9 0 0 0 7 9" opacity=".4"/>
      <g transform="translate(48 69) scale(.52)" opacity=".85">${glyph}</g>
      <circle cx="${fixed(72 + wobble(num, 19, 4))}" cy="${fixed(37 + wobble(num, 20, 5))}" r="2.2" fill="${ink}" fill-opacity=".3"/>
      <circle cx="27" cy="88" r="1.4" fill="${ink}" fill-opacity=".3" stroke="none"/>
    </g>`;
  }

  function specimen(el) {
    const [num, sym, , cat] = el;
    const state = el[10] || 'solid';
    const radioactive = String(el[7] || '').split(' ').includes('rad');
    const synthetic = num >= 104;
    const glyph = glyphFor(sym, num);

    let body;
    if (sym === 'Hg') body = droplet(num, glyph);
    else if (synthetic) body = atomPlate(num, true, glyph);
    else if (cat === 'g') body = nobleTube(num, glyph);
    else if (cat === 'h') body = halogenVial(num, state, glyph);
    else if (cat === 'n') body = molecule(num, sym, glyph);
    else if (cat === 'm') body = crystal(num, glyph);
    else if (cat === 'a' || cat === 'e') body = metalInVial(num, glyph);
    else if (cat === 'c') body = atomPlate(num, radioactive, glyph);
    else if (cat === 'l') body = ingot(num, glyph);
    else if (cat === 'u') body = atomPlate(num, radioactive, glyph);
    else body = ingot(num, glyph);

    const halo = radioactive && !synthetic && cat !== 'c' && cat !== 'u'
      ? '<circle cx="48" cy="64" r="41" stroke-dasharray="2 7" opacity=".26"/>'
      : '';
    const ticks = `<path d="M14 16 h8 M14 16 v8 M82 104 h-8 M82 104 v-8" opacity=".22" stroke-width="1.4"/>`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 120" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ticks}${halo}${fingerprint(num)}${body}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  /* A compact catalogue seal for tiles and cards: the element's emblem struck
     inside a paper disc, readable at 16px where the full specimen engraving is
     only texture. */
  function assaySeal(el, disc) {
    const [num, sym] = el;
    const glyph = glyphFor(sym, num);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="24" cy="24" r="22" fill="${disc}" fill-opacity=".94" stroke-opacity=".42" stroke-width="1.4"/>
      <g transform="translate(24 24) scale(1.5)">${glyph}</g>
    </svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  function themeName() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function forSymbol(symbol, theme = themeName()) {
    const key = `${theme}:${symbol}`;
    if (cache.has(key)) return cache.get(key);
    const el = ELEMENTS.find((row) => row[1] === symbol);
    ink = INKS[theme] || INKS.light;
    const art = el ? specimen(el) : '';
    cache.set(key, art);
    return art;
  }

  function forMark(symbol, theme = themeName()) {
    const key = `mark:${theme}:${symbol}`;
    if (cache.has(key)) return cache.get(key);
    const el = ELEMENTS.find((row) => row[1] === symbol);
    ink = INKS[theme] || INKS.light;
    const mark = el ? assaySeal(el, DISCS[theme] || DISCS.light) : '';
    cache.set(key, mark);
    return mark;
  }

  /* tiles and bench cards are long-lived, so a theme switch repaints them */
  function repaint(theme = themeName()) {
    document.querySelectorAll('.el[data-number]').forEach((tile) => {
      const sym = tile.querySelector('.el-sym')?.textContent;
      if (sym) {
        tile.style.setProperty('--art', forSymbol(sym, theme));
        tile.style.setProperty('--mark', forMark(sym, theme));
      }
    });
    document.querySelectorAll('.sb-chip[data-symbol]').forEach((chip) => {
      chip.style.setProperty('--mark', forMark(chip.dataset.symbol, theme));
    });
    document.querySelectorAll('.sb-atom[data-sym]').forEach((atom) => {
      atom.style.setProperty('--mark', forMark(atom.dataset.sym, theme));
    });
  }

  document.addEventListener('scilamp:theme', (event) => repaint(event.detail?.theme));

  return { forSymbol, forMark, repaint };
})();