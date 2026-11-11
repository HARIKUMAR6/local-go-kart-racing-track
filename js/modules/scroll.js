/* Scroll-to-top button + scroll-reveal. */
export function initScrollTop() {
  const btn = document.querySelector('[data-scroll-top]');
  if (!btn) return;
  const update = () => btn.setAttribute('data-visible', String(window.scrollY > 600));
  btn.addEventListener('click', () => window.scrollTo({ top: 0 }));
  window.addEventListener('scroll', update, { passive: true });
  update();
}

export function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) { items.forEach((i) => i.classList.add('is-visible')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach((i) => io.observe(i));
}
