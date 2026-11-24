// Vrais chiffres (pompes, gainage…) : une règle « à cocher » peut porter un objectif chiffré { goal, unit }.
// Chaque jour garde ses chiffres dans day.n = { <idRègle>: nombre }. Saisir un chiffre ≥ objectif valide la règle.
export const MAX_COUNT = 100000;

// Valeur d'un jour pour une jauge chiffrée (pompes). Avant la conversion (gaugeFrom), la règle était « à cocher » :
// on lit alors le chiffre noté (n) s'il existe, sinon « objectif atteint » si elle était cochée.
export function gaugeValue(rule, key, day) {
  const v = day.v && day.v[rule.id];
  if (!rule.gaugeFrom || key >= rule.gaugeFrom) return typeof v === 'number' ? v : 0;
  const n = day.n && day.n[rule.id];
  if (typeof n === 'number') return n;
  return v === 1 ? rule.goal : 0;
}

// Record de chaque règle chiffrée :
//  - règle à chiffre unique (gainage) : plus grand chiffre noté ;
//  - jauge chiffrée (pompes) : meilleur total sur une journée.
export function countRecords(days, rules) {
  const out = {};
  for (const r of rules) {
    let best = 0;
    if (r.type === 'gauge' && r.unit) {
      for (const [key, d] of Object.entries(days)) best = Math.max(best, gaugeValue(r, key, d));
    } else if (r.count) {
      for (const d of Object.values(days)) {
        const n = d.n && d.n[r.id];
        if (typeof n === 'number' && n > best) best = n;
      }
    } else continue;
    if (best > 0) out[r.id] = best;
  }
  return out;
}

// 65 s → « 1 min 05 » ; 32 rép. → « 32 rép. ».
export function fmtCount(n, unit) {
  if (unit === 's') return n >= 60 ? `${Math.floor(n / 60)} min ${String(n % 60).padStart(2, '0')}` : `${n} s`;
  return `${n} ${unit}`;
}

// Pas des boutons − / + selon l'unité.
export const stepsFor = (unit) => (unit === 's' ? [-10, -5, 5, 10] : [-5, -1, 1, 5]);
