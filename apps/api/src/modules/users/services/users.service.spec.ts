import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const repository = {
    safe: jest.fn(),
    preferences: jest.fn(),
    updatePreferences: jest.fn(),
    profile: jest.fn(),
    sessions: jest.fn(),
    revoke: jest.fn(),
    revokeAll: jest.fn(),
    list: jest.fn(),
    summary: jest.fn(),
    transition: jest.fn(),
    activity: jest.fn(),
  };
  const auth = { forgotPassword: jest.fn() };
  const service = new UsersService(repository as never, auth as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns only the safe profile and notification preferences', async () => {
    repository.safe.mockResolvedValue({
      id: 'user-id',
      email: 'student@example.com',
    });
    repository.preferences.mockResolvedValue({ emailSecurity: true });

    await expect(service.ownProfile('user-id')).resolves.toEqual({
      id: 'user-id',
      email: 'student@example.com',
      notificationPreferences: { emailSecurity: true },
    });
  });

  it('marks the current session and masks the final IP octet', async () => {
    repository.sessions.mockResolvedValue([
      {
        id: 'session-id',
        ipAddress: '192.168.1.25',
        userAgent: 'Chrome Windows Desktop',
      },
    ]);

    const [session] = await service.sessions('user-id', 'session-id');
    expect(session).toMatchObject({
      currentSession: true,
      ipAddress: '192.168.1.***',
      deviceName: 'Chrome Windows Desktop',
    });
  });

  it.each([
    ['CANNOT_MODIFY_OWN_STATUS', ForbiddenException],
    ['LAST_ADMINISTRATOR', ConflictException],
    ['INVALID_STATUS_TRANSITION', ConflictException],
    ['USER_NOT_FOUND', NotFoundException],
  ])(
    'maps %s database failures to safe HTTP errors',
    async (code, exception) => {
      repository.transition.mockRejectedValue(new Error(code));
      await expect(
        service.transition(
          'actor-id',
          'user-id',
          'ACTIVE',
          undefined,
          'admin.user.activated',
        ),
      ).rejects.toBeInstanceOf(exception);
    },
  );
});
