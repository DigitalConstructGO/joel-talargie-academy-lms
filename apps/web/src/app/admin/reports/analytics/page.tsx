'use client';

import { useMemo } from 'react';
import type { DateRange } from 'react-day-picker';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  Banknote,
  BookOpen,
  CalendarRange,
  CreditCard,
  GraduationCap,
  Percent,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ChartCard } from '@/components/common/chart-card';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { StatCard } from '@/components/dashboard/stat-card';
import { ChartSkeleton } from '@/components/dashboard/skeletons/chart-skeleton';
import { DashboardSkeleton } from '@/components/dashboard/skeletons/dashboard-skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangeFilter } from '@/components/dashboard/filters/date-range-filter';
import {
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  useCoursePerformance,
  useDashboardFilterOptions,
  useDashboardOverview,
  useDashboardTrend,
  useLowCompletionCourses,
} from '@/features/dashboard/hooks/use-dashboard';
import type { DashboardRangePreset } from '@/features/dashboard/types/dashboard.types';
import { useRoles } from '@/features/roles/hooks/use-roles';
import { useAdminPromotionAnalytics } from '@/features/promotions/hooks/use-admin-promotion-analytics';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/date';

import {
  useLanguage,
  translateCourseTitle,
  translateCategoryName,
} from '@/lib/i18n/language-provider';

const PERIOD_OPTIONS: { label: string; value: DashboardRangePreset }[] = [
  { label: 'Today', value: 'TODAY' },
  { label: 'Yesterday', value: 'YESTERDAY' },
  { label: 'Last 7 days', value: 'LAST_7_DAYS' },
  { label: 'Last 30 days', value: 'LAST_30_DAYS' },
  { label: 'Last 90 days', value: 'LAST_90_DAYS' },
  { label: 'This month', value: 'THIS_MONTH' },
  { label: 'Last month', value: 'LAST_MONTH' },
  { label: 'This year', value: 'THIS_YEAR' },
  { label: 'Custom range', value: 'CUSTOM' },
];

const PERIOD_OPTIONS_AM: Record<DashboardRangePreset, string> = {
  TODAY: 'ዛሬ',
  YESTERDAY: 'ትላንት',
  LAST_7_DAYS: 'ባለፉት 7 ቀናት',
  LAST_30_DAYS: 'ባለፉት 30 ቀናት',
  LAST_90_DAYS: 'ባለፉት 90 ቀናት',
  THIS_MONTH: 'በዚህ ወር',
  LAST_MONTH: 'ባለፈው ወር',
  THIS_YEAR: 'በዚህ ዓመት',
  CUSTOM: 'የተወሰነ የጊዜ ክልል',
};

const VIBRANT_PALETTE = [
  '#10b981', // Emerald Green
  '#3b82f6', // Electric Sky Blue
  '#f59e0b', // Radiant Sun Yellow / Amber
  '#8b5cf6', // Royal Purple
  '#ec4899', // Vivid Rose Pink
  '#06b6d4', // Ocean Cyan / Aqua
  '#f97316', // Sunset Orange
  '#84cc16', // Lime Green
  '#14b8a6', // Bright Teal
  '#6366f1', // Electric Indigo
];

const COMPLETION_WARNING_PALETTE = [
  '#ef4444', // Crimson Red
  '#f97316', // Sunset Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#ec4899', // Rose Pink
];

const REGISTRATIONS_CONFIG = {
  registrations: { label: 'New students', color: '#3b82f6' },
} satisfies ChartConfig;

const ENROLLMENTS_CONFIG = {
  enrollments: { label: 'New enrollments', color: '#10b981' },
} satisfies ChartConfig;

const PAYMENTS_CONFIG = {
  payments: { label: 'Payments submitted', color: '#f97316' },
} satisfies ChartConfig;

const COMPLETIONS_CONFIG = {
  completions: { label: 'Course completions', color: '#f59e0b' },
} satisfies ChartConfig;

const REVENUE_CONFIG = {
  amount: { label: 'Revenue', color: '#8b5cf6' },
} satisfies ChartConfig;

const REVENUE_TREND_CONFIG = {
  amount: { label: 'Revenue', color: '#8b5cf6' },
} satisfies ChartConfig;

const CERTIFICATES_CONFIG = {
  count: { label: 'Certificates issued', color: '#06b6d4' },
} satisfies ChartConfig;

const ENROLLMENT_STATUS_CONFIG = {
  active: { label: 'Active', color: '#10b981' },
  completed: { label: 'Completed', color: '#f59e0b' },
  pendingPayment: { label: 'Pending payment', color: '#3b82f6' },
  other: { label: 'Other (cancelled / revoked)', color: '#94a3b8' },
} satisfies ChartConfig;

const COURSE_STATUS_CONFIG = {
  published: { label: 'Published', color: '#10b981' },
  draft: { label: 'Draft', color: '#8b5cf6' },
  archived: { label: 'Archived', color: '#64748b' },
} satisfies ChartConfig;

const COURSE_REVENUE_CONFIG = {
  revenue: { label: 'Revenue', color: '#10b981' },
} satisfies ChartConfig;

const LOW_COMPLETION_CONFIG = {
  rate: { label: 'Completion rate', color: '#ef4444' },
} satisfies ChartConfig;

const CATEGORY_CONFIG = {
  count: { label: 'Courses', color: '#6366f1' },
} satisfies ChartConfig;

const ROLE_CONFIG = {
  count: { label: 'Users', color: '#ec4899' },
} satisfies ChartConfig;

const CODES_CONFIG = {
  redemptions: { label: 'Redemptions', color: '#14b8a6' },
} satisfies ChartConfig;

function ChartErrorCard({ title, onRetry }: { title: string; onRetry: () => void }) {
  const { locale } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ErrorState
          className="py-8"
          description={locale === 'am' ? 'ይህንን ቻርት መጫን አልተቻለም።' : 'Unable to load this chart.'}
          onRetry={onRetry}
        />
      </CardContent>
    </Card>
  );
}

function ChartEmptyCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="py-8 text-center text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface AnalyticsFilters {
  [key: string]: string | undefined;
  period: DashboardRangePreset;
  from: string | undefined;
  to: string | undefined;
  courseId: string | undefined;
  categoryId: string | undefined;
}

export default function AdminAnalyticsPage() {
  const { t, locale } = useLanguage();
  const { filters, setFilters } = useQueryFilters<AnalyticsFilters>({
    defaults: {
      period: 'LAST_30_DAYS',
      from: undefined,
      to: undefined,
      courseId: undefined,
      categoryId: undefined,
    },
  });

  const { period, from, to, courseId, categoryId } = filters;
  const isCustom = period === 'CUSTOM';
  const customRangeReady = !isCustom || Boolean(from && to);
  const rangeParams = {
    ...(isCustom ? { range: period, from, to } : { range: period }),
    courseId: courseId || undefined,
    categoryId: categoryId || undefined,
  };

  const dateRange: DateRange | undefined =
    from || to
      ? { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined }
      : undefined;

  const filterOptionsQuery = useDashboardFilterOptions();
  const filterOptions = filterOptionsQuery.data;

  const overviewQuery = useDashboardOverview(
    { ...rangeParams, previewLimit: 10 },
    { enabled: customRangeReady },
  );
  const data = overviewQuery.data;

  const isGlobal = data?.scope === 'GLOBAL';
  const canReadRevenue = Boolean(data?.permissions?.viewRevenue);
  const canReadUsers = Boolean(data?.permissions?.viewUsers && isGlobal);
  const canReadCertificates = Boolean(data?.permissions?.viewCertificates);
  const canReadCourses = Boolean(data?.permissions?.viewCourses !== false);

  const revenueTrendQuery = useDashboardTrend('revenue', rangeParams, {
    enabled: customRangeReady && canReadRevenue,
  });

  const certificatesTrendQuery = useDashboardTrend('certificates', rangeParams, {
    enabled: customRangeReady && canReadCertificates,
  });

  const coursesByRevenueQuery = useCoursePerformance(
    { ...rangeParams, sort: 'REVENUE', limit: 8 },
    { enabled: customRangeReady && canReadRevenue },
  );

  const lowCompletionQuery = useLowCompletionCourses(
    { ...rangeParams, limit: 8 },
    { enabled: customRangeReady && canReadCourses },
  );

  const rolesQuery = useRoles({ pageSize: 100 });

  const promotionAnalyticsQuery = useAdminPromotionAnalytics({ limit: 8 });

  const categoryDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const course of filterOptions?.courses ?? []) {
      const catName = course.categoryName || 'General';
      counts.set(catName, (counts.get(catName) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({
        category: translateCategoryName(category, locale),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filterOptions?.courses, locale]);

  const roleDistribution = (rolesQuery.data?.items ?? [])
    .filter((role) => role.userCount > 0)
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 8);

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: t('sidebar.dashboard'), href: ROUTES.admin.root },
          { label: t('sidebar.reports'), href: ROUTES.admin.reports },
          { label: locale === 'am' ? 'አናሊቲክስ' : 'Analytics' },
        ]}
      />

      <div className="flex flex-col gap-4">
        <PageHeader
          title={locale === 'am' ? 'አናሊቲክስ' : 'Analytics'}
          description={
            data?.scope === 'INSTRUCTOR'
              ? locale === 'am'
                ? 'በእርስዎ ኮርሶች ብቻ የተገደበ አፈፃፀም እና የተማሪዎች ሂደት።'
                : 'Showing course performance and student progress scoped strictly to your courses.'
              : locale === 'am'
                ? 'በመድረኩ አቀፍ የክፍያ፣ የገቢ እና የመማር ሂደት አናሊቲክስ።'
                : 'Platform-wide operational analytics, revenue, and learning progress.'
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {/* Course Selector Filter */}
              {filterOptions && filterOptions.courses.length > 1 && (
                <Select
                  value={courseId || 'ALL'}
                  onValueChange={(val) => setFilters({ courseId: val === 'ALL' ? undefined : val })}
                >
                  <SelectTrigger className="w-48" aria-label="Course Filter">
                    <SelectValue placeholder={locale === 'am' ? 'ሁሉም ኮርሶች' : 'All Courses'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      {locale === 'am' ? 'ሁሉም የተፈቀዱ ኮርሶች' : 'All Authorized Courses'}
                    </SelectItem>
                    {filterOptions.courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {translateCourseTitle(course.title, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Category Selector Filter */}
              {filterOptions && filterOptions.categories.length > 1 && (
                <Select
                  value={categoryId || 'ALL'}
                  onValueChange={(val) =>
                    setFilters({ categoryId: val === 'ALL' ? undefined : val })
                  }
                >
                  <SelectTrigger className="w-44" aria-label="Category Filter">
                    <SelectValue placeholder={locale === 'am' ? 'ሁሉም ምድቦች' : 'All Categories'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      {locale === 'am' ? 'ሁሉም ምድቦች' : 'All Categories'}
                    </SelectItem>
                    {filterOptions.categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {translateCategoryName(cat.name, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Period Filter */}
              <Select
                value={period}
                onValueChange={(value) =>
                  setFilters({
                    period: value as DashboardRangePreset,
                    ...(value !== 'CUSTOM' ? { from: undefined, to: undefined } : {}),
                  })
                }
              >
                <SelectTrigger className="w-40" aria-label="Period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {locale === 'am' ? PERIOD_OPTIONS_AM[option.value] : option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isCustom && (
                <DateRangeFilter
                  value={dateRange}
                  onChange={(range) =>
                    setFilters({
                      from: range?.from ? range.from.toISOString().slice(0, 10) : undefined,
                      to: range?.to ? range.to.toISOString().slice(0, 10) : undefined,
                    })
                  }
                  placeholder={locale === 'am' ? 'የቀን ክልል ይምረጡ' : 'Select a date range'}
                />
              )}
            </div>
          }
        />

        {/* Scope Indicator Banner */}
        {data && (
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground">
            {data.scope === 'INSTRUCTOR' ? (
              <>
                <UserCheck className="h-4 w-4 text-primary" />
                <span>
                  <strong className="font-semibold text-foreground">
                    {locale === 'am' ? 'የአስተማሪ ክልል፡' : 'Instructor Scope:'}
                  </strong>{' '}
                  {locale === 'am'
                    ? 'መረጃዎች እርስዎ ከሚያስተዳድሯቸው ኮርሶች ብቻ የተሰሉ ናቸው።'
                    : 'Data is strictly calculated from the courses you own and manage.'}
                </span>
                <Badge variant="outline" className="ml-auto font-mono text-[10px]">
                  INSTRUCTOR
                </Badge>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>
                  <strong className="font-semibold text-foreground">
                    {locale === 'am' ? 'የመድረክ ክልል፡' : 'Platform Scope:'}
                  </strong>{' '}
                  {locale === 'am'
                    ? 'በሁሉም የሲስተሙ ሀብቶች ላይ አጠቃላይ የተሰበሰቡ ስታቲስቲክሶችን በማሳየት ላይ።'
                    : 'Showing organization-wide aggregate statistics across all platform resources.'}
                </span>
                <Badge variant="secondary" className="ml-auto font-mono text-[10px]">
                  {locale === 'am' ? 'የሲስተም አስተዳዳሪ' : 'PLATFORM ADMIN'}
                </Badge>
              </>
            )}
          </div>
        )}
      </div>

      {!customRangeReady ? (
        <EmptyState
          icon={CalendarRange}
          title={locale === 'am' ? 'የቀን ክልል ይምረጡ' : 'Select a date range'}
          description={
            locale === 'am'
              ? 'የተወሰነ ጊዜ አናሊቲክስ ለማየት ከላይ ጀምሮ እና ማብቂያ ቀን ይምረጡ።'
              : 'Choose a start and end date above to view analytics for a custom range.'
          }
        />
      ) : overviewQuery.isLoading ? (
        <DashboardSkeleton />
      ) : overviewQuery.isError || !data ? (
        <ErrorState
          onRetry={() => overviewQuery.refetch()}
          description={
            locale === 'am'
              ? 'የአናሊቲክስ መረጃ መጫን አልተቻለም። እባክዎን በቂ ፈቃዶች እንዳሉዎት ያረጋግጡ።'
              : 'Unable to load analytics data. Please ensure you have sufficient permissions.'
          }
        />
      ) : (
        <div className="space-y-8 mt-6">
          {/* Section 1: Permission & Data-Scoped KPI Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {data.kpis?.courses && (
              <StatCard
                icon={BookOpen}
                label={
                  data.scope === 'INSTRUCTOR'
                    ? locale === 'am'
                      ? 'የእኔ ኮርሶች'
                      : 'My Courses'
                    : locale === 'am'
                      ? 'የታተሙ ኮርሶች'
                      : 'Published Courses'
                }
                value={data.kpis.courses.published}
                suffix={`/ ${data.kpis.courses.total}`}
                tone="info"
              />
            )}

            {data.kpis?.enrollments && (
              <StatCard
                icon={GraduationCap}
                label={
                  data.scope === 'INSTRUCTOR'
                    ? locale === 'am'
                      ? 'የኮርስ ምዝገባዎች'
                      : 'Course Enrollments'
                    : locale === 'am'
                      ? 'ንቁ ምዝገባዎች'
                      : 'Active Enrollments'
                }
                value={data.kpis.enrollments.active}
                suffix={`/ ${data.kpis.enrollments.total}`}
                tone="teal"
              />
            )}

            {data.kpis?.students && (
              <StatCard
                icon={Users}
                label={
                  data.scope === 'INSTRUCTOR'
                    ? locale === 'am'
                      ? 'የእኔ ተማሪዎች'
                      : 'My Students'
                    : locale === 'am'
                      ? 'ንቁ ተማሪዎች'
                      : 'Active Students'
                }
                value={data.kpis.students.active ?? data.kpis.students.total}
                suffix={data.scope === 'GLOBAL' ? `/ ${data.kpis.students.total}` : undefined}
                tone="primary"
              />
            )}

            {data.kpis?.completionRate != null && (
              <StatCard
                icon={Percent}
                label={locale === 'am' ? 'የማጠናቀቂያ መጠን' : 'Completion Rate'}
                value={`${data.kpis.completionRate}%`}
                tone="teal"
              />
            )}

            {data.kpis?.certificates && canReadCertificates && (
              <StatCard
                icon={Award}
                label={locale === 'am' ? 'የተሰጡ ሰርተፊኬቶች' : 'Certificates Issued'}
                value={data.kpis.certificates.generated}
                tone="success"
              />
            )}

            {data.kpis?.payments && canReadRevenue && (
              <StatCard
                icon={CreditCard}
                label={locale === 'am' ? 'በመጠባበቅ ላይ ያሉ ክፍያዎች' : 'Pending Payments'}
                value={data.kpis.payments.waitingForReview}
                tone="warning"
              />
            )}

            {data.kpis?.revenue &&
              canReadRevenue &&
              data.kpis.revenue.map((rev) => (
                <StatCard
                  key={rev.currency}
                  icon={Banknote}
                  label={locale === 'am' ? `ገቢ (${rev.currency})` : `Revenue (${rev.currency})`}
                  value={formatCurrency(Number(rev.amount), rev.currency)}
                  tone="success"
                />
              ))}
          </div>

          {/* Period-over-period comparisons - only if present in response */}
          {data.kpis?.comparisons && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {data.kpis.comparisons.newStudents && canReadUsers && (
                <StatCard
                  icon={UserPlus}
                  label={locale === 'am' ? 'አዲስ ተማሪዎች' : 'New Students'}
                  value={data.kpis.comparisons.newStudents.current}
                  tone="primary"
                  trend={data.kpis.comparisons.newStudents}
                />
              )}
              {data.kpis.comparisons.newEnrollments && (
                <StatCard
                  icon={GraduationCap}
                  label={locale === 'am' ? 'አዲስ ምዝገባዎች' : 'New Enrollments'}
                  value={data.kpis.comparisons.newEnrollments.current}
                  tone="teal"
                  trend={data.kpis.comparisons.newEnrollments}
                />
              )}
              {canReadRevenue &&
                data.kpis.comparisons.revenue?.map((revenue) => (
                  <StatCard
                    key={revenue.currency}
                    icon={Banknote}
                    label={
                      locale === 'am' ? `ገቢ (${revenue.currency})` : `Revenue (${revenue.currency})`
                    }
                    value={formatCurrency(revenue.current, revenue.currency)}
                    tone="success"
                    trend={revenue}
                  />
                ))}
            </div>
          )}

          {/* Section 2: Trends */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              {locale === 'am' ? 'የእድገት እና እንቅስቃሴ አዝማሚያዎች' : 'Growth & Activity Trends'}
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Enrollments Trend */}
              {data.trends?.enrollments && data.trends.enrollments.length > 0 && (
                <ChartCard
                  title={locale === 'am' ? 'የምዝገባ አዝማሚያ' : 'Enrollment Trend'}
                  description={
                    locale === 'am'
                      ? 'በተመረጠው ጊዜ ውስጥ የተመዘገቡ አዲስ ምዝገባዎች'
                      : 'New enrollments over the selected period'
                  }
                  config={ENROLLMENTS_CONFIG}
                >
                  <AreaChart
                    data={data.trends.enrollments.map((p) => ({
                      period: p.period,
                      enrollments: p.count,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="enrollmentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-border/40"
                    />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatDate(v)}
                      tickMargin={8}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      dataKey="enrollments"
                      type="monotone"
                      fill="url(#enrollmentGrad)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ChartCard>
              )}

              {/* Course Completions Trend */}
              {data.trends?.completions && data.trends.completions.length > 0 && (
                <ChartCard
                  title={locale === 'am' ? 'የኮርሶች ማጠናቀቅ' : 'Course Completions'}
                  description={
                    locale === 'am'
                      ? 'በተመረጠው ጊዜ ውስጥ የተጠናቀቁ ኮርሶች'
                      : 'Completions over the selected period'
                  }
                  config={COMPLETIONS_CONFIG}
                >
                  <BarChart
                    data={data.trends.completions.map((p) => ({
                      period: p.period,
                      completions: p.count,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-border/40"
                    />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatDate(v)}
                      tickMargin={8}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="completions" fill="url(#completionGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartCard>
              )}

              {/* Revenue Trend - only if permitted and data present */}
              {canReadRevenue &&
                (revenueTrendQuery.isLoading ? (
                  <ChartSkeleton />
                ) : revenueTrendQuery.isError ? (
                  <ChartErrorCard
                    title={locale === 'am' ? 'የገቢ አዝማሚያ' : 'Revenue Trend'}
                    onRetry={() => revenueTrendQuery.refetch()}
                  />
                ) : revenueTrendQuery.data && revenueTrendQuery.data.points.length > 0 ? (
                  <ChartCard
                    title={
                      data.scope === 'INSTRUCTOR'
                        ? locale === 'am'
                          ? 'የኮርሶች ገቢ አዝማሚያ'
                          : 'Course Revenue Trend'
                        : locale === 'am'
                          ? 'የመድረክ ገቢ አዝማሚያ'
                          : 'Platform Revenue Trend'
                    }
                    description={
                      locale === 'am'
                        ? 'በተመረጠው ጊዜ ውስጥ የጸደቀ ክፍያ ገቢ'
                        : 'Approved payment revenue over the selected period'
                    }
                    config={REVENUE_TREND_CONFIG}
                  >
                    <AreaChart
                      data={revenueTrendQuery.data.points.map((p) => ({
                        period: p.period,
                        amount: Number(p.amount ?? 0),
                      }))}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="stroke-border/40"
                      />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatDate(v)}
                        tickMargin={8}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(v) => `${v}`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        dataKey="amount"
                        type="monotone"
                        fill="url(#revenueGrad)"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ChartCard>
                ) : (
                  <ChartEmptyCard
                    title={locale === 'am' ? 'የገቢ አዝማሚያ' : 'Revenue Trend'}
                    description={
                      locale === 'am'
                        ? 'ለዚህ ጊዜ የተመዘገበ የገቢ መረጃ የለም።'
                        : 'No revenue data recorded for this period.'
                    }
                  />
                ))}

              {/* Certificate Issuance Trend */}
              {canReadCertificates &&
                (certificatesTrendQuery.isLoading ? (
                  <ChartSkeleton />
                ) : certificatesTrendQuery.isError ? (
                  <ChartErrorCard
                    title={locale === 'am' ? 'የሰርተፊኬቶች አሰጣጥ' : 'Certificate Issuance'}
                    onRetry={() => certificatesTrendQuery.refetch()}
                  />
                ) : certificatesTrendQuery.data && certificatesTrendQuery.data.points.length > 0 ? (
                  <ChartCard
                    title={locale === 'am' ? 'የሰርተፊኬቶች አሰጣጥ' : 'Certificate Issuance'}
                    description={
                      locale === 'am'
                        ? 'በተመረጠው ጊዜ ውስጥ የተሰጡ ሰርተፊኬቶች'
                        : 'Certificates issued over the selected period'
                    }
                    config={CERTIFICATES_CONFIG}
                  >
                    <BarChart
                      data={certificatesTrendQuery.data.points.map((p) => ({
                        period: p.period,
                        count: p.count,
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="certGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="stroke-border/40"
                      />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatDate(v)}
                        tickMargin={8}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="url(#certGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartCard>
                ) : (
                  <ChartEmptyCard
                    title={locale === 'am' ? 'የሰርተፊኬቶች አሰጣጥ' : 'Certificate Issuance'}
                    description={
                      locale === 'am'
                        ? 'በዚህ ጊዜ ውስጥ የተሰጠ ሰርተፊኬት የለም።'
                        : 'No certificates issued in this period.'
                    }
                  />
                ))}

              {/* Registrations Trend - Global only */}
              {isGlobal &&
                canReadUsers &&
                data.trends?.registrations &&
                data.trends.registrations.length > 0 && (
                  <ChartCard
                    title={locale === 'am' ? 'አዲስ ምዝገባዎች' : 'New Registrations'}
                    description={
                      locale === 'am'
                        ? 'በተመረጠው ጊዜ ውስጥ የተጠቃሚዎች እድገት'
                        : 'User growth over the selected period'
                    }
                    config={REGISTRATIONS_CONFIG}
                  >
                    <AreaChart
                      data={data.trends.registrations.map((p) => ({
                        period: p.period,
                        registrations: p.count,
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="stroke-border/40"
                      />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatDate(v)}
                        tickMargin={8}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        dataKey="registrations"
                        type="monotone"
                        fill="url(#regGrad)"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ChartCard>
                )}

              {/* Payment Count Trend - if revenue permitted */}
              {canReadRevenue && data.trends?.payments && data.trends.payments.length > 0 && (
                <ChartCard
                  title={locale === 'am' ? 'የክፍያ እንቅስቃሴ' : 'Payment Activity'}
                  description={
                    locale === 'am'
                      ? 'በተመረጠው ጊዜ ውስጥ የቀረቡ ክፍያዎች'
                      : 'Payments submitted over the selected period'
                  }
                  config={PAYMENTS_CONFIG}
                >
                  <BarChart
                    data={data.trends.payments.map((p) => ({
                      period: p.period,
                      payments: p.count,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="paymentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-border/40"
                    />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatDate(v)}
                      tickMargin={8}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="payments" fill="url(#paymentGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartCard>
              )}
            </div>
          </section>

          {/* Section 3: Distribution */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              {locale === 'am' ? 'ስርጭት' : 'Distribution'}
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {data.kpis?.enrollments && (
                <ChartCard
                  title={locale === 'am' ? 'የምዝገባ ሁኔታ' : 'Enrollment Status'}
                  description={
                    locale === 'am' ? 'አሁን ላይ የምዝገባዎች አቋም' : 'Where enrollments stand right now'
                  }
                  config={ENROLLMENT_STATUS_CONFIG}
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Pie
                      data={[
                        {
                          key: 'active',
                          name: locale === 'am' ? 'ንቁ' : 'Active',
                          value: data.kpis.enrollments.active,
                          fill: '#10b981',
                        },
                        {
                          key: 'completed',
                          name: locale === 'am' ? 'የተጠናቀቀ' : 'Completed',
                          value: data.kpis.enrollments.completed,
                          fill: '#f59e0b',
                        },
                        {
                          key: 'pendingPayment',
                          name: locale === 'am' ? 'ክፍያ በመጠባበቅ ላይ' : 'Pending payment',
                          value: data.kpis.enrollments.pendingPayment,
                          fill: '#3b82f6',
                        },
                        {
                          key: 'other',
                          name: locale === 'am' ? 'ሌላ' : 'Other (cancelled / revoked)',
                          value: Math.max(
                            0,
                            data.kpis.enrollments.total -
                              data.kpis.enrollments.active -
                              data.kpis.enrollments.completed -
                              data.kpis.enrollments.pendingPayment,
                          ),
                          fill: '#94a3b8',
                        },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      cornerRadius={4}
                    >
                      {[
                        { key: 'active', color: '#10b981' },
                        { key: 'completed', color: '#f59e0b' },
                        { key: 'pendingPayment', color: '#3b82f6' },
                        { key: 'other', color: '#94a3b8' },
                      ].map((item) => (
                        <Cell key={item.key} fill={item.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartCard>
              )}

              {data.kpis?.courses && (
                <ChartCard
                  title={locale === 'am' ? 'የኮርስ ሁኔታ' : 'Course Status'}
                  description={
                    locale === 'am' ? 'የታተሙ፣ ረቂቅ እና የተቀመጡ' : 'Published vs. draft vs. archived'
                  }
                  config={COURSE_STATUS_CONFIG}
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Pie
                      data={[
                        {
                          key: 'published',
                          name: locale === 'am' ? 'የታተመ' : 'Published',
                          value: data.kpis.courses.published,
                          fill: '#10b981',
                        },
                        {
                          key: 'draft',
                          name: locale === 'am' ? 'ረቂቅ' : 'Draft',
                          value: data.kpis.courses.draft,
                          fill: '#8b5cf6',
                        },
                        {
                          key: 'archived',
                          name: locale === 'am' ? 'የተቀመጠ' : 'Archived',
                          value: Math.max(
                            0,
                            data.kpis.courses.total -
                              data.kpis.courses.published -
                              data.kpis.courses.draft,
                          ),
                          fill: '#64748b',
                        },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      cornerRadius={4}
                    >
                      {[
                        { key: 'published', color: '#10b981' },
                        { key: 'draft', color: '#8b5cf6' },
                        { key: 'archived', color: '#64748b' },
                      ].map((item) => (
                        <Cell key={item.key} fill={item.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartCard>
              )}

              {canReadRevenue && data.kpis?.revenue && data.kpis.revenue.length > 0 && (
                <ChartCard
                  title={locale === 'am' ? 'ገቢ በገንዘብ አይነት' : 'Revenue by Currency'}
                  description={
                    locale === 'am'
                      ? 'በተመረጠው ጊዜ ውስጥ የጸደቁ ክፍያዎች'
                      : 'Approved payment revenue for the selected period'
                  }
                  config={REVENUE_CONFIG}
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={data.kpis.revenue.map((r, index) => ({
                        name: r.currency,
                        amount: Number(r.amount),
                        fill: VIBRANT_PALETTE[index % VIBRANT_PALETTE.length],
                      }))}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      cornerRadius={4}
                    >
                      {data.kpis.revenue.map((r, index) => (
                        <Cell
                          key={r.currency}
                          fill={VIBRANT_PALETTE[index % VIBRANT_PALETTE.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartCard>
              )}
            </div>
          </section>

          {/* Section 4: Course Performance Rankings */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              {locale === 'am' ? 'የኮርሶች አፈፃፀም ግንዛቤዎች' : 'Course Performance Insights'}
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {canReadRevenue &&
                (coursesByRevenueQuery.isLoading ? (
                  <ChartSkeleton />
                ) : coursesByRevenueQuery.isError ? (
                  <ChartErrorCard
                    title={locale === 'am' ? 'ከፍተኛ ገቢ ያስገኙ ኮርሶች' : 'Top Courses by Revenue'}
                    onRetry={() => coursesByRevenueQuery.refetch()}
                  />
                ) : coursesByRevenueQuery.data && coursesByRevenueQuery.data.length > 0 ? (
                  <ChartCard
                    title={locale === 'am' ? 'ከፍተኛ ገቢ ያስገኙ ኮርሶች' : 'Top Courses by Revenue'}
                    description={
                      locale === 'am'
                        ? 'በተመረጠው ጊዜ ከፍተኛ ገቢ ያገኙ ኮርሶች'
                        : 'Highest-earning courses in the selected period'
                    }
                    config={COURSE_REVENUE_CONFIG}
                  >
                    <BarChart
                      layout="vertical"
                      data={coursesByRevenueQuery.data.map((course) => ({
                        title: translateCourseTitle(course.title, locale),
                        revenue: Number(course.revenue ?? 0),
                      }))}
                      margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        className="stroke-border/40"
                      />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="title"
                        tickLine={false}
                        axisLine={false}
                        width={140}
                        tickFormatter={(value: string) =>
                          value.length > 18 ? `${value.slice(0, 18)}…` : value
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                        {coursesByRevenueQuery.data.map((_, index) => (
                          <Cell
                            key={index}
                            fill={VIBRANT_PALETTE[index % VIBRANT_PALETTE.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartCard>
                ) : (
                  <ChartEmptyCard
                    title={locale === 'am' ? 'ከፍተኛ ገቢ ያስገኙ ኮርሶች' : 'Top Courses by Revenue'}
                    description={
                      locale === 'am'
                        ? 'በዚህ ጊዜ ውስጥ ለኮርሶች የተመዘገበ ገቢ የለም።'
                        : 'No revenue recorded for courses in this period.'
                    }
                  />
                ))}

              {lowCompletionQuery.isLoading ? (
                <ChartSkeleton />
              ) : lowCompletionQuery.isError ? (
                <ChartErrorCard
                  title={locale === 'am' ? 'ዝቅተኛ የማጠናቀቂያ መጠን ያላቸው' : 'Lowest Completion Rates'}
                  onRetry={() => lowCompletionQuery.refetch()}
                />
              ) : lowCompletionQuery.data && lowCompletionQuery.data.length > 0 ? (
                <ChartCard
                  title={locale === 'am' ? 'ዝቅተኛ የማጠናቀቂያ መጠን ያላቸው' : 'Lowest Completion Rates'}
                  description={
                    locale === 'am'
                      ? 'የተማሪዎች ትኩረት የሚያስፈልጋቸው ኮርሶች'
                      : 'Courses that may need student engagement attention'
                  }
                  config={LOW_COMPLETION_CONFIG}
                >
                  <BarChart
                    layout="vertical"
                    data={lowCompletionQuery.data.map((course) => ({
                      title: translateCourseTitle(
                        course.title ?? course.course_title ?? 'Course',
                        locale,
                      ),
                      rate: Number(course.completion_rate ?? 0),
                    }))}
                    margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      className="stroke-border/40"
                    />
                    <XAxis type="number" tickLine={false} axisLine={false} unit="%" />
                    <YAxis
                      type="category"
                      dataKey="title"
                      tickLine={false}
                      axisLine={false}
                      width={140}
                      tickFormatter={(value: string) =>
                        value.length > 18 ? `${value.slice(0, 18)}…` : value
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                      {lowCompletionQuery.data.map((_, index) => (
                        <Cell
                          key={index}
                          fill={
                            COMPLETION_WARNING_PALETTE[index % COMPLETION_WARNING_PALETTE.length]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartCard>
              ) : (
                <ChartEmptyCard
                  title={locale === 'am' ? 'ዝቅተኛ የማጠናቀቂያ መጠን ያላቸው' : 'Lowest Completion Rates'}
                  description={
                    locale === 'am'
                      ? 'ለዚህ ጊዜ የተገኘ የኮርስ ማጠናቀቅ ችግር የለም።'
                      : 'No course completion issues detected for this period.'
                  }
                />
              )}
            </div>
          </section>

          {/* Section 5: Catalog & Team Breakdown */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              {locale === 'am' ? 'የይዘት እና ቡድን ትንተና' : 'Content & Team Breakdown'}
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {categoryDistribution.length > 0 ? (
                <ChartCard
                  title={locale === 'am' ? 'ኮርሶች በምድብ' : 'Courses by Category'}
                  description={
                    locale === 'am'
                      ? 'የኮርስ ይዘትዎ ትኩረት ያረፈበት'
                      : 'Where your course content is concentrated'
                  }
                  config={CATEGORY_CONFIG}
                >
                  <BarChart
                    data={categoryDistribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-border/40"
                    />
                    <XAxis
                      dataKey="category"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value: string) =>
                        value.length > 12 ? `${value.slice(0, 12)}…` : value
                      }
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {categoryDistribution.map((_, index) => (
                        <Cell key={index} fill={VIBRANT_PALETTE[index % VIBRANT_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartCard>
              ) : (
                <ChartEmptyCard
                  title={locale === 'am' ? 'ኮርሶች በምድብ' : 'Courses by Category'}
                  description={
                    locale === 'am'
                      ? 'በዚህ ክልል ውስጥ የሚገኙ ኮርሶች የሉም።'
                      : 'No courses available in this scope.'
                  }
                />
              )}

              {isGlobal &&
                canReadUsers &&
                (rolesQuery.isLoading ? (
                  <ChartSkeleton />
                ) : rolesQuery.isError ? (
                  <ChartErrorCard
                    title={locale === 'am' ? 'የሚናዎች ስርጭት' : 'Role Distribution'}
                    onRetry={() => rolesQuery.refetch()}
                  />
                ) : roleDistribution.length > 0 ? (
                  <ChartCard
                    title={locale === 'am' ? 'የሚናዎች ስርጭት' : 'Role Distribution'}
                    description={
                      locale === 'am' ? 'ተጠቃሚዎች በተመደቡበት ሚና' : 'Users grouped by assigned role'
                    }
                    config={ROLE_CONFIG}
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Pie
                        data={roleDistribution.map((role, index) => ({
                          name: role.name,
                          count: role.userCount,
                          fill: VIBRANT_PALETTE[index % VIBRANT_PALETTE.length],
                        }))}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        cornerRadius={4}
                      >
                        {roleDistribution.map((role, index) => (
                          <Cell
                            key={role.id}
                            fill={VIBRANT_PALETTE[index % VIBRANT_PALETTE.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartCard>
                ) : (
                  <ChartEmptyCard
                    title={locale === 'am' ? 'የሚናዎች ስርጭት' : 'Role Distribution'}
                    description={
                      locale === 'am'
                        ? 'እስካሁን ለሚናዎች የተመደቡ ተጠቃሚዎች የሉም።'
                        : 'No users assigned to roles yet.'
                    }
                  />
                ))}
            </div>
          </section>

          {/* Section 6: Promotions (Admins only) */}
          {isGlobal && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">
                {locale === 'am' ? 'ማስታወቂያዎች እና ማርኬቲንግ' : 'Promotions & Marketing'}
              </h2>
              {promotionAnalyticsQuery.isLoading ? (
                <ChartSkeleton />
              ) : promotionAnalyticsQuery.isError ? (
                <ChartErrorCard
                  title={
                    locale === 'am' ? 'በብዛት ስራ ላይ የዋሉ ፕሮሞ ኮዶች' : 'Top Promo Codes by Redemptions'
                  }
                  onRetry={() => promotionAnalyticsQuery.refetch()}
                />
              ) : promotionAnalyticsQuery.data &&
                promotionAnalyticsQuery.data.topCodes.length > 0 ? (
                <ChartCard
                  title={
                    locale === 'am' ? 'በብዛት ስራ ላይ የዋሉ ፕሮሞ ኮዶች' : 'Top Promo Codes by Redemptions'
                  }
                  description={`${promotionAnalyticsQuery.data.totalRedemptions} total redemptions · ${promotionAnalyticsQuery.data.conversionRate}% conversion rate`}
                  config={CODES_CONFIG}
                >
                  <BarChart
                    data={promotionAnalyticsQuery.data.topCodes.map((c) => ({
                      name: c.code,
                      redemptions: c.redemptions,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-border/40"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value: string) =>
                        value.length > 12 ? `${value.slice(0, 12)}…` : value
                      }
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="redemptions" radius={[6, 6, 0, 0]}>
                      {promotionAnalyticsQuery.data.topCodes.map((_, index) => (
                        <Cell
                          key={index}
                          fill={VIBRANT_PALETTE[(index + 3) % VIBRANT_PALETTE.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartCard>
              ) : (
                <ChartEmptyCard
                  title={
                    locale === 'am' ? 'በብዛት ስራ ላይ የዋሉ ፕሮሞ ኮዶች' : 'Top Promo Codes by Redemptions'
                  }
                  description={
                    locale === 'am'
                      ? 'የተመዘገቡ የፕሮሞ ኮድ አጠቃቀሞች የሉም።'
                      : 'No coupon redemptions recorded.'
                  }
                />
              )}
            </section>
          )}

          {/* Section 7: Course Performance Detail Table */}
          {data.topCourses && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {data.scope === 'INSTRUCTOR'
                    ? locale === 'am'
                      ? 'የእኔ ኮርሶች አፈፃፀም'
                      : 'My Courses Performance'
                    : locale === 'am'
                      ? 'የኮርሶች አፈፃፀም ዝርዝር'
                      : 'Course Performance'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.topCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {locale === 'am'
                      ? 'ምንም የኮርስ አፈፃፀም መረጃ አይገኝም።'
                      : 'No course performance data available.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{locale === 'am' ? 'ኮርስ' : 'Course'}</TableHead>
                          <TableHead>{locale === 'am' ? 'ሁኔታ' : 'Status'}</TableHead>
                          <TableHead>{locale === 'am' ? 'ምዝገባዎች' : 'Enrollments'}</TableHead>
                          <TableHead>{locale === 'am' ? 'የተጠናቀቁ' : 'Completions'}</TableHead>
                          <TableHead>
                            {locale === 'am' ? 'የማጠናቀቂያ መጠን' : 'Completion Rate'}
                          </TableHead>
                          {canReadRevenue && (
                            <TableHead>{locale === 'am' ? 'ገቢ' : 'Revenue'}</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.topCourses.map((course) => (
                          <TableRow key={course.courseId || course.id || course.title}>
                            <TableCell className="font-medium text-foreground">
                              {translateCourseTitle(course.title, locale)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={course.status === 'PUBLISHED' ? 'success' : 'secondary'}
                              >
                                {course.status === 'PUBLISHED'
                                  ? locale === 'am'
                                    ? 'የታተመ'
                                    : 'PUBLISHED'
                                  : locale === 'am'
                                    ? 'ረቂቅ'
                                    : course.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {course.totalEnrollments ?? course.total_enrollments ?? 0}
                            </TableCell>
                            <TableCell>
                              {course.completions ?? course.completed_enrollments ?? 0}
                            </TableCell>
                            <TableCell>
                              {course.completionRate != null
                                ? `${course.completionRate}%`
                                : course.completion_rate != null
                                  ? `${course.completion_rate}%`
                                  : '—'}
                            </TableCell>
                            {canReadRevenue && (
                              <TableCell>
                                {course.revenue ? formatCurrency(Number(course.revenue)) : '—'}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </ContentContainer>
  );
}
