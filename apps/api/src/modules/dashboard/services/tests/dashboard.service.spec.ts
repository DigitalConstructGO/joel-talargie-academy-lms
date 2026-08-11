import { DashboardService } from '../dashboard.service';
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

  describe('kpis', () => {
    it('maps base counters and omits revenue without dashboard.read_financial', async () => {
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
      const result = await service.kpis({} as never, []);
      expect(result.kpis.students).toEqual({
        total: 10,
        active: 8,
        pendingVerification: 2,
        newDuringPeriod: 3,
      });
      expect(result.kpis.revenue).toBeUndefined();
      expect(database.client.execute).toHaveBeenCalledTimes(1);
    });

    it('adds revenue when the caller has dashboard.read_financial', async () => {
      rows([{}]);
      rows([{ currency: 'ETB', amount: '1000' }]);
      const result = await service.kpis({} as never, [
        'dashboard.read_financial',
      ]);
      expect(result.kpis.revenue).toEqual([
        { currency: 'ETB', amount: '1000' },
      ]);
      expect(database.client.execute).toHaveBeenCalledTimes(2);
    });

    it('defaults every counter to 0 when no row is returned', async () => {
      rows([]);
      const result = await service.kpis({} as never, []);
      expect(result.kpis.students).toEqual({
        total: 0,
        active: 0,
        pendingVerification: 0,
        newDuringPeriod: 0,
      });
    });

    it('omits comparisons entirely when the resolved range has no previous window', async () => {
      rows([{ new_students: 3, new_enrollments: 4 }]);
      const result = await service.kpis({} as never, []);
      expect(result.kpis).not.toHaveProperty('comparisons');
    });

    it('adds period-over-period comparisons when the resolved range has a previous window', async () => {
      const rangeWithPrevious = {
        ...range,
        previous: {
          from: new Date('2026-06-06T00:00:00.000Z'),
          to: new Date('2026-07-06T00:00:00.000Z'),
        },
      };
      dates.resolve.mockReturnValueOnce(rangeWithPrevious);
      rows([{ new_students: 10, new_enrollments: 20 }]); // current base counters
      rows([{ currency: 'ETB', amount: '1000' }]); // current revenue
      rows([{ new_students: 5, new_enrollments: 25 }]); // previous base counters
      rows([{ currency: 'ETB', amount: '500' }]); // previous revenue

      const result = await service.kpis({} as never, [
        'dashboard.read_financial',
      ]);
      const comparisons = (
        result.kpis as { comparisons: Record<string, unknown> }
      ).comparisons;

      expect(comparisons.newStudents).toEqual({
        current: 10,
        previous: 5,
        change: 5,
        changePercentage: '100.00',
        direction: 'UP',
      });
      expect(comparisons.newEnrollments).toEqual({
        current: 20,
        previous: 25,
        change: -5,
        changePercentage: '-20.00',
        direction: 'DOWN',
      });
      expect(comparisons.revenue).toEqual([
        {
          currency: 'ETB',
          current: 1000,
          previous: 500,
          change: 500,
          changePercentage: '100.00',
          direction: 'UP',
        },
      ]);
    });

    it('omits the revenue comparison without dashboard.read_financial even with a previous window', async () => {
      const rangeWithPrevious = {
        ...range,
        previous: {
          from: new Date('2026-06-06T00:00:00.000Z'),
          to: new Date('2026-07-06T00:00:00.000Z'),
        },
      };
      dates.resolve.mockReturnValueOnce(rangeWithPrevious);
      rows([{ new_students: 10, new_enrollments: 20 }]); // current base counters
      rows([{ new_students: 5, new_enrollments: 25 }]); // previous base counters

      const result = await service.kpis({} as never, []);
      const comparisons = (
        result.kpis as { comparisons: Record<string, unknown> }
      ).comparisons;

      expect((comparisons.newStudents as { current: number }).current).toBe(10);
      expect(comparisons).not.toHaveProperty('revenue');
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
    ] as const)('builds a %s trend from resolved points', async (kind) => {
      rows([{ period: '2026-08-01', count: 3 }]);
      const result = await service.trend(kind, {
        granularity: 'DAY',
      } as never);
      expect(result.points).toEqual([{ period: '2026-08-01', count: 3 }]);
      expect(result.granularity).toBe('DAY');
    });
  });

  describe('pendingPayments', () => {
    it('hides submitted/expected amounts without financial access', async () => {
      rows([
        {
          payment_id: 'p1',
          enrollment_id: 'e1',
          student_id: 'u1',
          first_name: 'Ada',
          last_name: 'Lovelace',
          course_id: 'c1',
          course_title: 'Course',
          currency: 'ETB',
          amount: '500',
          expected_amount_snapshot: '500',
          amount_mismatch: false,
          duplicate_transaction_count: 0,
          submitted_at: new Date().toISOString(),
        },
      ]);
      const [result] = await service.pendingPayments(10, false);
      expect(result.student).toEqual({ id: 'u1', name: 'Ada Lovelace' });
      expect(result).not.toHaveProperty('submittedAmount');
      expect(result.duplicateTransactionWarning).toBe(false);
    });

    it('reveals submitted/expected amounts and flags duplicate transactions with financial access', async () => {
      rows([
        {
          payment_id: 'p1',
          enrollment_id: 'e1',
          student_id: 'u1',
          first_name: null,
          last_name: null,
          course_id: 'c1',
          course_title: 'Course',
          currency: 'ETB',
          amount: '500',
          expected_amount_snapshot: '500',
          amount_mismatch: true,
          duplicate_transaction_count: 2,
          submitted_at: new Date().toISOString(),
        },
      ]);
      const [result] = await service.pendingPayments(10, true);
      expect(result.submittedAmount).toBe('500');
      expect(result.duplicateTransactionWarning).toBe(true);
      expect(result.student.name).toBe('');
    });
  });

  describe('recentStudents', () => {
    it('masks emails without dashboard.read_sensitive', async () => {
      rows([
        {
          id: 'u1',
          email: 'a@b.com',
          status: 'ACTIVE',
          email_verified: true,
          provider: 'LOCAL',
          created_at: new Date(),
          last_login_at: null,
          first_name: 'Ada',
          last_name: null,
        },
      ]);
      const [result] = await service.recentStudents(10, false);
      expect(result.email).toBe('m***@x.com');
      expect(privacy.maskEmail).toHaveBeenCalledWith('a@b.com');
      expect(result.name).toBe('Ada');
    });

    it('reveals the real email with dashboard.read_sensitive', async () => {
      rows([
        {
          id: 'u1',
          email: 'a@b.com',
          first_name: null,
          last_name: null,
        },
      ]);
      const [result] = await service.recentStudents(10, true);
      expect(result.email).toBe('a@b.com');
      expect(privacy.maskEmail).not.toHaveBeenCalled();
    });
  });

  describe('recentEnrollments', () => {
    it('includes price snapshot only with financial access', async () => {
      rows([
        {
          id: 'e1',
          status: 'ENROLLED',
          progress_percentage: 10,
          course_id: 'c1',
          course_title: 'Course',
          student_id: 'u1',
          first_name: 'Ada',
          last_name: 'L',
          price_at_enrollment: '500',
          currency_at_enrollment: 'ETB',
        },
      ]);
      const [withoutFinancial] = await service.recentEnrollments(10, false);
      expect(withoutFinancial).not.toHaveProperty('priceSnapshot');

      rows([
        {
          id: 'e1',
          course_id: 'c1',
          course_title: 'Course',
          student_id: 'u1',
          first_name: 'Ada',
          last_name: 'L',
          price_at_enrollment: '500',
          currency_at_enrollment: 'ETB',
        },
      ]);
      const [withFinancial] = await service.recentEnrollments(10, true);
      expect(withFinancial.priceSnapshot).toBe('500');
      expect(withFinancial.currency).toBe('ETB');
    });
  });

  it('recentCompletions and recentCertificates return raw rows', async () => {
    rows([{ enrollment_id: 'e1' }]);
    expect(await service.recentCompletions(5)).toEqual([
      { enrollment_id: 'e1' },
    ]);
    rows([{ id: 'cert1' }]);
    expect(await service.recentCertificates(5)).toEqual([{ id: 'cert1' }]);
  });

  describe('distribution', () => {
    it('computes free/paid percentages', async () => {
      rows([{ free_count: 3, paid_count: 1 }]);
      const result = await service.distribution({} as never);
      expect(result.freeCount).toBe(3);
      expect(result.paidCount).toBe(1);
      expect(result.freePercentage).toBe('75.00');
      expect(result.paidPercentage).toBe('25.00');
    });

    it('returns null percentages when there is no data', async () => {
      rows([]);
      const result = await service.distribution({} as never);
      expect(result.freePercentage).toBeNull();
      expect(result.paidPercentage).toBeNull();
    });
  });

  it('lowCompletion delegates to the raw row builder', async () => {
    rows([{ id: 'c1', completion_rate: '10.00' }]);
    const result = await service.lowCompletion({ limit: 5 } as never);
    expect(result).toEqual([{ id: 'c1', completion_rate: '10.00' }]);
  });

  describe('coursePerformance', () => {
    it('adds a revenue column only with financial access', async () => {
      rows([{ id: 'c1', title: 'Course' }]);
      const withoutFinancial = await service.coursePerformance(
        { limit: 5, sort: 'ENROLLMENTS' } as never,
        false,
      );
      expect(withoutFinancial).toEqual([{ id: 'c1', title: 'Course' }]);

      rows([{ id: 'c1', title: 'Course', revenue: '100' }]);
      const withFinancial = await service.coursePerformance(
        { limit: 5, sort: 'REVENUE' } as never,
        true,
      );
      expect(withFinancial[0].revenue).toBe('100');
    });

    it('falls back to the default sort for an unrecognized sort key', async () => {
      rows([{ id: 'c1' }]);
      await service.coursePerformance(
        { limit: 5, sort: 'UNKNOWN' } as never,
        false,
      );
      expect(database.client.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('health', () => {
    it('reports an alert for each nonzero operational counter', async () => {
      rows([
        {
          old_payments: 2,
          failed_certificates: 0,
          failed_emails: 1,
          failed_exports: 0,
        },
      ]);
      const alerts = await service.health();
      expect(alerts).toHaveLength(2);
      expect(alerts.map((a: { code: string }) => a.code)).toEqual([
        'PAYMENTS_WAITING_TOO_LONG',
        'FAILED_EMAIL_DELIVERIES',
      ]);
    });

    it('returns no alerts when every counter is zero', async () => {
      rows([
        {
          old_payments: 0,
          failed_certificates: 0,
          failed_emails: 0,
          failed_exports: 0,
        },
      ]);
      expect(await service.health()).toEqual([]);
    });
  });

  describe('recentActivity', () => {
    it('masks IP addresses without dashboard.read_sensitive', async () => {
      rows([{ id: 'a1', ip_address: '203.0.113.5' }]);
      const [result] = await service.recentActivity(10, false);
      expect(result.ipAddress).toBe('203.0.*.*');
      expect(privacy.maskIp).toHaveBeenCalledWith('203.0.113.5');
    });

    it('reveals the real IP with dashboard.read_sensitive', async () => {
      rows([{ id: 'a1', ip_address: '203.0.113.5' }]);
      const [result] = await service.recentActivity(10, true);
      expect(result.ipAddress).toBe('203.0.113.5');
    });
  });

  describe('overview', () => {
    it('assembles kpis, trends, previews and topCourses, adding activity/health only when permitted', async () => {
      rows([{}]); // kpis
      rows([{ period: '1', count: 1 }]); // registrations trend
      rows([{ period: '1', count: 1 }]); // enrollments trend
      rows([{ period: '1', count: 1 }]); // payments trend
      rows([{ period: '1', count: 1 }]); // completions trend
      rows([]); // pendingPayments
      rows([]); // recentStudents
      rows([]); // recent enrollments preview
      rows([]); // recent certificates preview
      rows([]); // coursePerformance

      const result = await service.overview({ previewLimit: 5 } as never, []);
      expect(result.trends).toEqual({
        registrations: [{ period: '1', count: 1 }],
        enrollments: [{ period: '1', count: 1 }],
        payments: [{ period: '1', count: 1 }],
        completions: [{ period: '1', count: 1 }],
      });
      expect(result).not.toHaveProperty('recentActivity');
      expect(result).not.toHaveProperty('operationalAlerts');
    });

    it('includes recentActivity and operationalAlerts with the right permissions', async () => {
      rows([{}]); // kpis
      rows([]); // registrations trend
      rows([]); // enrollments trend
      rows([]); // payments trend
      rows([]); // completions trend
      rows([]); // pendingPayments
      rows([]); // recentStudents
      rows([]); // recent enrollments preview
      rows([]); // recent certificates preview
      rows([]); // coursePerformance
      rows([{ id: 'a1', ip_address: null }]); // recentActivity
      rows([
        {
          old_payments: 0,
          failed_certificates: 0,
          failed_emails: 0,
          failed_exports: 0,
        },
      ]); // health

      const result = await service.overview({ previewLimit: 5 } as never, [
        'dashboard.read_administrator_activity',
        'dashboard.read_operational_health',
      ]);
      expect(result.recentActivity).toBeDefined();
      expect(result.operationalAlerts).toEqual([]);
    });
  });
});
