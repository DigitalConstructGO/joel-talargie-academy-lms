import { NotFoundException } from '@nestjs/common';
import { AdminAuditLogsController } from '../admin-audit-logs.controller';

describe('AdminAuditLogsController', () => {
  const reports = { get: jest.fn() };
  const db = { client: { select: jest.fn() } };
  const privacy = {
    sanitize: jest.fn((v) => v),
    maskIp: jest.fn(() => 'masked-ip'),
  };
  const controller = new AdminAuditLogsController(
    reports as never,
    db as never,
    privacy as never,
  );

  function request(permissions: string[] = []) {
    return { authorization: { permissions } } as never;
  }

  function selectChain(row: unknown) {
    const chain = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(row ? [row] : []),
    };
    db.client.select.mockReturnValue(chain);
    return chain;
  }

  beforeEach(() => jest.clearAllMocks());

  it('lists audit logs and reveals sensitive fields only with audit.read_sensitive', () => {
    controller.list({} as never, request(['audit.read_sensitive']));
    expect(reports.get).toHaveBeenCalledWith(
      'ADMINISTRATOR_ACTIVITY',
      {},
      true,
    );
    controller.list({} as never, request([]));
    expect(reports.get).toHaveBeenCalledWith(
      'ADMINISTRATOR_ACTIVITY',
      {},
      false,
    );
  });

  it('throws NotFoundException for a missing audit log entry', async () => {
    selectChain(undefined);
    await expect(controller.detail('missing', request())).rejects.toThrow(
      NotFoundException,
    );
  });

  it('masks the IP and truncates the user agent for a caller without audit.read_sensitive', async () => {
    selectChain({
      id: 'log-1',
      ipAddress: '203.0.113.5',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36',
      before: null,
      after: null,
    });
    const result = await controller.detail('log-1', request([]));
    expect(result.ipAddress).toBe('masked-ip');
    expect(result.userAgent).toBe('Mozilla/5.0 (Windows');
  });

  it('reveals the real IP and full user agent for a caller with audit.read_sensitive', async () => {
    selectChain({
      id: 'log-1',
      ipAddress: '203.0.113.5',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36',
      before: null,
      after: null,
    });
    const result = await controller.detail(
      'log-1',
      request(['audit.read_sensitive']),
    );
    expect(result.ipAddress).toBe('203.0.113.5');
    expect(result.userAgent).toBe(
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36',
    );
  });
});
