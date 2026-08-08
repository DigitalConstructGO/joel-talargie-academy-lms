import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PermissionMode } from '../enums/permission-mode.enum';
const execution = (request: object = { user: { id: 'user-id' } }) =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  }) as never;
describe('PermissionsGuard', () => {
  const context = {
    userId: 'user-id',
    status: 'ACTIVE' as const,
    roles: ['EDITOR'],
    permissions: ['courses.read', 'courses.update'],
    isAdministrator: false,
  };
  const audit = { logCustom: jest.fn() };
  it('requires every permission in ALL mode', async () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(['courses.read', 'courses.update'])
        .mockReturnValueOnce(PermissionMode.ALL),
    } as unknown as Reflector;
    await expect(
      new PermissionsGuard(
        reflector,
        { resolve: jest.fn().mockResolvedValue(context) } as never,
        audit as never,
      ).canActivate(execution()),
    ).resolves.toBe(true);
  });
  it('allows one matching permission in ANY mode', async () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(['courses.publish', 'courses.read'])
        .mockReturnValueOnce(PermissionMode.ANY),
    } as unknown as Reflector;
    await expect(
      new PermissionsGuard(
        reflector,
        { resolve: jest.fn().mockResolvedValue(context) } as never,
        audit as never,
      ).canActivate(execution()),
    ).resolves.toBe(true);
  });
  it('rejects missing and freshly removed permissions', async () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(['payments.approve'])
        .mockReturnValueOnce(PermissionMode.ALL),
    } as unknown as Reflector;
    await expect(
      new PermissionsGuard(
        reflector,
        { resolve: jest.fn().mockResolvedValue(context) } as never,
        audit as never,
      ).canActivate(execution()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('rejects suspended users even with JWT role claims', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['courses.read']),
    } as unknown as Reflector;
    await expect(
      new PermissionsGuard(
        reflector,
        {
          resolve: jest
            .fn()
            .mockResolvedValue({ ...context, status: 'SUSPENDED' }),
        } as never,
        audit as never,
      ).canActivate(
        execution({ user: { id: 'user-id', roles: ['ADMINISTRATOR'] } }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
