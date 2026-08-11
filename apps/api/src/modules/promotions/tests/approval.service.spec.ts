import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApprovalService } from '../services/approval.service';

describe('ApprovalService', () => {
  const repository = {
    listPendingRedemptions: jest.fn(),
    confirmRedemption: jest.fn(),
    rejectRedemption: jest.fn(),
    logUsage: jest.fn(),
  };
  const service = new ApprovalService(repository as never);
  const admin = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lists redemptions awaiting approval (Scholarship approval queue)', async () => {
    repository.listPendingRedemptions.mockResolvedValue({
      items: [{ id: 'redemption-1' }],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    const result = await service.pending({ page: 1, pageSize: 20 } as never);
    expect(repository.listPendingRedemptions).toHaveBeenCalledWith(1, 20);
    expect(result.items).toHaveLength(1);
  });

  it('approves a pending redemption and logs it', async () => {
    repository.confirmRedemption.mockResolvedValue({
      id: 'redemption-1',
      campaignId: 'campaign-1',
      codeId: 'code-1',
      status: 'CONFIRMED',
    });
    const result = await service.approve(admin, 'redemption-1');
    expect(repository.confirmRedemption).toHaveBeenCalledWith(
      'redemption-1',
      'admin-1',
    );
    expect(repository.logUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'COUPON_REDEEMED',
        metadata: expect.objectContaining({ approved: true }),
      }),
    );
    expect(result.status).toBe('CONFIRMED');
  });

  it('maps a missing redemption to NotFoundException on approve', async () => {
    repository.confirmRedemption.mockRejectedValue(
      new Error('REDEMPTION_NOT_FOUND'),
    );
    await expect(service.approve(admin, 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('maps an already-decided redemption to ConflictException on approve', async () => {
    repository.confirmRedemption.mockRejectedValue(
      new Error('REDEMPTION_NOT_PENDING'),
    );
    await expect(service.approve(admin, 'redemption-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects a pending redemption with a reason and logs it', async () => {
    repository.rejectRedemption.mockResolvedValue({
      id: 'redemption-1',
      campaignId: 'campaign-1',
      codeId: null,
      status: 'CANCELLED',
    });
    const result = await service.reject(
      admin,
      'redemption-1',
      'Ineligible income bracket',
    );
    expect(repository.rejectRedemption).toHaveBeenCalledWith(
      'redemption-1',
      'admin-1',
      'Ineligible income bracket',
    );
    expect(result.status).toBe('CANCELLED');
  });

  it('maps a missing redemption to NotFoundException on reject', async () => {
    repository.rejectRedemption.mockRejectedValue(
      new Error('REDEMPTION_NOT_FOUND'),
    );
    await expect(service.reject(admin, 'missing', 'reason')).rejects.toThrow(
      NotFoundException,
    );
  });
});
