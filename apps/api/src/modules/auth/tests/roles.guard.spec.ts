import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
describe('RolesGuard', () => {
  const context = (roles: string[]) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { roles } }) }),
    }) as never;
  it('allows a matching role', () => {
    const reflector = {
      getAllAndOverride: () => ['ADMINISTRATOR'],
    } as unknown as Reflector;
    expect(
      new RolesGuard(reflector).canActivate(context(['ADMINISTRATOR'])),
    ).toBe(true);
  });
  it('rejects a missing role', () => {
    const reflector = {
      getAllAndOverride: () => ['ADMINISTRATOR'],
    } as unknown as Reflector;
    expect(() =>
      new RolesGuard(reflector).canActivate(context(['STUDENT'])),
    ).toThrow(ForbiddenException);
  });
});
