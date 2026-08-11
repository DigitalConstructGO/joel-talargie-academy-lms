import { createHmac } from 'node:crypto';
import {
  signStorageToken,
  verifyStorageToken,
} from '../utils/signed-token.util';

describe('signed storage tokens', () => {
  const secret = 'test-signing-secret';

  it('verifies a token it just signed', () => {
    const token = signStorageToken('avatars/abc.png', secret, 900, 'inline');
    const result = verifyStorageToken(token, secret);
    expect(result).toMatchObject({
      valid: true,
      payload: { key: 'avatars/abc.png', disposition: 'inline' },
    });
  });

  it('carries the attachment disposition through unchanged', () => {
    const token = signStorageToken(
      'certificates/one.pdf',
      secret,
      900,
      'attachment',
    );
    const result = verifyStorageToken(token, secret);
    expect(result).toMatchObject({
      valid: true,
      payload: { disposition: 'attachment' },
    });
  });

  it('rejects a token signed with a different secret', () => {
    const token = signStorageToken(
      'avatars/abc.png',
      secret,
      900,
      'attachment',
    );
    const result = verifyStorageToken(token, 'a-different-secret');
    expect(result).toEqual({ valid: false, reason: 'SIGNATURE_INVALID' });
  });

  it('rejects a tampered payload even if the signature segment is untouched', () => {
    const token = signStorageToken(
      'avatars/abc.png',
      secret,
      900,
      'attachment',
    );
    const [, signature] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({
        key: 'certificates/someone-elses.pdf',
        exp: Date.now() + 900_000,
        disposition: 'attachment',
      }),
    ).toString('base64url');
    const result = verifyStorageToken(`${forgedPayload}.${signature}`, secret);
    expect(result).toEqual({ valid: false, reason: 'SIGNATURE_INVALID' });
  });

  it('rejects an expired token', () => {
    const token = signStorageToken('avatars/abc.png', secret, -1, 'inline');
    const result = verifyStorageToken(token, secret);
    expect(result).toEqual({ valid: false, reason: 'EXPIRED' });
  });

  it('rejects a malformed token', () => {
    expect(verifyStorageToken('not-a-real-token', secret)).toEqual({
      valid: false,
      reason: 'MALFORMED',
    });
    expect(verifyStorageToken('', secret)).toEqual({
      valid: false,
      reason: 'MALFORMED',
    });
  });

  it('rejects a payload with an invalid disposition value', () => {
    const encodedPayload = Buffer.from(
      JSON.stringify({
        key: 'avatars/abc.png',
        exp: Date.now() + 900_000,
        disposition: 'not-a-real-disposition',
      }),
    ).toString('base64url');
    const signature = createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');
    const result = verifyStorageToken(`${encodedPayload}.${signature}`, secret);
    expect(result).toEqual({ valid: false, reason: 'MALFORMED' });
  });
});
