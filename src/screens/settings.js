import { esc } from '../ui/html.js';

// Réglages : compte et fond d'accueil pour l'instant. D'autres réglages arriveront ici.
export function renderSettings(state) {
  return `<div class="top"><button class="back" data-act="back">‹ Retour</button></div>
    <div class="pad">
      <h2 style="margin-bottom:12px">Réglages</h2>
      ${
        state.account
          ? `<div class="glass card"><div class="mu">Connecté</div><b>${esc(state.account.email || '')}</b>
              <button class="btn" style="margin-top:10px" data-act="logout">Se déconnecter</button></div>`
          : '<div class="glass card"><b>Mode local</b><div class="mu">Tes données restent sur cet appareil, sans compte.</div></div>'
      }
      <div class="glass card row link" data-act="sub" data-arg="fond">
        <div><b>Fond de l’accueil</b><div class="mu">${state.ui.bg ? 'Photo personnalisée' : 'Image par défaut'}</div></div>
        <span class="mu">›</span>
      </div>
    </div>`;
}
