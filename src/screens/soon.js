import { esc } from '../ui/html.js';

const TITLES = {
  sport: 'Sport',
  stats: 'Stats',
  profil: 'Profil',
  glow: 'Glow up',
  objectifs: 'Objectifs ultimes',
  rangs: 'Rang et badges',
  couleurs: 'Couleurs',
  poids: 'Poids',
  reglages: 'Réglages',
};

// Écran provisoire pour tout ce qui n'est pas encore construit.
export function renderSoon(name) {
  return `<div class="top"><h1>${esc(TITLES[name] || name)}</h1></div>
    <div class="pad"><div class="glass card soon"><b>Bientôt</b><div class="mu" style="margin-top:4px">Cet écran arrive dans une prochaine étape.</div></div></div>`;
}

export function renderSubScreen(name) {
  return `<div class="top"><button class="back" data-act="back">‹ Retour</button></div>
    <div class="pad"><h2 style="margin-bottom:12px">${esc(TITLES[name] || name)}</h2>
    <div class="glass card soon"><b>Bientôt</b><div class="mu" style="margin-top:4px">Cet écran arrive dans une prochaine étape.</div></div></div>`;
}
