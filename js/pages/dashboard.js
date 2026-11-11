/* Racer dashboard. Renders from js/data/racer.js; every total/average/rank is derived from those records.
   Views are hash-routed (#overview … #profile) so each section can be opened directly by URL. */
import { racer, TODAY, sessions, bookings, boards, bestSectors, finalLaps, price, formatByKey, circuits } from '../data/racer.js';
import { contact } from '../data/site.js';
import { icon } from '../components/icons.js';
import { store } from '../modules/storage.js';
import { fmtLap, lineChart, barChart } from '../modules/charts.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => `$${n.toLocaleString('en-US')}`;
const utc = (iso) => new Date(`${iso}T00:00:00Z`);
const fmtDate = (iso, o = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) => new Intl.DateTimeFormat('en-US', { ...o, timeZone: 'UTC' }).format(utc(iso));
const shortDate = (iso) => fmtDate(iso, { month: 'short', day: 'numeric' });
const daysUntil = (iso) => Math.round((utc(iso) - utc(TODAY)) / 86400000);
const circuitName = (c) => circuits[c].name;
const formatName = (k) => formatByKey[k].name;
const gap = (ms) => `+${(ms / 1000).toFixed(3)}`;
const ordinal = (n) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th'}`;
const statusChip = (s) => `<span class="status" data-s="${s.toLowerCase()}">${esc(s)}</span>`;

/* ---------- persisted (local) state ---------- */
const read = (k, d) => { try { return JSON.parse(store.get(k) || 'null') ?? d; } catch { return d; } };
let profile = { name: racer.name, email: racer.email, phone: racer.phone, circuit: racer.preferredCircuit, reminders: racer.reminders, ...read('apex:racer-profile', {}) };
let cancelled = read('apex:racer-cancelled', []);

/* ---------- derived records ---------- */
const upcoming = () => bookings.filter((b) => !cancelled.includes(b.ref) && daysUntil(b.date) >= 0).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
const bestOf = (c) => sessions.filter((s) => s.circuit === c).reduce((m, s) => (s.best < m.best ? s : m));
const totals = () => {
  const laps = sessions.reduce((n, s) => n + s.laps, 0);
  const km = sessions.reduce((n, s) => n + (s.laps * circuits[s.circuit].length) / 1000, 0);
  const placed = sessions.filter((s) => s.pos);
  const mean = finalLaps.laps.reduce((a, b) => a + b, 0) / finalLaps.laps.length;
  const sigma = Math.sqrt(finalLaps.laps.reduce((a, b) => a + (b - mean) ** 2, 0) / finalLaps.laps.length);
  return { laps, km, podiums: placed.filter((s) => s.pos <= 3).length, avgFinish: placed.reduce((n, s) => n + s.pos, 0) / placed.length, sigma, mean };
};
const payments = () => {
  const rows = sessions.map((s) => ({ date: s.date, desc: `${formatName(s.format)} · ${circuitName(s.circuit)}`, ref: `RC-${s.id}`, amount: price(s.format), status: 'Paid' }));
  for (const b of bookings) {
    const dr = b.drivers > 1 ? ` · ${b.drivers} drivers` : '';
    const cx = cancelled.includes(b.ref);
    rows.push({ date: b.paidOn || b.date, desc: `${formatName(b.format)} · ${circuitName(b.circuit)}${dr}`, ref: `RC-${b.ref}`, amount: price(b.format, b.drivers), status: cx ? 'Cancelled' : b.paidOn ? 'Paid' : 'Due' });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date));
};

/* ---------- small renderers ---------- */
const table = (cols, rows, cls = '') => `<div class="dtable-wrap"><table class="dtable ${cls}"><thead><tr>${cols.map((c) => `<th scope="col"${c.num ? ' class="num"' : ''}>${c.h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const cell = (label, html, num = false) => `<td data-label="${esc(label)}"${num ? ' class="num"' : ''}>${html}</td>`;
const stat = (label, value, sub = '', accent = false) => `<div class="dstat"${accent ? ' data-accent="true"' : ''}><p class="dstat-label">${label}</p><p class="dstat-value">${value}</p>${sub ? `<p class="dstat-sub">${sub}</p>` : ''}</div>`;
const icsLink = (b) => `<button type="button" class="btn btn-secondary btn-sm" data-ics="${b.ref}">${icon('calendar', 'size-4')} Add to calendar</button>`;

function directions() {
  const m = contact.map;
  return `https://www.openstreetmap.org/directions?route=%3B${m.lat}%2C${m.lon}#map=${m.zoom}/${m.lat}/${m.lon}`;
}

function bookingCard(b) {
  const d = utc(b.date);
  const left = daysUntil(b.date);
  const when = left === 0 ? 'Today' : left === 1 ? 'Tomorrow' : `In ${left} days`;
  return `<article class="dbooking" aria-label="${esc(formatName(b.format))} on ${esc(fmtDate(b.date))}">
    <div class="ddate" aria-hidden="true"><span>${new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(d)}</span><b>${d.getUTCDate()}</b></div>
    <div class="dbooking-body">
      <h4>${esc(formatName(b.format))}</h4>
      <p class="dmeta">${esc(fmtDate(b.date))} · ${b.time} · ${esc(circuitName(b.circuit))}${b.drivers > 1 ? ` · ${b.drivers} drivers` : ''}</p>
      <p class="dmeta">Ref ${b.ref} · ${when} · <strong>${money(price(b.format, b.drivers))}</strong></p>
    </div>
    <div class="dbooking-side">${statusChip(b.status)}</div>
    <div class="dbooking-actions">${icsLink(b)}<a class="btn btn-secondary btn-sm" href="/contact?type=${b.format === 'group' ? 'group' : b.circuit}#enquiry">Change</a><button type="button" class="btn btn-dark btn-sm" data-cancel="${b.ref}">Cancel</button></div>
  </article>`;
}

function renderNext() {
  const [b] = upcoming();
  const el = $('[data-slot="next-race"]');
  if (!b) { el.innerHTML = `<p class="text-muted">No races booked.</p><a class="btn btn-primary mt-4" href="/races-pricing#book">Book a Race</a>`; return; }
  const left = daysUntil(b.date);
  el.innerHTML = `<p class="dcount"><b>${left}</b> ${left === 1 ? 'day' : 'days'} to go</p>
    <h4 class="dnext-title">${esc(formatName(b.format))}</h4>
    <p class="dmeta">${esc(fmtDate(b.date))} · ${b.time}</p>
    <p class="dmeta">${esc(circuitName(b.circuit))} · ${esc(contact.addressLines[0])}</p>
    <div class="dnext-actions">${icsLink(b)}<a class="btn btn-secondary btn-sm" href="${directions()}" target="_blank" rel="noopener noreferrer">${icon('map-pin', 'size-4')} Directions<span class="visually-hidden"> (opens in a new tab)</span></a></div>`;
}

function renderRecent() {
  const rows = [...sessions].reverse().slice(0, 4).map((s) => `<tr>${cell('Date', esc(shortDate(s.date)))}${cell('Session', `<strong>${esc(formatName(s.format))}</strong><span class="dsub">${esc(circuitName(s.circuit))}</span>`)}${cell('Best lap', `<span class="lap-time">${fmtLap(s.best)}</span>`, true)}${cell('Result', s.pos ? `P${s.pos} of ${s.of}` : 'Timed')}</tr>`);
  $('[data-slot="recent"]').innerHTML = table([{ h: 'Date' }, { h: 'Session' }, { h: 'Best lap', num: true }, { h: 'Result' }], rows);
}

function renderOverviewStats() {
  const t = totals(); const bi = bestOf('indoor'); const bo = bestOf('outdoor');
  const rank = (b, key) => boards[key].findIndex((r) => r.you) + 1;
  $('[data-slot="stats-overview"]').innerHTML =
    stat('Best indoor lap', `<span class="lap-time">${fmtLap(bi.best)}</span>`, `${ordinal(rank(bi, 'indoor'))} on the indoor board`, true) +
    stat('Best outdoor lap', `<span class="lap-time">${fmtLap(bo.best)}</span>`, `${ordinal(rank(bo, 'outdoor'))} on the outdoor board`) +
    stat('Races completed', String(sessions.length), `${t.podiums} podium${t.podiums === 1 ? '' : 's'}`) +
    stat('Laps driven', String(t.laps), `${t.km.toFixed(1)} km total`);
  const first = sessions.find((s) => s.circuit === 'indoor').best;
  $('[data-slot="trend-note"]').textContent = `−${((first - bi.best) / 1000).toFixed(3)} s since ${shortDate(sessions.find((s) => s.circuit === 'indoor').date)}`;
}

function renderBookings() {
  const up = upcoming();
  $('[data-slot="upcoming"]').innerHTML = up.length ? up.map(bookingCard).join('') : `<div class="dempty"><p>No upcoming bookings.</p><a class="btn btn-primary btn-sm" href="/races-pricing#book">Book a Race</a></div>`;
  renderHistory();
}
let histFilter = 'all';
function renderHistory() {
  const rows = [
    ...sessions.map((s) => ({ date: s.date, c: s.circuit, f: s.format, laps: s.laps, best: s.best, res: s.pos ? `P${s.pos} of ${s.of}` : 'Timed', status: 'Completed' })),
    ...bookings.filter((b) => cancelled.includes(b.ref)).map((b) => ({ date: b.date, c: b.circuit, f: b.format, laps: null, best: null, res: '–', status: 'Cancelled' })),
  ].filter((r) => histFilter === 'all' || r.c === histFilter).sort((a, b) => b.date.localeCompare(a.date));
  $('[data-slot="history"]').innerHTML = table([{ h: 'Date' }, { h: 'Circuit' }, { h: 'Format' }, { h: 'Laps', num: true }, { h: 'Best lap', num: true }, { h: 'Result' }, { h: 'Status' }],
    rows.map((r) => `<tr>${cell('Date', esc(fmtDate(r.date, { month: 'short', day: 'numeric', year: 'numeric' })))}${cell('Circuit', esc(circuitName(r.c)))}${cell('Format', esc(formatName(r.f)))}${cell('Laps', r.laps ?? '–', true)}${cell('Best lap', r.best ? `<span class="lap-time">${fmtLap(r.best)}</span>` : '–', true)}${cell('Result', r.res)}${cell('Status', statusChip(r.status))}</tr>`));
}

function renderLapPanels() {
  for (const panel of $$('[data-circuit]')) {
    const c = panel.dataset.circuit; const list = sessions.filter((s) => s.circuit === c); const best = bestOf(c); const sec = bestSectors[c];
    const leader = boards[c][0].ms;
    const prev = (i) => (i ? list[i - 1].best - list[i].best : null);
    panel.innerHTML = `<div class="dgrid">
      <article class="dpanel" aria-label="${c} personal best">
        <header class="dpanel-head"><h3>Personal best</h3><span class="dnote">${esc(fmtDate(best.date, { month: 'short', day: 'numeric', year: 'numeric' }))} · ${esc(formatName(best.format))}</span></header>
        <p class="dbest lap-time">${fmtLap(best.best)}</p>
        <p class="dmeta">${gap(best.best - leader)} s to the ${c} leader · ${circuits[c].length.toLocaleString('en-US')} m circuit</p>
        <div class="sectors" role="list" aria-label="Sector splits of the personal best">${sec.map((v, i) => `<div role="listitem"><small>Sector ${i + 1}</small><b class="lap-time">${(v / 1000).toFixed(3)}</b><span class="sbar" style="--w:${((v / best.best) * 100).toFixed(1)}%"></span></div>`).join('')}</div>
      </article>
      <article class="dpanel" aria-label="${c} progress">
        <header class="dpanel-head"><h3>Best lap by session</h3><span class="dnote">Lower is faster</span></header>
        <div class="chart" dir="ltr" data-chart="progress-${c}"></div>
      </article>
      <article class="dpanel dgrid-wide" aria-label="${c} lap records">
        <header class="dpanel-head"><h3>Session records</h3></header>
        ${table([{ h: 'Date' }, { h: 'Format' }, { h: 'Laps', num: true }, { h: 'Best lap', num: true }, { h: 'Change', num: true }], [...list].reverse().map((s, ri) => { const i = list.length - 1 - ri; const d = prev(i); return `<tr>${cell('Date', esc(fmtDate(s.date, { month: 'short', day: 'numeric', year: 'numeric' })))}${cell('Format', esc(formatName(s.format)))}${cell('Laps', s.laps, true)}${cell('Best lap', `<span class="lap-time">${fmtLap(s.best)}</span>${s === best ? ' <span class="status" data-s="pb">PB</span>' : ''}`, true)}${cell('Change', d === null ? '–' : `<span class="delta" data-good="${d > 0}">${d > 0 ? '−' : '+'}${(Math.abs(d) / 1000).toFixed(3)} s</span>`, true)}</tr>`; })) }
      </article>
    </div>`;
  }
}

function renderPerformance() {
  const t = totals(); const bi = bestOf('indoor'); const bo = bestOf('outdoor');
  const fi = sessions.find((s) => s.circuit === 'indoor'); const fo = sessions.find((s) => s.circuit === 'outdoor');
  $('[data-slot="stats-performance"]').innerHTML =
    stat('Average finish', t.avgFinish.toFixed(1), 'Across placed races', true) +
    stat('Consistency', `±${(t.sigma / 1000).toFixed(3)} s`, 'Lap-to-lap spread in the latest final') +
    stat('Indoor gain', `−${((fi.best - bi.best) / 1000).toFixed(3)} s`, `${sessions.filter((s) => s.circuit === 'indoor').length} sessions`) +
    stat('Outdoor gain', `−${((fo.best - bo.best) / 1000).toFixed(3)} s`, `${sessions.filter((s) => s.circuit === 'outdoor').length} sessions`) +
    stat('Podiums', String(t.podiums), `from ${sessions.filter((s) => s.pos).length} placed races`) +
    stat('Distance driven', `${t.km.toFixed(1)} km`, `${t.laps} timed laps`);
  const fs = sessions.find((s) => s.id === finalLaps.sessionId);
  $('[data-slot="final-title"]').textContent = `${shortDate(fs.date)} ${circuitName(fs.circuit).replace(' Circuit', '')} final`;
  $('[data-slot="final-note"]').textContent = `Best: lap ${finalLaps.laps.indexOf(Math.min(...finalLaps.laps)) + 1} · mean ${fmtLap(Math.round(t.mean))}`;
}

function renderBoards() {
  for (const panel of $$('[data-board]')) {
    const key = panel.dataset.board; const rows = boards[key]; const me = rows.findIndex((r) => r.you); const lead = rows[0].ms;
    panel.innerHTML = `<div class="dgrid"><article class="dpanel dgrid-wide" aria-label="${key} leaderboard">
      <header class="dpanel-head"><h3>${esc(circuitName(key))} · season best laps</h3><span class="dnote">You: ${ordinal(me + 1)} · ${gap(rows[me].ms - rows[me - 1].ms)} s to ${ordinal(me)} place</span></header>
      ${table([{ h: 'Pos' }, { h: 'Driver' }, { h: 'Kart', num: true }, { h: 'Format' }, { h: 'Best lap', num: true }, { h: 'Gap', num: true }],
        rows.map((r, i) => `<tr${r.you ? ' data-you="true" aria-current="true"' : ''}>${cell('Pos', `<span class="pos">${i + 1}</span>`)}${cell('Driver', `<strong>${esc(r.name)}</strong>${r.you ? ' <span class="status" data-s="you">You</span>' : ''}`)}${cell('Kart', r.kart, true)}${cell('Format', esc(r.format))}${cell('Best lap', `<span class="lap-time">${fmtLap(r.ms)}</span>`, true)}${cell('Gap', i ? gap(r.ms - lead) : 'Leader', true)}</tr>`), 'dtable-board')}
    </article></div>`;
  }
}

function renderPayments() {
  const rows = payments(); const paid = rows.filter((r) => r.status === 'Paid').reduce((n, r) => n + r.amount, 0); const due = rows.filter((r) => r.status === 'Due').reduce((n, r) => n + r.amount, 0);
  $('[data-slot="stats-payments"]').innerHTML = stat('Total paid', money(paid), `${rows.filter((r) => r.status === 'Paid').length} payments`, true) + stat('Amount due', money(due), due ? 'Group Racing booking' : 'Nothing outstanding') + stat('Payment method', esc(racer.card), 'Default card');
  $('[data-slot="payments"]').innerHTML = table([{ h: 'Date' }, { h: 'Description' }, { h: 'Receipt' }, { h: 'Amount', num: true }, { h: 'Status' }],
    rows.map((r) => `<tr>${cell('Date', esc(fmtDate(r.date, { month: 'short', day: 'numeric', year: 'numeric' })))}${cell('Description', esc(r.desc))}${cell('Receipt', `<span class="lap-time">${r.ref}</span>`)}${cell('Amount', money(r.amount), true)}${cell('Status', statusChip(r.status))}</tr>`));
}

function renderProfile() {
  const initials = profile.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  $$('[data-slot="avatar"]').forEach((e) => { e.textContent = initials; });
  $('[data-slot="name"]').textContent = profile.name;
  $('[data-slot="meta"]').textContent = `Kart #${racer.kart} · Racer since ${fmtDate(racer.since, { month: 'short', year: 'numeric' })}`;
  $('[data-slot="first-name"]').textContent = profile.name.split(/\s+/)[0];
  const f = $('[data-profile-form]');
  f.name.value = profile.name; f.email.value = profile.email; f.phone.value = profile.phone; f.circuit.value = profile.circuit; f.reminders.checked = profile.reminders;
  $('[data-slot="racer-card"]').innerHTML = `<div class="rcard-top"><span class="avatar avatar-lg" aria-hidden="true">${initials}</span><div><p class="rcard-name">${esc(profile.name)}</p><p class="dmeta">Racer since ${esc(fmtDate(racer.since, { month: 'long', year: 'numeric' }))}</p></div></div>
    <dl class="rcard-list"><div><dt>Kart number</dt><dd>${racer.kart}</dd></div><div><dt>Preferred circuit</dt><dd>${esc(profile.circuit)}</dd></div><div><dt>Races completed</dt><dd>${sessions.length}</dd></div><div><dt>Payment method</dt><dd>${esc(racer.card)}</dd></div></dl>`;
}

/* ---------- charts (rendered when visible, re-rendered on resize) ---------- */
const sec = (v) => (v / 1000).toFixed(2);
function renderCharts() {
  $$('[data-chart]').forEach((el) => {
    if (!el.offsetParent) return;
    const id = el.dataset.chart;
    if (id === 'overview-trend' || id.startsWith('progress-')) {
      const c = id === 'overview-trend' ? 'indoor' : id.slice(9);
      const pts = sessions.filter((s) => s.circuit === c).map((s) => ({ x: shortDate(s.date), y: s.best, title: `${shortDate(s.date)} · ${formatName(s.format)} · ${fmtLap(s.best)}` }));
      lineChart(el, [{ label: 'Best lap', color: 'var(--display-accent)', points: pts }], { yFmt: (v) => fmtLap(Math.round(v)).replace(/^00:/, ''), label: `${circuitName(c)} best lap by session, from ${fmtLap(pts[0].y)} to ${fmtLap(pts[pts.length - 1].y)}` });
    } else if (id === 'positions') {
      const pts = sessions.filter((s) => s.pos).map((s) => ({ x: shortDate(s.date), y: s.pos, title: `${shortDate(s.date)} · P${s.pos} of ${s.of} · ${circuitName(s.circuit)}` }));
      lineChart(el, [{ label: 'Position', color: 'var(--display-accent)', points: pts }], { invert: true, min: 1, max: 8, tickValues: [1, 2, 3, 4, 5, 6, 7, 8], yFmt: (v) => `P${v}`, label: 'Finishing position by race' });
    } else if (id === 'final-laps') {
      const best = Math.min(...finalLaps.laps);
      barChart(el, finalLaps.laps.map((v, i) => ({ label: String(i + 1), value: v, hl: v === best, title: `Lap ${i + 1} · ${fmtLap(v)}` })), { min: 41700, max: 43300, yFmt: (v) => sec(v), label: 'Lap times of the latest final, fastest lap highlighted' });
    }
  });
}

/* ---------- actions ---------- */
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 500);
}
const csv = (rows) => rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
function ics(b) {
  const d = b.date.replace(/-/g, ''); const t = b.time.replace(':', '') + '00';
  const end = String(Number(b.time.slice(0, 2)) + 1).padStart(2, '0') + b.time.slice(3) + '00';
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Apexline Kart Circuit//Racer//EN', 'BEGIN:VEVENT', `UID:${b.ref}@apexlinekarting`, `DTSTAMP:${TODAY.replace(/-/g, '')}T000000Z`, `DTSTART:${d}T${t}`, `DTEND:${d}T${end}`,
    `SUMMARY:Apexline – ${formatName(b.format)} (${circuitName(b.circuit)})`, `LOCATION:${contact.address}`, `DESCRIPTION:Booking ref ${b.ref}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

let pendingCancel = null;
function bind() {
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, a'); if (!t) return;
    if (t.dataset.ics) { const b = bookings.find((x) => x.ref === t.dataset.ics); download(`apexline-${b.ref}.ics`, ics(b), 'text/calendar'); }
    if (t.dataset.cancel) {
      pendingCancel = bookings.find((x) => x.ref === t.dataset.cancel);
      $('[data-slot="cancel-text"]').textContent = `${formatName(pendingCancel.format)} on ${fmtDate(pendingCancel.date)} at ${pendingCancel.time} (${pendingCancel.ref}).`;
      $('#cancel-dialog').showModal();
    }
    if (t.dataset.histFilter) { histFilter = t.dataset.histFilter; $$('[data-hist-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === t))); renderHistory(); }
    if (t.dataset.export === 'laps') download('apexline-lap-times.csv', csv([['Date', 'Circuit', 'Format', 'Laps', 'Best lap'], ...sessions.map((s) => [s.date, circuitName(s.circuit), formatName(s.format), s.laps, fmtLap(s.best)])]), 'text/csv');
    if (t.dataset.export === 'payments') download('apexline-payments.csv', csv([['Date', 'Description', 'Receipt', 'Amount (USD)', 'Status'], ...payments().map((r) => [r.date, r.desc, r.ref, r.amount, r.status])]), 'text/csv');
  });
  $('#cancel-dialog').addEventListener('close', () => {
    if ($('#cancel-dialog').returnValue === 'cancel' && pendingCancel) { cancelled = [...cancelled, pendingCancel.ref]; store.set('apex:racer-cancelled', JSON.stringify(cancelled)); renderAll(); }
    pendingCancel = null;
    $('#cancel-dialog').returnValue = '';
  });
  /* tabs: charts inside a newly shown panel need a measured width */
  $$('[role="tab"]').forEach((t) => t.addEventListener('click', () => requestAnimationFrame(renderCharts)));
  $$('[role="tab"]').forEach((t) => t.addEventListener('keyup', () => requestAnimationFrame(renderCharts)));
  $('[data-profile-form]').addEventListener('form:valid', (e) => {
    const d = e.detail;
    profile = { name: String(d.get('name')).trim(), email: String(d.get('email')).trim(), phone: String(d.get('phone')).trim(), circuit: String(d.get('circuit')), reminders: d.get('reminders') === 'on' };
    store.set('apex:racer-profile', JSON.stringify(profile)); renderProfile();
    const s = $('[data-profile-status]'); s.hidden = false; s.textContent = 'Changes saved.'; s.focus();
  });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(renderCharts, 120); });
  document.addEventListener('dirchange', () => setTimeout(renderCharts, 50));
}

/* ---------- views ---------- */
const VIEWS = ['overview', 'bookings', 'laptimes', 'performance', 'leaderboard', 'payments', 'profile'];
function show(initial = false) {
  const name = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
  $$('[data-view]').forEach((v) => { v.hidden = v.dataset.view !== name; });
  $$('[data-view-link]').forEach((a) => { if (a.dataset.viewLink === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const label = $(`[data-view-link="${name}"] span`).textContent;
  document.title = `${label} · Racer Dashboard – Apexline Kart Circuit`;
  renderCharts();
  if (!initial) { const h = $(`[data-view="${name}"] h2`); h.tabIndex = -1; h.focus({ preventScroll: true }); $('.dash-main').scrollIntoView({ block: 'start' }); }
}

function renderAll() { renderProfile(); renderOverviewStats(); renderNext(); renderRecent(); renderBookings(); renderLapPanels(); renderPerformance(); renderBoards(); renderPayments(); renderCharts(); }

export function initDashboard() {
  renderAll(); bind();
  window.addEventListener('hashchange', () => show());
  show(true);
}
