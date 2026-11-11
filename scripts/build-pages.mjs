/* Page build: src/pages/*.html -> project root (index.html, home-2.html …).
   Expands {{img:ID|sizes=…|class=…|eager|alt=…}} tokens into responsive <img> tags using data/image-inventory.json.
   HARD GATE: the build fails if a referenced image is missing, not "verified", or has no local files.
   It also fails if the same image id is used more than once across all pages (no repeated photography). */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { icon } from '../js/components/icons.js';
import * as site from '../js/data/site.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const inv = JSON.parse(await readFile(join(root, 'data/image-inventory.json'), 'utf8'));
const byId = new Map(inv.images.map((i) => [i.id, i]));
const used = new Map();
const errors = [];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function img(token, page) {
  const [id, ...opts] = token.split('|');
  const o = { sizes: '100vw', class: 'img-cover' };
  for (const p of opts) { const [k, ...v] = p.split('='); o[k] = v.length ? v.join('=') : true; }
  const rec = byId.get(id);
  if (!rec) { errors.push(`${page}: unknown image "${id}"`); return ''; }
  if (rec.status !== 'verified' || !rec.files) { errors.push(`${page}: image "${id}" is not verified (status=${rec.status})`); return ''; }
  if (used.has(id)) errors.push(`${page}: image "${id}" already used in ${used.get(id)}`);
  used.set(id, page);
  const widths = Object.keys(rec.files).map(Number).sort((a, b) => a - b);
  const largest = rec.files[widths[widths.length - 1]];
  const [w, h] = rec.originalSize.split('x').map(Number);
  const srcset = widths.map((x) => `${rec.files[x]} ${x}w`).join(', ');
  const alt = o.alt === undefined ? rec.alt : o.alt === true ? '' : o.alt;
  return `<img src="${largest}" srcset="${srcset}" sizes="${esc(o.sizes)}" width="${w}" height="${h}" alt="${esc(alt)}" class="${o.class}" style="--focal:${rec.focal}" ${o.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

/* Build-time data tokens: pages read business data from js/data/site.js, never from copied literals.
   {{site:contact.phone}} {{site:contact.hours.0.time}} {{price:sprint}} {{unit:sprint}} {{detail:sprint}}
   {{map:embed}} {{map:view}} {{map:directions}} (OpenStreetMap, built from contact.map coordinates) */
const dig = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), site);
const m = site.contact.map;
const lonHalf = (450 * 360) / (256 * 2 ** m.zoom);
const latHalf = lonHalf / 2 * Math.cos((m.lat * Math.PI) / 180);
const bbox = [m.lon - lonHalf, m.lat - latHalf, m.lon + lonHalf, m.lat + latHalf].map((n) => n.toFixed(5)).join('%2C');
const mapUrls = {
  embed: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${m.lat}%2C${m.lon}`,
  view: `https://www.openstreetmap.org/?mlat=${m.lat}&mlon=${m.lon}#map=${m.zoom}/${m.lat}/${m.lon}`,
  directions: `https://www.openstreetmap.org/directions?route=%3B${m.lat}%2C${m.lon}#map=${m.zoom}/${m.lat}/${m.lon}`,
};
const tokens = (html, page) => html
  .replace(/\{\{site:([\w.]+)\}\}/g, (_, k) => { const v = dig(k); if (v == null) errors.push(`${page}: unknown site value "${k}"`); return String(v ?? ''); })
  .replace(/\{\{(price|unit|detail|fname):(\w+)\}\}/g, (_, t, k) => {
    const f = site.pricing.formats.find((x) => x.key === k);
    if (!f) { errors.push(`${page}: unknown pricing format "${k}"`); return ''; }
    return t === 'price' ? `${site.pricing.currency}${f.price}` : t === 'unit' ? f.unit : t === 'fname' ? f.name : f.detail;
  })
  .replace(/\{\{map:(embed|view|directions)\}\}/g, (_, k) => mapUrls[k]);

const srcDir = join(root, 'src/pages');
for (const f of (await readdir(srcDir)).filter((n) => n.endsWith('.html'))) {
  const html = tokens(await readFile(join(srcDir, f), 'utf8'), f).replace(/\{\{img:([^}]+)\}\}/g, (_, t) => img(t.trim(), f))
    .replace(/\{\{icon:([\w-]+)\}\}/g, (_, n) => icon(n, 'size-5'));
  const out = html.replace(/^<!doctype html>/i, `<!doctype html>\n<!-- GENERATED from src/pages/${f} by scripts/build-pages.mjs – edit the source file -->`);
  await writeFile(join(root, f), out);
  console.log(`built ${f}`);
}
if (errors.length) { console.error('\nBUILD FAILED:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log(`${used.size} images referenced, all verified, none repeated.`);
