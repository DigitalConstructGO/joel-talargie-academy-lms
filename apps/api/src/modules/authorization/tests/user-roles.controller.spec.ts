import { UserRolesController } from '../controllers/user-roles.controller';

describe('UserRolesController', () => {
  const roles = { list: jest.fn(), assign: jest.fn(), remove: jest.fn() };
  const controller = new UserRolesController(roles as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lists a target user’s roles', () => {
    controller.list('user-1');
    expect(roles.list).toHaveBeenCalledWith('user-1');
  });

  it('assigns a role, extracting roleId from the DTO', () => {
    controller.assign(actor, 'user-1', { roleId: 'role-1' });
    expect(roles.assign).toHaveBeenCalledWith('admin-1', 'user-1', 'role-1');
  });

  it('removes a role from a user', () => {
    controller.remove(actor, 'user-1', 'role-1');
    expect(roles.remove).toHaveBeenCalledWith('admin-1', 'user-1', 'role-1');
  });
});
