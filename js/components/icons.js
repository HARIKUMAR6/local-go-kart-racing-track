/* Icon system: one consistent 24×24 grid, 2px round strokes (filled for brand glyphs).
   Usage: icon('phone', 'size-5') → SVG string. Decorative by default (aria-hidden). */
const stroke = (d) => ({ type: 'stroke', d });
const fill = (d) => ({ type: 'fill', d });

const ICONS = {
  sun: stroke('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: stroke('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  menu: stroke('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: stroke('<path d="M6 6l12 12M18 6L6 18"/>'),
  'chevron-down': stroke('<path d="m6 9 6 6 6-6"/>'),
  'chevron-right': stroke('<path d="m9 6 6 6-6 6"/>'),
  'arrow-right': stroke('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  'arrow-up': stroke('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  'map-pin': stroke('<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  phone: stroke('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  mail: stroke('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  clock: stroke('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  user: stroke('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  check: stroke('<path d="m5 12.5 4.5 4.5L19 7"/>'),
  shield: stroke('<path d="M12 3 5 6v5.5c0 4.4 2.9 8 7 9.5 4.1-1.5 7-5.1 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  grid: stroke('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  calendar: stroke('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  stopwatch: stroke('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>'),
  bars: stroke('<path d="M5 20V11M12 20V4M19 20v-6"/>'),
  trophy: stroke('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>'),
  'credit-card': stroke('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>'),
  'log-out': stroke('<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 8l4 4-4 4M20 12H9"/>'),
  download: stroke('<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>'),
  eye: stroke('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  'eye-off': stroke('<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.5 6.7C3.8 8.5 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  lock: stroke('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  plus: stroke('<path d="M12 5v14M5 12h14"/>'),
  'trend-up': stroke('<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>'),
  google: fill('<path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>'),
  apple: fill('<path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>'),
  flag: stroke('<path d="M5 21V4M5 4h13l-2 4 2 4H5"/>'),
  instagram: stroke('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/>'),
  facebook: fill('<path d="M14 8V6.5c0-.8.3-1.2 1.3-1.2H17V2h-2.6C11.6 2 10 3.7 10 6.2V8H7.5v3.4H10V22h4V11.4h2.8L17.3 8z"/>'),
  youtube: stroke('<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor"/>'),
  x: fill('<path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z"/>'),
};

export function icon(name, cls = 'size-5') {
  const i = ICONS[name];
  if (!i) return '';
  const attrs = i.type === 'stroke'
    ? 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    : 'fill="currentColor"';
  return `<svg class="${cls}" viewBox="0 0 24 24" ${attrs} aria-hidden="true" focusable="false">${i.d}</svg>`;
}
