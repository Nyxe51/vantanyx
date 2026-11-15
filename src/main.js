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
import { fileToDataUrl } from './logic/images.js';
import { watchViewport } from './logic/viewport.js';
import { mountShell, renderNav, setDrawer, setSub } from './ui/shell.js';
import { renderHome } from './screens/home.js';
import { renderSoon, renderSubScreen } from './screens/soon.js';
import ranksData from './data/ranks.json';

watchViewport();

const app = document.getElementById('app');
mountShell(app);
const main = document.getElementById('m');

// État d'affichage (non sauvegardé).
const view = { quoteOffset: 0, pop: '' };
let shownBg = null;
let shownDay = null;

function render() {
  const state = getState();
  const route = parse();
  const d = derive(state, ranksData.ranks);

  applyTheme(document.documentElement, d.pct, d.hue);

  // Fond d'accueil : une variable CSS, posée seulement quand l'image change.
  if (state.ui.bg !== shownBg) {
    shownBg = state.ui.bg;
    app.style.setProperty('--hero-bg', shownBg ? `url("${shownBg}")` : 'none');
  }

  view.pop = transient.pop;
  transient.pop = '';
  main.innerHTML = route.tab === 'accueil' ? renderHome(state, d, view) : renderSoon(route.tab);

  renderNav(route.tab);
  setSub(route.sub ? renderSubScreen(route.sub) : null);
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
  }
});

// Changer le fond d'accueil.
document.addEventListener('change', async (e) => {
  const input = e.target.closest('[data-bgfile]');
  if (!input || !input.files[0]) return;
  try {
    actions.setBackground(await fileToDataUrl(input.files[0], 1000));
  } catch (err) {
    console.warn(err);
  }
  input.value = '';
});

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
