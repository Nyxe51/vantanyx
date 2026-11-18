// Seul fichier qui détient les données de l'appli.
//  - Mode local (sans compte) : tout est rangé dans le navigateur de l'appareil.
//  - Mode compte (Firebase)   : les données viennent de Firestore ; chaque changement y est renvoyé (voir sync.js).
import defaultRules from './data/default-rules.json';
import { dayPercent } from './logic/rules.js';
import { todayKey } from './logic/dates.js';
import { isTest } from './env.js';

const LOCAL_KEY = 'vantanyx:state:v1';

export const fresh = () => ({
  version: 1,
  profile: { pseudo: 'Nyxe' },
  rules: JSON.parse(JSON.stringify(defaultRules)),
  days: {}, // { 'AAAA-MM-JJ': { v: { <idRègle>: valeur }, pct: 0-100, ex: false } }
  ui: { bg: null, bgFit: null, colorIndex: 0 }, // bgFit : cadrage du fond { x, y, z } (voir logic/bgfit.js)
});

// Données enregistrées avant l'arrivée des comptes (sert aussi à les importer dans un compte).
export function readLegacy() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === 1) return s;
    }
  } catch (e) {
    console.warn('Lecture locale impossible', e);
  }
  return null;
}

let state = readLegacy() || fresh();
let backend = null; // null = mode local ; sinon { pushMain, pushDay, pushBg }
const listeners = new Set();

// État temporaire (jamais sauvegardé) : animation « pop » de la dernière règle validée.
export const transient = { pop: '' };

export const getState = () => state;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const notify = () => listeners.forEach((fn) => fn(state));

function saveLocal() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Sauvegarde locale impossible', e);
  }
}

// `what` dit ce qui a changé : { main: true } | { day: 'AAAA-MM-JJ' } | { bg: true }
function commit(what = {}) {
  if (!backend) {
    saveLocal();
  } else {
    if (what.main) backend.pushMain(mainPayload());
    if (what.day) backend.pushDay(what.day, state.days[what.day]);
    if (what.bg) backend.pushBg(state.ui.bg);
  }
  notify();
}

// Ce qui est rangé dans le document principal de l'utilisateur (le fond, lourd, est à part).
function mainPayload() {
  return {
    version: 1,
    profile: state.profile,
    rules: state.rules,
    ui: { bgFit: state.ui.bgFit ?? null, colorIndex: state.ui.colorIndex || 0 },
  };
}

// --- Passage mode local <-> mode compte ---
export function startRemote(be, account) {
  backend = be;
  state = { ...fresh(), account };
}

export function stopRemote() {
  backend = null;
  state = fresh();
  notify();
}

// --- Données reçues de Firestore (pas renvoyées : on ne les réécrit pas) ---
export function applyMain(data) {
  if (data.profile) state.profile = data.profile;
  if (Array.isArray(data.rules) && data.rules.length) state.rules = data.rules;
  state.ui = { ...state.ui, bgFit: (data.ui && data.ui.bgFit) || null, colorIndex: (data.ui && data.ui.colorIndex) || 0 };
  notify();
}

// changes : [{ id: 'AAAA-MM-JJ', data: {...} | null }]
export function applyDays(changes) {
  for (const { id, data } of changes) {
    if (data) state.days[id] = data;
    else delete state.days[id];
  }
  notify();
}

export function applyBg(src) {
  state.ui = { ...state.ui, bg: src || null };
  notify();
}

// --- Actions de l'utilisateur ---
function todayDay() {
  const key = todayKey();
  if (!state.days[key]) state.days[key] = { v: {}, pct: 0, ex: false };
  return [key, state.days[key]];
}

// Le % du jour est enregistré à chaque changement : l'historique ne bouge plus si les règles changent plus tard.
const refreshPct = (day) => {
  day.pct = dayPercent(state.rules, day.v);
};

export const actions = {
  // Règle « à cocher » (j = null) ou case d'une paire (j = 0 matin, 1 soir).
  setCheck(id, j, value) {
    const [key, day] = todayDay();
    if (j === null || j === undefined) {
      day.v[id] = value ? 1 : 0;
    } else {
      const pair = day.v[id] || [0, 0];
      pair[j] = value ? 1 : 0;
      day.v[id] = pair;
    }
    transient.pop = j === null || j === undefined ? id : `${id}.${j}`;
    refreshPct(day);
    commit({ day: key });
  },

  // Jauge (eau) : ajoute ou retire des cl, entre 0 et 1,5 × l'objectif.
  adjustGauge(id, delta) {
    const rule = state.rules.find((r) => r.id === id);
    if (!rule) return;
    const [key, day] = todayDay();
    day.v[id] = Math.max(0, Math.min((day.v[id] || 0) + delta, rule.goal * 1.5));
    refreshPct(day);
    commit({ day: key });
  },

  setBackground(dataUrl, fit) {
    state.ui.bg = dataUrl;
    state.ui.bgFit = fit || null;
    commit({ main: true, bg: true });
  },

  // Couleur de l'appli : l'index d'un rang débloqué (voir derive : jamais au-delà du rang atteint).
  setColor(index) {
    state.ui.colorIndex = index;
    commit({ main: true });
  },

  // Mode test (temporaire) : level = nombre, ou null pour revenir au vrai niveau. Reste sur l'appareil.
  setDevLevel(level) {
    if (!isTest) return; // jamais dans la vraie appli
    state.dev = { level: level || null };
    if (!backend) saveLocal();
    notify();
  },

  clearBackground() {
    state.ui.bg = null;
    state.ui.bgFit = null;
    commit({ main: true, bg: true });
  },
};
