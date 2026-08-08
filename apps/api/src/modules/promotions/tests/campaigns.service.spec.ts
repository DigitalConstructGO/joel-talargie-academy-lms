import { NotFoundException } from '@nestjs/common';
import { CampaignsService } from '../services/campaigns.service';

describe('CampaignsService', () => {
  const repository = {
    createCampaign: jest.fn(),
    listCampaigns: jest.fn(),
    findCampaign: jest.fn(),
    campaignRules: jest.fn(),
    updateCampaign: jest.fn(),
    archiveCampaign: jest.fn(),
    logUsage: jest.fn(),
  };
  const service = new CampaignsService(repository as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('creates a campaign and logs CAMPAIGN_CREATED (Create Campaign)', async () => {
    repository.createCampaign.mockResolvedValue({
      id: 'c1',
      name: 'Flash Sale',
      type: 'FLASH_SALE',
      discountValue: '15',
      maxDiscountAmount: null,
    });
    const result = await service.create(actor, { name: 'Flash Sale' } as never);
    expect(repository.createCampaign).toHaveBeenCalledWith('admin-1', {
      name: 'Flash Sale',
    });
    expect(repository.logUsage).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CAMPAIGN_CREATED', campaignId: 'c1' }),
    );
    expect(result.discountValue).toBe(15);
  });

  it('presents numeric fields as numbers, not strings', async () => {
    repository.listCampaigns.mockResolvedValue({
      items: [{ id: 'c1', discountValue: '10', maxDiscountAmount: '5' }],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    const result = await service.list({} as never);
    expect(result.items[0]).toMatchObject({
      discountValue: 10,
      maxDiscountAmount: 5,
    });
  });

  it('throws NotFoundException for a missing campaign', async () => {
    repository.findCampaign.mockResolvedValue(undefined);
    await expect(service.get('missing')).rejects.toThrow(NotFoundException);
  });

  it('returns the campaign with attached rules', async () => {
    repository.findCampaign.mockResolvedValue({
      id: 'c1',
      discountValue: '10',
      maxDiscountAmount: null,
    });
    repository.campaignRules.mockResolvedValue({
      courseIds: ['course-1'],
      categoryIds: [],
      userIds: [],
    });
    const result = await service.get('c1');
    expect(result.rules.courseIds).toEqual(['course-1']);
  });

  it('updates a campaign and logs CAMPAIGN_UPDATED', async () => {
    repository.findCampaign.mockResolvedValue({
      id: 'c1',
      discountValue: '10',
      maxDiscountAmount: null,
    });
    repository.campaignRules.mockResolvedValue({
      courseIds: [],
      categoryIds: [],
      userIds: [],
    });
    repository.updateCampaign.mockResolvedValue({
      id: 'c1',
      discountValue: '20',
      maxDiscountAmount: null,
    });
    await service.update(actor, 'c1', { discountValue: 20 } as never);
    expect(repository.logUsage).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CAMPAIGN_UPDATED' }),
    );
  });

  it('rejects updating a campaign that does not exist', async () => {
    repository.findCampaign.mockResolvedValue(undefined);
    await expect(service.update(actor, 'missing', {} as never)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.updateCampaign).not.toHaveBeenCalled();
  });

  it('archives a campaign and logs CAMPAIGN_ARCHIVED', async () => {
    repository.findCampaign.mockResolvedValue({
      id: 'c1',
      discountValue: '10',
      maxDiscountAmount: null,
    });
    repository.campaignRules.mockResolvedValue({
      courseIds: [],
      categoryIds: [],
      userIds: [],
    });
    repository.archiveCampaign.mockResolvedValue({
      id: 'c1',
      status: 'ARCHIVED',
      discountValue: '10',
      maxDiscountAmount: null,
    });
    await service.archive(actor, 'c1');
    expect(repository.logUsage).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CAMPAIGN_ARCHIVED' }),
    );
  });
});
