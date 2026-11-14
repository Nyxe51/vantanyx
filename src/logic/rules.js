// Avancement d'une règle, de 0 à 1, selon son type :
//  - check : fait / pas fait
//  - gauge : jauge (ex. eau en cl, objectif `goal`)
//  - pair  : deux passages (ex. skincare matin + soir, 50 % chacun)
export function ruleProgress(rule, value) {
  switch (rule.type) {
    case 'gauge':
      return Math.min((value || 0) / rule.goal, 1);
    case 'pair': {
      const v = value || [0, 0];
      return ((v[0] ? 1 : 0) + (v[1] ? 1 : 0)) / 2;
    }
    default:
      return value ? 1 : 0;
  }
}

export const isDone = (rule, value) => ruleProgress(rule, value) === 1;

// % du jour = moyenne d'avancement de toutes les règles (0 à 100).
export function dayPercent(rules, values) {
  if (!rules.length) return 0;
  const sum = rules.reduce((a, r) => a + ruleProgress(r, values[r.id]), 0);
  return Math.round((sum / rules.length) * 100);
}

export const rulesDone = (rules, values) => rules.filter((r) => isDone(r, values[r.id])).length;
