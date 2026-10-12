import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
const secret = () => process.env.ADMIN_PASSWORD || process.env.SMTP_PASS || '';
export function issueAdminToken({ key = secret(), now = Date.now() } = {}) {
  if (!key) throw new Error('Admin session signing is unavailable');
  const payload = Buffer.from(JSON.stringify({ exp: now + 8 * 60 * 60 * 1000, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  return `${payload}.${createHmac('sha256', key).update(payload).digest('base64url')}`;
}
export function verifyAdminToken(token, { key = secret(), now = Date.now() } = {}) {
  try {
    if (!key || typeof token !== 'string' || token.length > 1024) return false;
    const [payload, signature, extra] = token.split('.');
    if (extra || !payload || !signature) return false;
    const expected = createHmac('sha256', key).update(payload).digest(), supplied = Buffer.from(signature, 'base64url');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Number.isFinite(session.exp) && session.exp > now && session.exp <= now + 8 * 60 * 60 * 1000;
  } catch { return false; }
}
export function hasAdminSession(req) {
  const header = req.headers?.get?.('authorization') || req.headers?.authorization || '';
  return verifyAdminToken(String(header).replace(/^Bearer\s+/i, ''));
}
