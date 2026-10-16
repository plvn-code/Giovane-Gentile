/* =========================================================
   Giovane Gentile — main page scripts
   ========================================================= */

/*
  Товари для каруселей.
  Поки фото немає — показуємо «soon».
  Коли з'являться фото/дані, просто заповніть поля:
    { category: 'Туфлі', name: 'Чоловічі дербі ...', price: '32 942 ₴', oldPrice: '', image: 'assets/products/1.jpg' }
*/
const PRODUCTS = {
  new: [
    { category: 'Туфлі' },
    { category: 'Трикотаж' },
    { category: 'Сорочки' },
    { category: 'Лофери' },
    { category: 'Піджаки' },
    { category: 'Штани' },
    { category: 'Верхній одяг' },
    { category: 'Аксесуари' },
  ],
  sale: [
    { category: 'Кеди, кросівки', badge: 'Sale' },
    { category: 'Туфлі', badge: 'Sale' },
    { category: 'Трикотаж', badge: 'Sale' },
    { category: 'Сорочки', badge: 'Sale' },
    { category: 'Лофери', badge: 'Sale' },
    { category: 'Ремені', badge: 'Sale' },
    { category: 'Верхній одяг', badge: 'Sale' },
    { category: 'Штани', badge: 'Sale' },
  ],
};

const HEART_SVG =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20s-7-4.3-9-8.6C1.7 8.4 3.6 5 7 5c1.9 0 3.2 1 5 2.8C13.8 6 15.1 5 17 5c3.4 0 5.3 3.4 4 6.4C19 15.7 12 20 12 20z" fill="currentColor"/></svg>';

/* ---------- Wishlist (Обране) ----------
   Зберігається в браузері відвідувача (localStorage).
   Елемент: { id, category, section, name, price, oldPrice, image, sale, link } */
const Wishlist = {
  KEY: 'gg_wishlist',

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
    document.dispatchEvent(new CustomEvent('wishlist:change'));
  },

  has(id) { return this.all().some((item) => item.id === id); },

  toggle(item) {
    const list = this.all();
    const i = list.findIndex((x) => x.id === item.id);
    if (i >= 0) list.splice(i, 1);
    else list.unshift({ ...item, addedAt: Date.now() });
    this.save(list);
    return i < 0;
  },

  remove(id) { this.save(this.all().filter((item) => item.id !== id)); },

  clear() { this.save([]); },
};

/* Кнопка-сердечко на картці товару */
function attachFav(media, item) {
  const fav = document.createElement('button');
  fav.className = 'card__fav';
  fav.type = 'button';
  fav.innerHTML = HEART_SVG;

  const sync = () => {
    const active = Wishlist.has(item.id);
    fav.classList.toggle('is-active', active);
    fav.setAttribute('aria-pressed', String(active));
    fav.setAttribute('aria-label', active ? 'Прибрати з обраного' : 'Додати в обране');
  };

  fav.addEventListener('click', (e) => {
    e.preventDefault();
    const added = Wishlist.toggle({ link: (location.pathname.split('/').pop() || 'index.html') + location.search, ...item });
    fav.classList.remove('is-pop');
    void fav.offsetWidth; // restart animation
    if (added) fav.classList.add('is-pop');
    showToast(added ? 'Додано до обраного' : 'Прибрано з обраного', added);
  });

  document.addEventListener('wishlist:change', sync);
  sync();
  media.appendChild(fav);
}

/* Лічильник біля сердечка у верхній панелі */
function initWishCount() {
  const els = document.querySelectorAll('[data-wish-count]');
  const update = () => {
    const n = Wishlist.all().length;
    els.forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
    });
  };
  document.addEventListener('wishlist:change', update);
  window.addEventListener('storage', (e) => {
    if (e.key === Wishlist.KEY) document.dispatchEvent(new CustomEvent('wishlist:change'));
  });
  update();
}

/* Невелике повідомлення внизу екрана */
function showToast(text, withLink) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>${text}</span>${withLink ? '<a href="wishlist.html">Переглянути</a>' : ''}`;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

/* Посилання на сторінку товару */
function productUrl(id) { return `product.html?id=${encodeURIComponent(id)}`; }

function cardTemplate(p) {
  const media = p.image
    ? `<img src="${p.image}" alt="${p.name || ''}" loading="lazy">`
    : '<span class="card__soon">soon</span>';

  const info = p.name
    ? `<p class="card__name">${p.name}</p>
       <p class="card__price">${p.oldPrice ? `<s>${p.oldPrice}</s>` : ''}${p.price || ''}</p>`
    : `<span class="skeleton skeleton--name"></span>
       <span class="skeleton skeleton--name2"></span>
       <span class="skeleton skeleton--price"></span>`;

  return `
    <article class="card">
      <a href="${p.id ? productUrl(p.id) : '#'}" class="card__media" aria-label="${p.name || 'Скоро в продажу'}">
        ${p.badge ? `<span class="card__badge">${p.badge}</span>` : ''}
        ${media}
      </a>
      <div class="card__body">
        <p class="card__cat">${p.category || ''}</p>
        ${info}
      </div>
    </article>`;
}

function initCarousel(root, items) {
  const key = root.dataset.carousel;
  const track = root.querySelector('.carousel__track');
  const prev = root.querySelector('.carousel__arrow--prev');
  const next = root.querySelector('.carousel__arrow--next');

  // Головна: товари з PRODUCTS; інші сторінки передають items самі
  const list = items || (PRODUCTS[key] || []).map((p, i) => ({ ...p, id: `home-${key}-${i + 1}` }));
  track.innerHTML = list.map(cardTemplate).join('');

  // Heart (favourite) toggle on cards
  const section = root.dataset.section || (key === 'sale' ? 'Sale' : 'Нові надходження');
  track.querySelectorAll('.card').forEach((card, i) => {
    const p = list[i];
    attachFav(card.querySelector('.card__media'), {
      id: p.id,
      category: p.category,
      section,
      name: p.name,
      price: p.price,
      oldPrice: p.oldPrice,
      image: p.image,
      sale: Boolean(p.badge),
      link: productUrl(p.id),
    });
  });

  const step = () => {
    const card = track.querySelector('.card');
    if (!card) return track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  };

  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    prev.classList.toggle('is-hidden', track.scrollLeft <= 2);
    next.classList.toggle('is-hidden', track.scrollLeft >= max);
  };

  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
  });

  update();
}

/* ---------- Sticky header ---------- */
function initHeader() {
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Mobile menu ---------- */
function initMobileNav() {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('mobile-nav');
  const close = document.getElementById('mobile-close');

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    nav.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  nav.addEventListener('click', (e) => {
    if (e.target === nav || e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el, i) => {
    // small stagger for siblings in grids
    const siblings = el.parentElement.querySelectorAll(':scope > .reveal');
    if (siblings.length > 1) el.style.transitionDelay = `${[...siblings].indexOf(el) * 90}ms`;
    io.observe(el);
  });
}

/* ---------- Phone mask: +380 (XX) XXX-XX-XX ---------- */
function formatPhone(value) {
  let d = value.replace(/\D/g, '');
  if (d.startsWith('380')) d = d.slice(3);
  else if (d.startsWith('80')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  d = d.slice(0, 9);

  let out = '+380';
  if (d.length) out += ' (' + d.slice(0, 2);
  if (d.length > 2) out += ') ' + d.slice(2, 5);
  if (d.length > 5) out += '-' + d.slice(5, 7);
  if (d.length > 7) out += '-' + d.slice(7, 9);
  return out;
}

/* ---------- Contact form ---------- */
function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const success = document.getElementById('form-success');
  const phone = form.elements.phone;

  phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+380'; });
  phone.addEventListener('blur', () => { if (phone.value === '+380') phone.value = ''; });
  phone.addEventListener('input', () => { phone.value = formatPhone(phone.value); });

  const rules = {
    name: (v) => v.trim().length >= 2,
    phone: (v) => v.replace(/\D/g, '').length === 12,
    note: (v) => v.trim().length >= 3,
  };

  const validate = (input) => {
    const ok = rules[input.name](input.value);
    input.closest('.field').classList.toggle('is-invalid', !ok);
    return ok;
  };

  Object.keys(rules).forEach((name) => {
    form.elements[name].addEventListener('input', (e) => {
      if (e.target.closest('.field').classList.contains('is-invalid')) validate(e.target);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = Object.keys(rules).map((name) => validate(form.elements[name]));
    if (results.includes(false)) {
      form.querySelector('.is-invalid .field__input').focus();
      return;
    }

    // TODO: підключити відправку (Telegram-бот / email) — зараз тільки показуємо подяку.
    form.hidden = true;
    success.hidden = false;
  });
}

/* Реальні товари з Supabase для каруселей головної (data-carousel="new"|"sale") */
const ggFormatPrice = (n) => `${Math.round(n).toLocaleString('uk-UA').replace(/\s|,/g, ' ')} ₴`;
function homeCarouselItems(key) {
  const all = window.GG_PRODUCTS || [];
  const list = (key === 'sale' ? all.filter((p) => p.sale) : all.filter((p) => p.isNew)).slice(0, 12);
  return list.map((p) => ({
    id: p.id,
    category: p.category,
    name: p.name,
    price: ggFormatPrice(p.price),
    oldPrice: p.oldPrice ? ggFormatPrice(p.oldPrice) : null,
    image: (p.images && p.images[0]) || '',
    badge: key === 'sale' || p.sale ? 'Sale' : null,
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  (window.GG_READY || Promise.resolve()).then(() => {
    document.querySelectorAll('[data-carousel]').forEach((root) => {
      const key = root.dataset.carousel;
      const items = (window.GG_PRODUCTS && window.GG_PRODUCTS.length && (key === 'new' || key === 'sale'))
        ? homeCarouselItems(key)
        : undefined;
      initCarousel(root, items);
    });
  });
  initHeader();
  initWishCount();
  initMobileNav();
  initReveal();
  initForm();
});
