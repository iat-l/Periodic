/* one shared source for every extended property: Bowserinator's Periodic-Table-JSON,
   fetched once on demand and normalised here, so no property data is duplicated */

const EXT_URL = 'https://cdn.jsdelivr.net/gh/Bowserinator/Periodic-Table-JSON@master/PeriodicTableJSON.json';

const fin = (v) => (typeof v === 'number' && isFinite(v) ? v : null);

let extPromise = null;

/* resolves to Map<number, record>, or null when the dataset could not be fetched */
function loadExtended() {
  if (!extPromise) {
    extPromise = fetch(EXT_URL)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((json) => {
        const map = new Map();
        json.elements.forEach((e) => {
          if (!(e.number >= 1 && e.number <= 118)) return;
          map.set(e.number, {
            en: fin(e.electronegativity_pauling),
            radius: fin(e.atomic_radii && e.atomic_radii.empirical && e.atomic_radii.empirical[0]),
            melt: fin(e.melt),
            boil: fin(e.boil),
            ie1: fin(e.ionization_energies && e.ionization_energies[0]),
            density: fin(e.density_g_cm3),
            discovered: e.discovered_by || null,
            config: e.electron_configuration_semantic || null,
            spectral: e.spectral_img || null,
          });
        });
        return map;
      })
      .catch(() => {
        extPromise = null;   /* a later attempt may find the network again */
        return null;
      });
  }
  return extPromise;
}

/* ---------- heatmap ---------- */

const HEAT_PROPS = {
  en: { label: 'Electronegativity', unit: 'Pauling', fmt: (v) => v.toFixed(2) },
  radius: { label: 'Atomic radius', unit: 'pm', fmt: (v) => String(Math.round(v)) },
  melt: { label: 'Melting point', unit: 'K', fmt: (v) => String(Math.round(v)) },
  boil: { label: 'Boiling point', unit: 'K', fmt: (v) => String(Math.round(v)) },
  ie1: { label: 'Ionisation energy', unit: 'kJ/mol', fmt: (v) => String(Math.round(v)) },
};

/* pastel to ink: mint, celadon, powder blue, lavender, blush, mauve, plum */
const HEAT_STOPS = [
  [242, 249, 244], [220, 239, 227], [217, 234, 246], [230, 225, 244],
  [247, 224, 221], [201, 155, 159], [61, 40, 51],
];

function heatRgb(t) {
  const k = Math.min(1, Math.max(0, t)) * (HEAT_STOPS.length - 1);
  const i = Math.min(Math.floor(k), HEAT_STOPS.length - 2);
  const f = k - i;
  const a = HEAT_STOPS[i];
  const b = HEAT_STOPS[i + 1];
  return [0, 1, 2].map((j) => Math.round(a[j] + (b[j] - a[j]) * f));
}

/* compare true relative luminance, not raw channel weight, so amber keeps
   black ink and the hot vermilions flip to white */
function relLuminance(rgb) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

function heatInk(rgb) {
  return relLuminance(rgb) > 0.22 ? '#191612' : '#fbfaf6';
}

/* oxidation states and room-temperature states are curated in elements.js,
   next to the element records they describe, so they are not repeated here */
