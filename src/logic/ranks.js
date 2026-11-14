// `ranks` vient de data/ranks.json (passé en paramètre pour garder ce fichier testable seul).
export function rankIndexForLevel(level, ranks) {
  let idx = 0;
  ranks.forEach((r, i) => {
    if (level >= r.minLevel) idx = i;
  });
  return idx;
}
