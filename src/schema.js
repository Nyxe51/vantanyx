// Version de la structure des données (profil, règles, jours…).
// À augmenter UNIQUEMENT quand on change la forme des données d'une façon qui casserait les anciens comptes ;
// dans ce cas, on ajoute dans `migrations` la fonction qui transforme les données de la version n vers n+1.
export const SCHEMA_VERSION = 1;

// migrations[n] : { profile, rules, ui, days, bg } de la version n → version n + 1
export const migrations = {};

export function migrateData(data, from, to = SCHEMA_VERSION, table = migrations) {
  let d = data;
  for (let v = from; v < to; v++) {
    const fn = table[v];
    if (!fn) throw new Error(`Migration manquante : ${v} → ${v + 1}`);
    d = fn(d);
  }
  return d;
}
