/* =========================================================
   Giovane Gentile — кошик
   Зберігається в браузері (localStorage 'gg_cart').
   Позиція: { key, id, name, category, size, price, oldPrice, qty, sale, image }
   key = id + розмір (той самий товар іншого розміру — окрема позиція)
   ========================================================= */

const Cart = {
  KEY: 'gg_cart',

  all() {
    try {
      const list = JSON.parse(localStorage.getItem(this.KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try { localStorage.setItem(this.KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
    document.dispatchEvent(new CustomEvent('cart:change'));
  },

  add(item) {
    const list = this.all();
    const key = `${item.id}|${item.size}`;
    const existing = list.find((x) => x.key === key);
    if (existing) existing.qty += item.qty || 1;
    else list.unshift({ ...item, key, qty: item.qty || 1 });
    this.save(list);
  },

  remove(key) { this.save(this.all().filter((x) => x.key !== key)); },

  count() { return this.all().reduce((n, x) => n + x.qty, 0); },
  total() { return this.all().reduce((sum, x) => sum + x.price * x.qty, 0); },
};

const cartMoney = (n) => `${Math.round(n).toLocaleString('uk-UA').replace(/\s|,/g, ' ')} ₴`;

/* ---------- Міні-кошик (плашка, як у референсі) ---------- */
function miniCartTemplate() {
  const list = Cart.all();
  if (!list.length) {
    return `
      <div class="mini-cart__empty">
        <p>Ваш кошик порожній</p>
        <a href="catalog.html?cat=new" class="btn btn--small btn--outline">Переглянути новинки</a>
      </div>`;
  }

  const items = list.map((x) => `
    <li class="mini-cart__item">
      <a href="${productUrl(x.id)}" class="mini-cart__thumb">${x.image ? `<img src="${escHtml(x.image)}" alt="">` : '<span>Soon</span>'}</a>
      <div class="mini-cart__info">
        <a href="${productUrl(x.id)}" class="mini-cart__name">${escHtml(x.name)}</a>
        <p class="mini-cart__meta">Розмір: ${escHtml(x.size)}</p>
        <p class="mini-cart__price">${x.qty} × <b>${cartMoney(x.price)}</b></p>
      </div>
      <button type="button" class="mini-cart__remove" data-cart-remove="${escHtml(x.key)}" aria-label="Видалити з кошика">
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </li>`).join('');

  return `
    <ul class="mini-cart__list">${items}</ul>
    <div class="mini-cart__total"><span>Разом:</span><b>${cartMoney(Cart.total())}</b></div>
    <div class="mini-cart__actions">
      <button type="button" class="btn btn--dark btn--block" data-cart-soon>Переглянути кошик</button>
      <button type="button" class="btn btn--outline btn--block" data-cart-soon>Оформлення замовлення</button>
    </div>`;
}

const MiniCart = {
  timer: null,

  render() {
    const html = miniCartTemplate();
    document.querySelectorAll('[data-mini-cart]').forEach((el) => { el.innerHTML = html; });

    const count = Cart.count();
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.hidden = count === 0;
    });
    document.querySelectorAll('[data-cart-total]').forEach((el) => { el.textContent = cartMoney(Cart.total()); });
  },

  open(autoClose = 0) {
    document.querySelectorAll('[data-mini-cart]').forEach((el) => el.classList.add('is-open'));
    clearTimeout(this.timer);
    if (autoClose) this.timer = setTimeout(() => this.close(), autoClose);
  },

  close() {
    document.querySelectorAll('[data-mini-cart]').forEach((el) => el.classList.remove('is-open'));
  },
};

function initCart() {
  MiniCart.render();
  document.addEventListener('cart:change', () => MiniCart.render());
  window.addEventListener('storage', (e) => { if (e.key === Cart.KEY) MiniCart.render(); });

  document.addEventListener('click', (e) => {
    const remove = e.target.closest('[data-cart-remove]');
    if (remove) {
      e.preventDefault();
      Cart.remove(remove.dataset.cartRemove);
      return;
    }
    if (e.target.closest('[data-cart-soon]')) {
      e.preventDefault();
      if (!Cart.all().length) { showToast('Кошик порожній'); return; }
      location.href = 'checkout.html';
      return;
    }
    // Мобільна кнопка кошика
    const toggle = e.target.closest('[data-cart-toggle]');
    if (toggle) {
      e.preventDefault();
      const opened = document.querySelector('.mini-cart--mobile.is-open');
      if (opened) MiniCart.close(); else MiniCart.open();
      return;
    }
    // Клік поза плашкою — закрити
    if (!e.target.closest('[data-mini-cart], .topbar__cart-wrap, [data-cart-keep]')) MiniCart.close();
  });

  // Наведення на «Кошик» у верхній панелі (десктоп)
  document.querySelectorAll('.topbar__cart-wrap').forEach((wrap) => {
    wrap.addEventListener('mouseenter', () => { clearTimeout(MiniCart.timer); });
    wrap.addEventListener('mouseleave', () => {
      clearTimeout(MiniCart.timer);
      MiniCart.timer = setTimeout(() => MiniCart.close(), 250);
    });
  });
  document.querySelectorAll('.topbar__cart').forEach((link) => {
    link.addEventListener('click', (e) => { e.preventDefault(); MiniCart.open(); });
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') MiniCart.close(); });
}

document.addEventListener('DOMContentLoaded', initCart);
