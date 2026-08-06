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
      isAdministrator: false,
    });
    const result = await controller.current(user);
    expect(contexts.resolve).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      roles: ['STUDENT'],
      permissions: ['learning.read'],
      isAdministrator: false,
    });
  });

  it('returns the administrator bypass flag for an administrator', async () => {
    contexts.resolve.mockResolvedValue({
      roles: ['ADMINISTRATOR'],
      permissions: [],
      isAdministrator: true,
    });
    const result = await controller.current(user);
    expect(result).toEqual({
      roles: ['ADMINISTRATOR'],
      permissions: [],
      isAdministrator: true,
    });
  });

  it('returns empty arrays and isAdministrator false when the context cannot be resolved', async () => {
    contexts.resolve.mockResolvedValue(undefined);
    const result = await controller.current(user);
    expect(result).toEqual({
      roles: [],
      permissions: [],
      isAdministrator: false,
    });
  });
});
