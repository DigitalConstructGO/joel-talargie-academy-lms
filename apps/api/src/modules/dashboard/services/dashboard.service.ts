import { Injectable } from '@nestjs/common';
import { sql } from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import type {
  DashboardQueryDto,
  DashboardTrendQueryDto,
  CoursePerformanceQueryDto,
} from '../dto/dashboard-query.dto';
import {
  DashboardDateRangeService,
  type DashboardRange,
} from './dashboard-date-range.service';
import { ReportPrivacyService } from '../../administration/reports/services/report-privacy.service';

type Row = Record<string, unknown>;
interface DashboardAccess {
  financial: boolean;
  sensitive: boolean;
  activity: boolean;
  health: boolean;
}
@Injectable()
export class DashboardService {
  constructor(
    private readonly database: DatabaseService,
    private readonly dates: DashboardDateRangeService,
    private readonly privacy: ReportPrivacyService,
  ) {}
  private async rows(query: ReturnType<typeof sql>): Promise<Row[]> {
    const result = await this.database.client.execute(query);
    return ((result as unknown as { rows?: Row[] }).rows ?? []) as Row[];
  }
  private access(permissions: string[]): DashboardAccess {
    return {
      financial: permissions.includes('dashboard.read_financial'),
      sensitive: permissions.includes('dashboard.read_sensitive'),
      activity: permissions.includes('dashboard.read_administrator_activity'),
      health: permissions.includes('dashboard.read_operational_health'),
    };
  }
  private comparison(current: number, previous: number | null) {
    const change = previous == null ? null : current - previous;
    return {
      current,
      previous,
      change,
      changePercentage:
        previous && change != null
          ? ((change / previous) * 100).toFixed(2)
          : null,
      direction:
        previous == null
          ? 'NOT_AVAILABLE'
          : change! > 0
            ? 'UP'
            : change! < 0
              ? 'DOWN'
              : 'FLAT',
    };
  }
  async kpis(query: DashboardQueryDto, permissions: string[]) {
    const range = this.dates.resolve(query);
    const access = this.access(permissions);
    const current = await this.rows(sql`
      SELECT
        (SELECT count(DISTINCT ur.user_id)::int FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.code='STUDENT') total_students,
        (SELECT count(DISTINCT ur.user_id)::int FROM user_roles ur JOIN roles r ON r.id=ur.role_id JOIN users u ON u.id=ur.user_id WHERE r.code='STUDENT' AND u.status='ACTIVE') active_students,
        (SELECT count(DISTINCT ur.user_id)::int FROM user_roles ur JOIN roles r ON r.id=ur.role_id JOIN users u ON u.id=ur.user_id WHERE r.code='STUDENT' AND u.status='PENDING_VERIFICATION') pending_verification_students,
        (SELECT count(*)::int FROM courses) total_courses,
        (SELECT count(*)::int FROM courses WHERE status='PUBLISHED' AND archived_at IS NULL) published_courses,
        (SELECT count(*)::int FROM courses WHERE status='DRAFT' AND archived_at IS NULL) draft_courses,
        (SELECT count(*)::int FROM enrollments) total_enrollments,
        (SELECT count(*)::int FROM enrollments WHERE status IN ('ENROLLED','IN_PROGRESS')) active_enrollments,
        (SELECT count(*)::int FROM enrollments WHERE status='PENDING_PAYMENT') pending_payment_enrollments,
        (SELECT count(*)::int FROM enrollments WHERE status='COMPLETED') completed_enrollments,
        (SELECT count(*)::int FROM payments WHERE status='PENDING') pending_payment_reviews,
        (SELECT count(*)::int FROM certificates WHERE status='GENERATED') certificates_generated,
        (SELECT count(*)::int FROM certificates WHERE status IN ('PENDING','FAILED')) certificates_attention,
        (SELECT count(*)::int FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='STUDENT' AND u.created_at >= ${range.from} AND u.created_at < ${range.to}) new_students,
        (SELECT count(*)::int FROM enrollments WHERE created_at >= ${range.from} AND created_at < ${range.to}) new_enrollments
    `);
    const base = current[0] ?? {};
    const data: Record<string, unknown> = {
      students: {
        total: Number(base.total_students ?? 0),
        active: Number(base.active_students ?? 0),
        pendingVerification: Number(base.pending_verification_students ?? 0),
        newDuringPeriod: Number(base.new_students ?? 0),
      },
      courses: {
        total: Number(base.total_courses ?? 0),
        published: Number(base.published_courses ?? 0),
        draft: Number(base.draft_courses ?? 0),
      },
      enrollments: {
        total: Number(base.total_enrollments ?? 0),
        active: Number(base.active_enrollments ?? 0),
        pendingPayment: Number(base.pending_payment_enrollments ?? 0),
        completed: Number(base.completed_enrollments ?? 0),
        newDuringPeriod: Number(base.new_enrollments ?? 0),
      },
      payments: { waitingForReview: Number(base.pending_payment_reviews ?? 0) },
      certificates: {
        generated: Number(base.certificates_generated ?? 0),
        attention: Number(base.certificates_attention ?? 0),
      },
    };
    if (access.financial)
      data.revenue = await this.rows(
        sql`SELECT currency, coalesce(sum(amount),0)::text amount FROM payments WHERE status='APPROVED' AND reviewed_at >= ${range.from} AND reviewed_at < ${range.to} GROUP BY currency ORDER BY currency`,
      );
    return { range: this.presentRange(range), kpis: data };
  }
  private presentRange(range: DashboardRange) {
    return {
      preset: range.preset,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      timezone: range.timezone,
      previous: range.previous && {
        from: range.previous.from.toISOString(),
        to: range.previous.to.toISOString(),
      },
    };
  }
  async trend(
    kind:
      | 'registrations'
      | 'enrollments'
      | 'payments'
      | 'revenue'
      | 'completions'
      | 'certificates',
    query: DashboardTrendQueryDto,
  ) {
    const range = this.dates.resolve(query);
    const unit = query.granularity.toLowerCase();
    const safeRows = await this.rows(
      kind === 'revenue'
        ? sql`SELECT date_trunc(${unit}, reviewed_at) period, currency, count(*)::int count, coalesce(sum(amount),0)::text amount FROM payments WHERE status='APPROVED' AND reviewed_at >= ${range.from} AND reviewed_at < ${range.to} GROUP BY 1,2 ORDER BY 1,2`
        : kind === 'registrations'
          ? sql`SELECT date_trunc(${unit}, created_at) period, count(*)::int count FROM users WHERE created_at >= ${range.from} AND created_at < ${range.to} GROUP BY 1 ORDER BY 1`
          : kind === 'completions'
            ? sql`SELECT date_trunc(${unit}, completed_at) period, count(*)::int count FROM enrollments WHERE status='COMPLETED' AND completed_at >= ${range.from} AND completed_at < ${range.to} GROUP BY 1 ORDER BY 1`
            : kind === 'payments'
              ? sql`SELECT date_trunc(${unit}, reviewed_at) period, count(*)::int count FROM payments WHERE reviewed_at >= ${range.from} AND reviewed_at < ${range.to} GROUP BY 1 ORDER BY 1`
              : kind === 'certificates'
                ? sql`SELECT date_trunc(${unit}, issued_at) period, count(*)::int count FROM certificates WHERE issued_at >= ${range.from} AND issued_at < ${range.to} GROUP BY 1 ORDER BY 1`
                : sql`SELECT date_trunc(${unit}, created_at) period, count(*)::int count FROM enrollments WHERE created_at >= ${range.from} AND created_at < ${range.to} GROUP BY 1 ORDER BY 1`,
    );
    return {
      range: this.presentRange(range),
      granularity: query.granularity,
      points: safeRows,
    };
  }
  async pendingPayments(limit: number, financial: boolean) {
    const rows = await this.rows(
      sql`SELECT p.id payment_id, p.enrollment_id, p.status, p.currency, p.amount, p.expected_amount_snapshot, p.amount_mismatch, p.duplicate_transaction_count, p.submitted_at, u.id student_id, up.first_name, up.last_name, c.id course_id, c.title course_title FROM payments p JOIN enrollments e ON e.id=p.enrollment_id JOIN users u ON u.id=e.student_id LEFT JOIN user_profiles up ON up.user_id=u.id JOIN courses c ON c.id=e.course_id WHERE p.status='PENDING' ORDER BY p.submitted_at ASC,p.id ASC LIMIT ${limit}`,
    );
    return rows.map((row) => ({
      paymentId: row.payment_id,
      enrollmentId: row.enrollment_id,
      student: {
        id: row.student_id,
        name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
      },
      course: { id: row.course_id, title: row.course_title },
      currency: row.currency,
      amountMismatch: row.amount_mismatch,
      duplicateTransactionWarning:
        Number(row.duplicate_transaction_count ?? 0) > 0,
      submittedAt: row.submitted_at,
      waitingSeconds: Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(String(row.submitted_at)).getTime()) / 1000,
        ),
      ),
      ...(financial
        ? {
            submittedAmount: row.amount,
            expectedAmount: row.expected_amount_snapshot,
          }
        : {}),
    }));
  }
  async recentStudents(limit: number, sensitive: boolean) {
    const rows = await this.rows(
      sql`SELECT u.id,u.email,u.status,u.email_verified,u.provider,u.created_at,u.last_login_at,up.first_name,up.last_name FROM users u LEFT JOIN user_profiles up ON up.user_id=u.id ORDER BY u.created_at DESC,u.id DESC LIMIT ${limit}`,
    );
    return rows.map((row) => ({
      id: row.id,
      name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
      email: sensitive ? row.email : this.privacy.maskEmail(String(row.email)),
      status: row.status,
      emailVerified: row.email_verified,
      provider: row.provider,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
    }));
  }
  async recentEnrollments(limit: number, financial: boolean) {
    const rows = await this.rows(
      sql`SELECT e.id,e.status,e.progress_percentage,e.created_at,e.enrolled_at,e.started_at,e.completed_at,c.id course_id,c.title course_title,u.id student_id,up.first_name,up.last_name,e.price_at_enrollment,e.currency_at_enrollment FROM enrollments e JOIN courses c ON c.id=e.course_id JOIN users u ON u.id=e.student_id LEFT JOIN user_profiles up ON up.user_id=u.id ORDER BY e.created_at DESC,e.id DESC LIMIT ${limit}`,
    );
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      progressPercentage: row.progress_percentage,
      createdAt: row.created_at,
      enrolledAt: row.enrolled_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      course: { id: row.course_id, title: row.course_title },
      student: {
        id: row.student_id,
        name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
      },
      ...(financial
        ? {
            priceSnapshot: row.price_at_enrollment,
            currency: row.currency_at_enrollment,
          }
        : {}),
    }));
  }
  async recentCompletions(limit: number) {
    return this.rows(
      sql`SELECT e.id enrollment_id,e.started_at,e.completed_at,c.title course_title,u.id student_id,up.first_name,up.last_name,cert.status certificate_status,cert.certificate_number FROM enrollments e JOIN courses c ON c.id=e.course_id JOIN users u ON u.id=e.student_id LEFT JOIN user_profiles up ON up.user_id=u.id LEFT JOIN certificates cert ON cert.enrollment_id=e.id WHERE e.status='COMPLETED' ORDER BY e.completed_at DESC,e.id DESC LIMIT ${limit}`,
    );
  }
  async recentCertificates(limit: number) {
    return this.rows(
      sql`SELECT id,certificate_number,student_name_at_issue,course_title_at_issue,status,issued_at,generated_at,revoked_at,generation_version FROM certificates ORDER BY created_at DESC,id DESC LIMIT ${limit}`,
    );
  }
  async distribution(query: DashboardQueryDto) {
    const range = this.dates.resolve(query);
    const [row] = await this.rows(
      sql`SELECT count(*) FILTER (WHERE c.access_type='FREE')::int free_count,count(*) FILTER (WHERE c.access_type='PAID')::int paid_count FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.created_at>=${range.from} AND e.created_at<${range.to}`,
    );
    const free = Number(row?.free_count ?? 0),
      paid = Number(row?.paid_count ?? 0),
      total = free + paid;
    return {
      range: this.presentRange(range),
      freeCount: free,
      paidCount: paid,
      freePercentage: total ? ((free * 100) / total).toFixed(2) : null,
      paidPercentage: total ? ((paid * 100) / total).toFixed(2) : null,
    };
  }
  async lowCompletion(query: CoursePerformanceQueryDto) {
    const range = this.dates.resolve(query);
    return this.rows(
      sql`SELECT c.id,c.title,count(e.id) FILTER (WHERE e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED'))::int relevant_enrollments,count(e.id) FILTER (WHERE e.status='COMPLETED')::int completed_enrollments,CASE WHEN count(e.id) FILTER (WHERE e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED'))=0 THEN NULL ELSE round(100.0*count(e.id) FILTER (WHERE e.status='COMPLETED')/count(e.id) FILTER (WHERE e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED')),2)::text END completion_rate,round(avg(e.progress_percentage),2)::text average_progress FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id AND e.created_at>=${range.from} AND e.created_at<${range.to} GROUP BY c.id HAVING count(e.id) FILTER (WHERE e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED')) >= 5 ORDER BY completion_rate ASC NULLS LAST,c.id ASC LIMIT ${query.limit}`,
    );
  }
  async coursePerformance(
    query: CoursePerformanceQueryDto,
    financial: boolean,
  ) {
    const range = this.dates.resolve(query);
    const order = {
      ENROLLMENTS: 'new_enrollments DESC',
      COMPLETIONS: 'completed_enrollments DESC',
      COMPLETION_RATE: 'completion_rate DESC NULLS LAST',
      AVERAGE_PROGRESS: 'average_progress DESC',
      REVENUE: 'revenue DESC NULLS LAST',
    }[query.sort];
    const rows = await this.rows(
      sql.raw(
        `SELECT c.id,c.title,c.status,c.access_type,count(e.id)::int total_enrollments,count(e.id) FILTER (WHERE e.created_at >= '${range.from.toISOString()}' AND e.created_at < '${range.to.toISOString()}')::int new_enrollments,count(e.id) FILTER (WHERE e.status='COMPLETED')::int completed_enrollments,round(avg(e.progress_percentage),2)::text average_progress,CASE WHEN count(e.id) FILTER (WHERE e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED'))=0 THEN NULL ELSE round(100.0*count(e.id) FILTER (WHERE e.status='COMPLETED')/count(e.id) FILTER (WHERE e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED')),2) END::text completion_rate ${financial ? ",coalesce(sum(p.amount) FILTER (WHERE p.status='APPROVED' AND p.reviewed_at >= '" + range.from.toISOString() + "' AND p.reviewed_at < '" + range.to.toISOString() + "'),0)::text revenue" : ''} FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id ${financial ? 'LEFT JOIN payments p ON p.enrollment_id=e.id' : ''} GROUP BY c.id ORDER BY ${order} LIMIT ${query.limit}`,
      ),
    );
    return rows;
  }
  async overview(query: DashboardQueryDto, permissions: string[]) {
    const access = this.access(permissions);
    const kpis = await this.kpis(query, permissions);
    const [
      registrations,
      enrollments,
      payments,
      completions,
      pending,
      recentStudents,
      recentEnrollments,
      recentCertificates,
      topCourses,
    ] = await Promise.all([
      this.trend('registrations', { ...query, granularity: 'DAY' }),
      this.trend('enrollments', { ...query, granularity: 'DAY' }),
      this.trend('payments', { ...query, granularity: 'DAY' }),
      this.trend('completions', { ...query, granularity: 'DAY' }),
      this.pendingPayments(query.previewLimit, access.financial),
      this.recentStudents(query.previewLimit, access.sensitive),
      this.rows(
        sql`SELECT e.id,e.status,e.progress_percentage,e.created_at,c.title course_title FROM enrollments e JOIN courses c ON c.id=e.course_id ORDER BY e.created_at DESC,e.id DESC LIMIT ${query.previewLimit}`,
      ),
      this.rows(
        sql`SELECT id,certificate_number,student_name_at_issue,course_title_at_issue,status,issued_at,generated_at FROM certificates ORDER BY created_at DESC,id DESC LIMIT ${query.previewLimit}`,
      ),
      this.coursePerformance(
        { ...query, sort: 'ENROLLMENTS', limit: query.previewLimit },
        access.financial,
      ),
    ]);
    const data: Record<string, unknown> = {
      ...kpis,
      trends: {
        registrations: registrations.points,
        enrollments: enrollments.points,
        payments: payments.points,
        completions: completions.points,
      },
      previews: {
        pendingPayments: pending,
        recentStudents,
        recentEnrollments,
        recentCertificates,
      },
      topCourses,
    };
    if (access.activity)
      data.recentActivity = await this.recentActivity(
        query.previewLimit,
        access.sensitive,
      );
    if (access.health) data.operationalAlerts = await this.health();
    return data;
  }
  async recentActivity(limit: number, sensitive: boolean) {
    const rows = await this.rows(
      sql`SELECT id,actor_id,action,entity_type,entity_id,ip_address,created_at FROM activity_logs ORDER BY created_at DESC,id DESC LIMIT ${limit}`,
    );
    return rows.map((row) => ({
      ...row,
      ipAddress: sensitive
        ? row.ip_address
        : this.privacy.maskIp(row.ip_address as string | null),
    }));
  }
  async health() {
    const [row] = await this.rows(
      sql`SELECT (SELECT count(*)::int FROM payments WHERE status='PENDING' AND submitted_at < now()-interval '24 hours') old_payments,(SELECT count(*)::int FROM certificates WHERE status='FAILED') failed_certificates,(SELECT count(*)::int FROM email_deliveries WHERE status='FAILED') failed_emails,(SELECT count(*)::int FROM report_exports WHERE status='FAILED') failed_exports`,
    );
    const alerts = [] as Row[];
    for (const [key, code, message] of [
      [
        'old_payments',
        'PAYMENTS_WAITING_TOO_LONG',
        'Payments have been waiting for review longer than 24 hours.',
      ],
      [
        'failed_certificates',
        'FAILED_CERTIFICATE_GENERATION',
        'Certificate generation has failed.',
      ],
      [
        'failed_emails',
        'FAILED_EMAIL_DELIVERIES',
        'Email deliveries have failed.',
      ],
      [
        'failed_exports',
        'FAILED_REPORT_EXPORTS',
        'Report exports have failed.',
      ],
    ] as const) {
      const value = Number(row?.[key] ?? 0);
      if (value)
        alerts.push({
          code,
          severity: 'HIGH',
          count: value,
          message,
          actionUrl: '/admin',
        });
    }
    return alerts;
  }
}
