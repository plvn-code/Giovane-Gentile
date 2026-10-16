/* =========================================================
   Giovane Gentile — сторінка товару
   product.html?id=<id картки>
   ========================================================= */

const VIEWS = ['Вигляд спереду', 'Вигляд збоку', 'Вигляд ззаду', 'Деталі'];

const SHARE_ICONS = {
  telegram: '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M21.5 3.5 2.8 10.7c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.6c.3.9 1.4 1.1 2 .4l2.6-2.6 4.6 3.4c.8.6 1.9.1 2.1-.9l3.2-15.2c.2-1-.8-1.8-1.7-1.4zM9.6 14.2l8.3-6.4-6.6 7.6-.3 2.8-1.4-4z" fill="currentColor"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z" fill="currentColor"/></svg>',
  pinterest: '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 3a9 9 0 0 0-3.3 17.4c-.1-.7-.1-1.9 0-2.7l1.1-4.5s-.3-.6-.3-1.4c0-1.3.8-2.3 1.7-2.3.8 0 1.2.6 1.2 1.3 0 .8-.5 2-.8 3.1-.2.9.5 1.7 1.4 1.7 1.7 0 3-1.8 3-4.4 0-2.3-1.6-3.9-4-3.9-2.7 0-4.3 2-4.3 4.1 0 .8.3 1.7.7 2.2.1.1.1.2.1.3l-.3 1.1c0 .2-.2.2-.4.1-1.2-.6-2-2.4-2-3.8 0-3.1 2.3-6 6.5-6 3.4 0 6.1 2.4 6.1 5.7 0 3.4-2.1 6.1-5.1 6.1-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.8-.8 1.9-1.2 2.6A9 9 0 1 0 12 3z" fill="currentColor"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};

function initProductPage() {
  const root = document.getElementById('product');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  const product = id ? getProduct(id) : null;

  if (!product) {
    document.getElementById('product-missing').hidden = false;
    document.title = 'Товар не знайдено — Giovane Gentile';
    return;
  }

  const $ = (sel) => document.getElementById(sel);
  const catUrl = `catalog.html?cat=${product.catKey}`;
  const subUrl = `${catUrl}&sub=${product.subKey}`;
  let selected = null;

  document.title = `${product.name} — Giovane Gentile`;
  root.hidden = false;
  $('product-details').hidden = false;

  /* Breadcrumbs */
  $('product-crumbs').innerHTML = [
    '<a href="index.html">Головна</a>',
    `<a href="${catUrl}">${escHtml(product.catTitle)}</a>`,
    `<a href="${subUrl}">${escHtml(product.category)}</a>`,
    `<span>${escHtml(product.name)}</span>`,
  ].join('<i aria-hidden="true">/</i>');

  /* Header info */
  $('p-cat').innerHTML = `<a href="${catUrl}">${escHtml(product.catTitle)}</a><i aria-hidden="true">/</i><a href="${subUrl}">${escHtml(product.category)}</a>`;
  $('p-title').textContent = product.name;
  $('p-lead').textContent = product.description;
  $('p-badge').hidden = !product.sale;

  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  $('p-price').innerHTML = product.oldPrice
    ? `<s>${formatPrice(product.oldPrice)}</s><strong>${formatPrice(product.price)}</strong><em>−${discount}%</em>`
    : `<strong>${formatPrice(product.price)}</strong>`;

  /* Gallery — реальні фото товару (Supabase) */
  const imgs = product.images && product.images.length ? product.images : [];
  const thumbs = $('p-thumbs');
  thumbs.innerHTML = VIEWS.map((v, i) => `
    <button type="button" class="product__thumb${i === 0 ? ' is-active' : ''}" data-view="${i}" aria-label="${v}">
      ${imgs[i] ? `<img src="${escHtml(imgs[i])}" alt="">` : '<span>Soon</span>'}
    </button>`).join('');

  // Головне фото
  const mainEl = $('p-main');
  const soonEl = mainEl.querySelector('.product__soon');
  let mainImg = mainEl.querySelector('.product__photo');
  if (imgs.length) {
    if (soonEl) soonEl.hidden = true;
    if (!mainImg) {
      mainImg = document.createElement('img');
      mainImg.className = 'product__photo';
      mainEl.insertBefore(mainImg, $('p-view'));
    }
    mainImg.src = imgs[0];
    mainImg.alt = product.name;
  }

  thumbs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    thumbs.querySelectorAll('.product__thumb').forEach((t) => t.classList.toggle('is-active', t === btn));
    $('p-view').textContent = VIEWS[btn.dataset.view];
    const main = $('p-main');
    if (mainImg && imgs[btn.dataset.view]) mainImg.src = imgs[btn.dataset.view];
    main.classList.remove('is-switch');
    void main.offsetWidth;
    main.classList.add('is-switch');
  });

  /* Sizes */
  const sizesEl = $('p-sizes');
  sizesEl.innerHTML = product.sizes.map((s) => `
    <button type="button" class="size${s.available ? '' : ' is-out'}" role="radio" aria-checked="false"
      data-size="${escHtml(s.label)}" ${s.available ? '' : 'disabled aria-disabled="true" title="Немає в наявності"'}>${escHtml(s.label)}</button>`).join('');

  const selectSize = (label) => {
    selected = label;
    sizesEl.querySelectorAll('.size').forEach((b) => {
      const on = b.dataset.size === label;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-checked', String(on));
    });
    $('p-size-label').textContent = label ? `: ${label}` : '';
    $('p-size-clear').hidden = !label || product.sizes.length === 1;
    $('p-stock').hidden = !label;
    $('p-size-error').hidden = true;
    $('p-sizes-box').classList.remove('is-error');
  };

  sizesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.size:not(.is-out)');
    if (btn) selectSize(btn.dataset.size);
  });
  $('p-size-clear').addEventListener('click', () => selectSize(null));
  if (product.sizes.length === 1) selectSize(product.sizes[0].label);

  /* Add to cart */
  $('p-add').addEventListener('click', () => {
    if (!selected) {
      $('p-size-error').hidden = false;
      const box = $('p-sizes-box');
      box.classList.remove('is-error');
      void box.offsetWidth;
      box.classList.add('is-error');
      return;
    }
    Cart.add({
      id: product.id,
      name: product.name,
      category: product.category,
      size: selected,
      price: product.price,
      oldPrice: product.oldPrice,
      sale: product.sale,
      image: product.images[0] || '',
    });

    $('product-added-text').textContent = `«${product.name}» (розмір ${selected}) додано до кошика.`;
    const added = $('product-added');
    added.hidden = false;
    added.classList.remove('is-in');
    void added.offsetWidth;
    added.classList.add('is-in');
    MiniCart.open(4500);
    if (window.scrollY > 40) window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-show]')) {
      e.stopPropagation();
      MiniCart.open();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, true);

  /* Wishlist heart */
  const fav = $('p-fav');
  const wishItem = { id: product.id, category: product.category, section: product.catTitle, sale: product.sale, link: productUrl(product.id) };
  const syncFav = () => {
    const on = Wishlist.has(product.id);
    fav.classList.toggle('is-active', on);
    fav.setAttribute('aria-pressed', String(on));
    fav.setAttribute('aria-label', on ? 'Прибрати з обраного' : 'Додати в обране');
  };
  fav.addEventListener('click', () => {
    const added = Wishlist.toggle(wishItem);
    showToast(added ? 'Додано до обраного' : 'Прибрано з обраного', added);
  });
  document.addEventListener('wishlist:change', syncFav);
  syncFav();

  /* Meta: артикул, категорія, позначки, бренд */
  const tagLinks = product.tags.map((t) => {
    if (t === 'Новинки') return `<a href="catalog.html?cat=new">${t}</a>`;
    if (t === 'Sale') return `<a href="catalog.html?cat=sale">${t}</a>`;
    return `<a href="${subUrl}">${escHtml(t)}</a>`;
  }).join(', ');
  $('p-meta').innerHTML = `
    <div><dt>Артикул</dt><dd>${escHtml(product.sku)}</dd></div>
    <div><dt>Категорія</dt><dd><a href="${subUrl}">${escHtml(product.category)}</a></dd></div>
    <div><dt>Позначки</dt><dd>${tagLinks}</dd></div>
    <div><dt>Бренд</dt><dd>${escHtml(product.brand)}</dd></div>`;

  /* Share */
  const url = encodeURIComponent(location.href);
  const text = encodeURIComponent(`${product.name} — Giovane Gentile`);
  $('p-share').innerHTML = `
    <span>Поділитися:</span>
    <a href="https://t.me/share/url?url=${url}&amp;text=${text}" target="_blank" rel="noopener" aria-label="Telegram">${SHARE_ICONS.telegram}</a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" rel="noopener" aria-label="Facebook">${SHARE_ICONS.facebook}</a>
    <a href="https://pinterest.com/pin/create/button/?url=${url}&amp;description=${text}" target="_blank" rel="noopener" aria-label="Pinterest">${SHARE_ICONS.pinterest}</a>
    <button type="button" data-copy-link aria-label="Скопіювати посилання">${SHARE_ICONS.link}</button>`;
  $('p-share').querySelector('[data-copy-link]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast('Посилання скопійовано');
    } catch (err) {
      prompt('Скопіюйте посилання:', location.href);
    }
  });

  $('p-demo').hidden = !product.demo;

  /* Accordion: опис + додаткова інформація */
  $('p-desc').innerHTML = product.fullDescription.map((p) => `<p>${escHtml(p)}</p>`).join('');
  $('p-attrs').innerHTML = Object.entries(product.attributes)
    .map(([k, v]) => `<tr><th scope="row">${escHtml(k)}</th><td>${escHtml(v)}</td></tr>`).join('');

  /* Related */
  const related = relatedProducts(product).map((p) => ({
    id: p.id,
    category: p.category,
    name: p.name,
    price: formatPrice(p.price),
    oldPrice: p.oldPrice ? formatPrice(p.oldPrice) : null,
    image: (p.images && p.images[0]) || '',
    badge: p.sale ? 'Sale' : null,
  }));
  if (related.length) {
    $('related-section').hidden = false;
    initCarousel($('related'), related);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  (window.GG_READY || Promise.resolve()).then(initProductPage);
});
