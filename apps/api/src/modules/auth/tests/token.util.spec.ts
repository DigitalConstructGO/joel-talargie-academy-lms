import { hashToken, secureToken } from '../utils/token.util';

describe('secureToken', () => {
  it('produces a sufficiently long, URL-safe, unique random token', () => {
    const a = secureToken();
    const b = secureToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{32,}$/);
    expect(a).not.toBe(b);
  });
});

describe('hashToken', () => {
  it('is deterministic for the same input', () => {
    expect(hashToken('same-input')).toBe(hashToken('same-input'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashToken('input-a')).not.toBe(hashToken('input-b'));
  });

  it('never returns the plaintext token itself', () => {
    const token = secureToken();
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });
});
