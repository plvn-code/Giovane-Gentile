/* =========================================================
   Giovane Gentile — catalog page
   Сторінка: catalog.html?cat=<розділ>&sub=<підрозділ>
   ========================================================= */

/* CATALOG та labelsFor — у js/products.js */

const PER_PAGE = 20; // 4 в ряд × 5 рядів

/*
  Поки фото немає — картка показує SOON.
  Коли з'являться товари, передайте сюди { image, name, price, oldPrice }.
*/
function catalogCard(id, category, badge) {
  return `
    <article class="card card--catalog">
      <a href="${productUrl(id)}" class="card__media" aria-label="Скоро в продажу">
        ${badge ? `<span class="card__badge">${badge}</span>` : ''}
        <span class="card__soon card__soon--caps">Soon</span>
      </a>
      <div class="card__body">
        <p class="card__cat">${category}</p>
        <span class="skeleton skeleton--name"></span>
        <span class="skeleton skeleton--name2"></span>
        <span class="skeleton skeleton--price"></span>
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

  // Cards
  const labels = labelsFor(catKey, subKey);
  grid.innerHTML = Array.from({ length: PER_PAGE }, (_, i) =>
    catalogCard(`${catKey}-${subKey || 'all'}-${i + 1}`, labels[i % labels.length], cat.badge)).join('');
  document.getElementById('catalog-count').textContent = `${PER_PAGE} товарів`;

  // Hearts → wishlist
  const section = subKey ? `${cat.title} · ${cat.subs[subKey]}` : cat.title;
  grid.querySelectorAll('.card').forEach((card, i) => {
    attachFav(card.querySelector('.card__media'), {
      id: `${catKey}-${subKey || 'all'}-${i + 1}`,
      category: labels[i % labels.length],
      section,
      sale: catKey === 'sale',
      link: productUrl(`${catKey}-${subKey || 'all'}-${i + 1}`),
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

document.addEventListener('DOMContentLoaded', initCatalog);
