import { eachDay } from './dates.js';

// XP du jour = % du jour (0 à 100). Un jour exceptionnel ne rapporte rien.
// On exclut `excludeKey` (aujourd'hui) pour y ajouter la valeur en direct.
export function totalXp(days, excludeKey) {
  let sum = 0;
  for (const [key, d] of Object.entries(days)) {
    if (key === excludeKey || d.ex) continue;
    sum += d.pct || 0;
  }
  return sum;
}

// % moyen du mois en cours : les jours sans aucune donnée comptent pour 0,
// les jours exceptionnels sont ignorés. Renvoie null s'il n'y a aucun jour à compter.
export function monthPercent(days, today, livePct) {
  const all = { ...days, [today]: { ...(days[today] || {}), pct: livePct } };
  const first = Object.keys(all).sort()[0];
  const monthStart = `${today.slice(0, 8)}01`;
  const start = first > monthStart ? first : monthStart;
  let sum = 0;
  let n = 0;
  for (const key of eachDay(start, today)) {
    const d = all[key];
    if (d && d.ex) continue;
    sum += d ? d.pct || 0 : 0;
    n++;
  }
  return n ? Math.round(sum / n) : null;
}
