import { AdminReportsController } from '../controllers/admin-reports.controller';

describe('AdminReportsController', () => {
  const reports = { get: jest.fn() };
  const controller = new AdminReportsController(reports as never);

  function request(permissions: string[] = []) {
    return { authorization: { permissions } } as never;
  }

  beforeEach(() => jest.clearAllMocks());

  it('routes each report endpoint to its report type and gates sensitive fields on reports.read_sensitive', () => {
    const cases: Array<[keyof AdminReportsController, string]> = [
      ['registrations', 'USER_REGISTRATIONS'],
      ['statuses', 'USER_ACCOUNT_STATUS'],
      ['enrollments', 'COURSE_ENROLLMENTS'],
      ['participation', 'COURSE_PARTICIPATION'],
      ['learning', 'LEARNING_PROGRESS'],
      ['completions', 'COURSE_COMPLETIONS'],
      ['payments', 'PAYMENTS'],
      ['revenue', 'REVENUE'],
      ['reviews', 'PAYMENT_REVIEW_PERFORMANCE'],
      ['certificates', 'CERTIFICATES'],
      ['generation', 'CERTIFICATE_GENERATION'],
      ['activity', 'ADMINISTRATOR_ACTIVITY'],
      ['security', 'AUTHENTICATION_SECURITY_EVENTS'],
    ];
    for (const [method, type] of cases) {
      reports.get.mockClear();
      (controller[method] as (q: unknown, r: unknown) => unknown)(
        { page: 1 },
        request(['reports.read_sensitive']),
      );
      expect(reports.get).toHaveBeenCalledWith(type, { page: 1 }, true);
    }
  });

  it('masks sensitive fields when the caller lacks reports.read_sensitive', () => {
    controller.registrations({} as never, request([]));
    expect(reports.get).toHaveBeenCalledWith('USER_REGISTRATIONS', {}, false);
  });
});
