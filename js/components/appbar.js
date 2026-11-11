import { icon } from './icons.js';
import { logo } from './logo.js';

/* Slim application bar for the standalone Login and Dashboard pages (they do not use the public site header/footer).
   Logo → Home 1. Theme and direction toggles use the same data attributes, so the shared modules drive them. */
export function renderAppBar(page = '') {
  const label = page === 'dashboard' ? '<span class="app-bar-label">Racer dashboard</span>' : '';
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="app-bar">
  <div class="container-wide app-bar-inner">
    ${logo()}
    <div class="app-bar-actions">
      ${label}
      <button type="button" class="icon-btn" data-theme-toggle aria-pressed="false" aria-label="Switch theme"><span class="icon-sun">${icon('sun')}</span><span class="icon-moon">${icon('moon')}</span></button>
      <button type="button" class="icon-btn text-[0.6875rem] font-extrabold tracking-wider" data-dir-toggle aria-pressed="false" aria-label="Switch text direction"><span data-dir-label>RTL</span></button>
    </div>
  </div>
</header>`;
}
