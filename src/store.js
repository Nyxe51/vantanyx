// Seul fichier qui sait où sont rangées les données.
// Pour l'instant : stockage local de l'appareil. Plus tard : Firestore (même interface, seul load/save change).
import defaultRules from './data/default-rules.json';
import { dayPercent } from './logic/rules.js';
import { todayKey } from './logic/dates.js';

const KEY = 'vantanyx:state:v1';

const fresh = () => ({
  version: 1,
  profile: { pseudo: 'Nyxe' },
  rules: defaultRules,
  days: {}, // { 'AAAA-MM-JJ': { v: { <idRègle>: valeur }, pct: 0-100, ex: false } }
  ui: { bg: null, bgFit: null, colorIndex: 0 }, // bgFit : cadrage du fond { x, y, z } (voir logic/bgfit.js)
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === 1) return s;
    }
  } catch (e) {
    console.warn('Lecture locale impossible', e);
  }
  return fresh();
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Sauvegarde locale impossible', e);
  }
}

let state = load();
const listeners = new Set();

// État temporaire (jamais sauvegardé) : animation « pop » de la dernière règle validée.
export const transient = { pop: '' };

export const getState = () => state;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit() {
  save();
  listeners.forEach((fn) => fn(state));
}

function today() {
  const key = todayKey();
  if (!state.days[key]) state.days[key] = { v: {}, pct: 0, ex: false };
  return state.days[key];
}

// Le % du jour est enregistré à chaque changement : l'historique ne bouge plus si les règles changent plus tard.
function refreshPct(day) {
  day.pct = dayPercent(state.rules, day.v);
}

export const actions = {
  // Règle « à cocher » (j = null) ou case d'une paire (j = 0 matin, 1 soir).
  setCheck(id, j, value) {
    const day = today();
    if (j === null || j === undefined) {
      day.v[id] = value ? 1 : 0;
    } else {
      const pair = day.v[id] || [0, 0];
      pair[j] = value ? 1 : 0;
      day.v[id] = pair;
    }
    transient.pop = j === null || j === undefined ? id : `${id}.${j}`;
    refreshPct(day);
    commit();
  },

  // Jauge (eau) : ajoute ou retire des cl, entre 0 et 1,5 × l'objectif.
  adjustGauge(id, delta) {
    const rule = state.rules.find((r) => r.id === id);
    if (!rule) return;
    const day = today();
    day.v[id] = Math.max(0, Math.min((day.v[id] || 0) + delta, rule.goal * 1.5));
    refreshPct(day);
    commit();
  },

  setBackground(dataUrl, fit) {
    state.ui.bg = dataUrl;
    state.ui.bgFit = fit || null;
    commit();
  },

  // Couleur de l'appli : l'index d'un rang débloqué (voir derive : jamais au-delà du rang atteint).
  setColor(index) {
    state.ui.colorIndex = index;
    commit();
  },

  // Mode test (temporaire) : level = nombre, ou null pour revenir au vrai niveau.
  setDevLevel(level) {
    state.dev = { level: level || null };
    commit();
  },

  clearBackground() {
    state.ui.bg = null;
    state.ui.bgFit = null;
    commit();
  },
};
