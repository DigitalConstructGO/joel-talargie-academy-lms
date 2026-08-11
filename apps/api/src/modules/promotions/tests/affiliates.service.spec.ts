import { NotFoundException } from '@nestjs/common';
import { AffiliatesService } from '../services/affiliates.service';

describe('AffiliatesService', () => {
  const repository = {
    createAffiliate: jest.fn(),
    listAffiliates: jest.fn(),
    findAffiliate: jest.fn(),
    updateAffiliate: jest.fn(),
  };
  const service = new AffiliatesService(repository as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('creates an affiliate profile', async () => {
    repository.createAffiliate.mockResolvedValue({
      id: 'affiliate-1',
      name: 'Acme Partners',
    });
    const result = await service.create(actor, {
      name: 'Acme Partners',
      email: 'partners@acme.com',
    } as never);
    expect(result.id).toBe('affiliate-1');
  });

  it('throws NotFoundException for a missing affiliate', async () => {
    repository.findAffiliate.mockResolvedValue(undefined);
    await expect(service.get('missing')).rejects.toThrow(NotFoundException);
  });

  it('rejects updating an affiliate that does not exist', async () => {
    repository.findAffiliate.mockResolvedValue(undefined);
    await expect(service.update('missing', {} as never)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.updateAffiliate).not.toHaveBeenCalled();
  });

  it('updates an existing affiliate (status change)', async () => {
    repository.findAffiliate.mockResolvedValue({ id: 'affiliate-1' });
    repository.updateAffiliate.mockResolvedValue({
      id: 'affiliate-1',
      status: 'ACTIVE',
    });
    const result = await service.update('affiliate-1', {
      status: 'ACTIVE',
    } as never);
    expect(result.status).toBe('ACTIVE');
  });
});
