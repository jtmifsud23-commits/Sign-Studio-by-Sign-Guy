import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../assets/hype-chain/hype-chain-product.js', import.meta.url), 'utf8');
const fn = source.slice(source.indexOf('async function placeHypeChainOrder()'), source.indexOf('async function buildHypeChainProject('));
const shell = { inert: false }, state = { customerEmail: 'test@example.invalid', orderInProgress: false };
const preview = new Blob(['saved-image'], { type: 'image/png' });
const project = { name: 'Test', preview: { screenshotDataUrl: 'saved-image' } };
let uploads = 0, redirects = 0, fail = false;
const context = {
  state, document: { querySelector: () => shell }, File, Blob, console: { error() {}, warn() {} },
  els: { placeOrder: {}, submitNote: {} },
  hasOrderableHypeLogo: () => true, updateProjectControls() {}, setStatus() {}, closeOnboarding() {}, clearCheckoutFallback() {}, syncMobileCommandBar() {}, queueEmailMarketingSubscription() {},
  buildHypeChainProject: async () => { assert.equal(shell.inert, true); return project; },
  isLocalTesting: () => false,
  captureHypeSubmissionScreenshots: async () => [{ blob: new Blob(['different view']), fileName: 'test.png' }],
  dataUrlToBlob: () => preview,
  uploadProjectFolder: async (saved, options) => {
    uploads++;
    assert.equal(saved, project);
    assert.equal(await options.screenshots[0].blob.text(), 'saved-image');
    assert.equal(await options.screenshots[0].file.text(), 'saved-image');
    await context.placeHypeChainOrder(); // Double click must not submit twice.
    if (fail) throw new Error('Upload failed');
    return { previewUrl: 'https://example.com/preview.png' };
  },
  makeOrderEmailSubject() {}, makeHypeEmailBody() {}, makeHypeEmailHtml() {},
  saveProjectRecord: async () => {}, refreshProjectLog: async () => {},
  redirectToShopifyCheckout: (saved, result) => { assert.equal(saved, project); assert.ok(result.previewUrl); redirects++; },
  describeOrderError: error => error.message,
};
vm.createContext(context); vm.runInContext(fn, context);
await context.placeHypeChainOrder();
assert.equal(uploads, 1); assert.equal(redirects, 1); assert.equal(shell.inert, false);
state.orderInProgress = false; fail = true;
await context.placeHypeChainOrder();
assert.equal(uploads, 2); assert.equal(redirects, 1); assert.equal(shell.inert, false); assert.equal(state.orderInProgress, false);
console.log('PASS: upload uses saved design preview, double-submit blocked, failed upload does not checkout, controls restored.');
