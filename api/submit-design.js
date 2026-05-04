/*
  Example endpoint for Sign Guy Sign Studio submissions.

  Deploy this as POST /api/submit-design, or set:
  window.SIGN_GUY_SUBMISSION_ENDPOINT = "https://your-domain.com/api/submit-design"

  It expects multipart/form-data fields from app.js:
  - to, subject, message, signName
  - logo
  - renderScreenshot1, renderScreenshot2

  Requires Node 18+, formidable, and nodemailer.
*/

import formidable from 'formidable';
import nodemailer from 'nodemailer';
import fs from 'node:fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

const TO_EMAIL = 'Hey@MySignGuy.ca';
const SUBJECT = 'User submitted sign to print';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { fields, files } = await parseMultipart(req);
    const attachments = await collectAttachments(files);
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
      subject: getField(fields.subject) || SUBJECT,
      text: getField(fields.message),
      attachments,
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not send submission email.' });
  }
}

function parseMultipart(req) {
  const form = formidable({ multiples: true, maxFileSize: 25 * 1024 * 1024 });
  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });
}

function getField(value) {
  return String(Array.isArray(value) ? value[0] : value || '');
}

async function collectAttachments(files) {
  const uploadFields = ['logo', 'renderScreenshot1', 'renderScreenshot2'];
  const attachments = [];
  for (const field of uploadFields) {
    const file = Array.isArray(files[field]) ? files[field][0] : files[field];
    if (!file) continue;
    attachments.push({
      filename: file.originalFilename || `${field}.png`,
      content: await fs.readFile(file.filepath),
      contentType: file.mimetype || undefined,
    });
  }
  return attachments;
}
