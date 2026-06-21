import { issueSignedToken } from '@vercel/blob';
import { handleUploadPresigned } from '@vercel/blob/client';

const TEN_MINUTES_MS = 10 * 60 * 1000;
const MB = 1024 * 1024;
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

export default async function handler(request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } });
  }
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: 'Cross-origin uploads are not allowed.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const response = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload) => {
        const upload = validateUploadRequest(pathname, clientPayload);
        const validUntil = Date.now() + TEN_MINUTES_MS;
        const token = await issueSignedToken({
          pathname,
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

    return Response.json(response);
  } catch (error) {
    console.error('Could not authorize private Blob upload.', error);
    return Response.json({ error: error?.message || 'Could not authorize upload.' }, { status: 400 });
  }
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
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  try {
    return Boolean(host && new URL(origin).host === host);
  } catch {
    return false;
  }
}
