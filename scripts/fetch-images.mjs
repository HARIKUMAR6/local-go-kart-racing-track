/* Image sourcing + licence verification for Wikimedia Commons files.
   Usage: node scripts/fetch-images.mjs            (verify + download everything in data/image-inventory.json)
          node scripts/fetch-images.mjs --verify   (verify only, no downloads)
          node scripts/fetch-images.mjs --pending  (only entries not yet verified or rejected – used when new images are added)

   For every inventory entry with a `commonsTitle` this script:
     1. queries the Commons API for the file's licence record (extmetadata),
     2. fetches the public file description page and confirms the licence text/URL is really on it,
     3. accepts ONLY CC0 / public-domain files with no usage restrictions (no attribution needed, so no public credits),
     4. downloads 480 / 960 / 1920px-wide JPEG renditions into assets/images/<category>/,
     5. writes the evidence back into the inventory. Anything failing a check stays status "rejected". */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const invPath = join(root, 'data/image-inventory.json');
const verifyOnly = process.argv.includes('--verify');
const pendingOnly = process.argv.includes('--pending'); // skip entries that are already verified
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = { 'User-Agent': 'ApexlineSiteBuild/1.0 (image licence audit)' };
const WIDTHS = [480, 960, 1920];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();

async function get(url, as = 'json') {
  for (let i = 0; i < 6; i++) {
    await sleep(1200 + i * 3000);
    const r = await fetch(url, { headers: UA });
    if (r.ok) return as === 'json' ? r.json().catch(() => null) : as === 'buffer' ? Buffer.from(await r.arrayBuffer()) : r.text();
  }
  throw new Error(`Failed: ${url}`);
}

async function verify(title) {
  const d = await get(`${API}?action=query&format=json&prop=imageinfo&iiprop=url|size|mime|extmetadata&titles=${encodeURIComponent(title)}`);
  const ii = Object.values(d.query.pages)[0].imageinfo?.[0];
  if (!ii) return { ok: false, reasons: ['file not found'] };
  const m = ii.extmetadata || {};
  const licence = strip(m.LicenseShortName?.value);
  const reasons = [];
  if (!/^(CC0|Public domain|PD|CC Zero)/i.test(licence)) reasons.push(`licence "${licence}" is not CC0/public domain`);
  if (!/jpeg/.test(ii.mime)) reasons.push(`mime ${ii.mime}`);
  if (m.Restrictions?.value) reasons.push(`restrictions: ${m.Restrictions.value}`);
  if (/true/i.test(m.NonFree?.value || '')) reasons.push('non-free');
  if (/true/i.test(m.AttributionRequired?.value || '')) reasons.push('attribution required');

  const pageUrl = ii.descriptionurl;
  const html = await get(pageUrl, 'text');
  const licenceUrl = strip(m.LicenseUrl?.value) || null;
  const pageMentions = /Creative Commons CC0|CC0 1\.0|public domain|Public Domain/i.test(html);
  if (!pageMentions) reasons.push('licence text not found on file page');
  if (/watermark/i.test(strip(m.ImageDescription?.value))) reasons.push('description mentions watermark');

  return {
    ok: reasons.length === 0, reasons,
    sourceUrl: pageUrl, originalUrl: ii.url, width: ii.width, height: ii.height,
    creator: strip(m.Artist?.value).slice(0, 120) || 'Unknown / not stated',
    licence, licenceUrl: licenceUrl || (/CC0/i.test(licence) ? 'https://creativecommons.org/publicdomain/zero/1.0/' : pageUrl),
  };
}

const inv = JSON.parse(await readFile(invPath, 'utf8'));
let good = 0; let bad = 0;
for (const img of inv.images) {
  if (!img.commonsTitle) continue;
  if (pendingOnly && ['verified', 'rejected'].includes(img.status)) continue;
  process.stdout.write(`${img.id.padEnd(22)} `);
  try {
    const v = await verify(img.commonsTitle);
    Object.assign(img, {
      source: 'Wikimedia Commons', sourceUrl: v.sourceUrl, creator: v.creator, licence: v.licence, licenceUrl: v.licenceUrl,
      originalSize: v.width ? `${v.width}x${v.height}` : null,
      commercialUseVerified: v.ok, attributionRequired: false, licenceCheckedAt: new Date().toISOString().slice(0, 10),
      verificationNotes: v.ok ? 'Licence record read from Commons API and confirmed on the file description page.' : v.reasons.join('; '),
    });
    if (!v.ok) { img.status = 'rejected'; bad++; console.log('REJECTED', v.reasons.join('; ')); continue; }
    if (!verifyOnly) {
      const dir = join(root, 'assets/images', img.category);
      await mkdir(dir, { recursive: true });
      img.files = {};
      for (const w of WIDTHS) {
        if (w > v.width) continue;
        const file = `${img.id}-${w}.jpg`;
        const buf = await get(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(img.commonsTitle.replace(/^File:/, ''))}?width=${w}`, 'buffer');
        await writeFile(join(dir, file), buf);
        img.files[w] = `/assets/images/${img.category}/${file}`;
      }
      img.localPath = img.files[1920] || img.files[960];
    }
    img.status = 'verified'; good++; console.log('verified', v.licence);
  } catch (e) { img.status = 'unverified'; bad++; console.log('ERROR', e.message); }
  await writeFile(invPath, JSON.stringify(inv, null, 2));
}
await writeFile(invPath, JSON.stringify(inv, null, 2));
console.log(`\n${good} verified, ${bad} not verified`);
