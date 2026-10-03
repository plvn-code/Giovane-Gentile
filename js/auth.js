/* =========================================================
   Giovane Gentile — авторизація (вхід за SMS-кодом, реєстрація)

   ⚠ ДЕМО-РЕЖИМ: сервера поки немає, тому SMS не надсилається —
   код показується прямо у вікні. Акаунти зберігаються лише в
   цьому браузері (localStorage). Для запуску в продакшн замініть
   функції sendSmsCode / verifySmsCode та сховище Auth на запити
   до вашого бекенду (наприклад, TurboSMS / Firebase Phone Auth).
   ========================================================= */

const AUTH_DEMO = true;
const CODE_LENGTH = 4;
const RESEND_SECONDS = 60;

const escHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));
const phoneDigits = (v) => String(v || '').replace(/\D/g, '');

/* ---------- SMS (замінити на бекенд) ---------- */
const smsStore = {};

function sendSmsCode(phone) {
  // TODO: fetch('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ phone }) })
  const code = Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * 10)).join('');
  smsStore[phone] = code;
  return Promise.resolve({ demoCode: AUTH_DEMO ? code : null });
}

function verifySmsCode(phone, code) {
  // TODO: fetch('/api/auth/verify-code', ...)
  return Promise.resolve(smsStore[phone] === code);
}

/* ---------- Демо-замовлення (приклад відображення) ---------- */
function demoOrders() {
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: 'GG-240163',
      date: Date.now() - 2 * day,
      payment: 'cod',
      status: 'В дорозі',
      delivery: 'Нова Пошта · Київ, Відділення №12',
      demo: true,
      items: [
        { category: 'Туфлі', name: 'Скоро в продажу', sku: 'GG-SH-0318', size: '42', qty: 1, price: 24500 },
        { category: 'Ремені', name: 'Скоро в продажу', sku: 'GG-AC-0077', size: '95 см', qty: 1, price: 6800 },
      ],
    },
    {
      id: 'GG-240117',
      date: Date.now() - 12 * day,
      payment: 'paid',
      status: 'Отримано',
      delivery: 'Нова Пошта · Київ, Відділення №12',
      demo: true,
      items: [
        { category: 'Трикотаж', name: 'Скоро в продажу', sku: 'GG-TR-0142', size: '50', qty: 1, price: 18900 },
      ],
    },
  ];
}

/* ---------- Сховище акаунтів (демо) ---------- */
const Auth = {
  USERS: 'gg_users',
  SESSION: 'gg_session',

  users() {
    try { return JSON.parse(localStorage.getItem(this.USERS) || '{}') || {}; } catch (e) { return {}; }
  },
  saveUsers(users) {
    try { localStorage.setItem(this.USERS, JSON.stringify(users)); } catch (e) { /* storage unavailable */ }
  },
  exists(phone) { return Boolean(this.users()[phone]); },

  current() {
    let phone = null;
    try { phone = localStorage.getItem(this.SESSION); } catch (e) { /* storage unavailable */ }
    return phone ? this.users()[phone] || null : null;
  },

  login(phone) {
    try { localStorage.setItem(this.SESSION, phone); } catch (e) { /* storage unavailable */ }
    this.emit();
  },

  logout() {
    try { localStorage.removeItem(this.SESSION); } catch (e) { /* storage unavailable */ }
    this.emit();
  },

  // Пароль у демо не зберігається — його буде обробляти бекенд.
  register(phone) {
    const users = this.users();
    users[phone] = { phone, name: '', city: '', branch: '', createdAt: Date.now(), orders: demoOrders() };
    this.saveUsers(users);
    this.login(phone);
  },

  update(fields) {
    const user = this.current();
    if (!user) return;
    const users = this.users();
    users[user.phone] = { ...users[user.phone], ...fields };
    this.saveUsers(users);
    this.emit();
  },

  emit() { document.dispatchEvent(new CustomEvent('auth:change')); },
};

/* ---------- Модальне вікно ---------- */
const ICON_CLOSE = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const ICON_EYE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

function authModalTemplate() {
  const otp = Array.from({ length: CODE_LENGTH }, (_, i) =>
    `<input class="otp__box" type="text" inputmode="numeric" maxlength="1" aria-label="Цифра ${i + 1}" ${i === 0 ? 'autocomplete="one-time-code"' : 'autocomplete="off"'}>`).join('');

  return `
  <div class="auth" id="auth" aria-hidden="true">
    <div class="auth__backdrop" data-auth-close></div>
    <div class="auth__dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button type="button" class="auth__close" data-auth-close aria-label="Закрити">${ICON_CLOSE}</button>

      <div class="auth__main">
        <!-- Вхід -->
        <form class="auth-view" data-view="login" novalidate>
          <p class="auth__eyebrow">Кабінет</p>
          <h2 class="auth__title" id="auth-title">Вхід</h2>
          <p class="auth__text">Введіть номер телефону — ми надішлемо SMS з кодом підтвердження.</p>
          <label class="field">
            <span class="field__label">Номер телефону</span>
            <input class="field__input" type="tel" name="phone" inputmode="tel" autocomplete="tel" placeholder="+380 (__) ___-__-__" data-phone>
            <span class="field__error"></span>
          </label>
          <button type="submit" class="btn btn--dark btn--block">Отримати код</button>
          <p class="auth__alt">Немає акаунта? <button type="button" data-auth-go="register">Зареєструватися</button></p>
        </form>

        <!-- Реєстрація -->
        <form class="auth-view" data-view="register" novalidate hidden>
          <p class="auth__eyebrow">Новий клієнт</p>
          <h2 class="auth__title">Реєстрація</h2>
          <p class="auth__text">Створіть акаунт, щоб відстежувати замовлення та зберігати обране.</p>
          <label class="field">
            <span class="field__label">Номер телефону</span>
            <input class="field__input" type="tel" name="phone" inputmode="tel" autocomplete="tel" placeholder="+380 (__) ___-__-__" data-phone>
            <span class="field__error"></span>
          </label>
          <label class="field">
            <span class="field__label">Пароль</span>
            <span class="field__wrap">
              <input class="field__input" type="password" name="password" autocomplete="new-password" placeholder="Мінімум 6 символів">
              <button type="button" class="field__eye" data-eye aria-label="Показати пароль">${ICON_EYE}</button>
            </span>
            <span class="field__error"></span>
          </label>
          <label class="field">
            <span class="field__label">Підтвердження пароля</span>
            <span class="field__wrap">
              <input class="field__input" type="password" name="password2" autocomplete="new-password" placeholder="Повторіть пароль">
              <button type="button" class="field__eye" data-eye aria-label="Показати пароль">${ICON_EYE}</button>
            </span>
            <span class="field__error"></span>
          </label>
          <button type="submit" class="btn btn--dark btn--block">Зареєструватися</button>
          <p class="auth__alt">Вже є акаунт? <button type="button" data-auth-go="login">Увійти</button></p>
        </form>

        <!-- Код з SMS -->
        <form class="auth-view" data-view="code" novalidate hidden>
          <button type="button" class="auth__back" data-auth-back>‹ Назад</button>
          <p class="auth__eyebrow">Підтвердження</p>
          <h2 class="auth__title">Код з SMS</h2>
          <p class="auth__text">Ми надіслали код на номер <strong data-code-phone></strong></p>
          <div class="otp">${otp}</div>
          <span class="otp__error" data-otp-error></span>
          <p class="auth__demo" data-demo hidden>Демо-режим: SMS не надсилається. Ваш код — <b data-demo-code></b></p>
          <button type="submit" class="btn btn--dark btn--block">Підтвердити</button>
          <p class="auth__resend">
            <button type="button" data-resend disabled>Надіслати код повторно</button>
            <span data-timer></span>
          </p>
        </form>
      </div>

      <aside class="auth__side">
        <p class="auth__side-logo">Giovane Gentile</p>
        <div data-side="login">
          <h3>Реєстрація</h3>
          <p>Немає облікового запису? Зареєструйтесь — це займе хвилину.</p>
          <button type="button" class="btn btn--light" data-auth-go="register">Зареєструватися</button>
        </div>
        <div data-side="register" hidden>
          <h3>Вже з нами?</h3>
          <p>Увійдіть за номером телефону — без пароля, лише код з SMS.</p>
          <button type="button" class="btn btn--light" data-auth-go="login">Увійти</button>
        </div>
        <ul class="auth__perks">
          <li>Історія та статус замовлень</li>
          <li>Список бажань на всіх пристроях</li>
          <li>Швидке оформлення доставки</li>
        </ul>
      </aside>
    </div>
  </div>`;
}

const AuthModal = {
  el: null,
  mode: 'login',     // login | register
  pending: null,     // { phone, purpose }
  timer: null,

  build() {
    document.body.insertAdjacentHTML('beforeend', authModalTemplate());
    this.el = document.getElementById('auth');
    const el = this.el;

    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-auth-close]')) this.close();
      const go = e.target.closest('[data-auth-go]');
      if (go) this.show(go.dataset.authGo);
      if (e.target.closest('[data-auth-back]')) this.show(this.mode);
      const eye = e.target.closest('[data-eye]');
      if (eye) {
        const input = eye.parentElement.querySelector('input');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        eye.classList.toggle('is-on', show);
        eye.setAttribute('aria-label', show ? 'Сховати пароль' : 'Показати пароль');
      }
      if (e.target.closest('[data-resend]')) this.sendCode(true);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.classList.contains('is-open')) this.close();
    });

    // Phone mask
    el.querySelectorAll('[data-phone]').forEach((input) => {
      input.addEventListener('focus', () => { if (!input.value) input.value = '+380'; });
      input.addEventListener('blur', () => { if (input.value === '+380') input.value = ''; });
      input.addEventListener('input', () => {
        input.value = formatPhone(input.value);
        this.setError(input, '');
      });
    });
    el.querySelectorAll('input[type="password"]').forEach((input) =>
      input.addEventListener('input', () => this.setError(input, '')));

    this.initOtp();

    el.querySelector('[data-view="login"]').addEventListener('submit', (e) => { e.preventDefault(); this.submitLogin(e.target); });
    el.querySelector('[data-view="register"]').addEventListener('submit', (e) => { e.preventDefault(); this.submitRegister(e.target); });
    el.querySelector('[data-view="code"]').addEventListener('submit', (e) => { e.preventDefault(); this.submitCode(); });
  },

  open(mode = 'login') {
    if (!this.el) this.build();
    this.show(mode);
    this.el.classList.add('is-open');
    this.el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this.el) return;
    this.el.classList.remove('is-open');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    clearInterval(this.timer);
  },

  show(view) {
    if (view === 'login' || view === 'register') this.mode = view;
    this.el.querySelectorAll('.auth-view').forEach((v) => { v.hidden = v.dataset.view !== view; });
    this.el.querySelectorAll('[data-side]').forEach((s) => { s.hidden = s.dataset.side !== this.mode; });
    this.el.querySelector('.auth__dialog').dataset.mode = view;
    const first = this.el.querySelector(`[data-view="${view}"] input`);
    if (first) setTimeout(() => first.focus(), 60);
  },

  setError(input, text) {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.toggle('is-invalid', Boolean(text));
    field.querySelector('.field__error').innerHTML = text;
  },

  submitLogin(form) {
    const input = form.elements.phone;
    const phone = phoneDigits(input.value);
    if (phone.length !== 12) return this.setError(input, 'Вкажіть коректний номер телефону');
    if (!Auth.exists(phone)) {
      return this.setError(input, 'Цей номер ще не зареєстровано. <button type="button" data-auth-go="register">Зареєструватися</button>');
    }
    this.pending = { phone, purpose: 'login' };
    this.sendCode();
  },

  submitRegister(form) {
    const { phone: phoneInput, password, password2 } = form.elements;
    const phone = phoneDigits(phoneInput.value);
    let ok = true;

    if (phone.length !== 12) { this.setError(phoneInput, 'Вкажіть коректний номер телефону'); ok = false; }
    else if (Auth.exists(phone)) {
      this.setError(phoneInput, 'Цей номер уже зареєстровано. <button type="button" data-auth-go="login">Увійти</button>');
      ok = false;
    }
    if (password.value.length < 6) { this.setError(password, 'Пароль має містити щонайменше 6 символів'); ok = false; }
    if (password2.value !== password.value || !password2.value) { this.setError(password2, 'Паролі не збігаються'); ok = false; }
    if (!ok) return;

    this.pending = { phone, purpose: 'register' };
    this.sendCode();
  },

  async sendCode(isResend = false) {
    const { phone } = this.pending;
    const res = await sendSmsCode(phone);

    const view = this.el.querySelector('[data-view="code"]');
    view.querySelector('[data-code-phone]').textContent = formatPhone(phone);
    const demo = view.querySelector('[data-demo]');
    demo.hidden = !res.demoCode;
    view.querySelector('[data-demo-code]').textContent = res.demoCode || '';
    this.clearOtp();
    if (!isResend) this.show('code');
    else showToast('Новий код надіслано');
    this.startTimer();
  },

  startTimer() {
    const btn = this.el.querySelector('[data-resend]');
    const out = this.el.querySelector('[data-timer]');
    let left = RESEND_SECONDS;
    btn.disabled = true;
    clearInterval(this.timer);
    const tick = () => {
      out.textContent = left > 0 ? `через ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '';
      if (left <= 0) { btn.disabled = false; clearInterval(this.timer); }
      left -= 1;
    };
    tick();
    this.timer = setInterval(tick, 1000);
  },

  initOtp() {
    const boxes = [...this.el.querySelectorAll('.otp__box')];
    boxes.forEach((box, i) => {
      box.addEventListener('input', () => {
        box.value = box.value.replace(/\D/g, '').slice(-1);
        this.el.querySelector('[data-otp-error]').textContent = '';
        boxes.forEach((b) => b.classList.remove('is-invalid'));
        if (box.value && boxes[i + 1]) boxes[i + 1].focus();
        if (boxes.every((b) => b.value)) this.submitCode();
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && boxes[i - 1]) boxes[i - 1].focus();
        if (e.key === 'ArrowLeft' && boxes[i - 1]) boxes[i - 1].focus();
        if (e.key === 'ArrowRight' && boxes[i + 1]) boxes[i + 1].focus();
      });
      box.addEventListener('paste', (e) => {
        const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, CODE_LENGTH);
        if (!digits) return;
        e.preventDefault();
        boxes.forEach((b, j) => { b.value = digits[j] || ''; });
        (boxes[digits.length] || boxes[CODE_LENGTH - 1]).focus();
        if (digits.length === CODE_LENGTH) this.submitCode();
      });
    });
  },

  clearOtp() {
    this.el.querySelectorAll('.otp__box').forEach((b) => { b.value = ''; b.classList.remove('is-invalid'); });
    this.el.querySelector('[data-otp-error]').textContent = '';
  },

  async submitCode() {
    const boxes = [...this.el.querySelectorAll('.otp__box')];
    const code = boxes.map((b) => b.value).join('');
    const error = this.el.querySelector('[data-otp-error]');

    if (code.length !== CODE_LENGTH) {
      error.textContent = 'Введіть усі цифри коду';
      return;
    }
    const ok = await verifySmsCode(this.pending.phone, code);
    if (!ok) {
      error.textContent = 'Невірний код. Спробуйте ще раз';
      boxes.forEach((b) => b.classList.add('is-invalid'));
      this.el.querySelector('.otp').classList.remove('is-shake');
      void this.el.offsetWidth;
      this.el.querySelector('.otp').classList.add('is-shake');
      return;
    }

    const { phone, purpose } = this.pending;
    if (purpose === 'register') Auth.register(phone);
    else Auth.login(phone);

    this.close();
    this.el.querySelectorAll('form').forEach((f) => f.reset());
    location.href = purpose === 'register' ? 'account.html#profile' : 'account.html#orders';
  },
};

/* ---------- «Кабінет» у верхній панелі ---------- */
function accountMenuTemplate(user) {
  const title = user.name ? escHtml(user.name) : formatPhone(user.phone);
  return `
    <div class="account-menu" role="menu">
      <p class="account-menu__user">${title}</p>
      <a href="account.html#profile" role="menuitem">Особисті дані</a>
      <a href="account.html#orders" role="menuitem">Замовлення</a>
      <a href="account.html#wishlist" role="menuitem">Список бажань</a>
      <button type="button" data-logout role="menuitem">Вихід</button>
    </div>`;
}

function initAccountLinks() {
  // Кліки по «Кабінет»: гість → вікно входу, клієнт → сторінка кабінету
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-account]');
    if (link && !Auth.current()) {
      e.preventDefault();
      AuthModal.open('login');
    }
    if (e.target.closest('[data-logout]')) {
      Auth.logout();
      location.href = 'index.html';
    }
  });

  // Випадаюче меню (як у референсі) для авторизованого клієнта
  const sync = () => {
    const user = Auth.current();
    document.querySelectorAll('.topbar__account').forEach((link) => {
      let wrap = link.parentElement.classList.contains('topbar__account-wrap') ? link.parentElement : null;
      if (!wrap) {
        wrap = document.createElement('span');
        wrap.className = 'topbar__account-wrap';
        link.replaceWith(wrap);
        wrap.appendChild(link);
      }
      wrap.querySelector('.account-menu')?.remove();
      link.classList.toggle('is-logged', Boolean(user));
      if (user) wrap.insertAdjacentHTML('beforeend', accountMenuTemplate(user));
    });
  };
  document.addEventListener('auth:change', sync);
  window.addEventListener('storage', (e) => {
    if (e.key === Auth.SESSION || e.key === Auth.USERS) Auth.emit();
  });
  sync();
}

document.addEventListener('DOMContentLoaded', initAccountLinks);
