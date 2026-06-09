/*
  Sends Sign Studio bug reports.

  POST /api/report-bug expects multipart/form-data:
  - subject
  - message
  - context
  - customerEmail
  - product
  - build
  - url
  - screenshot (optional)
*/

import formidable from 'formidable';
import fs from 'node:fs/promises';
import nodemailer from 'nodemailer';

export const config = {
  api: {
    bodyParser: false,
  },
};

const TO_EMAIL = 'Hey@MySignGuy.ca';
const DEFAULT_SUBJECT = 'Sign Studio bug report';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { fields, files } = await parseMultipart(req);
    const message = getField(fields.message);
    if (!message) {
      res.status(400).json({ error: 'A bug report message is required.' });
      return;
    }

    const customerEmail = getField(fields.customerEmail);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || TO_EMAIL,
      to: TO_EMAIL,
      replyTo: isValidEmail(customerEmail) ? customerEmail : undefined,
      subject: getField(fields.subject) || DEFAULT_SUBJECT,
      text: makeBugReportText(fields),
      html: makeBugReportHtml(fields),
      attachments: await collectAttachments(files),
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not send bug report.' });
  }
}

function parseMultipart(req) {
  const form = formidable({ multiples: false, maxFileSize: 8 * 1024 * 1024 });
  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });
}

async function collectAttachments(files) {
  const file = Array.isArray(files.screenshot) ? files.screenshot[0] : files.screenshot;
  if (!file) return [];
  return [{
    filename: safeFileName(file.originalFilename || 'sign-studio-bug-screenshot.png'),
    content: await fs.readFile(file.filepath),
    contentType: file.mimetype || 'image/png',
  }];
}

function makeBugReportText(fields) {
  return [
    'Sign Studio bug report',
    '',
    'Issue:',
    getField(fields.message),
    '',
    'Context:',
    getField(fields.context),
  ].join('\n');
}

function makeBugReportHtml(fields) {
  return `
    <div style="margin:0;padding:24px;background:#f7f3e8;color:#171717;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:720px;margin:0 auto;background:#fffdf8;border:1px solid #ded6c6;border-radius:14px;overflow:hidden;">
        <div style="padding:22px 24px;background:#ffc529;">
          <h1 style="margin:0;font-size:24px;line-height:1.15;color:#171717;">Sign Studio bug report</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#413816;">${escapeHtml(getField(fields.product) || 'Unknown product')} · Build ${escapeHtml(getField(fields.build) || 'unknown')}</p>
        </div>
        <div style="padding:22px 24px;">
          <h2 style="margin:0 0 10px;font-size:16px;">Issue</h2>
          <p style="margin:0;white-space:pre-wrap;line-height:1.45;">${escapeHtml(getField(fields.message))}</p>
          <h2 style="margin:24px 0 10px;font-size:16px;">Context</h2>
          <pre style="margin:0;padding:14px;background:#f2eee4;border:1px solid #ded6c6;border-radius:10px;white-space:pre-wrap;line-height:1.45;font-family:Consolas,Menlo,monospace;font-size:13px;">${escapeHtml(getField(fields.context))}</pre>
        </div>
      </div>
    </div>
  `;
}

function getField(value) {
  return String(Array.isArray(value) ? value[0] : value || '').trim();
}

function escapeHtml(value) {
  return String(value).replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char]);
}

function safeFileName(value) {
  return String(value || 'file')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '') || 'file';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
