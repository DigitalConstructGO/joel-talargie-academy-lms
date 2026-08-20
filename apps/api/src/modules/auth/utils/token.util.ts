import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

export const secureToken = () => randomBytes(32).toString('base64url');

export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export function createSignedOAuthState(secret: string): string {
  const nonce = randomBytes(16).toString('base64url');
  const exp = Date.now() + 15 * 60 * 1000; // 15 minutes TTL
  const payload = Buffer.from(JSON.stringify({ nonce, exp })).toString(
    'base64url',
  );
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySignedOAuthState(state: string, secret: string): boolean {
  if (!state || typeof state !== 'string') return false;
  const parts = state.split('.');
  if (parts.length !== 2) return false;
  const [payloadBase64, signature] = parts;
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }
    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8'),
    );
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
