// Sauvegarde : fabrique le fichier d'export et vérifie un fichier avant de l'importer.
// Rien n'est importé sans passer par parseExport : on ne fait jamais confiance à un fichier.
import { SCHEMA_VERSION, migrateData } from '../schema.js';

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const RULE_TYPES = ['check', 'gauge', 'pair'];
const MAX_BG = 800000; // caractères (≈ 600 Ko d'image)

export function buildExport(state, now = new Date()) {
  return {
    app: 'vantanyx',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data: {
      profile: { pseudo: state.profile.pseudo },
      rules: state.rules,
      ui: { bgFit: state.ui.bgFit ?? null, colorIndex: state.ui.colorIndex || 0 },
      days: state.days,
      bg: state.ui.bg || null,
    },
  };
}

export const exportFileName = (now = new Date()) => `vantanyx-sauvegarde-${now.toISOString().slice(0, 10)}.json`;

const isNum = (x) => typeof x === 'number' && Number.isFinite(x);

function cleanRule(r) {
  if (!r || typeof r !== 'object') return null;
  if (typeof r.id !== 'string' || !r.id || r.id.length > 40) return null;
  if (typeof r.name !== 'string' || !r.name.trim() || r.name.length > 60) return null;
  if (!RULE_TYPES.includes(r.type)) return null;
  const out = { id: r.id, name: r.name.trim(), type: r.type };
  if (typeof r.sub === 'string') out.sub = r.sub.slice(0, 80);
  if (typeof r.group === 'string') out.group = r.group.slice(0, 40);
  if (typeof r.active === 'boolean') out.active = r.active;
  if (typeof r.since === 'string' && DAY_KEY.test(r.since)) out.since = r.since;
  if (r.type === 'gauge') {
    if (!isNum(r.goal) || r.goal <= 0 || r.goal > 100000) return null;
    out.goal = r.goal;
  }
  if (r.type === 'pair') {
    if (!Array.isArray(r.labels) || r.labels.length !== 2 || !r.labels.every((l) => typeof l === 'string')) return null;
    out.labels = r.labels.map((l) => l.slice(0, 20));
  }
  return out;
}

function cleanDay(d) {
  if (!d || typeof d !== 'object' || !d.v || typeof d.v !== 'object') return null;
  if (!isNum(d.pct) || d.pct < 0 || d.pct > 100) return null;
  const v = {};
  for (const [k, val] of Object.entries(d.v)) {
    if (isNum(val)) v[k] = val;
    else if (Array.isArray(val) && val.length === 2 && val.every(isNum)) v[k] = val;
  }
  const out = { v, pct: Math.round(d.pct), ex: d.ex === true };
  // act : règles actives ce jour-là (sert aux stats par règle).
  if (Array.isArray(d.act)) out.act = d.act.filter((x) => typeof x === 'string' && x.length <= 40).slice(0, 100);
  return out;
}

// Renvoie { ok: true, data, dayCount, ruleCount } ou { ok: false, error: 'message en français' }.
export function parseExport(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: 'Ce fichier n’est pas un fichier de sauvegarde valide.' };
  }
  if (!obj || typeof obj !== 'object' || obj.app !== 'vantanyx' || !obj.data) {
    return { ok: false, error: 'Ce fichier ne vient pas de Vantanyx.' };
  }
  if (!Number.isInteger(obj.schemaVersion) || obj.schemaVersion < 1) {
    return { ok: false, error: 'Fichier de sauvegarde illisible (version manquante).' };
  }
  if (obj.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, error: 'Ce fichier vient d’une version plus récente de l’appli. Mets l’appli à jour, puis réessaie.' };
  }

  let d = obj.data;
  try {
    d = migrateData(d, obj.schemaVersion);
  } catch (e) {
    return { ok: false, error: 'Impossible de convertir ce fichier : ' + e.message };
  }

  if (!Array.isArray(d.rules) || d.rules.length < 1 || d.rules.length > 100) {
    return { ok: false, error: 'La liste de règles du fichier est vide ou invalide.' };
  }
  const rules = d.rules.map(cleanRule);
  if (rules.some((r) => r === null)) return { ok: false, error: 'Une des règles du fichier est invalide.' };
  if (new Set(rules.map((r) => r.id)).size !== rules.length) return { ok: false, error: 'Le fichier contient deux règles avec le même identifiant.' };

  if (!d.days || typeof d.days !== 'object' || Array.isArray(d.days)) return { ok: false, error: 'Les jours du fichier sont invalides.' };
  const entries = Object.entries(d.days);
  if (entries.length > 4000) return { ok: false, error: 'Le fichier contient trop de jours.' };
  const days = {};
  for (const [key, day] of entries) {
    if (!DAY_KEY.test(key)) return { ok: false, error: `Date invalide dans le fichier : ${String(key).slice(0, 20)}` };
    const c = cleanDay(day);
    if (!c) return { ok: false, error: `Le jour ${key} est invalide.` };
    days[key] = c;
  }

  const ui = d.ui && typeof d.ui === 'object' ? d.ui : {};
  const colorIndex = Number.isInteger(ui.colorIndex) && ui.colorIndex >= 0 && ui.colorIndex <= 6 ? ui.colorIndex : 0;
  let bgFit = null;
  if (ui.bgFit && isNum(ui.bgFit.x) && isNum(ui.bgFit.y) && isNum(ui.bgFit.z)) {
    bgFit = {
      x: Math.min(1, Math.max(0, ui.bgFit.x)),
      y: Math.min(1, Math.max(0, ui.bgFit.y)),
      z: Math.min(4, Math.max(1, ui.bgFit.z)),
    };
  }
  let bg = null;
  if (d.bg != null) {
    if (typeof d.bg !== 'string' || !d.bg.startsWith('data:image/') || d.bg.length > MAX_BG) {
      return { ok: false, error: 'L’image de fond du fichier est invalide ou trop lourde.' };
    }
    bg = d.bg;
  }

  return { ok: true, data: { rules, days, ui: { colorIndex, bgFit }, bg }, dayCount: entries.length, ruleCount: rules.length };
}
