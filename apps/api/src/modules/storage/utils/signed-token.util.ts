import { createHmac, timingSafeEqual } from 'node:crypto';

export type StorageDisposition = 'inline' | 'attachment';

export interface StorageTokenPayload {
  key: string;
  exp: number;
  disposition: StorageDisposition;
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export function signStorageToken(
  key: string,
  secret: string,
  ttlSeconds: number,
  disposition: StorageDisposition,
): string {
  const payload: StorageTokenPayload = {
    key,
    exp: Date.now() + ttlSeconds * 1000,
    disposition,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  );
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export type StorageTokenVerification =
  | { valid: true; payload: StorageTokenPayload }
  | { valid: false; reason: 'MALFORMED' | 'SIGNATURE_INVALID' | 'EXPIRED' };

export function verifyStorageToken(
  token: string,
  secret: string,
): StorageTokenVerification {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature)
    return { valid: false, reason: 'MALFORMED' };
  const expectedSignature = sign(encodedPayload, secret);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  )
    return { valid: false, reason: 'SIGNATURE_INVALID' };
  let payload: StorageTokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as StorageTokenPayload;
  } catch {
    return { valid: false, reason: 'MALFORMED' };
  }
  if (
    typeof payload.key !== 'string' ||
    !payload.key ||
    typeof payload.exp !== 'number' ||
    (payload.disposition !== 'inline' && payload.disposition !== 'attachment')
  )
    return { valid: false, reason: 'MALFORMED' };
  if (payload.exp < Date.now()) return { valid: false, reason: 'EXPIRED' };
  return { valid: true, payload };
}
