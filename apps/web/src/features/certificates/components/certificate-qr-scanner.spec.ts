import { describe, expect, it } from 'vitest';
import { extractVerificationIdentifier } from './certificate-qr-scanner';

describe('extractVerificationIdentifier', () => {
  it('returns empty string for empty input', () => {
    expect(extractVerificationIdentifier('')).toBe('');
    expect(extractVerificationIdentifier('   ')).toBe('');
  });

  it('extracts token from full public verification URL with path', () => {
    expect(
      extractVerificationIdentifier(
        'https://joeltalargieacademy.com/certificates/verify/mockVerificationToken0000000000000000000001',
      ),
    ).toBe('mockVerificationToken0000000000000000000001');

    expect(
      extractVerificationIdentifier('http://localhost:3000/certificates/verify/JTA-2026-000123'),
    ).toBe('JTA-2026-000123');
  });

  it('extracts token or code from query parameters in URL', () => {
    expect(
      extractVerificationIdentifier(
        'https://joeltalargieacademy.com/certificates/verify?token=TOKEN123',
      ),
    ).toBe('TOKEN123');

    expect(
      extractVerificationIdentifier(
        'https://joeltalargieacademy.com/certificates/verify?code=JTA-2026-999',
      ),
    ).toBe('JTA-2026-999');

    expect(
      extractVerificationIdentifier(
        'https://joeltalargieacademy.com/certificates/verify?q=TEST_CERT',
      ),
    ).toBe('TEST_CERT');
  });

  it('preserves raw certificate codes or tokens', () => {
    expect(extractVerificationIdentifier('JTA-2026-000001')).toBe('JTA-2026-000001');
    expect(extractVerificationIdentifier('  TOKEN_RAW_123  ')).toBe('TOKEN_RAW_123');
  });
});
