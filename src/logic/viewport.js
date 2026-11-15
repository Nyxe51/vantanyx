// Appli installée sur l'écran d'accueil de l'iPhone : iOS déclare une zone de page plus courte que l'écran
// (environ la hauteur de la barre d'état), ce qui laisse une bande noire en bas.
// On mesure la vraie hauteur de l'écran et on la donne à l'appli via --app-h.
// Hors appli installée (Safari, ordinateur), on ne touche à rien.
export function fitViewport(root = document.documentElement) {
  if (window.navigator.standalone !== true) {
    root.style.removeProperty('--app-h');
    return;
  }
  const portrait = window.innerHeight >= window.innerWidth;
  const long = Math.max(screen.width, screen.height);
  const short = Math.min(screen.width, screen.height);
  const screenH = portrait ? long : short;
  const gap = screenH - window.innerHeight;
  // Seulement si l'écart ressemble à une barre d'état (jamais plus de 120 px) : sinon on garde la valeur du navigateur.
  const h = gap > 0 && gap < 120 ? screenH : window.innerHeight;
  root.style.setProperty('--app-h', `${h}px`);
}

export function watchViewport() {
  fitViewport();
  ['resize', 'orientationchange', 'pageshow'].forEach((n) => window.addEventListener(n, fitViewport));
}
