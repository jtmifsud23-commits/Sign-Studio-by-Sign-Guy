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
import os from 'node:os';
import path from 'node:path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const DEFAULT_UPLOAD_DIR = path.join(os.tmpdir(), 'sign-guy-designs');

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

    res.status(200).json({
      ok: true,
      folder: customerDir,
      files: savedFiles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not save project files.' });
  }
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
  const fields = ['projectFile', 'logo', 'renderScreenshot1', 'renderScreenshot2'];
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
