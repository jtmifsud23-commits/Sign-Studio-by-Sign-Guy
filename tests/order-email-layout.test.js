import test from 'node:test';
import assert from 'node:assert/strict';
import { makeOrderEmail } from '../src/order-email.js';
import { productionBrief } from '../src/order-email-layout.js';

const event = { kind: 'paid', shop: '11a02c-d2.myshopify.com', orderId: '6161451876492', orderName: '#1411', lineItems: [{ lineItemId: '15190259597452', title: 'Custom product', quantity: 1 }] };
const base = (product, settings = {}) => ({
  product, name: 'Saved <Design>', designId: 'immutable-design-12345678', customerEmail: 'customer@example.com', settings,
  preview: {}, submissionEmail: { html: '<p>Original pending details</p>', text: 'Original pending details' },
  files: [{ kind: 'projectFile', filename: 'design.SignGuy' }, { kind: 'logo', filename: 'logo.png' }, { kind: 'renderScreenshot1', filename: 'front.jpg' }, { kind: 'renderScreenshot2', filename: 'angled.jpg' }],
});
const mail = (record, payment = event) => makeOrderEmail(record, payment, 'a'.repeat(64));

test('Classic paid brief uses actual paid quantity, previews before specs, exact swatches and no inactive Spinner fields', () => {
  const record = base('Hype Chain', { hype: { variant: 'classic', quantity: 99, patternLength: 1, primary: '#020201', secondary: '#abcdef', chainLength: 'Adult', linkCount: 27, finish: 'Matte', depth: 4, borderThickness: 7, pendantCasing: '#020201', pendantColours: ['#fbfbfb', '#e3b535'], pendantColourLabels: ['1', 'Team gold'], spinner: { topText: 'UNUSED SPINNER TEXT', ringDiameter: 150 } } });
  const result = mail(record);
  assert.match(result.html, /Classic Hype Chain/); assert.match(result.html, /1 chain/);
  assert.ok(result.html.indexOf('cid:bag-tag-1') < result.html.indexOf('Production details'));
  assert.match(result.html, /cid:bag-tag-2/); assert.match(result.html, /background-color:#020201/);
  assert.match(result.text, /Chain length: Adult · 27 links/); assert.match(result.text, /Chain pattern: 1 link/);
  assert.match(result.text, /Colour 1: White \(#FBFBFB\)/); assert.match(result.text, /Team gold \(#E3B535\)/);
  assert.doesNotMatch(result.html, /UNUSED SPINNER TEXT|Ring diameter|#ABCDEF/);
  assert.doesNotMatch(result.text, /UNUSED SPINNER TEXT|\{\s*"/);
  assert.ok(result.html.indexOf('Studio design ID:') > result.html.indexOf('Production files attached'));
  assert.match(result.html, /href="https:\/\/admin.shopify.com\/store\/11a02c-d2\/orders\/6161451876492"/);
});

test('Spinner brief includes text, font, millimetres and individual Spinner colour roles', () => {
  const result = mail(base('Hype Chain', { hype: { variant: 'spinner', spinner: { topText: 'PLAYER OF', bottomText: 'THE GAME', fontFamily: 'Bebas Neue Bold', ringDiameter: 150, ringThickness: 14, ringClearance: 1.2, ringColor: '#020201', textColor: '#fbfbfb', baseColor: '#e3b535' } } }));
  assert.match(result.html, /Spinner Hype Chain/); assert.match(result.text, /Top text: PLAYER OF/);
  assert.match(result.text, /Bottom text: THE GAME/); assert.match(result.text, /Ring clearance: 1.2 mm/);
  assert.match(result.text, /Ring diameter: 150 mm/); assert.match(result.text, /Ring text: White/);
  assert.doesNotMatch(result.html, /&quot;topText&quot;/);
});

test('LED and Plaque use saved dimensions, selected display colours and per-layer depths', () => {
  const led = base('LED Sign', { size: 'large', usage: 'indoor', shellColours: { side: '#000000', back: '#ffffff' } });
  led.preview = { dimensions: { faceInches: 12, depthMm: 40 }, colours: [{ source: '#ff0000', display: '#008000' }] };
  assert.match(mail(led).text, /Face size: 12 in/); assert.match(mail(led).text, /Sign depth: 40 mm/);
  assert.match(mail(led).text, /Colour 1: Green \(#008000\)/); assert.doesNotMatch(mail(led).text, /#FF0000/);
  const plaque = base('3D Plaque', { usage: 'indoor', plaque: { baseThickness: 3, basePadding: 2, layerDepths: [0.5, 1.2] } });
  plaque.preview = { dimensions: { faceInches: 10 }, colours: [{ index: 'backing', display: '#000000' }, { index: 0, display: '#ffffff' }, { index: 1, display: '#e3b535' }] };
  const result = mail(plaque);
  assert.match(result.text, /Backing thickness: 3 mm/); assert.match(result.text, /Layer 2 depth: 1.2 mm/);
  assert.match(result.text, /Layer 2: Gold/); assert.doesNotMatch(result.text, /Shell colours|Spinner/);
});

test('Team Bag Tags retain all names, quantities and warning while bounding and numbering the preview gallery', () => {
  const record = base('Bag Tag', { bag: { orderMode: 'team', roster: Array.from({ length: 8 }, (_, i) => ({ name: `PLAYER ${i + 1}`, quantity: i + 1 })), font: 'Bebas', palette: [{ colour: '#e3b535', raised: true }] } });
  record.preview.dimensions = { widthMm: 80, heightMm: 106.238, depthMm: 6 };
  record.files = [{ kind: 'projectFile' }, { kind: 'logo' }, ...Array.from({ length: 8 }, (_, i) => ({ kind: `renderScreenshot${8 - i}` }))];
  const result = mail(record);
  assert.match(result.html, /Team Bag Tags/); assert.match(result.text, /Dimensions: 80 × 106.24 × 6 mm/);
  assert.match(result.text, /PLAYER 8 — quantity 8/); assert.match(result.text, /CHECK QUANTITIES: the saved roster totals 36; Shopify ordered 1/);
  assert.match(result.html, /Showing 4 of 8 saved tag previews/);
  assert.match(result.html, /Tag 1 · PLAYER 1/); assert.match(result.html, /cid:bag-tag-4/); assert.doesNotMatch(result.html, /cid:bag-tag-5/);
  assert.match(result.text, /raised 2 mm/); assert.match(result.text, /8 design previews/);
});

test('Single Bag Tag and missing renders use the name/quantity and clearly labelled artwork fallback', () => {
  const record = base('Bag Tag', { bag: { orderMode: 'single', text: 'COACH', quantity: 2, baseColour: '#000', textColour: '#fff' } });
  record.files = [{ kind: 'projectFile' }, { kind: 'logoPreview' }];
  const result = mail(record, { ...event, lineItems: [{ ...event.lineItems[0], quantity: 2 }] });
  assert.match(result.html, /cid:uploaded-logo/); assert.match(result.html, /design preview unavailable/);
  assert.match(result.text, /COACH — quantity 2/); assert.doesNotMatch(result.text, /CHECK QUANTITIES/);
  assert.match(result.html, /background-color:#000000/);
});

test('Saved text, colour labels and metadata are escaped; invalid style values and order links are excluded', () => {
  const record = base('Hype Chain', { hype: { variant: 'spinner', primary: '#000000; background:url(https://evil.example)', pendantColours: ['#ffffff'], pendantColourLabels: ['<img src=x onerror=alert(1)>'], spinner: { topText: '<script>alert(1)</script>' } } });
  record.customerEmail = '"><img src=x onerror=alert(1)>';
  const result = mail(record, { ...event, shop: 'evil.example', orderId: '"onmouseover="alert(1)' });
  assert.match(result.html, /Saved &lt;Design&gt;/); assert.match(result.html, /&lt;script&gt;alert/);
  assert.doesNotMatch(result.html, /<script>|<img src=x|background:url|href="https:\/\/evil/);
  assert.equal(productionBrief(record, { ...event, shop: '11a02c-d2.myshopify.com.evil.example' }).orderUrl, null);
});

test('Test orders remain conspicuous and pending submission HTML/recipient/message ID are preserved', () => {
  const record = base('Hype Chain', { hype: { variant: 'classic' } });
  const result = mail(record, { ...event, test: true });
  assert.match(result.subject, /^TEST payment — #1411/); assert.match(result.html, /TEST ORDER — DO NOT PRODUCE/);
  assert.match(result.text, /TEST ORDER — do not produce/);
  const pending = mail(record, { kind: 'submitted' });
  assert.match(pending.subject, /^Design submitted — checkout pending/);
  assert.match(pending.html, /Original pending details/); assert.doesNotMatch(pending.html, /View order|PAYMENT CONFIRMED/);
  assert.equal(pending.to, 'Hey@MySignGuy.ca'); assert.equal(pending.messageId, `<studio-${'a'.repeat(64)}@mysignguy.ca>`);
});
