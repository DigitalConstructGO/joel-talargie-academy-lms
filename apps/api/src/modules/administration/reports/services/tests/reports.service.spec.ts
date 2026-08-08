import { BadRequestException } from '@nestjs/common';
import { ReportsService } from '../reports.service';

describe('ReportsService', () => {
  const repository = { query: jest.fn() };
  const privacy = {
    maskEmail: jest.fn(() => 'm***@x.com'),
    maskIp: jest.fn(() => '203.0.*.*'),
    sanitize: jest.fn((v) => v),
  };
  const service = new ReportsService(repository as never, privacy as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects a range where "from" is after "to"', async () => {
    await expect(
      service.get(
        'PAYMENTS',
        { from: '2026-08-05', to: '2026-01-01' } as never,
        false,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(repository.query).not.toHaveBeenCalled();
  });

  it('masks email/ip, sanitizes before/after, and strips reviewNote without the sensitive flag', async () => {
    repository.query.mockResolvedValueOnce({
      rows: [
        {
          email: 'a@b.com',
          ipAddress: '203.0.113.5',
          before: { password: 'x' },
          after: { password: 'y' },
          reviewNote: 'secret note',
        },
      ],
      summary: { count: 1 },
      total: 1,
    });
    const result = await service.get(
      'PAYMENTS',
      { page: 1, pageSize: 20 } as never,
      false,
    );
    expect(result.rows[0].email).toBe('m***@x.com');
    expect(result.rows[0].ipAddress).toBe('203.0.*.*');
    expect(result.rows[0]).not.toHaveProperty('reviewNote');
    expect(privacy.sanitize).toHaveBeenCalledWith({ password: 'x' });
    expect(result.meta.total).toBe(1);
    expect(result.meta.timezone).toBe('UTC');
  });

  it('preserves email/ip/reviewNote for a sensitive caller', async () => {
    repository.query.mockResolvedValueOnce({
      rows: [
        {
          email: 'a@b.com',
          ipAddress: '203.0.113.5',
          reviewNote: 'secret note',
        },
      ],
      summary: {},
      total: 1,
    });
    const result = await service.get(
      'PAYMENTS',
      { page: 1, pageSize: 20 } as never,
      true,
    );
    expect(result.rows[0].email).toBe('a@b.com');
    expect(result.rows[0].ipAddress).toBe('203.0.113.5');
    expect(result.rows[0].reviewNote).toBe('secret note');
    expect(privacy.maskEmail).not.toHaveBeenCalled();
  });

  it('leaves rows untouched when they have no email/ip/before/after fields', async () => {
    repository.query.mockResolvedValueOnce({
      rows: [{ id: '1' }],
      summary: {},
      total: 1,
    });
    const result = await service.get(
      'PAYMENTS',
      { page: 1, pageSize: 20 } as never,
      false,
    );
    expect(result.rows[0]).toEqual({ id: '1' });
  });
});
