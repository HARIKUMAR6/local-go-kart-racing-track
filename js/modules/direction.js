import { store } from './storage.js';

const root = document.documentElement;
export const getDir = () => (root.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr');

export function setDir(dir) {
  root.setAttribute('dir', dir);
  store.set('apex:dir', dir);
  document.dispatchEvent(new CustomEvent('dirchange', { detail: { dir } }));
}

export function initDirection() {
  const sync = () => {
    const rtl = getDir() === 'rtl';
    document.querySelectorAll('[data-dir-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(rtl));
      btn.setAttribute('aria-label', rtl ? 'Switch to left-to-right layout' : 'Switch to right-to-left layout');
      const label = btn.querySelector('[data-dir-label]');
      if (label) label.textContent = rtl ? 'LTR' : 'RTL';
    });
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-dir-toggle]')) setDir(getDir() === 'rtl' ? 'ltr' : 'rtl');
  });
  document.addEventListener('dirchange', sync);
  sync();
}
