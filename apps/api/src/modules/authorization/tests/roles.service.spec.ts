import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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

  it('list() maps query params to repository pagination', () => {
    service.list({ page: 2, pageSize: 20, search: 'manager' } as never);
    expect(repository.roles).toHaveBeenCalledWith({
      search: 'manager',
      isSystem: undefined,
      archived: undefined,
      limit: 20,
      offset: 20,
    });
  });

  describe('details', () => {
    it('throws NotFoundException for a missing role', async () => {
      repository.role.mockResolvedValueOnce(undefined);
      await expect(service.details('role-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the role when found', async () => {
      repository.role.mockResolvedValueOnce({ id: 'role-1' });
      await expect(service.details('role-1')).resolves.toEqual({
        id: 'role-1',
      });
    });
  });

  it('blocks role creation when the actor context is missing or inactive', async () => {
    contexts.resolve.mockResolvedValueOnce(undefined);
    await expect(
      service.create('missing-actor', {
        name: 'X',
        code: 'X',
        permissionIds: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    contexts.resolve.mockResolvedValueOnce({
      status: 'SUSPENDED',
      isAdministrator: false,
    });
    await expect(
      service.create('suspended-actor', {
        name: 'X',
        code: 'X',
        permissionIds: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  describe('create() error mapping', () => {
    beforeEach(() => {
      contexts.resolve.mockResolvedValue({
        status: 'ACTIVE',
        isAdministrator: true,
      });
    });

    it('maps an INVALID_PERMISSION repository error', async () => {
      repository.create.mockRejectedValueOnce(new Error('INVALID_PERMISSION'));
      await expect(
        service.create('admin', { name: 'X', code: 'X', permissionIds: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('maps a PRIVILEGE_ESCALATION repository error', async () => {
      repository.create.mockRejectedValueOnce(
        new Error('PRIVILEGE_ESCALATION'),
      );
      await expect(
        service.create('admin', { name: 'X', code: 'X', permissionIds: [] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('maps a duplicate-key repository error to ConflictException', async () => {
      repository.create.mockRejectedValueOnce(
        new Error('duplicate key value violates unique constraint'),
      );
      await expect(
        service.create('admin', { name: 'X', code: 'X', permissionIds: [] }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows an unrecognized repository error', async () => {
      repository.create.mockRejectedValueOnce(new Error('boom'));
      await expect(
        service.create('admin', { name: 'X', code: 'X', permissionIds: [] }),
      ).rejects.toThrow('boom');
    });
  });

   describe('replacePermissions', () => {
    it('checks assignability before delegating to the repository', async () => {
      contexts.resolve.mockResolvedValueOnce({
        status: 'ACTIVE',
        isAdministrator: true,
      });
      repository.replacePermissions.mockResolvedValueOnce({ ok: true });
      await expect(
        service.replacePermissions('admin', 'role-1', ['permission-1']),
      ).resolves.toEqual({ ok: true });
    });

    it('maps a ROLE_NOT_FOUND repository error', async () => {
      contexts.resolve.mockResolvedValueOnce({
        status: 'ACTIVE',
        isAdministrator: true,
      });
      repository.replacePermissions.mockRejectedValueOnce(
        new Error('ROLE_NOT_FOUND'),
      );
      await expect(
        service.replacePermissions('admin', 'role-1', []),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('maps an INVALID_PERMISSION repository error to BadRequestException', async () => {
      contexts.resolve.mockResolvedValueOnce({
        status: 'ACTIVE',
        isAdministrator: true,
      });
      repository.replacePermissions.mockRejectedValueOnce(
        new Error('INVALID_PERMISSION'),
      );
      await expect(
        service.replacePermissions('admin', 'role-1', ['bad-id']),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('archive', () => {
    it('archives the role on success', async () => {
      repository.archive.mockResolvedValueOnce({ archived: true });
      await expect(service.archive('admin', 'role-1')).resolves.toEqual({
        archived: true,
      });
    });

    it('maps a ROLE_NOT_FOUND error', async () => {
      repository.archive.mockRejectedValueOnce(new Error('ROLE_NOT_FOUND'));
      await expect(service.archive('admin', 'role-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('maps a duplicate-key error to ConflictException', async () => {
      repository.archive.mockRejectedValueOnce(
        new Error('duplicate key value'),
      );
      await expect(service.archive('admin', 'role-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows an unrecognized error', async () => {
      repository.archive.mockRejectedValueOnce(new Error('boom'));
      await expect(service.archive('admin', 'role-1')).rejects.toThrow('boom');
    });
  });
});
