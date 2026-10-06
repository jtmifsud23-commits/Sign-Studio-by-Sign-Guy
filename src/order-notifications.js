import { createHash, randomUUID } from 'node:crypto';
import { QueueClient } from '@vercel/queue';
import { createOnce, studioStore } from './studio-storage.js';
import { designPath, validDesignId } from './design-records.js';

export const EMAIL_TOPIC = 'studio-order-email';
export const PAID_TOPIC = 'studio-paid-order';
const queue = new QueueClient({ region: 'iad1' });
export const publishEmail = (jobId) => queue.send(EMAIL_TOPIC, { jobId }, {
  idempotencyKey: jobId, retentionSeconds: 604800,
});
export const publishPayment = receiptId => queue.send(PAID_TOPIC, { receiptId }, {
  idempotencyKey: receiptId, retentionSeconds: 604800,
});
const receiptPath = id => {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Invalid paid receipt ID');
  return `studio/paid-events/${id}.json`;
};
export const jobPath = id => {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Invalid notification ID');
  return `studio/notifications/${id}.json`;
};
const statePath = id => jobPath(id).replace('.json', '-state.json');
export async function enqueueEmail(record, event, { store = studioStore, publish = publishEmail } = {}) {
  const jobId = createHash('sha256').update(`${event.kind}:${event.shop || ''}:${event.orderId || ''}:${record.designId}`).digest('hex');
  const job = { schemaVersion: 1, jobId, designId: record.designId, event };
  await createOnce(store, jobPath(jobId), job, existing => JSON.stringify(existing) === JSON.stringify(job));
  const state = await store.read(statePath(jobId));
  if (state?.value.status !== 'sent') await publish(jobId);
  return jobId;
}

export async function deliverEmail(jobId, {
  store = studioStore, sendMail, now = () => Date.now(), leaseToken = randomUUID(),
} = {}) {
  const saved = await store.read(jobPath(jobId));
  if (!saved) throw new Error('Queued notification record missing');
  const job = saved.value;
  if (!validDesignId(job.designId)) throw new Error('Invalid queued design');
  const record = await store.read(designPath(job.designId));
  if (!record) throw new Error('Queued design record missing');
  const pathname = statePath(jobId);
  const previous = await store.read(pathname);
  if (previous?.value.status === 'sent') return { duplicate: true };
  if (previous?.value.status === 'sending' && previous.value.leaseUntil > now()) {
    throw new Error('Notification is already being delivered');
  }
  const claim = {
    status: 'sending', leaseToken, leaseUntil: now() + 300000,
    attempts: (previous?.value.attempts || 0) + 1,
  };
  if (previous) await store.replace(pathname, claim, previous.etag);
  else await store.create(pathname, claim);
  try {
    await sendMail(record.value, job.event, jobId);
    const current = await store.read(pathname);
    if (current?.value.leaseToken !== leaseToken) throw new Error('Notification lease changed');
    await store.replace(pathname, { ...claim, status: 'sent', sentAt: new Date(now()).toISOString(), leaseUntil: null }, current.etag);
  } catch (error) {
    const current = await store.read(pathname);
    if (current?.value.leaseToken === leaseToken) {
      await store.replace(pathname, { ...claim, status: 'retry', leaseUntil: null, failedAt: new Date(now()).toISOString() }, current.etag);
    }
    throw error;
  }
  return { sent: true };
}

export async function recordPaidOrder(order, shop, { store = studioStore, publish = publishEmail } = {}) {
  if (order.financial_status !== 'paid') throw new Error('Order is not paid');
  const orderId = String(order.id || '');
  if (!/^\d+$/.test(orderId) || !order.name) throw new Error('Invalid Shopify order');
  const groups = new Map();
  for (const line of order.line_items || []) {
    const id = (line.properties || []).find(property => property.name === '_Studio design ID')?.value;
    if (id == null || id === '') continue;
    if (!validDesignId(id)) throw new Error('Invalid design ID in Shopify order');
    const quantity = Number(line.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || !line.id) throw new Error('Invalid Shopify line item');
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push({ lineItemId: String(line.id), variantId: String(line.variant_id || ''), quantity, title: String(line.title || '') });
  }
  // Validate every design before recording or queuing any part of a mixed order.
  const records = await Promise.all([...groups.keys()].map(async id => {
    const saved = await store.read(designPath(id));
    if (!saved || saved.value.submissionStatus !== 'checkout_pending') throw new Error('Paid design record unavailable');
    return saved.value;
  }));
  for (const record of records) {
    const event = {
      kind: 'paid', shop, orderId, orderName: String(order.name),
      // Do not use delivery timestamps or delivery IDs in this immutable event.
      test: order.test === true, lineItems: groups.get(record.designId).sort((a, b) => a.lineItemId.localeCompare(b.lineItemId)),
    };
    await createOnce(store, `studio/payments/${shop}/${orderId}/${record.designId}.json`, {
      schemaVersion: 1, designId: record.designId, ...event,
    }, existing => JSON.stringify(existing) === JSON.stringify({ schemaVersion: 1, designId: record.designId, ...event }));
    await enqueueEmail(record, event, { store, publish });
  }
  return { designs: records.length };
}

export async function enqueuePaidOrder(order, shop, { store = studioStore, publish = publishPayment } = {}) {
  if (order.financial_status !== 'paid' || !/^\d+$/.test(String(order.id || '')) || !order.name) throw new Error('Invalid paid order');
  if (!/^[a-z0-9-]+\.myshopify\.com$/.test(shop)) throw new Error('Invalid Shopify shop');
  const lines = (order.line_items || []).filter(line => (line.properties || []).some(property => property.name === '_Studio design ID' && property.value));
  if (!lines.length) return { designs: 0 };
  // Save only fields needed for design linkage; exclude addresses and payment details.
  const payment = {
    id: String(order.id), name: String(order.name), financial_status: 'paid', test: order.test === true,
    line_items: lines.map(line => ({
      id: String(line.id || ''), variant_id: String(line.variant_id || ''), title: String(line.title || ''), quantity: line.quantity,
      properties: [{ name: '_Studio design ID', value: line.properties.find(property => property.name === '_Studio design ID').value }],
    })).sort((a, b) => a.id.localeCompare(b.id)),
  };
  for (const line of payment.line_items) {
    if (!validDesignId(line.properties[0].value) || !/^\d+$/.test(line.id) || !Number.isSafeInteger(line.quantity) || line.quantity < 1) throw new Error('Invalid Studio order line');
  }
  const receiptId = createHash('sha256').update(`${shop}:${payment.id}`).digest('hex');
  const receipt = { schemaVersion: 1, receiptId, shop, order: payment };
  await createOnce(store, receiptPath(receiptId), receipt, existing => JSON.stringify(existing) === JSON.stringify(receipt));
  if (!(await store.read(receiptPath(receiptId).replace('.json', '-processed.json')))) await publish(receiptId);
  return { designs: new Set(payment.line_items.map(line => line.properties[0].value)).size, queued: true };
}

export async function processPaidReceipt(receiptId, { store = studioStore, publish = publishEmail } = {}) {
  const pathname = receiptPath(receiptId);
  const donePath = pathname.replace('.json', '-processed.json');
  if (await store.read(donePath)) return { duplicate: true };
  const receipt = await store.read(pathname);
  if (!receipt) throw new Error('Paid receipt unavailable');
  const result = await recordPaidOrder(receipt.value.order, receipt.value.shop, { store, publish });
  await createOnce(store, donePath, { status: 'processed', ...result }, existing => existing.status === 'processed');
  return result;
}
