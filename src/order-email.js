import { get } from '@vercel/blob';
import nodemailer from 'nodemailer';
import { Readable } from 'node:stream';
import { paidProductionEmail } from './order-email-layout.js';

const TO_EMAIL = 'Hey@MySignGuy.ca';
const escape = value => String(value ?? '').replace(/[<>&"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char]);
export function makeOrderEmail(record, event, jobId) {
  const paid = event.kind === 'paid';
  const title = paid
    ? `${event.test ? 'TEST payment' : 'Payment confirmed'} — ${event.orderName}`
    : 'Design submitted — checkout pending';
  const envelope = {
    from: process.env.FROM_EMAIL || TO_EMAIL, to: TO_EMAIL,
    messageId: `<studio-${jobId}@mysignguy.ca>`,
    subject: `${title} | ${record.product} | ${record.name}`.slice(0, 240),
  };
  if (paid) return { ...envelope, ...paidProductionEmail(record, event) };
  const note = 'Payment has not been confirmed. This is a design submission; do not begin production from this email.';
  const summary = [title, note, `Product: ${record.product}`, `Design: ${record.name}`, `Studio design ID: ${record.designId}`, `Customer email: ${record.customerEmail}`];
  const bag = record.settings.bag;
  const rows = record.product === 'Bag Tag'
    ? (bag.orderMode === 'team' ? bag.roster || [] : [{ name: bag.text, quantity: bag.quantity }]) : [];
  if (rows.length) summary.push('Bag Tag roster:', ...rows.map(row => `${row.name} — quantity ${row.quantity}`));
  const details = record.submissionEmail.html || `<pre style="white-space:pre-wrap">${escape(record.submissionEmail.text)}</pre>`;
  const header = `<div style="font-family:Arial,sans-serif;padding:20px;background:#fff3ce"><h1 style="font-size:22px">${escape(title)}</h1><pre style="font:14px Arial,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5">${escape(summary.slice(1).join('\n'))}</pre></div>`;
  return { ...envelope, text: `${summary.join('\n')}\n\n${record.submissionEmail.text}`, html: `${header}${details}` };
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
