/* Header interactions.
   - Desktop: click-to-open Home dropdown (aria-expanded), outside click / Escape / focus-out close it.
   - Tablet + mobile: full-screen dialog menu with scroll lock, focus trap, inert page, Escape to close,
     focus returned to the trigger, and a Home accordion that is closed by default and click-only. */
const LG = window.matchMedia('(min-width: 80rem)'); // desktop nav from 1280px; below it the full-screen menu
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ---------- Desktop dropdown ---------- */
function closeDropdowns(except) {
  document.querySelectorAll('[data-dropdown]').forEach((dd) => {
    if (dd === except) return;
    dd.querySelector('[data-dropdown-trigger]')?.setAttribute('aria-expanded', 'false');
    const panel = dd.querySelector('[data-dropdown-panel]');
    if (panel) panel.hidden = true;
  });
}

function toggleDropdown(dd) {
  const trigger = dd.querySelector('[data-dropdown-trigger]');
  const open = trigger.getAttribute('aria-expanded') !== 'true';
  closeDropdowns(open ? dd : null);
  trigger.setAttribute('aria-expanded', String(open));
  dd.querySelector('[data-dropdown-panel]').hidden = !open;
}

/* ---------- Mobile accordion ---------- */
function setAccordion(trigger, open) {
  trigger.setAttribute('aria-expanded', String(open));
  document.getElementById(trigger.getAttribute('aria-controls')).hidden = !open;
}

/* ---------- Header state ---------- */
let ticking = false;
function updateHeaderState() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const solid = y > 24 || header.getAttribute('data-menu-open') === 'true';
  header.setAttribute('data-solid', String(solid));
  // Overlay (transparent, light-on-photo) only at the top of pages that open on a photo hero
  header.setAttribute('data-over', String(document.body.dataset.header === 'overlay' && !solid));
  header.style.setProperty('--progress', max > 0 ? Math.min(y / max, 1).toFixed(4) : '0');
  ticking = false;
}

/* ---------- Mobile menu ---------- */
const menuEls = () => ({
  btn: document.querySelector('[data-menu-toggle]'),
  menu: document.querySelector('[data-mobile-menu]'),
});
const isMenuOpen = () => menuEls().btn?.getAttribute('aria-expanded') === 'true';

function setMobileMenu(open, { restoreFocus = true } = {}) {
  const { btn, menu } = menuEls();
  if (!btn || !menu) return;
  btn.setAttribute('aria-expanded', String(open));
  btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  btn.querySelector('[data-icon-open]')?.toggleAttribute('hidden', open);
  btn.querySelector('[data-icon-close]')?.toggleAttribute('hidden', !open);
  menu.hidden = !open;

  document.documentElement.classList.toggle('menu-locked', open);          // body scroll lock
  document.querySelectorAll('main, .site-footer, .scroll-top, .skip-link, .site-header .container-wide > a').forEach((el) => { el.inert = open; });
  document.querySelector('.site-header')?.setAttribute('data-menu-open', String(open));

  if (!open) menu.querySelectorAll('[data-accordion-trigger]').forEach((t) => setAccordion(t, false)); // always reopen closed
  updateHeaderState();

  if (open) menu.querySelector(FOCUSABLE)?.focus();
  else if (restoreFocus) btn.focus();
}

function trapFocus(e) {
  const { btn, menu } = menuEls();
  const items = [btn, ...menu.querySelectorAll(FOCUSABLE)].filter((el) => !el.closest('[hidden]') && el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

export function initNav() {
  document.addEventListener('click', (e) => {
    const ddTrigger = e.target.closest('[data-dropdown-trigger]');
    if (ddTrigger) { toggleDropdown(ddTrigger.closest('[data-dropdown]')); return; }
    if (!e.target.closest('[data-dropdown]')) closeDropdowns();

    const acc = e.target.closest('[data-accordion-trigger]');
    if (acc) { setAccordion(acc, acc.getAttribute('aria-expanded') !== 'true'); return; }

    // Clicking outside the accordion (inside the menu) closes it
    document.querySelectorAll('[data-accordion-trigger][aria-expanded="true"]').forEach((t) => {
      if (!e.target.closest('[data-accordion-trigger], #menu-home')) setAccordion(t, false);
    });

    // Click on the dimmed area of the full-screen menu (outside its content column) closes it
    if (e.target.matches('[data-mobile-menu]') && isMenuOpen()) { setMobileMenu(false); return; }

    const menuBtn = e.target.closest('[data-menu-toggle]');
    if (menuBtn) setMobileMenu(!isMenuOpen());
    else if (e.target.closest('[data-mobile-menu] a')) setMobileMenu(false, { restoreFocus: false });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openTrigger = document.querySelector('[data-dropdown-trigger][aria-expanded="true"]');
      if (openTrigger) { closeDropdowns(); openTrigger.focus(); }
      if (isMenuOpen()) setMobileMenu(false);
    } else if (e.key === 'Tab' && isMenuOpen()) {
      trapFocus(e);
    }
  });

  document.addEventListener('focusin', (e) => { if (!e.target.closest('[data-dropdown]')) closeDropdowns(); });
  LG.addEventListener('change', () => { if (LG.matches && isMenuOpen()) setMobileMenu(false, { restoreFocus: false }); });
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateHeaderState); } }, { passive: true });
  window.addEventListener('resize', updateHeaderState, { passive: true });
  updateHeaderState();
}
