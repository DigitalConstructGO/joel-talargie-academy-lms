import { ForbiddenException } from '@nestjs/common';
import { RolesService } from '../services/roles.service';
describe('RolesService', () => {
  const repository = {
    permissions: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    replacePermissions: jest.fn(),
    archive: jest.fn(),
    role: jest.fn(),
    roles: jest.fn(),
  };
  const contexts = { resolve: jest.fn() };
  const service = new RolesService(repository as never, contexts as never);
  beforeEach(() => jest.clearAllMocks());
  it('lets a system Administrator create a custom role', async () => {
    contexts.resolve.mockResolvedValue({
      status: 'ACTIVE',
      isAdministrator: true,
    });
    repository.create.mockResolvedValue({ code: 'COURSE_MANAGER' });
    await expect(
      service.create('admin', {
        name: 'Course Manager',
        code: 'COURSE_MANAGER',
        permissionIds: [],
      }),
    ).resolves.toEqual({ code: 'COURSE_MANAGER' });
  });
  it('blocks delegated privilege escalation', async () => {
    contexts.resolve.mockResolvedValue({
      status: 'ACTIVE',
      isAdministrator: false,
      permissions: ['roles.create'],
    });
    repository.permissions.mockResolvedValue([
      { id: 'permission-id', code: 'payments.approve' },
    ]);
    await expect(
      service.create('manager', {
        name: 'Unsafe',
        code: 'UNSAFE',
        permissionIds: ['permission-id'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('protects system roles from updates', async () => {
    repository.update.mockRejectedValue(new Error('SYSTEM_ROLE'));
    await expect(
      service.update('admin', 'role-id', { name: 'Renamed' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
