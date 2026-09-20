'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'catalog.js'), 'utf8');

class Element {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.className = '';
    this.value = '';
    this.hidden = false;
    this.disabled = false;
    this._text = '';
  }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.replaceChildren(); }
  setAttribute(name, value) { this.attributes[name] = value; }
  appendChild(child) { child.parent = this; this.children.push(child); return child; }
  replaceChildren() { this.children.forEach(child => { child.parent = null; }); this.children = []; }
  replaceWith(replacement) {
    const parent = this.parent;
    parent.children[parent.children.indexOf(this)] = replacement;
    replacement.parent = parent;
    this.parent = null;
  }
  addEventListener(event, listener) { (this.listeners[event] ||= []).push(listener); }
  async fire(event) { await Promise.all((this.listeners[event] || []).map(listener => listener({ target: this }))); }
  querySelectorAll(selector) {
    const found = [];
    const matches = node => {
      if (selector === '[data-filter]') return 'filter' in node.dataset;
      if (selector === '.product-card[data-permalink]') return node.className.split(' ').includes('product-card') && 'permalink' in node.dataset;
      if (selector === '[data-gumroad-product][data-gumroad-field="price"]') return 'gumroadProduct' in node.dataset && node.dataset.gumroadField === 'price';
      throw new Error('Unexpected selector: ' + selector);
    };
    const walk = node => node.children.forEach(child => { if (matches(child)) found.push(child); walk(child); });
    walk(this);
    return found;
  }
}

function setup({ initial, priceData, request } = {}) {
  const root = new Element();
  const ids = new Map();
  function add(id, tag) { const node = root.appendChild(new Element(tag)); ids.set(id, node); return node; }
  const grid = add('catalog-grid');
  const fallback = grid.appendChild(new Element('a'));
  fallback.className = 'product-card';
  fallback.dataset = { permalink: 'qdccy', category: 'freelance' };
  fallback.textContent = 'Quote fallback';
  const fallbackPrice = fallback.appendChild(new Element('span'));
  fallbackPrice.dataset = { gumroadProduct: 'qdccy', gumroadField: 'price' };
  fallbackPrice.textContent = 'View price';
  const search = add('catalog-search', 'input');
  const count = add('catalog-count');
  const empty = add('catalog-empty');
  const more = add('catalog-load-more', 'button');
  const filters = {};
  ['all', 'freelance', 'creator', 'life', 'more'].forEach(category => {
    filters[category] = root.appendChild(new Element('button'));
    filters[category].dataset.filter = category;
  });
  if (initial !== undefined) add('gumroad-data', 'script').textContent = typeof initial === 'string' ? initial : JSON.stringify(initial);
  if (priceData !== undefined) add('gumroad-prices', 'script').textContent = JSON.stringify(priceData);
  const document = {
    getElementById: id => ids.get(id) || null,
    createElement: tag => new Element(tag),
    querySelectorAll: selector => root.querySelectorAll(selector)
  };
  const window = { setTimeout, clearTimeout };
  if (request) window.gumroadProducts = { request };
  vm.runInNewContext(source, { document, window, URL });
  return { grid, fallback, fallbackPrice, search, count, empty, more, filters, window, root };
}

const product = (slug, name, extra = {}) => ({ name, url: 'https://nydaymuse.gumroad.com/l/' + slug, description: 'A useful tool.', ...extra });

test('missing or malformed live data retains searchable fallback without invented prices', async () => {
  for (const initial of [undefined, '{bad json']) {
    const page = setup({ initial });
    assert.equal(page.grid.children[0], page.fallback);
    assert.equal(page.fallbackPrice.textContent, 'View price');
    assert.equal(page.more.hidden, true);
    assert.equal(page.filters.more.hidden, true);
    page.search.value = 'missing';
    await page.search.fire('input');
    assert.equal(page.fallback.hidden, true);
    assert.equal(page.empty.hidden, false);
    assert.match(page.count.textContent, /0 tools found/);
  }
});

test('live data replaces fallback, preserves unknown tools, and uses current price map safely', () => {
  const page = setup({
    initial: { products: [
      product('qdccy', 'Quote — updated title', { price: '$99 cached', description: '<img src=x onerror=alert(1)>' }),
      product('newdesk', 'New desk'),
      product('unsafe', 'Unsafe URL', { url: 'javascript:alert(1)' })
    ], products_total: 3 },
    priceData: { qdccy: { price: '€8.00', price_cents: 800 } }
  });
  assert.equal(page.grid.children.length, 2);
  assert.notEqual(page.grid.children[0], page.fallback);
  assert.match(page.grid.children[0].textContent, /Quote — updated title/);
  assert.match(page.grid.children[0].textContent, /<img src=x onerror=alert\(1\)>/);
  assert.match(page.grid.children[0].textContent, /€8\.00/);
  assert.doesNotMatch(page.grid.children[0].textContent, /99 cached/);
  assert.match(page.grid.children[1].textContent, /View price/);
  assert.equal(page.grid.children[1].dataset.category, 'more');
  assert.equal(page.filters.more.hidden, false);
  for (const card of page.grid.children) {
    assert.equal(card.target, '_blank');
    assert.equal(card.rel, 'noopener noreferrer');
  }
});

test('an explicitly empty live catalog clears stale fallback products', () => {
  const page = setup({ initial: { products: [], products_total: 0 } });
  assert.equal(page.grid.children.length, 0);
  assert.equal(page.empty.hidden, false);
  assert.equal(page.more.hidden, true);
});

test('pagination prevents concurrent requests, retains search/filter, deduplicates, and applies new prices', async () => {
  const calls = [];
  let resolveRequest;
  const page = setup({
    initial: { products: [product('qdccy', 'Quote')], products_total: 4 },
    request: options => {
      calls.push(JSON.parse(JSON.stringify(options)));
      return new Promise(resolve => { resolveRequest = resolve; });
    }
  });
  await page.filters.creator.fire('click');
  page.search.value = 'POD';
  await page.search.fire('input');
  const first = page.more.fire('click');
  assert.equal(page.more.disabled, true);
  await page.more.fire('click');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { offset: 1, limit: 100 });
  resolveRequest({ success: true, products: [product('qdccy', 'Quote updated'), product('poddesk', 'Pod')], productsTotal: 4, prices: { poddesk: { price: '$0+' } } });
  await first;
  assert.equal(page.grid.children.length, 2);
  assert.equal(page.grid.children[0].hidden, true);
  assert.equal(page.grid.children[1].hidden, false);
  assert.match(page.grid.children[1].textContent, /\$0\+/);
  assert.match(page.count.textContent, /1 tool found/);
  assert.equal(page.filters.creator.attributes['aria-pressed'], 'true');
  assert.equal(page.more.disabled, false);
  const second = page.more.fire('click');
  assert.deepEqual(calls[1], { offset: 3, limit: 100 });
  resolveRequest({ success: true, products: [product('brandnew', 'New release')], productsTotal: 4, prices: {} });
  await second;
  assert.equal(page.grid.children.length, 3);
  assert.equal(page.grid.children[2].hidden, true);
  assert.equal(page.more.hidden, true);
  assert.equal(page.filters.more.hidden, false);
});

test('failed pagination is announced and can retry the same offset', async () => {
  const calls = [];
  const page = setup({
    initial: { products: [product('qdccy', 'Quote')], products_total: 2 },
    request: async options => {
      calls.push(options.offset);
      return calls.length === 1 ? { success: false } : { success: true, products: [product('poddesk', 'Pod')], productsTotal: 2 };
    }
  });
  await page.more.fire('click');
  assert.match(page.count.textContent, /could not load/);
  assert.equal(page.more.disabled, false);
  assert.equal(page.more.hidden, false);
  assert.equal(page.more.textContent, 'Try loading more');
  await page.more.fire('click');
  assert.deepEqual(calls, [1, 1]);
  assert.doesNotMatch(page.count.textContent, /could not load/);
  assert.equal(page.more.hidden, true);
});

test('missing hosted pagination bridge leaves an actionable retry state', async () => {
  const page = setup({ initial: { products: [product('qdccy', 'Quote')], products_total: 2 } });
  await page.more.fire('click');
  assert.match(page.count.textContent, /could not load/);
  assert.equal(page.more.hidden, false);
  assert.equal(page.more.disabled, false);
});
