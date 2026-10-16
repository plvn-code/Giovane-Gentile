/* =========================================================
   Giovane Gentile — підключення до Supabase
   Завантажує товари з бази (REST, публічне читання) один раз
   і будує мапи, якими користуються products.js / catalog.js /
   product.js / main.js. Готовність — у window.GG_READY (Promise).
   ========================================================= */

window.GG_SB = {
  url: 'https://zyhsvcncjunxjjzzgayx.supabase.co',
  key: 'sb_publishable_IioBkpu1bH8b2gRt9VtLaA_8bFWN_nU',
};

/* Глобальний escHtml — на сторінках без auth.js (напр. checkout) */
if (typeof window.escHtml === 'undefined') {
  window.escHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* Рядок бази → обʼєкт товару у форматі, який очікує фронтенд */
function ggMapProduct(row) {
  const tags = [row.category];
  if (row.is_new) tags.push('Новинки');
  if (row.sale) tags.push('Sale');
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    catKey: row.cat_key,
    subKey: row.sub_key,
    catTitle: row.cat_title,
    price: row.price,
    oldPrice: row.old_price,
    sale: !!row.sale,
    isNew: !!row.is_new,
    sku: row.sku,
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    description: row.description,
    fullDescription: Array.isArray(row.full_description) ? row.full_description : [],
    attributes: row.attributes && typeof row.attributes === 'object' ? row.attributes : {},
    images: Array.isArray(row.images) ? row.images : [],
    tags,
    demo: false,
  };
}

window.GG_PRODUCTS = [];
window.GG_PRODUCTS_BY_ID = {};

async function ggLoadProducts() {
  try {
    const res = await fetch(
      `${window.GG_SB.url}/rest/v1/products?select=*&active=eq.true&order=sort.asc`,
      { headers: { apikey: window.GG_SB.key, Authorization: `Bearer ${window.GG_SB.key}` } },
    );
    if (!res.ok) throw new Error(`REST ${res.status}`);
    const rows = await res.json();
    const list = rows.map(ggMapProduct);
    window.GG_PRODUCTS = list;
    const byId = {};
    list.forEach((p) => { byId[p.id] = p; });
    window.GG_PRODUCTS_BY_ID = byId;
    return list;
  } catch (e) {
    console.warn('[GG] Не вдалося завантажити товари з Supabase:', e.message);
    window.GG_PRODUCTS = [];
    window.GG_PRODUCTS_BY_ID = {};
    return [];
  }
}

/* Товари розділу/підрозділу для каталогу.
   catKey 'new' / 'sale' — це наскрізні фільтри по прапорцях,
   де subKey (якщо є) — група (odyag / vzuttya / aksesuary). */
window.ggCatalogProducts = function ggCatalogProducts(catKey, subKey) {
  const all = window.GG_PRODUCTS || [];
  if (catKey === 'new' || catKey === 'sale') {
    return all.filter((p) => (catKey === 'new' ? p.isNew : p.sale)
      && (!subKey || p.catKey === subKey));
  }
  return all.filter((p) => p.catKey === catKey && (!subKey || p.subKey === subKey));
};

window.GG_READY = ggLoadProducts();
