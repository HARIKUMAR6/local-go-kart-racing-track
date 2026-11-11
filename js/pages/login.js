/* Racer login portal (interface only: there is no account system behind it).
   Forms are validated by modules/forms.js; a valid submit continues to the racer dashboard. */
import { contact } from '../data/site.js';
import { store } from '../modules/storage.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const GO = '/dashboard';

export function initLogin() {
  /* show / hide password */
  $$('[data-pass-toggle]').forEach((btn) => btn.addEventListener('click', () => {
    const input = document.getElementById(btn.getAttribute('aria-controls'));
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(show));
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    $('[data-eye]', btn).hidden = show;
    $('[data-eye-off]', btn).hidden = !show;
  }));

  /* remember me: keeps the email address on this device only */
  const signin = $('[data-login-form="signin"]');
  const saved = store.get('apex:remember-email');
  if (saved) { signin.email.value = saved; signin.remember.checked = true; }

  $$('[data-login-form]').forEach((form) => form.addEventListener('form:valid', (e) => {
    const kind = form.dataset.loginForm;
    if (kind === 'signin') {
      store.set('apex:remember-email', form.remember.checked ? String(e.detail.get('email')).trim() : '');
      location.href = GO;
    } else if (kind === 'create') {
      location.href = GO;
    } else {
      const subject = encodeURIComponent('Password reset request');
      const body = encodeURIComponent(`Please help me reset the password for the racer account with this email: ${String(e.detail.get('email')).trim()}`);
      location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    }
  }));

  $$('[data-social]').forEach((b) => b.addEventListener('click', () => { location.href = GO; }));

  /* forgot password panel */
  const reset = $('[data-reset-panel]');
  const tabs = $('[data-login-tabs]');
  const open = (on) => {
    reset.hidden = !on; tabs.hidden = on;
    $('.login-divider').hidden = on; $('.social-row').hidden = on;
    (on ? $('#rs-email') : $('#si-email')).focus();
  };
  $('[data-show-reset]').addEventListener('click', () => open(true));
  $('[data-hide-reset]').addEventListener('click', () => open(false));
}
