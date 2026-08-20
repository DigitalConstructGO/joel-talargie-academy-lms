import { ForbiddenException } from '@nestjs/common';
import {
  DashboardService,
  type AuthorizationContext,
} from '../dashboard.service';
import type { DashboardRange } from '../dashboard-date-range.service';

describe('DashboardService', () => {
  const database = { client: { execute: jest.fn() } };
  const range: DashboardRange = {
    preset: 'LAST_30_DAYS',
    from: new Date('2026-07-06T00:00:00.000Z'),
    to: new Date('2026-08-05T00:00:00.000Z'),
    timezone: 'Africa/Addis_Ababa',
    previous: null,
  };
  const dates = { resolve: jest.fn(() => range) };
  const privacy = {
    maskEmail: jest.fn(() => 'm***@x.com'),
    maskIp: jest.fn(() => '203.0.*.*'),
  };
  const service = new DashboardService(
    database as never,
    dates as never,
    privacy as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    dates.resolve.mockReturnValue(range);
  });

  function rows(data: Record<string, unknown>[]) {
    database.client.execute.mockResolvedValueOnce({ rows: data });
  }

  const adminAuth: AuthorizationContext = {
    userId: 'admin-1',
    status: 'ACTIVE',
    roles: ['ADMINISTRATOR'],
    permissions: [
      'dashboard.read',
      'dashboard.read_financial',
      'dashboard.read_sensitive',
      'users.read',
      'courses.read',
      'certificates.read',
    ],
    isAdministrator: true,
  };

  const instructorAuth: AuthorizationContext = {
    userId: 'inst-1',
    status: 'ACTIVE',
    roles: ['INSTRUCTOR'],
    permissions: ['dashboard.read', 'courses.read', 'certificates.read'],
    isAdministrator: false,
  };

  const studentAuth: AuthorizationContext = {
    userId: 'stud-1',
    status: 'ACTIVE',
    roles: ['STUDENT'],
    permissions: ['dashboard.read'],
    isAdministrator: false,
  };

  describe('resolveScope & security checks', () => {
    it('resolves GLOBAL scope for Administrator', async () => {
      const scope = await service.resolveScope(adminAuth);
      expect(scope.type).toBe('GLOBAL');
      expect(scope.permissions.viewRevenue).toBe(true);
      expect(scope.permissions.viewUsers).toBe(true);
    });

    it('resolves INSTRUCTOR scope for Instructor and restricts viewUsers', async () => {
      const scope = await service.resolveScope(instructorAuth);
      expect(scope.type).toBe('INSTRUCTOR');
      expect(scope.targetInstructorId).toBe('inst-1');
      expect(scope.permissions.viewUsers).toBe(false);
      expect(scope.permissions.viewRevenue).toBe(false);
    });

    it('rejects student attempting to access staff/admin dashboard', async () => {
      await expect(service.resolveScope(studentAuth)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects Instructor attempting to query another instructorId', async () => {
      await expect(
        service.resolveScope(instructorAuth, {
          instructorId: 'other-inst',
        } as never),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects Instructor attempting to query an unowned courseId', async () => {
      rows([]); // query for owned course returns 0 rows
      await expect(
        service.resolveScope(instructorAuth, {
          courseId: 'other-course',
        } as never),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows Instructor to query an owned courseId', async () => {
      rows([{ id: 'my-course' }]);
      const scope = await service.resolveScope(instructorAuth, {
        courseId: 'my-course',
      } as never);
      expect(scope.courseId).toBe('my-course');
    });
  });

  describe('kpis', () => {
    it('maps base counters and omits revenue without dashboard.read_financial for Admin', async () => {
      rows([
        {
          total_students: 10,
          active_students: 8,
          pending_verification_students: 2,
          total_courses: 5,
          published_courses: 3,
          draft_courses: 2,
          total_enrollments: 20,
          active_enrollments: 12,
          pending_payment_enrollments: 1,
          completed_enrollments: 7,
          pending_payment_reviews: 1,
          certificates_generated: 6,
          certificates_attention: 1,
          new_students: 3,
          new_enrollments: 4,
        },
      ]);
      const result = await service.kpis({} as never, {
        ...adminAuth,
        permissions: ['dashboard.read', 'users.read', 'courses.read'],
      });
      expect(result.kpis.students).toEqual({
        total: 10,
        active: 8,
        pendingVerification: 2,
        newDuringPeriod: 3,
      });
      expect(result.kpis.revenue).toBeUndefined();
      expect(database.client.execute).toHaveBeenCalledTimes(1);
    });

    it('scopes kpis to instructor owned courses for Instructor', async () => {
      rows([
        {
          total_courses: 3,
          published_courses: 2,
          draft_courses: 1,
          total_enrollments: 15,
          active_enrollments: 10,
          pending_payment_enrollments: 1,
          completed_enrollments: 4,
          new_enrollments: 5,
          my_students: 8,
          completion_rate: '26.67',
          certificates_generated: 4,
        },
      ]);
      const result = await service.kpis({} as never, instructorAuth);
      expect(result.scope).toBe('INSTRUCTOR');
      expect(result.kpis.courses).toEqual({
        total: 3,
        published: 2,
        draft: 1,
      });
      expect(result.kpis.students).toEqual({
        total: 8,
        active: 10,
        newDuringPeriod: 5,
      });
      expect(result.kpis.completionRate).toBe(26.67);
      expect(result.kpis.revenue).toBeUndefined();
    });

    it('adds revenue when the caller has dashboard.read_financial', async () => {
      rows([{}]);
      rows([{ currency: 'ETB', amount: '1000' }]);
      const result = await service.kpis({} as never, adminAuth);
      expect(result.kpis.revenue).toEqual([
        { currency: 'ETB', amount: '1000' },
      ]);
      expect(database.client.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('trend', () => {
    it.each([
      'registrations',
      'enrollments',
      'payments',
      'revenue',
      'completions',
      'certificates',
    ] as const)(
      'builds a %s trend from resolved points for Admin',
      async (kind) => {
        rows([{ period: '2026-08-01', count: 3 }]);
        const result = await service.trend(
          kind,
          { granularity: 'DAY' } as never,
          adminAuth,
        );
        expect(result.points).toEqual([{ period: '2026-08-01', count: 3 }]);
        expect(result.granularity).toBe('DAY');
      },
    );

    it('rejects registrations trend for Instructor without global user permissions', async () => {
      await expect(
        service.trend(
          'registrations',
          { granularity: 'DAY' } as never,
          instructorAuth,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('filterOptions', () => {
    it('returns all courses and instructors for Admin', async () => {
      rows([
        {
          id: 'c1',
          title: 'Course 1',
          slug: 'c-1',
          category_id: 'cat1',
          category_name: 'Tech',
          created_by: 'inst1',
        },
      ]);
      rows([{ id: 'cat1', name: 'Tech', slug: 'tech' }]);
      rows([
        {
          id: 'inst1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
      ]);

      const result = await service.filterOptions(adminAuth);
      expect(result.scope).toBe('GLOBAL');
      expect(result.courses).toHaveLength(1);
      expect(result.instructors).toHaveLength(1);
    });

    it('returns only owned courses and no instructors list for Instructor', async () => {
      rows([
        {
          id: 'c1',
          title: 'My Course',
          slug: 'my-course',
          category_id: 'cat1',
          category_name: 'Tech',
        },
      ]);
      rows([{ id: 'cat1', name: 'Tech', slug: 'tech' }]);

      const result = await service.filterOptions(instructorAuth);
      expect(result.scope).toBe('INSTRUCTOR');
      expect(result.courses).toHaveLength(1);
      expect(result.instructors).toHaveLength(0);
    });
  });

  describe('distribution', () => {
    it('computes free/paid percentages', async () => {
      rows([{ free_count: 3, paid_count: 1 }]);
      const result = await service.distribution({} as never, adminAuth);
      expect(result.freeCount).toBe(3);
      expect(result.paidCount).toBe(1);
      expect(result.freePercentage).toBe('75.00');
      expect(result.paidPercentage).toBe('25.00');
    });
  });

  describe('coursePerformance', () => {
    it('adds a revenue column only with financial access', async () => {
      rows([
        {
          course_id: 'c1',
          course_title: 'Course',
          total_revenue: '100',
          currency: 'ETB',
        },
      ]);
      const result = await service.coursePerformance(
        { limit: 5, sort: 'REVENUE' } as never,
        true,
        adminAuth,
      );
      expect(result[0].revenue).toBe('100');
    });
  });

  describe('overview', () => {
    it('assembles scoped overview for instructor omitting unpermitted global sections', async () => {
      rows([{ total_courses: 2 }]); // kpis
      rows([{ period: '1', count: 2 }]); // enrollments trend
      rows([{ period: '1', count: 1 }]); // completions trend
      rows([{ course_id: 'c1', course_title: 'My Course' }]); // topCourses
      rows([]); // recent enrollments preview
      rows([{ free_count: 2, paid_count: 0 }]); // distribution
      rows([{ period: '1', count: 1 }]); // certificates trend
      rows([]); // recent certificates

      const result = await service.overview(
        { previewLimit: 5 } as never,
        instructorAuth,
      );
      expect(result.scope).toBe('INSTRUCTOR');
      expect(result.trends).toHaveProperty('enrollments');
      expect(result.trends).toHaveProperty('completions');
      expect(result.trends).not.toHaveProperty('registrations');
      expect(result.trends).not.toHaveProperty('revenue');
      expect(result).not.toHaveProperty('recentActivity');
      expect(result).not.toHaveProperty('operationalAlerts');
    });
  });
});
