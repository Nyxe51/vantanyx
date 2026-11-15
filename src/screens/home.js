import { esc } from '../ui/html.js';
import { icons, star } from '../ui/icons.js';
import { ruleProgress } from '../logic/rules.js';
import quotes from '../data/quotes.json';

const fmtL = (cl) => String(cl / 100).replace('.', ',');

function renderRule(rule, value, pop) {
  const f = ruleProgress(rule, value);
  const done = f === 1;
  const popCls = (k) => (pop === k ? ' pop' : '');

  if (rule.type === 'gauge') {
    const cl = value || 0;
    return `<div class="rule glass${done ? ' done' : ''}" style="--f:${f}">
      <div class="t">
        <div class="row"><b>${esc(rule.name)}</b><span class="mu num">${fmtL(cl)} / ${fmtL(rule.goal)} L</span></div>
        <div class="bar wb"><i style="width:${Math.min((cl / rule.goal) * 100, 100)}%"></i></div>
        <div class="qk">
          <button class="btn" data-act="gauge" data-rule="${rule.id}" data-arg="25">+ 25 cl</button>
          <button class="btn" data-act="gauge" data-rule="${rule.id}" data-arg="50">+ 50 cl</button>
          <button class="btn ghost" data-act="gauge" data-rule="${rule.id}" data-arg="-25">− 25 cl</button>
        </div>
      </div></div>`;
  }

  if (rule.type === 'pair') {
    const v = value || [0, 0];
    const pills = rule.labels
      .map(
        (label, j) => `<div class="pill${v[j] ? ' done' : ''}${popCls(`${rule.id}.${j}`)}" data-hold="${rule.id}" data-j="${j}" data-done="${v[j] ? 1 : 0}" style="--f:${v[j] ? 1 : 0}">
          ${icons[j ? 'moon' : 'sun']}<span>${esc(label)}</span>${v[j] ? icons.ok : ''}</div>`,
      )
      .join('');
    return `<div class="rule glass nf"><div class="t">
      <div class="row"><b>${esc(rule.name)}</b><span class="mu num">${(v[0] ? 1 : 0) + (v[1] ? 1 : 0)} / 2</span></div>
      <div class="two">${pills}</div></div></div>`;
  }

  return `<div class="rule glass${done ? ' done' : ''}${popCls(rule.id)}" data-hold="${rule.id}" data-done="${done ? 1 : 0}" style="--f:${f}">
    <div class="t"><b>${esc(rule.name)}</b>${rule.sub ? `<small>${esc(rule.sub)}</small>` : ''}</div>
    <div class="ck">${icons.ok}</div></div>`;
}

function renderRules(state, d, pop) {
  let lastGroup = '';
  return state.rules
    .map((rule) => {
      const header = rule.group && rule.group !== lastGroup ? `<div class="gh">${esc(rule.group)}</div>` : '';
      lastGroup = rule.group || lastGroup;
      return header + renderRule(rule, d.values[rule.id], pop);
    })
    .join('');
}

// `d` = résultat de derive(), `view` = état d'affichage (phrase, animation).
export function renderHome(state, d, view) {
  const quote = quotes[(new Date().getDate() + view.quoteOffset) % quotes.length];
  const left = d.total - d.done;
  const initial = esc((state.profile.pseudo || '?').trim().charAt(0).toUpperCase());

  return `
    <div class="hero${state.ui.bg ? ' has-bg' : ''}">
      ${state.ui.bg ? '' : star}
      <p class="quote" data-act="quote">${esc(quote)}</p>
    </div>

    <div class="prof glass">
      <div class="av"><span class="u chr">${initial}</span></div>
      <div style="flex:1">
        <div class="row"><b class="u" style="font-size:15px">${esc(state.profile.pseudo)}</b><span class="rk">${esc(d.rank.name)}</span></div>
        <div class="row mu num" style="margin:3px 0 7px"><span>Niveau ${d.level}</span><span>+${d.pct} XP aujourd’hui</span></div>
        <div class="bar"><i style="width:${Math.round(d.levelRatio * 100)}%"></i></div>
      </div>
    </div>

    <div class="pad">
      <div class="glass card ringcard">
        <svg viewBox="0 0 100 100" width="108" height="108" style="flex:none" aria-hidden="true">
          <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:#fff"/><stop offset="1" style="stop-color:hsl(var(--h) var(--s) 62%)"/></linearGradient></defs>
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="7"/>
          <circle cx="50" cy="50" r="44" fill="none" stroke="url(#rg)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(d.pct * 2.765).toFixed(1)} 277" transform="rotate(-90 50 50)"/>
          <text x="50" y="58" text-anchor="middle" style="font:600 24px Unbounded;fill:#fff">${d.pct}%</text>
        </svg>
        <div>
          <b class="u chr" style="font-size:18px">Aujourd’hui</b>
          <div class="mu num" style="margin-top:4px">+${d.pct} XP · ${left} règle${left > 1 ? 's' : ''} restante${left > 1 ? 's' : ''}</div>
        </div>
      </div>

      <div class="sum">
        <div class="glass"><b class="num">${d.done}/${d.total}</b><span>règles du jour</span></div>
        <div class="glass"><b class="num">${d.month === null ? '—' : `${d.month} %`}</b><span>du mois</span></div>
        <div class="glass"><b class="num">—</b><span>séances</span></div>
      </div>

      <div class="row" style="margin:0 4px 6px"><h3 style="margin:0">Règles du jour</h3><b class="u num" style="color:var(--ac)">${d.pct} %</b></div>
      <div class="hint">Maintiens une règle 2 secondes pour la valider.</div>
      ${renderRules(state, d, view.pop)}
    </div>`;
}
