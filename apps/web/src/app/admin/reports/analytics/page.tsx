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
import { Can } from '@/components/auth/can';
import {
  useCoursePerformance,
  useDashboardOverview,
  useDashboardTrend,
  useLowCompletionCourses,
} from '@/features/dashboard/hooks/use-dashboard';
import type { DashboardRangePreset } from '@/features/dashboard/types/dashboard.types';
import { useAdminCourses } from '@/features/catalog/hooks/use-admin-courses';
import { useRoles } from '@/features/roles/hooks/use-roles';
import { useAdminPromotionAnalytics } from '@/features/promotions/hooks/use-admin-promotion-analytics';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/date';

const PERIOD_OPTIONS: { label: string; value: DashboardRangePreset }[] = [
  { label: 'Today', value: 'TODAY' },
  { label: 'Last 7 days', value: 'LAST_7_DAYS' },
  { label: 'Last 30 days', value: 'LAST_30_DAYS' },
  { label: 'Last 90 days', value: 'LAST_90_DAYS' },
  { label: 'This month', value: 'THIS_MONTH' },
  { label: 'Last month', value: 'LAST_MONTH' },
  { label: 'This year', value: 'THIS_YEAR' },
  { label: 'Custom range', value: 'CUSTOM' },
];

const REGISTRATIONS_CONFIG = {
  registrations: { label: 'New students', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const ENROLLMENTS_CONFIG = {
  enrollments: { label: 'New enrollments', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const PAYMENTS_CONFIG = {
  payments: { label: 'Payments submitted', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const COMPLETIONS_CONFIG = {
  completions: { label: 'Course completions', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const REVENUE_CONFIG = {
  amount: { label: 'Revenue', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const REVENUE_TREND_CONFIG = {
  amount: { label: 'Revenue', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const CERTIFICATES_CONFIG = {
  count: { label: 'Certificates issued', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const ENROLLMENT_STATUS_CONFIG = {
  active: { label: 'Active', color: 'var(--chart-1)' },
  completed: { label: 'Completed', color: 'var(--chart-2)' },
  pendingPayment: { label: 'Pending payment', color: 'var(--chart-3)' },
  other: { label: 'Other (cancelled / revoked)', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const COURSE_STATUS_CONFIG = {
  published: { label: 'Published', color: 'var(--chart-1)' },
  draft: { label: 'Draft', color: 'var(--chart-2)' },
  archived: { label: 'Archived', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const COURSE_REVENUE_CONFIG = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const LOW_COMPLETION_CONFIG = {
  rate: { label: 'Completion rate', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const CATEGORY_CONFIG = {
  count: { label: 'Courses', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const ROLE_CONFIG = {
  count: { label: 'Users', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const CAMPAIGN_CONFIG = {
  redemptions: { label: 'Redemptions', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const SLICE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

/** Matches `ChartSkeleton`'s card shape so a failed chart doesn't shift layout. */
function ChartErrorCard({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ErrorState className="py-8" description="Unable to load this chart." onRetry={onRetry} />
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
}

export default function AdminAnalyticsPage() {
  const { filters, setFilters } = useQueryFilters<AnalyticsFilters>({
    defaults: { period: 'LAST_30_DAYS', from: undefined, to: undefined },
  });
  const { period, from, to } = filters;
  const isCustom = period === 'CUSTOM';
  const customRangeReady = !isCustom || Boolean(from && to);
  const rangeParams = isCustom ? { range: period, from, to } : { range: period };
  const dateRange: DateRange | undefined =
    from || to
      ? { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined }
      : undefined;

  const overviewQuery = useDashboardOverview(
    { ...rangeParams, previewLimit: 10 },
    { enabled: customRangeReady },
  );
  const data = overviewQuery.data;

  const revenueTrendQuery = useDashboardTrend('revenue', rangeParams, {
    enabled: customRangeReady,
  });
  const certificatesTrendQuery = useDashboardTrend('certificates', rangeParams, {
    enabled: customRangeReady,
  });
  const coursesByRevenueQuery = useCoursePerformance(
    { ...rangeParams, sort: 'REVENUE', limit: 8 },
    { enabled: customRangeReady },
  );
  const lowCompletionQuery = useLowCompletionCourses(
    { ...rangeParams, limit: 8 },
    { enabled: customRangeReady },
  );
  const coursesQuery = useAdminCourses({ pageSize: 200 });
  const rolesQuery = useRoles({ pageSize: 100 });
  const campaignAnalyticsQuery = useAdminPromotionAnalytics({ limit: 8 });

  const categoryDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const course of coursesQuery.data?.items ?? []) {
      counts.set(course.categoryName, (counts.get(course.categoryName) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [coursesQuery.data]);

  const roleDistribution = (rolesQuery.data?.items ?? [])
    .filter((role) => role.userCount > 0)
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 8);

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Reports & Analytics', href: ROUTES.admin.reports },
          { label: 'Analytics' },
        ]}
      />
      <PageHeader
        title="Analytics"
        description="A deeper look at platform growth, revenue, and course performance."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={period}
              onValueChange={(value) =>
                setFilters({
                  period: value as DashboardRangePreset,
                  ...(value !== 'CUSTOM' ? { from: undefined, to: undefined } : {}),
                })
              }
            >
              <SelectTrigger className="w-44" aria-label="Period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
                placeholder="Select a date range"
              />
            )}
          </div>
        }
      />

      {!customRangeReady ? (
        <EmptyState
          icon={CalendarRange}
          title="Select a date range"
          description="Choose a start and end date above to view analytics for a custom range."
        />
      ) : overviewQuery.isLoading ? (
        <DashboardSkeleton />
      ) : overviewQuery.isError || !data ? (
        <ErrorState
          onRetry={() => overviewQuery.refetch()}
          description="Unable to load analytics."
        />
      ) : (
        <div className="space-y-8">
          {/* Section 1: KPIs */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatCard
              icon={Users}
              label="Active Students"
              value={data.kpis.students.active}
              tone="primary"
            />
            <StatCard
              icon={BookOpen}
              label="Published Courses"
              value={data.kpis.courses.published}
              suffix={`/ ${data.kpis.courses.total}`}
              tone="info"
            />
            <StatCard
              icon={GraduationCap}
              label="Active Enrollments"
              value={data.kpis.enrollments.active}
              tone="teal"
            />
            <StatCard
              icon={CreditCard}
              label="Pending Payments"
              value={data.kpis.payments.waitingForReview}
              tone="warning"
            />
            <StatCard
              icon={Award}
              label="Certificates Issued"
              value={data.kpis.certificates.generated}
              tone="success"
            />
          </div>

          {/* Period-over-period comparisons - only present when the backend resolved a previous window */}
          {data.kpis.comparisons && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <StatCard
                icon={UserPlus}
                label="New Students"
                value={data.kpis.comparisons.newStudents.current}
                tone="primary"
                trend={data.kpis.comparisons.newStudents}
              />
              <StatCard
                icon={GraduationCap}
                label="New Enrollments"
                value={data.kpis.comparisons.newEnrollments.current}
                tone="teal"
                trend={data.kpis.comparisons.newEnrollments}
              />
              <Can permission="dashboard.read_financial">
                {data.kpis.comparisons.revenue?.map((revenue) => (
                  <StatCard
                    key={revenue.currency}
                    icon={Banknote}
                    label={`Revenue (${revenue.currency})`}
                    value={formatCurrency(revenue.current, revenue.currency)}
                    tone="success"
                    trend={revenue}
                  />
                ))}
              </Can>
            </div>
          )}

          {/* Section 2: Growth & revenue trends */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Growth &amp; Revenue</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="New Registrations"
                description="User growth over the selected period"
                config={REGISTRATIONS_CONFIG}
              >
                <AreaChart
                  data={data.trends.registrations.map((p) => ({
                    period: p.period,
                    registrations: p.count,
                  }))}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatDate(v)}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="registrations"
                    type="monotone"
                    fill="var(--color-registrations)"
                    stroke="var(--color-registrations)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ChartCard>

              <ChartCard
                title="New Enrollments"
                description="Enrollment growth over the selected period"
                config={ENROLLMENTS_CONFIG}
              >
                <AreaChart
                  data={data.trends.enrollments.map((p) => ({
                    period: p.period,
                    enrollments: p.count,
                  }))}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatDate(v)}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="enrollments"
                    type="monotone"
                    fill="var(--color-enrollments)"
                    stroke="var(--color-enrollments)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ChartCard>

              <Can permission="dashboard.read_financial">
                {revenueTrendQuery.isLoading ? (
                  <ChartSkeleton />
                ) : revenueTrendQuery.isError ? (
                  <ChartErrorCard
                    title="Revenue Trend"
                    onRetry={() => revenueTrendQuery.refetch()}
                  />
                ) : revenueTrendQuery.data && revenueTrendQuery.data.points.length > 0 ? (
                  <ChartCard
                    title="Revenue Trend"
                    description="Approved payment revenue over the selected period"
                    config={REVENUE_TREND_CONFIG}
                  >
                    <AreaChart
                      data={revenueTrendQuery.data.points.map((p) => ({
                        period: p.period,
                        amount: Number(p.amount ?? 0),
                      }))}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatDate(v)}
                        tickMargin={8}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        dataKey="amount"
                        type="monotone"
                        fill="var(--color-amount)"
                        stroke="var(--color-amount)"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ChartCard>
                ) : (
                  <ChartEmptyCard
                    title="Revenue Trend"
                    description="No revenue data for this period."
                  />
                )}
              </Can>

              {certificatesTrendQuery.isLoading ? (
                <ChartSkeleton />
              ) : certificatesTrendQuery.isError ? (
                <ChartErrorCard
                  title="Certificate Issuance"
                  onRetry={() => certificatesTrendQuery.refetch()}
                />
              ) : certificatesTrendQuery.data && certificatesTrendQuery.data.points.length > 0 ? (
                <ChartCard
                  title="Certificate Issuance"
                  description="Certificates issued over the selected period"
                  config={CERTIFICATES_CONFIG}
                >
                  <BarChart
                    data={certificatesTrendQuery.data.points.map((p) => ({
                      period: p.period,
                      count: p.count,
                    }))}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatDate(v)}
                      tickMargin={8}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartCard>
              ) : (
                <ChartEmptyCard
                  title="Certificate Issuance"
                  description="No certificates issued in this period."
                />
              )}
            </div>
          </section>

          {/* Section 3: Payments & completions */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Payments &amp; Completions</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Can permission="dashboard.read_financial">
                <ChartCard
                  title="Payment Trends"
                  description="Payments submitted over the selected period"
                  config={PAYMENTS_CONFIG}
                >
                  <BarChart
                    data={data.trends.payments.map((p) => ({
                      period: p.period,
                      payments: p.count,
                    }))}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatDate(v)}
                      tickMargin={8}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="payments" fill="var(--color-payments)" radius={4} />
                  </BarChart>
                </ChartCard>
              </Can>

              <ChartCard
                title="Course Completions"
                description="Completions over the selected period"
                config={COMPLETIONS_CONFIG}
              >
                <BarChart
                  data={data.trends.completions.map((p) => ({
                    period: p.period,
                    completions: p.count,
                  }))}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatDate(v)}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completions" fill="var(--color-completions)" radius={4} />
                </BarChart>
              </ChartCard>
            </div>
          </section>

          {/* Section 4: Distribution */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Distribution</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <ChartCard
                title="Enrollment Status"
                description="Where enrollments stand right now"
                config={ENROLLMENT_STATUS_CONFIG}
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Pie
                    data={[
                      { key: 'active', name: 'Active', value: data.kpis.enrollments.active },
                      {
                        key: 'completed',
                        name: 'Completed',
                        value: data.kpis.enrollments.completed,
                      },
                      {
                        key: 'pendingPayment',
                        name: 'Pending payment',
                        value: data.kpis.enrollments.pendingPayment,
                      },
                      {
                        key: 'other',
                        name: 'Other (cancelled / revoked)',
                        value: Math.max(
                          0,
                          data.kpis.enrollments.total -
                            data.kpis.enrollments.active -
                            data.kpis.enrollments.completed -
                            data.kpis.enrollments.pendingPayment,
                        ),
                      },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                  >
                    {['active', 'completed', 'pendingPayment', 'other'].map((key) => (
                      <Cell key={key} fill={`var(--color-${key})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartCard>

              <ChartCard
                title="Course Status"
                description="Published vs. draft vs. archived"
                config={COURSE_STATUS_CONFIG}
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Pie
                    data={[
                      { key: 'published', name: 'Published', value: data.kpis.courses.published },
                      { key: 'draft', name: 'Draft', value: data.kpis.courses.draft },
                      {
                        key: 'archived',
                        name: 'Archived',
                        value: Math.max(
                          0,
                          data.kpis.courses.total -
                            data.kpis.courses.published -
                            data.kpis.courses.draft,
                        ),
                      },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                  >
                    {['published', 'draft', 'archived'].map((key) => (
                      <Cell key={key} fill={`var(--color-${key})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartCard>

              <Can permission="dashboard.read_financial">
                {data.kpis.revenue && data.kpis.revenue.length > 0 && (
                  <ChartCard
                    title="Revenue by Currency"
                    description="Approved payment revenue for the selected period"
                    config={REVENUE_CONFIG}
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={data.kpis.revenue.map((r) => ({
                          name: r.currency,
                          amount: Number(r.amount),
                        }))}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={50}
                        fill="var(--color-amount)"
                      />
                    </PieChart>
                  </ChartCard>
                )}
              </Can>
            </div>
          </section>

          {/* Section 5: Course performance */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Course Performance</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Can permission="dashboard.read_financial">
                {coursesByRevenueQuery.isLoading ? (
                  <ChartSkeleton />
                ) : coursesByRevenueQuery.isError ? (
                  <ChartErrorCard
                    title="Top Courses by Revenue"
                    onRetry={() => coursesByRevenueQuery.refetch()}
                  />
                ) : coursesByRevenueQuery.data && coursesByRevenueQuery.data.length > 0 ? (
                  <ChartCard
                    title="Top Courses by Revenue"
                    description="Highest-earning courses in the selected period"
                    config={COURSE_REVENUE_CONFIG}
                  >
                    <BarChart
                      layout="vertical"
                      data={coursesByRevenueQuery.data.map((course) => ({
                        title: course.title,
                        revenue: Number(course.revenue ?? 0),
                      }))}
                    >
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="title"
                        tickLine={false}
                        axisLine={false}
                        width={140}
                        tickFormatter={(value: string) =>
                          value.length > 20 ? `${value.slice(0, 20)}…` : value
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                    </BarChart>
                  </ChartCard>
                ) : (
                  <ChartEmptyCard
                    title="Top Courses by Revenue"
                    description="No revenue data for this period."
                  />
                )}
              </Can>

              {lowCompletionQuery.isLoading ? (
                <ChartSkeleton />
              ) : lowCompletionQuery.isError ? (
                <ChartErrorCard
                  title="Lowest Completion Rates"
                  onRetry={() => lowCompletionQuery.refetch()}
                />
              ) : lowCompletionQuery.data && lowCompletionQuery.data.length > 0 ? (
                <ChartCard
                  title="Lowest Completion Rates"
                  description="Courses that may need attention"
                  config={LOW_COMPLETION_CONFIG}
                >
                  <BarChart
                    layout="vertical"
                    data={lowCompletionQuery.data.map((course) => ({
                      title: course.title,
                      rate: Number(course.completion_rate ?? 0),
                    }))}
                  >
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} unit="%" />
                    <YAxis
                      type="category"
                      dataKey="title"
                      tickLine={false}
                      axisLine={false}
                      width={140}
                      tickFormatter={(value: string) =>
                        value.length > 20 ? `${value.slice(0, 20)}…` : value
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="rate" fill="var(--color-rate)" radius={4} />
                  </BarChart>
                </ChartCard>
              ) : (
                <ChartEmptyCard
                  title="Lowest Completion Rates"
                  description="No completion data for this period."
                />
              )}
            </div>
          </section>

          {/* Section 6: Catalog & team */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Catalog &amp; Team</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {coursesQuery.isLoading ? (
                <ChartSkeleton />
              ) : coursesQuery.isError ? (
                <ChartErrorCard
                  title="Courses by Category"
                  onRetry={() => coursesQuery.refetch()}
                />
              ) : categoryDistribution.length > 0 ? (
                <ChartCard
                  title="Courses by Category"
                  description="Where course content is concentrated"
                  config={CATEGORY_CONFIG}
                >
                  <BarChart data={categoryDistribution}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="category"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value: string) =>
                        value.length > 12 ? `${value.slice(0, 12)}…` : value
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartCard>
              ) : (
                <ChartEmptyCard
                  title="Courses by Category"
                  description="No published courses yet."
                />
              )}

              {rolesQuery.isLoading ? (
                <ChartSkeleton />
              ) : rolesQuery.isError ? (
                <ChartErrorCard title="Role Distribution" onRetry={() => rolesQuery.refetch()} />
              ) : roleDistribution.length > 0 ? (
                <ChartCard
                  title="Role Distribution"
                  description="Users grouped by assigned role"
                  config={ROLE_CONFIG}
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Pie
                      data={roleDistribution.map((role) => ({
                        name: role.name,
                        count: role.userCount,
                      }))}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={50}
                    >
                      {roleDistribution.map((role, index) => (
                        <Cell key={role.id} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartCard>
              ) : (
                <ChartEmptyCard
                  title="Role Distribution"
                  description="No users have been assigned a role yet."
                />
              )}
            </div>
          </section>

          {/* Section 7: Promotions */}
          <Can permission="promotions.view_analytics">
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Promotions</h2>
              {campaignAnalyticsQuery.isLoading ? (
                <ChartSkeleton />
              ) : campaignAnalyticsQuery.isError ? (
                <ChartErrorCard
                  title="Top Campaigns by Redemptions"
                  onRetry={() => campaignAnalyticsQuery.refetch()}
                />
              ) : campaignAnalyticsQuery.data &&
                campaignAnalyticsQuery.data.topCampaigns.length > 0 ? (
                <ChartCard
                  title="Top Campaigns by Redemptions"
                  description={`${campaignAnalyticsQuery.data.totalRedemptions} total redemptions · ${campaignAnalyticsQuery.data.conversionRate}% conversion rate`}
                  config={CAMPAIGN_CONFIG}
                >
                  <BarChart
                    data={campaignAnalyticsQuery.data.topCampaigns.map((c) => ({
                      name: c.campaignName,
                      redemptions: c.redemptions,
                    }))}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value: string) =>
                        value.length > 12 ? `${value.slice(0, 12)}…` : value
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="redemptions" fill="var(--color-redemptions)" radius={4} />
                  </BarChart>
                </ChartCard>
              ) : (
                <ChartEmptyCard
                  title="Top Campaigns by Redemptions"
                  description="No coupon redemptions yet."
                />
              )}
            </section>
          </Can>

          {/* Section 8: Course performance table */}
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No course performance data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enrollments</TableHead>
                        <TableHead>New</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Completion Rate</TableHead>
                        <Can permission="dashboard.read_financial">
                          <TableHead>Revenue</TableHead>
                        </Can>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium text-foreground">
                            {course.title}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={course.status === 'PUBLISHED' ? 'success' : 'secondary'}
                            >
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{course.total_enrollments}</TableCell>
                          <TableCell>{course.new_enrollments}</TableCell>
                          <TableCell>{course.completed_enrollments}</TableCell>
                          <TableCell>{course.completion_rate ?? '—'}</TableCell>
                          <Can permission="dashboard.read_financial">
                            <TableCell>
                              {course.revenue ? formatCurrency(course.revenue) : '—'}
                            </TableCell>
                          </Can>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </ContentContainer>
  );
}
