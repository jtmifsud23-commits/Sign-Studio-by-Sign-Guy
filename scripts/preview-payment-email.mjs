// Generates previews locally; never queues a job, sends mail or modifies an order.
// Optional fixture: { record, event, images: { 'bag-tag-1': 'data:image/...' } }.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { makeOrderEmail } from '../src/order-email.js';

const output = resolve(process.argv[2] || 'verification/payment-email-3.1.8');
await mkdir(output, { recursive: true });
const makePreview = async (name, fixture) => {
  const mail = makeOrderEmail(fixture.record, fixture.event, 'a'.repeat(64));
  let html = mail.html;
  for (const [cid, data] of Object.entries(fixture.images || {})) {
    if (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data)) throw new Error('Preview images must be embedded local image data');
    html = html.replaceAll(`cid:${cid}`, data);
  }
  await writeFile(resolve(output, `${name}.html`), html);
  return { name, subject: mail.subject, filename: `${name}.html` };
};
const fixtures = [];
if (process.argv[3]) {
  fixtures.push(await makePreview('provided-order', JSON.parse(await readFile(process.argv[3], 'utf8'))));
} else {
  const image = `data:image/webp;base64,${(await readFile(new URL('../assets/upload-guide/08-sports-logo-simple.webp', import.meta.url))).toString('base64')}`;
  const previews = [{ kind: 'projectFile', filename: 'sample.SignGuy' }, { kind: 'logo' }, { kind: 'renderScreenshot1' }, { kind: 'renderScreenshot2' }];
  const common = { designId: 'sample-design-12345678', name: 'Sample design', customerEmail: 'sample@example.com', preview: {}, files: previews, submissionEmail: { text: 'Sample pending details', html: '<p>Sample pending details</p>' } };
  const hype = { variant: 'classic', patternLength: 3, chainLength: 'Adult', linkCount: 27, finish: 'Matte', depth: 4, borderThickness: 7, primary: '#020201', secondary: '#fbfbfb', tertiary: '#e3b535', pendantCasing: '#020201', pendantColours: ['#020201', '#fbfbfb', '#e3b535'], spinner: { topText: 'PLAYER OF', bottomText: 'THE GAME', fontFamily: 'Bebas Neue Bold', ringDiameter: 150, ringThickness: 14, ringClearance: 1.2, ringColor: '#020201', textColor: '#fbfbfb', baseColor: '#e3b535' } };
  const bag = { orderMode: 'single', text: 'COACH', quantity: 1, font: 'Bebas Neue Bold', baseColour: '#000000', textColour: '#ffffff', usage: 'indoor', backing: 'auto', palette: [{ colour: '#e3b535', raised: true }] };
  const colours = [{ index: 0, display: '#000000' }, { index: 1, display: '#ffffff' }, { index: 2, display: '#e3b535' }];
  const samples = [
    ['classic', { ...common, product: 'Hype Chain', settings: { hype } }],
    ['spinner', { ...common, product: 'Hype Chain', settings: { hype: { ...hype, variant: 'spinner' } } }],
    ['led', { ...common, product: 'LED Sign', settings: { size: 'medium', usage: 'indoor', shellColours: { side: '#000000', back: '#000000' } }, preview: { dimensions: { faceInches: 12, depthMm: 40 }, colours } }],
    ['plaque', { ...common, product: '3D Plaque', settings: { size: 'medium', usage: 'indoor', plaque: { baseThickness: 3, basePadding: 2, layerDepths: [0.5, 1, 1.5], backingColourOverride: '#000000' } }, preview: { dimensions: { faceInches: 12 }, colours } }],
    ['bag-single', { ...common, product: 'Bag Tag', settings: { bag }, preview: { dimensions: { widthMm: 80, heightMm: 106.238, depthMm: 6 } } }],
    ['bag-team', { ...common, product: 'Bag Tag', settings: { bag: { ...bag, orderMode: 'team', roster: [{ name: 'PLAYER 1', quantity: 2 }, { name: 'PLAYER 2', quantity: 1 }, { name: 'PLAYER 3', quantity: 1 }, { name: 'PLAYER 4', quantity: 1 }, { name: 'COACH', quantity: 1 }] } }, files: [{ kind: 'projectFile' }, { kind: 'logo' }, ...Array.from({ length: 5 }, (_, i) => ({ kind: `renderScreenshot${i + 1}` }))], preview: { dimensions: { widthMm: 80, heightMm: 106.238, depthMm: 6 } } }],
  ];
  for (const [name, record] of samples) {
    const event = { kind: 'paid', test: false, orderName: '#SAMPLE-2001', orderId: '123456789', lineItems: [{ lineItemId: '12345', title: 'Sample custom product', quantity: name === 'bag-team' ? 6 : 1 }] };
    const images = Object.fromEntries(record.files.filter(file => file.kind.startsWith('renderScreenshot')).map(file => [`bag-tag-${file.kind.slice(16)}`, image]));
    fixtures.push(await makePreview(name, { record, event, images }));
  }
}
console.log(JSON.stringify({ output, previews: fixtures, sentEmails: 0, changedOrders: 0 }));
