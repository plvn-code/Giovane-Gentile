/* =========================================================
   Giovane Gentile — wishlist page (Обране)
   Дані беруться з Wishlist (js/main.js).
   Посилання «Поділитися» містить список у параметрі ?shared=
   ========================================================= */

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const plural = (n) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'товар';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'товари';
  return 'товарів';
};

const ICONS = {
  close: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  heart: '<svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true"><path d="M24 40S9 31 5.5 22.5C2.8 16 6.6 9 13.6 9c4 0 6.8 2.2 10.4 6 3.6-3.8 6.4-6 10.4-6 7 0 10.8 7 8.1 13.5C39 31 24 40 24 40z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M21.5 3.5 2.8 10.7c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.6c.3.9 1.4 1.1 2 .4l2.6-2.6 4.6 3.4c.8.6 1.9.1 2.1-.9l3.2-15.2c.2-1-.8-1.8-1.7-1.4zM9.6 14.2l8.3-6.4-6.6 7.6-.3 2.8-1.4-4z" fill="currentColor"/></svg>',
  viber: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2.5C6.9 2.5 3 5.6 3 10.6c0 2.9 1.3 5 3.4 6.4v3.8c0 .5.6.8 1 .4l2.8-2.6c.6.1 1.2.1 1.8.1 5.1 0 9-3.1 9-8.1s-3.9-8.1-9-8.1zm3.8 11.4c-.4.6-1.2 1-1.9.8-2.6-.8-4.8-2.9-5.7-5.5-.2-.7.1-1.5.8-1.9l.6-.3c.3-.2.7-.1.9.2l.9 1.4c.2.3.1.7-.2.9l-.5.4c.4 1.1 1.3 2 2.4 2.4l.4-.5c.2-.3.6-.4.9-.2l1.4.9c.3.2.4.6.2.9z" fill="currentColor"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z" fill="currentColor"/></svg>',
  mail: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3" y="5" width="18" height="14" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m3.5 6 8.5 7 8.5-7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};

/* ---------- Shared list (?shared=...) ---------- */
function encodeShared(list) {
  const compact = list.map((i) => [i.id, i.category, i.section, i.sale ? 1 : 0]);
  return btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
}

function decodeShared(str) {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(str))));
    if (!Array.isArray(data)) return null;
    return data
      .filter((row) => Array.isArray(row) && row[0])
      .slice(0, 100)
      .map(([id, category, section, sale]) => ({ id: String(id), category, section, sale: Boolean(sale) }));
  } catch (e) {
    return null;
  }
}

/* ---------- Rendering ---------- */
function rowTemplate(item, readOnly) {
  const added = item.addedAt
    ? new Date(item.addedAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
    : '';
  const inStock = Boolean(item.price);

  const thumb = item.image
    ? `<img src="${esc(item.image)}" alt="">`
    : '<span class="wish-thumb__soon">Soon</span>';

  const price = item.price
    ? `${item.oldPrice ? `<s>${esc(item.oldPrice)}</s>` : ''}<strong>${esc(item.price)}</strong>`
    : '<span class="wish-muted">Ціна з\'явиться згодом</span>';

  return `
    <div class="wish-row" data-id="${esc(item.id)}">
      <div class="wish-cell wish-cell--remove">
        ${readOnly ? '' : `<button type="button" class="wish-remove" data-remove="${esc(item.id)}" aria-label="Прибрати з обраного">${ICONS.close}</button>`}
      </div>

      <div class="wish-cell wish-cell--product">
        <a href="${esc(productUrl(item.id))}" class="wish-thumb">
          ${item.sale ? '<span class="wish-thumb__badge">Sale</span>' : ''}
          ${thumb}
        </a>
        <div class="wish-info">
          <p class="wish-info__cat">${esc(item.category)}</p>
          <a href="${esc(productUrl(item.id))}" class="wish-info__name">${esc(item.name || 'Скоро в продажу')}</a>
          <p class="wish-info__meta">${esc(item.section || '')}${added ? ` · додано ${esc(added)}` : ''}</p>
        </div>
      </div>

      <div class="wish-cell wish-cell--price" data-label="Ціна">${price}</div>

      <div class="wish-cell wish-cell--stock" data-label="Наявність">
        <span class="wish-stock ${inStock ? 'is-in' : 'is-soon'}">${inStock ? 'У наявності' : 'Очікується'}</span>
      </div>

      <div class="wish-cell wish-cell--action">
        <a href="index.html#contact" class="btn btn--small btn--dark">Запитати про товар</a>
      </div>
    </div>`;
}

function emptyTemplate() {
  return `
    <div class="wish-empty">
      <span class="wish-empty__icon">${ICONS.heart}</span>
      <h2>Ваш список бажань порожній</h2>
      <p>Натискайте на сердечко на картці товару, щоб зберегти речі, які сподобались, — вони з'являться тут.</p>
      <div class="wish-empty__actions">
        <a href="catalog.html?cat=new" class="btn btn--dark">Переглянути новинки</a>
        <a href="catalog.html?cat=odyag" class="btn btn--outline">До каталогу</a>
      </div>
    </div>`;
}

function render() {
  const root = document.getElementById('wishlist-root');
  const sub = document.getElementById('wishlist-sub');
  const params = new URLSearchParams(location.search);
  const shared = params.get('shared') ? decodeShared(params.get('shared')) : null;
  const readOnly = Boolean(shared);
  const list = shared || Wishlist.all();

  if (!list.length) {
    sub.textContent = '';
    root.innerHTML = emptyTemplate();
    return;
  }

  sub.textContent = readOnly
    ? `Вами поділилися списком: ${list.length} ${plural(list.length)}`
    : `${list.length} ${plural(list.length)} у вашому списку`;

  const shareUrl = `${location.origin}${location.pathname}?shared=${encodeURIComponent(encodeShared(list))}`;
  const shareText = 'Мій список бажань — Giovane Gentile';
  const u = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(shareText);

  root.innerHTML = `
    ${readOnly ? `
      <div class="wish-banner">
        <span>Це список, яким з вами поділилися.</span>
        <button type="button" class="btn btn--small btn--dark" data-save-shared>Зберегти до мого обраного</button>
      </div>` : ''}

    <div class="wish-table" role="table" aria-label="Список бажань">
      <div class="wish-row wish-row--head" role="row">
        <span></span>
        <span>Товар</span>
        <span>Ціна</span>
        <span>Наявність</span>
        <span></span>
      </div>
      ${list.map((item) => rowTemplate(item, readOnly)).join('')}
    </div>

    <div class="wish-footer">
      <div class="wish-share">
        <span class="wish-share__label">Поділитися:</span>
        <a class="wish-share__btn" href="https://t.me/share/url?url=${u}&amp;text=${t}" target="_blank" rel="noopener" aria-label="Telegram">${ICONS.telegram}</a>
        <a class="wish-share__btn" href="viber://forward?text=${t}%20${u}" aria-label="Viber">${ICONS.viber}</a>
        <a class="wish-share__btn" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" aria-label="Facebook">${ICONS.facebook}</a>
        <a class="wish-share__btn" href="mailto:?subject=${t}&amp;body=${u}" aria-label="Email">${ICONS.mail}</a>
        <button type="button" class="wish-share__btn" data-copy="${esc(shareUrl)}" aria-label="Скопіювати посилання">${ICONS.link}</button>
      </div>
      <div class="wish-footer__actions">
        ${readOnly ? '' : '<button type="button" class="wish-clear" data-clear>Очистити список</button>'}
        <a href="catalog.html?cat=new" class="btn btn--outline btn--small">Продовжити покупки <span class="btn__arrow" aria-hidden="true">›</span></a>
      </div>
    </div>`;
}

function initWishlistPage() {
  const root = document.getElementById('wishlist-root');
  if (!root) return;

  root.addEventListener('click', async (e) => {
    const remove = e.target.closest('[data-remove]');
    if (remove) {
      const row = remove.closest('.wish-row');
      row.classList.add('is-removing');
      setTimeout(() => Wishlist.remove(remove.dataset.remove), 320);
      return;
    }

    if (e.target.closest('[data-clear]')) {
      if (confirm('Очистити весь список бажань?')) Wishlist.clear();
      return;
    }

    const copy = e.target.closest('[data-copy]');
    if (copy) {
      try {
        await navigator.clipboard.writeText(copy.dataset.copy);
        showToast('Посилання скопійовано');
      } catch (err) {
        prompt('Скопіюйте посилання:', copy.dataset.copy);
      }
      return;
    }

    if (e.target.closest('[data-save-shared]')) {
      const shared = decodeShared(new URLSearchParams(location.search).get('shared')) || [];
      const mine = Wishlist.all();
      const ids = new Set(mine.map((i) => i.id));
      const merged = shared
        .filter((i) => !ids.has(i.id))
        .map((i) => ({ ...i, addedAt: Date.now() }))
        .concat(mine);
      history.replaceState(null, '', location.pathname);
      Wishlist.save(merged);
      showToast('Список збережено до вашого обраного');
    }
  });

  document.addEventListener('wishlist:change', render);
  render();
}

document.addEventListener('DOMContentLoaded', initWishlistPage);
