import {
  BadRequestException,
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
  const notifications = { notify: jest.fn().mockResolvedValue(null) };
  const config = {
    get: jest.fn((key: string) =>
      key === 'EMAIL_SUPPORT_ADDRESS' ? 'support@example.com' : undefined,
    ),
  };
  const service = new UsersService(
    repository as never,
    auth as never,
    notifications as never,
    config as never,
  );

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

  it('profile() throws NotFoundException for a missing user', async () => {
    repository.safe.mockResolvedValueOnce(undefined);
    await expect(service.profile('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updateProfile() tags the audit action based on the admin flag', () => {
    const actor = { id: 'admin-1' } as never;
    service.updateProfile(actor, 'user-1', { fullName: 'New' } as never, true);
    expect(repository.profile).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin.user_profile.updated' }),
    );

    service.updateProfile(actor, 'user-1', { fullName: 'New' } as never, false);
    expect(repository.profile).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.profile.updated' }),
    );
  });

  it('preferences() and updatePreferences() delegate to the repository', () => {
    service.preferences('user-1');
    expect(repository.preferences).toHaveBeenCalledWith('user-1');
    service.updatePreferences('user-1', { emailLearning: false } as never);
    expect(repository.updatePreferences).toHaveBeenCalledWith('user-1', {
      emailLearning: false,
    });
  });

  it('sessions() defaults to "Unknown device" when there is no user agent', async () => {
    repository.sessions.mockResolvedValueOnce([
      { id: 's1', ipAddress: null, userAgent: null },
    ]);
    const [session] = await service.sessions('user-1');
    expect(session.deviceName).toBe('Unknown device');
    expect(session.currentSession).toBe(false);
  });

  it('revoke() / revokeAll() pass the actor, target, and admin flag through', () => {
    const actor = { id: 'admin-1' } as never;
    service.revoke(actor, 'user-1', 'session-1', true);
    expect(repository.revoke).toHaveBeenCalledWith({
      actorId: 'admin-1',
      userId: 'user-1',
      sessionId: 'session-1',
      admin: true,
    });

    service.revokeAll(actor, 'user-1', 'keep-session', false);
    expect(repository.revokeAll).toHaveBeenCalledWith({
      actorId: 'admin-1',
      userId: 'user-1',
      keepSessionId: 'keep-session',
      admin: false,
    });
  });

  it('revoke() maps SESSION_NOT_FOUND to NotFoundException', async () => {
    const actor = { id: 'user-1' } as never;
    repository.revoke.mockRejectedValueOnce(new Error('SESSION_NOT_FOUND'));
    await expect(
      service.revoke(actor, 'user-1', 'session-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('revoke() maps SESSION_ALREADY_REVOKED to ConflictException', async () => {
    const actor = { id: 'user-1' } as never;
    repository.revoke.mockRejectedValueOnce(
      new Error('SESSION_ALREADY_REVOKED'),
    );
    await expect(
      service.revoke(actor, 'user-1', 'session-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('revoke() rethrows an unrecognized error', async () => {
    const actor = { id: 'user-1' } as never;
    repository.revoke.mockRejectedValueOnce(new Error('boom'));
    await expect(service.revoke(actor, 'user-1', 'session-1')).rejects.toThrow(
      'boom',
    );
  });

  it('list() maps query params to repository pagination', () => {
    service.list({
      page: 2,
      pageSize: 10,
      search: 'ada',
      status: 'ACTIVE',
      role: 'STUDENT',
      provider: 'LOCAL',
      emailVerified: true,
      includeArchived: false,
    } as never);
    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 10, search: 'ada' }),
    );
  });

  it('detail() merges profile, summary, and preferences', async () => {
    repository.safe.mockResolvedValueOnce({ id: 'user-1' });
    repository.summary.mockResolvedValueOnce({ enrollmentCount: 3 });
    repository.preferences.mockResolvedValueOnce({ emailLearning: true });
    const result = await service.detail('user-1');
    expect(result).toEqual({
      id: 'user-1',
      enrollmentCount: 3,
      notificationPreferences: { emailLearning: true },
    });
  });

  it('transition() maps REASON_REQUIRED to BadRequestException', async () => {
    repository.transition.mockRejectedValueOnce(new Error('REASON_REQUIRED'));
    await expect(
      service.transition('actor-1', 'user-1', 'SUSPENDED', undefined, 'x'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transition() rethrows an unrecognized error', async () => {
    repository.transition.mockRejectedValueOnce(new Error('boom'));
    await expect(
      service.transition('actor-1', 'user-1', 'SUSPENDED', 'reason', 'x'),
    ).rejects.toThrow('boom');
  });

  it('transition() returns the repository result on success', async () => {
    repository.transition.mockResolvedValueOnce({ status: 'SUSPENDED' });
    await expect(
      service.transition('actor-1', 'user-1', 'SUSPENDED', 'reason', 'x'),
    ).resolves.toEqual({ status: 'SUSPENDED' });
  });

  it('activity() maps query params to repository pagination', () => {
    service.activity('user-1', {
      page: 1,
      pageSize: 20,
      action: 'login',
    } as never);
    expect(repository.activity).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'login',
      limit: 20,
      offset: 0,
    });
  });

  it('triggerReset() looks up the profile email and forwards to AuthService.forgotPassword', async () => {
    repository.safe.mockResolvedValueOnce({
      id: 'user-1',
      email: 'ada@example.com',
    });
    const result = await service.triggerReset('admin-1', 'user-1');
    expect(auth.forgotPassword).toHaveBeenCalledWith('ada@example.com');
    expect(result.message).toContain('If password login is available');
  });

  describe('account-status emails', () => {
    const user = {
      id: 'user-1',
      email: 'student@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      fullName: 'Ada Lovelace',
    };

    it.each([
      ['admin.user.activated', 'ACCOUNT_ACTIVATED'],
      ['admin.user.suspended', 'ACCOUNT_SUSPENDED'],
      ['admin.user.archived', 'ACCOUNT_ARCHIVED'],
      ['admin.user.restored', 'ACCOUNT_RESTORED'],
    ] as const)(
      'emails %s with the matching template',
      async (action, templateCode) => {
        repository.transition.mockResolvedValueOnce('ACTIVE');
        repository.safe.mockResolvedValueOnce(user);
        await service.transition(
          'admin-1',
          'user-1',
          'ACTIVE',
          undefined,
          action,
        );
        expect(notifications.notify).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-1',
            recipientEmail: 'student@example.com',
            templateCode,
            variables: expect.objectContaining({ recipientName: 'Ada' }),
          }),
        );
      },
    );

    it('does not email when the action has no account-status template', async () => {
      repository.transition.mockResolvedValueOnce('ACTIVE');
      await service.transition(
        'admin-1',
        'user-1',
        'ACTIVE',
        undefined,
        'custom.action',
      );
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('skips the email when the target user cannot be resolved', async () => {
      repository.transition.mockResolvedValueOnce('ACTIVE');
      repository.safe.mockResolvedValueOnce(undefined);
      await service.transition(
        'admin-1',
        'user-1',
        'ACTIVE',
        undefined,
        'admin.user.activated',
      );
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('keeps the transition result even when the email send fails', async () => {
      repository.transition.mockResolvedValueOnce('ACTIVE');
      repository.safe.mockResolvedValueOnce(user);
      notifications.notify.mockRejectedValueOnce(new Error('smtp down'));
      await expect(
        service.transition(
          'admin-1',
          'user-1',
          'ACTIVE',
          undefined,
          'admin.user.activated',
        ),
      ).resolves.toBe('ACTIVE');
    });
  });

  describe('admin session-revoked emails', () => {
    it('emails the target user when an administrator revokes a single session', async () => {
      repository.revoke.mockResolvedValueOnce('session-1');
      repository.safe.mockResolvedValueOnce({
        id: 'user-1',
        email: 'student@example.com',
        firstName: 'Ada',
        fullName: 'Ada Lovelace',
      });
      await service.revoke(
        { id: 'admin-1' } as never,
        'user-1',
        'session-1',
        true,
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          templateCode: 'SESSION_REVOKED_BY_ADMIN',
          deduplicationKey: 'session-revoked:user-1:session-1',
        }),
      );
    });

    it('does not email when a user revokes their own session', async () => {
      repository.revoke.mockResolvedValueOnce('session-1');
      await service.revoke(
        { id: 'user-1' } as never,
        'user-1',
        'session-1',
        false,
      );
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('emails the target user when an administrator revokes all sessions', async () => {
      repository.revokeAll.mockResolvedValueOnce(2);
      repository.safe.mockResolvedValueOnce({
        id: 'user-1',
        email: 'student@example.com',
        firstName: 'Ada',
        fullName: 'Ada Lovelace',
      });
      await service.revokeAll(
        { id: 'admin-1' } as never,
        'user-1',
        undefined,
        true,
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          templateCode: 'SESSION_REVOKED_BY_ADMIN',
        }),
      );
    });
  });
});
