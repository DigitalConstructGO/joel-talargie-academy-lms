import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { GoogleStrategy } from '../strategies/google.strategy';
describe('GoogleStrategy', () => {
  const strategy = new GoogleStrategy(
    new ConfigService({
      GOOGLE_CLIENT_ID: 'client',
      GOOGLE_CLIENT_SECRET: 'secret',
      GOOGLE_CALLBACK_URL: 'http://localhost/callback',
    }),
  );
  it('extracts only server-authenticated profile fields', () => {
    const done = jest.fn();
    strategy.validate(
      '',
      '',
      {
        id: 'google-1',
        emails: [{ value: 'USER@example.com', verified: 'true' }],
        name: { givenName: 'First', familyName: 'Last' },
        photos: [{ value: 'https://example.com/avatar.png' }],
        _json: { email_verified: true },
      } as never,
      done,
    );
    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        googleId: 'google-1',
        email: 'user@example.com',
        emailVerified: true,
      }),
    );
  });
  it('rejects an unverified Google email', () => {
    const done = jest.fn();
    strategy.validate(
      '',
      '',
      {
        id: 'google-1',
        emails: [{ value: 'user@example.com' }],
        _json: { email_verified: false },
      } as never,
      done,
    );
    expect(done.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedException);
  });
});
