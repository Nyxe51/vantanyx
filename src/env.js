// Quel environnement tourne ? Décide quel projet Firebase est utilisé et si les outils de test sont visibles.
//   'prod'  : la vraie appli (celle de tous les jours) → aucun outil de test
//   'test'  : l'appli de test (un seul compte, admin) → outils de test visibles
//   'local' : pas de Firebase, données sur l'appareil
import { DEV, PROD, USE_DEV_IN_PRODUCTION } from './config/firebase.config.js';

// VITE_FORCE_LOCAL=1 : mode local forcé. VITE_APP_ENV : environnement forcé (tests automatiques).
const forceLocal = import.meta.env.VITE_FORCE_LOCAL === '1';

// `npm run dev` (ton PC) utilise toujours le projet de TEST. Le site publié utilise PROD (sinon, provisoirement, DEV).
export const firebaseConfig = forceLocal ? null : import.meta.env.DEV ? DEV : PROD || (USE_DEV_IN_PRODUCTION ? DEV : null);

const computed = !firebaseConfig ? 'local' : firebaseConfig === DEV ? 'test' : 'prod';
export const appEnv = import.meta.env.VITE_APP_ENV || computed;
export const isTest = appEnv === 'test';
