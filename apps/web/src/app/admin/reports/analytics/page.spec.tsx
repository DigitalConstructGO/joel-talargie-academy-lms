import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminAnalyticsPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/admin/reports/analytics',
}));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => ({
    can: () => true,
    canAny: () => true,
    isAdministrator: true,
  }),
}));

const mockOverview = vi.fn();
const mockFilterOptions = vi.fn();

vi.mock('@/features/dashboard/hooks/use-dashboard', () => ({
  useDashboardOverview: () => mockOverview(),
  useDashboardFilterOptions: () => mockFilterOptions(),
  useDashboardTrend: () => ({ isLoading: false, data: { points: [] } }),
  useCoursePerformance: () => ({ isLoading: false, data: [] }),
  useLowCompletionCourses: () => ({ isLoading: false, data: [] }),
}));

vi.mock('@/features/roles/hooks/use-roles', () => ({
  useRoles: () => ({ isLoading: false, data: { items: [] } }),
}));

vi.mock('@/features/promotions/hooks/use-admin-promotion-analytics', () => ({
  useAdminPromotionAnalytics: () => ({ isLoading: false, data: { topCodes: [] } }),
}));

describe('AdminAnalyticsPage', () => {
  it('renders Platform Scope banner and global KPIs for Administrator', () => {
    mockFilterOptions.mockReturnValue({
      data: {
        scope: 'GLOBAL',
        courses: [{ id: 'c1', title: 'React 101', slug: 'react-101' }],
        categories: [{ id: 'cat1', name: 'Web Dev', slug: 'web-dev' }],
        instructors: [{ id: 'inst1', name: 'John Doe', email: 'john@example.com' }],
      },
    });

    mockOverview.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        scope: 'GLOBAL',
        permissions: {
          viewCourses: true,
          viewEnrollments: true,
          viewRevenue: true,
          viewUsers: true,
          viewCertificates: true,
        },
        range: { preset: 'LAST_30_DAYS', from: '2026-07-15', to: '2026-08-15', timezone: 'UTC' },
        kpis: {
          students: { total: 100, active: 80, pendingVerification: 5, newDuringPeriod: 12 },
          courses: { total: 10, published: 8, draft: 2 },
          enrollments: { total: 250, active: 180, pendingPayment: 10, completed: 60, newDuringPeriod: 25 },
          certificates: { generated: 50, attention: 0 },
          payments: { waitingForReview: 3 },
          revenue: [{ currency: 'ETB', amount: '50000' }],
        },
        trends: { enrollments: [], completions: [] },
        topCourses: [],
      },
    });

    render(<AdminAnalyticsPage />);

    expect(screen.getByText(/Platform Scope:/i)).toBeInTheDocument();
    expect(screen.getByText('PLATFORM ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Published Courses')).toBeInTheDocument();
    expect(screen.getByText('Active Enrollments')).toBeInTheDocument();
    expect(screen.getByText('Active Students')).toBeInTheDocument();
  });

  it('renders Instructor Scope banner and instructor-specific metrics for Instructor', () => {
    mockFilterOptions.mockReturnValue({
      data: {
        scope: 'INSTRUCTOR',
        courses: [{ id: 'c1', title: 'My Course', slug: 'my-course' }],
        categories: [],
        instructors: [],
      },
    });

    mockOverview.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        scope: 'INSTRUCTOR',
        permissions: {
          viewCourses: true,
          viewEnrollments: true,
          viewRevenue: false,
          viewUsers: false,
          viewCertificates: true,
        },
        range: { preset: 'LAST_30_DAYS', from: '2026-07-15', to: '2026-08-15', timezone: 'UTC' },
        kpis: {
          courses: { total: 2, published: 2, draft: 0 },
          enrollments: { total: 30, active: 20, pendingPayment: 0, completed: 10, newDuringPeriod: 5 },
          students: { total: 18, active: 20, newDuringPeriod: 5 },
          completionRate: 33.33,
        },
        trends: { enrollments: [], completions: [] },
        topCourses: [],
      },
    });

    render(<AdminAnalyticsPage />);

    expect(screen.getByText(/Instructor Scope:/i)).toBeInTheDocument();
    expect(screen.getByText('INSTRUCTOR')).toBeInTheDocument();
    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('Course Enrollments')).toBeInTheDocument();
    expect(screen.getByText('My Students')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
  });
});
