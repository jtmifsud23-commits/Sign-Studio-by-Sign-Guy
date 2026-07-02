import { issueSignedToken } from '@vercel/blob';
import { handleUpload, handleUploadPresigned } from '@vercel/blob/client';

const TEN_MINUTES_MS = 10 * 60 * 1000;
const MB = 1024 * 1024;
const UNUSED_WEBHOOK_PUBLIC_KEY = 'sign-studio-presigned-upload-without-callbacks';
const UPLOAD_RULES = Object.freeze({
  projectFile: {
    allowedContentTypes: ['application/x-signguy+json', 'application/json', 'application/octet-stream'],
    maximumSizeInBytes: 48 * MB,
  },
  logo: {
    allowedContentTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/heic', 'image/heif', 'application/octet-stream'],
    maximumSizeInBytes: 30 * MB,
  },
  logoPreview: {
    allowedContentTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maximumSizeInBytes: 12 * MB,
  },
  renderScreenshot1: {
    allowedContentTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maximumSizeInBytes: 12 * MB,
  },
  renderScreenshot2: {
    allowedContentTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maximumSizeInBytes: 12 * MB,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    if (!isSameOriginRequest(req)) {
      res.status(403).json({ error: 'Cross-origin uploads are not allowed.' });
      return;
    }

    const body = await readJsonBody(req);
    if (body?.type === 'blob.generate-client-token') {
      const response = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const upload = validateUploadRequest(pathname, clientPayload);
          return makeUploadTokenOptions(upload);
        },
      });

      res.status(200).json(response);
      return;
    }

    if (body?.type !== 'blob.generate-presigned-url') {
      throw new Error('Unsupported private Blob upload event.');
    }
    const response = await handleUploadPresigned({
      body,
      request: req,
      // The SDK requires this even when no upload-completed callback is configured.
      webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY || UNUSED_WEBHOOK_PUBLIC_KEY,
      getSignedToken: async (pathname, clientPayload) => {
        const upload = validateUploadRequest(pathname, clientPayload);
        const validUntil = Date.now() + TEN_MINUTES_MS;
        const token = await issueSignedToken({
          pathname: '*',
          operations: ['put'],
          allowedContentTypes: upload.rule.allowedContentTypes,
          maximumSizeInBytes: upload.rule.maximumSizeInBytes,
          validUntil,
        });

        return {
          token,
          urlOptions: {
            allowedContentTypes: upload.rule.allowedContentTypes,
            maximumSizeInBytes: upload.rule.maximumSizeInBytes,
            validUntil,
            addRandomSuffix: true,
            allowOverwrite: false,
            cacheControlMaxAge: 60 * 60,
            tokenPayload: JSON.stringify({ orderId: upload.orderId, kind: upload.kind }),
          },
        };
      },
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Could not authorize private Blob upload.', error);
    res.status(400).json({ error: error?.message || 'Could not authorize upload.' });
  }
}

function makeUploadTokenOptions(upload) {
  const validUntil = Date.now() + TEN_MINUTES_MS;
  return {
    allowedContentTypes: upload.rule.allowedContentTypes,
    maximumSizeInBytes: upload.rule.maximumSizeInBytes,
    validUntil,
    addRandomSuffix: true,
    allowOverwrite: false,
    cacheControlMaxAge: 60 * 60,
    tokenPayload: JSON.stringify({ orderId: upload.orderId, kind: upload.kind }),
  };
}

function validateUploadRequest(pathname, clientPayload) {
  const match = String(pathname || '').match(/^orders\/([a-z0-9_-]{8,96})\/(projectFile|logoPreview|logo|renderScreenshot1|renderScreenshot2)-([^/]{1,180})$/i);
  if (!match) throw new Error('Invalid upload pathname.');

  let payload;
  try {
    payload = JSON.parse(clientPayload || '{}');
  } catch {
    throw new Error('Invalid upload metadata.');
  }

  const [, orderId, kind] = match;
  if (payload.orderId !== orderId || payload.kind !== kind) {
    throw new Error('Upload metadata does not match the destination.');
  }

  const rule = UPLOAD_RULES[kind];
  if (!rule) throw new Error('Unsupported upload type.');
  return { orderId, kind, rule };
}

function isSameOriginRequest(request) {
  const origin = getHeader(request, 'origin');
  if (!origin) return true;
  const forwardedHost = getHeader(request, 'x-forwarded-host');
  const host = forwardedHost || getHeader(request, 'host');
  try {
    return Boolean(host && new URL(origin).host === host);
  } catch {
    return false;
  }
}

function getHeader(request, name) {
  if (typeof request.headers?.get === 'function') return request.headers.get(name);
  return request.headers?.[name.toLowerCase()] || request.headers?.[name] || '';
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
