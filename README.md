# nydaymuse-funnel

Static SEO funnel for Nydaymuse freelancers tools: landing + two guides → Gumroad (Nudge / Slip / Ops).

No build step. Works as `file://` and on any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.). No KYC.

## Files

| File | Purpose |
|------|---------|
| `index.html` | English landing — problem → free Nudge + Slip → Ops $12 |
| `overdue-invoice-emails.html` | SEO: late payment email templates freelance |
| `freelance-invoice-spreadsheet.html` | SEO: invoice tracker / aging spreadsheet → Ops |
| `robots.txt` | Allow crawl + sitemap pointer |
| `sitemap.xml` | URLs for GitHub Pages base |
| `README.md` | This file |

## Product links

- Ops $12: https://nydaymuse.gumroad.com/l/ggnfxs
- Nudge (free): https://nydaymuse.gumroad.com/l/ebexb
- Slip (free): https://nydaymuse.gumroad.com/l/tubrnw
- LaunchFree: https://launchfree.io/listings/ops-freelance-money-and-client-workbook.html
- Spotlitely: https://www.spotlitely.com/l/ops-freelance-money-client-workbook

## Local preview

Open any HTML file in a browser, or:

```bash
cd nydaymuse-funnel
python3 -m http.server 8080
# then visit http://localhost:8080/
```

## Deploy to GitHub Pages

Assumes repo `nydaym/nydaymuse-funnel` (or rename; update `canonical` / `sitemap` / `robots` host if different).

### 1. Create repo and push

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

Submit `sitemap.xml` in Google Search Console / Bing Webmaster when ready.

## Other static hosts

- **Netlify / Cloudflare Pages**: drag the folder or connect the same repo; publish directory = repo root.
- **Custom domain**: point DNS, then update canonical + sitemap + robots to the new origin.

## Brand

- Navy `#0F172A`
- Red `#E11D48`

No fake testimonials or review counts.
