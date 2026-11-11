import { brand } from '../data/site.js';

/* Apexline emblem: a chamfered shield (racing-badge silhouette) carrying an "A"
   whose crossbar is a chequered flag band – the apex of a corner and a finish line in one mark.
   The same artwork lives at /assets/icons/logo-emblem.svg. */
export const EMBLEM_SVG = `<svg viewBox="0 0 48 52" aria-hidden="true" focusable="false">
  <path d="M24 1.5 45 9.5v20.2c0 10.2-8.6 17.2-21 21.8C11.600 46.900 3 39.900 3 29.700V9.500z" fill="#ff4b1f"/>
  <path d="M24 1.5 45 9.5v20.2c0 10.2-8.6 17.2-21 21.8C11.600 46.900 3 39.900 3 29.700V9.500z" fill="none" stroke="#0b0e13" stroke-width="1.5"/>
  <path d="M13 40 24 11l11 29" fill="none" stroke="#0b0e13" stroke-width="5" stroke-linejoin="miter" stroke-linecap="butt"/>
  <path d="M17.600 31h12.800v8H17.600z" fill="#ff4b1f"/>
  <g fill="#0b0e13"><rect x="18" y="29" width="4" height="4"/><rect x="26" y="29" width="4" height="4"/><rect x="22" y="33" width="4" height="4"/></g>
  <g fill="#c8f031"><rect x="22" y="29" width="4" height="4"/><rect x="18" y="33" width="4" height="4"/><rect x="26" y="33" width="4" height="4"/></g>
</svg>`;

export function logo({ wordmark = true, href = '/', label = `${brand.name} ${brand.descriptor} – home` } = {}) {
  return `<a href="${href}" class="inline-flex items-center gap-3" aria-label="${label}">
    <span class="block h-11 w-10 shrink-0 [&>svg]:h-full [&>svg]:w-full">${EMBLEM_SVG}</span>
    ${wordmark ? `<span class="grid leading-none">
      <span class="logo-main font-display text-[1.65rem] font-black uppercase tracking-wide">${brand.name}</span>
      <span class="logo-sub text-[0.625rem] font-extrabold uppercase tracking-[0.32em]">${brand.descriptor}</span>
    </span>` : ''}
  </a>`;
}
