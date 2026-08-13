import { ConflictException, NotFoundException } from '@nestjs/common';
import { CouponsService } from '../services/coupons.service';

describe('CouponsService', () => {
  const repository = {
    codeExists: jest.fn(),
    createCode: jest.fn(),
    listCodes: jest.fn(),
    findCode: jest.fn(),
    findCodeWithRules: jest.fn(),
    listCodeRedemptions: jest.fn(),
    updateCode: jest.fn(),
    archiveCode: jest.fn(),
    logUsage: jest.fn(),
  };
  const service = new CouponsService(repository as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('normalizes and claims a manual code, rejecting a taken one', async () => {
    repository.codeExists.mockResolvedValue(true);
    await expect(
      service.create(actor, { code: ' save20 ' } as never),
    ).rejects.toThrow(ConflictException);
  });

  it('creates a coupon with an auto-generated code when none is supplied (Generate Coupons)', async () => {
    repository.codeExists.mockResolvedValue(false);
    repository.createCode.mockResolvedValue({
      id: 'code-1',
      code: 'ABCD1234',
    });
    const result = await service.create(actor, {} as never);
    expect(result.code).toBe('ABCD1234');
    expect(repository.createCode).toHaveBeenCalledWith(
      'admin-1',
      expect.objectContaining({ code: expect.any(String) }),
    );
    expect(repository.logUsage).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'COUPON_GENERATED', codeId: 'code-1' }),
    );
  });

  it('retries generation on a codeExists collision until it finds a free code', async () => {
    repository.codeExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    repository.createCode.mockResolvedValue({
      id: 'code-1',
      code: 'FREE1234',
    });
    await service.create(actor, {} as never);
    expect(repository.codeExists).toHaveBeenCalledTimes(3);
  });

  it('throws NotFoundException fetching a missing coupon', async () => {
    repository.findCode.mockResolvedValue(undefined);
    await expect(service.get('missing')).rejects.toThrow(NotFoundException);
  });

  it('archives a coupon and logs COUPON_ARCHIVED', async () => {
    repository.findCode.mockResolvedValue({ id: 'code-1' });
    repository.archiveCode.mockResolvedValue({
      id: 'code-1',
      status: 'REVOKED',
    });
    await service.archive(actor, 'code-1');
    expect(repository.logUsage).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'COUPON_ARCHIVED', codeId: 'code-1' }),
    );
  });

  describe('detail', () => {
    const now = Date.now();

    function found(overrides: {
      code?: Partial<{ status: string; validFrom: Date | null; validUntil: Date | null }>;
      rules?: { courseIds: string[]; categoryIds: string[]; userIds: string[] };
    }) {
      return {
        code: {
          id: 'code-1',
          status: 'ACTIVE',
          validFrom: null,
          validUntil: null,
          ...overrides.code,
        },
        rules: overrides.rules ?? {
          courseIds: [],
          categoryIds: [],
          userIds: [],
        },
      };
    }

    it('throws NotFoundException for a missing coupon', async () => {
      repository.findCodeWithRules.mockResolvedValue(null);
      await expect(service.detail('missing')).rejects.toThrow(NotFoundException);
    });

    it('reports ACTIVE for an in-window active code', async () => {
      repository.findCodeWithRules.mockResolvedValue(found({}));
      const result = await service.detail('code-1');
      expect(result.validityStatus).toBe('ACTIVE');
      expect(result.rules).toEqual({ courseIds: [], categoryIds: [], userIds: [] });
    });

    it('reports NOT_STARTED before the code window begins', async () => {
      repository.findCodeWithRules.mockResolvedValue(
        found({ code: { validFrom: new Date(now + 3_600_000) } }),
      );
      const result = await service.detail('code-1');
      expect(result.validityStatus).toBe('NOT_STARTED');
    });

    it('reports EXPIRED after the code window ends', async () => {
      repository.findCodeWithRules.mockResolvedValue(
        found({ code: { validUntil: new Date(now - 3_600_000) } }),
      );
      const result = await service.detail('code-1');
      expect(result.validityStatus).toBe('EXPIRED');
    });

    it('reports INACTIVE when the code itself is paused', async () => {
      repository.findCodeWithRules.mockResolvedValue(
        found({ code: { status: 'PAUSED' } }),
      );
      const result = await service.detail('code-1');
      expect(result.validityStatus).toBe('INACTIVE');
    });

    it('reports REVOKED for a revoked code', async () => {
      repository.findCodeWithRules.mockResolvedValue(
        found({ code: { status: 'REVOKED' } }),
      );
      const result = await service.detail('code-1');
      expect(result.validityStatus).toBe('REVOKED');
    });
  });

  describe('redemptions', () => {
    it('throws NotFoundException for a missing coupon', async () => {
      repository.findCode.mockResolvedValue(undefined);
      await expect(service.redemptions('missing', {} as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns paginated redemption history for an existing coupon', async () => {
      repository.findCode.mockResolvedValue({ id: 'code-1' });
      const history = {
        items: [
          {
            id: 'red-1',
            status: 'CONFIRMED',
            studentEmail: 'student@example.com',
            finalPrice: '80',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      repository.listCodeRedemptions.mockResolvedValue(history);
      const result = await service.redemptions('code-1', { page: 1, pageSize: 20 });
      expect(result).toEqual(history);
      expect(repository.listCodeRedemptions).toHaveBeenCalledWith('code-1', {
        page: 1,
        pageSize: 20,
      });
    });
  });
});
