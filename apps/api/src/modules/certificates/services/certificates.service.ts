import { randomBytes } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../../storage/storage.interface';
import type {
  CertificateListDto,
  CreateCertificateTemplateDto,
  GenerateCertificateDto,
  RegenerateCertificateDto,
  UpdateCertificateTemplateDto,
} from '../dto/certificates.dto';
import { CertificatesRepository } from '../repositories/certificates.repository';
import { generateCertificatePdf } from '../generators/certificate.generator';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly repository: CertificatesRepository,
    private readonly config: ConfigService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async request(user: AuthUser, enrollmentId: string) {
    if (!user.roles.includes('STUDENT'))
      throw new ForbiddenException({
        code: 'STUDENT_ROLE_REQUIRED',
        message: 'Student role required',
      });
    return this.create(user.id, user.id, enrollmentId);
  }

  adminRequest(
    actorId: string,
    enrollmentId: string,
    dto: GenerateCertificateDto,
  ) {
    return this.create(actorId, null, enrollmentId, dto.templateId);
  }

  listMine(studentId: string, query: CertificateListDto) {
    return this.repository
      .listMine(studentId, query)
      .then((rows) => rows.map((row) => this.presentStudent(row)));
  }

  async mine(studentId: string, certificateId: string) {
    const certificate = await this.repository.mine(studentId, certificateId);
    if (!certificate) throw this.notFound();
    return this.presentStudent(certificate);
  }

  async studentDownload(
    studentId: string,
    certificateId: string,
    inline = false,
  ) {
    const certificate = await this.repository.mine(studentId, certificateId);
    if (!certificate) throw this.notFound();
    if (certificate.status !== 'GENERATED')
      throw new ForbiddenException({
        code: 'CERTIFICATE_DOWNLOAD_NOT_AVAILABLE',
        message: 'Certificate download is unavailable',
      });
    return this.download(certificateId, inline);
  }

  async verify(tokenOrCode: string) {
    const trimmed = (tokenOrCode ?? '').trim();
    if (!trimmed || !/^[A-Za-z0-9_.-]{3,128}$/.test(trimmed))
      return { state: 'INVALID' };
    const certificate = await this.repository.verify(trimmed);
    if (!certificate || !['GENERATED', 'REVOKED'].includes(certificate.status))
      return { state: 'INVALID' };
    return {
      state: certificate.status === 'REVOKED' ? 'REVOKED' : 'VALID',
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.studentName,
      courseTitle: certificate.courseTitle,
      completionDate: certificate.completionDate,
      issuedAt: certificate.issuedAt,
    };
  }

  listAdmin(query: CertificateListDto) {
    return this.repository
      .listAdmin(query)
      .then((rows) => rows.map((row) => this.presentAdmin(row)));
  }

  async admin(certificateId: string) {
    const certificate = await this.repository.admin(certificateId);
    if (!certificate) throw this.notFound();
    return this.presentAdmin(certificate);
  }

  async retry(actorId: string, certificateId: string) {
    try {
      return await this.repository.queue(actorId, certificateId, 'retry');
    } catch (error) {
      this.map(error);
    }
  }

  async regenerate(
    actorId: string,
    certificateId: string,
    dto: RegenerateCertificateDto,
  ) {
    try {
      return await this.repository.queue(
        actorId,
        certificateId,
        'regenerate',
        dto.reason.trim(),
      );
    } catch (error) {
      this.map(error);
    }
  }

  async revoke(actorId: string, certificateId: string, reason: string) {
    try {
      const certificate = await this.repository.admin(certificateId);
      const revoked = await this.repository.revoke(
        actorId,
        certificateId,
        reason.trim(),
      );
      if (certificate)
        await this.notifications
          .notify({
            userId: certificate.studentId,
            recipientEmail: certificate.studentEmail,
            recipientName: certificate.studentName,
            templateCode: 'CERTIFICATE_REVOKED',
            variables: {
              recipientName: certificate.studentName,
              courseTitle: certificate.courseTitle,
              certificateNumber: certificate.certificateNumber,
              academyName: 'Joel Talargie Academy',
              supportEmail:
                this.config.get('EMAIL_SUPPORT_ADDRESS') || 'academy support',
            },
            deduplicationKey: `certificate-revoked:${certificateId}`,
            category: 'certificates',
            title: 'Certificate revoked',
            message: `Your certificate for ${certificate.courseTitle} was revoked. Contact academy support.`,
            actionUrl: '/dashboard/certificates',
            relatedEntityType: 'certificate',
            relatedEntityId: certificateId,
            priority: 'CRITICAL',
          })
          .catch(() => null);
      return revoked;
    } catch (error) {
      this.map(error);
    }
  }

  async adminDownload(certificateId: string) {
    await this.admin(certificateId);
    return this.download(certificateId, false);
  }

  files(certificateId: string) {
    return this.repository.files(certificateId);
  }

  async fileDownload(certificateId: string, fileId: string) {
    const file = await this.repository.file(certificateId, fileId);
    if (!file)
      throw new NotFoundException({
        code: 'CERTIFICATE_FILE_NOT_FOUND',
        message: 'Certificate file not found',
      });
    return this.signed(file.storageKey, file.originalFileName, false);
  }

  events(certificateId: string) {
    return this.repository.events(certificateId);
  }

  templates() {
    return this.repository.templates().then((rows) =>
      rows.map((row) => {
        const { templateStorageKey, ...safe } = row;
        void templateStorageKey;
        return safe;
      }),
    );
  }

  async template(id: string) {
    const template = await this.repository.template(id);
    if (!template)
      throw new NotFoundException({
        code: 'CERTIFICATE_TEMPLATE_NOT_FOUND',
        message: 'Template not found',
      });
    const { templateStorageKey, ...safe } = template;
    void templateStorageKey;
    return safe;
  }

  createTemplate(actorId: string, dto: CreateCertificateTemplateDto) {
    this.validateTemplate(dto.configuration);
    return this.repository.createTemplate(actorId, dto);
  }

  updateTemplate(id: string, dto: UpdateCertificateTemplateDto) {
    if (dto.configuration) this.validateTemplate(dto.configuration);
    return this.repository.updateTemplate(id, dto);
  }

  activateTemplate(id: string, active: boolean) {
    return this.repository.activateTemplate(id, active);
  }

  private async create(
    actorId: string,
    studentId: string | null,
    enrollmentId: string,
    templateId?: string,
  ) {
    const eligibility = await this.repository.eligibility(
      studentId,
      enrollmentId,
    );
    if (!eligibility)
      throw new NotFoundException({
        code: 'ENROLLMENT_NOT_FOUND',
        message: 'Enrollment not found',
      });
    if (
      eligibility.enrollmentStatus !== 'COMPLETED' ||
      !eligibility.completedAt ||
      eligibility.progressPercentage !== 100 ||
      eligibility.required === 0 ||
      eligibility.completed < eligibility.required
    )
      throw new UnprocessableEntityException({
        code: 'CERTIFICATE_NOT_ELIGIBLE',
        message: 'Enrollment has not completed all required lessons',
      });
    if (!eligibility.certificateEnabled)
      throw new UnprocessableEntityException({
        code: 'CERTIFICATE_DISABLED',
        message: 'Certificates are disabled for this course',
      });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.repository.createIdentity({
          actorId,
          enrollmentId,
          templateId,
          certificateNumber: this.number(),
          verificationToken: randomBytes(32).toString('base64url'),
        });
      } catch (error) {
        const value = String(error);
        if (attempt < 2 && /duplicate key|unique constraint/i.test(value))
          continue;
        this.map(error);
      }
    }
    throw new Error('CERTIFICATE_IDENTITY_COLLISION');
  }

  private number() {
    const date = new Date();
    return `JTA-${date.getUTCFullYear()}-${randomBytes(16).toString('hex').toUpperCase()}`;
  }

  private verificationUrl(token: string) {
    return `${(this.config.get<string>('CERTIFICATE_PUBLIC_BASE_URL') ?? 'http://localhost:3000/certificates/verify').replace(/\/$/, '')}/${token}`;
  }

  private presentStudent<
    T extends { verificationToken: string; status: string },
  >(certificate: T) {
    const { verificationToken, ...safe } = certificate;
    return {
      ...safe,
      downloadAvailable: certificate.status === 'GENERATED',
      verificationUrl: ['GENERATED', 'REVOKED'].includes(certificate.status)
        ? this.verificationUrl(verificationToken)
        : null,
    };
  }

  private presentAdmin<T extends { verificationToken: string }>(
    certificate: T,
  ) {
    const { verificationToken, ...safe } = certificate;
    return {
      ...safe,
      verificationUrl: this.verificationUrl(verificationToken),
    };
  }

  private async download(certificateId: string, inline: boolean) {
    const file = await this.repository.currentFile(certificateId);
    const certificate = await this.repository.admin(certificateId);
    if (!file)
      throw new NotFoundException({
        code: 'CERTIFICATE_FILE_NOT_FOUND',
        message: 'Certificate file not found',
      });

    // If the physical PDF file does not exist on storage (e.g. fresh DB restore), regenerate it on the fly!
    const exists = this.storage.exists
      ? await this.storage.exists(file.storageKey).catch(() => false)
      : true;
    if (!exists && certificate) {
      try {
        const base = (
          this.config.get<string>('CERTIFICATE_PUBLIC_BASE_URL') ??
          'http://localhost:3000/certificates/verify'
        ).replace(/\/$/, '');
        const pdf = await generateCertificatePdf({
          academyName: 'Joel Talargie Academy',
          title: 'Certificate of Completion',
          studentName: certificate.studentName ?? 'Student',
          courseTitle: certificate.courseTitle ?? 'Course',
          completionDate: certificate.completionDate
            ? new Date(certificate.completionDate)
            : new Date(),
          certificateNumber: certificate.certificateNumber ?? 'JTA-CERT',
          verificationUrl: `${base}/${certificate.verificationToken || certificate.id}`,
          footerText: 'Issued by Joel Talargie Academy',
        });
        await this.storage.upload({
          key: file.storageKey,
          body: pdf,
          contentType: 'application/pdf',
        });
      } catch (error) {
        // Log & proceed to signed URL attempt
      }
    }

    const safeStudent = (certificate?.studentName ?? 'Student')
      .replace(/[/\\?%*:|"<>]/g, '')
      .trim();
    const safeCourse = (certificate?.courseTitle ?? 'Course')
      .replace(/[/\\?%*:|"<>]/g, '')
      .trim();
    const fileName = `${safeStudent} - ${safeCourse} - JOEL TALARGIE ACADEMY.pdf`;
    return this.signed(file.storageKey, fileName, inline);
  }

  private async signed(key: string, fileName: string, inline: boolean) {
    try {
      return {
        url: await this.storage.getSignedUrl(
          key,
          300,
          inline ? 'inline' : 'attachment',
        ),
        expiresInSeconds: 300,
        fileName,
      };
    } catch {
      throw new ServiceUnavailableException({
        code: 'CERTIFICATE_STORAGE_UNAVAILABLE',
        message: 'Certificate download is temporarily unavailable',
      });
    }
  }

  private validateTemplate(configuration: Record<string, unknown>) {
    const allowed = new Set([
      'academyName',
      'title',
      'primaryColor',
      'accentColor',
      'footerText',
    ]);
    if (Object.keys(configuration).some((key) => !allowed.has(key)))
      throw new UnprocessableEntityException({
        code: 'CERTIFICATE_TEMPLATE_INVALID',
        message: 'Template contains unsupported configuration',
      });
    for (const [key, value] of Object.entries(configuration)) {
      if (
        typeof value !== 'string' ||
        value.length > 200 ||
        /<script|javascript:|\.\.[/\\]/i.test(value)
      )
        throw new UnprocessableEntityException({
          code: 'CERTIFICATE_TEMPLATE_INVALID',
          message: `Invalid template field: ${key}`,
        });
      if (key.endsWith('Color') && !/^#[0-9A-Fa-f]{6}$/.test(value))
        throw new UnprocessableEntityException({
          code: 'CERTIFICATE_TEMPLATE_INVALID',
          message: 'Template color must be a hex color',
        });
    }
  }

  private notFound() {
    return new NotFoundException({
      code: 'CERTIFICATE_NOT_FOUND',
      message: 'Certificate not found',
    });
  }

  private map(error: unknown): never {
    const value = String(error);
    if (value.includes('NOT_FOUND')) throw this.notFound();
    if (value.includes('REVOKED') || value.includes('NOT_ALLOWED'))
      throw new ConflictException({
        code: 'CERTIFICATE_STATUS_INVALID',
        message: 'Certificate operation is not allowed',
      });
    if (
      value.includes('NOT_ELIGIBLE') ||
      value.includes('DISABLED') ||
      value.includes('STUDENT_NAME')
    )
      throw new UnprocessableEntityException({
        code: 'CERTIFICATE_NOT_ELIGIBLE',
        message: 'Certificate eligibility requirements were not met',
      });
    throw error;
  }
}
