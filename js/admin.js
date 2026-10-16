/* =========================================================
   Giovane Gentile — адмін-панель (клієнтська логіка)
   ========================================================= */
const TOKEN_KEY = 'gg_admin_token';
let TOKEN = sessionStorage.getItem(TOKEN_KEY) || '';
let PRODUCTS = [];

const $ = (id) => document.getElementById(id);
const esc = window.escHtml;
const money = (n) => `${Math.round(n || 0).toLocaleString('uk-UA').replace(/\s|,/g, ' ')} ₴`;

const SIZE_DEFAULTS = {
  odyag: ['46', '48', '50', '52', '54', '56'],
  vzuttya: ['40', '41', '42', '43', '44', '45'],
  aksesuary: ['One size'],
};
const CAT_TITLES = { odyag: 'Одяг', vzuttya: 'Взуття', aksesuary: 'Аксесуари' };

async function api(action, payload) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: TOKEN, action, payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/* ---------- Auth ---------- */
async function enterApp() {
  $('login').hidden = true;
  $('app').hidden = false;
  await loadProducts();
}

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  TOKEN = $('login-pass').value;
  $('login-err').textContent = '';
  try {
    await api('orders'); // перевірка пароля
    sessionStorage.setItem(TOKEN_KEY, TOKEN);
    await enterApp();
  } catch (err) {
    $('login-err').textContent = err.message === 'Невірний пароль' ? 'Невірний пароль' : 'Помилка входу: ' + err.message;
  }
});

$('logout').addEventListener('click', () => {
  sessionStorage.removeItem(TOKEN_KEY);
  TOKEN = '';
  location.reload();
});

/* ---------- Tabs ---------- */
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
  const tab = t.dataset.tab;
  $('view-products').hidden = tab !== 'products';
  $('view-orders').hidden = tab !== 'orders';
  if (tab === 'orders') loadOrders();
}));

/* ---------- Products ---------- */
async function loadProducts() {
  $('prod-stat').textContent = 'Завантаження…';
  const res = await fetch(`${window.GG_SB.url}/rest/v1/products?select=*&order=sort.asc`, {
    headers: { apikey: window.GG_SB.key, Authorization: `Bearer ${window.GG_SB.key}` },
  });
  PRODUCTS = await res.json();
  renderProducts();
}

function renderProducts() {
  const term = ($('prod-search').value || '').toLowerCase();
  const list = PRODUCTS.filter((p) =>
    !term || `${p.name} ${p.brand} ${p.sku} ${p.category}`.toLowerCase().includes(term));
  $('prod-stat').textContent = `${list.length} товарів`;
  $('prod-rows').innerHTML = list.map((p) => {
    const img = (p.images && p.images[0]) || '';
    const flags = [
      p.is_new ? '<span class="pill pill--new">New</span>' : '',
      p.sale ? '<span class="pill pill--sale">Sale</span>' : '',
      p.active === false ? '<span class="pill pill--pending">off</span>' : '',
    ].join(' ');
    const price = p.old_price ? `<s class="muted">${money(p.old_price)}</s> ${money(p.price)}` : money(p.price);
    return `<tr>
      <td>${img ? `<img class="thumb" src="${esc(img)}" alt="">` : ''}</td>
      <td><b>${esc(p.name)}</b><br><span class="muted">${esc(p.id)}</span></td>
      <td class="hide-sm">${esc(p.cat_title || '')} · ${esc(p.category || '')}</td>
      <td>${price}</td>
      <td class="hide-sm">${flags}</td>
      <td style="white-space:nowrap">
        <button class="btn btn--ghost btn--sm" data-edit="${esc(p.id)}">Редагувати</button>
        <button class="btn btn--danger btn--sm" data-del="${esc(p.id)}">✕</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" class="muted">Нічого не знайдено</td></tr>';
}

$('prod-search').addEventListener('input', renderProducts);

$('prod-rows').addEventListener('click', async (e) => {
  const edit = e.target.closest('[data-edit]');
  const del = e.target.closest('[data-del]');
  if (edit) { openProductModal(PRODUCTS.find((p) => p.id === edit.dataset.edit)); }
  if (del) {
    const p = PRODUCTS.find((x) => x.id === del.dataset.del);
    if (confirm(`Видалити товар «${p.name}»?`)) {
      await api('product_delete', { id: p.id });
      await loadProducts();
    }
  }
});

$('add-product').addEventListener('click', () => openProductModal(null));

function openProductModal(p) {
  $('pm-title').textContent = p ? 'Редагувати товар' : 'Новий товар';
  $('pm-err').textContent = '';
  $('pm-id').value = p ? p.id : '';
  $('pm-id').readOnly = !!p;
  $('pm-name').value = p ? p.name : '';
  $('pm-brand').value = p ? (p.brand || '') : '';
  $('pm-sku').value = p ? (p.sku || '') : '';
  $('pm-catkey').value = p ? (p.cat_key || 'odyag') : 'odyag';
  $('pm-subkey').value = p ? (p.sub_key || '') : '';
  $('pm-category').value = p ? (p.category || '') : '';
  $('pm-material').value = p ? (p.material || '') : '';
  $('pm-color').value = p ? (p.color || '') : '';
  $('pm-price').value = p ? p.price : '';
  $('pm-oldprice').value = p && p.old_price ? p.old_price : '';
  $('pm-sort').value = p ? (p.sort || 0) : (PRODUCTS.length + 1);
  $('pm-desc').value = p ? (p.description || '') : '';
  $('pm-images').value = p && p.images ? p.images.join(', ') : '';
  $('pm-new').checked = p ? !!p.is_new : false;
  $('pm-sale').checked = p ? !!p.sale : false;
  $('pm-active').checked = p ? p.active !== false : true;
  $('pm-form').dataset.editing = p ? p.id : '';
  $('pm-modal').hidden = false;
}

$('pm-cancel').addEventListener('click', () => { $('pm-modal').hidden = true; });

$('pm-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('pm-err').textContent = '';
  const editingId = $('pm-form').dataset.editing;
  const existing = PRODUCTS.find((p) => p.id === editingId);
  const catKey = $('pm-catkey').value;
  const images = $('pm-images').value.split(',').map((s) => s.trim()).filter(Boolean);
  const price = Number($('pm-price').value);
  const oldPrice = $('pm-oldprice').value ? Number($('pm-oldprice').value) : null;
  const category = $('pm-category').value.trim();
  const sizes = existing && existing.sizes && existing.sizes.length
    ? existing.sizes
    : (SIZE_DEFAULTS[catKey] || ['One size']).map((label) => ({ label, available: true }));
  const desc = $('pm-desc').value.trim();
  const material = $('pm-material').value.trim();
  const color = $('pm-color').value.trim();

  const payload = {
    id: $('pm-id').value.trim(),
    name: $('pm-name').value.trim(),
    brand: $('pm-brand').value.trim(),
    category,
    cat_key: catKey,
    sub_key: $('pm-subkey').value.trim(),
    cat_title: CAT_TITLES[catKey],
    price,
    old_price: oldPrice,
    sale: $('pm-sale').checked,
    is_new: $('pm-new').checked,
    sku: $('pm-sku').value.trim(),
    material,
    color,
    sizes,
    description: desc,
    full_description: existing && existing.full_description && existing.full_description.length
      ? existing.full_description
      : [desc, material ? `Матеріал — ${material}${color ? `, колір — ${color}` : ''}. Виготовлено в Італії.` : 'Виготовлено в Італії.'].filter(Boolean),
    attributes: {
      ...(existing && existing.attributes ? existing.attributes : {}),
      Бренд: $('pm-brand').value.trim(),
      Матеріал: material,
      Колір: color,
      Вид: category,
    },
    images,
    active: $('pm-active').checked,
    sort: Number($('pm-sort').value) || 0,
  };

  const btn = $('pm-save'); btn.disabled = true; btn.textContent = 'Збереження…';
  try {
    await api('product_save', payload);
    $('pm-modal').hidden = true;
    await loadProducts();
  } catch (err) {
    $('pm-err').textContent = 'Помилка: ' + err.message;
  } finally {
    btn.disabled = false; btn.textContent = 'Зберегти';
  }
});

/* ---------- Orders ---------- */
async function loadOrders() {
  $('orders-stat').textContent = 'Завантаження…';
  try {
    const { rows } = await api('orders');
    $('orders-stat').textContent = `${rows.length} замовлень`;
    $('order-rows').innerHTML = rows.map((o) => {
      const c = o.customer || {};
      const items = (o.items || []).map((i) => `${esc(i.name)} ×${i.qty}`).join('<br>');
      const statusPill = o.status === 'paid'
        ? '<span class="pill pill--paid">оплачено</span>'
        : '<span class="pill pill--pending">' + esc(o.status || 'new') + '</span>';
      const d = o.created_at ? new Date(o.created_at).toLocaleString('uk-UA') : '';
      return `<tr>
        <td><b>${esc(o.liqpay_order_id || o.id.slice(0, 8))}</b><br><span class="muted">${esc(d)}</span></td>
        <td>${esc(c.name || '')}<br><span class="muted">${esc(c.phone || '')}</span><br><span class="muted">${esc(c.city || '')}, ${esc(c.address || '')}</span></td>
        <td class="hide-sm">${items}</td>
        <td><b>${money(o.total)}</b></td>
        <td>${statusPill}<br>
          <select class="status" data-order="${esc(o.id)}">
            ${['new', 'paid', 'shipped', 'done', 'cancelled'].map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="5" class="muted">Замовлень поки немає</td></tr>';
  } catch (err) {
    $('orders-stat').textContent = 'Помилка: ' + err.message;
  }
}

$('orders-refresh').addEventListener('click', loadOrders);
$('order-rows').addEventListener('change', async (e) => {
  const sel = e.target.closest('.status');
  if (!sel) return;
  try { await api('order_status', { id: sel.dataset.order, status: sel.value }); await loadOrders(); }
  catch (err) { alert('Помилка: ' + err.message); }
});

/* ---------- Автовхід, якщо токен збережено ---------- */
(async () => {
  if (TOKEN) { try { await api('orders'); await enterApp(); } catch (e) { sessionStorage.removeItem(TOKEN_KEY); TOKEN = ''; } }
})();
