// Démarrage de Firebase. Si aucune configuration n'est disponible, l'appli reste en mode local (sans compte).
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from 'firebase/firestore';
import { DEV, PROD, USE_DEV_IN_PRODUCTION } from './config/firebase.config.js';

// VITE_FORCE_LOCAL=1 force le mode local (utile pour les tests automatiques).
const forceLocal = import.meta.env.VITE_FORCE_LOCAL === '1';
const config = import.meta.env.DEV ? DEV : PROD || (USE_DEV_IN_PRODUCTION ? DEV : null);

export const firebaseEnabled = !forceLocal && !!(config && config.apiKey);
export const projectId = firebaseEnabled ? config.projectId : null;

export let auth = null;
export let db = null;

if (firebaseEnabled) {
  const app = initializeApp(config);
  auth = getAuth(app);
  try {
    // Cache sur l'appareil : l'appli marche hors ligne et se resynchronise au retour du réseau.
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch (e) {
    console.warn('Cache hors ligne indisponible', e);
    db = initializeFirestore(app, { localCache: memoryLocalCache() });
  }
}
