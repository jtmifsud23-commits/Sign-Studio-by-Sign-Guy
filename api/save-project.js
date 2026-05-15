/*
  Saves Sign Guy Lightbox Studio project assets into a server-side folder.

  POST /api/save-project expects multipart/form-data:
  - customerEmail
  - projectFile (.SignGuy)
  - logo
  - renderScreenshot1
  - renderScreenshot2

  Set SIGN_GUY_UPLOAD_DIR to choose the persistent upload root.
*/

import formidable from 'formidable';
import fs from 'node:fs/promises';
import nodemailer from 'nodemailer';
import os from 'node:os';
import path from 'node:path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const DEFAULT_UPLOAD_DIR = path.join(os.tmpdir(), 'sign-guy-designs');
const TO_EMAIL = 'Hey@MySignGuy.ca';
const ORDER_SUBJECT = 'User placed a lightbox order';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { fields, files } = await parseMultipart(req);
    const customerEmail = getField(fields.customerEmail);
    if (!isValidEmail(customerEmail)) {
      res.status(400).json({ error: 'A valid customerEmail is required.' });
      return;
    }

    const uploadRoot = process.env.SIGN_GUY_UPLOAD_DIR || DEFAULT_UPLOAD_DIR;
    const folderName = safeFolderName(customerEmail);
    const customerDir = path.join(uploadRoot, folderName);
    await fs.mkdir(customerDir, { recursive: true });
    const savedFiles = await saveFiles(customerDir, files);
    let emailSent = false;
    if (getField(fields.sendOrderEmail) === 'true') {
      await sendOrderEmail(fields, files);
      emailSent = true;
    }

    res.status(200).json({
      ok: true,
      folder: customerDir,
      files: savedFiles,
      emailSent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not save project files or send the order email.' });
  }
}

async function sendOrderEmail(fields, files) {
  const text = getFieldText(fields.message);
  const html = getFieldText(fields.messageHtml) || makeFallbackHtml(text);
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
    subject: getFieldText(fields.subject) || ORDER_SUBJECT,
    text,
    html,
    attachments: await collectAttachments(files),
  });
}

async function collectAttachments(files) {
  const uploadFields = ['projectFile', 'logoPreview', 'logo', 'renderScreenshot1', 'renderScreenshot2'];
  const attachments = [];
  const hasLogoPreview = Boolean(Array.isArray(files.logoPreview) ? files.logoPreview[0] : files.logoPreview);

  for (const field of uploadFields) {
    const file = Array.isArray(files[field]) ? files[field][0] : files[field];
    if (!file) continue;

    attachments.push({
      filename: file.originalFilename || `${field}.png`,
      content: await fs.readFile(file.filepath),
      contentType: file.mimetype || undefined,
      cid: field === 'logoPreview' || (!hasLogoPreview && field === 'logo') ? 'uploaded-logo' : undefined,
      contentDisposition: field === 'logoPreview' || (!hasLogoPreview && field === 'logo') ? 'inline' : undefined,
    });
  }

  return attachments;
}

function makeFallbackHtml(text) {
  const body = escapeHtml(text || 'Order details are attached.');
  return `<pre style="font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;line-height:1.45;">${body}</pre>`;
}

function parseMultipart(req) {
  const form = formidable({ multiples: true, maxFileSize: 30 * 1024 * 1024 });
  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });
}

async function saveFiles(customerDir, files) {
  const fields = ['projectFile', 'logoPreview', 'logo', 'renderScreenshot1', 'renderScreenshot2'];
  const saved = [];

  for (const field of fields) {
    const file = Array.isArray(files[field]) ? files[field][0] : files[field];
    if (!file) continue;

    const filename = safeFileName(file.originalFilename || `${field}.png`);
    await fs.copyFile(file.filepath, path.join(customerDir, filename));
    saved.push(filename);
  }
  return saved;
}

function getField(value) {
  return String(Array.isArray(value) ? value[0] : value || '').trim().toLowerCase();
}

function getFieldText(value) {
  return String(Array.isArray(value) ? value[0] : value || '').trim();
}

function escapeHtml(value) {
  return String(value).replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char]);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeFolderName(value) {
  return safeFileName(value).toLowerCase();
}

function safeFileName(value) {
  return String(value || 'file')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '') || 'file';
}
