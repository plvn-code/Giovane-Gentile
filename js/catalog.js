/* =========================================================
   Giovane Gentile — catalog page
   Сторінка: catalog.html?cat=<розділ>&sub=<підрозділ>
   ========================================================= */

/* CATALOG та labelsFor — у js/products.js */

const PER_PAGE = 20; // 4 в ряд × 5 рядів

/* Картка каталогу з реальними даними товару (Supabase). */
function catalogCard(product, badge) {
  const img = product.images && product.images[0];
  const media = img
    ? `<img src="${escHtml(img)}" alt="${escHtml(product.name)}" loading="lazy">`
    : '<span class="card__soon card__soon--caps">Soon</span>';
  const price = product.oldPrice
    ? `<s>${formatPrice(product.oldPrice)}</s>${formatPrice(product.price)}`
    : formatPrice(product.price);
  return `
    <article class="card card--catalog">
      <a href="${productUrl(product.id)}" class="card__media" aria-label="${escHtml(product.name)}">
        ${badge ? `<span class="card__badge">${badge}</span>` : ''}
        ${media}
      </a>
      <div class="card__body">
        <p class="card__cat">${escHtml(product.category)}</p>
        <p class="card__name">${escHtml(product.name)}</p>
        <p class="card__price">${price}</p>
      </div>
    </article>`;
}

function initCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  const catKey = CATALOG[params.get('cat')] ? params.get('cat') : 'odyag';
  const cat = CATALOG[catKey];
  const subKey = cat.subs[params.get('sub')] ? params.get('sub') : null;
  const pageTitle = subKey ? cat.subs[subKey] : cat.title;

  // Title + browser tab
  document.getElementById('catalog-title').textContent = pageTitle;
  document.title = `${pageTitle} — Giovane Gentile`;

  // Breadcrumbs
  const crumbs = [`<a href="index.html">Головна</a>`];
  crumbs.push(subKey
    ? `<a href="catalog.html?cat=${catKey}">${cat.title}</a>`
    : `<span>${cat.title}</span>`);
  if (subKey) crumbs.push(`<span>${cat.subs[subKey]}</span>`);
  document.getElementById('breadcrumbs').innerHTML = crumbs.join('<i aria-hidden="true">/</i>');

  // Sub-category tabs
  const tabs = [`<li><a href="catalog.html?cat=${catKey}" class="${subKey ? '' : 'is-active'}">Усі</a></li>`]
    .concat(Object.entries(cat.subs).map(([key, name]) =>
      `<li><a href="catalog.html?cat=${catKey}&amp;sub=${key}" class="${key === subKey ? 'is-active' : ''}">${name}</a></li>`));
  document.getElementById('catalog-tabs').innerHTML = tabs.join('');

  // Cards — реальні товари з Supabase
  const products = (window.ggCatalogProducts
    ? window.ggCatalogProducts(catKey, subKey)
    : []).slice(0, PER_PAGE);

  if (products.length) {
    grid.innerHTML = products.map((p) =>
      catalogCard(p, (catKey === 'sale' || p.sale) ? 'Sale' : (cat.badge || (p.isNew ? 'New' : '')))).join('');
    document.getElementById('catalog-count').textContent =
      `${products.length} ${products.length === 1 ? 'товар' : 'товарів'}`;
  } else {
    grid.innerHTML = '<p class="catalog__empty">У цьому розділі поки немає товарів.</p>';
    document.getElementById('catalog-count').textContent = '0 товарів';
  }

  // Hearts → wishlist
  const section = subKey ? `${cat.title} · ${cat.subs[subKey]}` : cat.title;
  grid.querySelectorAll('.card').forEach((card, i) => {
    const p = products[i];
    if (!p) return;
    attachFav(card.querySelector('.card__media'), {
      id: p.id,
      category: p.category,
      section,
      name: p.name,
      price: p.price,
      oldPrice: p.oldPrice,
      image: p.images[0] || '',
      sale: p.sale,
      link: productUrl(p.id),
    });
  });

  // Highlight the current section in the header menu
  document.querySelectorAll('.nav__link').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href.endsWith(`cat=${catKey}`)) link.classList.add('is-current');
  });

  // Gentle fade-in of cards
  grid.querySelectorAll('.card').forEach((card, i) => {
    card.style.animationDelay = `${(i % 4) * 70 + Math.floor(i / 4) * 50}ms`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  (window.GG_READY || Promise.resolve()).then(initCatalog);
});
