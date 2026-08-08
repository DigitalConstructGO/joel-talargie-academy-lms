import {
  ForbiddenException,
  UnsupportedMediaTypeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';

describe('PaymentsService', () => {
  const repository = {
    enrollment: jest.fn(),
    settings: jest.fn(),
    submit: jest.fn(),
    listMine: jest.fn(),
    mine: jest.fn(),
    listAdmin: jest.fn(),
    admin: jest.fn(),
    receipt: jest.fn(),
    duplicates: jest.fn(),
    actorHasPermission: jest.fn(),
    review: jest.fn(),
    activity: jest.fn(),
  };
  const storage = {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedUrl: jest.fn(),
  };
  const notifications = { notify: jest.fn().mockResolvedValue(null) };
  const service = new PaymentsService(
    repository as never,
    storage,
    notifications as never,
  );
  const user = {
    id: 'student',
    roles: ['STUDENT'],
    emailVerified: true,
  } as never;
  const enrollment = {
    id: 'enrollment',
    studentId: 'student',
    courseId: 'course',
    status: 'PENDING_PAYMENT',
    priceSnapshot: '3000.00',
    discountSnapshot: '2500.00',
    currencySnapshot: 'ETB',
    userStatus: 'ACTIVE',
    emailVerified: true,
    courseTitle: 'AI Fundamentals',
    accessType: 'PAID',
    hasStudentRole: true,
    latestPayment: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.enrollment.mockResolvedValue(enrollment);
    repository.settings.mockResolvedValue([]);
    repository.submit.mockResolvedValue({
      id: 'payment',
      attemptNumber: 1,
      status: 'PENDING',
      amountMismatch: false,
    });
    storage.upload.mockResolvedValue({ key: 'private/key' });
    storage.delete.mockResolvedValue(undefined);
  });

  it('returns the immutable discounted enrollment amount in instructions', async () => {
    await expect(
      service.instructions(user, 'enrollment'),
    ).resolves.toMatchObject({
      expectedAmount: '2500.00',
      currency: 'ETB',
    });
  });

  it('uses the original snapshot when the existing zero convention means no discount', async () => {
    repository.enrollment.mockResolvedValueOnce({
      ...enrollment,
      discountSnapshot: '0.00',
    });
    await expect(
      service.instructions(user, 'enrollment'),
    ).resolves.toMatchObject({
      expectedAmount: '3000.00',
    });
  });

  it('uploads a valid PNG privately and never grants access during submission', async () => {
    const file = receipt(
      'receipt.png',
      'image/png',
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]),
    );
    await expect(
      service.submit(
        user,
        'enrollment',
        { transactionId: 'BANK-123', submittedAmount: '2500', currency: 'ETB' },
        file,
      ),
    ).resolves.toMatchObject({
      status: 'PENDING',
      enrollmentStatus: 'WAITING_APPROVAL',
    });
    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        key: expect.stringContaining('payment-receipts/'),
      }),
    );
    expect(repository.submit).toHaveBeenCalledWith(
      'student',
      'enrollment',
      expect.objectContaining({ amount: '2500.00' }),
      expect.objectContaining({
        checksum: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
      '2500.00',
    );
  });

  it('rejects executable signatures and double extensions', async () => {
    await expect(
      service.submit(
        user,
        'enrollment',
        { transactionId: 'BANK-123', submittedAmount: '2500', currency: 'ETB' },
        receipt('receipt.jpg', 'image/jpeg', Buffer.from('MZ executable')),
      ),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    await expect(
      service.submit(
        user,
        'enrollment',
        { transactionId: 'BANK-123', submittedAmount: '2500', currency: 'ETB' },
        receipt(
          'receipt.pdf.exe.pdf',
          'application/pdf',
          Buffer.from('%PDF-1.7'),
        ),
      ),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('rejects currency mismatch and invalid exact decimal amounts', async () => {
    const file = receipt(
      'receipt.pdf',
      'application/pdf',
      Buffer.from('%PDF-1.7'),
    );
    await expect(
      service.submit(
        user,
        'enrollment',
        { transactionId: 'BANK-123', submittedAmount: '2500', currency: 'USD' },
        file,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(
      service.submit(
        user,
        'enrollment',
        { transactionId: 'BANK-123', submittedAmount: '0', currency: 'ETB' },
        file,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('cleans up the uploaded object when the database transaction fails', async () => {
    repository.submit.mockRejectedValueOnce(
      new Error('PAYMENT_ATTEMPT_CONFLICT'),
    );
    await expect(
      service.submit(
        user,
        'enrollment',
        { transactionId: 'BANK-123', submittedAmount: '2500', currency: 'ETB' },
        receipt('receipt.pdf', 'application/pdf', Buffer.from('%PDF-1.7')),
      ),
    ).rejects.toBeDefined();
    expect(storage.delete).toHaveBeenCalledTimes(1);
  });

  it('requires enhanced permission and a reason for mismatch approval', async () => {
    repository.admin.mockResolvedValue({
      id: 'payment',
      status: 'PENDING',
      amountMismatch: true,
      duplicateTransactionCount: 0,
    });
    repository.actorHasPermission.mockResolvedValueOnce(false);
    await expect(
      service.approve('reviewer', 'payment', {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    repository.actorHasPermission.mockResolvedValueOnce(true);
    await expect(
      service.approve('reviewer', 'payment', {}),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

function receipt(
  name: string,
  type: string,
  buffer: Buffer,
): Express.Multer.File {
  return {
    fieldname: 'receipt',
    originalname: name,
    encoding: '7bit',
    mimetype: type,
    size: buffer.length,
    buffer,
    destination: '',
    filename: '',
    path: '',
    stream: undefined as never,
  };
}
