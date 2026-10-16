// Vercel serverless function — підпис платежу LiqPay (sandbox-режим для демо).
// Ключі зберігаються в змінних оточення Vercel:
//   LIQPAY_PUBLIC_KEY, LIQPAY_PRIVATE_KEY
// Якщо ключів немає — повертає { demo: true }, і фронтенд показує демо-оплату.
const crypto = require('crypto');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const pub = process.env.LIQPAY_PUBLIC_KEY;
  const priv = process.env.LIQPAY_PRIVATE_KEY;

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const { amount, orderId, description } = body || {};

  if (!amount || !orderId) {
    res.status(400).json({ error: 'amount and orderId are required' });
    return;
  }

  // Ключі не налаштовані — демо-режим без реального LiqPay
  if (!pub || !priv) {
    res.status(200).json({ demo: true, reason: 'LiqPay keys are not configured' });
    return;
  }

  const origin = `https://${req.headers.host}`;
  const params = {
    version: 3,
    public_key: pub,
    action: 'pay',
    amount: Number(amount).toFixed(2),
    currency: 'UAH',
    description: description || `Замовлення ${orderId} — Giovane Gentile`,
    order_id: orderId,
    sandbox: '1', // ДЕМО: тестовий режим, реальні гроші не списуються
    language: 'uk',
    result_url: `${origin}/checkout.html?order=${encodeURIComponent(orderId)}&paid=1`,
    server_url: `${origin}/api/liqpay-callback`,
  };

  const data = Buffer.from(JSON.stringify(params)).toString('base64');
  const signature = crypto
    .createHash('sha1')
    .update(priv + data + priv)
    .digest('base64');

  res.status(200).json({ demo: false, data, signature, checkout: 'https://www.liqpay.ua/api/3/checkout' });
};
