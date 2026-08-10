import { validateEnvironment } from './environment';

describe('database environment validation', () => {
  it('allows missing database configuration outside production', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'test',
        WEB_URL: 'http://localhost:3000',
      }).DATABASE_URL,
    ).toBe('');
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

describe('production secret validation', () => {
  const validProductionBase = {
    NODE_ENV: 'production' as const,
    WEB_URL: 'https://academy.example.com',
    DATABASE_URL: 'postgresql://user:pass@host/db?sslmode=require',
    GOOGLE_CLIENT_ID: 'a-real-client-id',
    GOOGLE_CLIENT_SECRET: 'a-real-client-secret',
    JWT_ACCESS_SECRET: 'x'.repeat(32),
    JWT_REFRESH_SECRET: 'y'.repeat(32),
    STORAGE_SIGNING_SECRET: 'z'.repeat(32),
    AUTH_COOKIE_SECURE: 'true',
  };

  it('allows the insecure JWT default outside production', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'test',
        WEB_URL: 'http://localhost:3000',
      }).JWT_ACCESS_SECRET,
    ).toBe('development-access-secret-change-me-now');
  });

  it('rejects the publicly-committed JWT access secret default in production', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionBase,
        JWT_ACCESS_SECRET: 'development-access-secret-change-me-now',
      }),
    ).toThrow('publicly-committed development default');
  });

  it('rejects the publicly-committed JWT refresh secret default in production', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionBase,
        JWT_REFRESH_SECRET: 'development-refresh-secret-change-me-now',
      }),
    ).toThrow('publicly-committed development default');
  });

  it('rejects identical access and refresh secrets in production', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionBase,
        JWT_REFRESH_SECRET: validProductionBase.JWT_ACCESS_SECRET,
      }),
    ).toThrow('must be different from JWT_ACCESS_SECRET');
  });

  it('requires STORAGE_SIGNING_SECRET in production', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionBase,
        STORAGE_SIGNING_SECRET: '',
      }),
    ).toThrow('STORAGE_SIGNING_SECRET');
  });

  it('requires AUTH_COOKIE_SECURE=true in production', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionBase,
        AUTH_COOKIE_SECURE: 'false',
      }),
    ).toThrow('AUTH_COOKIE_SECURE');
  });

  it('accepts a fully-configured production environment', () => {
    expect(() => validateEnvironment(validProductionBase)).not.toThrow();
  });
});
