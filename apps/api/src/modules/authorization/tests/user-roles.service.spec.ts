import { ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRolesService } from '../services/user-roles.service';
describe('UserRolesService', () => {
  const repository = {
    role: jest.fn(),
    assign: jest.fn(),
    remove: jest.fn(),
    userRoles: jest.fn(),
  };
  const contexts = { resolve: jest.fn() };
  const service = new UserRolesService(repository as never, contexts as never);
  beforeEach(() => jest.clearAllMocks());
  it('prevents non-Administrators assigning Administrator', async () => {
    contexts.resolve.mockResolvedValue({
      isAdministrator: false,
      permissions: ['users.assign_roles'],
    });
    repository.role.mockResolvedValue({
      code: 'ADMINISTRATOR',
      permissions: [],
    });
    await expect(
      service.assign('actor', 'user', 'role'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('protects the last active Administrator', async () => {
    repository.remove.mockRejectedValue(new Error('LAST_ADMINISTRATOR'));
    await expect(
      service.remove('actor', 'user', 'role'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
