import { AdminAffiliatesController } from '../admin-affiliates.controller';
import { AdminCouponsController } from '../admin-coupons.controller';
import { AdminPromotionAnalyticsController } from '../admin-promotion-analytics.controller';

describe('AdminCouponsController', () => {
  const coupons = {
    create: jest.fn(),
    list: jest.fn(),
    detail: jest.fn(),
    redemptions: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  };
  const controller = new AdminCouponsController(coupons as never);
  const actor = { id: 'admin-1' } as never;

  beforeEach(() => jest.clearAllMocks());

  it('create() delegates to the coupons service', () => {
    controller.create(actor, { discountType: 'PERCENTAGE' } as never);
    expect(coupons.create).toHaveBeenCalledWith(actor, {
      discountType: 'PERCENTAGE',
    });
  });

  it('list() delegates to the coupons service', () => {
    controller.list({ page: 1 } as never);
    expect(coupons.list).toHaveBeenCalledWith({ page: 1 });
  });

  it('detail() delegates to the coupons service', () => {
    controller.detail('coupon-1');
    expect(coupons.detail).toHaveBeenCalledWith('coupon-1');
  });

  it('redemptions() delegates to the coupons service', () => {
    controller.redemptions('coupon-1', { page: 1 } as never);
    expect(coupons.redemptions).toHaveBeenCalledWith('coupon-1', { page: 1 });
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

describe('AdminPromotionAnalyticsController', () => {
  const analytics = { overview: jest.fn() };
  const controller = new AdminPromotionAnalyticsController(analytics as never);

  beforeEach(() => jest.clearAllMocks());

  it('overview() delegates to the analytics service', () => {
    controller.overview({ limit: 5 } as never);
    expect(analytics.overview).toHaveBeenCalledWith({ limit: 5 });
  });
});
