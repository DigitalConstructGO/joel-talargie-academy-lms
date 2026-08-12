import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { and, eq, schema, sql } from '@joel-academy/database';
import { DatabaseService } from '../../../../common/database/database.service';
import { STORAGE_SERVICE } from '../../../storage/storage.interface';
import type { StorageService } from '../../../storage/storage.interface';
import {
  CsvReportExporter,
  PdfReportExporter,
} from '../exporters/report.exporters';
import { ReportRepository } from '../repositories/report.repository';
import { ReportExportService } from '../services/report-export.service';
import type { ReportType } from '../report.types';
@Injectable()
export class ReportExportProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportExportProcessor.name);
  private readonly workerId = `api-report-${randomUUID()}`;
  private timer: NodeJS.Timeout | undefined;
  private processing = false;
  constructor(
    private readonly db: DatabaseService,
    private readonly reports: ReportRepository,
    private readonly csv: CsvReportExporter,
    private readonly pdf: PdfReportExporter,
    private readonly exports: ReportExportService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /**
   * Process exports in the API process as well as the optional dedicated
   * worker. `FOR UPDATE SKIP LOCKED` in claim() makes this safe when both run.
   * This prevents local/single-process deployments leaving exports queued
   * forever and therefore unable to download.
   */
  onModuleInit() {
    this.timer = setInterval(() => void this.runSafely(), 2_000);
    void this.runSafely();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async processQueuedExports() {
    if (this.processing) return;
    this.processing = true;
    try {
      await this.expire();
      while (await this.processOne(this.workerId)) {
        // Drain currently queued exports without overlapping another timer tick.
      }
    } finally {
      this.processing = false;
    }
  }

  private async runSafely() {
    try {
      await this.processQueuedExports();
    } catch {
      this.logger.error('Report export queue processing failed');
    }
  }
  async claim(workerId: string) {
    const result = await this.db.client.execute(
      sql`WITH candidate AS (SELECT id FROM report_exports WHERE status='QUEUED' ORDER BY requested_at,id FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE report_exports e SET status='PROCESSING',started_at=now(),attempt_count=attempt_count+1,updated_at=now() FROM candidate WHERE e.id=candidate.id RETURNING e.*`,
    );
    return (result as any).rows?.[0] ?? (result as any)[0] ?? null;
  }
  async processOne(workerId: string) {
    const row = await this.claim(workerId);
    if (!row) return false;
    try {
      if (row.format !== 'CSV' && row.format !== 'PDF')
        throw new Error('UNSUPPORTED_REPORT_FORMAT');
      const all: Record<string, unknown>[] = [];
      let page = 1,
        total = 0;
      do {
        const part = await this.reports.query(
          row.report_type as ReportType,
          {
            ...(row.filters_json ?? {}),
            page,
            pageSize: 100,
            sortDirection: 'asc',
          } as any,
        );
        all.push(...(part.rows as any));
        total = part.total;
        page++;
        if (all.length > Number(process.env.REPORT_EXPORT_MAX_ROWS ?? 100000))
          throw new Error('REPORT_ROW_LIMIT');
      } while (all.length < total);
      const body =
        row.format === 'CSV'
          ? this.csv.generate(all)
          : await this.pdf.generate(all, row.report_type, {
              filters: row.filters_json ?? {},
            });
      const mimeType =
        row.format === 'CSV' ? 'text/csv; charset=utf-8' : 'application/pdf';
      const key = this.exports.key(row.requested_by, row.id, row.format);
      await this.storage.upload({ key, body, contentType: mimeType });
      const checksum = createHash('sha256').update(body).digest('hex');
      await this.db.client
        .update(schema.reportExports)
        .set({
          status: 'COMPLETED',
          completedAt: new Date(),
          expiresAt: new Date(
            Date.now() +
              Number(process.env.REPORT_EXPORT_RETENTION_DAYS ?? 30) * 86400000,
          ),
          rowCount: all.length,
          fileStorageKey: key,
          originalFileName: `Joel-Talargie-Academy-${row.report_type}.${row.format.toLowerCase()}`,
          mimeType,
          fileSize: body.length,
          checksum,
          deduplicationKey: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.reportExports.id, row.id),
            eq(schema.reportExports.status, 'PROCESSING'),
          ),
        );
      return true;
    } catch (error) {
      await this.db.client
        .update(schema.reportExports)
        .set({
          status: 'FAILED',
          failedAt: new Date(),
          failureCode:
            error instanceof Error
              ? error.message.slice(0, 80)
              : 'GENERATION_FAILED',
          failureMessage: 'Report generation failed',
          deduplicationKey: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.reportExports.id, row.id),
            eq(schema.reportExports.status, 'PROCESSING'),
          ),
        );
      return true;
    }
  }
  async expire() {
    const rows = await this.db.client
      .select({
        id: schema.reportExports.id,
        key: schema.reportExports.fileStorageKey,
      })
      .from(schema.reportExports)
      .where(
        and(
          eq(schema.reportExports.status, 'COMPLETED'),
          sql`${schema.reportExports.expiresAt} <= now()`,
        ),
      );
    for (const row of rows) {
      if (row.key) await this.storage.delete(row.key);
      await this.db.client
        .update(schema.reportExports)
        .set({ status: 'EXPIRED', fileStorageKey: null, updatedAt: new Date() })
        .where(
          and(
            eq(schema.reportExports.id, row.id),
            eq(schema.reportExports.status, 'COMPLETED'),
          ),
        );
    }
    return rows.length;
  }
}
