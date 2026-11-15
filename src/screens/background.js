// Réglage du fond d'accueil : choisir une photo, la placer (glisser) et zoomer (pincer ou curseur).
// Rien n'est enregistré avant « Enregistrer » : le brouillon (draft) vit seulement dans cet écran.
import quotes from '../data/quotes.json';
import { fileToDataUrl } from '../logic/images.js';
import { actions } from '../store.js';
import { DEFAULT_FIT, MIN_ZOOM, MAX_ZOOM, clamp, pan, withZoom } from '../logic/bgfit.js';

let draft = null; // { src, a (largeur/hauteur), x, y, z }

function readAspect(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function initDraft(state) {
  if (draft) return;
  const fit = state.ui.bgFit || DEFAULT_FIT;
  draft = { src: state.ui.bg || null, a: null, ...fit };
  if (draft.src) {
    const src = draft.src;
    readAspect(src).then((a) => {
      if (draft && draft.src === src) draft.a = a;
    });
  }
}

export const resetDraft = () => {
  draft = null;
};

// Une photo vient d'être choisie : on la réduit, puis on repart d'un cadrage centré.
export async function chooseFile(file) {
  const src = await fileToDataUrl(file, 1000);
  draft = { src, a: await readAspect(src), ...DEFAULT_FIT };
}

export function saveDraft() {
  if (!draft || !draft.src) return false;
  actions.setBackground(draft.src, { x: +draft.x.toFixed(4), y: +draft.y.toFixed(4), z: +draft.z.toFixed(3) });
  return true;
}

export function resetFit() {
  if (draft) Object.assign(draft, DEFAULT_FIT);
}

export function removeBackground() {
  actions.clearBackground();
  draft = null;
}

const varsStyle = (d) =>
  `--hero-bg:url('${d.src}');--bgx:${(d.x * 100).toFixed(2)}%;--bgy:${(d.y * 100).toFixed(2)}%;--bgz:${d.z}`;

export function renderBackground() {
  const has = !!(draft && draft.src);
  const sample = quotes[new Date().getDate() % quotes.length];
  return `<div class="top"><button class="back" data-act="back">‹ Retour</button></div>
    <div class="pad"><h2 style="margin-bottom:6px">Fond de l’accueil</h2>
      <p class="mu" style="margin-bottom:12px">${
        has ? 'Glisse l’image pour la placer. Pince, ou utilise le curseur, pour zoomer.' : 'Choisis une photo, puis place-la comme tu veux.'
      }</p></div>
    <div class="hero bgstage${has ? ' has-bg' : ''}" data-bgstage${has ? ` style="${varsStyle(draft)}"` : ''}>
      <p class="quote">${sample}</p>
    </div>
    <div class="pad" style="margin-top:14px">
      ${
        has
          ? `<div class="row" style="margin-bottom:6px"><span class="mu">Zoom</span><span class="mu num" data-bgzoomlabel>${Math.round(draft.z * 100)} %</span></div>
             <input class="range" type="range" min="${MIN_ZOOM}" max="${MAX_ZOOM}" step="0.01" value="${draft.z}" data-bgzoom aria-label="Zoom">`
          : ''
      }
      <div class="two">
        <label class="pill">${has ? 'Autre photo' : 'Choisir une photo'}<input type="file" accept="image/*" data-bgfile hidden></label>
        ${has ? '<button class="pill" data-act="bg-reset">Recentrer</button>' : ''}
      </div>
      ${has ? '<button class="cta" style="margin-top:14px" data-act="bg-save">Enregistrer</button>' : ''}
      ${has ? '<button class="btn ghost" style="width:100%;padding:12px" data-act="bg-remove">Retirer la photo</button>' : ''}
    </div>`;
}

// --- Gestes (glisser, pincer, molette, curseur) : on met à jour l'aperçu directement, sans tout réafficher ---
function refresh() {
  const stage = document.querySelector('[data-bgstage]');
  if (!stage || !draft) return;
  stage.style.setProperty('--bgx', `${(draft.x * 100).toFixed(2)}%`);
  stage.style.setProperty('--bgy', `${(draft.y * 100).toFixed(2)}%`);
  stage.style.setProperty('--bgz', String(draft.z));
  const slider = document.querySelector('[data-bgzoom]');
  if (slider && Number(slider.value) !== draft.z) slider.value = draft.z;
  const label = document.querySelector('[data-bgzoomlabel]');
  if (label) label.textContent = `${Math.round(draft.z * 100)} %`;
}

function setFit(fit) {
  Object.assign(draft, fit);
  refresh();
}

export function bindBackgroundEditor(root) {
  const pointers = new Map();
  const ready = () => draft && draft.src && draft.a;

  root.addEventListener('pointerdown', (e) => {
    const stage = e.target.closest('[data-bgstage]');
    if (!stage || !ready()) return;
    if (stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });

  root.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev || !ready()) return;
    const stage = document.querySelector('[data-bgstage]');
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const cur = { x: e.clientX, y: e.clientY };
    if (pointers.size >= 2) {
      // Deux doigts : zoom (écart entre les doigts) + déplacement.
      const other = [...pointers.entries()].find(([id]) => id !== e.pointerId)[1];
      const dOld = Math.hypot(prev.x - other.x, prev.y - other.y);
      const dNew = Math.hypot(cur.x - other.x, cur.y - other.y);
      let fit = { x: draft.x, y: draft.y, z: draft.z };
      if (dOld > 0) fit = withZoom(fit, fit.z * (dNew / dOld));
      fit = pan(fit, draft.a, W, H, (cur.x - prev.x) / 2, (cur.y - prev.y) / 2);
      setFit(fit);
    } else {
      setFit(pan({ x: draft.x, y: draft.y, z: draft.z }, draft.a, W, H, cur.x - prev.x, cur.y - prev.y));
    }
    pointers.set(e.pointerId, cur);
  });

  ['pointerup', 'pointercancel'].forEach((n) => root.addEventListener(n, (e) => pointers.delete(e.pointerId)));

  // Molette (ordinateur) : zoom.
  root.addEventListener(
    'wheel',
    (e) => {
      if (!e.target.closest('[data-bgstage]') || !ready()) return;
      e.preventDefault();
      setFit(withZoom({ x: draft.x, y: draft.y, z: draft.z }, draft.z * Math.exp(-e.deltaY * 0.0015)));
    },
    { passive: false },
  );

  // Curseur de zoom.
  root.addEventListener('input', (e) => {
    const slider = e.target.closest('[data-bgzoom]');
    if (slider && draft) setFit(withZoom({ x: draft.x, y: draft.y, z: draft.z }, clamp(Number(slider.value), MIN_ZOOM, MAX_ZOOM)));
  });
}
