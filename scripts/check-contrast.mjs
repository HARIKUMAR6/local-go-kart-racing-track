/* WCAG AA verification of the semantic tokens in src/css/tokens.css.
   Reads the CSS itself, so the check can never drift from the real tokens.
   Every theme × section-tone combination is tested with the pairs that actually occur in the UI.
   (Rendered-page contrast is verified separately by scripts/audit-rendered-contrast.mjs.)
   Exit code 1 on any failure. */
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/css/tokens.css', import.meta.url), 'utf8');

/** Collect `--name: #hex` declarations from the first block whose selector matches. */
function block(selector) {
  const i = css.indexOf(selector);
  if (i < 0) throw new Error(`selector not found: ${selector}`);
  const body = css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i));
  const vars = {};
  for (const [, k, v] of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) vars[k] = v.toLowerCase();
  return vars;
}

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const light = block(':root,\n[data-theme="light"]');
const dark = { ...light, ...block('[data-theme="dark"] {') };
const accentLight = block('.tone-accent {');
const accentDark = block('[data-theme="dark"] .tone-accent {');

let fail = 0; let pass = 0;
function expect(ctx, fg, bg, min, vars) {
  const f = vars[fg]; const b = typeof bg === 'string' && bg.startsWith('#') ? bg : vars[bg];
  if (!f || !b) { console.log(`??    ${ctx}: missing ${fg}/${bg}`); fail++; return; }
  const r = ratio(f, b);
  const ok = r >= min;
  ok ? pass++ : fail++;
  if (!ok || process.argv.includes('--verbose')) console.log(`${ok ? 'PASS' : 'FAIL'}  ${ctx.padEnd(22)} ${fg.padEnd(14)} on ${String(bg).padEnd(10)} ${r.toFixed(2)} (min ${min})`);
}

for (const [name, theme, accent] of [['light', light, accentLight], ['dark', dark, accentDark]]) {
  // Section tones: each carries its own background + the tokens that sit on it
  const tones = {
    base: { ...theme, 'section-bg': theme.bg },
    alt: { ...theme, 'section-bg': theme['bg-alt'] },
    raised: { ...theme, 'section-bg': theme['bg-raised'] },
    accent: { ...theme, ...accent, 'section-bg': accent['section-bg'] },
  };
  for (const [tone, v] of Object.entries(tones)) {
    const ctx = `${name}/${tone}`;
    const bg = v['section-bg'];
    for (const fg of ['text', 'heading', 'text-muted', 'text-accent', 'highlight']) expect(ctx, fg, bg, 4.5, v);
    expect(ctx, 'border-strong', bg, 3, v);
    expect(ctx, 'focus', bg, 3, v);
    expect(ctx, 'inverse-fg', 'inverse-bg', 4.5, v);
    expect(ctx, 'inverse-accent', 'inverse-bg', 4.5, v);
    expect(ctx, 'inverse-bg', bg, 3, v); // inverse button boundary against its section
    if (tone !== 'accent') {
      // cards / panels sit on the section; every text role must pass on the card surface too
      for (const fg of ['text', 'text-muted', 'text-accent']) expect(`${ctx} card`, fg, 'surface', 4.5, v);
    }
  }
  const ctx = `${name}/ui`;
  expect(ctx, 'on-brand', 'brand', 4.5, theme);                      // primary button label
  expect(ctx, 'brand', 'bg', 3, theme);                                // primary button boundary vs page
  expect(ctx, 'input-text', 'input-bg', 4.5, theme);
  expect(ctx, 'placeholder', 'input-bg', 4.5, theme);
  expect(ctx, 'border-strong', 'input-bg', 3, theme);                  // input boundary
  expect(ctx, 'danger-text', 'bg', 4.5, theme);
  expect(ctx, 'danger-text', 'input-bg', 4.5, theme);
  // Navigation (solid state sits on --bg at 96% opacity; tested against --bg)
  expect(`${name}/nav solid`, 'nav-text', 'bg', 4.5, theme);
  expect(`${name}/nav solid`, 'nav-accent', 'bg', 4.5, theme);
  expect(`${name}/nav solid`, 'nav-border', 'bg', 3, theme);
  expect(`${name}/menu`, 'text', 'menu-bg', 4.5, theme);
  expect(`${name}/menu`, 'text-accent', 'menu-bg', 4.5, theme);
  expect(`${name}/menu`, 'border-strong', 'surface', 3, theme);        // theme-toggle buttons in menu
  expect(`${name}/dropdown`, 'text', 'surface', 4.5, theme);
  expect(`${name}/dropdown`, 'text-accent', 'hover', 4.5, theme);
  // Footer
  for (const fg of ['text-muted', 'heading', 'text-accent', 'text']) expect(`${name}/footer`, fg, 'footer-bg', 4.5, theme);
  expect(`${name}/footer`, 'border-strong', 'footer-bg', 3, theme);
}

// Photo context + header overlay: fixed light-on-dark tokens, tested against the darkest-allowed scrim result
// (a scrimmed photo never gets lighter than this; real pixels are verified by the rendered audit).
const photoBg = '#2b313c';
const photo = { text: '#f3f1ea', 'text-muted': '#dfe3ea', 'text-accent': '#c8f031', highlight: '#c8f031' };
for (const fg of Object.keys(photo)) expect('photo', fg, photoBg, 4.5, photo);

console.log(`\n${pass} pairs passed, ${fail} failed`);
console.log(fail ? 'WCAG AA token check FAILED' : 'All token pairs meet WCAG AA');
process.exit(fail ? 1 : 0);
