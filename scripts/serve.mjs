/* Zero-dependency static server that mimics Vercel cleanUrls. Usage: npm run serve [port] */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.argv[2]) || 4173;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
};

// Routes built in a later phase fall back to the pit-stop page (mirrors vercel.json rewrites)
const PENDING = new Set([]);

async function resolve(urlPath) {
  if (PENDING.has(urlPath)) urlPath = '/pit-stop';
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '');
  const base = join(root, clean);
  if (!base.startsWith(root)) return null;
  for (const c of [base, `${base}.html`, join(base, 'index.html')]) {
    try { if ((await stat(c)).isFile()) return c; } catch { /* next */ }
  }
  return null;
}

createServer(async (req, res) => {
  const file = await resolve(new URL(req.url, 'http://x').pathname);
  if (!file || /node_modules|[/\\]\.|[/\\](scripts|src)[/\\]/.test(file.slice(root.length - 1))) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(await readFile(file));
}).listen(port, () => console.log(`Serving on http://localhost:${port}`));
