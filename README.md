# nydaymuse-funnel

Static Nydaymuse site for freelance and everyday productivity tools: one homepage and 13 guides or product pages, with downloads and purchases on Gumroad.

No build step, npm install, or third-party runtime dependencies. Works directly from `file://` and on any static host, including GitHub Pages, Netlify, and Cloudflare Pages. Keep the `assets` folder alongside the HTML files. Gumroad downloads, checkout, directory links, and external badges require an internet connection.

The homepage includes category filters for free tools, an interactive hourly-rate × hours demo, a mobile navigation menu, and FAQs. The demo shows a base estimate; the downloadable Quote tool includes the full calculator and printable proposal. Guide pages share readable layouts, responsive tables, keyboard skip links, and print styles.

## Files

The site has 14 HTML pages:

- `index.html` — homepage, free tool filters, pricing demo, paid tools, and guide links.
- `freelance-proposal-ai-prompts.html` — proposal templates and AI prompts for Close.
- `client-onboarding-notion.html` — Notion client onboarding and Kickoff.
- `freelance-rate-calculator.html` — the free Quote calculator and proposal guide.
- `overdue-invoice-emails.html` — late-payment email templates and Nudge.
- `freelance-invoice-spreadsheet.html` — invoice tracking, aging, and Ops.
- `drift-scope-desk.html` — Drift scope-creep and change-order desk.
- `freelance-testimonial-request-desk.html` — Praise testimonial and review requests.
- `job-search-desk.html` — Hunt job applications and interview preparation.
- `photographer-shoot-desk.html` — Shot photography planning.
- `podcast-episode-desk.html` — Pod episode planning and publishing.
- `pregnancy-baby-notion-tracker.html` — Nest family tracking and offline logging.
- `youtube-ai-prompts.html` — Aim creator prompts.
- `youtube-shorts-desk.html` — Clip video planning and publishing.

Shared assets and support files:

- `assets/site.css` — homepage layout, visual system, and responsive styles.
- `assets/site.js` — mobile navigation, tool filters, and the live estimate demo.
- `assets/guides.css` — shared styles for the 13 guide and product pages.
- `assets/favicon.svg` — shared flower brand icon.
- `scripts/preview.mjs` — local preview server using only Node.js built-ins.
- `og-image.png` — 1200×630 social preview shared across the site.
- `robots.txt` and `sitemap.xml` — crawler access and the GitHub Pages URL list.
- `CHANGELOG.md` — change history.

## Product links

- Quote (free): https://nydaymuse.gumroad.com/l/qdccy
- Close $12: https://nydaymuse.gumroad.com/l/ptljg
- Kickoff $12: https://nydaymuse.gumroad.com/l/fuflsz
- Ops $12: https://nydaymuse.gumroad.com/l/ggnfxs
- Nudge (free): https://nydaymuse.gumroad.com/l/ebexb
- Slip (free): https://nydaymuse.gumroad.com/l/tubrnw
- Praise (free): https://nydaymuse.gumroad.com/l/praisedesk
- Drift (free): https://nydaymuse.gumroad.com/l/driftdesk
- LaunchFree: https://launchfree.io/listings/ops-freelance-money-and-client-workbook.html
- Spotlitely: https://www.spotlitely.com/l/ops-freelance-money-client-workbook

## Local preview

Open any HTML file in a browser, or run the included preview server with Node.js from the repository root:

```bash
node scripts/preview.mjs
```

Visit **http://127.0.0.1:4173/**. Stop the server with `Ctrl+C`. The server binds to your local machine; the optional `PORT` environment variable changes its port. No package installation is needed.

## Deploy to GitHub Pages

Assumes repo `nydaym/nydaymuse-funnel` (or rename; update site URLs as described below if different).

### 1. Create repo and push

For a new repository:

```bash
cd nydaymuse-funnel
git init
git add .
git commit -m "Initial static SEO funnel for Nydaymuse"
gh repo create nydaym/nydaymuse-funnel --public --source=. --remote=origin --push
```

Or without `gh`:

```bash
git remote add origin https://github.com/nydaym/nydaymuse-funnel.git
git branch -M main
git push -u origin main
```

### 2. Enable Pages

1. GitHub → repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / folder: `/ (root)`
4. Save — site will be at:

   `https://nydaym.github.io/nydaymuse-funnel/`

### 3. After URL is live

If the username/repo differs from `nydaym/nydaymuse-funnel`, replace that host path in:

- `robots.txt` (`Sitemap:`)
- `sitemap.xml` (`<loc>` values)
- each page’s `<link rel="canonical">`
- each page’s absolute Open Graph URLs, including `og:image` and `og:url`
- absolute homepage links in product pages

Submit `sitemap.xml` in Google Search Console / Bing Webmaster when ready.

## Other static hosts

- **Netlify / Cloudflare Pages**: drag the folder or connect the same repo; publish directory = repo root.
- **Custom domain**: point DNS, then update canonical, sitemap, robots, social metadata, and absolute homepage links to the new origin.

## Brand

- Warm paper `#F7F7F2`
- Navy `#17243B`
- Pale sage `#E9EEE6`
- Coral accents; primary buttons and links use `#C53E35` for contrast.
- Muted text `#626B75`

System fonts and local CSS keep the design independent of font services. Layouts support mobile screens, visible keyboard focus, and reduced-motion preferences.

No fake testimonials or review counts.
