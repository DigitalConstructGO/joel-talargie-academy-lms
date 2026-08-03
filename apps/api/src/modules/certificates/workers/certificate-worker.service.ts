import { createHash, randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, sql, schema } from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../../storage/storage.interface';
import { generateCertificatePdf } from '../generators/certificate.generator';

interface CertificateJob {
  id: string;
  certificateId: string;
  attempts: number;
}

@Injectable()
export class CertificateWorkerService {
  private readonly logger = new Logger(CertificateWorkerService.name);
  private readonly workerId = `certificate-worker-${randomUUID()}`;

  constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async tick() {
    if (!this.config.get<boolean>('CERTIFICATE_WORKER_ENABLED')) return 0;
    await this.recoverStale();
    const jobs = await this.claim();
    for (const job of jobs) {
      try {
        await this.process(job);
      } catch (error) {
        await this.fail(job, error);
      }
    }
    return jobs.length;
  }

  private claim(): Promise<CertificateJob[]> {
    const batchSize =
      this.config.get<number>('CERTIFICATE_WORKER_BATCH_SIZE') ?? 2;
    return this.database.client.transaction(async (tx) => {
      const result = await tx.execute(sql<CertificateJob>`
        WITH claimed AS (
          SELECT id
          FROM background_jobs
          WHERE status = 'PENDING'
            AND job_type = 'GENERATE_CERTIFICATE'
            AND scheduled_at <= now()
          ORDER BY priority DESC, scheduled_at ASC, id ASC
          FOR UPDATE SKIP LOCKED
          LIMIT ${batchSize}
        )
        UPDATE background_jobs AS job
        SET status = 'RUNNING',
            locked_at = now(),
            locked_by = ${this.workerId},
            attempts = job.attempts + 1,
            updated_at = now()
        FROM claimed
        WHERE job.id = claimed.id
        RETURNING job.id,
          job.payload->>'certificateId' AS "certificateId",
          job.attempts
      `);
      return result.rows.map((row) => ({
        id: String(row.id),
        certificateId: String(row.certificateId),
        attempts: Number(row.attempts),
      }));
    });
  }

  private async process(job: CertificateJob) {
    const [data] = await this.database.client
      .select({
        id: schema.certificates.id,
        enrollmentId: schema.certificates.enrollmentId,
        status: schema.certificates.status,
        number: schema.certificates.certificateNumber,
        token: schema.certificates.verificationToken,
        studentName: schema.certificates.studentNameAtIssue,
        courseTitle: schema.certificates.courseTitleAtIssue,
        completionDate: schema.certificates.completionDateSnapshot,
        generationVersion: schema.certificates.generationVersion,
        templateConfiguration: schema.certificateTemplates.configuration,
        studentId: schema.enrollments.studentId,
      })
      .from(schema.certificates)
      .innerJoin(
        schema.certificateTemplates,
        eq(schema.certificateTemplates.id, schema.certificates.templateId),
      )
      .innerJoin(
        schema.enrollments,
        eq(schema.enrollments.id, schema.certificates.enrollmentId),
      )
      .where(eq(schema.certificates.id, job.certificateId))
      .limit(1);
    if (!data || data.status !== 'PENDING' || !data.completionDate)
      throw new Error('CERTIFICATE_STATE_INVALID');
    const configuration = data.templateConfiguration as Record<string, unknown>;
    const base = (
      this.config.get<string>('CERTIFICATE_PUBLIC_BASE_URL') ?? ''
    ).replace(/\/$/, '');
    const pdf = await generateCertificatePdf({
      academyName: stringValue(
        configuration.academyName,
        'Joel Talargie Academy',
      ),
      title: stringValue(configuration.title, 'Certificate of Completion'),
      studentName: data.studentName,
      courseTitle: data.courseTitle,
      completionDate: data.completionDate,
      certificateNumber: data.number,
      verificationUrl: `${base}/${data.token}`,
      primaryColor: stringValue(configuration.primaryColor, '#15324A'),
      accentColor: stringValue(configuration.accentColor, '#C9A227'),
      footerText: stringValue(
        configuration.footerText,
        'Issued by Joel Talargie Academy',
      ),
    });
    if (pdf.length < 100 || pdf.subarray(0, 5).toString() !== '%PDF-')
      throw new Error('CERTIFICATE_PDF_INVALID');
    const checksum = createHash('sha256').update(pdf).digest('hex');
    const key = `private/certificates/${data.id}/v${data.generationVersion}/${randomUUID()}.pdf`;
    await this.storage.upload({
      key,
      body: pdf,
      contentType: 'application/pdf',
    });
    try {
      await this.database.client.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT id FROM certificates WHERE id = ${data.id} FOR UPDATE`,
        );
        const current = await tx.query.certificates.findFirst({
          where: eq(schema.certificates.id, data.id),
        });
        if (
          !current ||
          current.status !== 'PENDING' ||
          current.generationVersion !== data.generationVersion
        )
          throw new Error('CERTIFICATE_STATE_CHANGED');
        await tx
          .update(schema.certificateFiles)
          .set({ isCurrent: false })
          .where(
            and(
              eq(schema.certificateFiles.certificateId, data.id),
              eq(schema.certificateFiles.isCurrent, true),
            ),
          );
        await tx.insert(schema.certificateFiles).values({
          certificateId: data.id,
          version: data.generationVersion,
          storageKey: key,
          originalFileName: `${data.number}.pdf`,
          mimeType: 'application/pdf',
          fileSize: pdf.length,
          checksum,
          isCurrent: true,
        });
        const now = new Date();
        await tx
          .update(schema.certificates)
          .set({
            status: 'GENERATED',
            pdfStorageKey: key,
            pdfChecksum: checksum,
            pdfFileSize: pdf.length,
            pdfMimeType: 'application/pdf',
            issuedAt: current.issuedAt ?? now,
            generatedAt: now,
            lastGenerationAttemptAt: now,
            failureCode: null,
            failureMessage: null,
            updatedAt: now,
          })
          .where(eq(schema.certificates.id, data.id));
        await tx.insert(schema.certificateEvents).values({
          certificateId: data.id,
          action: 'certificate.generated',
          metadata: {
            generationVersion: data.generationVersion,
            checksum,
            fileSize: pdf.length,
          },
        });
        await tx.insert(schema.notifications).values({
          userId: data.studentId,
          channel: 'IN_APP',
          title: 'Certificate ready',
          body: 'Your course-completion certificate is ready to download.',
        });
        await tx
          .update(schema.backgroundJobs)
          .set({
            status: 'COMPLETED',
            completedAt: now,
            lockedAt: null,
            lockedBy: null,
            updatedAt: now,
          })
          .where(eq(schema.backgroundJobs.id, job.id));
      });
    } catch (error) {
      await this.storage.delete(key).catch(() => undefined);
      throw error;
    }
  }

  private async fail(job: CertificateJob, error: unknown) {
    const max = this.config.get<number>('CERTIFICATE_JOB_MAX_ATTEMPTS') ?? 5;
    const terminal =
      job.attempts >= max || String(error).includes('STATE_INVALID');
    const message =
      error instanceof Error
        ? error.message.slice(0, 200)
        : 'CERTIFICATE_GENERATION_FAILED';
    const scheduledAt = new Date(
      Date.now() +
        Math.min(60_000 * 2 ** Math.max(job.attempts - 1, 0), 3_600_000),
    );
    await this.database.client.transaction(async (tx) => {
      await tx
        .update(schema.backgroundJobs)
        .set({
          status: terminal ? 'FAILED' : 'PENDING',
          scheduledAt,
          lockedAt: null,
          lockedBy: null,
          lastError: message,
          updatedAt: new Date(),
        })
        .where(eq(schema.backgroundJobs.id, job.id));
      await tx
        .update(schema.certificates)
        .set({
          status: terminal ? 'FAILED' : 'PENDING',
          failureCode: terminal ? 'CERTIFICATE_GENERATION_FAILED' : null,
          failureMessage: terminal
            ? 'Certificate generation failed safely'
            : null,
          lastGenerationAttemptAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.certificates.id, job.certificateId));
    });
    this.logger.warn(
      `Certificate job ${job.id} ${terminal ? 'failed' : 'scheduled for retry'}`,
    );
  }

  private recoverStale() {
    const timeout =
      this.config.get<number>('CERTIFICATE_JOB_LOCK_TIMEOUT_MS') ?? 300_000;
    return this.database.client
      .update(schema.backgroundJobs)
      .set({
        status: 'PENDING',
        lockedAt: null,
        lockedBy: null,
        scheduledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.backgroundJobs.jobType, 'GENERATE_CERTIFICATE'),
          eq(schema.backgroundJobs.status, 'RUNNING'),
          sql`${schema.backgroundJobs.lockedAt} < ${new Date(Date.now() - timeout)}`,
        ),
      );
  }
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.length <= 200 ? value : fallback;
}
