import { esc } from '../ui/html.js';
import { isTest, appEnv } from '../env.js';
import { APP_VERSION } from '../version.js';
import { activeRules } from '../logic/rules.js';
import { syncMessage } from '../syncstatus.js';

const ENV_LABEL = { test: 'test', prod: 'vraie appli', local: 'local' };

// Réglages : compte, synchronisation, sauvegarde, fond d'accueil. D'autres réglages arriveront ici.
export function renderSettings(state, sync) {
  const msg = state.account ? syncMessage(sync) : null;
  const syncCard = state.account
    ? `<div class="glass card"><b>Synchronisation</b>
        <div class="mu syncline ${msg ? msg.level : 'ok'}" style="margin-top:4px">${msg ? esc(msg.text) : 'À jour · tout est enregistré'}</div>
        ${
          sync.error
            ? '<button class="btn" style="margin-top:10px" data-act="resync">Renvoyer toutes mes données</button>'
            : ''
        }</div>`
    : '';

  return `<div class="top"><button class="back" data-act="back">‹ Retour</button></div>
    <div class="pad">
      <h2 style="margin-bottom:12px">Réglages</h2>
      ${
        state.account
          ? `<div class="glass card"><div class="mu">Connecté</div><b>${esc(state.account.email || '')}</b>
              ${isTest ? '<div class="mu" style="margin-top:6px">Environnement de test (compte admin)</div>' : ''}
              <button class="btn" style="margin-top:10px" data-act="logout">Se déconnecter</button></div>`
          : '<div class="glass card"><b>Mode local</b><div class="mu">Tes données restent sur cet appareil, sans compte.</div></div>'
      }
      ${syncCard}
      <div class="glass card row link" data-act="sub" data-arg="regles">
        <div><b>Règles</b><div class="mu">${activeRules(state.rules).length} active${activeRules(state.rules).length > 1 ? 's' : ''} sur ${state.rules.length}</div></div>
        <span class="mu">›</span>
      </div>
      <div class="glass card row link" data-act="sub" data-arg="fond">
        <div><b>Fond de l’accueil</b><div class="mu">${state.ui.bg ? 'Photo personnalisée' : 'Image par défaut'}</div></div>
        <span class="mu">›</span>
      </div>
      <div class="glass card">
        <b>Sauvegarde</b>
        <div class="mu" style="margin:4px 0 10px">Un fichier avec tes règles, tes jours et ton fond. À garder en lieu sûr.</div>
        <div class="two">
          <button class="pill" data-act="export">Exporter</button>
          <label class="pill">Importer<input type="file" accept="application/json,.json" data-importfile hidden></label>
        </div>
      </div>
      <div class="mu" style="text-align:center;margin:18px 0 6px">Vantanyx v${APP_VERSION} · ${ENV_LABEL[appEnv] || appEnv}</div>
    </div>`;
}
