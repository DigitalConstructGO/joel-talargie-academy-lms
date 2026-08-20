import { AdminDashboardController } from '../controllers/admin-dashboard.controller';

describe('AdminDashboardController', () => {
  const dashboard = {
    overview: jest.fn(),
    kpis: jest.fn(),
    filterOptions: jest.fn(),
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

  function request(
    permissions: string[] = [],
    roles: string[] = ['ADMINISTRATOR'],
    userId = 'user-1',
  ) {
    return {
      authorization: {
        userId,
        status: 'ACTIVE',
        roles,
        permissions,
        isAdministrator: roles.includes('ADMINISTRATOR'),
      },
    } as never;
  }

  beforeEach(() => jest.clearAllMocks());

  it('extracts the authorization-context for overview and kpis', () => {
    controller.overview({} as never, request(['dashboard.read']));
    expect(dashboard.overview).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ permissions: ['dashboard.read'] }),
    );
    controller.kpis({} as never, request(['dashboard.read']));
    expect(dashboard.kpis).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ permissions: ['dashboard.read'] }),
    );
  });

  it('delegates filterOptions with caller authorization context', () => {
    controller.filterOptions(request(['dashboard.read']));
    expect(dashboard.filterOptions).toHaveBeenCalledWith(
      expect.objectContaining({ permissions: ['dashboard.read'] }),
    );
  });

  it('routes each trend endpoint to its named metric with auth context', () => {
    const req = request(['dashboard.read', 'dashboard.read_financial']);
    controller.registrations({} as never, req);
    expect(dashboard.trend).toHaveBeenCalledWith(
      'registrations',
      {},
      expect.objectContaining({
        permissions: ['dashboard.read', 'dashboard.read_financial'],
      }),
    );
    controller.enrollments({} as never, req);
    expect(dashboard.trend).toHaveBeenCalledWith(
      'enrollments',
      {},
      expect.objectContaining({
        permissions: ['dashboard.read', 'dashboard.read_financial'],
      }),
    );
    controller.payments({} as never, req);
    expect(dashboard.trend).toHaveBeenCalledWith(
      'payments',
      {},
      expect.objectContaining({
        permissions: ['dashboard.read', 'dashboard.read_financial'],
      }),
    );
    controller.revenue({} as never, req);
    expect(dashboard.trend).toHaveBeenCalledWith(
      'revenue',
      {},
      expect.objectContaining({
        permissions: ['dashboard.read', 'dashboard.read_financial'],
      }),
    );
    controller.completions({} as never, req);
    expect(dashboard.trend).toHaveBeenCalledWith(
      'completions',
      {},
      expect.objectContaining({
        permissions: ['dashboard.read', 'dashboard.read_financial'],
      }),
    );
    controller.certificates({} as never, req);
    expect(dashboard.trend).toHaveBeenCalledWith(
      'certificates',
      {},
      expect.objectContaining({
        permissions: ['dashboard.read', 'dashboard.read_financial'],
      }),
    );
  });

  it('gates pending-payments financial detail on dashboard.read_financial', () => {
    controller.pendingPayments(
      { limit: 5 } as never,
      request(['dashboard.read_financial']),
    );
    expect(dashboard.pendingPayments).toHaveBeenCalledWith(
      5,
      true,
      expect.objectContaining({ permissions: ['dashboard.read_financial'] }),
    );
    controller.pendingPayments({ limit: 5 } as never, request([]));
    expect(dashboard.pendingPayments).toHaveBeenCalledWith(
      5,
      false,
      expect.objectContaining({ permissions: [] }),
    );
  });

  it('gates recent-students sensitive detail on dashboard.read_sensitive', () => {
    controller.recentStudents(
      { limit: 5 } as never,
      request(['dashboard.read_sensitive']),
    );
    expect(dashboard.recentStudents).toHaveBeenCalledWith(
      5,
      true,
      expect.objectContaining({ permissions: ['dashboard.read_sensitive'] }),
    );
    controller.recentStudents({ limit: 5 } as never, request([]));
    expect(dashboard.recentStudents).toHaveBeenCalledWith(
      5,
      false,
      expect.objectContaining({ permissions: [] }),
    );
  });

  it('gates recent-enrollments and course-performance financial detail on dashboard.read_financial', () => {
    controller.recentEnrollments(
      { limit: 5 } as never,
      request(['dashboard.read_financial']),
    );
    expect(dashboard.recentEnrollments).toHaveBeenCalledWith(
      5,
      true,
      expect.objectContaining({ permissions: ['dashboard.read_financial'] }),
    );
    controller.coursePerformance(
      {} as never,
      request(['dashboard.read_financial']),
    );
    expect(dashboard.coursePerformance).toHaveBeenCalledWith(
      {},
      true,
      expect.objectContaining({ permissions: ['dashboard.read_financial'] }),
    );
    controller.topCourses({} as never, request([]));
    expect(dashboard.coursePerformance).toHaveBeenCalledWith(
      {},
      false,
      expect.objectContaining({ permissions: [] }),
    );
  });

  it('delegates scoped endpoints', () => {
    const req = request(['dashboard.read']);
    controller.recentCompletions({ limit: 3 } as never, req);
    expect(dashboard.recentCompletions).toHaveBeenCalledWith(
      3,
      expect.any(Object),
    );
    controller.recentCertificates({ limit: 3 } as never, req);
    expect(dashboard.recentCertificates).toHaveBeenCalledWith(
      3,
      expect.any(Object),
    );
    controller.lowCompletion({} as never, req);
    expect(dashboard.lowCompletion).toHaveBeenCalledWith(
      {},
      expect.any(Object),
    );
    controller.distribution({} as never, req);
    expect(dashboard.distribution).toHaveBeenCalledWith({}, expect.any(Object));
  });

  it('reports operational health with no arguments', () => {
    controller.health();
    expect(dashboard.health).toHaveBeenCalledWith();
  });
});
