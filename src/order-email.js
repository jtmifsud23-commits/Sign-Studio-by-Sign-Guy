import { get } from '@vercel/blob';
import nodemailer from 'nodemailer';
import { Readable } from 'node:stream';

const TO_EMAIL = 'Hey@MySignGuy.ca';
const escape = value => String(value ?? '').replace(/[<>&"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char]);
function readableSettings(record) {
  const config = record.settings;
  const labels = {
    variant: 'Style', patternLength: 'Chain pattern length', primary: 'Primary chain colour', secondary: 'Secondary chain colour',
    tertiary: 'Tertiary chain colour', pendantCasing: 'Pendant backing colour', pendantColours: 'Pendant colours',
    pendantColourLabels: 'Pendant colour names', chainLength: 'Chain length', linkCount: 'Link count', finish: 'Finish',
    depth: 'Pendant depth (mm)', borderThickness: 'Border thickness (mm)', spinner: 'Spinner text and colours',
    orderMode: 'Order type', font: 'Font', baseColour: 'Backing colour', textColour: 'Text colour', usage: 'Usage',
    backing: 'Backing shape', palette: 'Logo colours', size: 'Size', shellColours: 'Shell colours',
    baseThickness: 'Base thickness (mm)', basePadding: 'Base padding (mm)', backingColourOverride: 'Backing colour',
    layerDepths: 'Layer depths (mm)', colourOverrides: 'Layer colours',
  };
  const pick = (source, keys) => Object.fromEntries(keys.filter(key => source?.[key] != null && source[key] !== '').map(key => [labels[key], source[key]]));
  if (record.product === 'Hype Chain') return pick(config.hype, [
    'variant', 'patternLength', 'primary', 'secondary', 'tertiary', 'pendantCasing', 'pendantColours',
    'pendantColourLabels', 'chainLength', 'linkCount', 'finish', 'depth', 'borderThickness', 'spinner',
  ]);
  if (record.product === 'Bag Tag') return {
    ...pick(config.bag, ['orderMode', 'font', 'baseColour', 'textColour', 'usage', 'backing', 'palette']),
    Dimensions: record.preview.dimensions,
  };
  return {
    ...pick(config, ['size', 'usage', 'shellColours']), Dimensions: record.preview.dimensions,
    'Artwork colours': record.preview.colours,
    ...(record.product === '3D Plaque' ? pick(config.plaque, ['baseThickness', 'basePadding', 'backingColourOverride', 'layerDepths', 'colourOverrides']) : {}),
  };
}
function settingsTable(settings) {
  const rows = Object.entries(settings).filter(([, value]) => value != null).map(([label, value]) => {
    const text = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    return `<tr><th style="padding:8px;text-align:left;vertical-align:top;border-bottom:1px solid #ddd">${escape(label)}</th><td style="padding:8px;white-space:pre-wrap;border-bottom:1px solid #ddd">${escape(text)}</td></tr>`;
  });
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.join('')}</table>`;
}

export function makeOrderEmail(record, event, jobId) {
  const paid = event.kind === 'paid';
  const title = paid
    ? `${event.test ? 'TEST payment' : 'Payment confirmed'} — ${event.orderName}`
    : 'Design submitted — checkout pending';
  const note = paid
    ? `${event.test ? 'TEST ORDER — do not produce. ' : ''}Shopify reports this order as paid. Review the attached design before production.`
    : 'Payment has not been confirmed. This is a design submission; do not begin production from this email.';
  const summary = [title, note, `Product: ${record.product}`, `Design: ${record.name}`, `Studio design ID: ${record.designId}`, `Customer email: ${record.customerEmail}`];
  if (paid) {
    summary.push(`Shopify order ID: ${event.orderId}`);
    for (const line of event.lineItems) summary.push(`Line ${line.lineItemId}: ${line.title} — quantity ${line.quantity}`);
  }
  const bag = record.settings.bag;
  const rows = record.product === 'Bag Tag'
    ? (bag.orderMode === 'team' ? bag.roster || [] : [{ name: bag.text, quantity: bag.quantity }]) : [];
  if (rows.length) {
    summary.push('Bag Tag roster:', ...rows.map(row => `${row.name} — quantity ${row.quantity}`));
    if (paid) {
      const rosterQuantity = rows.reduce((sum, row) => sum + Number(row.quantity), 0);
      const paidQuantity = event.lineItems.reduce((sum, line) => sum + line.quantity, 0);
      if (rosterQuantity !== paidQuantity) summary.push(`CHECK QUANTITIES: the saved roster totals ${rosterQuantity}; Shopify ordered ${paidQuantity}. Confirm the roster before production.`);
    }
  }
  const readable = readableSettings(record);
  const settings = JSON.stringify(readable, null, 2);
  const details = paid
    ? `<div style="font-family:Arial,sans-serif;padding:20px"><h2>Saved design settings</h2>${settingsTable(readable)}<p>Full artwork and settings are in the attached .SignGuy file.</p><img src="cid:uploaded-logo" alt="Uploaded logo" style="max-width:320px;max-height:240px"></div>`
    : (record.submissionEmail.html || `<pre style="white-space:pre-wrap">${escape(record.submissionEmail.text)}</pre>`);
  const header = `<div style="font-family:Arial,sans-serif;padding:20px;background:${paid ? '#edf8ef' : '#fff3ce'}"><h1 style="font-size:22px">${escape(title)}</h1><pre style="font:14px Arial,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5">${escape(summary.slice(1).join('\n'))}</pre></div>`;
  return {
    from: process.env.FROM_EMAIL || TO_EMAIL, to: TO_EMAIL,
    messageId: `<studio-${jobId}@mysignguy.ca>`,
    subject: `${title} | ${record.product} | ${record.name}`.slice(0, 240),
    text: `${summary.join('\n')}\n\n${paid ? settings : record.submissionEmail.text}`,
    html: `${header}${details}`,
  };
}

export async function sendOrderMail(record, event, jobId) {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 60000,
  });
  const attachments = [];
  const hasPreview = record.files.some(file => file.kind === 'logoPreview');
  for (const file of record.files) {
    const result = await get(file.pathname, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) throw new Error('Notification attachment unavailable');
    const inline = file.kind === 'logoPreview' || (!hasPreview && file.kind === 'logo');
    attachments.push({
      filename: file.filename, content: Readable.fromWeb(result.stream),
      contentType: result.blob.contentType || file.contentType,
      cid: inline ? 'uploaded-logo' : /^renderScreenshot\d+$/.test(file.kind) ? `bag-tag-${file.kind.slice(16)}` : undefined,
      contentDisposition: inline ? 'inline' : 'attachment',
    });
  }
  try { await transport.sendMail({ ...makeOrderEmail(record, event, jobId), attachments }); }
  finally { transport.close(); }
}
