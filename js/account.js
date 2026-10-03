/* =========================================================
   Giovane Gentile — особистий кабінет
   Розділи: #profile, #orders, #wishlist
   ========================================================= */

const CITIES = [
  'Київ', 'Львів', 'Одеса', 'Дніпро', 'Харків', 'Запоріжжя', 'Вінниця', 'Івано-Франківськ',
  'Тернопіль', 'Луцьк', 'Рівне', 'Ужгород', 'Чернівці', 'Хмельницький', 'Житомир', 'Полтава',
  'Черкаси', 'Чернігів', 'Суми', 'Миколаїв', 'Кропивницький', 'Біла Церква', 'Бровари',
  'Ірпінь', 'Буча', 'Кривий Ріг', 'Мукачево', "Кам'янець-Подільський", 'Умань', 'Трускавець',
];

/*
  Відділення — поки шаблонний список.
  TODO: підключити API Нової Пошти (Address.getWarehouses) для реальних відділень міста.
*/
function branchesFor(city) {
  if (!city) return [];
  const list = Array.from({ length: 30 }, (_, i) => `Відділення №${i + 1}`);
  return list.concat(['Поштомат']);
}

const TABS = ['profile', 'orders', 'wishlist'];
const money = (n) => `${Number(n).toLocaleString('uk-UA').replace(/,/g, ' ')} ₴`;
const initials = (user) => {
  if (user.name) {
    return user.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }
  return 'GG';
};

/* ---------- Tabs ---------- */
function showTab() {
  const tab = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'profile';
  document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== tab; });
  document.querySelectorAll('[data-tab]').forEach((a) => {
    const active = a.dataset.tab === tab;
    a.classList.toggle('is-active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/* ---------- Profile ---------- */
function fillProfile(user) {
  const form = document.getElementById('profile-form');
  form.elements.name.value = user.name || '';
  form.elements.phone.value = formatPhone(user.phone);
  form.elements.city.value = user.city || '';
  form.elements.branch.value = user.branch || '';
  updateBranches(user.city);
}

function updateBranches(city) {
  const input = document.querySelector('#profile-form [name="branch"]');
  input.placeholder = city ? 'Оберіть або введіть номер' : 'Спочатку оберіть місто';
  document.getElementById('branches').innerHTML =
    branchesFor(city).map((b) => `<option value="${escHtml(b)}"></option>`).join('');
}

function initProfileForm() {
  const form = document.getElementById('profile-form');
  const saved = document.getElementById('profile-saved');
  document.getElementById('cities').innerHTML =
    CITIES.map((c) => `<option value="${escHtml(c)}"></option>`).join('');

  form.elements.city.addEventListener('input', (e) => {
    updateBranches(e.target.value.trim());
  });

  const rules = {
    name: (v) => v.trim().split(/\s+/).filter(Boolean).length >= 2,
    city: (v) => v.trim().length >= 2,
    branch: (v) => v.trim().length >= 2,
  };

  Object.keys(rules).forEach((name) => {
    form.elements[name].addEventListener('input', () => {
      form.elements[name].closest('.field').classList.remove('is-invalid');
      saved.hidden = true;
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    Object.entries(rules).forEach(([name, test]) => {
      const valid = test(form.elements[name].value);
      form.elements[name].closest('.field').classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      form.querySelector('.is-invalid input').focus();
      return;
    }
    Auth.update({
      name: form.elements.name.value.trim().replace(/\s+/g, ' '),
      city: form.elements.city.value.trim(),
      branch: form.elements.branch.value.trim(),
    });
    saved.hidden = false;
    showToast('Особисті дані збережено');
  });
}

/* ---------- Orders ---------- */
const PAYMENT = {
  paid: { label: 'Оплачено', cls: 'is-paid', note: 'Оплачено онлайн' },
  cod: { label: 'Не оплачено', cls: 'is-unpaid', note: 'Оплата при отриманні — можна оглянути товар у відділенні та відмовитися' },
};

function orderTemplate(order) {
  const pay = PAYMENT[order.payment] || PAYMENT.cod;
  const total = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const date = new Date(order.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

  const items = order.items.map((item) => `
    <div class="order-item">
      <span class="order-item__thumb">${item.image ? `<img src="${escHtml(item.image)}" alt="">` : '<span>Soon</span>'}</span>
      <div class="order-item__info">
        <p class="order-item__cat">${escHtml(item.category)}</p>
        <p class="order-item__name">${escHtml(item.name)}</p>
        <dl class="order-item__meta">
          <div><dt>Артикул</dt><dd>${escHtml(item.sku)}</dd></div>
          <div><dt>Розмір</dt><dd>${escHtml(item.size)}</dd></div>
          <div><dt>Кількість</dt><dd>${escHtml(item.qty)}</dd></div>
        </dl>
      </div>
      <p class="order-item__price">${money(item.price * item.qty)}</p>
    </div>`).join('');

  return `
    <article class="order">
      <header class="order__head">
        <div>
          <p class="order__id">Замовлення № ${escHtml(order.id)}</p>
          <p class="order__date">${date} · ${escHtml(order.status)}</p>
        </div>
        <span class="order__pay ${pay.cls}">${pay.label}</span>
      </header>
      <div class="order__items">${items}</div>
      <footer class="order__foot">
        <div class="order__delivery">
          <p>${escHtml(order.delivery)}</p>
          <p class="order__note">${pay.note}</p>
        </div>
        <p class="order__total"><span>Сума</span>${money(total)}</p>
      </footer>
    </article>`;
}

function renderOrders(user) {
  const root = document.getElementById('orders-root');
  const orders = user.orders || [];
  document.getElementById('orders-count').textContent = orders.length || '';

  if (!orders.length) {
    root.innerHTML = `
      <div class="wish-empty wish-empty--inline">
        <h2>Замовлень поки немає</h2>
        <p>Коли ви оформите замовлення, тут з'явиться його статус, склад та оплата.</p>
        <div class="wish-empty__actions"><a href="catalog.html?cat=new" class="btn btn--dark">Перейти до новинок</a></div>
      </div>`;
    return;
  }

  root.innerHTML =
    (orders.some((o) => o.demo) ? '<p class="orders-demo">Демо: це приклади замовлень, щоб показати, як виглядатиме розділ.</p>' : '') +
    orders.map(orderTemplate).join('');
}

/* ---------- Page ---------- */
function renderAccount() {
  const user = Auth.current();
  const guest = document.getElementById('account-guest');
  const account = document.getElementById('account');
  const greeting = document.getElementById('account-greeting');

  guest.hidden = Boolean(user);
  account.hidden = !user;

  if (!user) {
    greeting.textContent = '';
    return;
  }

  const firstName = user.name ? user.name.split(/\s+/)[1] || user.name.split(/\s+/)[0] : '';
  greeting.textContent = firstName ? `Вітаємо, ${firstName}!` : 'Вітаємо у Giovane Gentile!';
  document.getElementById('account-avatar').textContent = initials(user);
  document.getElementById('account-name').textContent = user.name || 'Новий клієнт';
  document.getElementById('account-phone').textContent = formatPhone(user.phone);

  fillProfile(user);
  renderOrders(user);
  showTab();
}

function initAccountPage() {
  if (!document.getElementById('account')) return;

  initProfileForm();
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open-auth]');
    if (open) AuthModal.open(open.dataset.openAuth);
  });
  window.addEventListener('hashchange', showTab);
  document.addEventListener('auth:change', renderAccount);
  renderAccount();
}

document.addEventListener('DOMContentLoaded', initAccountPage);
