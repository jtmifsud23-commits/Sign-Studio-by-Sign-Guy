import { writeFile } from 'node:fs/promises';
import { makeOrderEmail } from '../src/order-email.js';

const record = {
  designId: 'sample-team-bag-tags-12345678', customerEmail: 'sample@example.com',
  product: 'Bag Tag', name: 'Sample Raiders team tags',
  settings: { bag: { orderMode: 'team', font: 'Bebas Neue Bold', baseColour: '#000000', textColour: '#ffffff', usage: 'indoor', roster: [{ name: 'PLAYER 1', quantity: 2 }, { name: 'COACH', quantity: 1 }] } },
  preview: { dimensions: { widthMm: 120, heightMm: 32 } },
  submissionEmail: { text: 'Team Bag Tag design submitted.', html: '<div style="font-family:Arial,sans-serif;padding:20px"><h2>Uploaded logo</h2><img src="cid:uploaded-logo" alt="Sample logo" style="width:250px"><p>The .SignGuy file, logo and individual tag previews are attached.</p></div>' },
};
const pending = makeOrderEmail(record, { kind: 'submitted' }, 'a'.repeat(64));
const paid = makeOrderEmail(record, { kind: 'paid', orderName: '#SAMPLE-2001', orderId: '123456789', lineItems: [{ lineItemId: '12345', title: 'Custom Team Bag Tag', quantity: 3 }] }, 'b'.repeat(64));
const panel = (label, mail) => `<article><p class="stage">${label}</p><div class="subject">Subject: ${mail.subject}</div>${mail.html.replaceAll('cid:uploaded-logo', '../assets/upload-guide/08-sports-logo-simple.webp')}</article>`;
await writeFile('verification/order-email-release-1-2-preview.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign Studio — release 1 and 2 email preview</title><style>body{margin:0;background:#181b1a;color:#eee;font-family:Arial,sans-serif}main{max-width:1320px;margin:auto;padding:30px}h1{font-size:28px}header p{color:#aaa;line-height:1.5}.panels{display:grid;grid-template-columns:1fr 1fr;gap:24px}article{background:#fff;color:#222;border-radius:12px;overflow:hidden}.stage{margin:0;padding:16px 20px;background:#272b29;color:#ffc529;font-weight:bold}.subject{padding:15px 20px;border-bottom:1px solid #ddd;font-size:13px;font-weight:bold}pre{overflow-wrap:anywhere}th{width:40%}td{overflow-wrap:anywhere}@media(max-width:750px){main{padding:16px}.panels{grid-template-columns:1fr}h1{font-size:23px}}</style><main><header><p>BUILD 3.1.6 • RELEASES 1 + 2</p><h1>One saved design. Two clear order stages.</h1><p>Sample design — preview only. No email has been sent and no Shopify order has been created.</p></header><div class="panels">${panel('1 · Customer starts checkout', pending)}${panel('2 · Shopify confirms payment', paid)}</div></main></html>`);
console.log('Created sample email preview; no messages sent.');
