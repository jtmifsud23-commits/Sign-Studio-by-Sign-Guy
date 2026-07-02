/*
  Finalizes a Sign Studio save/order after the browser uploads its files
  directly to the connected private Vercel Blob store.

  POST /api/save-project expects JSON containing order metadata and private
  Blob descriptors. The request stays small; file bytes never pass through
  the incoming Vercel Function request.
*/

import { get } from '@vercel/blob';
import nodemailer from 'nodemailer';
import { Readable } from 'node:stream';

const TO_EMAIL = 'Hey@MySignGuy.ca';
const ORDER_SUBJECT = 'User placed a lightbox order';
const FILE_KINDS = ['projectFile', 'logoPreview', 'logo', 'renderScreenshot1', 'renderScreenshot2'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const payload = await readJsonBody(req);
    const submission = validateSubmission(payload);
    let emailSent = false;

    if (submission.sendOrderEmail) {
      await sendOrderEmail(submission);
      emailSent = true;
    }

    res.status(200).json({
      ok: true,
      folder: `orders/${submission.orderId}`,
      files: submission.files.map((file) => file.filename),
      emailSent,
    });
  } catch (error) {
    console.error('Could not finalize private Blob submission.', error);
    res.status(500).json({
      error: 'Could not save project files or send the order email.',
      detail: error?.message || 'Unknown save error.',
    });
  }
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.json === 'function') return req.json();
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function validateSubmission(payload) {
  const customerEmail = String(payload?.customerEmail || '').trim().toLowerCase();
  if (!isValidEmail(customerEmail)) throw new Error('A valid customerEmail is required.');

  const orderId = String(payload?.orderId || '').trim();
  if (!/^[a-z0-9_-]{8,96}$/i.test(orderId)) throw new Error('A valid orderId is required.');

  const files = Array.isArray(payload?.files) ? payload.files.map((file) => validateBlobFile(file, orderId)) : [];
  const kinds = new Set(files.map((file) => file.kind));
  if (!kinds.has('projectFile') || !kinds.has('logo')) {
    throw new Error('The project file and logo are required.');
  }
  if (kinds.size !== files.length) throw new Error('Duplicate uploaded file types are not allowed.');

  return {
    orderId,
    customerEmail,
    projectName: safeFileName(payload?.projectName || 'sign-studio-project.SignGuy'),
    sendOrderEmail: payload?.sendOrderEmail === true,
    subject: String(payload?.subject || '').trim().slice(0, 240),
    message: String(payload?.message || '').trim().slice(0, 30000),
    messageHtml: String(payload?.messageHtml || '').trim().slice(0, 120000),
    files,
  };
}

function validateBlobFile(file, orderId) {
  const kind = String(file?.kind || '');
  if (!FILE_KINDS.includes(kind)) throw new Error('Unsupported uploaded file type.');

  const pathname = String(file?.pathname || '');
  if (!pathname.startsWith(`orders/${orderId}/`)) throw new Error('Uploaded file is outside this order folder.');

  const url = String(file?.url || '');
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Invalid private Blob URL.');
  }
  if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname.endsWith('.private.blob.vercel-storage.com')) {
    throw new Error('Only private Vercel Blob files are accepted.');
  }
  if (decodeURIComponent(parsedUrl.pathname.replace(/^\//, '')) !== pathname) {
    throw new Error('Private Blob URL does not match its pathname.');
  }

  return {
    kind,
    pathname,
    url,
    filename: safeFileName(file?.filename || `${kind}.bin`),
    contentType: String(file?.contentType || 'application/octet-stream'),
    size: Math.max(0, Number(file?.size) || 0),
    label: String(file?.label || '').slice(0, 160),
  };
}

async function sendOrderEmail(submission) {
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
    subject: submission.subject || ORDER_SUBJECT,
    text: submission.message,
    html: submission.messageHtml || makeFallbackHtml(submission.message),
    attachments: await collectAttachments(submission.files),
  });
}

async function collectAttachments(files) {
  const attachments = [];
  const sortedFiles = [...files].sort((a, b) => FILE_KINDS.indexOf(a.kind) - FILE_KINDS.indexOf(b.kind));
  const hasLogoPreview = sortedFiles.some((file) => file.kind === 'logoPreview');

  for (const file of sortedFiles) {
    const result = await get(file.url, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error(`Private Blob is unavailable: ${file.pathname}`);
    }
    const isInlineLogo = file.kind === 'logoPreview' || (!hasLogoPreview && file.kind === 'logo');
    attachments.push({
      filename: file.filename,
      content: Readable.fromWeb(result.stream),
      contentType: result.blob?.contentType || file.contentType,
      cid: isInlineLogo ? 'uploaded-logo' : undefined,
      contentDisposition: isInlineLogo ? 'inline' : undefined,
    });
  }

  return attachments;
}

function makeFallbackHtml(text) {
  const body = escapeHtml(text || 'Order details are attached.');
  return `<pre style="font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;line-height:1.45;">${body}</pre>`;
}

function escapeHtml(value) {
  return String(value).replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char]);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeFileName(value) {
  return String(value || 'file')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '') || 'file';
}
