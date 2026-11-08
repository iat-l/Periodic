/* ============================================================
   Shared chemistry helpers
   ------------------------------------------------------------
   Formula formatting and small integer utilities used by the
   compound data and the sandbox. Element records stay in
   elements.js; nothing here re-states an element record.
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
