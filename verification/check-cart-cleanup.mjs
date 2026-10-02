import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const code = fs.readFileSync(new URL('../integrations/shopify/sg-studio-cart-cleanup.js', import.meta.url), 'utf8');
const listeners = {};
let attributes = { 'SignGuy file': 'old-spinner.SignGuy', Style: 'Spinner', 'Spinner top text': 'OLD', 'gift-note': 'Keep me', referral: 'Keep too' };
let calls = [], fail = false;
const alerts = [];
const context = {
  window: { addEventListener() {}, alert: text => alerts.push(text) },
  document: { documentElement: { dataset: { sgCartRoot: '/en' } }, addEventListener: (name, fn) => { listeners[name] = fn; } },
  location: { href: 'https://example.com/en/cart', origin: 'https://example.com' },
  URL, AbortSignal,
  fetch: async (url, options) => {
    calls.push({ url, options });
    if (fail) throw new Error('Offline');
    if (options.method === 'POST') {
      const payload = JSON.parse(options.body);
      assert.deepEqual(Object.keys(payload), ['attributes']);
      for (const [key, value] of Object.entries(payload.attributes)) {
        if (value === '') delete attributes[key]; else attributes[key] = value;
      }
    }
    return { ok: true, json: async () => ({ attributes: { ...attributes } }) };
  },
};
vm.runInNewContext(code, context);
await context.window.SignStudioCartCleanup.clean();
assert.deepEqual(attributes, { 'gift-note': 'Keep me', referral: 'Keep too' });
assert.equal(calls[0].url, 'https://example.com/en/cart.js'.replace('https://example.com', ''));
attributes = { Style: 'Ordinary product', Name: 'Gift recipient' }; calls = [];
await context.window.SignStudioCartCleanup.clean();
assert.equal(calls.length, 1); assert.equal(attributes.Style, 'Ordinary product');
attributes = { '_SignGuy file': 'bag.SignGuy', '_Product': 'Custom Team Bag Tag', 'Name': 'CLARK', 'gift-note': 'Keep me' };
await context.window.SignStudioCartCleanup.clean();
assert.deepEqual(attributes, { 'gift-note': 'Keep me' });
let submitted = 0, blocked = 0;
const event = { target: { action: 'https://example.com/en/cart', requestSubmit() { submitted++; } }, preventDefault() { blocked++; }, stopImmediatePropagation() {} };
fail = true; listeners.submit(event);
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(submitted, 0); assert.equal(alerts.length, 1);
fail = false; listeners.submit(event);
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(submitted, 1); assert.equal(blocked, 2);
console.log('PASS: scoped legacy cleanup, locale routes, unrelated attributes preserved, hidden Bag Tag markers, checkout failure/retry.');
