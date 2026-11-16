import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase.js';

let pendingPseudo = '';

// Le pseudo choisi à l'inscription, lu une seule fois à la création du compte.
export function takePendingPseudo() {
  const p = pendingPseudo;
  pendingPseudo = '';
  return p;
}

export const watchAuth = (cb) => onAuthStateChanged(auth, cb);

export async function signUp(pseudo, email, password) {
  pendingPseudo = pseudo.trim();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await updateProfile(cred.user, { displayName: pendingPseudo || pseudo.trim() });
  } catch (e) {
    console.warn(e);
  }
  return cred.user;
}

export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
export const signOutUser = () => (auth ? signOut(auth) : Promise.resolve());

// Messages d'erreur en français.
export function authErrorMessage(err) {
  const code = (err && err.code) || '';
  const map = {
    'auth/invalid-email': 'Cette adresse e-mail n’est pas valide.',
    'auth/missing-email': 'Entre ton adresse e-mail.',
    'auth/missing-password': 'Entre ton mot de passe.',
    'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
    'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
    'auth/user-not-found': 'E-mail ou mot de passe incorrect.',
    'auth/email-already-in-use': 'Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.',
    'auth/weak-password': 'Mot de passe trop court : 6 caractères minimum.',
    'auth/too-many-requests': 'Trop d’essais. Attends quelques minutes avant de réessayer.',
    'auth/network-request-failed': 'Pas de connexion. Vérifie ton réseau et réessaie.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/operation-not-allowed': 'La connexion par e-mail n’est pas activée sur ce projet Firebase.',
    'auth/unauthorized-domain': 'Ce site n’est pas autorisé dans Firebase (Authentication → Paramètres → Domaines autorisés).',
  };
  return map[code] || `Erreur inattendue${code ? ` (${code})` : ''}.`;
}
