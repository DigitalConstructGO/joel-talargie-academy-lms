import { findAuthUserById } from '@joel-academy/database';
import { NotificationsGateway } from '../gateways/notifications.gateway';

describe('NotificationsGateway', () => {
  const jwt = { verifyAsync: jest.fn() };
  const config = { getOrThrow: jest.fn() };
  const database = { client: {} };
  const gateway = new NotificationsGateway(
    jwt as never,
    config as never,
    database as never,
  );
  const server = { to: jest.fn() };
  (gateway as unknown as { server: unknown }).server = server;

  const makeClient = () => ({
    handshake: { auth: {}, query: {}, headers: {} },
    data: {} as Record<string, unknown>,
    join: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
  });
  const activeUser = {
    id: 'user-1',
    email: 'student@example.com',
    passwordHash: 'hash',
    status: 'ACTIVE' as const,
    firstName: 'Test',
    lastName: 'Student',
    roles: ['STUDENT'],
    avatarUrl: null,
    provider: 'LOCAL' as const,
    emailVerified: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    config.getOrThrow.mockReturnValue('access-secret');
    server.to.mockReturnValue({ emit: jest.fn() });
  });

  describe('handleConnection', () => {
    it('authenticates a valid access token and joins only the owner room', async () => {
      jwt.verifyAsync.mockResolvedValueOnce({
        type: 'access',
        sub: 'user-1',
      });
      jest.mocked(findAuthUserById).mockResolvedValueOnce({ ...activeUser, id: 'user-1' });
      const client = makeClient();
      client.handshake.auth = { token: 'valid-token' };

      await gateway.handleConnection(client as never);

      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.data.userId).toBe('user-1');
      expect(client.join).toHaveBeenCalledWith('user:user-1');
    });

    it('accepts the token from a query parameter', async () => {
      jwt.verifyAsync.mockResolvedValueOnce({
        type: 'access',
        sub: 'user-2',
      });
      jest.mocked(findAuthUserById).mockResolvedValueOnce({ ...activeUser, id: 'user-2' });
      const client = makeClient();
      client.handshake.query = { token: 'query-token' };

      await gateway.handleConnection(client as never);

      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.join).toHaveBeenCalledWith('user:user-2');
    });

    it('accepts the token from an Authorization bearer header', async () => {
      jwt.verifyAsync.mockResolvedValueOnce({
        type: 'access',
        sub: 'user-3',
      });
      jest.mocked(findAuthUserById).mockResolvedValueOnce({ ...activeUser, id: 'user-3' });
      const client = makeClient();
      client.handshake.headers = { authorization: 'Bearer header-token' };

      await gateway.handleConnection(client as never);

      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.join).toHaveBeenCalledWith('user:user-3');
    });

    it('drops connections without a token', async () => {
      const client = makeClient();
      await gateway.handleConnection(client as never);
      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(jwt.verifyAsync).not.toHaveBeenCalled();
    });

    it('drops connections whose token is invalid or expired', async () => {
      jwt.verifyAsync.mockRejectedValueOnce(new Error('jwt expired'));
      const client = makeClient();
      client.handshake.auth = { token: 'expired-token' };
      await gateway.handleConnection(client as never);
      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });

    it('drops connections carrying a refresh token', async () => {
      jwt.verifyAsync.mockResolvedValueOnce({ type: 'refresh', sub: 'user-1' });
      const client = makeClient();
      client.handshake.auth = { token: 'refresh-token' };
      await gateway.handleConnection(client as never);
      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });

    it('drops connections for a user that no longer exists or is inactive', async () => {
      jwt.verifyAsync.mockResolvedValueOnce({
        type: 'access',
        sub: 'user-1',
      });
      jest
        .mocked(findAuthUserById)
        .mockResolvedValueOnce({ ...activeUser, id: 'user-1', status: 'SUSPENDED' });
      const client = makeClient();
      client.handshake.auth = { token: 'valid-token' };
      await gateway.handleConnection(client as never);
      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });
  });

  describe('notifyUser', () => {
    it('emits only to the owning user room', () => {
      const emit = jest.fn();
      server.to.mockReturnValueOnce({ emit });
      gateway.notifyUser('user-1', { id: 'n1' } as never);
      expect(server.to).toHaveBeenCalledWith('user:user-1');
      expect(emit).toHaveBeenCalledWith('notification:new', { id: 'n1' });
    });

    it('does nothing when the socket server is not initialized', () => {
      (gateway as unknown as { server: unknown }).server = undefined;
      expect(() =>
        gateway.notifyUser('user-1', { id: 'n1' } as never),
      ).not.toThrow();
      (gateway as unknown as { server: unknown }).server = server;
    });
  });
});
