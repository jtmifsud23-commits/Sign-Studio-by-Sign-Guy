import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { saveDesignRecord, designPath } from '../src/design-records.js';
import { enqueueEmail, deliverEmail, recordPaidOrder, enqueuePaidOrder, processPaidReceipt } from '../src/order-notifications.js';
import { createSaveHandler, validateSubmission } from '../api/save-project.js';
import { createPaidWebhook } from '../api/shopify/orders-paid.js';
import { makeOrderEmail } from '../src/order-email.js';

function memoryStore() {
  const data = new Map(); let revision = 0;
  return {
    data,
    async read(path) { return data.has(path) ? structuredClone(data.get(path)) : null; },
    async create(path, value) {
      if (data.has(path)) throw new Error('Already exists');
      data.set(path, { value: structuredClone(value), etag: String(++revision) });
    },
    async replace(path, value, etag) {
      if (data.get(path)?.etag !== etag) throw new Error('Precondition failed');
      data.set(path, { value: structuredClone(value), etag: String(++revision) });
    },
  };
}
const id = 'design-classic-12345678';
const shop = '11a02c-d2.myshopify.com';
function submission(designId = id, sendOrderEmail = true) {
  return {
    orderId: designId, customerEmail: 'test@example.com', sendOrderEmail,
    projectName: 'test.SignGuy', subject: 'User placed order', message: 'Details', messageHtml: '<p>Details</p>',
    files: ['projectFile', 'logo', 'renderScreenshot1'].map(kind => ({
      kind, pathname: `orders/${designId}/${kind}-test.png`,
      url: `https://store.private.blob.vercel-storage.com/orders/${designId}/${kind}-test.png`,
      filename: kind === 'projectFile' ? 'test.SignGuy' : 'test.png', contentType: 'image/png', size: 12,
    })),
  };
}
function project(type = 'SignGuy.HypeChainStudio') {
  return { id: 'editable-project-1', name: 'Team <Test>', type, customerEmail: 'test@example.com',
    config: type === 'SignGuy.BagTagStudio' ? { bag: { orderMode: 'team', font: 'Bebas', roster: [{ name: 'PLAYER 1', quantity: 2 }, { name: 'COACH', quantity: 1 }] } } : { hype: { variant: 'classic', chainLength: 'Adult', primary: '#000000', patternLength: 3 } },
    source: { fileName: 'logo.png', dataUrl: 'data:image/png;base64,AAA' }, preview: { dimensions: { faceInches: 12 } } };
}
async function save(store, options = {}) {
  return saveDesignRecord(submission(options.id || id, options.email !== false), { store, readProject: async () => options.project || project(), now: () => '2026-10-06T12:00:00Z' });
}
function paid(ids = [id]) {
  return { id: 123456789, name: '#2001', financial_status: 'paid', test: false,
    line_items: ids.map((designId, index) => ({ id: 100 + index, variant_id: 200 + index, quantity: 1, title: 'Custom design', properties: [{ name: '_Studio design ID', value: designId }] })) };
}
const response = () => ({ statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } });
function signedRequest(order, overrides = {}, raw) {
  const body = raw ?? JSON.stringify(order);
  return new Request('https://studio.test/api/shopify/orders-paid', { method: 'POST', body,
    headers: { 'Content-Type': 'application/json', 'x-shopify-hmac-sha256': createHmac('sha256', 'test-secret').update(body).digest('base64'), 'x-shopify-shop-domain': shop, 'x-shopify-topic': 'orders/paid', ...overrides } });
}

test('all four products preserve the saved settings, file locations and customer', async () => {
  for (const type of ['SignGuy.LightboxStudio', 'SignGuy.WallPlaqueStudio', 'SignGuy.HypeChainStudio', 'SignGuy.BagTagStudio']) {
    const store = memoryStore(); const p = project(type); const record = await save(store, { project: p });
    assert.deepEqual(record.settings, p.config); assert.equal(record.customerEmail, 'test@example.com');
    assert.equal(record.files.length, 3); assert.equal(record.designId, id);
    assert.equal(record.submissionStatus, 'checkout_pending');
  }
});
test('same design ID is immutable; retry and simultaneous identical saves reuse it', async () => {
  const store = memoryStore(); const results = await Promise.all([save(store), save(store)]);
  assert.equal(results[0].snapshotHash, results[1].snapshotHash); assert.equal(store.data.size, 1);
  const changed = project(); changed.config.hype.chainLength = 'Youth';
  await assert.rejects(save(store, { project: changed }), /conflicts/);
  assert.equal((await store.read(designPath(id))).value.settings.hype.chainLength, 'Adult');
});
test('customer mismatch and unsupported project cannot create a record', async () => {
  const store = memoryStore(); const wrong = project(); wrong.customerEmail = 'other@example.com';
  await assert.rejects(save(store, { project: wrong }), /customer/);
  await assert.rejects(save(store, { project: project('unknown') }), /Unsupported/);
  assert.equal(store.data.size, 0);
});
test('file descriptors reject foreign paths, duplicate kinds and external URLs', () => {
  const valid = submission(); assert.equal(validateSubmission(valid).files.length, 3);
  const badPath = submission(); badPath.files[0].pathname = 'orders/other-123/projectFile-test.png';
  assert.throws(() => validateSubmission(badPath), /outside/);
  const duplicate = submission(); duplicate.files.push(duplicate.files[0]); assert.throws(() => validateSubmission(duplicate), /Duplicate/);
  const url = submission(); url.files[0].url = 'https://evil.example/file'; assert.throws(() => validateSubmission(url), /Only private/);
});
test('save response confirms the ID after durable queue acceptance, without delivering email', async () => {
  const store = memoryStore(); let publishes = 0;
  const handler = createSaveHandler({
    previewToken: () => 'signed-preview',
    save: (input, { previewUrl }) => saveDesignRecord(input, { store, previewUrl, readProject: async () => project() }),
    enqueue: (record, event) => enqueueEmail(record, event, { store, publish: async () => { publishes++; } }),
  });
  const res = response(); await handler({ method: 'POST', body: submission() }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.designId, id);
  assert.equal(res.body.emailQueued, true); assert.equal(res.body.emailSent, false); assert.equal(publishes, 1);
  assert.equal((await store.read(designPath(id))).value.preview.url, res.body.previewUrl);
});
test('plain save does not queue an order email', async () => {
  const store = memoryStore(); const handler = createSaveHandler({ previewToken: () => 'token', save: input => saveDesignRecord(input, { store, readProject: async () => project() }), enqueue: () => assert.fail('unexpected mail') });
  const res = response(); await handler({ method: 'POST', body: submission(id, false) }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.emailQueued, false);
});
test('queue outage retains the saved record and job; retry can finish the same submission', async () => {
  const store = memoryStore(); const record = await save(store);
  await assert.rejects(enqueueEmail(record, { kind: 'submitted' }, { store, publish: async () => { throw new Error('Queue outage'); } }), /Queue outage/);
  assert.equal(store.data.size, 2); assert.ok(await store.read(designPath(id)));
  let publishes = 0; await enqueueEmail(await save(store), { kind: 'submitted' }, { store, publish: async () => { publishes++; } });
  assert.equal(publishes, 1); assert.equal(store.data.size, 2);
});
test('SMTP failure retries separately; successful or concurrent duplicate jobs send once', async () => {
  const store = memoryStore(); const record = await save(store);
  const jobId = await enqueueEmail(record, { kind: 'submitted' }, { store, publish: async () => {} });
  let sends = 0;
  await assert.rejects(deliverEmail(jobId, { store, sendMail: async () => { sends++; throw new Error('SMTP unavailable'); } }), /SMTP unavailable/);
  const results = await Promise.allSettled([0, 1].map(() => deliverEmail(jobId, { store, sendMail: async () => { sends++; } })));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(sends, 2); assert.deepEqual(await deliverEmail(jobId, { store, sendMail: () => assert.fail('duplicate mail') }), { duplicate: true });
});
test('expired delivery lease can recover after a crashed worker', async () => {
  const store = memoryStore(); const record = await save(store);
  const jobId = await enqueueEmail(record, { kind: 'submitted' }, { store, publish: async () => {} });
  await store.create(`studio/notifications/${jobId}-state.json`, { status: 'sending', leaseUntil: 1000, leaseToken: 'old-worker', attempts: 1 });
  let sends = 0;
  assert.deepEqual(await deliverEmail(jobId, { store, now: () => 2000, sendMail: async () => { sends++; } }), { sent: true });
  assert.equal(sends, 1);
});
test('queue acceptance failure returns retryable response and preserves the immutable design', async () => {
  const store = memoryStore(); const handler = createSaveHandler({ previewToken: () => 'token', save: input => saveDesignRecord(input, { store, readProject: async () => project() }), enqueue: (record, event) => enqueueEmail(record, event, { store, publish: async () => { throw new Error('unavailable'); } }) });
  const res = response(); await handler({ method: 'POST', body: submission() }, res);
  assert.equal(res.statusCode, 503); assert.ok(await store.read(designPath(id))); assert.equal(store.data.size, 2);
});
test('abandoned checkout produces only a pending-submission job', async () => {
  const store = memoryStore(); const record = await save(store);
  await enqueueEmail(record, { kind: 'submitted' }, { store, publish: async () => {} });
  assert.equal([...store.data.values()].filter(entry => entry.value.event?.kind === 'paid').length, 0);
  const mail = makeOrderEmail(record, { kind: 'submitted' }, 'a'.repeat(64));
  assert.match(mail.subject, /checkout pending/); assert.match(mail.text, /do not begin production/);
});
test('paid mixed cart links only Studio designs, preserves real order and deduplicates replays', async () => {
  const store = memoryStore(); await save(store); await save(store, { id: 'design-spinner-98765432' });
  const order = paid([id, 'design-spinner-98765432']); order.line_items.push({ id: 999, quantity: 1, properties: [] });
  const jobs = new Set(); const options = { store, publish: async job => jobs.add(job) };
  assert.deepEqual(await recordPaidOrder(order, shop, options), { designs: 2 });
  await recordPaidOrder(order, shop, options); assert.equal(jobs.size, 2);
  const notices = [...store.data.values()].map(entry => entry.value).filter(value => value.event?.kind === 'paid');
  assert.equal(notices.length, 2); assert.ok(notices.every(value => value.event.orderName === '#2001' && value.event.orderId === '123456789'));
  for (const jobId of jobs) { await deliverEmail(jobId, { store, sendMail: async () => {} }); }
  let extra = 0; await recordPaidOrder(order, shop, { store, publish: () => { extra++; } }); assert.equal(extra, 0);
});
test('payment receipt excludes addresses and processes independently after webhook acceptance', async () => {
  const store = memoryStore(); await save(store); let receiptId;
  const order = { ...paid(), shipping_address: { address1: 'private address' }, email: 'private@example.com' };
  await enqueuePaidOrder(order, shop, { store, publish: async id => { receiptId = id; } });
  const receipt = [...store.data.values()].find(entry => entry.value.receiptId)?.value;
  assert.ok(receipt); assert.equal(receipt.order.email, undefined); assert.equal(receipt.order.shipping_address, undefined);
  assert.equal([...store.data.values()].filter(entry => entry.value.event).length, 0);
  let jobs = 0; await processPaidReceipt(receiptId, { store, publish: async () => { jobs++; } });
  assert.equal(jobs, 1); assert.deepEqual(await processPaidReceipt(receiptId, { store, publish: () => assert.fail('duplicate receipt') }), { duplicate: true });
});
test('missing design leaves the paid receipt available for retry, without partial mixed-cart jobs', async () => {
  const store = memoryStore(); await save(store);
  await assert.rejects(recordPaidOrder(paid([id, 'missing-design-12345678']), shop, { store, publish: () => assert.fail('partial email') }), /unavailable/);
  let receiptId; await enqueuePaidOrder(paid([id, 'missing-design-12345678']), shop, { store, publish: async id => { receiptId = id; } });
  await assert.rejects(processPaidReceipt(receiptId, { store, publish: async () => {} }), /unavailable/);
  await save(store, { id: 'missing-design-12345678' });
  assert.deepEqual(await processPaidReceipt(receiptId, { store, publish: async () => {} }), { designs: 2 });
});
test('legacy/non-Studio orders are ignored; saved-only designs cannot become production orders', async () => {
  const store = memoryStore(); const order = paid(); order.line_items[0].properties = [{ name: 'SignGuy file', value: 'old.SignGuy' }];
  assert.deepEqual(await enqueuePaidOrder(order, shop, { store, publish: () => assert.fail('legacy job') }), { designs: 0 });
  await save(store, { email: false }); await assert.rejects(recordPaidOrder(paid(), shop, { store }), /unavailable/);
});
test('paid mail includes complete team roster, paid quantity mismatch, and safe escaped names', async () => {
  const store = memoryStore(); const record = await save(store, { project: project('SignGuy.BagTagStudio') });
  const event = { kind: 'paid', orderName: '#2001', orderId: '1234', lineItems: [{ lineItemId: '1', title: 'Tags', quantity: 5 }] };
  const mail = makeOrderEmail(record, event, 'b'.repeat(64));
  assert.match(mail.text, /PLAYER 1 — quantity 2/); assert.match(mail.text, /COACH — quantity 1/); assert.match(mail.text, /CHECK QUANTITIES/);
  assert.match(mail.html, /Team &lt;Test&gt;/); assert.match(mail.subject, /Payment confirmed — #2001/);
  const testMail = makeOrderEmail(record, { ...event, test: true }, 'c'.repeat(64)); assert.match(testMail.text, /TEST ORDER — do not produce/);
});
test('webhook validates exact raw bytes, signed shop/topic, payment state and queue acceptance', async () => {
  let calls = 0;
  const handler = createPaidWebhook({ env: { SHOPIFY_STORE_DOMAIN: shop, SHOPIFY_WEBHOOK_SECRET: 'test-secret' }, processOrder: async () => { calls++; return { designs: 1, queued: true }; } });
  const raw = JSON.stringify({ ...paid(), name: '#Équipe 2001' }, null, 2);
  assert.equal((await handler(signedRequest(null, {}, raw))).status, 200); assert.equal(calls, 1);
  for (const [headers, status] of [[{ 'x-shopify-hmac-sha256': 'bad' }, 401], [{ 'x-shopify-shop-domain': 'other.myshopify.com' }, 403], [{ 'x-shopify-topic': 'orders/create' }, 403]]) {
    assert.equal((await handler(signedRequest(paid(), headers))).status, status);
  }
  assert.equal((await handler(signedRequest({ ...paid(), financial_status: 'pending' }))).status, 422);
  assert.equal((await handler(signedRequest(null, {}, '{'))).status, 400);
  assert.equal((await handler(signedRequest(null))).status, 400);
  const tampered = JSON.stringify({ ...paid(), name: '#tampered' });
  assert.equal((await handler(signedRequest(null, { 'x-shopify-hmac-sha256': createHmac('sha256', 'test-secret').update(JSON.stringify(paid())).digest('base64') }, tampered))).status, 401);
  const fail = createPaidWebhook({ env: { SHOPIFY_STORE_DOMAIN: shop, SHOPIFY_WEBHOOK_SECRET: 'test-secret' }, processOrder: async () => { throw new Error('Queue down'); } });
  assert.equal((await fail(signedRequest(paid()))).status, 503);
  assert.equal((await createPaidWebhook({ env: {} })(signedRequest(paid()))).status, 503);
  assert.equal((await handler(new Request('https://studio.test/api', { method: 'GET' }))).status, 405);
  assert.equal(calls, 1);
});
