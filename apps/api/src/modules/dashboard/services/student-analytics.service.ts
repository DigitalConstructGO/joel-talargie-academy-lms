import { Injectable } from '@nestjs/common';
import { sql } from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import { DashboardDateRangeService } from './dashboard-date-range.service';
import type {
  DashboardQueryDto,
  DashboardTrendQueryDto,
} from '../dto/dashboard-query.dto';

type Row = Record<string, unknown>;

/**
 * Student Analytics Service
 *
 * ALL queries filter `enrollments.student_id = :studentId`.
 * The studentId comes from the authenticated session JWT — never from a
 * query parameter. Cross-student data leakage is structurally impossible
 * because the WHERE clause is set in SQL, not filtered in JavaScript.
 *
 * This service does NOT expose:
 *   - Other students' data
 *   - Academy-wide revenue
 *   - Admin-only analytics
 */
@Injectable()
export class StudentAnalyticsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly dates: DashboardDateRangeService,
  ) {}

  private async rows(query: ReturnType<typeof sql>): Promise<Row[]> {
    const result = await this.database.client.execute(query);
    return ((result as unknown as { rows?: Row[] }).rows ?? []) as Row[];
  }

  private presentRange(
    range: ReturnType<DashboardDateRangeService['resolve']>,
  ) {
    return {
      preset: range.preset,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      timezone: range.timezone,
    };
  }

  /** Summary KPI cards for the student's own learning. */
  async kpis(studentId: string, query: DashboardQueryDto) {
    const range = this.dates.resolve(query);
    const [row] = await this.rows(sql`
      SELECT
        (SELECT count(*)::int FROM enrollments WHERE student_id = ${studentId}) total_enrolled,
        (SELECT count(*)::int FROM enrollments WHERE student_id = ${studentId} AND status IN ('ENROLLED','IN_PROGRESS')) in_progress,
        (SELECT count(*)::int FROM enrollments WHERE student_id = ${studentId} AND status = 'COMPLETED') completed,
        (SELECT count(*)::int FROM certificates cert JOIN enrollments e ON e.id = cert.enrollment_id WHERE e.student_id = ${studentId} AND cert.status = 'GENERATED') certificates_earned,
        (SELECT round(avg(progress_percentage), 2) FROM enrollments WHERE student_id = ${studentId} AND status IN ('ENROLLED','IN_PROGRESS','COMPLETED')) avg_progress,
        (SELECT count(*)::int FROM enrollments WHERE student_id = ${studentId} AND created_at >= ${range.from} AND created_at < ${range.to}) new_enrollments_period,
        (SELECT count(*)::int FROM enrollments WHERE student_id = ${studentId} AND completed_at >= ${range.from} AND completed_at < ${range.to}) completions_period,
        -- Estimate total learning time from lesson progress
        (SELECT coalesce(sum(lp.last_position_seconds), 0)::int FROM lesson_progress lp JOIN enrollments e ON e.id = lp.enrollment_id WHERE e.student_id = ${studentId}) total_learning_seconds
    `);

    return {
      range: this.presentRange(range),
      kpis: {
        totalEnrolled: Number(row?.total_enrolled ?? 0),
        inProgress: Number(row?.in_progress ?? 0),
        completed: Number(row?.completed ?? 0),
        certificatesEarned: Number(row?.certificates_earned ?? 0),
        averageProgress: row?.avg_progress ? String(row.avg_progress) : null,
        newEnrollmentsDuringPeriod: Number(row?.new_enrollments_period ?? 0),
        completionsDuringPeriod: Number(row?.completions_period ?? 0),
        totalLearningSeconds: Number(row?.total_learning_seconds ?? 0),
      },
    };
  }

  /** Per-enrollment progress list for this student. */
  async enrollmentProgress(studentId: string) {
    return this.rows(sql`
      SELECT
        e.id enrollment_id,
        e.status,
        e.progress_percentage,
        e.enrolled_at,
        e.started_at,
        e.completed_at,
        c.id course_id,
        c.title course_title,
        c.access_type,
        cat.name category_name,
        cert.status certificate_status,
        cert.certificate_number
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN certificates cert ON cert.enrollment_id = e.id
      WHERE e.student_id = ${studentId}
        AND e.status NOT IN ('CANCELLED', 'ACCESS_REVOKED')
      ORDER BY
        CASE e.status
          WHEN 'IN_PROGRESS' THEN 1
          WHEN 'ENROLLED' THEN 2
          WHEN 'COMPLETED' THEN 3
          ELSE 4
        END,
        e.updated_at DESC,
        e.id DESC
    `);
  }

  /** Learning activity over time (lesson completions) for this student. */
  async learningActivityTrend(
    studentId: string,
    query: DashboardTrendQueryDto,
  ) {
    const range = this.dates.resolve(query);
    const unit = query.granularity.toLowerCase();
    const rows = await this.rows(sql`
      SELECT date_trunc(${unit}, lp.completed_at) period, count(*)::int count
      FROM lesson_progress lp
      JOIN enrollments e ON e.id = lp.enrollment_id
      WHERE e.student_id = ${studentId}
        AND lp.status = 'COMPLETED'
        AND lp.completed_at >= ${range.from}
        AND lp.completed_at < ${range.to}
      GROUP BY 1
      ORDER BY 1
    `);
    return {
      range: this.presentRange(range),
      granularity: query.granularity,
      points: rows,
    };
  }

  /** Enrollment trend for this student (when they enrolled in courses). */
  async enrollmentTrend(studentId: string, query: DashboardTrendQueryDto) {
    const range = this.dates.resolve(query);
    const unit = query.granularity.toLowerCase();
    const rows = await this.rows(sql`
      SELECT date_trunc(${unit}, e.created_at) period, count(*)::int count
      FROM enrollments e
      WHERE e.student_id = ${studentId}
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

  /** My payment history summary. */
  async paymentHistory(studentId: string, query: DashboardQueryDto) {
    const range = this.dates.resolve(query);
    const rows = await this.rows(sql`
      SELECT
        p.id,
        p.status,
        p.amount,
        p.currency,
        p.submitted_at,
        p.reviewed_at,
        c.title course_title,
        e.status enrollment_status
      FROM payments p
      JOIN enrollments e ON e.id = p.enrollment_id
      JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = ${studentId}
        AND p.submitted_at >= ${range.from}
        AND p.submitted_at < ${range.to}
      ORDER BY p.submitted_at DESC, p.id DESC
      LIMIT 50
    `);
    return { range: this.presentRange(range), payments: rows };
  }

  /** Full overview (parallel queries for student analytics landing page). */
  async overview(studentId: string, query: DashboardQueryDto) {
    const trendQuery = { ...query, granularity: 'DAY' as const };
    const [kpis, progress, activity, enrollmentTrend] = await Promise.all([
      this.kpis(studentId, query),
      this.enrollmentProgress(studentId),
      this.learningActivityTrend(studentId, trendQuery),
      this.enrollmentTrend(studentId, trendQuery),
    ]);
    return {
      ...kpis,
      enrollments: progress,
      trends: {
        learningActivity: activity.points,
        enrollments: enrollmentTrend.points,
      },
    };
  }
}
