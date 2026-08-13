import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EMAIL_TEMPLATE_CONTENT } from '@joel-academy/database';
import { NotificationsService } from '../notifications.service';

describe('NotificationsService', () => {
  const repository = {
    listMine: jest.fn(),
    mine: jest.fn(),
    unread: jest.fn(),
    mark: jest.fn(),
    archive: jest.fn(),
    db: { query: { userNotificationPreferences: { findFirst: jest.fn() } } },
    createInApp: jest.fn(),
    activeTemplate: jest.fn(),
    createDelivery: jest.fn(),
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
  const mail = { verifyConnection: jest.fn() };
  const configValues: Record<string, unknown> = {
    EMAIL_DEFAULT_LOCALE: 'en',
    EMAIL_MAX_RETRY_ATTEMPTS: 5,
    EMAIL_WORKER_LOCK_TIMEOUT_MS: 60000,
    EMAIL_WORKER_ENABLED: true,
    MAIL_ENABLED: true,
  };
  const config = { get: jest.fn((key: string) => configValues[key]) };
  const service = new NotificationsService(
    repository as never,
    renderer as never,
    config as never,
    mail as never,
  );

  const baseInput = {
    userId: 'user-1',
    recipientEmail: 'A@Example.com',
    recipientName: 'Ada',
    templateCode: 'WELCOME',
    variables: {},
    deduplicationKey: 'dedup-1',
    category: 'learning' as const,
    title: 'Title',
    message: 'Message',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.db.query.userNotificationPreferences.findFirst.mockResolvedValue(
      undefined,
    );
    renderer.render.mockReturnValue({
      subject: 'Subject',
      text: 'Text',
      html: '<p>Html</p>',
    });
    mail.verifyConnection.mockResolvedValue({ status: 'available' });
  });

  describe('listMine / mine / unread / mark / archive', () => {
    it('delegates listMine to the repository', () => {
      service.listMine('user-1', {} as never);
      expect(repository.listMine).toHaveBeenCalledWith('user-1', {});
    });

    it('mine() throws NotFoundException when not found', async () => {
      repository.mine.mockResolvedValueOnce(undefined);
      await expect(service.mine('user-1', 'n1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('mine() returns the row when found', async () => {
      repository.mine.mockResolvedValueOnce({ id: 'n1' });
      await expect(service.mine('user-1', 'n1')).resolves.toEqual({
        id: 'n1',
      });
    });

    it('unread() wraps the repository count', async () => {
      repository.unread.mockResolvedValueOnce(3);
      await expect(service.unread('user-1')).resolves.toEqual({
        unreadCount: 3,
      });
    });

    it('mark() reports the number of updated rows', async () => {
      repository.mark.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);
      await expect(service.mark('user-1', ['a', 'b'])).resolves.toEqual({
        updated: 2,
      });
    });

    it('archive() throws NotFoundException when the repository reports no match', async () => {
      repository.archive.mockResolvedValueOnce(false);
      await expect(service.archive('user-1', 'n1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('archive() succeeds when the repository confirms the update', async () => {
      repository.archive.mockResolvedValueOnce(true);
      await expect(service.archive('user-1', 'n1')).resolves.toEqual({
        archived: true,
      });
    });
  });

  describe('notify', () => {
    it('rejects an actionUrl outside the approved internal path pattern', async () => {
      await expect(
        service.notify({ ...baseInput, actionUrl: 'https://evil.example.com' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('accepts an approved internal actionUrl', async () => {
      repository.activeTemplate.mockResolvedValueOnce({
        code: 'WELCOME',
        version: 1,
        locale: 'en',
      });
      await service.notify({ ...baseInput, actionUrl: '/dashboard/courses' });
      expect(repository.createInApp).toHaveBeenCalled();
    });

    it('creates an in-app notification when the category is security, regardless of preferences', async () => {
      repository.db.query.userNotificationPreferences.findFirst.mockResolvedValueOnce(
        { inAppSecurity: false },
      );
      repository.activeTemplate.mockResolvedValueOnce({
        code: 'WELCOME',
        version: 1,
        locale: 'en',
      });
      await service.notify({ ...baseInput, category: 'security' });
      expect(repository.createInApp).toHaveBeenCalled();
    });

    it('skips the in-app notification when the user opted out for a non-essential, non-security category', async () => {
      repository.db.query.userNotificationPreferences.findFirst.mockResolvedValueOnce(
        { inAppLearning: false },
      );
      repository.activeTemplate.mockResolvedValueOnce({
        code: 'WELCOME',
        version: 1,
        locale: 'en',
      });
      await service.notify(baseInput);
      expect(repository.createInApp).not.toHaveBeenCalled();
    });

    it('always creates the in-app notification for essential template codes, even when opted out', async () => {
      repository.db.query.userNotificationPreferences.findFirst.mockResolvedValueOnce(
        { inAppSecurity: false, emailSecurity: false },
      );
      repository.activeTemplate.mockResolvedValueOnce({
        code: 'PASSWORD_CHANGED',
        version: 1,
        locale: 'en',
      });
      await service.notify({
        ...baseInput,
        templateCode: 'PASSWORD_CHANGED',
        category: 'security',
      });
      expect(repository.createInApp).toHaveBeenCalled();
      expect(repository.createDelivery).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'QUEUED' }),
      );
    });

    it('throws UnprocessableEntityException when no active email template exists', async () => {
      repository.activeTemplate.mockResolvedValueOnce(undefined);
      await expect(service.notify(baseInput)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('falls back to the built-in catalog template when no active DB template exists', async () => {
      repository.activeTemplate.mockResolvedValueOnce(undefined);
      await service.notify({
        ...baseInput,
        templateCode: 'EMAIL_VERIFICATION',
        category: 'security',
        variables: {
          recipientName: 'Ada',
          verificationUrl: 'https://academy.example.com/auth/verify-email?token=abc',
          expiresInMinutes: '1440',
          academyName: 'Academy',
          supportEmail: 'support@example.com',
        },
      });
      expect(repository.createDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          templateCode: 'EMAIL_VERIFICATION',
          templateVersion: 1,
          locale: 'en',
          status: 'QUEUED',
        }),
      );
    });

    it('rejects an invalid recipient email', async () => {
      repository.activeTemplate.mockResolvedValueOnce({
        code: 'WELCOME',
        version: 1,
        locale: 'en',
      });
      await expect(
        service.notify({ ...baseInput, recipientEmail: 'not-an-email' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('normalizes the recipient email and queues the delivery when email is enabled', async () => {
      repository.activeTemplate.mockResolvedValueOnce({
        code: 'WELCOME',
        version: 1,
        locale: 'en',
      });
      await service.notify(baseInput);
      expect(repository.createDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'a@example.com',
          status: 'QUEUED',
        }),
      );
    });

    it('suppresses the delivery when the user opted out of email for the category', async () => {
      repository.db.query.userNotificationPreferences.findFirst.mockResolvedValueOnce(
        { emailLearning: false },
      );
      repository.activeTemplate.mockResolvedValueOnce({
        code: 'WELCOME',
        version: 1,
        locale: 'en',
      });
      await service.notify(baseInput);
      expect(repository.createDelivery).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'SUPPRESSED' }),
      );
    });
  });

  describe('listDeliveries', () => {
    it('masks the recipient email on every row', async () => {
      repository.listDeliveries.mockResolvedValueOnce([
        { id: 'd1', recipientEmail: 'ada@example.com' },
      ]);
      const result = await service.listDeliveries({} as never);
      expect(result[0].recipientEmail).toBe('ad***@example.com');
    });
  });

  describe('delivery', () => {
    it('throws NotFoundException when the delivery does not exist', async () => {
      repository.delivery.mockResolvedValueOnce(undefined);
      await expect(service.delivery('d1')).rejects.toThrow(NotFoundException);
    });

    it('hides body previews without the sensitive flag', async () => {
      repository.delivery.mockResolvedValueOnce({
        id: 'd1',
        recipientEmail: 'ada@example.com',
        htmlBodySnapshot: '<p>hi</p>',
        textBodySnapshot: 'hi',
      });
      const result = await service.delivery('d1', false);
      expect(result).not.toHaveProperty('htmlBodyPreview');
      expect(result).not.toHaveProperty('htmlBodySnapshot');
    });

    it('redacts security URLs in body previews with the sensitive flag', async () => {
      repository.delivery.mockResolvedValueOnce({
        id: 'd1',
        recipientEmail: 'ada@example.com',
        htmlBodySnapshot: 'Click https://x.example.com/reset?token=abc now',
        textBodySnapshot: 'Visit https://x.example.com/verify?token=abc',
      });
      const result = await service.delivery('d1', true);
      expect(result.htmlBodyPreview).toContain('[REDACTED_SECURITY_URL]');
      expect(result.textBodyPreview).toContain('[REDACTED_SECURITY_URL]');
    });
  });

  it('attempts() replaces workerId with an assigned/null flag', async () => {
    repository.attempts.mockResolvedValueOnce([
      { id: 'a1', workerId: 'worker-1', status: 'SUCCEEDED' },
      { id: 'a2', workerId: null, status: 'PENDING' },
    ]);
    const result = await service.attempts('d1');
    expect(result).toEqual([
      { id: 'a1', status: 'SUCCEEDED', worker: 'assigned' },
      { id: 'a2', status: 'PENDING', worker: null },
    ]);
  });

  it('templates() delegates to the repository', () => {
    service.templates();
    expect(repository.templates).toHaveBeenCalled();
  });

  describe('template', () => {
    it('throws NotFoundException for a missing template', async () => {
      repository.template.mockResolvedValueOnce(undefined);
      await expect(service.template('t1')).rejects.toThrow(NotFoundException);
    });

    it('strips raw template bodies and adds derived flags', async () => {
      repository.template.mockResolvedValueOnce({
        id: 't1',
        code: 'WELCOME',
        htmlTemplate: '<p>hi</p>',
        textTemplate: '',
      });
      const result = await service.template('t1');
      expect(result).not.toHaveProperty('htmlTemplate');
      expect(result.hasHtml).toBe(true);
      expect(result.hasText).toBe(false);
    });
  });

  describe('preview', () => {
    it('throws NotFoundException for a missing template', async () => {
      repository.template.mockResolvedValueOnce(undefined);
      await expect(service.preview('t1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('renders the template with the given variables', async () => {
      repository.template.mockResolvedValueOnce({ code: 'WELCOME' });
      const result = await service.preview('t1', { name: 'Ada' });
      expect(renderer.render).toHaveBeenCalledWith(
        { code: 'WELCOME' },
        { name: 'Ada' },
      );
      expect(result.subject).toBe('Subject');
    });
  });

  describe('retry / cancel error mapping', () => {
    it('retry() maps a NOT_FOUND repository error to NotFoundException', async () => {
      repository.retry.mockRejectedValueOnce(new Error('DELIVERY_NOT_FOUND'));
      await expect(service.retry('admin-1', 'd1', ' reason ')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.retry).toHaveBeenCalledWith('admin-1', 'd1', 'reason');
    });

    it('retry() maps a NOT_ALLOWED repository error to ConflictException', async () => {
      repository.retry.mockRejectedValueOnce(new Error('STATUS_NOT_ALLOWED'));
      await expect(service.retry('admin-1', 'd1', 'reason')).rejects.toThrow(
        ConflictException,
      );
    });

    it('retry() rethrows an unrecognized error', async () => {
      repository.retry.mockRejectedValueOnce(new Error('unexpected'));
      await expect(service.retry('admin-1', 'd1', 'reason')).rejects.toThrow(
        'unexpected',
      );
    });

    it('retry() returns the repository result on success', async () => {
      repository.retry.mockResolvedValueOnce({ id: 'd1', status: 'QUEUED' });
      await expect(service.retry('admin-1', 'd1', 'reason')).resolves.toEqual({
        id: 'd1',
        status: 'QUEUED',
      });
    });

    it('cancel() maps a NOT_FOUND repository error to NotFoundException', async () => {
      repository.cancel.mockRejectedValueOnce(new Error('DELIVERY_NOT_FOUND'));
      await expect(service.cancel('admin-1', 'd1', 'reason')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('cancel() returns the repository result on success', async () => {
      repository.cancel.mockResolvedValueOnce({
        id: 'd1',
        status: 'CANCELLED',
      });
      await expect(service.cancel('admin-1', 'd1', 'reason')).resolves.toEqual({
        id: 'd1',
        status: 'CANCELLED',
      });
    });
  });

  describe('health', () => {
    const builtinCount = Object.keys(EMAIL_TEMPLATE_CONTENT).length;

    it('aggregates queue health and available template count (DB + built-in)', async () => {
      repository.health.mockResolvedValueOnce({
        pending: 3,
        retrying: 1,
        processing: 2,
        failed: 0,
        stale: 0,
        oldest: '2026-08-01T00:00:00.000Z',
      });
      repository.templates.mockResolvedValueOnce([
        { id: 't1', isActive: true },
        { id: 't2', isActive: false },
      ]);
      const result = await service.health();
      expect(result).toEqual({
        workerEnabled: true,
        mailEnabled: true,
        smtp: { status: 'available' },
        pending: 3,
        retryScheduled: 1,
        processing: 2,
        failed: 0,
        staleLocks: 0,
        oldestQueuedAt: '2026-08-01T00:00:00.000Z',
        templates: 1 + builtinCount,
      });
    });

    it('defaults every counter to 0 and still counts built-in templates', async () => {
      repository.health.mockResolvedValueOnce(undefined);
      repository.templates.mockResolvedValueOnce([]);
      const result = await service.health();
      expect(result.pending).toBe(0);
      expect(result.oldestQueuedAt).toBeNull();
      expect(result.templates).toBe(builtinCount);
      expect(result.smtp).toEqual({ status: 'available' });
    });
  });
});
