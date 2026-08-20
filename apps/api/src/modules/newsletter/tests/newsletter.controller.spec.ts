import { NewsletterController } from '../controllers/newsletter.controller';

describe('NewsletterController', () => {
  let controller: NewsletterController;
  let service: {
    subscribe: jest.Mock;
    listSubscribers: jest.Mock;
    updateStatus: jest.Mock;
  };

  beforeEach(() => {
    service = {
      subscribe: jest.fn().mockResolvedValue({
        success: true,
        message: "You're subscribed successfully!",
        status: 'subscribed',
      }),
      listSubscribers: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      }),
      updateStatus: jest.fn().mockResolvedValue({
        id: 'sub-1',
        status: 'UNSUBSCRIBED',
      }),
    };

    controller = new NewsletterController(service as never);
  });

  it('subscribes an email to the newsletter', async () => {
    const result = await controller.subscribe({ email: 'user@example.com' });
    expect(service.subscribe).toHaveBeenCalledWith({
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('lists subscribers for admin', async () => {
    const result = await controller.listSubscribers({ page: 1, pageSize: 20 });
    expect(service.listSubscribers).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
    });
    expect(result.total).toBe(0);
  });

  it('updates subscriber status for admin', async () => {
    const result = await controller.updateStatus(
      '11111111-1111-1111-1111-111111111111',
      {
        status: 'UNSUBSCRIBED',
      },
    );
    expect(service.updateStatus).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      'UNSUBSCRIBED',
    );
    expect(result.status).toBe('UNSUBSCRIBED');
  });
});
