// Synchronisation avec Firestore. Rangement des données :
//   users/{uid}                  → profil, règles, réglages (couleur, cadrage du fond)
//   users/{uid}/days/{AAAA-MM-JJ} → un document par jour (règles cochées, % du jour)
//   users/{uid}/media/homeBg      → la photo du fond d'accueil (lourde, donc à part)
// `fs` = les fonctions Firestore, passées en paramètre pour pouvoir tester sans réseau.
import defaultRules from './data/default-rules.json';
import * as store from './store.js';

const IMPORTED_FLAG = 'vantanyx:legacy-imported';

export function createSync({ db, fs, storage = globalThis.localStorage, ask = (m) => globalThis.confirm(m) }) {
  const { doc, collection, onSnapshot, setDoc, deleteDoc, writeBatch } = fs;
  const warn = (e) => console.warn('Synchronisation impossible', e);

  const refs = (uid) => ({
    main: doc(db, 'users', uid),
    bg: doc(db, 'users', uid, 'media', 'homeBg'),
    days: collection(db, 'users', uid, 'days'),
    day: (key) => doc(db, 'users', uid, 'days', key),
  });

  // Envoi des changements. On n'attend pas la réponse du serveur : hors ligne, Firestore garde l'envoi en attente.
  function backend(uid) {
    const r = refs(uid);
    return {
      pushMain: (data) => setDoc(r.main, data, { merge: true }).catch(warn),
      pushDay: (key, day) => setDoc(r.day(key), day).catch(warn),
      pushBg: (src) => (src ? setDoc(r.bg, { src }).catch(warn) : deleteDoc(r.bg).catch(warn)),
    };
  }

  // Compte tout neuf : on crée son document, et on propose d'y importer les données déjà présentes sur l'appareil.
  function createAccount(uid, pseudo) {
    const r = refs(uid);
    const legacy = store.readLegacy();
    const dayCount = legacy ? Object.keys(legacy.days || {}).length : 0;
    let imported = null;
    if (legacy && (dayCount > 0 || (legacy.ui && legacy.ui.bg)) && !storage.getItem(IMPORTED_FLAG)) {
      const s = dayCount > 1 ? 's' : '';
      if (ask(`Cet appareil contient déjà des données (${dayCount} jour${s} enregistré${s}). Les importer dans ce compte ?`)) {
        imported = legacy;
      }
    }

    const main = {
      version: 1,
      profile: { pseudo },
      rules: imported && imported.rules ? imported.rules : JSON.parse(JSON.stringify(defaultRules)),
      ui: { bgFit: (imported && imported.ui && imported.ui.bgFit) || null, colorIndex: (imported && imported.ui && imported.ui.colorIndex) || 0 },
    };
    const days = imported ? Object.entries(imported.days || {}) : [];
    const bg = imported && imported.ui ? imported.ui.bg : null;

    // Écritures par paquets (limite de 500 par envoi).
    const queue = [(b) => b.set(r.main, main)];
    if (bg) queue.push((b) => b.set(r.bg, { src: bg }));
    days.forEach(([k, d]) => queue.push((b) => b.set(r.day(k), d)));
    for (let i = 0; i < queue.length; i += 400) {
      const batch = writeBatch(db);
      queue.slice(i, i + 400).forEach((op) => op(batch));
      batch.commit().catch(warn);
    }

    store.applyMain(main);
    if (days.length) store.applyDays(days.map(([id, data]) => ({ id, data })));
    if (bg) store.applyBg(bg);
    if (imported) storage.setItem(IMPORTED_FLAG, uid);
  }

  // Écoute en direct. onReady quand les trois sources ont répondu ; onError si Firestore refuse (règles, réseau…).
  // Renvoie la fonction qui arrête l'écoute.
  function listen(uid, { pseudo, onReady, onError }) {
    const r = refs(uid);
    const ready = { main: false, days: false, bg: false };
    let ended = false;
    let created = false;
    const check = () => {
      if (!ended && ready.main && ready.days && ready.bg) {
        ended = true;
        clearTimeout(timer);
        onReady();
      }
    };
    const fail = (e) => onError(e);
    // Les « metadata changes » permettent de savoir quand le serveur a confirmé ce que contenait le cache.
    const withMeta = { includeMetadataChanges: true };

    // Hors ligne ou réseau lent : si les jours et le fond n'ont pas répondu au bout de 3 s, on affiche l'appli quand même.
    const timer = setTimeout(() => {
      ready.days = true;
      ready.bg = true;
      check();
    }, 3000);

    const unsubs = [
      onSnapshot(
        r.main,
        withMeta,
        (snap) => {
          if (!snap.exists()) {
            // Rien trouvé dans le cache : on attend la réponse du serveur avant de croire que le compte est neuf
            // (sinon on pourrait écraser des données existantes après un démarrage hors ligne).
            if (snap.metadata.fromCache) return;
            if (!created) {
              created = true;
              createAccount(uid, pseudo());
              ready.main = true;
              check();
            }
            return;
          }
          if (!snap.metadata.hasPendingWrites) store.applyMain(snap.data());
          ready.main = true;
          check();
        },
        fail,
      ),
      onSnapshot(
        r.days,
        withMeta,
        (snap) => {
          const changes = [];
          snap.docChanges().forEach((ch) => {
            if (ch.doc.metadata.hasPendingWrites) return; // c'est nous qui venons d'écrire : déjà à jour à l'écran
            changes.push({ id: ch.doc.id, data: ch.type === 'removed' ? null : ch.doc.data() });
          });
          if (changes.length) store.applyDays(changes);
          if (!snap.metadata.fromCache || snap.size > 0) ready.days = true;
          check();
        },
        fail,
      ),
      onSnapshot(
        r.bg,
        withMeta,
        (snap) => {
          if (!snap.metadata.hasPendingWrites) store.applyBg(snap.exists() ? snap.data().src : null);
          if (!snap.metadata.fromCache || snap.exists()) ready.bg = true;
          check();
        },
        fail,
      ),
    ];
    return () => {
      clearTimeout(timer);
      ended = true;
      unsubs.forEach((u) => u());
    };
  }

  return { backend, listen, createAccount };
}
