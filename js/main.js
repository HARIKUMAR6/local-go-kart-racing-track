/* Application entry. Pages load this once: <script type="module" src="/js/main.js"> */
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { renderAppBar } from './components/appbar.js';
import { initTheme } from './modules/theme.js';
import { initDirection } from './modules/direction.js';
import { initNav } from './modules/nav.js';
import { initScrollTop, initReveal } from './modules/scroll.js';
import { initForms } from './modules/forms.js';
import { initTabs } from './modules/tabs.js';
import { initContactForm } from './modules/contact.js';

/* 1. Shared components: <div data-component="site-header"></div> / site-footer */
const page = document.body.dataset.page || '';
const slots = {
  'site-header': () => renderHeader(page),
  'site-footer': renderFooter,
  'app-bar': () => renderAppBar(page),
};
document.querySelectorAll('[data-component]').forEach((el) => {
  const render = slots[el.dataset.component];
  if (render) el.outerHTML = render();
});

/* 2. Behaviours (run after components exist) */
initTheme();
initDirection();
initNav();
initScrollTop();
initReveal();
initForms();
initTabs();
initContactForm();

/* 3. Page modules (only the page that needs them downloads them) */
if (page === 'login') import('./pages/login.js').then((m) => m.initLogin());
if (page === 'dashboard') import('./pages/dashboard.js').then((m) => m.initDashboard());
