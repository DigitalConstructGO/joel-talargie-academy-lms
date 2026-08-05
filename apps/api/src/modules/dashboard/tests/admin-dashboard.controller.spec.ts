import { AdminDashboardController } from '../controllers/admin-dashboard.controller';

describe('AdminDashboardController', () => {
  const dashboard = {
    overview: jest.fn(),
    kpis: jest.fn(),
    trend: jest.fn(),
    pendingPayments: jest.fn(),
    recentStudents: jest.fn(),
    recentEnrollments: jest.fn(),
    recentCompletions: jest.fn(),
    recentCertificates: jest.fn(),
    coursePerformance: jest.fn(),
    lowCompletion: jest.fn(),
    distribution: jest.fn(),
    recentActivity: jest.fn(),
    health: jest.fn(),
  };
  const controller = new AdminDashboardController(dashboard as never);

  function request(permissions: string[] = []) {
    return { authorization: { permissions } } as never;
  }

  beforeEach(() => jest.clearAllMocks());

  it('extracts the authorization-context permissions for overview and kpis', () => {
    controller.overview({} as never, request(['dashboard.read']));
    expect(dashboard.overview).toHaveBeenCalledWith({}, ['dashboard.read']);
    controller.kpis({} as never, request(['dashboard.read']));
    expect(dashboard.kpis).toHaveBeenCalledWith({}, ['dashboard.read']);
  });

  it('defaults to an empty permission list when the request has no authorization context', () => {
    controller.overview({} as never, {} as never);
    expect(dashboard.overview).toHaveBeenCalledWith({}, []);
  });

  it('routes each trend endpoint to its named metric', () => {
    controller.registrations({} as never);
    expect(dashboard.trend).toHaveBeenCalledWith('registrations', {});
    controller.enrollments({} as never);
    expect(dashboard.trend).toHaveBeenCalledWith('enrollments', {});
    controller.payments({} as never);
    expect(dashboard.trend).toHaveBeenCalledWith('payments', {});
    controller.revenue({} as never);
    expect(dashboard.trend).toHaveBeenCalledWith('revenue', {});
    controller.completions({} as never);
    expect(dashboard.trend).toHaveBeenCalledWith('completions', {});
    controller.certificates({} as never);
    expect(dashboard.trend).toHaveBeenCalledWith('certificates', {});
  });

  it('gates pending-payments financial detail on dashboard.read_financial', () => {
    controller.pendingPayments(
      { limit: 5 } as never,
      request(['dashboard.read_financial']),
    );
    expect(dashboard.pendingPayments).toHaveBeenCalledWith(5, true);
    controller.pendingPayments({ limit: 5 } as never, request([]));
    expect(dashboard.pendingPayments).toHaveBeenCalledWith(5, false);
  });

  it('gates recent-students sensitive detail on dashboard.read_sensitive', () => {
    controller.recentStudents(
      { limit: 5 } as never,
      request(['dashboard.read_sensitive']),
    );
    expect(dashboard.recentStudents).toHaveBeenCalledWith(5, true);
    controller.recentStudents({ limit: 5 } as never, request([]));
    expect(dashboard.recentStudents).toHaveBeenCalledWith(5, false);
  });

  it('gates recent-enrollments and course-performance financial detail on dashboard.read_financial', () => {
    controller.recentEnrollments(
      { limit: 5 } as never,
      request(['dashboard.read_financial']),
    );
    expect(dashboard.recentEnrollments).toHaveBeenCalledWith(5, true);
    controller.coursePerformance(
      {} as never,
      request(['dashboard.read_financial']),
    );
    expect(dashboard.coursePerformance).toHaveBeenCalledWith({}, true);
    controller.topCourses({} as never, request([]));
    expect(dashboard.coursePerformance).toHaveBeenCalledWith({}, false);
  });

  it('delegates simple limit-scoped and filter-scoped endpoints', () => {
    controller.recentCompletions({ limit: 3 } as never);
    expect(dashboard.recentCompletions).toHaveBeenCalledWith(3);
    controller.recentCertificates({ limit: 3 } as never);
    expect(dashboard.recentCertificates).toHaveBeenCalledWith(3);
    controller.lowCompletion({} as never);
    expect(dashboard.lowCompletion).toHaveBeenCalledWith({});
    controller.distribution({} as never);
    expect(dashboard.distribution).toHaveBeenCalledWith({});
  });

  it('gates recent-activity sensitive detail on dashboard.read_sensitive', () => {
    controller.recentActivity(
      { limit: 5 } as never,
      request(['dashboard.read_sensitive']),
    );
    expect(dashboard.recentActivity).toHaveBeenCalledWith(5, true);
    controller.recentActivity({ limit: 5 } as never, request([]));
    expect(dashboard.recentActivity).toHaveBeenCalledWith(5, false);
  });

  it('reports operational health with no arguments', () => {
    controller.health();
    expect(dashboard.health).toHaveBeenCalledWith();
  });
});
