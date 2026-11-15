import './styles/base.css';
import './styles/glass.css';
import './styles/components.css';
import './styles/shell.css';
import './styles/home.css';

import { getState, subscribe, actions, transient } from './store.js';
import { parse, onChange, goTab, openSub, closeSub } from './router.js';
import { derive } from './logic/derive.js';
import { applyTheme } from './logic/theme.js';
import { initHold } from './logic/hold.js';
import { watchViewport } from './logic/viewport.js';
import { mountShell, renderNav, setDrawer, setSub } from './ui/shell.js';
import { renderHome } from './screens/home.js';
import { renderSoon, renderSubScreen } from './screens/soon.js';
import { renderSettings } from './screens/settings.js';
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

// Contenu du sous-écran ouvert (menu latéral, réglages…).
function subHtml(name, state) {
  if (name === 'reglages') return renderSettings(state);
  if (name === 'fond') return renderBackground();
  return renderSubScreen(name);
}

function render() {
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
  main.innerHTML = route.tab === 'accueil' ? renderHome(state, d, view) : renderSoon(route.tab);

  renderNav(route.tab);
  setSub(route.sub ? subHtml(route.sub, state) : null);
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

// Si on passe minuit pendant que l'appli est ouverte, on repart sur un nouveau jour.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) render();
});
setInterval(() => {
  const d = derive(getState(), ranksData.ranks);
  if (d.today !== shownDay) render();
}, 60000);

render();
