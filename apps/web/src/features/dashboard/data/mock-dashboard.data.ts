import type {
  DashboardDistribution,
  DashboardOverview,
  DashboardTrendKind,
  DashboardTrendResult,
  LowCompletionCourse,
  TrendPoint,
} from '../types/dashboard.types';

function last14Days(seed: number): { period: string; count: number }[] {
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    return {
      period: date.toISOString().slice(0, 10),
      count: Math.max(0, seed - index + (index % 3)),
    };
  });
}

function last14DaysWithAmount(seed: number): TrendPoint[] {
  return last14Days(seed).map((point) => ({
    ...point,
    currency: 'USD',
    amount: (point.count * 19.99).toFixed(2),
  }));
}

export const MOCK_DASHBOARD_OVERVIEW: DashboardOverview = {
  range: {
    preset: 'LAST_30_DAYS',
    from: new Date(Date.now() - 30 * 86400000).toISOString(),
    to: new Date().toISOString(),
    timezone: 'UTC',
  },
  kpis: {
    students: { total: 5, active: 4, pendingVerification: 1, newDuringPeriod: 2 },
    courses: { total: 2, published: 1, draft: 1 },
    enrollments: { total: 3, active: 1, pendingPayment: 0, completed: 1, newDuringPeriod: 3 },
    payments: { waitingForReview: 2 },
    certificates: { generated: 1, attention: 1 },
    revenue: [{ currency: 'USD', amount: '49.99' }],
  },
  trends: {
    registrations: last14Days(6),
    enrollments: last14Days(5),
    payments: last14Days(4),
    completions: last14Days(2),
  },
  previews: {
    pendingPayments: [
      {
        paymentId: 'payment-1',
        enrollmentId: 'enrollment-1',
        student: { id: 'user-1', name: 'Abebe Kebede' },
        course: { id: 'course-1', title: 'Modern React Development' },
        currency: 'USD',
        amountMismatch: false,
        duplicateTransactionWarning: false,
        submittedAt: '2026-02-01T09:05:00.000Z',
        waitingSeconds: 3600,
        submittedAmount: '39.99',
        expectedAmount: '39.99',
      },
    ],
    recentStudents: [
      {
        id: 'user-3',
        name: 'Yonas Girma',
        email: 'pending.student@example.com',
        status: 'PENDING_VERIFICATION',
        emailVerified: false,
        provider: 'LOCAL',
        createdAt: '2026-08-01T09:00:00.000Z',
        lastLoginAt: null,
      },
    ],
    recentEnrollments: [
      {
        id: 'enrollment-3',
        status: 'WAITING_APPROVAL',
        progress_percentage: 0,
        created_at: '2026-06-25T09:00:00.000Z',
        course_title: 'Introduction to Data Science',
      },
    ],
    recentCertificates: [
      {
        id: 'certificate-1',
        certificate_number: 'JTA-2026-000123',
        student_name_at_issue: 'Sara Tesfaye',
        course_title_at_issue: 'Modern React Development',
        status: 'GENERATED',
        issued_at: '2026-03-01T10:00:00.000Z',
        generated_at: '2026-03-01T10:00:00.000Z',
      },
    ],
  },
  topCourses: [
    {
      id: 'course-1',
      title: 'Modern React Development',
      status: 'PUBLISHED',
      access_type: 'PAID',
      total_enrollments: 2,
      new_enrollments: 2,
      completed_enrollments: 1,
      average_progress: '72.50',
      completion_rate: '50.00',
      revenue: '49.99',
    },
    {
      id: 'course-2',
      title: 'Introduction to Data Science',
      status: 'DRAFT',
      access_type: 'FREE',
      total_enrollments: 1,
      new_enrollments: 1,
      completed_enrollments: 0,
      average_progress: '0.00',
      completion_rate: null,
    },
  ],
  recentActivity: [
    {
      id: 'activity-1',
      actor_id: 'user-5',
      action: 'admin.user.activated',
      entity_type: 'user',
      entity_id: 'user-1',
      ip_address: '10.0.0.1',
      created_at: '2026-08-06T09:00:00.000Z',
    },
  ],
  operationalAlerts: [],
};

const MOCK_TREND_RANGE = MOCK_DASHBOARD_OVERVIEW.range;

export const MOCK_DASHBOARD_TRENDS: Record<DashboardTrendKind, DashboardTrendResult> = {
  registrations: { range: MOCK_TREND_RANGE, granularity: 'DAY', points: last14Days(6) },
  enrollments: { range: MOCK_TREND_RANGE, granularity: 'DAY', points: last14Days(5) },
  payments: { range: MOCK_TREND_RANGE, granularity: 'DAY', points: last14Days(4) },
  revenue: { range: MOCK_TREND_RANGE, granularity: 'DAY', points: last14DaysWithAmount(3) },
  completions: { range: MOCK_TREND_RANGE, granularity: 'DAY', points: last14Days(2) },
  certificates: { range: MOCK_TREND_RANGE, granularity: 'DAY', points: last14Days(1) },
};

export const MOCK_DISTRIBUTION: DashboardDistribution = {
  range: MOCK_TREND_RANGE,
  freeCount: 1,
  paidCount: 2,
  freePercentage: '33.33',
  paidPercentage: '66.67',
};

export const MOCK_LOW_COMPLETION_COURSES: LowCompletionCourse[] = [
  {
    id: 'course-2',
    title: 'Introduction to Data Science',
    relevant_enrollments: 6,
    completed_enrollments: 1,
    completion_rate: '16.67',
    average_progress: '22.00',
  },
];
