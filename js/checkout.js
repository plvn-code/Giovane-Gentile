/* =========================================================
   Giovane Gentile — оформлення замовлення + оплата LiqPay (демо)
   ========================================================= */

const money = (n) => `${Math.round(n).toLocaleString('uk-UA').replace(/\s|,/g, ' ')} ₴`;
const $c = (id) => document.getElementById(id);

function newOrderId() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `GG-${stamp}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function renderSummary() {
  const list = (typeof Cart !== 'undefined' ? Cart.all() : []);
  const box = $c('c-items');
  if (!list.length) {
    box.innerHTML = '<li class="checkout__empty">Кошик порожній</li>';
  } else {
    box.innerHTML = list.map((x) => `
      <li class="checkout__item">
        <span class="checkout__thumb">${x.image ? `<img src="${escHtml(x.image)}" alt="">` : ''}</span>
        <span class="checkout__item-info">
          <span class="checkout__item-name">${escHtml(x.name)}</span>
          <span class="checkout__item-meta">Розмір: ${escHtml(x.size)} · ${x.qty} шт</span>
        </span>
        <span class="checkout__item-price">${money(x.price * x.qty)}</span>
      </li>`).join('');
  }
  $c('c-count').textContent = Cart.count();
  $c('c-total').textContent = money(Cart.total());
}

async function createOrder(orderId, customer, status) {
  const items = Cart.all().map((x) => ({
    id: x.id, name: x.name, size: x.size, qty: x.qty, price: x.price, image: x.image || '',
  }));
  const body = {
    items,
    total: Cart.total(),
    currency: 'UAH',
    status,
    customer,
    liqpay_order_id: orderId,
  };
  const res = await fetch(`${window.GG_SB.url}/rest/v1/orders`, {
    method: 'POST',
    headers: {
      apikey: window.GG_SB.key,
      Authorization: `Bearer ${window.GG_SB.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`order ${res.status}: ${await res.text()}`);
}

function showDone(orderId) {
  $c('done-order').textContent = orderId;
  $c('pay-done').hidden = false;
  document.body.style.overflow = 'hidden';
}

function initCheckout() {
  renderSummary();
  document.addEventListener('cart:change', renderSummary);

  // Повернення з LiqPay (реальний режим): ?order=..&paid=1
  const params = new URLSearchParams(location.search);
  if (params.get('paid') === '1' && params.get('order')) {
    try { Cart.save([]); } catch (e) { /* ignore */ }
    showDone(params.get('order'));
    return;
  }

  const form = $c('checkout-form');
  const errorEl = $c('c-error');
  const modal = $c('pay-modal');

  let pending = null; // { orderId, customer, amount }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    if (!Cart.all().length) { errorEl.textContent = 'Кошик порожній.'; errorEl.hidden = false; return; }
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const customer = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      city: form.city.value.trim(),
      address: form.address.value.trim(),
      comment: form.comment.value.trim(),
    };
    const orderId = newOrderId();
    const amount = Cart.total();
    const btn = $c('c-pay');
    btn.disabled = true; btn.textContent = 'Зачекайте…';

    try {
      const res = await fetch('/api/liqpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, orderId, description: `Замовлення ${orderId} — Giovane Gentile` }),
      });
      const data = await res.json();

      if (data.demo) {
        // Демо-режим: показуємо тестову оплату
        pending = { orderId, customer, amount };
        $c('pay-sum').textContent = money(amount);
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
      } else {
        // Реальний LiqPay: створюємо замовлення й редіректимо
        await createOrder(orderId, customer, 'new');
        $c('liqpay-data').value = data.data;
        $c('liqpay-signature').value = data.signature;
        $c('liqpay-form').submit();
        return;
      }
    } catch (err) {
      errorEl.textContent = 'Не вдалося почати оплату. Спробуйте ще раз.';
      errorEl.hidden = false;
      console.error(err);
    } finally {
      btn.disabled = false; btn.textContent = 'Перейти до оплати';
    }
  });

  // Демо-оплата: підтвердження
  $c('pay-confirm').addEventListener('click', async () => {
    if (!pending) return;
    const btn = $c('pay-confirm');
    btn.disabled = true; btn.textContent = 'Обробка…';
    try {
      await createOrder(pending.orderId, pending.customer, 'paid');
      Cart.save([]);
      modal.hidden = true;
      showDone(pending.orderId);
    } catch (err) {
      alert('Помилка оформлення замовлення. Спробуйте ще раз.');
      console.error(err);
    } finally {
      btn.disabled = false; btn.textContent = 'Сплатити';
    }
  });

  $c('pay-cancel').addEventListener('click', () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    pending = null;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  (window.GG_READY || Promise.resolve()).then(initCheckout);
});
