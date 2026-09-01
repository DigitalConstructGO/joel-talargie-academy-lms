import { Injectable } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  schema,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import type {
  CertificateListDto,
  CreateCertificateTemplateDto,
  UpdateCertificateTemplateDto,
} from '../dto/certificates.dto';

@Injectable()
export class CertificatesRepository {
  constructor(private readonly database: DatabaseService) {}
  private get db() {
    return this.database.client;
  }

  async eligibility(studentId: string | null, enrollmentId: string) {
    const [row] = await this.db
      .select({
        enrollmentId: schema.enrollments.id,
        studentId: schema.enrollments.studentId,
        courseId: schema.enrollments.courseId,
        enrollmentStatus: schema.enrollments.status,
        progressPercentage: schema.enrollments.progressPercentage,
        completedAt: schema.enrollments.completedAt,
        courseTitle: schema.courses.title,
        certificateEnabled: schema.courses.certificateEnabled,
        firstName: schema.userProfiles.firstName,
        lastName: schema.userProfiles.lastName,
      })
      .from(schema.enrollments)
      .innerJoin(
        schema.courses,
        eq(schema.courses.id, schema.enrollments.courseId),
      )
      .leftJoin(
        schema.userProfiles,
        eq(schema.userProfiles.userId, schema.enrollments.studentId),
      )
      .where(
        and(
          eq(schema.enrollments.id, enrollmentId),
          studentId ? eq(schema.enrollments.studentId, studentId) : undefined,
        ),
      )
      .limit(1);
    if (!row) return null;
    const [{ required = 0, completed = 0 } = {}] = await this.db
      .select({
        required: count(schema.lessons.id),
        completed: sql<number>`count(${schema.lessonProgress.id}) filter (where ${schema.lessonProgress.status} = 'COMPLETED')`,
      })
      .from(schema.lessons)
      .leftJoin(
        schema.lessonProgress,
        and(
          eq(schema.lessonProgress.lessonId, schema.lessons.id),
          eq(schema.lessonProgress.enrollmentId, enrollmentId),
        ),
      )
      .where(
        and(
          eq(schema.lessons.courseId, row.courseId),
          eq(schema.lessons.isMandatory, true),
          eq(schema.lessons.isPublished, true),
          sql`${schema.lessons.archivedAt} IS NULL`,
        ),
      );
    return { ...row, required: Number(required), completed: Number(completed) };
  }

  async createIdentity(input: {
    enrollmentId: string;
    actorId: string;
    templateId?: string;
    certificateNumber: string;
    verificationToken: string;
  }) {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM enrollments WHERE id = ${input.enrollmentId}`,
      );
      const existing = await tx.query.certificates.findFirst({
        where: and(
          eq(schema.certificates.enrollmentId, input.enrollmentId),
          sql`${schema.certificates.status} <> 'REVOKED'`,
        ),
      });
      if (existing) return { created: false, certificate: existing };
      const [eligible] = await tx
        .select({
          studentId: schema.enrollments.studentId,
          courseId: schema.enrollments.courseId,
          status: schema.enrollments.status,
          progress: schema.enrollments.progressPercentage,
          completedAt: schema.enrollments.completedAt,
          courseTitle: schema.courses.title,
          enabled: schema.courses.certificateEnabled,
          firstName: schema.userProfiles.firstName,
          lastName: schema.userProfiles.lastName,
        })
        .from(schema.enrollments)
        .innerJoin(
          schema.courses,
          eq(schema.courses.id, schema.enrollments.courseId),
        )
        .leftJoin(
          schema.userProfiles,
          eq(schema.userProfiles.userId, schema.enrollments.studentId),
        )
        .where(eq(schema.enrollments.id, input.enrollmentId))
        .limit(1);
      if (!eligible) throw new Error('ENROLLMENT_NOT_FOUND');
      if (
        eligible.status !== 'COMPLETED' ||
        !eligible.completedAt ||
        eligible.progress !== 100
      )
        throw new Error('CERTIFICATE_NOT_ELIGIBLE');
      if (!eligible.enabled) throw new Error('CERTIFICATE_DISABLED');
      const template = input.templateId
        ? await tx.query.certificateTemplates.findFirst({
            where: and(
              eq(schema.certificateTemplates.id, input.templateId),
              eq(schema.certificateTemplates.isActive, true),
            ),
          })
        : await tx.query.certificateTemplates.findFirst({
            where: and(
              eq(schema.certificateTemplates.isDefault, true),
              eq(schema.certificateTemplates.isActive, true),
            ),
          });
      if (!template) throw new Error('CERTIFICATE_TEMPLATE_NOT_FOUND');
      const name =
        `${eligible.firstName ?? ''} ${eligible.lastName ?? ''}`.trim();
      if (!name) throw new Error('CERTIFICATE_STUDENT_NAME_REQUIRED');
      const [certificate] = await tx
        .insert(schema.certificates)
        .values({
          enrollmentId: input.enrollmentId,
          templateId: template.id,
          certificateNumber: input.certificateNumber,
          verificationToken: input.verificationToken,
          studentNameAtIssue: name,
          courseTitleAtIssue: eligible.courseTitle,
          completionDateSnapshot: eligible.completedAt,
          templateNameSnapshot: template.name,
          templateVersionSnapshot: template.version,
          status: 'PENDING',
          generationVersion: 1,
        })
        .returning();
      if (!certificate) throw new Error('CERTIFICATE_CREATE_FAILED');
      await tx.insert(schema.certificateEvents).values({
        certificateId: certificate.id,
        actorId: input.actorId,
        action: 'certificate.created',
        metadata: { enrollmentId: input.enrollmentId, generationVersion: 1 },
      });
      await tx
        .insert(schema.backgroundJobs)
        .values({
          jobType: 'GENERATE_CERTIFICATE',
          deduplicationKey: `certificate:generate:${certificate.id}:v1`,
          payload: {
            certificateId: certificate.id,
            enrollmentId: input.enrollmentId,
          },
        })
        .onConflictDoNothing();
      return { created: true, certificate };
    });
  }

  listMine(studentId: string, query: CertificateListDto) {
    return this.studentSelect()
      .where(
        and(
          eq(schema.enrollments.studentId, studentId),
          query.status
            ? eq(schema.certificates.status, query.status)
            : undefined,
          query.courseId
            ? eq(schema.enrollments.courseId, query.courseId)
            : undefined,
        ),
      )
      .orderBy(
        desc(schema.certificates.createdAt),
        desc(schema.certificates.id),
      )
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
  }

  mine(studentId: string, certificateId: string) {
    return this.studentSelect()
      .where(
        and(
          eq(schema.certificates.id, certificateId),
          eq(schema.enrollments.studentId, studentId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  verify(tokenOrCode: string) {
    return this.db
      .select({
        status: schema.certificates.status,
        certificateNumber: schema.certificates.certificateNumber,
        studentName: schema.certificates.studentNameAtIssue,
        courseTitle: schema.certificates.courseTitleAtIssue,
        completionDate: schema.certificates.completionDateSnapshot,
        issuedAt: schema.certificates.issuedAt,
      })
      .from(schema.certificates)
      .where(
        or(
          eq(schema.certificates.verificationToken, tokenOrCode),
          ilike(schema.certificates.certificateNumber, tokenOrCode),
          eq(schema.certificates.certificateNumber, tokenOrCode),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  listAdmin(query: CertificateListDto) {
    return this.adminSelect()
      .where(
        and(
          query.status
            ? eq(schema.certificates.status, query.status)
            : undefined,
          query.courseId
            ? eq(schema.enrollments.courseId, query.courseId)
            : undefined,
          query.search
            ? sql`(${schema.certificates.certificateNumber} ILIKE ${`%${query.search}%`} OR ${schema.users.emailNormalized} ILIKE ${`%${query.search.toLowerCase()}%`} OR ${schema.certificates.studentNameAtIssue} ILIKE ${`%${query.search}%`} OR ${schema.certificates.courseTitleAtIssue} ILIKE ${`%${query.search}%`})`
            : undefined,
        ),
      )
      .orderBy(
        desc(schema.certificates.createdAt),
        desc(schema.certificates.id),
      )
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
  }

  admin(certificateId: string) {
    return this.adminSelect()
      .where(eq(schema.certificates.id, certificateId))
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  currentFile(certificateId: string) {
    return this.db.query.certificateFiles.findFirst({
      where: and(
        eq(schema.certificateFiles.certificateId, certificateId),
        eq(schema.certificateFiles.isCurrent, true),
      ),
    });
  }

  files(certificateId: string) {
    return this.db
      .select({
        id: schema.certificateFiles.id,
        version: schema.certificateFiles.version,
        originalFileName: schema.certificateFiles.originalFileName,
        mimeType: schema.certificateFiles.mimeType,
        fileSize: schema.certificateFiles.fileSize,
        checksum: schema.certificateFiles.checksum,
        isCurrent: schema.certificateFiles.isCurrent,
        generatedAt: schema.certificateFiles.generatedAt,
      })
      .from(schema.certificateFiles)
      .where(eq(schema.certificateFiles.certificateId, certificateId))
      .orderBy(desc(schema.certificateFiles.version));
  }

  file(certificateId: string, fileId: string) {
    return this.db.query.certificateFiles.findFirst({
      where: and(
        eq(schema.certificateFiles.id, fileId),
        eq(schema.certificateFiles.certificateId, certificateId),
      ),
    });
  }

  events(certificateId: string) {
    return this.db
      .select({
        id: schema.certificateEvents.id,
        actorId: schema.certificateEvents.actorId,
        action: schema.certificateEvents.action,
        reason: schema.certificateEvents.reason,
        metadata: schema.certificateEvents.metadata,
        createdAt: schema.certificateEvents.createdAt,
      })
      .from(schema.certificateEvents)
      .where(eq(schema.certificateEvents.certificateId, certificateId))
      .orderBy(
        desc(schema.certificateEvents.createdAt),
        desc(schema.certificateEvents.id),
      )
      .limit(100);
  }

  queue(
    actorId: string,
    certificateId: string,
    operation: 'retry' | 'regenerate',
    reason?: string,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM certificates WHERE id = ${certificateId}`,
      );
      const certificate = await tx.query.certificates.findFirst({
        where: eq(schema.certificates.id, certificateId),
      });
      if (!certificate) throw new Error('CERTIFICATE_NOT_FOUND');
      if (certificate.status === 'REVOKED')
        throw new Error('CERTIFICATE_REVOKED');
      if (operation === 'retry' && certificate.status !== 'FAILED')
        throw new Error('CERTIFICATE_RETRY_NOT_ALLOWED');
      if (
        operation === 'regenerate' &&
        !['GENERATED', 'FAILED'].includes(certificate.status)
      )
        throw new Error('CERTIFICATE_REGENERATION_NOT_ALLOWED');
      const version =
        operation === 'regenerate'
          ? certificate.generationVersion + 1
          : certificate.generationVersion;
      await tx
        .update(schema.certificates)
        .set({
          status: 'PENDING',
          generationVersion: version,
          failureCode: null,
          failureMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.certificates.id, certificateId));
      await tx.insert(schema.certificateEvents).values({
        certificateId,
        actorId,
        action:
          operation === 'retry'
            ? 'certificate.retry_requested'
            : 'certificate.regeneration_requested',
        reason,
        metadata: { generationVersion: version },
      });
      await tx
        .insert(schema.backgroundJobs)
        .values({
          jobType: 'GENERATE_CERTIFICATE',
          deduplicationKey: `certificate:generate:${certificateId}:v${version}`,
          payload: { certificateId, enrollmentId: certificate.enrollmentId },
        })
        .onConflictDoNothing();
      return { certificateId, status: 'PENDING', generationVersion: version };
    });
  }

  revoke(actorId: string, certificateId: string, reason: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM certificates WHERE id = ${certificateId}`,
      );
      const certificate = await tx.query.certificates.findFirst({
        where: eq(schema.certificates.id, certificateId),
      });
      if (!certificate) throw new Error('CERTIFICATE_NOT_FOUND');
      if (certificate.status === 'REVOKED') return certificate;
      if (certificate.status !== 'GENERATED')
        throw new Error('CERTIFICATE_REVOCATION_NOT_ALLOWED');
      const now = new Date();
      const [updated] = await tx
        .update(schema.certificates)
        .set({
          status: 'REVOKED',
          revokedAt: now,
          revocationReason: reason,
          updatedAt: now,
        })
        .where(eq(schema.certificates.id, certificateId))
        .returning();
      await tx.insert(schema.certificateEvents).values({
        certificateId,
        actorId,
        action: 'certificate.revoked',
        reason,
      });
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'certificate.revoked',
        entityType: 'certificate',
        entityId: certificateId,
        before: { status: 'GENERATED' },
        after: { status: 'REVOKED', reason },
      });
      return updated;
    });
  }

  templates() {
    return this.db
      .select()
      .from(schema.certificateTemplates)
      .orderBy(desc(schema.certificateTemplates.createdAt));
  }
  template(id: string) {
    return this.db.query.certificateTemplates.findFirst({
      where: eq(schema.certificateTemplates.id, id),
    });
  }
  createTemplate(actorId: string, dto: CreateCertificateTemplateDto) {
    return this.db.transaction(async (tx) => {
      if (dto.isDefault)
        await tx
          .update(schema.certificateTemplates)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(schema.certificateTemplates.isDefault, true));
      const [created] = await tx
        .insert(schema.certificateTemplates)
        .values({ ...dto, createdBy: actorId })
        .returning();
      return created;
    });
  }
  updateTemplate(id: string, dto: UpdateCertificateTemplateDto) {
    return this.db
      .update(schema.certificateTemplates)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.certificateTemplates.id, id))
      .returning()
      .then((rows) => rows[0] ?? null);
  }
  async activateTemplate(id: string, active: boolean) {
    return this.db.transaction(async (tx) => {
      const template = await tx.query.certificateTemplates.findFirst({
        where: eq(schema.certificateTemplates.id, id),
      });
      if (!template) throw new Error('CERTIFICATE_TEMPLATE_NOT_FOUND');
      if (!active && template.isDefault)
        throw new Error('DEFAULT_TEMPLATE_CANNOT_BE_DEACTIVATED');
      if (active && template.isDefault)
        await tx
          .update(schema.certificateTemplates)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(
              eq(schema.certificateTemplates.isDefault, true),
              sql`${schema.certificateTemplates.id} <> ${id}`,
            ),
          );
      const [updated] = await tx
        .update(schema.certificateTemplates)
        .set({
          isActive: active,
          isDefault: template.isDefault,
          updatedAt: new Date(),
        })
        .where(eq(schema.certificateTemplates.id, id))
        .returning();
      return updated;
    });
  }

  private studentSelect() {
    return this.db
      .select({
        id: schema.certificates.id,
        certificateNumber: schema.certificates.certificateNumber,
        status: schema.certificates.status,
        studentName: schema.certificates.studentNameAtIssue,
        courseTitle: schema.certificates.courseTitleAtIssue,
        courseId: schema.enrollments.courseId,
        completionDate: schema.certificates.completionDateSnapshot,
        issuedAt: schema.certificates.issuedAt,
        generatedAt: schema.certificates.generatedAt,
        revokedAt: schema.certificates.revokedAt,
        generationVersion: schema.certificates.generationVersion,
        createdAt: schema.certificates.createdAt,
        verificationToken: schema.certificates.verificationToken,
      })
      .from(schema.certificates)
      .innerJoin(
        schema.enrollments,
        eq(schema.enrollments.id, schema.certificates.enrollmentId),
      );
  }

  private adminSelect() {
    return this.db
      .select({
        id: schema.certificates.id,
        enrollmentId: schema.certificates.enrollmentId,
        certificateNumber: schema.certificates.certificateNumber,
        verificationToken: schema.certificates.verificationToken,
        status: schema.certificates.status,
        studentId: schema.enrollments.studentId,
        studentEmail: schema.users.email,
        studentName: schema.certificates.studentNameAtIssue,
        courseId: schema.enrollments.courseId,
        courseTitle: schema.certificates.courseTitleAtIssue,
        completionDate: schema.certificates.completionDateSnapshot,
        templateId: schema.certificates.templateId,
        templateName: schema.certificates.templateNameSnapshot,
        templateVersion: schema.certificates.templateVersionSnapshot,
        issuedAt: schema.certificates.issuedAt,
        generatedAt: schema.certificates.generatedAt,
        revokedAt: schema.certificates.revokedAt,
        revocationReason: schema.certificates.revocationReason,
        generationVersion: schema.certificates.generationVersion,
        failureCode: schema.certificates.failureCode,
        failureMessage: schema.certificates.failureMessage,
        createdAt: schema.certificates.createdAt,
      })
      .from(schema.certificates)
      .innerJoin(
        schema.enrollments,
        eq(schema.enrollments.id, schema.certificates.enrollmentId),
      )
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.enrollments.studentId),
      );
  }
}
