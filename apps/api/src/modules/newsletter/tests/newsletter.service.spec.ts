import { NotFoundException } from '@nestjs/common';
import { NewsletterService } from '../services/newsletter.service';

describe('NewsletterService', () => {
  let service: NewsletterService;
  let mockDb: {
    query: {
      newsletterSubscribers: {
        findFirst: jest.Mock;
      };
    };
    insert: jest.Mock;
    update: jest.Mock;
    select: jest.Mock;
  };

  beforeEach(() => {
    mockDb = {
      query: {
        newsletterSubscribers: {
          findFirst: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue([{ id: 'sub-1', email: 'test@example.com' }]),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              { id: 'sub-1', email: 'test@example.com', status: 'ACTIVE' },
            ]),
          }),
        }),
      }),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([
                  { id: 'sub-1', email: 'test@example.com', status: 'ACTIVE' },
                ]),
              }),
            }),
          }),
        }),
      }),
    };

    const mockDatabaseService = {
      client: mockDb,
    };

    service = new NewsletterService(mockDatabaseService as never);
  });

  describe('subscribe', () => {
    it('creates a new subscriber if email is not found', () => {
      mockDb.query.newsletterSubscribers.findFirst.mockResolvedValue(null);

      return service.subscribe({ email: ' NewUser@example.com ' }).then((result) => {
        expect(result).toEqual({
          success: true,
          message: "You're subscribed successfully!",
          status: 'subscribed',
        });
        expect(mockDb.insert).toHaveBeenCalled();
      });
    });

    it('returns already_subscribed status if active subscriber exists', () => {
      mockDb.query.newsletterSubscribers.findFirst.mockResolvedValue({
        id: 'sub-1',
        email: 'user@example.com',
        status: 'ACTIVE',
      });

      return service.subscribe({ email: 'user@example.com' }).then((result) => {
        expect(result).toEqual({
          success: true,
          message: "You're already subscribed to our newsletter.",
          status: 'already_subscribed',
        });
        expect(mockDb.insert).not.toHaveBeenCalled();
      });
    });

    it('reactivates subscriber if previously unsubscribed', () => {
      mockDb.query.newsletterSubscribers.findFirst.mockResolvedValue({
        id: 'sub-1',
        email: 'user@example.com',
        status: 'UNSUBSCRIBED',
      });

      return service.subscribe({ email: 'user@example.com' }).then((result) => {
        expect(result).toEqual({
          success: true,
          message: "You're subscribed successfully!",
          status: 'subscribed',
        });
        expect(mockDb.update).toHaveBeenCalled();
      });
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException if subscriber not found', async () => {
      mockDb.query.newsletterSubscribers.findFirst.mockResolvedValue(null);

      await expect(service.updateStatus('invalid-id', 'UNSUBSCRIBED')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates status of an existing subscriber', async () => {
      mockDb.query.newsletterSubscribers.findFirst.mockResolvedValue({
        id: 'sub-1',
        email: 'test@example.com',
        status: 'ACTIVE',
      });

      const updated = await service.updateStatus('sub-1', 'UNSUBSCRIBED');
      expect(updated).toEqual({
        id: 'sub-1',
        email: 'test@example.com',
        status: 'ACTIVE',
      });
    });
  });
});
