import { Injectable } from '@nestjs/common';
import { sql } from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import { DashboardDateRangeService } from './dashboard-date-range.service';
import type {
  DashboardQueryDto,
  DashboardTrendQueryDto,
  CoursePerformanceQueryDto,
} from '../dto/dashboard-query.dto';

type Row = Record<string, unknown>;

/**
 * Staff Course Dashboard Service
 *
 * Data isolation: ALL queries enforce `courses.created_by = :staffUserId`.
 * Works for ANY staff role (INSTRUCTOR, COURSE_MANAGER, custom role, etc.)
 * — never relies on a hardcoded role code.
 *
 * If the caller is an ADMINISTRATOR (isAdministrator = true), the
 * ownership filter is omitted so admins still see the full platform view
 * via the existing AdminDashboardController — this service is only invoked
 * for non-admin staff.
 */
@Injectable()
export class StaffCourseDashboardService {
  constructor(
    private readonly database: DatabaseService,
    private readonly dates: DashboardDateRangeService,
  ) {}

  private async rows(query: ReturnType<typeof sql>): Promise<Row[]> {
    const result: any = await this.database.client.execute(query);
    if (Array.isArray(result)) return result;
    return ((result as unknown as { rows?: Row[] })?.rows ?? []) as Row[];
  }

  private presentRange(
    range: ReturnType<DashboardDateRangeService['resolve']>,
  ) {
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

  /** KPI cards scoped to courses owned by this staff user. */
  async kpis(
    staffUserId: string,
    query: DashboardQueryDto,
    showFinancial: boolean,
  ) {
    const range = this.dates.resolve(query);
    const [row] = await this.rows(sql`
      SELECT
        -- Courses owned by this staff member
        (SELECT count(*) FROM courses WHERE created_by = ${staffUserId} AND archived_at IS NULL) my_courses,
        (SELECT count(*) FROM courses WHERE created_by = ${staffUserId} AND status = 'PUBLISHED' AND archived_at IS NULL) my_published_courses,
        (SELECT count(*) FROM courses WHERE created_by = ${staffUserId} AND status = 'DRAFT' AND archived_at IS NULL) my_draft_courses,

        -- Enrollments in this staff member's courses
        (SELECT count(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${staffUserId} AND e.status IN ('ENROLLED','IN_PROGRESS')) my_active_enrollments,
        (SELECT count(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${staffUserId} AND e.status = 'COMPLETED') my_completed_enrollments,
        (SELECT count(DISTINCT e.student_id) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${staffUserId}) my_total_students,

        -- Period-scoped new enrollments
        (SELECT count(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${staffUserId} AND e.created_at >= ${range.from} AND e.created_at < ${range.to}) my_new_enrollments_period,

        -- Completion rate across all this staff member's courses
        (SELECT CASE WHEN count(CASE WHEN e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED') THEN 1 END) = 0 THEN NULL ELSE round(100.0 * count(CASE WHEN e.status = 'COMPLETED' THEN 1 END) / count(CASE WHEN e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED') THEN 1 END), 2) END FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${staffUserId}) my_completion_rate,

        -- Certificates issued for this staff member's courses
        (SELECT count(*) FROM certificates cert JOIN enrollments e ON e.id = cert.enrollment_id JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${staffUserId} AND cert.status = 'GENERATED') my_certificates_issued
    `);

    const kpis: Record<string, unknown> = {
      myCourses: {
        total: Number(row?.my_courses ?? 0),
        published: Number(row?.my_published_courses ?? 0),
        draft: Number(row?.my_draft_courses ?? 0),
      },
      myStudents: {
        total: Number(row?.my_total_students ?? 0),
        activeEnrollments: Number(row?.my_active_enrollments ?? 0),
        completedEnrollments: Number(row?.my_completed_enrollments ?? 0),
        newEnrollmentsDuringPeriod: Number(row?.my_new_enrollments_period ?? 0),
      },
      myCompletionRate: row?.my_completion_rate ?? null,
      myCertificatesIssued: Number(row?.my_certificates_issued ?? 0),
    };

    if (showFinancial) {
      const revenueRows = await this.rows(sql`
        SELECT p.currency, coalesce(sum(p.amount), 0) amount
        FROM payments p
        JOIN enrollments e ON e.id = p.enrollment_id
        JOIN courses c ON c.id = e.course_id
        WHERE c.created_by = ${staffUserId}
          AND p.status = 'APPROVED'
          AND p.reviewed_at >= ${range.from}
          AND p.reviewed_at < ${range.to}
        GROUP BY p.currency
        ORDER BY p.currency
      `);
      kpis.myRevenue = revenueRows;
    }

    return { range: this.presentRange(range), kpis };
  }

  /** Enrollment trend for courses owned by this staff member. */
  async enrollmentTrend(staffUserId: string, query: DashboardTrendQueryDto) {
    const range = this.dates.resolve(query);
    const rows = await this.rows(sql`
      SELECT strftime('%Y-%m-%d 00:00:00', datetime(e.created_at / 1000, 'unixepoch')) period, count(*) count
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE c.created_by = ${staffUserId}
        AND e.created_at >= ${range.from}
        AND e.created_at < ${range.to}
      GROUP BY 1
      ORDER BY 1
    `);
    return {
      range: this.presentRange(range),
      granularity: query.granularity,
      points: rows,
    };
  }

  /** Completion trend for courses owned by this staff member. */
  async completionTrend(staffUserId: string, query: DashboardTrendQueryDto) {
    const range = this.dates.resolve(query);
    const rows = await this.rows(sql`
      SELECT strftime('%Y-%m-%d 00:00:00', datetime(e.completed_at / 1000, 'unixepoch')) period, count(*) count
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE c.created_by = ${staffUserId}
        AND e.status = 'COMPLETED'
        AND e.completed_at >= ${range.from}
        AND e.completed_at < ${range.to}
      GROUP BY 1
      ORDER BY 1
    `);
    return {
      range: this.presentRange(range),
      granularity: query.granularity,
      points: rows,
    };
  }

  /** Per-course performance table scoped to this staff member's courses. */
  async coursePerformance(
    staffUserId: string,
    query: CoursePerformanceQueryDto,
    showFinancial: boolean,
  ) {
    const range = this.dates.resolve(query);
    const order =
      {
        ENROLLMENTS: sql.raw('new_enrollments DESC'),
        COMPLETIONS: sql.raw('completed_enrollments DESC'),
        COMPLETION_RATE: sql.raw('completion_rate DESC'),
        AVERAGE_PROGRESS: sql.raw('average_progress DESC'),
        REVENUE: sql.raw('revenue DESC'),
      }[query.sort] ?? sql.raw('new_enrollments DESC');

    const financialSelect = showFinancial
      ? sql`, coalesce(sum(CASE WHEN p.status='APPROVED' AND p.reviewed_at >= ${range.from} AND p.reviewed_at < ${range.to} THEN p.amount ELSE 0 END), 0) revenue`
      : sql``;
    const financialJoin = showFinancial
      ? sql`LEFT JOIN payments p ON p.enrollment_id = e.id`
      : sql``;

    return this.rows(sql`
      SELECT
        c.id,
        c.title,
        c.status,
        c.access_type,
        count(e.id) total_enrollments,
        count(CASE WHEN e.created_at >= ${range.from} AND e.created_at < ${range.to} THEN 1 END) new_enrollments,
        count(CASE WHEN e.status = 'COMPLETED' THEN 1 END) completed_enrollments,
        round(avg(e.progress_percentage), 2) average_progress,
        CASE WHEN count(CASE WHEN e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED') THEN 1 END) = 0
          THEN NULL
          ELSE round(100.0 * count(CASE WHEN e.status='COMPLETED' THEN 1 END) / count(CASE WHEN e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED') THEN 1 END), 2)
        END completion_rate
        ${financialSelect}
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      ${financialJoin}
      WHERE c.created_by = ${staffUserId} AND c.archived_at IS NULL
      GROUP BY c.id
      ORDER BY ${order}
      LIMIT ${query.limit}
    `);
  }

  /** Recent enrollments in this staff member's courses. */
  async recentEnrollments(staffUserId: string, limit: number) {
    return this.rows(sql`
      SELECT
        e.id,
        e.status,
        e.progress_percentage,
        e.created_at,
        e.enrolled_at,
        e.completed_at,
        c.id course_id,
        c.title course_title,
        up.first_name,
        up.last_name
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      JOIN users u ON u.id = e.student_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE c.created_by = ${staffUserId}
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT ${limit}
    `);
  }

  /** Recent completions in this staff member's courses. */
  async recentCompletions(staffUserId: string, limit: number) {
    return this.rows(sql`
      SELECT
        e.id enrollment_id,
        e.started_at,
        e.completed_at,
        c.title course_title,
        up.first_name,
        up.last_name,
        cert.status certificate_status,
        cert.certificate_number
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      JOIN users u ON u.id = e.student_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN certificates cert ON cert.enrollment_id = e.id
      WHERE c.created_by = ${staffUserId} AND e.status = 'COMPLETED'
      ORDER BY e.completed_at DESC, e.id DESC
      LIMIT ${limit}
    `);
  }

  /** Full overview (parallel queries for the dashboard landing page). */
  async overview(
    staffUserId: string,
    query: DashboardQueryDto,
    showFinancial: boolean,
  ) {
    const [kpis, recentEnrollments, recentCompletions, coursePerf] =
      await Promise.all([
        this.kpis(staffUserId, query, showFinancial),
        this.recentEnrollments(staffUserId, query.previewLimit),
        this.recentCompletions(staffUserId, query.previewLimit),
        this.coursePerformance(
          staffUserId,
          { ...query, sort: 'ENROLLMENTS', limit: query.previewLimit },
          showFinancial,
        ),
      ]);
    return {
      ...kpis,
      recentEnrollments,
      recentCompletions,
      topCourses: coursePerf,
    };
  }
}
