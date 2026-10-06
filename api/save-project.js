/*
  Finalizes a Sign Studio save/order after the browser uploads its files
  directly to the connected private Vercel Blob store.

  POST /api/save-project expects JSON containing order metadata and private
  Blob descriptors. The request stays small; file bytes never pass through
  the incoming Vercel Function request.
*/

import { createPreviewToken } from '../src/preview-token.js';
import { saveDesignRecord } from '../src/design-records.js';
import { enqueueEmail } from '../src/order-notifications.js';

const FILE_KINDS = ['projectFile', 'logoPreview', 'logo', ...Array.from({length:100},(_,index)=>`renderScreenshot${index+1}`)];

export function createSaveHandler({ save = saveDesignRecord, enqueue = enqueueEmail, previewToken = createPreviewToken } = {}) {
 return async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const payload = await readJsonBody(req);
    const submission = validateSubmission(payload);
    const preview=submission.files.find(file=>file.kind==='renderScreenshot1');
    const previewUrl=preview?`https://sign-studio-by-sign-guy.vercel.app/uploads/${previewToken(preview.pathname)}/design-preview.png`:null;
    const record = await save(submission, { previewUrl });
    // Only durable queue acceptance is awaited, never SMTP delivery.
    if (submission.sendOrderEmail) await enqueue(record, { kind: 'submitted' });
    res.status(200).json({
      ok: true,
      folder: `orders/${submission.orderId}`,
      files: submission.files.map((file) => file.filename),
      designId: record.designId,
      emailQueued: submission.sendOrderEmail,
      emailSent: false,
      previewUrl,
    });
  } catch (error) {
    console.error('Could not finalize Studio submission.', { errorType: error?.name || 'Error' });
    res.status(503).json({ error: 'Could not finalize the saved design. Please try again.' });
  }
 };
}
export default createSaveHandler();

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

export function validateSubmission(payload) {
  const customerEmail = String(payload?.customerEmail || '').trim().toLowerCase();
  if (!isValidEmail(customerEmail)) throw new Error('A valid customerEmail is required.');

  const orderId = String(payload?.orderId || '').trim();
  if (!/^[a-z0-9_-]{8,96}$/i.test(orderId)) throw new Error('A valid orderId is required.');

  if(!Array.isArray(payload?.files)||payload.files.length>103)throw new Error('Too many uploaded files.');
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeFileName(value) {
  return String(value || 'file')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '') || 'file';
}
