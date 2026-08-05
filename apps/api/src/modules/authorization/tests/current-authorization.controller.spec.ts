import { CurrentAuthorizationController } from '../controllers/current-authorization.controller';

describe('CurrentAuthorizationController', () => {
  const contexts = { resolve: jest.fn() };
  const controller = new CurrentAuthorizationController(contexts as never);
  const user = { id: 'user-1', roles: ['STUDENT'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('returns the caller’s own roles and permissions', async () => {
    contexts.resolve.mockResolvedValue({
      roles: ['STUDENT'],
      permissions: ['learning.read'],
    });
    const result = await controller.current(user);
    expect(contexts.resolve).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      roles: ['STUDENT'],
      permissions: ['learning.read'],
    });
  });

  it('returns empty arrays when the context cannot be resolved', async () => {
    contexts.resolve.mockResolvedValue(undefined);
    const result = await controller.current(user);
    expect(result).toEqual({ roles: [], permissions: [] });
  });
});
