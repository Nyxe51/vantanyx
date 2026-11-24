import './styles/base.css';
import './styles/glass.css';
import './styles/components.css';
import './styles/shell.css';
import './styles/home.css';
import './styles/ranks.css';
import './styles/gate.css';
import './styles/rules.css';

import { getState, subscribe, actions, transient, startRemote, stopRemote } from './store.js';
import { firebaseEnabled, db, projectId } from './firebase.js';
import { watchAuth, signIn, signUp, resetPassword, signOutUser, authErrorMessage, takePendingPseudo } from './auth.js';
import { createSync } from './sync.js';
import { doc, collection, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { gate, renderGate } from './screens/gate.js';
import { parse, onChange, goTab, openSub, closeSub } from './router.js';
import { derive } from './logic/derive.js';
import { applyTheme } from './logic/theme.js';
import { initHold } from './logic/hold.js';
import { watchViewport } from './logic/viewport.js';
import { mountShell, renderNav, setDrawer, setSub, setUpdateBar, showToast } from './ui/shell.js';
import { registerSW } from 'virtual:pwa-register';
import { getSyncStatus, subscribeSync, clearSyncError, resetSyncStatus } from './syncstatus.js';
import { buildExport, exportFileName, parseExport } from './logic/backup.js';
import { saveJsonFile } from './logic/download.js';
import { renderHome } from './screens/home.js';
import { renderSoon, renderSubScreen } from './screens/soon.js';
import { renderSettings } from './screens/settings.js';
import { renderRulesEditor, renderRuleForm, setEditing, getEditing } from './screens/rules.js';
import { isActive } from './logic/rules.js';
import { renderRanks, renderColors } from './screens/ranks.js';
import { renderBackground, initDraft, resetDraft, chooseFile, saveDraft, resetFit, removeBackground, bindBackgroundEditor } from './screens/background.js';
import { DEFAULT_FIT } from './logic/bgfit.js';
import ranksData from './data/ranks.json';

watchViewport();

const app = document.getElementById('app');
mountShell(app);
const main = document.getElementById('m');

// État d'affichage (non sauvegardé).
const view = { quoteOffset: 0, pop: '' };
let shownBg = null;
let shownFit = '';
let shownDay = null;
let ready = !firebaseEnabled; // en mode compte : vrai quand les données du compte sont chargées

// Contenu du sous-écran ouvert (menu latéral, réglages…).
function subHtml(name, state, d) {
  if (name === 'reglages') return renderSettings(state, getSyncStatus());
  if (name === 'rangs') return renderRanks(state, d);
  if (name === 'couleurs') return renderColors(state, d);
  if (name === 'fond') return renderBackground();
  if (name === 'regles') return renderRulesEditor(state);
  if (name === 'regle') return renderRuleForm(state);
  return renderSubScreen(name);
}

function render() {
  if (firebaseEnabled && !ready) return; // tant que le compte n'est pas chargé, l'écran de chargement reste affiché
  const state = getState();
  const route = parse();
  const d = derive(state, ranksData.ranks);

  applyTheme(document.documentElement, d.pct, d.hue);

  // Fond d'accueil : des variables CSS, posées seulement quand l'image ou son cadrage change.
  if (state.ui.bg !== shownBg) {
    shownBg = state.ui.bg;
    app.style.setProperty('--hero-bg', shownBg ? `url("${shownBg}")` : 'none');
  }
  const fit = state.ui.bgFit || DEFAULT_FIT;
  const fitKey = `${fit.x}|${fit.y}|${fit.z}`;
  if (fitKey !== shownFit) {
    shownFit = fitKey;
    app.style.setProperty('--bgx', `${fit.x * 100}%`);
    app.style.setProperty('--bgy', `${fit.y * 100}%`);
    app.style.setProperty('--bgz', String(fit.z));
  }

  // Le brouillon du réglage du fond n'existe que tant que cet écran est ouvert.
  if (route.sub === 'fond') initDraft(state);
  else resetDraft();

  view.pop = transient.pop;
  transient.pop = '';
  main.innerHTML = route.tab === 'accueil' ? renderHome(state, d, view, getSyncStatus()) : renderSoon(route.tab);

  renderNav(route.tab);
  // Le formulaire d'une règle n'est pas réaffiché pendant la saisie (une synchro ne doit pas effacer ce qu'on tape).
  const typing = route.sub === 'regle' && document.getElementById('rf-name');
  if (!typing) setSub(route.sub ? subHtml(route.sub, state, d) : null);
  shownDay = d.today;
}

// --- Clics : tout passe par data-act="..." ---
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const { act, arg, rule } = el.dataset;
  switch (act) {
    case 'tab':
      goTab(arg);
      main.scrollTop = 0;
      break;
    case 'drawer':
      setDrawer(arg === '1');
      break;
    case 'sub':
      setDrawer(false);
      openSub(arg);
      break;
    case 'back':
      closeSub();
      break;
    case 'gauge':
      actions.adjustGauge(rule, Number(arg));
      break;
    case 'quote':
      view.quoteOffset++;
      render();
      break;
    case 'color':
      actions.setColor(Number(arg));
      break;
    case 'dev-level': {
      const cur = derive(getState(), ranksData.ranks).level;
      actions.setDevLevel(arg === 'reset' ? null : Math.max(1, cur + Number(arg)));
      break;
    }
    case 'auth-mode':
      gate.mode = arg;
      gate.msg = '';
      gate.info = '';
      renderGate();
      break;
    case 'logout':
      signOutUser();
      break;
    case 'export': {
      const text = JSON.stringify(buildExport(getState()), null, 2);
      saveJsonFile(exportFileName(), text).then((r) => {
        if (r === 'downloaded') showToast('Sauvegarde téléchargée.');
        else if (r === 'shared') showToast('Sauvegarde prête.');
      });
      break;
    }
    case 'resync':
      showToast('Envoi en cours…');
      actions.resyncAll().then((ok) => {
        if (ok) clearSyncError();
        showToast(ok ? 'Tout est renvoyé et enregistré.' : 'Le renvoi a échoué : l’erreur persiste.');
      });
      break;
    case 'update':
      updateSW(true);
      setTimeout(() => location.reload(), 3000); // filet de sécurité si le rechargement automatique n'a pas lieu
      break;
    case 'reload':
      location.reload();
      break;
    case 'rule-toggle': {
      const r = getState().rules.find((x) => x.id === rule);
      if (!r) break;
      const res = actions.toggleRule(rule, !isActive(r));
      if (res.error) showToast(res.error);
      break;
    }
    case 'rule-edit':
      setEditing(rule);
      openSub('regle');
      break;
    case 'rule-new':
      setEditing(null);
      openSub('regle');
      break;
    case 'rule-save': {
      const name = document.getElementById('rf-name').value;
      const typeEl = document.querySelector('input[name="rf-type"]:checked');
      const sel = document.getElementById('rf-group');
      const group = document.getElementById('rf-newgroup').value.trim() || (sel ? sel.value : '');
      const id = getEditing();
      const res = id ? actions.editRule(id, { name, group }) : actions.addRule({ name, type: typeEl ? typeEl.value : 'check', group });
      if (res.error) showToast(res.error);
      else {
        closeSub();
        showToast('Règle enregistrée.');
      }
      break;
    }
    case 'bg-save':
      if (saveDraft()) closeSub();
      break;
    case 'bg-reset':
      resetFit();
      render();
      break;
    case 'bg-remove':
      removeBackground();
      closeSub();
      break;
  }
});

// Choix d'une photo pour le fond d'accueil (l'enregistrement se fait avec « Enregistrer »).
document.addEventListener('change', async (e) => {
  const input = e.target.closest('[data-bgfile]');
  if (!input || !input.files[0]) return;
  try {
    await chooseFile(input.files[0]);
  } catch (err) {
    console.warn(err);
  }
  input.value = '';
  render();
});

// Glisser / pincer / zoomer dans l'écran de réglage du fond.
bindBackgroundEditor(document.getElementById('sub'));

// Appui long sur une règle.
initHold(main, (id, j, wasDone) => actions.setCheck(id, j, !wasDone));

subscribe(render);
onChange(render);
subscribeSync(render); // l'affichage suit l'état de la synchronisation

// Import d'une sauvegarde : on vérifie le fichier, on demande confirmation, puis on importe.
document.addEventListener('change', async (e) => {
  const input = e.target.closest('[data-importfile]');
  if (!input || !input.files[0]) return;
  const file = input.files[0];
  input.value = '';
  const res = parseExport(await file.text());
  if (!res.ok) {
    window.alert(res.error);
    return;
  }
  const s = res.dayCount > 1 ? 's' : '';
  const ok = window.confirm(
    `Importer ${res.dayCount} jour${s} et ${res.ruleCount} règle${res.ruleCount > 1 ? 's' : ''} ?\n\nLes jours du fichier remplacent ceux de même date. Tes règles, ta couleur et ton fond seront remplacés par ceux du fichier.`,
  );
  if (!ok) return;
  actions.importData(res.data);
  showToast('Sauvegarde importée.');
});

// Mise à jour de l'appli : on prévient quand une nouvelle version est prête, et on la cherche régulièrement.
const updateSW = registerSW({
  onNeedRefresh() {
    // Seulement si la page est déjà gérée par l'appli installée ; sinon la nouvelle version s'active toute seule.
    if (navigator.serviceWorker && navigator.serviceWorker.controller) setUpdateBar(true);
  },
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => reg.update().catch(() => {});
    setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) check();
    });
  },
});

// --- Compte (Firebase) ---
let sync = null;
let stopListening = null;
let currentUid = null;

function startSession(user) {
  if (currentUid === user.uid) return;
  currentUid = user.uid;
  ready = false;
  gate.view = 'loading';
  renderGate();
  sync = createSync({ db, fs: { doc, collection, onSnapshot, setDoc, deleteDoc, writeBatch }, importedFlag: `vantanyx:legacy-imported:${projectId}` });
  startRemote(sync.backend(user.uid), { email: user.email, uid: user.uid });
  stopListening = sync.listen(user.uid, {
    pseudo: () => takePendingPseudo() || user.displayName || (user.email || '').split('@')[0] || 'Nyxe',
    onReady() {
      ready = true;
      actions.migrateNames();
      gate.view = null;
      renderGate();
      render();
    },
    onError(err) {
      console.warn(err);
      gate.view = 'error';
      gate.msg =
        err && err.code === 'schema-too-new'
          ? 'Tes données ont été enregistrées par une version plus récente de l’appli. Ferme complètement l’appli puis rouvre-la pour la mettre à jour.'
          : err && err.code === 'permission-denied'
          ? 'Accès refusé à tes données (permission-denied). Les règles de sécurité Firestore ne sont sans doute pas publiées sur ce projet.'
          : `Impossible de charger tes données${err && err.code ? ` (${err.code})` : ''}. Vérifie ta connexion.`;
      renderGate();
    },
  });
}

function endSession() {
  if (stopListening) stopListening();
  stopListening = null;
  sync = null;
  currentUid = null;
  ready = false;
  stopRemote();
  resetSyncStatus();
  resetDraft();
  gate.view = 'auth';
  gate.mode = 'login';
  gate.msg = '';
  gate.info = '';
  renderGate();
}

// Envoi des formulaires de connexion / inscription / mot de passe oublié.
document.addEventListener('submit', async (e) => {
  const form = e.target.closest('[data-authform]');
  if (!form) return;
  e.preventDefault();
  if (gate.busy) return;
  const fd = new FormData(form);
  gate.email = String(fd.get('email') || '').trim();
  gate.pseudo = String(fd.get('pseudo') || '').trim();
  const password = String(fd.get('password') || '');
  gate.busy = true;
  gate.msg = '';
  gate.info = '';
  renderGate();
  try {
    if (gate.mode === 'login') await signIn(gate.email, password);
    else if (gate.mode === 'signup') await signUp(gate.pseudo || gate.email.split('@')[0], gate.email, password);
    else {
      await resetPassword(gate.email);
      gate.info = 'Si un compte existe avec cet e-mail, un lien vient d’être envoyé. Pense à regarder les spams.';
    }
  } catch (err) {
    gate.msg = authErrorMessage(err);
  }
  gate.busy = false;
  renderGate();
});

if (firebaseEnabled) {
  gate.view = 'loading';
  renderGate();
  watchAuth((user) => (user ? startSession(user) : endSession()));
}

// Si on passe minuit pendant que l'appli est ouverte, on repart sur un nouveau jour.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) render();
});
setInterval(() => {
  const d = derive(getState(), ranksData.ranks);
  if (d.today !== shownDay) render();
}, 60000);

if (!firebaseEnabled) actions.migrateNames();
render();
