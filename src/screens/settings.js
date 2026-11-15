// Réglages : pour l'instant, seulement le fond d'accueil. D'autres réglages arriveront ici.
export function renderSettings(state) {
  return `<div class="top"><button class="back" data-act="back">‹ Retour</button></div>
    <div class="pad">
      <h2 style="margin-bottom:12px">Réglages</h2>
      <div class="glass card row link" data-act="sub" data-arg="fond">
        <div><b>Fond de l’accueil</b><div class="mu">${state.ui.bg ? 'Photo personnalisée' : 'Image par défaut'}</div></div>
        <span class="mu">›</span>
      </div>
    </div>`;
}
