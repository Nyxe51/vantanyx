// XP cumulée nécessaire pour atteindre le niveau N : 100×N + 5×N² (niveau 1 = départ à 0 XP).
export const xpAt = (n) => (n <= 1 ? 0 : 100 * n + 5 * n * n);

export function levelFromXp(xp) {
  let n = 1;
  while (xpAt(n + 1) <= xp) n++;
  return n;
}

export function levelProgress(xp) {
  const level = levelFromXp(xp);
  const from = xpAt(level);
  const to = xpAt(level + 1);
  return { level, into: xp - from, needed: to - from, ratio: (xp - from) / (to - from) };
}
