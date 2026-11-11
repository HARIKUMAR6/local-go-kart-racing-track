/* Tiny SVG chart helpers (no dependencies). Charts are measured at their real pixel width so type stays legible
   on a 320px phone, and every colour is a CSS token so light/dark themes and RTL "just work".
   Charts always run left→right (time axis), so their wrapper carries dir="ltr". */
const NS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export const fmtLap = (ms) => {
  const m = Math.floor(ms / 60000);
  const s = (ms % 60000) / 1000;
  return `${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`;
};

function niceTicks(min, max, count) {
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= raw) || mag * 10;
  const out = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) out.push(t);
  return out;
}

/* Line chart. series: [{ label, color, points: [{ x, y, title }] }]. opts: { yFmt, invert, height, ticks, label } */
export function lineChart(el, series, opts = {}) {
  const w = Math.max(240, el.clientWidth || 320);
  const h = opts.height || (w < 420 ? 220 : 260);
  const pad = { t: 16, r: 16, b: 34, l: w < 420 ? 56 : 66 };
  const ys = series.flatMap((s) => s.points.map((p) => p.y));
  let lo = opts.min ?? Math.min(...ys);
  let hi = opts.max ?? Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; }
  const margin = (hi - lo) * 0.18;
  if (opts.min === undefined) lo -= margin;
  if (opts.max === undefined) hi += margin;
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))];
  const X = (x) => pad.l + (xs.length === 1 ? (w - pad.l - pad.r) / 2 : ((w - pad.l - pad.r) * xs.indexOf(x)) / (xs.length - 1));
  const Y = (y) => { const t = (y - lo) / (hi - lo); return pad.t + (h - pad.t - pad.b) * (opts.invert ? t : 1 - t); };
  const ticks = opts.tickValues || niceTicks(lo, hi, opts.ticks || 4);
  const fmt = opts.yFmt || ((v) => v.toFixed(0));
  let svg = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(opts.label || 'Chart')}" focusable="false">`;
  for (const t of ticks) {
    const y = Y(t);
    svg += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`;
    svg += `<text x="${pad.l - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="var(--text-muted)">${esc(fmt(t))}</text>`;
  }
  xs.forEach((x) => { svg += `<text x="${X(x)}" y="${h - 10}" text-anchor="middle" font-size="11" fill="var(--text-muted)">${esc(x)}</text>`; });
  for (const s of series) {
    const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x)} ${Y(p.y)}`).join(' ');
    if (s.points.length > 1) svg += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
    for (const p of s.points) svg += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="5" fill="var(--bg-raised, var(--surface))" stroke="${s.color}" stroke-width="3"><title>${esc(p.title || `${s.label}: ${fmt(p.y)}`)}</title></circle>`;
  }
  el.innerHTML = svg + '</svg>';
}

/* Bar chart. items: [{ label, value, title, hl }]. opts: { min, max, yFmt, label } */
export function barChart(el, items, opts = {}) {
  const w = Math.max(240, el.clientWidth || 320);
  const h = opts.height || (w < 420 ? 220 : 260);
  const pad = { t: 16, r: 8, b: 30, l: w < 420 ? 56 : 66 };
  const vals = items.map((i) => i.value);
  const lo = opts.min ?? Math.min(...vals) * 0.995;
  const hi = opts.max ?? Math.max(...vals);
  const Y = (v) => pad.t + (h - pad.t - pad.b) * (1 - (v - lo) / (hi - lo));
  const bw = (w - pad.l - pad.r) / items.length;
  const fmt = opts.yFmt || ((v) => v.toFixed(0));
  let svg = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(opts.label || 'Chart')}" focusable="false">`;
  for (const t of niceTicks(lo, hi, 4)) {
    const y = Y(t);
    svg += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y}" y2="${y}" stroke="var(--border)"/>`;
    svg += `<text x="${pad.l - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="var(--text-muted)">${esc(fmt(t))}</text>`;
  }
  const every = Math.ceil(items.length / Math.max(1, Math.floor((w - pad.l) / 34)));
  items.forEach((it, i) => {
    const x = pad.l + bw * i + bw * 0.14;
    const y = Y(it.value);
    svg += `<rect x="${x}" y="${y}" width="${bw * 0.72}" height="${h - pad.b - y}" fill="${it.hl ? 'var(--display-accent)' : 'var(--text-muted)'}" opacity="${it.hl ? 1 : 0.55}"><title>${esc(it.title || fmt(it.value))}</title></rect>`;
    if (i % every === 0) svg += `<text x="${x + bw * 0.36}" y="${h - 10}" text-anchor="middle" font-size="11" fill="var(--text-muted)">${esc(it.label)}</text>`;
  });
  el.innerHTML = svg + '</svg>';
}
