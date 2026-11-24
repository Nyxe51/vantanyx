// Édition de la liste des règles : fonctions pures (sans écran), toutes testables seules.
// Une règle n'est jamais supprimée : on la désactive (active: false). Ses jours passés restent intacts,
// et son id ne change jamais (l'historique en dépend).
import { isActive } from './rules.js';

export const NAME_MAX = 60;
export const GROUP_MAX = 40;
export const TYPE_LABELS = { check: 'Case à cocher', pair: 'Matin et soir', gauge: 'Jauge' };
export const CREATABLE_TYPES = ['check', 'pair'];

// Catégories existantes, dans l'ordre d'apparition.
export function categories(rules) {
  const out = [];
  for (const r of rules) if (r.group && !out.includes(r.group)) out.push(r.group);
  return out;
}

export function newRuleId(rules, now = Date.now(), rnd = Math.random) {
  const base = 'r' + now.toString(36) + Math.floor(rnd() * 1296).toString(36).padStart(2, '0');
  let id = base;
  let k = 1;
  while (rules.some((r) => r.id === id)) id = base + k++;
  return id;
}

export function validateName(name, rules, exceptId = null) {
  const n = String(name || '').trim().replace(/\s+/g, ' ');
  if (!n) return { error: 'Donne un nom à la règle.' };
  if (n.length > NAME_MAX) return { error: `Nom trop long (${NAME_MAX} caractères maximum).` };
  if (rules.some((r) => r.id !== exceptId && r.name.trim().toLowerCase() === n.toLowerCase())) return { error: 'Une règle porte déjà ce nom.' };
  return { name: n };
}

const cleanGroup = (g) => String(g || '').trim().replace(/\s+/g, ' ').slice(0, GROUP_MAX);

// Place une règle à la fin de sa catégorie (les catégories restent d'un seul bloc), ou en fin de liste.
function insertInGroup(rules, rule) {
  let at = rules.length;
  if (rule.group) {
    const last = rules.map((r) => r.group).lastIndexOf(rule.group);
    if (last >= 0) at = last + 1;
  }
  return [...rules.slice(0, at), rule, ...rules.slice(at)];
}

// Ajoute une règle. Renvoie { rules, id } ou { error }.
export function addRule(rules, { name, type, group }, today, id = newRuleId(rules)) {
  const v = validateName(name, rules);
  if (v.error) return v;
  if (!CREATABLE_TYPES.includes(type)) return { error: 'Type de règle inconnu.' };
  const rule = { id, name: v.name, type };
  const g = cleanGroup(group);
  if (g) rule.group = g;
  if (type === 'pair') rule.labels = ['Matin', 'Soir'];
  rule.since = today; // les stats de cette règle ne comptent qu'à partir de cette date
  return { rules: insertInGroup(rules, rule), id };
}

// Renomme une règle et/ou change sa catégorie. Renvoie { rules } ou { error }.
export function updateRule(rules, id, { name, group }) {
  const old = rules.find((r) => r.id === id);
  if (!old) return { error: 'Règle introuvable.' };
  const v = validateName(name, rules, id);
  if (v.error) return v;
  const g = cleanGroup(group);
  const next = { ...old, name: v.name };
  if (g) next.group = g;
  else delete next.group;
  if ((old.group || '') === g) return { rules: rules.map((r) => (r.id === id ? next : r)) };
  return { rules: insertInGroup(rules.filter((r) => r.id !== id), next) };
}

// Supprime une règle CRÉÉE par l'utilisateur (celles de la base se désactivent seulement : elles n'ont pas de date de création).
export function removeRule(rules, id) {
  const old = rules.find((r) => r.id === id);
  if (!old) return { error: 'Règle introuvable.' };
  if (!old.since) return { error: 'Cette règle fait partie de la base : désactive-la plutôt.' };
  const left = rules.filter((r) => r.id !== id);
  if (!left.some(isActive)) return { error: 'Garde au moins une règle active.' };
  return { rules: left };
}

// Active ou désactive. On garde toujours au moins une règle active.
export function setActive(rules, id, active) {
  const old = rules.find((r) => r.id === id);
  if (!old) return { error: 'Règle introuvable.' };
  if (!active && isActive(old) && rules.filter(isActive).length <= 1) return { error: 'Garde au moins une règle active.' };
  const next = { ...old };
  if (active) delete next.active;
  else next.active = false;
  return { rules: rules.map((r) => (r.id === id ? next : r)) };
}
