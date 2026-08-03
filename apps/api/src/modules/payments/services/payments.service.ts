import { createHash, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../../storage/storage.interface';
import type {
  ApprovePaymentDto,
  DeclinePaymentDto,
  PaymentActivityQueryDto,
  PaymentListQueryDto,
  SubmitPaymentDto,
} from '../dto/payments.dto';
import { PaymentsRepository } from '../repositories/payments.repository';

const RECEIPT_TYPES: Record<
  string,
  { extension: string; signature: (buffer: Buffer) => boolean }
> = {
  'image/jpeg': {
    extension: '.jpg',
    signature: (b) =>
      b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  'image/png': {
    extension: '.png',
    signature: (b) =>
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  'image/webp': {
    extension: '.webp',
    signature: (b) =>
      b.subarray(0, 4).toString() === 'RIFF' &&
      b.subarray(8, 12).toString() === 'WEBP',
  },
  'application/pdf': {
    extension: '.pdf',
    signature: (b) => b.subarray(0, 5).toString() === '%PDF-',
  },
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repository: PaymentsRepository,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async instructions(user: AuthUser, enrollmentId: string) {
    const enrollment = await this.requireEnrollment(user, enrollmentId, false);
    if (!['PENDING_PAYMENT', 'WAITING_APPROVAL'].includes(enrollment.status))
      throw new ConflictException({
        code: 'PAYMENT_NOT_REQUIRED',
        message: 'Payment is not required',
      });
    const settings = Object.fromEntries(
      (await this.repository.settings()).map((row) => [row.key, row.value]),
    );
    return {
      enrollmentId,
      course: { id: enrollment.courseId, title: enrollment.courseTitle },
      expectedAmount: this.expectedAmount(
        enrollment.priceSnapshot,
        enrollment.discountSnapshot,
      ),
      currency: enrollment.currencySnapshot,
      bank: {
        name: settings['payment.bank_name'] ?? 'Configured Bank',
        accountName:
          settings['payment.account_name'] ?? 'Joel Talargie Academy',
        accountNumber:
          settings['payment.account_number'] ?? 'Configure before use',
        branch: settings['payment.branch'] ?? 'Configured branch',
      },
      instructions: settings['payment.general_instructions'] ?? [
        'Transfer the exact amount.',
        'Upload a clear receipt.',
      ],
      referenceInstructions: settings['payment.reference_instructions'] ?? null,
      supportContact: settings['payment.support_contact'] ?? null,
      receipt: {
        maximumSizeMb: settings['payment.receipt_max_size_mb'] ?? 12,
        allowedTypes:
          settings['payment.receipt_allowed_types'] ??
          Object.keys(RECEIPT_TYPES),
      },
      latestPayment: enrollment.latestPayment
        ? {
            id: enrollment.latestPayment.id,
            status: enrollment.latestPayment.status,
            attemptNumber: enrollment.latestPayment.attemptNumber,
          }
        : null,
    };
  }

  async submit(
    user: AuthUser,
    enrollmentId: string,
    dto: SubmitPaymentDto,
    file?: Express.Multer.File,
  ) {
    const enrollment = await this.requireEnrollment(user, enrollmentId, true);
    if (!file)
      throw new UnprocessableEntityException({
        code: 'RECEIPT_REQUIRED',
        message: 'Receipt is required',
      });
    const receipt = this.validateReceipt(file, enrollmentId);
    const amount = this.money(dto.submittedAmount, true);
    const expectedAmount = this.expectedAmount(
      enrollment.priceSnapshot,
      enrollment.discountSnapshot,
    );
    if (dto.currency !== enrollment.currencySnapshot)
      throw new UnprocessableEntityException({
        code: 'PAYMENT_CURRENCY_MISMATCH',
        message: 'Currency does not match the enrollment snapshot',
      });
    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : null;
    if (paymentDate && paymentDate.getTime() > Date.now() + 5 * 60_000)
      throw new UnprocessableEntityException({
        code: 'INVALID_PAYMENT_DATE',
        message: 'Payment date cannot be in the future',
      });
    try {
      await this.storage.upload({
        key: receipt.key,
        body: file.buffer,
        contentType: receipt.detectedMimeType,
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'RECEIPT_UPLOAD_FAILED',
        message: 'Receipt upload failed safely',
      });
    }
    try {
      const payment = await this.repository.submit(
        user.id,
        enrollmentId,
        {
          transactionId: dto.transactionId,
          transactionIdNormalized: dto.transactionId
            .replace(/\s+/g, '')
            .toUpperCase(),
          amount,
          currency: dto.currency,
          paymentDate,
          studentNote: dto.studentNote?.trim() || null,
        },
        receipt,
        expectedAmount,
      );
      return {
        ...this.studentPayment(payment),
        enrollmentStatus: 'WAITING_APPROVAL',
      };
    } catch (error) {
      await this.storage.delete(receipt.key).catch(() => undefined);
      this.map(error);
    }
  }

  mine(userId: string, query: PaymentListQueryDto) {
    return this.repository.listMine(userId, query);
  }

  enrollmentPayments(
    userId: string,
    enrollmentId: string,
    query: PaymentListQueryDto,
  ) {
    return this.repository.listMine(userId, query, enrollmentId);
  }

  async mineDetail(userId: string, paymentId: string) {
    const payment = await this.repository.mine(userId, paymentId);
    if (!payment)
      throw new NotFoundException({
        code: 'PAYMENT_NOT_FOUND',
        message: 'Payment not found',
      });
    return payment;
  }

  async mineReceipt(userId: string, paymentId: string) {
    await this.mineDetail(userId, paymentId);
    return this.signedReceipt(paymentId);
  }

  adminList(query: PaymentListQueryDto) {
    return this.repository.listAdmin(query);
  }

  async adminDetail(paymentId: string) {
    const payment = await this.repository.admin(paymentId);
    if (!payment)
      throw new NotFoundException({
        code: 'PAYMENT_NOT_FOUND',
        message: 'Payment not found',
      });
    return payment;
  }

  async adminReceipt(paymentId: string) {
    await this.adminDetail(paymentId);
    return this.signedReceipt(paymentId);
  }

  async duplicates(paymentId: string) {
    const payment = await this.adminDetail(paymentId);
    const normalized =
      payment.transactionId?.replace(/\s+/g, '').toUpperCase() ?? '';
    return normalized ? this.repository.duplicates(normalized, paymentId) : [];
  }

  async approve(actorId: string, paymentId: string, dto: ApprovePaymentDto) {
    const payment = await this.adminDetail(paymentId);
    if (payment.status !== 'PENDING')
      throw new ConflictException({
        code: 'PAYMENT_ALREADY_REVIEWED',
        message: 'Payment was already reviewed',
      });
    if (payment.amountMismatch) {
      const allowed = await this.repository.actorHasPermission(
        actorId,
        'payments.approve_amount_mismatch',
      );
      if (!allowed)
        throw new ForbiddenException({
          code: 'PAYMENT_AMOUNT_MISMATCH',
          message: 'Enhanced mismatch approval permission is required',
        });
      if (!dto.mismatchApprovalReason)
        throw new UnprocessableEntityException({
          code: 'MISMATCH_APPROVAL_REASON_REQUIRED',
          message: 'Mismatch approval reason is required',
        });
    }
    if (payment.duplicateTransactionCount > 0 && !dto.acknowledgeDuplicate)
      throw new UnprocessableEntityException({
        code: 'PAYMENT_DUPLICATE_TRANSACTION_REVIEW_REQUIRED',
        message: 'Duplicate transaction warning must be acknowledged',
      });
    try {
      return await this.repository.review(actorId, paymentId, 'approve', {
        reason: dto.mismatchApprovalReason,
        reviewNote: dto.reviewNote,
      });
    } catch (error) {
      this.map(error);
    }
  }

  async decline(actorId: string, paymentId: string, dto: DeclinePaymentDto) {
    try {
      return await this.repository.review(actorId, paymentId, 'decline', {
        reason: dto.reason.trim(),
        reviewNote: dto.reviewNote,
      });
    } catch (error) {
      this.map(error);
    }
  }

  activity(paymentId: string, query: PaymentActivityQueryDto) {
    return this.repository.activity(paymentId, query);
  }

  private async requireEnrollment(
    user: AuthUser,
    enrollmentId: string,
    submission: boolean,
  ) {
    if (!user.roles.includes('STUDENT'))
      throw new ForbiddenException({
        code: 'STUDENT_ROLE_REQUIRED',
        message: 'Student role required',
      });
    const enrollment = await this.repository.enrollment(user.id, enrollmentId);
    if (!enrollment)
      throw new NotFoundException({
        code: 'ENROLLMENT_NOT_FOUND',
        message: 'Enrollment not found',
      });
    if (enrollment.userStatus !== 'ACTIVE')
      throw new ForbiddenException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'Account is not active',
      });
    if (!enrollment.emailVerified)
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Verified email required',
      });
    if (!enrollment.hasStudentRole)
      throw new ForbiddenException({
        code: 'STUDENT_ROLE_REQUIRED',
        message: 'Student role required',
      });
    if (enrollment.accessType !== 'PAID')
      throw new UnprocessableEntityException({
        code: 'ENROLLMENT_NOT_PAID',
        message: 'The course is free',
      });
    if (submission && enrollment.status !== 'PENDING_PAYMENT')
      throw new ConflictException({
        code:
          enrollment.status === 'WAITING_APPROVAL'
            ? 'PAYMENT_REVIEW_ALREADY_PENDING'
            : 'PAYMENT_NOT_REQUIRED',
        message: 'A new payment attempt is not allowed',
      });
    return enrollment;
  }

  private validateReceipt(file: Express.Multer.File, enrollmentId: string) {
    if (!file.buffer.length)
      throw new UnprocessableEntityException({
        code: 'RECEIPT_EMPTY',
        message: 'Receipt is empty',
      });
    if (file.size > 12 * 1024 * 1024)
      throw new UnprocessableEntityException({
        code: 'RECEIPT_TOO_LARGE',
        message: 'Receipt exceeds 12 MB',
      });
    const rule = RECEIPT_TYPES[file.mimetype];
    const suppliedExtension = extname(file.originalname).toLowerCase();
    const baseName = file.originalname.slice(0, -suppliedExtension.length);
    if (
      !rule ||
      !rule.signature(file.buffer) ||
      !['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(suppliedExtension)
    )
      throw new UnsupportedMediaTypeException({
        code: 'RECEIPT_SIGNATURE_INVALID',
        message: 'Receipt type or signature is invalid',
      });
    if (baseName.includes('.'))
      throw new UnsupportedMediaTypeException({
        code: 'RECEIPT_TYPE_NOT_ALLOWED',
        message: 'Double-extension filenames are rejected',
      });
    const safeName = file.originalname
      .replace(/[^A-Za-z0-9._-]/g, '_')
      .slice(0, 120);
    return {
      key: `private/payment-receipts/${enrollmentId}/${randomUUID()}${rule.extension}`,
      originalFileName: safeName,
      mimeType: file.mimetype,
      detectedMimeType: file.mimetype,
      fileExtension: rule.extension,
      fileSize: file.size,
      checksum: createHash('sha256').update(file.buffer).digest('hex'),
      storageProvider: 'S3_COMPATIBLE',
    };
  }

  private async signedReceipt(paymentId: string) {
    const receipt = await this.repository.receipt(paymentId);
    if (!receipt)
      throw new NotFoundException({
        code: 'RECEIPT_NOT_FOUND',
        message: 'Receipt not found',
      });
    try {
      return {
        url: await this.storage.getSignedUrl(receipt.storageKey, 300),
        expiresInSeconds: 300,
        originalFileName: receipt.originalFileName,
        mimeType: receipt.detectedMimeType ?? receipt.mimeType,
        fileSize: receipt.fileSize,
      };
    } catch {
      throw new ServiceUnavailableException({
        code: 'RECEIPT_ACCESS_DENIED',
        message: 'Receipt is temporarily unavailable',
      });
    }
  }

  private expectedAmount(price: string, discount: string) {
    const normalizedDiscount = this.money(discount, false);
    return normalizedDiscount !== '0.00'
      ? normalizedDiscount
      : this.money(price, false);
  }

  private money(value: string, positive: boolean) {
    if (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(value))
      throw new UnprocessableEntityException({
        code: 'INVALID_PAYMENT_AMOUNT',
        message: 'Invalid decimal amount',
      });
    const [whole, fraction = ''] = value.split('.');
    const normalized = `${whole}.${fraction.padEnd(2, '0')}`;
    if (positive && normalized === '0.00')
      throw new UnprocessableEntityException({
        code: 'INVALID_PAYMENT_AMOUNT',
        message: 'Amount must be greater than zero',
      });
    return normalized;
  }

  private studentPayment(payment: {
    id: string;
    attemptNumber: number;
    status: string;
    amountMismatch: boolean;
  }) {
    return {
      id: payment.id,
      attemptNumber: payment.attemptNumber,
      status: payment.status,
      amountMismatch: payment.amountMismatch,
    };
  }

  private map(error: unknown): never {
    const value = String(error);
    for (const code of [
      'ENROLLMENT_NOT_FOUND',
      'PAYMENT_NOT_FOUND',
      'RECEIPT_NOT_FOUND',
    ])
      if (value.includes(code))
        throw new NotFoundException({
          code,
          message: code.replaceAll('_', ' ').toLowerCase(),
        });
    for (const code of [
      'PAYMENT_PENDING_ALREADY_EXISTS',
      'PAYMENT_ALREADY_APPROVED',
      'PAYMENT_ALREADY_REVIEWED',
      'ENROLLMENT_STATUS_INVALID',
      'PAYMENT_ATTEMPT_CONFLICT',
    ])
      if (value.includes(code))
        throw new ConflictException({
          code,
          message: code.replaceAll('_', ' ').toLowerCase(),
        });
    throw error;
  }
}
