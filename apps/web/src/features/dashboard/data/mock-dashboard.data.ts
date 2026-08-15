import type {
  DashboardDistribution,
  DashboardFilterOptions,
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
    currency: 'ETB',
    amount: (point.count * 1900).toFixed(2),
  }));
}

export const MOCK_DASHBOARD_OVERVIEW: DashboardOverview = {
  scope: 'GLOBAL',
  permissions: {
    viewCourses: true,
    viewEnrollments: true,
    viewRevenue: true,
    viewUsers: true,
    viewCertificates: true,
    viewActivity: true,
    viewHealth: true,
  },
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
    completionRate: 33.33,
    payments: { waitingForReview: 2 },
    certificates: { generated: 1, attention: 1 },
    revenue: [{ currency: 'ETB', amount: '4999.00' }],
    comparisons: {
      newStudents: {
        current: 2,
        previous: 1,
        change: 1,
        changePercentage: '100.00',
        direction: 'UP',
      },
      newEnrollments: {
        current: 3,
        previous: 4,
        change: -1,
        changePercentage: '-25.00',
        direction: 'DOWN',
      },
      revenue: [
        {
          currency: 'ETB',
          current: 4999.0,
          previous: 3999.0,
          change: 1000,
          changePercentage: '25.01',
          direction: 'UP',
        },
      ],
    },
  },
  trends: {
    registrations: last14Days(6),
    enrollments: last14Days(5),
    payments: last14Days(4),
    revenue: last14DaysWithAmount(4),
    completions: last14Days(2),
    certificates: last14Days(1),
  },
  previews: {
    pendingPayments: [
      {
        paymentId: 'payment-1',
        enrollmentId: 'enrollment-1',
        student: { id: 'user-1', name: 'Abebe Kebede' },
        course: { id: 'course-1', title: 'Modern React Development' },
        currency: 'ETB',
        amountMismatch: false,
        duplicateTransactionWarning: false,
        submittedAt: '2026-02-01T09:05:00.000Z',
        waitingSeconds: 3600,
        submittedAmount: '3999.00',
        expectedAmount: '3999.00',
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
      courseId: 'course-1',
      title: 'Modern React Development',
      status: 'PUBLISHED',
      access_type: 'PAID',
      totalEnrollments: 2,
      total_enrollments: 2,
      new_enrollments: 2,
      completed_enrollments: 1,
      completions: 1,
      averageProgress: 72.5,
      average_progress: '72.50',
      completionRate: 50.0,
      completion_rate: '50.00',
      revenue: '4999.00',
      currency: 'ETB',
    },
    {
      id: 'course-2',
      courseId: 'course-2',
      title: 'Introduction to Data Science',
      status: 'DRAFT',
      access_type: 'FREE',
      totalEnrollments: 1,
      total_enrollments: 1,
      new_enrollments: 1,
      completed_enrollments: 0,
      completions: 0,
      averageProgress: 0.0,
      average_progress: '0.00',
      completionRate: 0.0,
      completion_rate: null,
      revenue: '0.00',
      currency: 'ETB',
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
    course_id: 'course-2',
    title: 'Introduction to Data Science',
    course_title: 'Introduction to Data Science',
    slug: 'intro-data-science',
    relevant_enrollments: 6,
    total_enrollments: 6,
    completed_enrollments: 1,
    completions: 1,
    completion_rate: 16.67,
    average_progress: 22.0,
  },
];

export const MOCK_FILTER_OPTIONS: DashboardFilterOptions = {
  scope: 'GLOBAL',
  courses: [
    {
      id: 'course-1',
      title: 'Modern React Development',
      slug: 'modern-react-development',
      categoryId: 'cat-1',
      categoryName: 'Web Development',
    },
    {
      id: 'course-2',
      title: 'Introduction to Data Science',
      slug: 'intro-to-data-science',
      categoryId: 'cat-2',
      categoryName: 'Data Science',
    },
  ],
  categories: [
    { id: 'cat-1', name: 'Web Development', slug: 'web-development' },
    { id: 'cat-2', name: 'Data Science', slug: 'data-science' },
  ],
  instructors: [
    { id: 'user-2', name: 'Sara Tesfaye', email: 'instructor@example.com' },
  ],
};
