import { validateEnvironment } from './environment';

describe('database environment validation', () => {
  it('allows missing database configuration outside production', () => {
    expect(validateEnvironment({ NODE_ENV: 'test' }).DATABASE_URL).toBe('');
  });

  it('requires the runtime URL in production without leaking supplied details', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
      'Database configuration: is required in production',
    );
  });

  it('sanitizes invalid database URLs', () => {
    const secret =
      'postgresql://private-user:private-password@private-host/database';
    let message = '';
    try {
      validateEnvironment({ NODE_ENV: 'test', DATABASE_URL: secret });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain('Database configuration');
    expect(message).not.toContain('private-user');
    expect(message).not.toContain('private-password');
    expect(message).not.toContain('private-host');
  });
});
