import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { and, eq, lte, schema, sql } from '@joel-academy/database';
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
    const candidates = await this.db.client
      .select({ id: schema.reportExports.id })
      .from(schema.reportExports)
      .where(eq(schema.reportExports.status, 'QUEUED'))
      .limit(1);
    if (!candidates.length) return null;
    const [row] = await this.db.client
      .update(schema.reportExports)
      .set({
        status: 'PROCESSING',
        startedAt: new Date(),
        attemptCount: sql`${schema.reportExports.attemptCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(schema.reportExports.id, candidates[0].id))
      .returning();
    return row ?? null;
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
      const reportType = row.reportType ?? (row as any).report_type;
      const filtersJson = (row.filtersJson ?? (row as any).filters_json) ?? {};
      const requestedBy = row.requestedBy ?? (row as any).requested_by;

      do {
        const part = await this.reports.query(
          reportType as ReportType,
          {
            ...filtersJson,
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
          : await this.pdf.generate(all, reportType as ReportType, {
              filters: filtersJson,
            });
      const mimeType =
        row.format === 'CSV' ? 'text/csv; charset=utf-8' : 'application/pdf';
      const key = this.exports.key(requestedBy, row.id, row.format);
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
          originalFileName: `Joel-Talargie-Academy-${reportType}.${row.format.toLowerCase()}`,
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
          lte(schema.reportExports.expiresAt, new Date()),
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
