import { AdminUsersController } from '../controllers/admin-users.controller';

describe('AdminUsersController', () => {
  const users = {
    list: jest.fn(),
    detail: jest.fn(),
    updateProfile: jest.fn(),
    transition: jest.fn(),
    activity: jest.fn(),
    triggerReset: jest.fn(),
  };
  const controller = new AdminUsersController(users as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lists and gets user detail', () => {
    controller.list({} as never);
    expect(users.list).toHaveBeenCalledWith({});
    controller.detail('user-1');
    expect(users.detail).toHaveBeenCalledWith('user-1');
  });

  it('updates a profile as an admin action (forced flag set)', () => {
    controller.update(actor, 'user-1', { firstName: 'A' } as never);
    expect(users.updateProfile).toHaveBeenCalledWith(
      actor,
      'user-1',
      { firstName: 'A' },
      true,
    );
  });

  it('activates a user with no reason required', () => {
    controller.activate(actor, 'user-1');
    expect(users.transition).toHaveBeenCalledWith(
      'admin-1',
      'user-1',
      'ACTIVE',
      undefined,
      'admin.user.activated',
    );
  });

  it('suspends a user with a required reason', () => {
    controller.suspend(actor, 'user-1', { reason: 'ToS violation' } as never);
    expect(users.transition).toHaveBeenCalledWith(
      'admin-1',
      'user-1',
      'SUSPENDED',
      'ToS violation',
      'admin.user.suspended',
    );
  });

  it('archives a user with a required reason', () => {
    controller.archive(actor, 'user-1', {
      reason: 'Requested deletion',
    } as never);
    expect(users.transition).toHaveBeenCalledWith(
      'admin-1',
      'user-1',
      'ARCHIVED',
      'Requested deletion',
      'admin.user.archived',
    );
  });

  it('restores a user with no reason required', () => {
    controller.restore(actor, 'user-1');
    expect(users.transition).toHaveBeenCalledWith(
      'admin-1',
      'user-1',
      'ACTIVE',
      undefined,
      'admin.user.restored',
    );
  });

  it('lists user activity', () => {
    controller.activity('user-1', {} as never);
    expect(users.activity).toHaveBeenCalledWith('user-1', {});
  });

  it('triggers a password reset for a user', () => {
    controller.reset(actor, 'user-1');
    expect(users.triggerReset).toHaveBeenCalledWith('admin-1', 'user-1');
  });
});
