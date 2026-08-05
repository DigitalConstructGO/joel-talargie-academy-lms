import { RolesController } from '../controllers/roles.controller';

describe('RolesController', () => {
  const roles = {
    list: jest.fn(),
    create: jest.fn(),
    details: jest.fn(),
    update: jest.fn(),
    replacePermissions: jest.fn(),
    archive: jest.fn(),
  };
  const controller = new RolesController(roles as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lists roles', () => {
    controller.list({} as never);
    expect(roles.list).toHaveBeenCalledWith({});
  });

  it('creates a role with the acting admin id', () => {
    controller.create(actor, { name: 'Support' } as never);
    expect(roles.create).toHaveBeenCalledWith('admin-1', { name: 'Support' });
  });

  it('gets role details', () => {
    controller.details('role-1');
    expect(roles.details).toHaveBeenCalledWith('role-1');
  });

  it('updates a role with the acting admin id', () => {
    controller.update(actor, 'role-1', { name: 'Renamed' } as never);
    expect(roles.update).toHaveBeenCalledWith('admin-1', 'role-1', {
      name: 'Renamed',
    });
  });

  it('replaces role permissions, extracting permissionIds from the DTO', () => {
    controller.permissions(actor, 'role-1', { permissionIds: ['p1', 'p2'] });
    expect(roles.replacePermissions).toHaveBeenCalledWith('admin-1', 'role-1', [
      'p1',
      'p2',
    ]);
  });

  it('archives a role with the acting admin id', () => {
    controller.archive(actor, 'role-1');
    expect(roles.archive).toHaveBeenCalledWith('admin-1', 'role-1');
  });
});
