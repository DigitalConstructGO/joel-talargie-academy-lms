import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReportExportService } from '../report-export.service';

describe('ReportExportService', () => {
  const db = {
    client: {
      transaction: jest.fn(),
      select: jest.fn(),
      update: jest.fn(),
    },
  };
  const registry = {
    assertType: jest.fn(),
    validateColumns: jest.fn(),
    hasSensitiveColumns: jest.fn(() => false),
    requiresAuditExport: jest.fn(() => false),
  };
  const audit = { logCustom: jest.fn() };
  const storage = { getSignedUrl: jest.fn() };
  const reports = { query: jest.fn() };
  const csv = { generate: jest.fn() };
  const pdf = { generate: jest.fn() };
  const service = new ReportExportService(
    db as never,
    registry as never,
    audit as never,
    reports as never,
    csv as never,
    pdf as never,
    storage as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    registry.hasSensitiveColumns.mockReturnValue(false);
    registry.requiresAuditExport.mockReturnValue(false);
  });

  describe('create', () => {
    it('requires reports.export_sensitive when selected columns are sensitive', async () => {
      registry.hasSensitiveColumns.mockReturnValue(true);
      await expect(
        service.create('admin-1', { reportType: 'PAYMENTS' } as never, []),
      ).rejects.toThrow(ForbiddenException);
    });

    it('requires audit.export for audit-only report types', async () => {
      registry.requiresAuditExport.mockReturnValue(true);
      await expect(
        service.create(
          'admin-1',
          { reportType: 'ADMINISTRATOR_ACTIVITY' } as never,
          [],
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates a queued export, enqueues a background job, and logs the request', async () => {
      const created = { id: 'export-1', status: 'QUEUED', fileStorageKey: 'k' };
      const tx = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([created]),
      };
      db.client.transaction.mockImplementation(
        async (fn: (tx: unknown) => unknown) => fn(tx),
      );
      const result = await service.create(
        'admin-1',
        { reportType: 'PAYMENTS', format: 'CSV' } as never,
        [],
      );
      expect(tx.insert).toHaveBeenCalledTimes(2);
      expect(audit.logCustom).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'report.export.requested',
          entityId: 'export-1',
        }),
      );
      expect(result).not.toHaveProperty('fileStorageKey');
      expect(result.downloadAvailable).toBe(false);
    });

    it('maps a transaction failure (e.g. duplicate deduplication key) to ConflictException', async () => {
      db.client.transaction.mockRejectedValueOnce(
        new Error('unique violation'),
      );
      await expect(
        service.create('admin-1', { reportType: 'PAYMENTS' } as never, []),
      ).rejects.toThrow(ConflictException);
    });
  });

  function selectChain(rows: unknown[], countValue = 0) {
    const rowsChain: Record<string, jest.Mock> = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue(rows),
    };
    db.client.select.mockImplementation((arg?: unknown) =>
      arg
        ? {
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockResolvedValue([{ value: countValue }]),
          }
        : rowsChain,
    );
    return rowsChain;
  }

  describe('list', () => {
    it('returns rows and total count, presenting each row', async () => {
      selectChain([{ id: 'e1', status: 'QUEUED' }], 1);
      const result = await service.list(
        'admin-1',
        { page: 1, pageSize: 20 } as never,
        false,
      );
      expect(result.rows).toEqual([
        { id: 'e1', status: 'QUEUED', downloadAvailable: false },
      ]);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('one / detail', () => {
    it('throws NotFoundException when the export does not exist', async () => {
      db.client.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      await expect(service.one('admin-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when a non-owner requests without "all" access', async () => {
      db.client.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue([{ id: 'e1', requestedBy: 'other-user' }]),
      });
      await expect(service.one('admin-1', 'e1', false)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows the owner, and allows any caller with "all" access', async () => {
      db.client.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue([
            { id: 'e1', requestedBy: 'admin-1', status: 'QUEUED' },
          ]),
      });
      const owned = await service.detail('admin-1', 'e1', false);
      expect(owned.id).toBe('e1');

      db.client.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue([
            { id: 'e1', requestedBy: 'other-user', status: 'QUEUED' },
          ]),
      });
      const viaAll = await service.detail('admin-1', 'e1', true);
      expect(viaAll.id).toBe('e1');
    });
  });

  describe('download', () => {
    function completedRow(overrides: Record<string, unknown> = {}) {
      return {
        id: 'e1',
        requestedBy: 'admin-1',
        status: 'COMPLETED',
        fileStorageKey: 'exports/e1.csv',
        originalFileName: 'report.csv',
        expiresAt: null,
        ...overrides,
      };
    }

    it('rejects a download for an export that is not completed', async () => {
      db.client.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue([completedRow({ status: 'QUEUED' })]),
      });
      await expect(service.download('admin-1', 'e1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects a download for an expired export', async () => {
      db.client.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue([
            completedRow({ expiresAt: new Date(Date.now() - 1000) }),
          ]),
      });
      await expect(service.download('admin-1', 'e1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('returns a signed URL and logs the download for a valid export', async () => {
      db.client.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([completedRow()]),
      });
      storage.getSignedUrl.mockResolvedValue('https://signed.example/e1.csv');
      const result = await service.download('admin-1', 'e1');
      expect(result).toEqual({
        url: 'https://signed.example/e1.csv',
        expiresInSeconds: 300,
        fileName: 'report.csv',
      });
      expect(audit.logCustom).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'report.export.downloaded' }),
      );
    });
  });

  describe('retry', () => {
    it('rejects retrying an export that is not FAILED', async () => {
      db.client.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'e1',
            requestedBy: 'admin-1',
            status: 'QUEUED',
            attemptCount: 0,
            maximumAttempts: 3,
          },
        ]),
      });
      await expect(service.retry('admin-1', 'e1', 'reason')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects retrying an export that exhausted its attempts', async () => {
      db.client.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'e1',
            requestedBy: 'admin-1',
            status: 'FAILED',
            attemptCount: 3,
            maximumAttempts: 3,
          },
        ]),
      });
      await expect(service.retry('admin-1', 'e1', 'reason')).rejects.toThrow(
        ConflictException,
      );
    });

    it('requeues a failed export, enqueues a new job, and logs the retry', async () => {
      db.client.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: 'e1',
            requestedBy: 'admin-1',
            status: 'FAILED',
            attemptCount: 1,
            maximumAttempts: 3,
          },
        ]),
      });
      const tx = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
      };
      db.client.transaction.mockImplementation(
        async (fn: (tx: unknown) => unknown) => fn(tx),
      );
      db.client.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue([
            { id: 'e1', requestedBy: 'admin-1', status: 'QUEUED' },
          ]),
      });
      const result = await service.retry('admin-1', 'e1', 'Retry after outage');
      expect(tx.update).toHaveBeenCalled();
      expect(tx.insert).toHaveBeenCalled();
      expect(audit.logCustom).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'report.export.retried' }),
      );
      expect(result.status).toBe('QUEUED');
    });
  });

  describe('cancel', () => {
    it('rejects cancelling an export that is not queued', async () => {
      db.client.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue([
            { id: 'e1', requestedBy: 'admin-1', status: 'COMPLETED' },
          ]),
      });
      db.client.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([]),
      });
      await expect(service.cancel('admin-1', 'e1', 'reason')).rejects.toThrow(
        ConflictException,
      );
    });

    it('cancels a queued export and logs the cancellation', async () => {
      db.client.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue([
            { id: 'e1', requestedBy: 'admin-1', status: 'QUEUED' },
          ]),
      });
      db.client.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest
          .fn()
          .mockResolvedValue([{ id: 'e1', status: 'CANCELLED' }]),
      });
      const result = await service.cancel('admin-1', 'e1', 'No longer needed');
      expect(result.status).toBe('CANCELLED');
      expect(audit.logCustom).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'report.export.cancelled' }),
      );
    });
  });

  describe('key', () => {
    it('builds a namespaced storage key with the export format as extension', () => {
      const key = service.key('admin-1', 'e1', 'CSV');
      expect(key).toMatch(/^exports\/.+\/admin-1\/e1\/.+\.csv$/);
    });
  });
});
