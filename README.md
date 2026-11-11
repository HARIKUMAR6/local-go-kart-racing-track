# Apexline Kart Circuit

Static site: HTML5 + Tailwind CSS v4 (CLI) + vanilla JS modules.

    npm install
    npm run dev      # watch CSS -> dist/styles.css
    npm run build    # minified production CSS (Vercel runs this)
    npm run serve    # local server with clean URLs, http://localhost:4173
    npm run check    # WCAG AA check of all colour tokens

Pages use root-absolute URLs (/dist/styles.css, /js/main.js), so serve from the project root.
Design reference: /styleguide. Image register: data/image-inventory.json.

Pages are authored in src/pages/*.html and generated to the project root by 'npm run build' (scripts/build-pages.mjs expands image tokens from data/image-inventory.json and fails on unverified or repeated images).
All public routes are built (/, /home-2, /about, /races-pricing, /safety, /contact, /login, /dashboard); /pit-stop remains as a holding page for future routes. Re-run 'npm run images' to re-verify and re-download photographs.

## Theme system (Light / Dark)

One system, three layers – all in `src/css/tokens.css`:

1. **Semantic tokens** per theme (`:root` = light, `[data-theme="dark"]`): `--bg`, `--bg-alt`, `--bg-raised`, `--surface`, `--heading`, `--text`, `--text-muted`, `--text-accent`, `--highlight`, `--display-accent`, `--border`, `--border-strong`, `--inverse-*`, `--input-*`, `--nav-*`, `--footer-bg`, `--menu-bg`, shadows, checker colours.
2. **Section tones** (theme-aware – they follow the active theme): `tone-base`, `tone-alt`, `tone-raised`, `tone-accent`. Light rhythm: paper → ivory → white → flame band. Dark: asphalt → #11151c → garage → deep-flame band.
3. **Photo context** (fixed light-on-dark, because overlays must stay readable in both themes): `.on-photo` and the hero / CTA / photographic-pane components.

Rules: components read tokens only (no raw hex); a section's tone changes tokens, never individual components; anything on a photograph uses the photo context. `theme-init.js` sets `data-theme` before first paint (saved choice → OS preference → light); `js/modules/theme.js` toggles, persists an explicit choice, ignores OS changes once a choice exists, syncs other tabs and updates `theme-color`.

Verification: `npm run check` (token pairs, every theme × tone) and `npm run audit:contrast` (rendered pixels; needs `npm i --no-save puppeteer-core`, see the script header).

Inner pages (About, Races & Pricing, Safety, Contact) live in src/pages and use src/css/inner.css. Business data (address, hours, phone, email, prices, map coordinates) comes from js/data/site.js via build tokens ({{site:…}}, {{price:key}}, {{map:embed}}). The contact form hands off to the visitor's email app (mailto:); social icons stay non-navigational until verified profile URLs are set in site.js. After adding images to data/image-inventory.json run 'node scripts/fetch-images.mjs --pending'.
