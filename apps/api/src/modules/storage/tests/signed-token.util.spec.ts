import {
  signStorageToken,
  verifyStorageToken,
} from '../utils/signed-token.util';

describe('signed storage tokens', () => {
  const secret = 'test-signing-secret';

  it('verifies a token it just signed', () => {
    const token = signStorageToken('avatars/abc.png', secret, 900);
    const result = verifyStorageToken(token, secret);
    expect(result).toMatchObject({
      valid: true,
      payload: { key: 'avatars/abc.png' },
    });
  });

  it('rejects a token signed with a different secret', () => {
    const token = signStorageToken('avatars/abc.png', secret, 900);
    const result = verifyStorageToken(token, 'a-different-secret');
    expect(result).toEqual({ valid: false, reason: 'SIGNATURE_INVALID' });
  });

  it('rejects a tampered payload even if the signature segment is untouched', () => {
    const token = signStorageToken('avatars/abc.png', secret, 900);
    const [, signature] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({
        key: 'certificates/someone-elses.pdf',
        exp: Date.now() + 900_000,
      }),
    ).toString('base64url');
    const result = verifyStorageToken(`${forgedPayload}.${signature}`, secret);
    expect(result).toEqual({ valid: false, reason: 'SIGNATURE_INVALID' });
  });

  it('rejects an expired token', () => {
    const token = signStorageToken('avatars/abc.png', secret, -1);
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
});
