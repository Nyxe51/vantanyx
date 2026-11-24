// Réglages → Règles : activer / désactiver, renommer, créer. Une règle n'est jamais supprimée.
import { esc } from '../ui/html.js';
import { isActive } from '../logic/rules.js';
import { categories, TYPE_LABELS, NAME_MAX, GROUP_MAX } from '../logic/ruleedit.js';

let editing = null; // id de la règle en cours de modification, ou null pour une nouvelle
export const setEditing = (id) => {
  editing = id;
};
export const getEditing = () => editing;

export function renderRulesEditor(state) {
  const active = state.rules.filter(isActive).length;
  const blocks = [];
  for (const r of state.rules) {
    const g = r.group || '';
    let b = blocks.find((x) => x.g === g);
    if (!b) blocks.push((b = { g, items: [] }));
    b.items.push(r);
  }
  const row = (r) => {
    const on = isActive(r);
    return `<div class="glass card rrow${on ? '' : ' rule-off'}">
      <div class="rr-main" data-act="rule-edit" data-rule="${esc(r.id)}"><b>${esc(r.name)}</b><div class="mu">${TYPE_LABELS[r.type] || ''}${on ? '' : ' · désactivée'}</div></div>
      <button class="tgl${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${on ? 'Désactiver' : 'Activer'} ${esc(r.name)}" data-act="rule-toggle" data-rule="${esc(r.id)}"></button>
    </div>`;
  };
  return `<div class="top"><button class="back" data-act="back">‹ Retour</button></div>
    <div class="pad">
      <h2 style="margin-bottom:6px">Règles</h2>
      <p class="mu" style="margin-bottom:14px">${active} active${active > 1 ? 's' : ''} sur ${state.rules.length}. Une règle désactivée disparaît de l’accueil et de ton % à partir d’aujourd’hui ; ton historique ne bouge pas. Touche une règle pour la renommer.</p>
      ${blocks.map((b) => `<h3>${esc(b.g || 'Sans catégorie')}</h3>${b.items.map(row).join('')}`).join('')}
      <button class="cta" style="margin-top:16px" data-act="rule-new">Nouvelle règle</button>
    </div>`;
}

export function renderRuleForm(state) {
  const rule = editing ? state.rules.find((r) => r.id === editing) : null;
  const cats = categories(state.rules);
  const cur = rule ? rule.group || '' : cats[0] || '';
  const chip = (value, label) => `<label class="cat"><input type="radio" name="rf-group" value="${esc(value)}"${value === cur ? ' checked' : ''}><span>${esc(label)}</span></label>`;
  const chips = [...cats.map((c) => chip(c, c)), chip('', 'Sans catégorie')].join('');
  return `<div class="top"><button class="back" data-act="back">‹ Retour</button></div>
    <div class="pad">
      <h2 style="margin-bottom:12px">${rule ? 'Modifier la règle' : 'Nouvelle règle'}</h2>
      <label class="lbl" for="rf-name">Nom</label>
      <input class="in" id="rf-name" maxlength="${NAME_MAX}" placeholder="Ex. 10 minutes de lecture" value="${rule ? esc(rule.name) : ''}" autocomplete="off">
      ${
        rule
          ? `<div class="mu" style="margin:-2px 4px 6px">Type : ${TYPE_LABELS[rule.type] || ''} (non modifiable)</div>`
          : `<span class="lbl">Type</span>
        <label class="opt"><input type="radio" name="rf-type" value="check" checked><span><b>Case à cocher</b><small>Faite ou pas faite (appui long de 2 s).</small></span></label>
        <label class="opt"><input type="radio" name="rf-type" value="pair"><span><b>Matin et soir</b><small>Deux passages, comptés 50 % chacun.</small></span></label>`
      }
      <span class="lbl">Catégorie</span>
      <div class="cats">${chips}</div>
      <input class="in" id="rf-newgroup" maxlength="${GROUP_MAX}" placeholder="Ou crée une nouvelle catégorie" autocomplete="off">
      <button class="cta" style="margin-top:8px" data-act="rule-save">Enregistrer</button>
      ${rule && rule.since ? '<button class="btn ghost danger" style="width:100%;padding:12px" data-act="rule-delete">Supprimer cette règle</button>' : ''}
    </div>`;
}
