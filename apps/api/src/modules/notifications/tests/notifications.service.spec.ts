import { NotificationsService } from '../services/notifications.service';

describe('NotificationsService security', () => {
  const repository = {
    listMine: jest.fn(),
    mine: jest.fn(),
    unread: jest.fn(),
    mark: jest.fn(),
    archive: jest.fn(),
    listDeliveries: jest.fn(),
    delivery: jest.fn(),
    attempts: jest.fn(),
    templates: jest.fn(),
    template: jest.fn(),
    retry: jest.fn(),
    cancel: jest.fn(),
    health: jest.fn(),
  };
  const renderer = { render: jest.fn() };
  const config = { get: jest.fn() };
  const service = new NotificationsService(
    repository as never,
    renderer as never,
    config as never,
  );
  it('always scopes notification reads to the authenticated user', async () => {
    repository.mine.mockResolvedValueOnce(null);
    await expect(service.mine('owner', 'foreign-id')).rejects.toBeDefined();
    expect(repository.mine).toHaveBeenCalledWith('owner', 'foreign-id');
  });
  it('redacts security URLs from sensitive previews', async () => {
    repository.delivery.mockResolvedValueOnce({
      recipientEmail: 'student@example.com',
      htmlBodySnapshot: 'reset https://example.com/reset?token=secret',
      textBodySnapshot: 'verify https://example.com/verify/token',
      status: 'FAILED',
    });
    const result = await service.delivery('delivery', true);
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(result.recipientEmail).toBe('st***@example.com');
  });
});
