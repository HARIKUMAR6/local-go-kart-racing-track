import { nav } from '../data/site.js';
import { icon } from './icons.js';
import { logo } from './logo.js';

const current = (key, page) => (key === page ? ' aria-current="page"' : '');

/* Sun/moon pair: CSS shows the one matching the active theme. */
const themeIcon = () => `<span class="icon-sun">${icon('sun')}</span><span class="icon-moon">${icon('moon')}</span>`;

export function renderHeader(page = '') {
  const homeActive = nav.home.children.some((c) => c.key === page);
  /* Pages that open on a full-bleed photo hero set <body data-header="overlay">: the header starts transparent
     (light-on-photo) and becomes the themed solid bar after scrolling. All other pages use the solid bar. */
  const overlay = document.body.dataset.header === 'overlay';

  const desktopLinks = nav.links
    .map((l) => `<li><a class="nav-link" href="${l.href}"${current(l.key, page)}>${l.label}</a></li>`).join('');
  const homeItems = nav.home.children
    .map((c) => `<a class="dropdown-item" href="${c.href}"${current(c.key, page)}>${c.label}</a>`).join('');

  const menuLink = (l) => `<a class="menu-link" href="${l.href}"${current(l.key, page)}>${l.label}<span class="flip-rtl menu-chevron">${icon('chevron-right')}</span></a>`;
  const subLinks = nav.home.children
    .map((c) => `<li><a class="menu-sublink" href="${c.href}"${current(c.key, page)}>${c.label}</a></li>`).join('');

  /* Desktop (≥1280px): nav, login, theme + direction toggles, then the CTA at the far end.
     Tablet/mobile (<1280px, includes iPad Pro 13" portrait at 1032px): ONLY logo + menu button. Everything else lives in the full-screen menu. */
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header" data-solid="false" data-over="${overlay}">
  <div class="container-wide flex items-center justify-between gap-3">
    ${logo()}
    <nav class="hidden items-center min-[80rem]:flex" aria-label="Primary">
      <ul class="flex items-center gap-0 xl:gap-1">
        <li class="dropdown" data-dropdown>
          <button type="button" class="nav-link cursor-pointer" data-dropdown-trigger aria-expanded="false" aria-haspopup="true" aria-controls="home-menu"${homeActive ? ' aria-current="page"' : ''}>
            ${nav.home.label}<span class="dropdown-caret" aria-hidden="true">${icon('chevron-down', 'size-4')}</span>
          </button>
          <div id="home-menu" class="dropdown-panel" data-dropdown-panel hidden>${homeItems}</div>
        </li>
        ${desktopLinks}
      </ul>
    </nav>
    <div class="hidden items-center gap-2 min-[80rem]:flex">
      <a class="nav-link" href="${nav.login.href}"${current('login', page)}>${icon('user', 'size-4')}${nav.login.label}</a>
      <button type="button" class="icon-btn" data-theme-toggle aria-pressed="false" aria-label="Switch theme">${themeIcon()}</button>
      <button type="button" class="icon-btn text-[0.6875rem] font-extrabold tracking-wider" data-dir-toggle aria-pressed="false" aria-label="Switch text direction"><span data-dir-label>RTL</span></button>
      <a class="btn btn-primary btn-sm header-cta" href="${nav.cta.href}">${nav.cta.label}</a>
    </div>
    <button type="button" class="icon-btn min-[80rem]:hidden" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
      <span data-icon-open>${icon('menu')}</span><span data-icon-close hidden>${icon('close')}</span>
    </button>
  </div>
  <span class="header-progress" aria-hidden="true"></span>
</header>

<div id="mobile-menu" class="mobile-menu min-[80rem]:hidden" data-mobile-menu role="dialog" aria-modal="true" aria-label="Site menu" hidden>
  <div class="mobile-menu-inner">
    <nav aria-label="Mobile">
      <ul class="menu-list">
        <li>
          <button type="button" class="menu-link w-full cursor-pointer text-start" data-accordion-trigger aria-expanded="false" aria-controls="menu-home"${homeActive ? ' aria-current="page"' : ''}>
            ${nav.home.label}<span class="accordion-caret menu-chevron" aria-hidden="true">${icon('chevron-down')}</span>
          </button>
          <ul id="menu-home" class="menu-sublist" hidden>${subLinks}</ul>
        </li>
        ${nav.links.map((l) => `<li>${menuLink(l)}</li>`).join('')}
        <li>${menuLink({ ...nav.login, key: 'login' })}</li>
      </ul>
    </nav>
    <div class="menu-actions">
      <a class="btn btn-primary btn-lg" href="${nav.cta.href}">${nav.cta.label}</a>
      <div class="menu-toggles">
        <button type="button" class="menu-toggle" data-theme-toggle aria-pressed="false" aria-label="Switch theme">
          ${themeIcon()}<span class="icon-sun">Light mode</span><span class="icon-moon">Dark mode</span>
        </button>
        <button type="button" class="menu-toggle" data-dir-toggle aria-pressed="false" aria-label="Switch text direction">
          ${icon('arrow-right', 'size-5 flip-rtl')}<span data-dir-label>RTL</span>
        </button>
      </div>
    </div>
  </div>
</div>
<button type="button" class="scroll-top" data-scroll-top data-visible="false" aria-label="Scroll to top">${icon('arrow-up')}</button>`;
}
