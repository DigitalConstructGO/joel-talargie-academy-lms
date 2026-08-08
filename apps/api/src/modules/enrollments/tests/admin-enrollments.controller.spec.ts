import { AdminEnrollmentsController } from '../controllers/admin-enrollments.controller';

describe('AdminEnrollmentsController', () => {
  const enrollments = {
    adminList: jest.fn(),
    activity: jest.fn(),
    adminDetail: jest.fn(),
    cancel: jest.fn(),
    revoke: jest.fn(),
  };
  const controller = new AdminEnrollmentsController(enrollments as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lists enrollments', () => {
    controller.list({} as never);
    expect(enrollments.adminList).toHaveBeenCalledWith({});
  });

  it('lists enrollment activity', () => {
    controller.activity('enrollment-1', {} as never);
    expect(enrollments.activity).toHaveBeenCalledWith('enrollment-1', {});
  });

  it('gets enrollment detail', () => {
    controller.detail('enrollment-1');
    expect(enrollments.adminDetail).toHaveBeenCalledWith('enrollment-1');
  });

  it('cancels an enrollment with the acting admin and reason', () => {
    controller.cancel(actor, 'enrollment-1', { reason: 'Duplicate' } as never);
    expect(enrollments.cancel).toHaveBeenCalledWith(
      'admin-1',
      'enrollment-1',
      'Duplicate',
    );
  });

  it('revokes access with the acting admin and reason', () => {
    controller.revoke(actor, 'enrollment-1', {
      reason: 'Policy violation',
    } as never);
    expect(enrollments.revoke).toHaveBeenCalledWith(
      'admin-1',
      'enrollment-1',
      'Policy violation',
    );
  });
});
