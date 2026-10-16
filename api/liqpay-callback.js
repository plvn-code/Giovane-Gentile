// Vercel serverless — приймає server-колбек LiqPay і оновлює статус замовлення.
// Використовується лише в реальному режимі LiqPay (коли задані ключі).
// Потрібні env: LIQPAY_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const priv = process.env.LIQPAY_PRIVATE_KEY;
  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_KEY;

  let body = req.body;
  if (typeof body === 'string') { try { body = Object.fromEntries(new URLSearchParams(body)); } catch (e) { body = {}; } }
  const { data, signature } = body || {};
  if (!data || !signature || !priv) { res.status(400).json({ error: 'bad request' }); return; }

  const expected = crypto.createHash('sha1').update(priv + data + priv).digest('base64');
  if (expected !== signature) { res.status(403).json({ error: 'invalid signature' }); return; }

  let payload = {};
  try { payload = JSON.parse(Buffer.from(data, 'base64').toString('utf8')); } catch (e) { /* ignore */ }
  const orderId = payload.order_id;
  const status = payload.status; // success | sandbox | failure | ...

  if (orderId && sbUrl && sbKey) {
    try {
      await fetch(`${sbUrl}/rest/v1/orders?liqpay_order_id=eq.${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          liqpay_status: status,
          status: (status === 'success' || status === 'sandbox') ? 'paid' : 'failed',
        }),
      });
    } catch (e) { /* ignore */ }
  }

  res.status(200).json({ ok: true });
};
