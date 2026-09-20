(function () {
  'use strict';

  var grid = document.getElementById('catalog-grid');
  if (!grid) return;

  var search = document.getElementById('catalog-search');
  var count = document.getElementById('catalog-count');
  var empty = document.getElementById('catalog-empty');
  var moreButton = document.getElementById('catalog-load-more');
  var filters = Array.from(document.querySelectorAll('[data-filter]'));
  var activeFilter = 'all';
  var visibleLimit = 12;
  var matchingCount = 0;
  var busy = false;
  var notice = '';
  var nextOffset = 0;
  var total = 0;
  var prices = new Map();
  var cards = new Map();
  var categories = {
    freelance: { label: 'Freelance', art: 'art-sage' },
    creator: { label: 'Creators', art: 'art-peach' },
    life: { label: 'Everyday', art: 'art-blue' },
    more: { label: 'More tools', art: 'art-lilac' }
  };
  var known = readJSON('nydaymuse-catalog-meta') || {};
  var entityParser = typeof DOMParser === 'function' ? new DOMParser() : null;
  var commonEntities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', bull: '•', middot: '·', copy: '©', reg: '®', trade: '™', times: '×', divide: '÷', euro: '€', pound: '£', yen: '¥', cent: '¢' };

  function decodeText(value) {
    return String(value).replace(/&(#(?:x[0-9a-f]{1,6}|[0-9]{1,7})|[a-z][a-z0-9]{1,31});/gi, function (entity, name) {
      // Only a single entity token is parsed; raw product markup never enters an HTML parser.
      if (entityParser) return entityParser.parseFromString(entity, 'text/html').body.textContent;
      if (name[0] !== '#') return commonEntities[name.toLowerCase()] || entity;
      var hex = name[1].toLowerCase() === 'x';
      var code = parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '\ufffd';
    });
  }

  function readJSON(id) {
    var node = document.getElementById(id);
    if (!node) return null;
    try { return JSON.parse(node.textContent); } catch (_) { return null; }
  }

  function textElement(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text;
    return node;
  }

  function validTotal(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function mergePrices(incoming) {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return;
    Object.keys(incoming).forEach(function (permalink) {
      var value = incoming[permalink];
      if (value && typeof value.price === 'string' && value.price.trim()) {
        prices.set(permalink, value.price);
      }
    });
  }

  function applyPrices() {
    document.querySelectorAll('[data-gumroad-product][data-gumroad-field="price"]').forEach(function (node) {
      var value = prices.get(node.dataset.gumroadProduct);
      if (value) node.textContent = value;
    });
  }

  function productDetails(product) {
    if (!product || typeof product.name !== 'string' || !product.name.trim() || typeof product.url !== 'string') return null;
    try {
      var url = new URL(product.url);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
      var match = url.pathname.match(/\/l\/([^/]+)\/?$/);
      if (!match) return null;
      var permalink = decodeURIComponent(match[1]);
      if (!permalink || /[\s/\\]/.test(permalink)) return null;
      return { product: product, url: url.href, permalink: permalink };
    } catch (_) { return null; }
  }

  function renderProduct(details) {
    var product = details.product;
    var metadata = Object.prototype.hasOwnProperty.call(known, details.permalink) ? known[details.permalink] : null;
    var category = metadata ? metadata[1] : 'more';
    var presentation = categories[category];
    var productName = decodeText(product.name.trim());
    var shortName = metadata ? metadata[0] : productName;
    var card = document.createElement('a');
    card.className = 'product-card';
    card.href = details.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.dataset.permalink = details.permalink;
    card.dataset.category = category;

    var art = textElement('div', 'product-art ' + (metadata && metadata[3] ? metadata[3] : presentation.art), '');
    art.setAttribute('aria-hidden', 'true');
    art.appendChild(textElement('span', 'art-kicker', presentation.label));
    art.appendChild(textElement('span', 'art-monogram', metadata ? shortName : Array.from(shortName)[0].toUpperCase()));
    art.appendChild(textElement('span', 'art-detail', metadata ? metadata[2] : 'From the studio'));

    var body = textElement('div', 'product-body', '');
    var meta = textElement('div', 'product-meta', '');
    meta.appendChild(textElement('span', 'product-kind', presentation.label));
    var price = textElement('span', 'product-price', prices.get(details.permalink) || 'View price');
    price.dataset.gumroadProduct = details.permalink;
    price.dataset.gumroadField = 'price';
    meta.appendChild(price);
    body.appendChild(meta);
    body.appendChild(textElement('h3', '', productName));
    var description = metadata && metadata[4] ? metadata[4] : typeof product.description === 'string' && product.description.trim() ? product.description : 'Explore this tool, see what is included, and find your next useful thing.';
    body.appendChild(textElement('p', 'product-description', decodeText(description)));
    body.appendChild(textElement('span', 'product-link', metadata ? 'Explore ' + shortName + ' ↗' : 'Explore this tool ↗'));
    card.appendChild(art);
    card.appendChild(body);
    return card;
  }

  function addProducts(products) {
    products.forEach(function (product) {
      var details = productDetails(product);
      if (!details) return;
      var previous = cards.get(details.permalink);
      var card = renderProduct(details);
      if (previous) previous.replaceWith(card);
      else grid.appendChild(card);
      cards.set(details.permalink, card);
    });
  }

  function refresh() {
    var query = search ? search.value.trim().toLocaleLowerCase() : '';
    var visible = 0;
    var hasOther = false;
    matchingCount = 0;
    cards.forEach(function (card) {
      if (card.dataset.category === 'more') hasOther = true;
      var matches = (activeFilter === 'all' || card.dataset.category === activeFilter) && (!query || card.textContent.toLocaleLowerCase().includes(query));
      if (matches) matchingCount += 1;
      card.hidden = !matches || matchingCount > visibleLimit;
      if (!card.hidden) visible += 1;
    });
    filters.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter));
      if (button.dataset.filter === 'more') button.hidden = !hasOther;
    });
    if (empty) empty.hidden = visible !== 0;
    if (count) {
      var label = 'Showing ' + visible + ' of ' + matchingCount + (matchingCount === 1 ? ' tool' : ' tools');
      if (total > cards.size) label += ' · ' + cards.size + ' of ' + total + ' loaded';
      count.textContent = label + (notice ? '. ' + notice : '');
    }
    if (moreButton) {
      moreButton.hidden = matchingCount <= visibleLimit && nextOffset >= total;
      moreButton.disabled = busy;
      moreButton.setAttribute('aria-busy', String(busy));
      moreButton.textContent = busy ? 'Loading tools…' : notice ? 'Try loading more' : 'Load more tools';
    }
  }

  if (count) {
    count.setAttribute('role', 'status');
    count.setAttribute('aria-live', 'polite');
    count.setAttribute('aria-atomic', 'true');
  }
  mergePrices(readJSON('gumroad-prices'));
  grid.querySelectorAll('.product-card[data-permalink]').forEach(function (card) {
    cards.set(card.dataset.permalink, card);
  });
  total = cards.size;
  nextOffset = total;

  var initial = readJSON('gumroad-data');
  if (initial && Array.isArray(initial.products)) {
    grid.replaceChildren();
    cards.clear();
    addProducts(initial.products);
    nextOffset = initial.products.length;
    total = validTotal(initial.products_total) ? Math.max(initial.products_total, nextOffset) : nextOffset;
  }
  applyPrices();

  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      var filter = button.dataset.filter;
      if (filter !== 'all' && !Object.prototype.hasOwnProperty.call(categories, filter)) return;
      activeFilter = filter;
      visibleLimit = 12;
      refresh();
    });
  });
  if (search) search.addEventListener('input', function () {
    visibleLimit = 12;
    refresh();
  });

  if (moreButton) moreButton.addEventListener('click', async function () {
    if (busy) return;
    if (matchingCount > visibleLimit) {
      visibleLimit += 12;
      refresh();
      return;
    }
    if (nextOffset >= total) return;
    visibleLimit = matchingCount + 12;
    busy = true;
    notice = '';
    refresh();
    var timeout;
    try {
      if (!window.gumroadProducts || typeof window.gumroadProducts.request !== 'function') throw new Error('Products bridge unavailable');
      var response = await Promise.race([
        window.gumroadProducts.request({ offset: nextOffset, limit: 100 }),
        new Promise(function (_, reject) { timeout = window.setTimeout(function () { reject(new Error('Products request timed out')); }, 15000); })
      ]);
      if (!response || response.success !== true || !Array.isArray(response.products)) throw new Error('Products request failed');
      var updatedTotal = validTotal(response.productsTotal) ? response.productsTotal : total;
      if (!response.products.length && nextOffset < updatedTotal) throw new Error('Products page was empty');
      mergePrices(response.prices);
      addProducts(response.products);
      nextOffset += response.products.length;
      total = Math.max(updatedTotal, nextOffset);
      applyPrices();
    } catch (_) {
      notice = 'More tools could not load. Please try again.';
    } finally {
      window.clearTimeout(timeout);
      busy = false;
      refresh();
    }
  });

  refresh();
  var controls = document.getElementById('catalog-controls');
  if (controls) controls.hidden = false;
}());
