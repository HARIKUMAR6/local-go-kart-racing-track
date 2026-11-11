import { store } from './storage.js';

/* Theme architecture (single system):
   1. js/theme-init.js (blocking, in <head>) sets <html data-theme> before first paint:
      saved choice → otherwise OS preference → otherwise light.
   2. This module toggles it, persists an explicit choice, and keeps everything else in sync.
   3. ALL visual differences come from CSS tokens in src/css/tokens.css – nothing here touches colours. */
const KEY = 'apex:theme';
const THEME_COLOR = { light: '#f6f3ec', dark: '#0b0e13' };
const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');

export const getTheme = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
const savedTheme = () => { const v = store.get(KEY); return v === 'light' || v === 'dark' ? v : null; };

function apply(theme) {
  root.setAttribute('data-theme', theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

/* An explicit user choice: applied now and persisted (it is never overridden by the OS afterwards). */
export function setTheme(theme) {
  store.set(KEY, theme);
  apply(theme);
}

/* Any [data-theme-toggle] button toggles theme and mirrors state for a11y. Icon swap is CSS-driven. */
export function initTheme() {
  const sync = () => {
    const dark = getTheme() === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-theme-toggle]')) setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });
  document.addEventListener('themechange', sync);

  // OS preference changes only apply while the user has NOT made an explicit choice.
  media.addEventListener?.('change', (e) => { if (!savedTheme()) apply(e.matches ? 'dark' : 'light'); });

  // Keep other open tabs / pages in step with an explicit choice.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && (e.newValue === 'light' || e.newValue === 'dark') && e.newValue !== getTheme()) apply(e.newValue);
  });

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[getTheme()]);
  sync();
}
