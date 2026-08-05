import { AdminPaymentsController } from '../controllers/admin-payments.controller';

describe('AdminPaymentsController', () => {
  const payments = {
    adminList: jest.fn(),
    adminReceipt: jest.fn(),
    duplicates: jest.fn(),
    approve: jest.fn(),
    decline: jest.fn(),
    activity: jest.fn(),
    adminDetail: jest.fn(),
  };
  const controller = new AdminPaymentsController(payments as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lists payments', () => {
    controller.list({} as never);
    expect(payments.adminList).toHaveBeenCalledWith({});
  });

  it('gets a short-lived receipt URL', () => {
    controller.receipt('payment-1');
    expect(payments.adminReceipt).toHaveBeenCalledWith('payment-1');
  });

  it('checks for duplicate transaction references', () => {
    controller.duplicates('payment-1');
    expect(payments.duplicates).toHaveBeenCalledWith('payment-1');
  });

  it('approves a payment with the acting admin id', () => {
    controller.approve(actor, 'payment-1', { reviewNote: 'ok' } as never);
    expect(payments.approve).toHaveBeenCalledWith('admin-1', 'payment-1', {
      reviewNote: 'ok',
    });
  });

  it('declines a payment with the acting admin id', () => {
    controller.decline(actor, 'payment-1', { reason: 'Illegible' } as never);
    expect(payments.decline).toHaveBeenCalledWith('admin-1', 'payment-1', {
      reason: 'Illegible',
    });
  });

  it('lists payment activity', () => {
    controller.activity('payment-1', {} as never);
    expect(payments.activity).toHaveBeenCalledWith('payment-1', {});
  });

  it('gets payment detail', () => {
    controller.detail('payment-1');
    expect(payments.adminDetail).toHaveBeenCalledWith('payment-1');
  });
});
