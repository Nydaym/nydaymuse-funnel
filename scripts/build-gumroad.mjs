import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(resolve(root, file), 'utf8');
const [template, css, theme, catalog, metadataSource, snapshotSource] = await Promise.all([
  read('gumroad/profile.template.html'), read('gumroad/profile.css'), read('gumroad/theme.js'),
  read('gumroad/catalog.js'), read('gumroad/catalog-meta.json'), read('gumroad/catalog-snapshot.json'),
]);
const metadata = JSON.parse(metadataSource);
const snapshot = JSON.parse(snapshotSource);
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const labels = { freelance: 'Freelance', creator: 'Creators', life: 'Everyday', more: 'More tools' };
const seen = new Set();
const cards = snapshot.products.map(product => {
  const url = new URL(product.url);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid product URL');
  const match = url.pathname.match(/\/l\/([^/]+)\/?$/);
  if (!match) throw new Error('Product URL must link to a product page');
  const slug = decodeURIComponent(match[1]);
  if (seen.has(slug)) throw new Error(`Duplicate product: ${slug}`);
  seen.add(slug);
  const [name, category, format, art, description] = metadata[slug] || [product.name, 'more', 'From the studio', 'art-lilac'];
  return `<a class="product-card" data-permalink="${escape(slug)}" data-category="${category}" href="${escape(url.href)}" target="_blank" rel="noopener noreferrer">
  <div class="product-art ${art}" aria-hidden="true"><span class="art-kicker">${labels[category]}</span><span class="art-monogram">${escape(name)}</span><span class="art-detail">${escape(format)}</span></div>
  <div class="product-body"><div class="product-meta"><span class="product-kind">${labels[category]}</span><span class="product-price" data-gumroad-product="${escape(slug)}" data-gumroad-field="price">View price</span></div><h3>${escape(product.name)}</h3><p class="product-description">${escape(description || product.description || 'Explore this tool and see what is included.')}</p><span class="product-link">Explore ${escape(name)} ↗</span></div>
</a>`;
}).join('\n');
const flower = '<svg class="flower" viewBox="0 0 40 40" aria-hidden="true"><g fill="currentColor"><ellipse cx="20" cy="10" rx="5" ry="10"/><ellipse cx="20" cy="30" rx="5" ry="10"/><ellipse cx="10" cy="20" rx="10" ry="5"/><ellipse cx="30" cy="20" rx="10" ry="5"/><ellipse cx="20" cy="10" rx="5" ry="10" transform="rotate(45 20 20)"/><ellipse cx="20" cy="30" rx="5" ry="10" transform="rotate(45 20 20)"/><ellipse cx="10" cy="20" rx="10" ry="5" transform="rotate(45 20 20)"/><ellipse cx="30" cy="20" rx="10" ry="5" transform="rotate(45 20 20)"/></g><circle cx="20" cy="20" r="4" style="fill:var(--paper)"/></svg>';
const replacements = {
  '/* INLINE:PROFILE_CSS */': css,
  '/* INLINE:THEME_JS */': theme,
  '/* INLINE:CATALOG_JS */': catalog,
  '/* INLINE:CATALOG_META */': json(metadata),
  '<!-- INLINE:CATALOG -->': cards,
  '<!-- INLINE:CATALOG_COUNT -->': `${snapshot.products.length} tools to explore`,
  '<!-- INLINE:FLOWER -->': flower,
};
let output = template;
for (const [marker, content] of Object.entries(replacements)) output = output.split(marker).join(content);
if (output.includes('INLINE:')) throw new Error('Unresolved template marker');
if (/data-gumroad-action\s*=|data-gumroad-checkout|gumroad\.js|gumroad-embed/.test(output)) throw new Error('Profile pages must not embed checkout');
await writeFile(resolve(root, 'gumroad/profile.html'), output, 'utf8');
console.log(`Built gumroad/profile.html (${Buffer.byteLength(output)} bytes; ${snapshot.products.length} product fallbacks).`);
