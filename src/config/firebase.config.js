// Configuration Firebase. Ces codes ne sont pas secrets : la sécurité vient des règles Firestore (firestore.rules).

// Projet de TEST : utilisé par `npm run dev` (ton PC).
export const DEV = {
  apiKey: 'AIzaSyDN8A7UNDxgjF24hxYESiI-5el5jiz7JRk',
  authDomain: 'vantanyx-dev.firebaseapp.com',
  projectId: 'vantanyx-dev',
  storageBucket: 'vantanyx-dev.firebasestorage.app',
  messagingSenderId: '1001875223513',
  appId: '1:1001875223513:web:d4146376cf02245632dfc8',
};

// Projet de PRODUCTION (la vraie appli) : à remplir quand il sera créé. Laisser null d'ici là.
export const PROD = null;

// Tant que PROD est vide, le site publié utilise le projet de TEST (pratique pour essayer sur iPhone).
// Quand PROD est rempli, mettre false : le site publié utilisera uniquement le projet de production.
export const USE_DEV_IN_PRODUCTION = true;
