// Démarrage de Firebase. Si aucune configuration n'est disponible, l'appli reste en mode local (sans compte).
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig as config } from './env.js';

export const firebaseEnabled = !!(config && config.apiKey);
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
