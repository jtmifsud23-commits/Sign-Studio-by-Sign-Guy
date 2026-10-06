import { createHmac, timingSafeEqual } from 'node:crypto';
import { enqueuePaidOrder } from '../../src/order-notifications.js';

// A Web Standard handler avoids Vercel's Node request.body JSON helper.
// HMAC covers the exact original bytes, including whitespace and Unicode.
export function validWebhookSignature(body, signature, secret) {
  if (!secret || !/^[A-Za-z0-9+/]{43}=$/.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(body).digest();
  const received = Buffer.from(signature, 'base64');
  return expected.length === received.length && timingSafeEqual(expected, received);
}
export function createPaidWebhook({ env = process.env, processOrder = enqueuePaidOrder } = {}) {
  return async (req) => {
    const reply = (status, payload, headers) => Response.json(payload, { status, headers });
    if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' }, { Allow: 'POST' });
    const shop = String(env.SHOPIFY_STORE_DOMAIN || '').trim().toLowerCase();
    const secret = env.SHOPIFY_WEBHOOK_SECRET || env.SHOPIFY_CLIENT_SECRET;
    if (!shop || !secret) return reply(503, { error: 'Payment notifications are not configured' });
    let body;
    try {
      body = Buffer.from(await req.arrayBuffer());
      if (body.length > 4 * 1024 * 1024) throw new Error('Body too large');
    }
    catch { return reply(400, { error: 'Invalid webhook body' }); }
    if (!validWebhookSignature(body, req.headers.get('x-shopify-hmac-sha256') || '', secret)) return reply(401, { error: 'Invalid signature' });
    if ((req.headers.get('x-shopify-shop-domain') || '').toLowerCase() !== shop || req.headers.get('x-shopify-topic') !== 'orders/paid') {
      return reply(403, { error: 'Unexpected Shopify shop or topic' });
    }
    let order;
    try { order = JSON.parse(body.toString('utf8')); }
    catch { return reply(400, { error: 'Invalid JSON' }); }
    if (!order || typeof order !== 'object' || Array.isArray(order)) return reply(400, { error: 'Invalid order payload' });
    if (order.financial_status !== 'paid') return reply(422, { error: 'Payment is not confirmed' });
    try {
      const result = await processOrder(order, shop);
      return reply(200, { ok: true, ...result });
    } catch (error) {
      console.error('Could not record Shopify paid event.', { errorType: error?.name || 'Error' });
      // Acknowledge only after the receipt and its queue message are durable.
      return reply(503, { error: 'Could not record payment notification' });
    }
  };
}
export default { fetch: createPaidWebhook() };
