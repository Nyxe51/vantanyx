// Saisie du vrai chiffre du jour (pompes, gainage…).
import { esc } from '../ui/html.js';
import { fmtCount, stepsFor, MAX_COUNT } from '../logic/counts.js';

let counting = null;
export const setCounting = (id) => {
  counting = id;
};
export const getCounting = () => counting;

export function renderCount(state, d) {
  const rule = state.rules.find((r) => r.id === counting && r.count);
  if (!rule) {
    return `<div class="top"><button class="back" data-act="back">‹ Retour</button></div><div class="pad"><div class="glass card soon"><b>Règle introuvable</b></div></div>`;
  }
  const { goal, unit } = rule.count;
  const n = d.counts[rule.id];
  const rec = d.records[rule.id];
  const steps = stepsFor(unit);
  const unitLabel = unit === 's' ? 'secondes' : unit;
  return `<div class="top"><button class="back" data-act="back">‹ Retour</button></div>
    <div class="pad">
      <h2 style="margin-bottom:6px">${esc(rule.name)}</h2>
      <p class="mu" style="margin-bottom:16px">Objectif ${fmtCount(goal, unit)} · Record ${rec ? fmtCount(rec, unit) : '—'}</p>
      <label class="lbl" for="cn-val">Ton vrai chiffre aujourd’hui (${esc(unitLabel)})</label>
      <input class="in big num" id="cn-val" type="number" inputmode="numeric" min="0" max="${MAX_COUNT}" step="1" placeholder="${goal}" value="${n ?? ''}" autocomplete="off">
      <div class="stp" style="justify-content:center;margin-bottom:14px">${steps
        .map((s) => `<button data-act="cnt-step" data-arg="${s}" aria-label="${s > 0 ? 'Plus' : 'Moins'} ${Math.abs(s)}">${s > 0 ? '+' : '−'}${Math.abs(s)}</button>`)
        .join('')}</div>
      <p class="mu" style="margin-bottom:14px">À partir de ${fmtCount(goal, unit)}, la règle est validée toute seule. En dessous, elle ne l’est pas.</p>
      <button class="cta" data-act="cnt-save">Enregistrer</button>
      ${n != null ? '<button class="btn ghost danger" style="width:100%;padding:12px" data-act="cnt-clear">Effacer mon chiffre</button>' : ''}
    </div>`;
}
