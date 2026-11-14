// Les « clés de jour » sont des dates locales au format AAAA-MM-JJ.
const pad = (n) => String(n).padStart(2, '0');

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Parcourt chaque jour de `a` à `b` inclus (clés AAAA-MM-JJ).
export function* eachDay(a, b) {
  const end = Date.parse(`${b}T00:00:00Z`);
  for (let t = Date.parse(`${a}T00:00:00Z`); t <= end; t += 86400000) {
    yield new Date(t).toISOString().slice(0, 10);
  }
}
