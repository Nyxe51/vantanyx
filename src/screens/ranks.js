import { esc } from '../ui/html.js';
import { icons } from '../ui/icons.js';
import ranksData from '../data/ranks.json';

const RANKS = ranksData.ranks;
const orbBg = (hue) => `radial-gradient(circle at 35% 30%, #fff, hsl(${hue} 75% 58%) 42%, hsl(${hue} 70% 16%))`;

// Badges ponctuels : les emplacements existent, ils se débloqueront quand les modules concernés seront là.
const SPECIAL_BADGES = ['Premier mois', 'Record battu', 'Comparaison de photos', 'Objectif atteint'];

export function renderRanks(state, d) {
  const next = RANKS[d.rankIdx + 1];
  const row = (r, i) => {
    const style = i === d.rankIdx ? 'color:var(--ac)' : i > d.rankIdx ? 'opacity:.5' : '';
    return `<tr style="${style}"><td style="width:24px"><i class="sw" style="background:hsl(${r.hue} 70% 58%)"></i></td>
      <td><b>${esc(r.name)}</b></td><td class="num">${r.minLevel}${i < RANKS.length - 1 ? `–${RANKS[i + 1].minLevel - 1}` : '+'}</td><td class="mu">${esc(r.eta)}</td></tr>`;
  };

  const rankBadges = RANKS.map((r, i) => {
    const ok = i <= d.rankIdx;
    return `<div class="glass card bdg${ok ? '' : ' off'}"><div class="u chr bdg-art">${ok ? '✦' : icons.lock}</div><div class="mu">${esc(r.name)}</div></div>`;
  }).join('');

  const special = SPECIAL_BADGES.map(
    (n) => `<div class="glass card bdg off"><div class="u chr bdg-art">${icons.lock}</div><div class="mu">${esc(n)}</div></div>`,
  ).join('');

  return `<div class="top"><button class="back" data-act="back">‹ Retour</button></div>
    <div class="pad">
      <h2 style="margin-bottom:12px">Rang et badges</h2>

      <div class="glass card">
        <div class="row"><b class="u chr" style="font-size:20px">${esc(d.rank.name)}</b><span class="mu num">Niveau ${d.level}</span></div>
        <div class="bar" style="margin:10px 0 6px"><i style="width:${Math.round(d.levelRatio * 100)}%"></i></div>
        <div class="row mu num"><span>${d.levelInto} / ${d.levelNeeded} XP</span><span>${
          next ? `Prochain rang : ${esc(next.name)} (niveau ${next.minLevel})` : 'Rang maximum'
        }</span></div>
      </div>

      <div class="glass card"><table>${RANKS.map(row).join('')}</table></div>

      <div class="glass card row link" data-act="sub" data-arg="couleurs">
        <div><b>Couleurs</b><div class="mu">${d.rankIdx + 1} / ${RANKS.length} débloquées</div></div>
        <span class="mu">›</span>
      </div>

      <h3>Badges de rang</h3>
      <div class="bdg-grid">${rankBadges}</div>
      <h3 style="margin-top:14px">Badges ponctuels</h3>
      <div class="bdg-grid">${special}</div>

      <div class="glass card" style="margin-top:14px">
        <div class="row">
          <div><b>Mode test</b><div class="mu">Temporaire : simule un niveau${d.forced ? ' (actif)' : ''}</div></div>
          <div class="stp">
            <button data-act="dev-level" data-arg="-5" aria-label="Niveau moins 5">−</button>
            <b class="num">${d.level}</b>
            <button data-act="dev-level" data-arg="5" aria-label="Niveau plus 5">+</button>
          </div>
        </div>
        ${d.forced ? '<button class="btn" style="margin-top:10px" data-act="dev-level" data-arg="reset">Revenir au vrai niveau</button>' : ''}
      </div>
    </div>`;
}

export function renderColors(state, d) {
  const chosen = Math.min(state.ui.colorIndex || 0, d.rankIdx);
  const orbs = RANKS.map((r, i) => {
    const ok = i <= d.rankIdx;
    const on = ok && i === chosen;
    return `<div class="glass card orbcard${on ? ' on-b' : ''}${ok ? '' : ' off'}" ${ok ? `data-act="color" data-arg="${i}"` : ''}>
      <div class="orb" style="background:${ok ? orbBg(r.hue) : '#15181d'}">${ok ? '' : icons.lock}</div>
      <b class="u" style="font-size:13px">${esc(r.name)}</b>
      <div class="mu">${ok ? (on ? 'Active' : 'Débloquée') : `Niveau ${r.minLevel}`}</div></div>`;
  }).join('');

  return `<div class="top"><button class="back" data-act="back">‹ Retour</button></div>
    <div class="pad">
      <h2 style="margin-bottom:6px">Couleurs</h2>
      <p class="mu" style="margin-bottom:14px">Chaque rang atteint débloque sa couleur. Elle teinte toute l’appli ; son intensité suit ton % du jour.</p>
      <div class="g2">${orbs}</div>
    </div>`;
}
