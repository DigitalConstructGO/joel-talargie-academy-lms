import { AdminUserSessionsController } from '../controllers/admin-user-sessions.controller';

describe('AdminUserSessionsController', () => {
  const users = {
    sessions: jest.fn(),
    revoke: jest.fn(),
    revokeAll: jest.fn(),
  };
  const controller = new AdminUserSessionsController(users as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lists sessions for a target user', () => {
    controller.list('user-1');
    expect(users.sessions).toHaveBeenCalledWith('user-1');
  });

  it('revokes one session as an admin action (forced flag set)', async () => {
    const result = await controller.revoke(actor, 'user-1', 'session-1');
    expect(users.revoke).toHaveBeenCalledWith(
      actor,
      'user-1',
      'session-1',
      true,
    );
    expect(result).toEqual({ message: 'Session revoked' });
  });

  it('revokes all sessions for a user as an admin action (forced flag set)', async () => {
    users.revokeAll.mockResolvedValue(4);
    const result = await controller.all(actor, 'user-1');
    expect(users.revokeAll).toHaveBeenCalledWith(
      actor,
      'user-1',
      undefined,
      true,
    );
    expect(result).toEqual({ revokedSessions: 4 });
  });
});
