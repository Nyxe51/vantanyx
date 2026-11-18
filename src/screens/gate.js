// Écran d'accueil de l'appli avant d'être connecté : chargement, connexion / inscription / mot de passe oublié, erreur.
import { esc } from '../ui/html.js';
import logoUrl from '../assets/logo.webp';
import { isTest } from '../env.js';

export const gate = { view: null, mode: 'login', msg: '', info: '', busy: false, email: '', pseudo: '' };

const TITLES = { login: 'Se connecter', signup: 'Créer un compte', reset: 'Mot de passe oublié' };

export function renderGate() {
  const el = document.getElementById('gate');
  if (!el) return;
  el.classList.toggle('show', gate.view !== null);
  if (gate.view === null) {
    el.innerHTML = '';
    return;
  }
  const logo = `<img class="gate-logo" src="${logoUrl}" alt="" width="200">`;

  if (gate.view === 'loading') {
    el.innerHTML = `<div class="gate-in">${logo}<p class="mu gate-pulse">Chargement…</p></div>`;
    return;
  }

  if (gate.view === 'error') {
    el.innerHTML = `<div class="gate-in">${logo}
      <h2>Oups</h2>
      <p class="mu" style="margin:8px 0 18px">${esc(gate.msg)}</p>
      <button class="cta" data-act="reload">Réessayer</button>
      <button class="btn ghost" style="width:100%;padding:12px" data-act="logout">Se déconnecter</button></div>`;
    return;
  }

  // Environnement de test : un seul compte, donc pas d'inscription.
  const m = isTest && gate.mode === 'signup' ? 'login' : gate.mode;
  const tab = (k, label) => `<button type="button" class="${m === k ? 'on' : ''}" data-act="auth-mode" data-arg="${k}">${label}</button>`;
  el.innerHTML = `<div class="gate-in">${logo}
    <h1 class="chr" style="font-size:26px">Vantanyx</h1>
    ${isTest ? '<p class="envtag static">ENVIRONNEMENT DE TEST</p>' : ''}
    <p class="mu" style="margin:4px 0 16px">${m === 'reset' ? 'On t’envoie un lien pour choisir un nouveau mot de passe.' : 'Reste focus, chaque jour.'}</p>
    ${m === 'reset' || isTest ? '' : `<div class="seg">${tab('login', 'Connexion')}${tab('signup', 'Inscription')}</div>`}
    <form data-authform autocomplete="on">
      ${m === 'signup' ? `<input class="in" name="pseudo" placeholder="Pseudo" autocomplete="nickname" maxlength="24" required value="${esc(gate.pseudo)}">` : ''}
      <input class="in" type="email" name="email" placeholder="E-mail" autocomplete="email" inputmode="email" autocapitalize="none" required value="${esc(gate.email)}">
      ${
        m === 'reset'
          ? ''
          : `<input class="in" type="password" name="password" placeholder="Mot de passe" autocomplete="${m === 'signup' ? 'new-password' : 'current-password'}" minlength="6" required>`
      }
      ${gate.msg ? `<p class="gate-err" role="alert">${esc(gate.msg)}</p>` : ''}
      ${gate.info ? `<p class="gate-info">${esc(gate.info)}</p>` : ''}
      <button class="cta" type="submit"${gate.busy ? ' disabled' : ''}>${gate.busy ? 'Patiente…' : TITLES[m]}</button>
    </form>
    ${
      m === 'login'
        ? '<button class="gate-link" data-act="auth-mode" data-arg="reset">Mot de passe oublié ?</button>'
        : m === 'reset'
          ? '<button class="gate-link" data-act="auth-mode" data-arg="login">‹ Retour à la connexion</button>'
          : ''
    }</div>`;
}
