import { icons } from './icons.js';

const TAB_LABELS = [
  ['accueil', 'Accueil'],
  ['sport', 'Sport'],
  ['stats', 'Stats'],
];

const MENU = [
  ['profil', 'Profil'],
  ['glow', 'Glow up'],
  ['objectifs', 'Objectifs ultimes'],
  ['rangs', 'Rang et badges'],
  ['couleurs', 'Couleurs'],
  ['poids', 'Poids'],
  ['reglages', 'Réglages'],
];

// Construit une seule fois la coquille de l'appli : contenu, barre du bas, menu latéral, sous-écran.
export function mountShell(app) {
  app.innerHTML = `
    <main id="m"></main>
    <button class="menu" aria-label="Ouvrir le menu" data-act="drawer" data-arg="1">${icons.menu}</button>
    <div class="nav glass" id="nav"></div>
    <div class="scrim" id="scrim" data-act="drawer" data-arg="0"></div>
    <aside class="drawer" id="dr" aria-label="Menu">
      <div class="row" style="margin-bottom:10px">
        <span class="u chr" style="font-size:19px">Vantanyx</span>
        <button class="x" aria-label="Fermer" data-act="drawer" data-arg="0">✕</button>
      </div>
      <nav>${MENU.map(([k, l]) => `<button data-act="sub" data-arg="${k}">${l}</button>`).join('')}</nav>
    </aside>
    <section class="sub" id="sub" aria-hidden="true"></section>
    <section class="gate" id="gate"></section>
    <div class="updatebar glass" id="updatebar" hidden><span>Nouvelle version disponible</span><button class="btn" data-act="update">Mettre à jour</button></div>
    <div class="toast" id="toast" role="status" hidden></div>
  `;
}

export function renderNav(tab) {
  document.getElementById('nav').innerHTML = TAB_LABELS.map(
    ([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="tab" data-arg="${k}">${icons[k]}${l}</button>`,
  ).join('');
}

export function setDrawer(open) {
  document.getElementById('dr').classList.toggle('open', open);
  document.getElementById('scrim').classList.toggle('open', open);
}

export function setSub(html) {
  const el = document.getElementById('sub');
  if (html === null) {
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    return;
  }
  el.innerHTML = html;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
}

export function setUpdateBar(show) {
  document.getElementById('updatebar').hidden = !show;
}

let toastTimer = null;
export function showToast(text, ms = 3500) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), ms);
}
