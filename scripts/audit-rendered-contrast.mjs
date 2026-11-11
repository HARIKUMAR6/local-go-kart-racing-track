/* RENDERED-PAGE CONTRAST AUDIT (WCAG 2.x AA)
   Complements scripts/check-contrast.mjs (token level) by testing what users actually see:
     • every visible text element: its computed colour vs. the REAL pixels behind it
       (all text is hidden, the page is screenshotted, and the pixels under each glyph box are sampled,
        so photographs, scrims and gradients are measured, not assumed)
     • icon-only controls (glyph vs. surface, 3:1) and form-field boundaries (3:1)
     • states: every scroll position, header overlay + solid, mobile/tablet menu, desktop dropdown, hover
   Thresholds: normal text 4.5:1 · large text (≥24px, or ≥18.66px bold) 3:1 · graphics/boundaries 3:1.
   A 5th-percentile pixel is used so one stray specular highlight can't fail (or mask) a result.

   Needs a browser driver that is intentionally NOT a project dependency:
       npm i --no-save puppeteer-core
       CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" npm run serve   (other terminal)
       npm run audit:contrast -- --widths=375,1440 --themes=light,dark --dir=ltr
   Options: --widths= --themes= --dir= --pages= --detail=report.json    Env: BASE_URL, CHROME_PATH */
let puppeteer;
try { puppeteer = (await import('puppeteer-core')).default; } catch { console.error('puppeteer-core is not installed. Run: npm i --no-save puppeteer-core'); process.exit(2); }
import { writeFileSync } from 'node:fs';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=')[1];
const WIDTHS = arg('widths', '375,1440').split(',').map(Number);
const THEMES = arg('themes', 'light,dark').split(',');
const DIR = arg('dir', 'ltr');
const PAGES = arg('pages', '/,/home-2').split(',');
const BASE = process.env.BASE_URL || 'http://localhost:4173';

const lumC = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lumC(r) + 0.7152 * lumC(g) + 0.0722 * lumC(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const parseColor = (s) => {
  let m = s.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[,/ ]+([\d.]+))?\)/);
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
  m = s.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
  if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] === undefined ? 1 : +m[4]];
  return null;
};

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const sampler = await browser.newPage();
await sampler.setContent('<canvas id="c"></canvas>');

/** Sample pixels of `png` (base64) inside each rect → array of [[r,g,b],…] per rect. */
async function samplePixels(png, rects) {
  return sampler.evaluate(async (b64, rects) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.getElementById('c'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
    return rects.map((r) => {
      const x0 = Math.max(0, Math.floor(r.x)), y0 = Math.max(0, Math.floor(r.y));
      const x1 = Math.min(img.width - 1, Math.ceil(r.x + r.w)), y1 = Math.min(img.height - 1, Math.ceil(r.y + r.h));
      const out = []; const nx = Math.min(14, Math.max(2, x1 - x0)), ny = Math.min(6, Math.max(2, y1 - y0));
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const x = Math.round(x0 + ((x1 - x0) * i) / (nx - 1)), y = Math.round(y0 + ((y1 - y0) * j) / (ny - 1));
        const d = ctx.getImageData(x, y, 1, 1).data; out.push([d[0], d[1], d[2]]);
      }
      return out;
    });
  }, png, rects);
}

/** In-page collectors (run inside the site page). */
const collect = () => {
  const vis = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.99 || e.hasAttribute('hidden')) return false;
      if (e.classList?.contains('visually-hidden')) return false;
    }
    return true;
  };
  const path = (el) => {
    const parts = [];
    for (let e = el; e && parts.length < 3 && e.tagName !== 'BODY'; e = e.parentElement) {
      const cls = e instanceof SVGElement ? '' : (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : '');
      parts.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : cls));
    }
    return parts.join('>');
  };
  const items = [];
  /* Union of the rects of the element's OWN text nodes = the real glyph area (no padding, borders or rounded corners). */
  const textRect = (el) => {
    let box = null;
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) {
        if (r.width < 1 || r.height < 1) continue;
        box = box ? { l: Math.min(box.l, r.left), t: Math.min(box.t, r.top), r: Math.max(box.r, r.right), b: Math.max(box.b, r.bottom) } : { l: r.left, t: r.top, r: r.right, b: r.bottom };
      }
    }
    if (!box) return null;
    const h = box.b - box.t; /* sample the central glyph band: the font content box can bleed into the next line */
    return { vx: box.l, vy: box.t + h * 0.2, w: box.r - box.l, h: h * 0.6 };
  };
  const base = (el) => ({
    fixed: !!el.closest('.site-header, .scroll-top, .skip-link'), inHeader: !!el.closest('.site-header'),
    inMenu: !!el.closest('.mobile-menu'), hov: el.matches(':hover'),
  });
  document.querySelectorAll('body *').forEach((el, idx) => {
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'noscript', 'canvas'].includes(tag) || !vis(el)) return;
    const rect = textRect(el);
    if (rect) {
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize); const fw = parseInt(cs.fontWeight, 10) || 400;
      items.push({
        id: idx, kind: 'text', path: path(el), text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40),
        color: el instanceof SVGElement ? cs.fill : cs.color, large: fs >= 24 || (fs >= 18.66 && fw >= 700), rect, ...base(el),
      });
    }
  });
  /* Non-text graphics that carry meaning: glyphs of icon-only controls (WCAG 1.4.11, 3:1). */
  document.querySelectorAll('.icon-btn:not(:has([data-dir-label])) svg, .social-link svg').forEach((el, idx) => {
    if (!vis(el)) return;
    const r = el.getBoundingClientRect(); if (r.width < 4) return;
    const cs = getComputedStyle(el);
    items.push({ id: 200000 + idx, kind: 'icon', path: path(el.parentElement), text: (el.closest('[aria-label]')?.getAttribute('aria-label') || 'icon').slice(0, 30),
      color: cs.color, rect: { vx: r.left + r.width * 0.2, vy: r.top + r.height * 0.2, w: r.width * 0.6, h: r.height * 0.6 }, ...base(el) });
  });
  /* Form-field boundaries (identify the control; there is no other cue) */
  document.querySelectorAll('.field-input').forEach((el, idx) => {
    if (!vis(el)) return;
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    items.push({ id: 300000 + idx, kind: 'ui', path: path(el), text: el.name || 'input', color: cs.borderTopColor, rect: { vx: r.left, vy: r.top, w: r.width, h: r.height }, ...base(el) });
  });
  return items;
};

const HIDE = `* { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; transition: none !important; animation: none !important; caret-color: transparent !important; }
  svg text { fill: transparent !important; } ::placeholder { color: transparent !important; }`;

const results = [];
const fails = [];
function judge(ctx, it, pixels, extra = {}) {
  const fg = parseColor(it.color); if (!fg) return;
  const base = it.kind === 'ui' ? null : null;
  const ratios = pixels.map((px) => {
    const a = fg[3];
    const c = a < 1 ? [0, 1, 2].map((i) => fg[i] * a + px[i] * (1 - a)) : fg;
    return ratio(c, px);
  }).sort((p, q) => p - q);
  const p5 = ratios[Math.floor(ratios.length * 0.05)];
  const min = it.kind === 'text' ? (it.large ? 3 : 4.5) : 3;
  const ok = p5 >= min;
  const rec = { ctx, kind: it.kind,  path: it.path, text: it.text, color: it.color, ratio: +p5.toFixed(2), min, ok, ...extra };
  results.push(rec);
  if (!ok) fails.push(rec);
}

async function audit(page, ctx, { only, ring = 4 } = {}) {
  const vh = page.viewport().height;
  const all = await page.evaluate(collect);
  const hdrH = await page.evaluate(() => document.querySelector('.site-header')?.getBoundingClientRect().height || 0);
  await page.addStyleTag({ content: HIDE });
  await new Promise((r) => setTimeout(r, 120));
  const png = (await page.screenshot({ encoding: 'base64' }));
  const inView = all.filter((it) => it.rect.vy >= -1 && it.rect.vy + it.rect.h <= vh + 1 && (only ? only(it) : true));
  const rects = inView.map((it) => (it.kind === 'ui'
    ? { x: it.rect.vx - ring, y: it.rect.vy - ring, w: it.rect.w + ring * 2, h: it.rect.h + ring * 2, ring: true }
    : { x: it.rect.vx, y: it.rect.vy, w: it.rect.w, h: it.rect.h }));
  // UI components: sample only the ring just outside the control (the surface it sits on)
  const px = [];
  for (let i = 0; i < inView.length; i++) {
    if (inView[i].kind === 'ui') {
      const r = inView[i].rect; const s = [];
      const pts = [[r.vx - 3, r.vy + r.h / 2], [r.vx + r.w + 3, r.vy + r.h / 2], [r.vx + r.w / 2, r.vy - 3], [r.vx + r.w / 2, r.vy + r.h + 3], [r.vx - 3, r.vy - 3], [r.vx + r.w + 3, r.vy + r.h + 3]];
      const got = await samplePixels(png, pts.map(([x, y]) => ({ x, y, w: 1, h: 1 })));
      got.forEach((g) => g.forEach((p) => s.push(p)));
      px.push(s);
    } else px.push((await samplePixels(png, [rects[i]]))[0]);
  }
  inView.forEach((it, i) => {
    // elements under the sticky header are judged in their own scroll step
    if (!it.fixed && it.rect.vy < hdrH - 1 && !ctx.includes('menu')) return;
    judge(ctx, it, px[i]);
  });
  return inView.length;
}

async function newPage(path, w, theme, dir) {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: w < 600 ? 800 : w < 1100 ? 1000 : 900 });
  await p.evaluateOnNewDocument((t, d) => { localStorage.setItem('apex:theme', t); localStorage.setItem('apex:dir', d); }, theme, dir);
  await p.goto(BASE + path, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; }));
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  await new Promise((r) => setTimeout(r, 700));
  return p;
}

let checked = 0;

/** Judge a list of pre-collected items against a viewport screenshot taken with text hidden. */
async function judgeItems(page, ctx, items) {
  if (!items.length) return 0;
  const png = await page.screenshot({ encoding: 'base64' });
  for (const it of items) {
    let px;
    if (it.kind === 'ui') {
      const r = it.rect; const o = 3;
      const pts = [[r.vx - o, r.vy + r.h / 2], [r.vx + r.w + o, r.vy + r.h / 2], [r.vx + r.w / 2, r.vy - o], [r.vx + r.w / 2, r.vy + r.h + o], [r.vx - o, r.vy - o], [r.vx + r.w + o, r.vy + r.h + o]];
      px = (await samplePixels(png, pts.map(([x, y]) => ({ x, y, w: 1, h: 1 })))).flat();
    } else px = (await samplePixels(png, [{ x: it.rect.vx, y: it.rect.vy, w: it.rect.w, h: it.rect.h }]))[0];
    judge(ctx, it, px);
  }
  return items.length;
}

const settle = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const hide = async (p) => { await p.addStyleTag({ content: HIDE }); await settle(150); };

for (const theme of THEMES) for (const path of PAGES) for (const w of WIDTHS) {
  const tag = `${path} ${theme} ${DIR} @${w}`;
  const p = await newPage(path, w, theme, DIR);
  const vh = p.viewport().height;
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const hdr = await p.evaluate(() => document.querySelector('.site-header').getBoundingClientRect().height);

  // ---- Phase 1 (text visible): collect body items per scroll step, plus header states
  const steps = []; const seen = new Set();
  const stride = vh - hdr - 60;
  for (let y = 0; y < total; y += stride) {
    await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y); await settle(260);
    const items = (await p.evaluate(collect)).filter((it) => !it.fixed && it.rect.vy >= hdr - 1 && it.rect.vy + it.rect.h <= vh + 1 && !seen.has(it.id));
    items.forEach((it) => seen.add(it.id));
    steps.push({ y, items });
  }
  const states = [];
  for (const [label, y] of [['header@top', 0], ['header@scrolled', 700]]) {
    await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y); await settle(500);
    states.push({ label, y, items: (await p.evaluate(collect)).filter((it) => it.fixed && !it.path.includes('skip-link') && it.rect.vy >= -1 && it.rect.vy + it.rect.h <= vh + 1) });
  }

  // ---- Phase 2 (text hidden): screenshot + sample at the same scroll positions
  await hide(p);
  for (const s of steps) { await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), s.y); await settle(200); checked += await judgeItems(p, `${tag} y=${s.y}`, s.items); }
  for (const s of states) { await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), s.y); await settle(450); checked += await judgeItems(p, `${tag} ${s.label}`, s.items); }
  await p.close();

  // ---- Menu (<1024) or dropdown (≥1024)
  const q = await newPage(path, w, theme, DIR);
  if (w < 1024) {
    await q.click('[data-menu-toggle]'); await settle(350);
    let items = (await q.evaluate(collect)).filter((it) => it.inMenu || it.inHeader);
    await q.click('[data-accordion-trigger]'); await settle(250);
    const items2 = (await q.evaluate(collect)).filter((it) => it.inMenu && it.path.includes('menu-sublink'));
    await hide(q);
    checked += await judgeItems(q, `${tag} menu`, items.filter((it) => !it.path.includes('menu-sublink')));
    checked += await judgeItems(q, `${tag} menu+home`, items2);
  } else {
    await q.evaluate(() => scrollTo({ top: 700, behavior: 'instant' })); await settle(400);
    await q.click('[data-dropdown-trigger]'); await settle(250);
    const items = (await q.evaluate(collect)).filter((it) => it.path.includes('dropdown'));
    await hide(q);
    checked += await judgeItems(q, `${tag} dropdown`, items);
  }
  await q.close();
}

// ---- Interaction states (desktop): hover on key controls, each theme
for (const theme of THEMES) for (const path of PAGES) {
  const w = 1440; const tag = `${path} ${theme} ${DIR} @${w}`;
  const sels = ['.hero .btn-primary', '.hero .btn-secondary', '.hero-split .btn-secondary', '.nav-link[href="/about"]', '.btn-inverse', '.footer-link', '.social-link', '#tab-individual', '.ladder-row .btn', '.btn-volt'];
  for (const sel of sels) {
    const q = await newPage(path, w, theme, DIR);
    if (!(await q.$(sel))) { await q.close(); continue; }
    await q.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await settle(500);
    await q.hover(sel); await settle(450);
    const items = (await q.evaluate(collect)).filter((it) => it.hov && !it.path.includes('skip'));
    await hide(q);
    checked += await judgeItems(q, `${tag} hover ${sel}`, items);
    await q.close();
  }
}

console.log(`${checked} element-states audited, ${results.length} judged, ${fails.length} FAIL`);
const grouped = {};
for (const f of fails) { const k = `${f.path} | "${f.text}" | ${f.color}`; (grouped[k] ||= []).push(f); }
for (const [k, v] of Object.entries(grouped)) console.log(`FAIL x${v.length} ${k}  worst ${Math.min(...v.map((x) => x.ratio))} (need ${v[0].min}) e.g. ${v[0].ctx}`);
const out = arg('detail', '');
if (out) writeFileSync(out, JSON.stringify({ results, fails }, null, 1));
process.exitCode = fails.length ? 1 : 0;
await browser.close();
