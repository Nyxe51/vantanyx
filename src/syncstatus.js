// État de la synchronisation, pour l'afficher : en ligne ou non, envois en attente, erreur éventuelle.
// Hors ligne seulement si le navigateur le dit explicitement (onLine === false).
const st = { online: typeof navigator === 'undefined' || navigator.onLine !== false, pending: 0, slow: false, error: null };
const subs = new Set();
let slowTimer = null;

export const getSyncStatus = () => ({ ...st });

export function subscribeSync(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

const emit = () => subs.forEach((fn) => fn(getSyncStatus()));

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    st.online = true;
    emit();
  });
  window.addEventListener('offline', () => {
    st.online = false;
    emit();
  });
}

function done() {
  st.pending = Math.max(0, st.pending - 1);
  if (st.pending === 0) {
    clearTimeout(slowTimer);
    st.slow = false;
  }
}

// Suit un envoi. La promesse renvoyée ne plante jamais : elle donne true (réussi) ou false (refusé).
export function track(promise) {
  st.pending++;
  if (st.pending === 1) {
    // « Envoi en cours » n'apparaît que si ça dure plus de 2 s (sinon l'affichage clignoterait à chaque coche).
    clearTimeout(slowTimer);
    slowTimer = setTimeout(() => {
      if (st.pending > 0) {
        st.slow = true;
        emit();
      }
    }, 2000);
  }
  emit();
  return Promise.resolve(promise).then(
    () => {
      done();
      emit();
      return true;
    },
    (e) => {
      done();
      st.error = { code: (e && e.code) || 'inconnue', message: (e && e.message) || '' };
      console.warn('Envoi refusé', e);
      emit();
      return false;
    },
  );
}

export function clearSyncError() {
  st.error = null;
  emit();
}

// Fin de session : on repart de zéro.
export function resetSyncStatus() {
  st.pending = 0;
  st.slow = false;
  st.error = null;
  clearTimeout(slowTimer);
  emit();
}

// Texte à afficher, ou null si tout va bien.
export function syncMessage(s) {
  if (s.error) return { level: 'error', text: `Erreur d’envoi (${s.error.code}). Tes dernières modifications ne sont peut-être pas enregistrées.` };
  if (!s.online) return { level: 'warn', text: s.pending ? `Hors ligne · ${s.pending} modification${s.pending > 1 ? 's' : ''} en attente d’envoi` : 'Hors ligne · tes coches seront envoyées au retour du réseau' };
  if (s.pending && s.slow) return { level: 'info', text: 'Envoi en cours…' };
  return null;
}
