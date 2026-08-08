import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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

  it('list() delegates to the repository', () => {
    service.list('user-1');
    expect(repository.userRoles).toHaveBeenCalledWith('user-1');
  });

  it('throws NotFoundException when the actor context or role cannot be resolved', async () => {
    contexts.resolve.mockResolvedValueOnce(undefined);
    repository.role.mockResolvedValueOnce({ code: 'STUDENT', permissions: [] });
    await expect(
      service.assign('actor', 'user', 'role'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects assigning an archived role', async () => {
    contexts.resolve.mockResolvedValueOnce({ isAdministrator: true });
    repository.role.mockResolvedValueOnce({
      code: 'STUDENT',
      archivedAt: new Date(),
      permissions: [],
    });
    await expect(
      service.assign('actor', 'user', 'role'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks assigning a role with permissions the actor does not possess', async () => {
    contexts.resolve.mockResolvedValueOnce({
      isAdministrator: false,
      permissions: ['users.assign_roles'],
    });
    repository.role.mockResolvedValueOnce({
      code: 'COURSE_MANAGER',
      permissions: [{ code: 'catalog.manage' }],
    });
    await expect(
      service.assign('actor', 'user', 'role'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assigns the role when the actor is authorized', async () => {
    contexts.resolve.mockResolvedValueOnce({ isAdministrator: true });
    repository.role.mockResolvedValueOnce({ code: 'STUDENT', permissions: [] });
    repository.assign.mockResolvedValueOnce({ assigned: true });
    await expect(service.assign('actor', 'user', 'role')).resolves.toEqual({
      assigned: true,
    });
  });

  it('maps every assign()/remove() repository error code', async () => {
    const cases: Array<[string, unknown]> = [
      ['USER_NOT_FOUND', NotFoundException],
      ['ROLE_ALREADY_ASSIGNED', ConflictException],
      ['STUDENT_ROLE_REQUIRED', ForbiddenException],
      ['PRIVILEGE_ESCALATION', ForbiddenException],
    ];
    for (const [code, expected] of cases) {
      repository.remove.mockRejectedValueOnce(new Error(code));
      await expect(
        service.remove('actor', 'user', 'role'),
      ).rejects.toBeInstanceOf(expected as never);
    }
  });

  it('rethrows an unrecognized repository error', async () => {
    repository.remove.mockRejectedValueOnce(new Error('boom'));
    await expect(service.remove('actor', 'user', 'role')).rejects.toThrow(
      'boom',
    );
  });

  it('removes the role on success', async () => {
    repository.remove.mockResolvedValueOnce({ removed: true });
    await expect(service.remove('actor', 'user', 'role')).resolves.toEqual({
      removed: true,
    });
  });
});
