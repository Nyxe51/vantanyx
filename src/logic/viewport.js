// Repère l'appli installée sur l'écran d'accueil : la classe "standalone" sur <html> active
// le filet de sécurité de base.css (voir « html.standalone »).
// L'ancien correctif (hauteur forcée en JS via --app-h) est retiré : sur iOS 26, WebKit ne dessine rien
// au-delà de la fenêtre, donc agrandir l'appli coupait la barre du bas au lieu de la descendre.
export function watchViewport() {
  const root = document.documentElement;
  const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  root.classList.toggle('standalone', standalone);
  root.style.removeProperty('--app-h');
}
