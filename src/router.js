// Routage par « hash » (#/accueil) : GitHub Pages ne gère pas les vraies adresses d'écran.
export const TABS = ['accueil', 'sport', 'stats'];
export const SUBS = ['profil', 'glow', 'objectifs', 'rangs', 'poids', 'reglages', 'couleurs'];

let lastTab = 'accueil';
const listeners = new Set();

export function parse() {
  const name = location.hash.replace(/^#\/?/, '');
  if (TABS.includes(name)) {
    lastTab = name;
    return { tab: name, sub: null };
  }
  if (SUBS.includes(name)) return { tab: lastTab, sub: name };
  return { tab: lastTab, sub: null };
}

function emit() {
  const r = parse();
  listeners.forEach((fn) => fn(r));
}

export function onChange(fn) {
  listeners.add(fn);
}

addEventListener('hashchange', emit);

// Changer d’onglet ne remplit pas l’historique ; un sous-écran en ajoute un : le retour du téléphone le ferme.
export function goTab(name) {
  history.replaceState(null, '', `#/${name}`);
  emit();
}

export function openSub(name) {
  location.hash = `#/${name}`;
}

export function closeSub() {
  if (!parse().sub) return;
  if (history.length > 1) history.back();
  else goTab(lastTab);
}
