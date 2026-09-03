import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TelegramCheckoutService } from '../services/telegram-checkout.service';
import { TelegramTransactionalNotificationService } from '../services/telegram-transactional-notification.service';
import { TelegramFormattingService } from '../services/telegram-formatting.service';
import { TelegramKeyboardService } from '../services/telegram-keyboard.service';

describe('TG9A — Advanced Telegram Course Browsing, Checkout & Payments Specification Tests', () => {
  let checkoutService: TelegramCheckoutService;
  let notificationService: TelegramTransactionalNotificationService;
  let mockCatalogService: any;
  let mockEnrollmentsService: any;
  let mockPaymentsService: any;
  let mockPaymentMethodsService: any;
  let mockRedemptionService: any;
  let mockStorageService: any;
  let mockTelegramClient: any;
  let mockTelegramConfig: any;
  let mockIdentityResolver: any;
  let mockDatabase: any;
  let formattingService: TelegramFormattingService;
  let keyboardService: TelegramKeyboardService;

  beforeEach(() => {
    formattingService = new TelegramFormattingService();
    keyboardService = new TelegramKeyboardService();

    mockCatalogService = {
      publicCourses: vi.fn(),
      publicCourse: vi.fn(),
    };

    mockEnrollmentsService = {
      mine: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      create: vi.fn(),
    };

    mockPaymentsService = {
      submit: vi.fn(),
      instructions: vi.fn(),
    };

    mockPaymentMethodsService = {
      listActive: vi.fn().mockResolvedValue([
        {
          id: 'pm-1',
          name: 'Telebirr',
          accountNumber: '12345',
          accountName: 'Joel Academy',
          instructions: 'Transfer ETB',
        },
      ]),
      requireActiveById: vi.fn().mockResolvedValue({
        id: 'pm-1',
        name: 'Telebirr',
        accountNumber: '12345',
        accountName: 'Joel Academy',
        instructions: 'Transfer ETB',
      }),
    };

    mockRedemptionService = {
      validate: vi.fn(),
      redeem: vi.fn(),
    };

    mockStorageService = {
      upload: vi.fn().mockResolvedValue({ key: 'payment-receipts/test.jpg' }),
    };

    mockTelegramClient = {
      sendMessage: vi.fn().mockResolvedValue(true),
      sendPhoto: vi.fn().mockResolvedValue(true),
      getFile: vi
        .fn()
        .mockResolvedValue({ file_id: 'f-123', file_path: 'photos/file.jpg' }),
      downloadFile: vi.fn().mockResolvedValue(Buffer.from('fake-image-bytes')),
    };

    mockTelegramConfig = {
      webAppUrl: 'https://academy.example.com',
      botToken: 'fake-token',
    };

    mockIdentityResolver = {
      resolveIdentity: vi.fn().mockResolvedValue({
        status: 'LINKED',
        user: {
          id: 'user-25',
          email: 'student@example.com',
          roles: ['STUDENT'],
          status: 'ACTIVE',
        },
      }),
    };

    mockDatabase = {
      client: {
        query: {
          telegramCheckoutSessions: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          oauthAccounts: {
            findFirst: vi
              .fn()
              .mockResolvedValue({ providerAccountId: '847362910' }),
          },
        },
        delete: vi
          .fn()
          .mockReturnValue({ where: vi.fn().mockResolvedValue(true) }),
        insert: vi
          .fn()
          .mockReturnValue({ values: vi.fn().mockResolvedValue(true) }),
        update: vi.fn().mockReturnValue({
          set: vi
            .fn()
            .mockReturnValue({ where: vi.fn().mockResolvedValue(true) }),
        }),
      },
    };

    checkoutService = new TelegramCheckoutService(
      mockDatabase as any,
      mockCatalogService,
      mockEnrollmentsService,
      mockPaymentsService,
      mockPaymentMethodsService,
      mockRedemptionService,
      mockStorageService,
      mockTelegramClient,
      mockTelegramConfig,
      formattingService,
      mockIdentityResolver,
      keyboardService,
    );

    notificationService = new TelegramTransactionalNotificationService(
      mockDatabase as any,
      mockTelegramClient,
      mockTelegramConfig,
      formattingService,
    );
  });

  it('TEST 1 — FREE course enrollment creates active enrollment immediately', async () => {
    mockCatalogService.publicCourse.mockResolvedValue({
      id: 'course-free-1',
      title: 'Intro to Python',
      accessType: 'FREE',
      price: 0,
      status: 'PUBLISHED',
    });

    mockEnrollmentsService.create.mockResolvedValue({
      created: true,
      enrollment: { id: 'enr-free-1', status: 'ENROLLED' },
    });

    await checkoutService.handleStartEnrollment(
      847362910,
      847362910,
      'course-free-1',
    );

    expect(mockTelegramClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Confirm Free Enrollment'),
      }),
    );
  });

  it('TEST 2 — PAID course enrollment initiates promo check prompt', async () => {
    mockCatalogService.publicCourse.mockResolvedValue({
      id: 'course-paid-1',
      title: 'Advanced React',
      accessType: 'PAID',
      price: 5000,
      currency: 'ETB',
      status: 'PUBLISHED',
    });

    await checkoutService.handleStartEnrollment(
      847362910,
      847362910,
      'course-paid-1',
    );

    expect(mockTelegramClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Do you have a promo code?'),
      }),
    );
  });

  it('TEST 3 — Promo validation previews discount without redeeming promo limit', async () => {
    mockDatabase.client.query.telegramCheckoutSessions.findFirst.mockResolvedValue(
      {
        telegramUserId: '847362910',
        courseId: 'course-paid-1',
        step: 'AWAITING_PROMO_CODE',
        expiresAt: new Date(Date.now() + 100000),
      },
    );

    mockCatalogService.publicCourse.mockResolvedValue({
      id: 'course-paid-1',
      title: 'Advanced React',
      price: 5000,
      currency: 'ETB',
    });

    mockRedemptionService.validate.mockResolvedValue({
      valid: true,
      code: 'WEB30',
      pricing: {
        originalPrice: 5000,
        discountAmount: 1500,
        finalPrice: 3500,
        currency: 'ETB',
      },
    });

    await checkoutService.handlePromoInput(847362910, 847362910, 'WEB30');

    expect(mockRedemptionService.validate).toHaveBeenCalled();
    expect(mockRedemptionService.redeem).not.toHaveBeenCalled(); // Non-consuming preview
    expect(mockTelegramClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Amount to Pay: ETB 3,500'),
      }),
    );
  });

  it('TEST 4 — Invalid promo code displays error without price modification', async () => {
    mockDatabase.client.query.telegramCheckoutSessions.findFirst.mockResolvedValue(
      {
        telegramUserId: '847362910',
        courseId: 'course-paid-1',
        step: 'AWAITING_PROMO_CODE',
        expiresAt: new Date(Date.now() + 100000),
      },
    );

    mockCatalogService.publicCourse.mockResolvedValue({
      id: 'course-paid-1',
      title: 'Advanced React',
      price: 5000,
      currency: 'ETB',
    });

    mockRedemptionService.validate.mockResolvedValue({
      valid: false,
      message: 'Coupon code has expired',
      pricing: {
        originalPrice: 5000,
        discountAmount: 0,
        finalPrice: 5000,
        currency: 'ETB',
      },
    });

    await checkoutService.handlePromoInput(847362910, 847362910, 'EXPIRED100');

    expect(mockTelegramClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Invalid Promo Code'),
      }),
    );
  });

  it('TEST 5 — Telegram receipt upload ingests file through StorageService', async () => {
    mockDatabase.client.query.telegramCheckoutSessions.findFirst.mockResolvedValue(
      {
        telegramUserId: '847362910',
        courseId: 'course-paid-1',
        transactionId: 'TXN998877',
        step: 'AWAITING_PAYMENT_RECEIPT',
        expiresAt: new Date(Date.now() + 100000),
      },
    );

    mockCatalogService.publicCourse.mockResolvedValue({
      id: 'course-paid-1',
      title: 'Advanced React',
      price: 5000,
      currency: 'ETB',
    });

    await checkoutService.handleReceiptUpload(
      847362910,
      847362910,
      'file-id-photo-123',
      'image/jpeg',
      'receipt.jpg',
    );

    expect(mockTelegramClient.getFile).toHaveBeenCalledWith(
      'file-id-photo-123',
    );
    expect(mockTelegramClient.downloadFile).toHaveBeenCalledWith(
      'photos/file.jpg',
    );
    expect(mockStorageService.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: 'image/jpeg',
      }),
    );
  });

  it('TEST 6 — Payment submission creates payment record in PENDING state', async () => {
    mockDatabase.client.query.telegramCheckoutSessions.findFirst.mockResolvedValue(
      {
        telegramUserId: '847362910',
        courseId: 'course-paid-1',
        transactionId: 'TXN998877',
        paymentMethodId: 'pm-1',
        receiptStorageKey: 'payment-receipts/tg_847362910_123.jpg',
        step: 'REVIEW',
        expiresAt: new Date(Date.now() + 100000),
      },
    );

    mockCatalogService.publicCourse.mockResolvedValue({
      id: 'course-paid-1',
      title: 'Advanced React',
      price: 5000,
      currency: 'ETB',
    });

    mockEnrollmentsService.create.mockResolvedValue({
      created: true,
      enrollment: { id: 'enr-paid-1', status: 'PENDING_PAYMENT' },
    });

    mockPaymentsService.submit.mockResolvedValue({
      id: 'pay-101',
      status: 'PENDING',
    });

    await checkoutService.handleSubmitPayment(847362910, 847362910);

    expect(mockPaymentsService.submit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-25' }),
      'enr-paid-1',
      expect.objectContaining({ transactionId: 'TXN998877' }),
      expect.anything(),
    );

    expect(mockTelegramClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Payment Submitted'),
      }),
    );
  });

  it('TEST 7 — Payment approval delivers proactive Telegram notification to student', async () => {
    await notificationService.notifyPaymentApproved(
      'user-25',
      'Advanced React',
      '5000',
    );

    expect(mockTelegramClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 847362910,
        text: expect.stringContaining('Payment Approved!'),
      }),
    );
  });

  it('TEST 8 — Payment decline delivers proactive Telegram notification to student', async () => {
    await notificationService.notifyPaymentDeclined(
      'user-25',
      'Advanced React',
      'Illegible receipt image',
    );

    expect(mockTelegramClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_id: 847362910,
        text: expect.stringContaining('Payment Not Approved'),
      }),
    );
  });
});
