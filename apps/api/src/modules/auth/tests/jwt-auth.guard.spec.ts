import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new JwtAuthGuard(reflector);

  function context(): ExecutionContext {
    return { getHandler: () => undefined, getClass: () => undefined } as never;
  }

  beforeEach(() => jest.clearAllMocks());

  it('bypasses authentication for @Public() routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    expect(guard.canActivate(context())).toBe(true);
  });

  it('delegates to the passport JWT strategy for non-public routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const spy = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue('delegated' as never);
    expect(guard.canActivate(context())).toBe('delegated');
    spy.mockRestore();
  });
});
