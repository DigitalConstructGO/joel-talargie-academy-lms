'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  CreditCard,
  GraduationCap,
  Users,
  Wallet,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { ContentContainer } from '@/components/layout/content-container';
import { Reveal } from '@/components/common/reveal';
import { ErrorState } from '@/components/common/error-state';
import { ChartCard } from '@/components/common/chart-card';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { StatCard } from '@/components/dashboard/stat-card';
import { QuickActionCard } from '@/components/dashboard/quick-action-card';
import { ActivityCard, type ActivityItem } from '@/components/dashboard/activity-card';
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
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';
import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard';
import { formatCurrency } from '@/lib/format';
import { formatDate, formatDateTime } from '@/lib/date';

const QUICK_ACTIONS = [
  {
    icon: Users,
    label: 'User Management',
    description: 'Manage accounts',
    href: ROUTES.admin.users,
  },
  {
    icon: GraduationCap,
    label: 'Academic Management',
    description: 'Courses & categories',
    href: ROUTES.admin.academics,
  },
  {
    icon: Wallet,
    label: 'Financial Management',
    description: 'Payments & promotions',
    href: ROUTES.admin.financial,
  },
  {
    icon: BarChart3,
    label: 'Reports & Analytics',
    description: 'Platform insights',
    href: ROUTES.admin.reports,
  },
];

const TREND_CHART_CONFIG = {
  registrations: { label: 'New students', color: '#3b82f6' },
  enrollments: { label: 'New enrollments', color: '#10b981' },
} satisfies ChartConfig;

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName ?? 'Administrator';
  const overviewQuery = useDashboardOverview();
  const data = overviewQuery.data;

  if (overviewQuery.isLoading) {
    return (
      <ContentContainer>
        <DashboardSkeleton />
      </ContentContainer>
    );
  }

  if (overviewQuery.isError || !data) {
    return (
      <ContentContainer>
        <ErrorState
          onRetry={() => overviewQuery.refetch()}
          description="Unable to load dashboard data."
        />
      </ContentContainer>
    );
  }

  const trendData = (data.trends?.registrations ?? []).map((point, index) => ({
    period: point.period,
    registrations: point.count,
    enrollments: data.trends?.enrollments?.[index]?.count ?? 0,
  }));

  const activityItems: ActivityItem[] = (data.recentActivity ?? []).map((entry) => ({
    id: entry.id,
    description: entry.action.replaceAll('.', ' ').replaceAll('_', ' '),
    timestamp: formatDateTime(entry.created_at),
  }));

  return (
    <ContentContainer>
      <Reveal>
        <WelcomeBanner
          greeting={`Welcome back, ${firstName} 👋`}
          description={`${data.kpis?.students?.active ?? 0} active students across ${data.kpis?.courses?.published ?? 0} published courses.`}
          ctaLabel="View Reports"
          ctaHref={ROUTES.admin.reports}
          ctaIcon={BarChart3}
        />
      </Reveal>

      {data.operationalAlerts && data.operationalAlerts.length > 0 && (
        <Reveal delaySeconds={0.02}>
          <div className="space-y-2">
            {data.operationalAlerts.map((alert) => (
              <div
                key={alert.code}
                className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning"
              >
                <AlertTriangle className="size-4 shrink-0" />
                {alert.message} ({alert.count})
              </div>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal delaySeconds={0.05}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {data.kpis?.students && (
            <StatCard
              icon={Users}
              label="Active Students"
              value={data.kpis.students.active}
              tone="primary"
            />
          )}
          {data.kpis?.courses && (
            <StatCard
              icon={BookOpen}
              label="Published Courses"
              value={data.kpis.courses.published}
              suffix={`/ ${data.kpis.courses.total}`}
              tone="info"
            />
          )}
          {data.kpis?.enrollments && (
            <StatCard
              icon={GraduationCap}
              label="Active Enrollments"
              value={data.kpis.enrollments.active}
              tone="teal"
            />
          )}
          {data.kpis?.payments && (
            <StatCard
              icon={CreditCard}
              label="Pending Payments"
              value={data.kpis.payments.waitingForReview}
              tone="warning"
            />
          )}
          {data.kpis?.revenue ? (
            <StatCard
              icon={Wallet}
              label="Revenue (period)"
              value={formatCurrency(
                data.kpis.revenue[0]?.amount ?? '0',
                data.kpis.revenue[0]?.currency,
              )}
              tone="success"
            />
          ) : data.kpis?.certificates ? (
            <StatCard
              icon={Award}
              label="Certificates Issued"
              value={data.kpis.certificates.generated}
              tone="success"
            />
          ) : null}
        </div>
      </Reveal>

      <Reveal delaySeconds={0.1}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard key={action.label} {...action} />
          ))}
        </div>
      </Reveal>

      <Reveal delaySeconds={0.15}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard
            title="Registrations & Enrollments"
            description="Last 14 days"
            config={TREND_CHART_CONFIG}
            className="lg:col-span-2"
          >
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dashRegGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient id="dashEnrollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatDate(value)}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="registrations" fill="url(#dashRegGrad)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="enrollments" fill="url(#dashEnrollGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ActivityCard
            title="Recent activity"
            items={activityItems}
            emptyLabel={
              data.recentActivity
                ? 'No recent administrator activity.'
                : "You don't have permission to view administrator activity."
            }
          />
        </div>
      </Reveal>

      <Reveal delaySeconds={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>New enrollments</TableHead>
                    <TableHead>Completion rate</TableHead>
                    {data.kpis?.revenue && <TableHead>Revenue</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topCourses.map((course) => {
                    const cid = course.courseId || course.id || '';
                    return (
                      <TableRow key={cid || course.title}>
                        <TableCell>
                          <Link
                            href={ROUTES.admin.academicsCourseDetail(cid)}
                            className="hover:underline"
                          >
                            {course.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={course.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {course.new_enrollments ?? course.totalEnrollments ?? 0}
                        </TableCell>
                        <TableCell>
                          {course.completion_rate !== null && course.completion_rate !== undefined
                            ? `${course.completion_rate}%`
                            : course.completionRate !== null && course.completionRate !== undefined
                              ? `${course.completionRate}%`
                              : '—'}
                        </TableCell>
                        {data.kpis?.revenue && (
                          <TableCell>
                            {course.revenue ? formatCurrency(course.revenue) : '—'}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      <Reveal delaySeconds={0.25}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.previews?.pendingPayments ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>
              ) : (
                (data.previews?.pendingPayments ?? []).map((payment) => (
                  <Link
                    key={payment.paymentId}
                    href={ROUTES.admin.financialPayments}
                    className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <p className="truncate font-medium text-foreground">{payment.student.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{payment.course.title}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.previews?.recentStudents ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No new students yet.</p>
              ) : (
                (data.previews?.recentStudents ?? []).map((student) => (
                  <Link
                    key={student.id}
                    href={ROUTES.admin.userDetail(student.id)}
                    className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <p className="truncate font-medium text-foreground">
                      {student.name || student.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(student.createdAt)}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent certificates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.previews?.recentCertificates ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No certificates issued yet.</p>
              ) : (
                (data.previews?.recentCertificates ?? []).map((certificate) => (
                  <div
                    key={certificate.id}
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <p className="truncate font-medium text-foreground">
                      {certificate.student_name_at_issue}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {certificate.course_title_at_issue}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </Reveal>
    </ContentContainer>
  );
}
