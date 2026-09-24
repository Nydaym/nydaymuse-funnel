// Keep search metadata in the static HTML; crawlers need no JavaScript runtime.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://nydaym.github.io/nydaymuse-funnel/';
const check = process.argv.includes('--check');
const productSlugs = {
  'freelance-rate-calculator.html': 'qdccy',
  'freelance-proposal-ai-prompts.html': 'ptljg',
  'client-onboarding-notion.html': 'fuflsz',
  'overdue-invoice-emails.html': 'ebexb',
  'freelance-invoice-spreadsheet.html': 'ggnfxs',
  'drift-scope-desk.html': 'driftdesk',
  'freelance-testimonial-request-desk.html': 'praisedesk',
  'job-search-desk.html': 'huntdesk',
  'photographer-shoot-desk.html': 'shotdesk',
  'podcast-episode-desk.html': 'poddesk',
  'pregnancy-baby-notion-tracker.html': 'nestdesk',
  'youtube-ai-prompts.html': 'aimprompts',
  'youtube-shorts-desk.html': 'clipdesk',
  'change-order-desk.html': 'changedesk',
  'freelancer-client-pipeline.html': 'lanepack',
  'follow-up-cadence-desk.html': 'beaconpack',
  'project-profitability-pack.html': 'marginpack',
  'retainer-os.html': 'harborpack',
  'proposal-tracker-pack.html': 'quillpack',
  'scope-change-log.html': 'cleatpack',
  'tax-set-aside-pack.html': 'ledgerettepack',
  'handoff-offboarding-pack.html': 'relaypack',
  'asset-login-register.html': 'vaultpack',
  'lead-source-roi-pack.html': 'compasspack',
  'deposit-milestone-schedule.html': 'pierpack',
  'revision-round-tracker.html': 'roundpack',
  'receipts-balance-pack.html': 'tillpack',
  'contract-status-desk.html': 'sealpack',
  'client-blockers-desk.html': 'holdpack',
  'discovery-call-intake.html': 'helmpack',
  'referral-ask-tracker.html': 'buoypack',
  'installment-schedule-log.html': 'tallypack',
  'weekly-client-status-digest.html': 'pulsepack',
};
const catalog = JSON.parse(await readFile(resolve(root, 'gumroad/catalog-snapshot.json'), 'utf8')).products;
function plain(value) {
  return value.replace(/<[^>]*>/g, '').replace(/&(?:amp|quot|apos|lt|gt|nbsp|#39|#x27);/g, entity => ({
    '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&#39;': "'", '&#x27;': "'",
  })[entity]).replace(/\s+/g, ' ').trim();
}
const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function meta(html, name, value, property = false) {
  const attribute = property ? 'property' : 'name';
  const line = `  <meta ${attribute}="${name}" content="${escape(value)}">`;
  const pattern = new RegExp(`^[ \\t]*<meta ${attribute}="${name.replaceAll('.', '\\.')}"[^>]*>`, 'm');
  return pattern.test(html) ? html.replace(pattern, () => line) : html.replace('</head>', () => `${line}\n</head>`);
}
const files = (await readdir(root)).filter(name => name.endsWith('.html')).sort();
const pages = await Promise.all(files.map(async file => {
  const html = (await readFile(resolve(root, file), 'utf8')).replace(/\r\n/g, '\n');
  const url = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (url !== new URL(file === 'index.html' ? '' : file, base).href) throw new Error(`${file}: unexpected canonical`);
  const title = plain(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
  const description = plain(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '');
  const heading = plain(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || '');
  const date = html.match(/<time datetime="(\d{4}-\d{2}-\d{2})"/)?.[1];
  if (!title || !description || !heading || !date) throw new Error(`${file}: missing title, description, H1 or visible update date`);
  return { file, html, url, title, description, heading, date };
}));
const organization = {
  '@type': 'Organization', '@id': `${base}#organization`, name: 'Nydaymuse', url: base,
  logo: `${base}assets/favicon.svg`, sameAs: ['https://nydaymuse.gumroad.com'],
};
const website = {
  '@type': 'WebSite', '@id': `${base}#website`, url: base, name: 'Nydaymuse', inLanguage: 'en',
  publisher: { '@id': organization['@id'] },
};
const outputs = [];
for (const page of pages) {
  let html = page.html;
  const home = page.file === 'index.html';
  const about = page.file === 'about.html';
  const faq = [];
  // Only mark up actual visible FAQs, never other <details> such as the directory.
  const faqSection = html.match(/<section\b[^>]*\bid="faq"[^>]*>([\s\S]*?)<\/section>/)?.[1] || '';
  for (const match of faqSection.matchAll(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)) {
    faq.push({ '@type': 'Question', name: plain(match[1]), acceptedAnswer: { '@type': 'Answer', text: plain(match[2]) } });
  }
  const webPage = {
    '@type': [about ? 'AboutPage' : home ? 'CollectionPage' : 'WebPage', ...(faq.length ? ['FAQPage'] : [])],
    '@id': `${page.url}#webpage`, url: page.url, name: page.title, description: page.description,
    inLanguage: 'en', isPartOf: { '@id': website['@id'] }, publisher: { '@id': organization['@id'] },
    dateModified: page.date, ...(faq.length ? { mainEntity: faq } : {}),
  };
  const graph = [organization, website, webPage];
  if (!home) {
    webPage.breadcrumb = { '@id': `${page.url}#breadcrumb` };
    graph.push({ '@type': 'BreadcrumbList', '@id': `${page.url}#breadcrumb`, itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Nydaymuse', item: base },
      { '@type': 'ListItem', position: 2, name: page.heading, item: page.url },
    ] });
  }
  if (about) webPage.about = { '@id': organization['@id'] };
  const slug = productSlugs[page.file];
  if (slug) {
    const product = catalog.find(item => item.url.endsWith(`/l/${slug}`));
    if (!product || !html.includes(product.url)) throw new Error(`${page.file}: product missing from visible page/catalog`);
    const productId = `${product.url}#product`;
    graph.push({ '@type': 'Product', '@id': productId, name: product.name, url: product.url,
      brand: { '@type': 'Brand', name: 'Nydaymuse' }, manufacturer: { '@id': organization['@id'] } });
    webPage.about = { '@id': productId };
    if (html.includes('class="guide-page"')) graph.push({
      '@type': 'Article', '@id': `${page.url}#article`, headline: page.heading, description: page.description,
      mainEntityOfPage: { '@id': webPage['@id'] }, author: { '@id': organization['@id'] },
      publisher: { '@id': organization['@id'] }, dateModified: page.date, inLanguage: 'en', about: { '@id': productId },
    });
  }
  if (home) {
    graph.push({ '@type': 'ItemList', '@id': `${base}#guides`, name: 'Nydaymuse guides and tools',
      itemListElement: pages.filter(item => productSlugs[item.file]).map((item, i) => ({
        '@type': 'ListItem', position: i + 1, name: item.heading, url: item.url,
      })),
    });
  }
  const block = `  <script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c')}\n  </script>`;
  html = html.replace(/^[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/gm, '');
  html = meta(html, 'robots', 'index, follow, max-image-preview:large');
  html = meta(html, 'og:url', page.url, true);
  html = meta(html, 'og:site_name', 'Nydaymuse', true);
  html = meta(html, 'og:title', page.title, true);
  html = meta(html, 'og:description', page.description, true);
  html = meta(html, 'og:type', slug && html.includes('class="guide-page"') ? 'article' : 'website', true);
  html = meta(html, 'og:image', `${base}og-image.png`, true);
  html = meta(html, 'og:image:width', '1200', true);
  html = meta(html, 'og:image:height', '630', true);
  html = meta(html, 'og:image:alt', 'Nydaymuse — practical tools for independent work', true);
  html = meta(html, 'twitter:card', 'summary_large_image');
  html = meta(html, 'twitter:title', page.title);
  html = meta(html, 'twitter:description', page.description);
  html = meta(html, 'twitter:image', `${base}og-image.png`);
  html = html.replace('</head>', () => `${block}\n</head>`);
  outputs.push([page.file, html]);
}
outputs.push(['sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url>\n    <loc>${page.url}</loc>\n    <lastmod>${page.date}</lastmod>\n  </url>`).join('\n')}\n</urlset>\n`]);
let stale = 0;
for (const [file, result] of outputs) {
  const existing = (await readFile(resolve(root, file), 'utf8')).replace(/\r\n/g, '\n');
  if (existing === result) continue;
  if (check) { console.error(`Outdated search metadata: ${file}`); stale++; }
  else await writeFile(resolve(root, file), result);
}
if (stale) process.exitCode = 1;
else console.log(`${check ? 'Checked' : 'Synced'} search metadata for ${pages.length} canonical pages and sitemap.xml.`);
