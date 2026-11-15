import { todayKey } from './dates.js';
import { dayPercent, rulesDone } from './rules.js';
import { levelProgress, xpAt } from './xp.js';
import { rankIndexForLevel } from './ranks.js';
import { totalXp, monthPercent } from './stats.js';

// Tout ce qu'on affiche, calculé à partir de l'état (une seule source de vérité).
export function derive(state, ranks) {
  const today = todayKey();
  const day = state.days[today] || { v: {}, ex: false };
  const pct = dayPercent(state.rules, day.v);
  const xp = totalXp(state.days, today) + (day.ex ? 0 : pct);
  let lp = levelProgress(xp);
  // Mode test (temporaire) : force un niveau pour voir les rangs et les couleurs sans attendre des mois.
  const forced = state.dev && state.dev.level;
  if (forced) {
    const needed = xpAt(forced + 1) - xpAt(forced);
    lp = { level: forced, into: Math.round(needed / 2), needed, ratio: 0.5 };
  }
  const rankIdx = rankIndexForLevel(lp.level, ranks);
  const colorIdx = Math.min(state.ui.colorIndex || 0, rankIdx);
  return {
    today,
    values: day.v,
    pct,
    done: rulesDone(state.rules, day.v),
    total: state.rules.length,
    xp,
    level: lp.level,
    levelRatio: lp.ratio,
    levelInto: lp.into,
    levelNeeded: lp.needed,
    forced: !!forced,
    rankIdx,
    rank: ranks[rankIdx],
    hue: ranks[colorIdx].hue,
    month: monthPercent(state.days, today, pct),
  };
}
