import { StudentPaymentsController } from '../controllers/student-payments.controller';

describe('StudentPaymentsController', () => {
  const payments = {
    instructions: jest.fn(),
    submit: jest.fn(),
    enrollmentPayments: jest.fn(),
    mine: jest.fn(),
    mineReceipt: jest.fn(),
    mineDetail: jest.fn(),
  };
  const controller = new StudentPaymentsController(payments as never);
  const user = { id: 'student-1', roles: ['STUDENT'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('gets payment instructions scoped to the caller', () => {
    controller.instructions(user, 'enrollment-1');
    expect(payments.instructions).toHaveBeenCalledWith(user, 'enrollment-1');
  });

  it('submits a receipt with the uploaded file', () => {
    const file = { originalname: 'r.png' } as never;
    controller.submit(
      user,
      'enrollment-1',
      { transactionId: 'TX1' } as never,
      file,
    );
    expect(payments.submit).toHaveBeenCalledWith(
      user,
      'enrollment-1',
      { transactionId: 'TX1' },
      file,
    );
  });

  it('submits without a file (service enforces receipt is required)', () => {
    controller.submit(user, 'enrollment-1', {} as never, undefined);
    expect(payments.submit).toHaveBeenCalledWith(
      user,
      'enrollment-1',
      {},
      undefined,
    );
  });

  it('lists payments for one owned enrollment', () => {
    controller.enrollmentPayments(user, 'enrollment-1', {} as never);
    expect(payments.enrollmentPayments).toHaveBeenCalledWith(
      'student-1',
      'enrollment-1',
      {},
    );
  });

  it('lists the caller’s own payment history', () => {
    controller.mine(user, {} as never);
    expect(payments.mine).toHaveBeenCalledWith('student-1', {});
  });

  it('gets a short-lived receipt URL scoped to the caller', () => {
    controller.receipt(user, 'payment-1');
    expect(payments.mineReceipt).toHaveBeenCalledWith('student-1', 'payment-1');
  });

  it('gets one owned payment attempt', () => {
    controller.detail(user, 'payment-1');
    expect(payments.mineDetail).toHaveBeenCalledWith('student-1', 'payment-1');
  });
});
