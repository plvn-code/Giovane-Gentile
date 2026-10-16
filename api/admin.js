// Vercel serverless — бекенд адмін-панелі Giovane Gentile.
// Захист: пароль у змінній оточення ADMIN_PASSWORD.
// Пише в базу через Supabase Management API (PAT у SUPABASE_PAT).
// Env: ADMIN_PASSWORD, SUPABASE_PAT, (опц.) SUPABASE_PROJECT_REF
const REF = process.env.SUPABASE_PROJECT_REF || 'zyhsvcncjunxjjzzgayx';

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.SUPABASE_PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`DB ${r.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch (e) { return []; }
}

const q = (v) => {
  if (v === null || v === undefined || v === '') return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const { token, action, payload } = body || {};

  if (!process.env.ADMIN_PASSWORD || token !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Невірний пароль' });
    return;
  }
  if (!process.env.SUPABASE_PAT) { res.status(500).json({ error: 'SUPABASE_PAT не налаштовано' }); return; }

  try {
    if (action === 'orders') {
      const rows = await sql('select * from public.orders order by created_at desc limit 200');
      res.status(200).json({ rows });
      return;
    }
    if (action === 'order_status') {
      const { id, status } = payload || {};
      await sql(`update public.orders set status=${q(status)} where id=${q(id)}`);
      res.status(200).json({ ok: true });
      return;
    }
    if (action === 'product_save') {
      const p = payload || {};
      const cols = {
        id: p.id, name: p.name, brand: p.brand, category: p.category,
        cat_key: p.cat_key, sub_key: p.sub_key, cat_title: p.cat_title,
        price: Number(p.price) || 0, old_price: p.old_price ? Number(p.old_price) : null,
        sale: !!p.sale, is_new: !!p.is_new, sku: p.sku, material: p.material, color: p.color,
        sizes: p.sizes || [], description: p.description,
        full_description: p.full_description || [], attributes: p.attributes || {},
        images: p.images || [], active: p.active !== false, sort: Number(p.sort) || 0,
      };
      const keys = Object.keys(cols);
      const vals = keys.map((k) => q(cols[k]));
      const updates = keys.filter((k) => k !== 'id').map((k) => `${k}=excluded.${k}`);
      await sql(`insert into public.products (${keys.join(',')}) values (${vals.join(',')})
                 on conflict (id) do update set ${updates.join(',')}`);
      res.status(200).json({ ok: true });
      return;
    }
    if (action === 'product_delete') {
      await sql(`delete from public.products where id=${q(payload.id)}`);
      res.status(200).json({ ok: true });
      return;
    }
    res.status(400).json({ error: 'Невідома дія' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
