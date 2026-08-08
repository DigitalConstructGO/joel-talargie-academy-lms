import { ConflictException, NotFoundException } from '@nestjs/common';
import { CouponsService } from '../services/coupons.service';

describe('CouponsService', () => {
  const repository = {
    findCampaign: jest.fn(),
    codeExists: jest.fn(),
    createCode: jest.fn(),
    bulkCreateCodes: jest.fn(),
    listCodes: jest.fn(),
    findCode: jest.fn(),
    updateCode: jest.fn(),
    archiveCode: jest.fn(),
    logUsage: jest.fn(),
  };
  const service = new CouponsService(repository as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('rejects creating a coupon for a missing campaign', async () => {
    repository.findCampaign.mockResolvedValue(undefined);
    await expect(
      service.create(actor, { campaignId: 'missing' } as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('normalizes and claims a manual code, rejecting a taken one', async () => {
    repository.findCampaign.mockResolvedValue({ id: 'c1' });
    repository.codeExists.mockResolvedValue(true);
    await expect(
      service.create(actor, { campaignId: 'c1', code: ' save20 ' } as never),
    ).rejects.toThrow(ConflictException);
  });

  it('creates a coupon with an auto-generated code when none is supplied (Generate Coupons)', async () => {
    repository.findCampaign.mockResolvedValue({ id: 'c1' });
    repository.codeExists.mockResolvedValue(false);
    repository.createCode.mockResolvedValue({
      id: 'code-1',
      campaignId: 'c1',
      code: 'ABCD1234',
    });
    const result = await service.create(actor, { campaignId: 'c1' } as never);
    expect(result.code).toBe('ABCD1234');
    expect(repository.logUsage).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'COUPON_GENERATED', codeId: 'code-1' }),
    );
  });

  it('retries generation on a codeExists collision until it finds a free code', async () => {
    repository.findCampaign.mockResolvedValue({ id: 'c1' });
    repository.codeExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    repository.createCode.mockResolvedValue({
      id: 'code-1',
      campaignId: 'c1',
      code: 'FREE1234',
    });
    await service.create(actor, { campaignId: 'c1' } as never);
    expect(repository.codeExists).toHaveBeenCalledTimes(3);
  });

  it('bulk-generates unique codes for a campaign (Generate Coupons)', async () => {
    repository.findCampaign.mockResolvedValue({ id: 'c1' });
    repository.codeExists.mockResolvedValue(false);
    repository.bulkCreateCodes.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({
        id: `code-${i}`,
        campaignId: 'c1',
      })),
    );
    const result = await service.generate(actor, {
      campaignId: 'c1',
      count: 20,
    } as never);
    expect(result).toHaveLength(20);
    expect(repository.bulkCreateCodes).toHaveBeenCalledWith(
      'admin-1',
      'c1',
      expect.arrayContaining([expect.any(String)]),
      expect.anything(),
    );
  });

  it('throws NotFoundException fetching a missing coupon', async () => {
    repository.findCode.mockResolvedValue(undefined);
    await expect(service.get('missing')).rejects.toThrow(NotFoundException);
  });

  it('archives a coupon and logs COUPON_ARCHIVED', async () => {
    repository.findCode.mockResolvedValue({ id: 'code-1', campaignId: 'c1' });
    repository.archiveCode.mockResolvedValue({
      id: 'code-1',
      status: 'REVOKED',
    });
    await service.archive(actor, 'code-1');
    expect(repository.logUsage).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'COUPON_ARCHIVED', codeId: 'code-1' }),
    );
  });
});
