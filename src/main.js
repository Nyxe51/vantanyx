import './styles/base.css';
import './styles/glass.css';
import logoUrl from './assets/logo.webp';
import ranks from './data/ranks.json';
import quotes from './data/quotes.json';

// Page provisoire : sert uniquement à vérifier la chaîne de publication + l'installation PWA.
const app = document.getElementById('app');

const installee = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
const quote = quotes[new Date().getDate() % quotes.length];

app.innerHTML = `
  <main style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center">
    <img src="${logoUrl}" alt="" width="280" style="width:280px;max-width:80%;height:auto;filter:drop-shadow(0 0 28px rgba(190,215,255,.35))">
    <h1 class="chr" style="font-size:30px">Vantanyx</h1>
    <p class="mu" style="max-width:260px">${quote}</p>
    <div class="glass" style="padding:14px 18px;border-radius:18px;margin-top:8px">
      <div class="mu" id="etat-install"></div>
      <div class="mu" id="etat-reseau"></div>
      <div class="mu">${ranks.ranks.length} rangs chargés · v0.1 (squelette)</div>
    </div>
  </main>
`;

document.getElementById('etat-install').textContent = installee
  ? 'Mode : appli installée ✓'
  : 'Mode : navigateur (pas encore installée)';

function majReseau() {
  document.getElementById('etat-reseau').textContent = navigator.onLine ? 'Réseau : en ligne' : 'Réseau : hors ligne';
}
addEventListener('online', majReseau);
addEventListener('offline', majReseau);
majReseau();
