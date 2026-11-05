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

/* RdYlBu reversed: deep blue for the lowest value through to red for the highest */
const HEAT_STOPS = [
  [49, 54, 149], [69, 117, 180], [116, 173, 209], [171, 217, 233],
  [224, 243, 248], [254, 224, 144], [253, 174, 97], [244, 109, 67], [215, 48, 39],
];

function heatRgb(t) {
  const k = Math.min(1, Math.max(0, t)) * (HEAT_STOPS.length - 1);
  const i = Math.min(Math.floor(k), HEAT_STOPS.length - 2);
  const f = k - i;
  const a = HEAT_STOPS[i];
  const b = HEAT_STOPS[i + 1];
  return [0, 1, 2].map((j) => Math.round(a[j] + (b[j] - a[j]) * f));
}

/* the middle of the scale is pale, both ends are dark, so the ink flips with luminance */
function heatInk(rgb) {
  const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return lum > 150 ? '#101c28' : '#eef7ff';
}

/* oxidation states and room-temperature states are curated in elements.js,
   next to the element records they describe, so they are not repeated here */
