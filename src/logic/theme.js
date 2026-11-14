// La couleur monte avec le % du jour (saturation) ; sa teinte vient de la couleur choisie.
export function applyTheme(root, pct, hue) {
  root.style.setProperty('--s', `${pct * 0.7}%`);
  root.style.setProperty('--h', String(hue));
}
