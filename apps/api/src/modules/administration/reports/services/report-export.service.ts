import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { and, count, desc, eq, schema } from '@joel-academy/database';
import { DatabaseService } from '../../../../common/database/database.service';
import { AuditService } from '../../../audit/audit.service';
import { STORAGE_SERVICE } from '../../../storage/storage.interface';
import type { StorageService } from '../../../storage/storage.interface';
import { CreateReportExportDto, ExportListQueryDto } from '../dto/reports.dto';
import { ReportRegistryService } from './report-registry.service';
@Injectable()
export class ReportExportService {
  constructor(
    private readonly db: DatabaseService,
    private readonly registry: ReportRegistryService,
    private readonly audit: AuditService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}
  private present(row: any) {
    const { fileStorageKey, ...safe } = row;
    return {
      ...safe,
      downloadAvailable:
        row.status === 'COMPLETED' &&
        (!row.expiresAt || row.expiresAt > new Date()),
    };
  }
  async create(
    actorId: string,
    dto: CreateReportExportDto,
    permissions: string[] = [],
  ) {
    this.registry.assertType(dto.reportType);
    this.registry.validateColumns(dto.selectedColumns);
    if (
      this.registry.hasSensitiveColumns(dto.selectedColumns) &&
      !permissions.includes('reports.export_sensitive')
    )
      throw new ForbiddenException('Sensitive export permission required');
    if (
      this.registry.requiresAuditExport(dto.reportType) &&
      !permissions.includes('audit.export')
    )
      throw new ForbiddenException('Audit export permission required');
    const dedup = createHash('sha256')
      .update(
        JSON.stringify([
          actorId,
          dto.reportType,
          dto.format,
          dto.filters,
          dto.selectedColumns,
        ]),
      )
      .digest('hex');
    let created: any;
    try {
      await this.db.client.transaction(async (tx) => {
        [created] = await tx
          .insert(schema.reportExports)
          .values({
            requestedBy: actorId,
            reportType: dto.reportType,
            format: dto.format,
            filtersJson: dto.filters,
            selectedColumnsJson: dto.selectedColumns,
            locale: dto.locale,
            timezone: dto.timezone,
            deduplicationKey: dedup,
          })
          .returning();
        await tx.insert(schema.backgroundJobs).values({
          jobType: 'REPORT_EXPORT',
          payload: { exportId: created.id },
          deduplicationKey: `report:${created.id}`,
        });
      });
    } catch {
      throw new ConflictException('An equivalent export is already active');
    }
    await this.audit.logCustom({
      actorId,
      action: 'report.export.requested',
      entityType: 'report_export',
      entityId: created.id,
      newData: { reportType: dto.reportType, format: dto.format },
    });
    return this.present(created);
  }
  async list(actorId: string, q: ExportListQueryDto, all = false) {
    const where = and(
      all ? undefined : eq(schema.reportExports.requestedBy, actorId),
      q.reportType
        ? eq(schema.reportExports.reportType, q.reportType)
        : undefined,
      q.format ? eq(schema.reportExports.format, q.format as any) : undefined,
      q.status ? eq(schema.reportExports.status, q.status as any) : undefined,
    );
    const [rows, total] = await Promise.all([
      this.db.client
        .select()
        .from(schema.reportExports)
        .where(where)
        .orderBy(
          desc(schema.reportExports.createdAt),
          desc(schema.reportExports.id),
        )
        .limit(q.pageSize)
        .offset((q.page - 1) * q.pageSize),
      this.db.client
        .select({ value: count() })
        .from(schema.reportExports)
        .where(where),
    ]);
    return {
      rows: rows.map((x) => this.present(x)),
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total: Number(total[0]?.value ?? 0),
      },
    };
  }
  async one(actorId: string, id: string, all = false) {
    const [row] = await this.db.client
      .select()
      .from(schema.reportExports)
      .where(eq(schema.reportExports.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Report export not found');
    if (!all && row.requestedBy !== actorId) throw new ForbiddenException();
    return row;
  }
  async detail(actorId: string, id: string, all = false) {
    return this.present(await this.one(actorId, id, all));
  }
  async download(actorId: string, id: string, all = false) {
    const row = await this.one(actorId, id, all);
    if (row.status !== 'COMPLETED' || !row.fileStorageKey)
      throw new ConflictException('Export is not available');
    if (row.expiresAt && row.expiresAt <= new Date())
      throw new ConflictException('Export has expired');
    const url = await this.storage.getSignedUrl(row.fileStorageKey, 300);
    await this.audit.logCustom({
      actorId,
      action: 'report.export.downloaded',
      entityType: 'report_export',
      entityId: id,
    });
    return { url, expiresInSeconds: 300, fileName: row.originalFileName };
  }
  async retry(actorId: string, id: string, reason: string, all = false) {
    const row = await this.one(actorId, id, all);
    if (row.status !== 'FAILED' || row.attemptCount >= row.maximumAttempts)
      throw new ConflictException('Export cannot be retried');
    await this.db.client.transaction(async (tx) => {
      await tx
        .update(schema.reportExports)
        .set({
          status: 'QUEUED',
          failureCode: null,
          failureMessage: null,
          failedAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.reportExports.id, id),
            eq(schema.reportExports.status, 'FAILED'),
          ),
        );
      await tx.insert(schema.backgroundJobs).values({
        jobType: 'REPORT_EXPORT',
        payload: { exportId: id },
        deduplicationKey: `report:${id}:${row.attemptCount + 1}`,
      });
    });
    await this.audit.logCustom({
      actorId,
      action: 'report.export.retried',
      entityType: 'report_export',
      entityId: id,
      newData: { reason },
    });
    return this.detail(actorId, id, all);
  }
  async cancel(actorId: string, id: string, reason: string, all = false) {
    await this.one(actorId, id, all);
    const [row] = await this.db.client
      .update(schema.reportExports)
      .set({
        status: 'CANCELLED',
        cancelledAt: new Date(),
        deduplicationKey: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.reportExports.id, id),
          eq(schema.reportExports.status, 'QUEUED'),
        ),
      )
      .returning();
    if (!row)
      throw new ConflictException('Only queued exports can be cancelled');
    await this.audit.logCustom({
      actorId,
      action: 'report.export.cancelled',
      entityType: 'report_export',
      entityId: id,
      newData: { reason },
    });
    return this.present(row);
  }
  key(actorId: string, id: string, format: string) {
    return `exports/${process.env.NODE_ENV ?? 'development'}/${actorId}/${id}/${randomUUID()}.${format.toLowerCase()}`;
  }
}
