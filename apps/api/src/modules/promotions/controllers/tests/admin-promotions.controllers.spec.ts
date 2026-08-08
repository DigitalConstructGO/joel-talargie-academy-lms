import { AdminAffiliatesController } from '../admin-affiliates.controller';
import { AdminCampaignsController } from '../admin-campaigns.controller';
import { AdminCouponsController } from '../admin-coupons.controller';
import { AdminPromotionAnalyticsController } from '../admin-promotion-analytics.controller';
import { AdminRedemptionsController } from '../admin-redemptions.controller';

describe('AdminCampaignsController', () => {
  const campaigns = {
    create: jest.fn(),
    list: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  };
  const controller = new AdminCampaignsController(campaigns as never);
  const actor = { id: 'admin-1' } as never;

  beforeEach(() => jest.clearAllMocks());

  it('create() delegates to the campaigns service', () => {
    controller.create(actor, { name: 'Sale' } as never);
    expect(campaigns.create).toHaveBeenCalledWith(actor, { name: 'Sale' });
  });

  it('list() delegates to the campaigns service', () => {
    controller.list({ page: 1 } as never);
    expect(campaigns.list).toHaveBeenCalledWith({ page: 1 });
  });

  it('get() delegates to the campaigns service', () => {
    controller.get('campaign-1');
    expect(campaigns.get).toHaveBeenCalledWith('campaign-1');
  });

  it('update() delegates to the campaigns service', () => {
    controller.update(actor, 'campaign-1', { name: 'New' } as never);
    expect(campaigns.update).toHaveBeenCalledWith(actor, 'campaign-1', {
      name: 'New',
    });
  });

  it('archive() delegates to the campaigns service', () => {
    controller.archive(actor, 'campaign-1');
    expect(campaigns.archive).toHaveBeenCalledWith(actor, 'campaign-1');
  });
});

describe('AdminCouponsController', () => {
  const coupons = {
    create: jest.fn(),
    generate: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  };
  const controller = new AdminCouponsController(coupons as never);
  const actor = { id: 'admin-1' } as never;

  beforeEach(() => jest.clearAllMocks());

  it('create() delegates to the coupons service', () => {
    controller.create(actor, { campaignId: 'c1' } as never);
    expect(coupons.create).toHaveBeenCalledWith(actor, { campaignId: 'c1' });
  });

  it('generate() delegates to the coupons service', () => {
    controller.generate(actor, { campaignId: 'c1', count: 10 } as never);
    expect(coupons.generate).toHaveBeenCalledWith(actor, {
      campaignId: 'c1',
      count: 10,
    });
  });

  it('list() delegates to the coupons service', () => {
    controller.list({ page: 1 } as never);
    expect(coupons.list).toHaveBeenCalledWith({ page: 1 });
  });

  it('update() delegates to the coupons service', () => {
    controller.update(actor, 'coupon-1', { status: 'PAUSED' } as never);
    expect(coupons.update).toHaveBeenCalledWith(actor, 'coupon-1', {
      status: 'PAUSED',
    });
  });

  it('archive() delegates to the coupons service', () => {
    controller.archive(actor, 'coupon-1');
    expect(coupons.archive).toHaveBeenCalledWith(actor, 'coupon-1');
  });
});

describe('AdminAffiliatesController', () => {
  const affiliates = {
    create: jest.fn(),
    list: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
  };
  const controller = new AdminAffiliatesController(affiliates as never);
  const actor = { id: 'admin-1' } as never;

  beforeEach(() => jest.clearAllMocks());

  it('create() delegates to the affiliates service', () => {
    controller.create(actor, {
      name: 'Ada',
      email: 'ada@example.com',
    } as never);
    expect(affiliates.create).toHaveBeenCalledWith(actor, {
      name: 'Ada',
      email: 'ada@example.com',
    });
  });

  it('list() delegates to the affiliates service', () => {
    controller.list({ page: 1 } as never);
    expect(affiliates.list).toHaveBeenCalledWith({ page: 1 });
  });

  it('get() delegates to the affiliates service', () => {
    controller.get('affiliate-1');
    expect(affiliates.get).toHaveBeenCalledWith('affiliate-1');
  });

  it('update() delegates to the affiliates service without the actor', () => {
    controller.update('affiliate-1', { status: 'ACTIVE' } as never);
    expect(affiliates.update).toHaveBeenCalledWith('affiliate-1', {
      status: 'ACTIVE',
    });
  });
});

describe('AdminRedemptionsController', () => {
  const approvals = {
    pending: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };
  const controller = new AdminRedemptionsController(approvals as never);
  const actor = { id: 'admin-1' } as never;

  beforeEach(() => jest.clearAllMocks());

  it('pending() delegates to the approval service', () => {
    controller.pending({ page: 1 } as never);
    expect(approvals.pending).toHaveBeenCalledWith({ page: 1 });
  });

  it('approve() delegates to the approval service', () => {
    controller.approve(actor, 'redemption-1');
    expect(approvals.approve).toHaveBeenCalledWith(actor, 'redemption-1');
  });

  it('reject() extracts the reason from the DTO', () => {
    controller.reject(actor, 'redemption-1', {
      reason: 'Not eligible',
    } as never);
    expect(approvals.reject).toHaveBeenCalledWith(
      actor,
      'redemption-1',
      'Not eligible',
    );
  });
});

describe('AdminPromotionAnalyticsController', () => {
  const analytics = { overview: jest.fn() };
  const controller = new AdminPromotionAnalyticsController(analytics as never);

  beforeEach(() => jest.clearAllMocks());

  it('overview() delegates to the analytics service', () => {
    controller.overview({ limit: 5 } as never);
    expect(analytics.overview).toHaveBeenCalledWith({ limit: 5 });
  });
});
