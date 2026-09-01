import { ForbiddenException, Injectable } from '@nestjs/common';
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

export interface AuthorizationContext {
  userId: string;
  status: string;
  roles: string[];
  permissions: string[];
  isAdministrator: boolean;
}

export type AnalyticsScopeType = 'GLOBAL' | 'INSTRUCTOR';

export interface AnalyticsScope {
  type: AnalyticsScopeType;
  targetInstructorId?: string;
  courseId?: string;
  categoryId?: string;
  permissions: {
    viewCourses: boolean;
    viewEnrollments: boolean;
    viewRevenue: boolean;
    viewUsers: boolean;
    viewCertificates: boolean;
    viewActivity: boolean;
    viewHealth: boolean;
  };
}

type Row = Record<string, unknown>;

@Injectable()
export class DashboardService {
  constructor(
    private readonly database: DatabaseService,
    private readonly dates: DashboardDateRangeService,
    private readonly privacy: ReportPrivacyService,
  ) {}

  private async rows(query: ReturnType<typeof sql>): Promise<Row[]> {
    const result: any = await this.database.client.execute(query);
    if (Array.isArray(result)) return result;
    return ((result as unknown as { rows?: Row[] })?.rows ?? []) as Row[];
  }

  async resolveScope(
    auth: AuthorizationContext | string[],
    query: DashboardQueryDto = {} as DashboardQueryDto,
  ): Promise<AnalyticsScope> {
    const isContext =
      typeof auth === 'object' && auth !== null && 'userId' in auth;
    const permissions: string[] = isContext
      ? ((auth as AuthorizationContext).permissions ?? [])
      : Array.isArray(auth)
        ? auth
        : [];
    const roles: string[] = isContext
      ? ((auth as AuthorizationContext).roles ?? [])
      : [];
    const isAdministrator = isContext
      ? Boolean(
          (auth as AuthorizationContext).isAdministrator ||
          roles.includes('ADMINISTRATOR'),
        )
      : false;
    const userId: string = isContext
      ? ((auth as AuthorizationContext).userId ?? '')
      : '';

    const canManageAll =
      isAdministrator || permissions.includes('courses.manage_all');
    const canReadFinancial =
      permissions.includes('dashboard.read_financial') ||
      permissions.includes('payments.read');
    const canReadUsers = isAdministrator || permissions.includes('users.read');
    const canReadCourses =
      isAdministrator || permissions.includes('courses.read');
    const canReadCertificates =
      isAdministrator || permissions.includes('certificates.read');
    const canReadActivity = permissions.includes(
      'dashboard.read_administrator_activity',
    );
    const canReadHealth = permissions.includes(
      'dashboard.read_operational_health',
    );

    const permMap = {
      viewCourses: canReadCourses,
      viewEnrollments:
        isAdministrator ||
        permissions.includes('enrollments.read') ||
        permissions.includes('courses.read'),
      viewRevenue: canReadFinancial,
      viewUsers: canReadUsers,
      viewCertificates: canReadCertificates,
      viewActivity: canReadActivity,
      viewHealth: canReadHealth,
    };

    // If caller is Administrator or has global course management
    if (
      canManageAll ||
      isAdministrator ||
      (!userId && permissions.length > 0)
    ) {
      return {
        type: 'GLOBAL',
        targetInstructorId: query.instructorId,
        courseId: query.courseId,
        categoryId: query.categoryId,
        permissions: permMap,
      };
    }

    // If student attempting to access staff/admin dashboard
    if (
      roles.includes('STUDENT') &&
      !roles.includes('INSTRUCTOR') &&
      !canReadCourses
    ) {
      throw new ForbiddenException({
        code: 'STUDENT_ANALYTICS_ONLY',
        message: 'Students must use the student analytics dashboard.',
      });
    }

    // If instructor or staff with course permissions
    if (canReadCourses || roles.includes('INSTRUCTOR')) {
      if (query.instructorId && query.instructorId !== userId) {
        throw new ForbiddenException({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You cannot view analytics for another instructor.',
        });
      }

      if (query.courseId) {
        const ownedCourses = await this.rows(sql`
          SELECT id FROM courses WHERE id = ${query.courseId} AND created_by = ${userId} AND archived_at IS NULL
        `);
        if (!ownedCourses.length) {
          throw new ForbiddenException({
            code: 'COURSE_NOT_OWNED',
            message: 'You can only view analytics for courses you own.',
          });
        }
      }

      return {
        type: 'INSTRUCTOR',
        targetInstructorId: userId,
        courseId: query.courseId,
        categoryId: query.categoryId,
        permissions: {
          ...permMap,
          viewUsers: false, // Instructors cannot view platform-wide user analytics
        },
      };
    }

    throw new ForbiddenException({
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'You do not have permission to view analytics.',
    });
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

  async kpis(query: DashboardQueryDto, auth: AuthorizationContext | string[]) {
    const range = this.dates.resolve(query);
    const scope = await this.resolveScope(auth, query);

    if (scope.type === 'INSTRUCTOR' || scope.targetInstructorId) {
      const instructorId = scope.targetInstructorId!;
      const current = await this.rows(sql`
        SELECT
          -- Instructor owned courses
          (SELECT count(*) FROM courses c WHERE c.created_by = ${instructorId} AND c.archived_at IS NULL ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) total_courses,
          (SELECT count(*) FROM courses c WHERE c.created_by = ${instructorId} AND c.status = 'PUBLISHED' AND c.archived_at IS NULL ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) published_courses,
          (SELECT count(*) FROM courses c WHERE c.created_by = ${instructorId} AND c.status = 'DRAFT' AND c.archived_at IS NULL ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) draft_courses,

          -- Enrollments in instructor courses
          (SELECT count(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${instructorId} ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) total_enrollments,
          (SELECT count(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${instructorId} AND e.status IN ('ENROLLED','IN_PROGRESS') ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) active_enrollments,
          (SELECT count(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${instructorId} AND e.status = 'PENDING_PAYMENT' ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) pending_payment_enrollments,
          (SELECT count(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${instructorId} AND e.status = 'COMPLETED' ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) completed_enrollments,
          (SELECT count(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${instructorId} AND e.created_at >= ${range.from} AND e.created_at < ${range.to} ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) new_enrollments,

          -- Distinct students enrolled in instructor courses
          (SELECT count(DISTINCT e.student_id) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${instructorId} ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) my_students,

          -- Completion rate
          (SELECT CASE WHEN count(CASE WHEN e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED') THEN 1 END) = 0 THEN NULL ELSE round(100.0 * count(CASE WHEN e.status = 'COMPLETED' THEN 1 END) / count(CASE WHEN e.status IN ('ENROLLED','IN_PROGRESS','COMPLETED') THEN 1 END), 2) END FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${instructorId} ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) completion_rate,

          -- Certificates issued for instructor courses
          (SELECT count(*) FROM certificates cert JOIN enrollments e ON e.id = cert.enrollment_id JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${instructorId} AND cert.status = 'GENERATED' ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) certificates_generated
      `);

      const base = current[0] ?? {};
      const newEnrollments = Number(base.new_enrollments ?? 0);
      const data: Record<string, unknown> = {
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
          newDuringPeriod: newEnrollments,
        },
        students: {
          total: Number(base.my_students ?? 0),
          active: Number(base.active_enrollments ?? 0),
          newDuringPeriod: newEnrollments,
        },
        completionRate:
          base.completion_rate != null ? Number(base.completion_rate) : null,
      };

      if (scope.permissions.viewCertificates) {
        data.certificates = {
          generated: Number(base.certificates_generated ?? 0),
          attention: 0,
        };
      }

      let revenueByCurrency: { currency: string; amount: string }[] | undefined;
      if (scope.permissions.viewRevenue) {
        revenueByCurrency = (await this.rows(
          sql`SELECT p.currency, coalesce(sum(p.amount),0) amount
              FROM payments p
              JOIN enrollments e ON e.id = p.enrollment_id
              JOIN courses c ON c.id = e.course_id
              WHERE c.created_by = ${instructorId}
                AND p.status = 'APPROVED'
                AND p.reviewed_at >= ${range.from}
                AND p.reviewed_at < ${range.to}
                ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``}
                ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}
              GROUP BY p.currency ORDER BY p.currency`,
        )) as { currency: string; amount: string }[];
        data.revenue = revenueByCurrency;
      }

      if (range.previous) {
        const [previousBase] = await this.rows(sql`
          SELECT
            (SELECT count(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${instructorId} AND e.created_at >= ${range.previous.from} AND e.created_at < ${range.previous.to} ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``} ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}) new_enrollments
        `);
        const comparisons: Record<string, unknown> = {
          newEnrollments: this.comparison(
            newEnrollments,
            Number(previousBase?.new_enrollments ?? 0),
          ),
        };
        if (scope.permissions.viewRevenue) {
          const previousRevenueRows = (await this.rows(
            sql`SELECT p.currency, coalesce(sum(p.amount),0) amount
                FROM payments p
                JOIN enrollments e ON e.id = p.enrollment_id
                JOIN courses c ON c.id = e.course_id
                WHERE c.created_by = ${instructorId}
                  AND p.status = 'APPROVED'
                  AND p.reviewed_at >= ${range.previous.from}
                  AND p.reviewed_at < ${range.previous.to}
                  ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``}
                  ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}
                GROUP BY p.currency ORDER BY p.currency`,
          )) as { currency: string; amount: string }[];
          const previousByCurrency = new Map(
            previousRevenueRows.map((row) => [
              row.currency,
              Number(row.amount),
            ]),
          );
          comparisons.revenue = (revenueByCurrency ?? []).map((row) => ({
            currency: row.currency,
            ...this.comparison(
              Number(row.amount),
              previousByCurrency.get(row.currency) ?? 0,
            ),
          }));
        }
        data.comparisons = comparisons;
      }

      return {
        scope: scope.type,
        permissions: scope.permissions,
        range: this.presentRange(range),
        kpis: data,
      };
    }

    // Global / Administrator scope
    const current = await this.rows(sql`
      SELECT
        (SELECT count(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.code='STUDENT') total_students,
        (SELECT count(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON r.id=ur.role_id JOIN users u ON u.id=ur.user_id WHERE r.code='STUDENT' AND u.status='ACTIVE') active_students,
        (SELECT count(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON r.id=ur.role_id JOIN users u ON u.id=ur.user_id WHERE r.code='STUDENT' AND u.status='PENDING_VERIFICATION') pending_verification_students,
        (SELECT count(*) FROM courses ${scope.categoryId ? sql`WHERE category_id = ${scope.categoryId}` : sql``}) total_courses,
        (SELECT count(*) FROM courses WHERE status='PUBLISHED' AND archived_at IS NULL ${scope.categoryId ? sql`AND category_id = ${scope.categoryId}` : sql``}) published_courses,
        (SELECT count(*) FROM courses WHERE status='DRAFT' AND archived_at IS NULL ${scope.categoryId ? sql`AND category_id = ${scope.categoryId}` : sql``}) draft_courses,
        (SELECT count(*) FROM enrollments e ${scope.courseId ? sql`WHERE e.course_id = ${scope.courseId}` : scope.categoryId ? sql`JOIN courses c ON c.id=e.course_id WHERE c.category_id = ${scope.categoryId}` : sql``}) total_enrollments,
        (SELECT count(*) FROM enrollments e WHERE e.status IN ('ENROLLED','IN_PROGRESS') ${scope.courseId ? sql`AND e.course_id = ${scope.courseId}` : scope.categoryId ? sql`AND EXISTS (SELECT 1 FROM courses c WHERE c.id=e.course_id AND c.category_id = ${scope.categoryId})` : sql``}) active_enrollments,
        (SELECT count(*) FROM enrollments e WHERE e.status='PENDING_PAYMENT' ${scope.courseId ? sql`AND e.course_id = ${scope.courseId}` : scope.categoryId ? sql`AND EXISTS (SELECT 1 FROM courses c WHERE c.id=e.course_id AND c.category_id = ${scope.categoryId})` : sql``}) pending_payment_enrollments,
        (SELECT count(*) FROM enrollments e WHERE e.status='COMPLETED' ${scope.courseId ? sql`AND e.course_id = ${scope.courseId}` : scope.categoryId ? sql`AND EXISTS (SELECT 1 FROM courses c WHERE c.id=e.course_id AND c.category_id = ${scope.categoryId})` : sql``}) completed_enrollments,
        (SELECT count(*) FROM payments WHERE status='PENDING') pending_payment_reviews,
        (SELECT count(*) FROM certificates WHERE status='GENERATED') certificates_generated,
        (SELECT count(*) FROM certificates WHERE status IN ('PENDING','FAILED')) certificates_attention,
        (SELECT count(*) FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='STUDENT' AND u.created_at >= ${range.from} AND u.created_at < ${range.to}) new_students,
        (SELECT count(*) FROM enrollments e WHERE e.created_at >= ${range.from} AND e.created_at < ${range.to} ${scope.courseId ? sql`AND e.course_id = ${scope.courseId}` : scope.categoryId ? sql`AND EXISTS (SELECT 1 FROM courses c WHERE c.id=e.course_id AND c.category_id = ${scope.categoryId})` : sql``}) new_enrollments
    `);
    const base = current[0] ?? {};
    const newStudents = Number(base.new_students ?? 0);
    const newEnrollments = Number(base.new_enrollments ?? 0);
    const data: Record<string, unknown> = {
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
        newDuringPeriod: newEnrollments,
      },
    };

    if (scope.permissions.viewUsers) {
      data.students = {
        total: Number(base.total_students ?? 0),
        active: Number(base.active_students ?? 0),
        pendingVerification: Number(base.pending_verification_students ?? 0),
        newDuringPeriod: newStudents,
      };
    }

    if (scope.permissions.viewCertificates) {
      data.certificates = {
        generated: Number(base.certificates_generated ?? 0),
        attention: Number(base.certificates_attention ?? 0),
      };
    }

    let revenueByCurrency: { currency: string; amount: string }[] | undefined;
    if (scope.permissions.viewRevenue) {
      data.payments = {
        waitingForReview: Number(base.pending_payment_reviews ?? 0),
      };
      revenueByCurrency = (await this.rows(
        sql`SELECT currency, coalesce(sum(amount),0) amount
            FROM payments p
            ${scope.courseId ? sql`JOIN enrollments e ON e.id=p.enrollment_id WHERE e.course_id = ${scope.courseId} AND` : scope.categoryId ? sql`JOIN enrollments e ON e.id=p.enrollment_id JOIN courses c ON c.id=e.course_id WHERE c.category_id = ${scope.categoryId} AND` : sql`WHERE`}
            p.status='APPROVED' AND p.reviewed_at >= ${range.from} AND p.reviewed_at < ${range.to}
            GROUP BY currency ORDER BY currency`,
      )) as { currency: string; amount: string }[];
      data.revenue = revenueByCurrency;
    }

    if (range.previous) {
      const [previousBase] = await this.rows(sql`
        SELECT
          (SELECT count(*) FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='STUDENT' AND u.created_at >= ${range.previous.from} AND u.created_at < ${range.previous.to}) new_students,
          (SELECT count(*) FROM enrollments e WHERE e.created_at >= ${range.previous.from} AND e.created_at < ${range.previous.to} ${scope.courseId ? sql`AND e.course_id = ${scope.courseId}` : scope.categoryId ? sql`AND EXISTS (SELECT 1 FROM courses c WHERE c.id=e.course_id AND c.category_id = ${scope.categoryId})` : sql``}) new_enrollments
      `);
      const comparisons: Record<string, unknown> = {
        newEnrollments: this.comparison(
          newEnrollments,
          Number(previousBase?.new_enrollments ?? 0),
        ),
      };
      if (scope.permissions.viewUsers) {
        comparisons.newStudents = this.comparison(
          newStudents,
          Number(previousBase?.new_students ?? 0),
        );
      }
      if (scope.permissions.viewRevenue) {
        const previousRevenueRows = (await this.rows(
          sql`SELECT currency, coalesce(sum(amount),0) amount
              FROM payments p
              ${scope.courseId ? sql`JOIN enrollments e ON e.id=p.enrollment_id WHERE e.course_id = ${scope.courseId} AND` : scope.categoryId ? sql`JOIN enrollments e ON e.id=p.enrollment_id JOIN courses c ON c.id=e.course_id WHERE c.category_id = ${scope.categoryId} AND` : sql`WHERE`}
              p.status='APPROVED' AND p.reviewed_at >= ${range.previous.from} AND p.reviewed_at < ${range.previous.to}
              GROUP BY currency ORDER BY currency`,
        )) as { currency: string; amount: string }[];
        const previousByCurrency = new Map(
          previousRevenueRows.map((row) => [row.currency, Number(row.amount)]),
        );
        comparisons.revenue = (revenueByCurrency ?? []).map((row) => ({
          currency: row.currency,
          ...this.comparison(
            Number(row.amount),
            previousByCurrency.get(row.currency) ?? 0,
          ),
        }));
      }
      data.comparisons = comparisons;
    }

    return {
      scope: scope.type,
      permissions: scope.permissions,
      range: this.presentRange(range),
      kpis: data,
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
    auth?: AuthorizationContext | string[],
  ) {
    const range = this.dates.resolve(query);
    const scope = auth ? await this.resolveScope(auth, query) : null;
    const unit = query.granularity.toLowerCase();

    if (kind === 'registrations') {
      if (scope && (scope.type !== 'GLOBAL' || !scope.permissions.viewUsers)) {
        throw new ForbiddenException({
          code: 'INSUFFICIENT_PERMISSIONS',
          message:
            'You do not have permission to view user registration trends.',
        });
      }
      const safeRows = await this.rows(
        sql`SELECT strftime('%Y-%m-%d 00:00:00', datetime(created_at / 1000, 'unixepoch')) period, count(*) count FROM users WHERE created_at >= ${range.from} AND created_at < ${range.to} GROUP BY 1 ORDER BY 1`,
      );
      return {
        range: this.presentRange(range),
        granularity: query.granularity,
        points: safeRows,
      };
    }

    if (kind === 'revenue') {
      if (scope && !scope.permissions.viewRevenue) {
        throw new ForbiddenException({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to view revenue trends.',
        });
      }
      if (scope && (scope.type === 'INSTRUCTOR' || scope.targetInstructorId)) {
        const instructorId = scope.targetInstructorId!;
        const safeRows = await this.rows(
          sql`SELECT strftime('%Y-%m-%d 00:00:00', datetime(p.reviewed_at / 1000, 'unixepoch')) period, p.currency, count(*) count, coalesce(sum(p.amount),0) amount
              FROM payments p
              JOIN enrollments e ON e.id = p.enrollment_id
              JOIN courses c ON c.id = e.course_id
              WHERE c.created_by = ${instructorId}
                AND p.status='APPROVED'
                AND p.reviewed_at >= ${range.from}
                AND p.reviewed_at < ${range.to}
                ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``}
                ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}
              GROUP BY 1,2 ORDER BY 1,2`,
        );
        return {
          range: this.presentRange(range),
          granularity: query.granularity,
          points: safeRows,
        };
      }
      const safeRows = await this.rows(
        sql`SELECT strftime('%Y-%m-%d 00:00:00', datetime(reviewed_at / 1000, 'unixepoch')) period, currency, count(*) count, coalesce(sum(amount),0) amount
            FROM payments p
            ${scope?.courseId ? sql`JOIN enrollments e ON e.id=p.enrollment_id WHERE e.course_id = ${scope.courseId} AND` : scope?.categoryId ? sql`JOIN enrollments e ON e.id=p.enrollment_id JOIN courses c ON c.id=e.course_id WHERE c.category_id = ${scope.categoryId} AND` : sql`WHERE`}
            p.status='APPROVED' AND p.reviewed_at >= ${range.from} AND p.reviewed_at < ${range.to}
            GROUP BY 1,2 ORDER BY 1,2`,
      );
      return {
        range: this.presentRange(range),
        granularity: query.granularity,
        points: safeRows,
      };
    }

    if (kind === 'payments') {
      if (scope && !scope.permissions.viewRevenue) {
        throw new ForbiddenException({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to view payment trends.',
        });
      }
      if (scope && (scope.type === 'INSTRUCTOR' || scope.targetInstructorId)) {
        const instructorId = scope.targetInstructorId!;
        const safeRows = await this.rows(
          sql`SELECT strftime('%Y-%m-%d 00:00:00', datetime(p.reviewed_at / 1000, 'unixepoch')) period, count(*) count
              FROM payments p
              JOIN enrollments e ON e.id = p.enrollment_id
              JOIN courses c ON c.id = e.course_id
              WHERE c.created_by = ${instructorId}
                AND p.reviewed_at >= ${range.from}
                AND p.reviewed_at < ${range.to}
                ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``}
                ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}
              GROUP BY 1 ORDER BY 1`,
        );
        return {
          range: this.presentRange(range),
          granularity: query.granularity,
          points: safeRows,
        };
      }
      const safeRows = await this.rows(
        sql`SELECT strftime('%Y-%m-%d 00:00:00', datetime(reviewed_at / 1000, 'unixepoch')) period, count(*) count
            FROM payments p
            ${scope?.courseId ? sql`JOIN enrollments e ON e.id=p.enrollment_id WHERE e.course_id = ${scope.courseId} AND` : scope?.categoryId ? sql`JOIN enrollments e ON e.id=p.enrollment_id JOIN courses c ON c.id=e.course_id WHERE c.category_id = ${scope.categoryId} AND` : sql`WHERE`}
            p.reviewed_at >= ${range.from} AND p.reviewed_at < ${range.to}
            GROUP BY 1 ORDER BY 1`,
      );
      return {
        range: this.presentRange(range),
        granularity: query.granularity,
        points: safeRows,
      };
    }

    if (kind === 'completions') {
      if (scope && (scope.type === 'INSTRUCTOR' || scope.targetInstructorId)) {
        const instructorId = scope.targetInstructorId!;
        const safeRows = await this.rows(
          sql`SELECT strftime('%Y-%m-%d 00:00:00', datetime(e.completed_at / 1000, 'unixepoch')) period, count(*) count
              FROM enrollments e
              JOIN courses c ON c.id = e.course_id
              WHERE c.created_by = ${instructorId}
                AND e.status='COMPLETED'
                AND e.completed_at >= ${range.from}
                AND e.completed_at < ${range.to}
                ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``}
                ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}
              GROUP BY 1 ORDER BY 1`,
        );
        return {
          range: this.presentRange(range),
          granularity: query.granularity,
          points: safeRows,
        };
      }
      const safeRows = await this.rows(
        sql`SELECT strftime('%Y-%m-%d 00:00:00', datetime(completed_at / 1000, 'unixepoch')) period, count(*) count
            FROM enrollments e
            ${scope?.courseId ? sql`WHERE e.course_id = ${scope.courseId} AND` : scope?.categoryId ? sql`JOIN courses c ON c.id=e.course_id WHERE c.category_id = ${scope.categoryId} AND` : sql`WHERE`}
            e.status='COMPLETED' AND e.completed_at >= ${range.from} AND e.completed_at < ${range.to}
            GROUP BY 1 ORDER BY 1`,
      );
      return {
        range: this.presentRange(range),
        granularity: query.granularity,
        points: safeRows,
      };
    }

    if (kind === 'certificates') {
      if (scope && !scope.permissions.viewCertificates) {
        throw new ForbiddenException({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to view certificate trends.',
        });
      }
      if (scope && (scope.type === 'INSTRUCTOR' || scope.targetInstructorId)) {
        const instructorId = scope.targetInstructorId!;
        const safeRows = await this.rows(
          sql`SELECT strftime('%Y-%m-%d 00:00:00', datetime(cert.issued_at / 1000, 'unixepoch')) period, count(*) count
              FROM certificates cert
              JOIN enrollments e ON e.id = cert.enrollment_id
              JOIN courses c ON c.id = e.course_id
              WHERE c.created_by = ${instructorId}
                AND cert.issued_at >= ${range.from}
                AND cert.issued_at < ${range.to}
                ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``}
                ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}
              GROUP BY 1 ORDER BY 1`,
        );
        return {
          range: this.presentRange(range),
          granularity: query.granularity,
          points: safeRows,
        };
      }
      const safeRows = await this.rows(
        sql`SELECT strftime('%Y-%m-%d 00:00:00', datetime(cert.issued_at / 1000, 'unixepoch')) period, count(*) count
            FROM certificates cert
            ${scope?.courseId ? sql`JOIN enrollments e ON e.id=cert.enrollment_id WHERE e.course_id = ${scope.courseId} AND` : scope?.categoryId ? sql`JOIN enrollments e ON e.id=cert.enrollment_id JOIN courses c ON c.id=e.course_id WHERE c.category_id = ${scope.categoryId} AND` : sql`WHERE`}
            cert.issued_at >= ${range.from} AND cert.issued_at < ${range.to}
            GROUP BY 1 ORDER BY 1`,
      );
      return {
        range: this.presentRange(range),
        granularity: query.granularity,
        points: safeRows,
      };
    }

    // Default: enrollments
    if (scope && (scope.type === 'INSTRUCTOR' || scope.targetInstructorId)) {
      const instructorId = scope.targetInstructorId!;
      const safeRows = await this.rows(
        sql`SELECT strftime('%Y-%m-%d 00:00:00', datetime(e.created_at / 1000, 'unixepoch')) period, count(*) count
            FROM enrollments e
            JOIN courses c ON c.id = e.course_id
            WHERE c.created_by = ${instructorId}
              AND e.created_at >= ${range.from}
              AND e.created_at < ${range.to}
              ${scope.courseId ? sql`AND c.id = ${scope.courseId}` : sql``}
              ${scope.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}
            GROUP BY 1 ORDER BY 1`,
      );
      return {
        range: this.presentRange(range),
        granularity: query.granularity,
        points: safeRows,
      };
    }

    const safeRows = await this.rows(
      sql`SELECT strftime('%Y-%m-%d 00:00:00', datetime(e.created_at / 1000, 'unixepoch')) period, count(*) count
          FROM enrollments e
          ${scope?.courseId ? sql`WHERE e.course_id = ${scope.courseId} AND` : scope?.categoryId ? sql`JOIN courses c ON c.id=e.course_id WHERE c.category_id = ${scope.categoryId} AND` : sql`WHERE`}
          e.created_at >= ${range.from} AND e.created_at < ${range.to}
          GROUP BY 1 ORDER BY 1`,
    );
    return {
      range: this.presentRange(range),
      granularity: query.granularity,
      points: safeRows,
    };
  }

  async pendingPayments(
    limit: number,
    financial: boolean,
    auth?: AuthorizationContext | string[],
  ) {
    if (!financial) return [];
    const scope = auth ? await this.resolveScope(auth) : null;
    const instructorId =
      scope?.type === 'INSTRUCTOR' || scope?.targetInstructorId
        ? scope.targetInstructorId
        : null;

    const rows = await this.rows(
      sql`SELECT p.id payment_id, p.enrollment_id, p.status, p.currency, p.amount, p.expected_amount_snapshot, p.amount_mismatch, p.duplicate_transaction_count, p.submitted_at, u.id student_id, up.first_name, up.last_name, c.id course_id, c.title course_title
          FROM payments p
          JOIN enrollments e ON e.id=p.enrollment_id
          JOIN users u ON u.id=e.student_id
          LEFT JOIN user_profiles up ON up.user_id=u.id
          JOIN courses c ON c.id=e.course_id
          WHERE p.status='PENDING'
            ${instructorId ? sql`AND c.created_by = ${instructorId}` : sql``}
          ORDER BY p.submitted_at ASC, p.id ASC
          LIMIT ${limit}`,
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
      submittedAmount: row.amount,
      expectedAmount: row.expected_amount_snapshot,
    }));
  }

  async recentStudents(
    limit: number,
    sensitive: boolean,
    auth?: AuthorizationContext | string[],
  ) {
    const scope = auth ? await this.resolveScope(auth) : null;
    if (scope && scope.type !== 'GLOBAL') {
      return [];
    }
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

  async recentEnrollments(
    limit: number,
    financial: boolean,
    auth?: AuthorizationContext | string[],
  ) {
    const scope = auth ? await this.resolveScope(auth) : null;
    const instructorId =
      scope?.type === 'INSTRUCTOR' || scope?.targetInstructorId
        ? scope.targetInstructorId
        : null;

    const rows = await this.rows(
      sql`SELECT e.id,e.status,e.progress_percentage,e.created_at,e.enrolled_at,e.started_at,e.completed_at,c.id course_id,c.title course_title,u.id student_id,up.first_name,up.last_name,e.price_at_enrollment,e.currency_at_enrollment
          FROM enrollments e
          JOIN courses c ON c.id=e.course_id
          JOIN users u ON u.id=e.student_id
          LEFT JOIN user_profiles up ON up.user_id=u.id
          ${instructorId ? sql`WHERE c.created_by = ${instructorId}` : sql``}
          ORDER BY e.created_at DESC,e.id DESC LIMIT ${limit}`,
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

  async recentCompletions(
    limit: number,
    auth?: AuthorizationContext | string[],
  ) {
    const scope = auth ? await this.resolveScope(auth) : null;
    const instructorId =
      scope?.type === 'INSTRUCTOR' || scope?.targetInstructorId
        ? scope.targetInstructorId
        : null;

    return this.rows(
      sql`SELECT e.id enrollment_id,e.started_at,e.completed_at,c.title course_title,u.id student_id,up.first_name,up.last_name,cert.status certificate_status,cert.certificate_number
          FROM enrollments e
          JOIN courses c ON c.id=e.course_id
          JOIN users u ON u.id=e.student_id
          LEFT JOIN user_profiles up ON up.user_id=u.id
          LEFT JOIN certificates cert ON cert.enrollment_id=e.id
          WHERE e.status='COMPLETED'
            ${instructorId ? sql`AND c.created_by = ${instructorId}` : sql``}
          ORDER BY e.completed_at DESC,e.id DESC LIMIT ${limit}`,
    );
  }

  async recentCertificates(
    limit: number,
    auth?: AuthorizationContext | string[],
  ) {
    const scope = auth ? await this.resolveScope(auth) : null;
    if (scope && !scope.permissions.viewCertificates) {
      return [];
    }
    const instructorId =
      scope?.type === 'INSTRUCTOR' || scope?.targetInstructorId
        ? scope.targetInstructorId
        : null;

    return this.rows(
      sql`SELECT cert.id,cert.certificate_number,cert.student_name_at_issue,cert.course_title_at_issue,cert.status,cert.issued_at,cert.generated_at,cert.revoked_at,cert.generation_version
          FROM certificates cert
          ${instructorId ? sql`JOIN enrollments e ON e.id = cert.enrollment_id JOIN courses c ON c.id = e.course_id WHERE c.created_by = ${instructorId}` : sql``}
          ORDER BY cert.created_at DESC,cert.id DESC LIMIT ${limit}`,
    );
  }

  async distribution(
    query: DashboardQueryDto,
    auth?: AuthorizationContext | string[],
  ) {
    const range = this.dates.resolve(query);
    const scope = auth ? await this.resolveScope(auth, query) : null;
    const instructorId =
      scope?.type === 'INSTRUCTOR' || scope?.targetInstructorId
        ? scope.targetInstructorId
        : null;

    const [row] = await this.rows(
      sql`SELECT count(CASE WHEN c.access_type='FREE' THEN 1 END) free_count, count(CASE WHEN c.access_type='PAID' THEN 1 END) paid_count
          FROM enrollments e
          JOIN courses c ON c.id=e.course_id
          WHERE e.created_at>=${range.from} AND e.created_at<${range.to}
            ${instructorId ? sql`AND c.created_by = ${instructorId}` : sql``}
            ${scope?.courseId ? sql`AND c.id = ${scope.courseId}` : sql``}
            ${scope?.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}`,
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

  async lowCompletion(
    query: CoursePerformanceQueryDto,
    auth?: AuthorizationContext | string[],
  ) {
    const range = this.dates.resolve(query);
    const scope = auth ? await this.resolveScope(auth, query) : null;
    const instructorId =
      scope?.type === 'INSTRUCTOR' || scope?.targetInstructorId
        ? scope.targetInstructorId
        : null;

    return this.rows(
      sql`SELECT c.id course_id, c.title course_title, c.slug,
                 count(e.id) total_enrollments,
                 count(CASE WHEN e.status='COMPLETED' THEN 1 END) completions,
                 coalesce(round(100.0 * count(CASE WHEN e.status='COMPLETED' THEN 1 END) / nullif(count(e.id),0), 2), 0) completion_rate
          FROM courses c
          LEFT JOIN enrollments e ON e.course_id=c.id AND e.created_at>=${range.from} AND e.created_at<${range.to}
          WHERE c.archived_at IS NULL
            ${instructorId ? sql`AND c.created_by = ${instructorId}` : sql``}
            ${scope?.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}
          GROUP BY c.id, c.title, c.slug
          HAVING count(e.id) > 0
          ORDER BY completion_rate ASC, total_enrollments DESC
          LIMIT ${query.limit}`,
    );
  }

  async coursePerformance(
    query: CoursePerformanceQueryDto,
    financial: boolean,
    auth?: AuthorizationContext | string[],
  ) {
    const range = this.dates.resolve(query);
    const scope = auth ? await this.resolveScope(auth, query) : null;
    const showFinancial = scope ? scope.permissions.viewRevenue : financial;
    const instructorId =
      scope?.type === 'INSTRUCTOR' || scope?.targetInstructorId
        ? scope.targetInstructorId
        : null;

    const rows = await this.rows(
      sql`SELECT c.id course_id, c.title course_title, c.slug, c.status, c.created_by,
                 count(e.id) total_enrollments,
                 count(CASE WHEN e.status='COMPLETED' THEN 1 END) completions,
                 coalesce(round(100.0 * count(CASE WHEN e.status='COMPLETED' THEN 1 END) / nullif(count(e.id),0), 2), 0) completion_rate,
                 coalesce(round(avg(e.progress_percentage), 1), 0) average_progress,
                 coalesce(sum(CASE WHEN p.status='APPROVED' THEN p.amount ELSE 0 END), 0) total_revenue,
                 coalesce(c.currency, 'ETB') currency
          FROM courses c
          LEFT JOIN enrollments e ON e.course_id=c.id AND e.created_at>=${range.from} AND e.created_at<${range.to}
          LEFT JOIN payments p ON p.enrollment_id=e.id
          WHERE c.archived_at IS NULL
            ${instructorId ? sql`AND c.created_by = ${instructorId}` : sql``}
            ${scope?.courseId ? sql`AND c.id = ${scope.courseId}` : sql``}
            ${scope?.categoryId ? sql`AND c.category_id = ${scope.categoryId}` : sql``}
          GROUP BY c.id, c.title, c.slug, c.status, c.created_by, c.currency
          ORDER BY
            ${query.sort === 'COMPLETIONS' ? sql`completions DESC, total_enrollments DESC` : query.sort === 'COMPLETION_RATE' ? sql`completion_rate DESC, total_enrollments DESC` : query.sort === 'AVERAGE_PROGRESS' ? sql`average_progress DESC, total_enrollments DESC` : query.sort === 'REVENUE' && showFinancial ? sql`total_revenue DESC, total_enrollments DESC` : sql`total_enrollments DESC, completions DESC`}
          LIMIT ${query.limit}`,
    );

    return rows.map((row) => ({
      courseId: row.course_id,
      title: row.course_title,
      slug: row.slug,
      status: row.status,
      totalEnrollments: Number(row.total_enrollments ?? 0),
      completions: Number(row.completions ?? 0),
      completionRate: Number(row.completion_rate ?? 0),
      averageProgress: Number(row.average_progress ?? 0),
      ...(showFinancial
        ? {
            revenue: String(row.total_revenue ?? '0'),
            currency: row.currency,
          }
        : {}),
    }));
  }

  async overview(
    query: DashboardQueryDto,
    auth: AuthorizationContext | string[],
  ) {
    const scope = await this.resolveScope(auth, query);
    const kpiPayload = await this.kpis(query, auth);

    const [
      enrollmentsTrend,
      completionsTrend,
      topCourses,
      recentEnrollments,
      distribution,
    ] = await Promise.all([
      this.trend('enrollments', { ...query, granularity: 'DAY' }, auth),
      this.trend('completions', { ...query, granularity: 'DAY' }, auth),
      this.coursePerformance(
        { ...query, sort: 'ENROLLMENTS', limit: query.previewLimit },
        scope.permissions.viewRevenue,
        auth,
      ),
      this.recentEnrollments(
        query.previewLimit,
        scope.permissions.viewRevenue,
        auth,
      ),
      this.distribution(query, auth),
    ]);

    const trends: Record<string, unknown> = {
      enrollments: enrollmentsTrend.points,
      completions: completionsTrend.points,
    };

    if (scope.permissions.viewRevenue) {
      const [paymentsTrend, revenueTrend] = await Promise.all([
        this.trend('payments', { ...query, granularity: 'DAY' }, auth),
        this.trend('revenue', { ...query, granularity: 'DAY' }, auth),
      ]);
      trends.payments = paymentsTrend.points;
      trends.revenue = revenueTrend.points;
    }

    if (scope.permissions.viewCertificates) {
      const certificatesTrend = await this.trend(
        'certificates',
        { ...query, granularity: 'DAY' },
        auth,
      );
      trends.certificates = certificatesTrend.points;
    }

    if (scope.permissions.viewUsers && scope.type === 'GLOBAL') {
      const registrationsTrend = await this.trend(
        'registrations',
        { ...query, granularity: 'DAY' },
        auth,
      );
      trends.registrations = registrationsTrend.points;
    }

    const previews: Record<string, unknown> = {
      recentEnrollments,
    };

    if (scope.permissions.viewRevenue) {
      previews.pendingPayments = await this.pendingPayments(
        query.previewLimit,
        true,
        auth,
      );
    }

    if (scope.permissions.viewUsers && scope.type === 'GLOBAL') {
      previews.recentStudents = await this.recentStudents(
        query.previewLimit,
        scope.permissions.viewActivity,
        auth,
      );
    }

    if (scope.permissions.viewCertificates) {
      previews.recentCertificates = await this.recentCertificates(
        query.previewLimit,
        auth,
      );
    }

    const data: Record<string, unknown> = {
      scope: scope.type,
      permissions: scope.permissions,
      range: kpiPayload.range,
      kpis: kpiPayload.kpis,
      trends,
      previews,
      topCourses,
      distribution,
    };

    if (scope.permissions.viewActivity && scope.type === 'GLOBAL') {
      data.recentActivity = await this.recentActivity(
        query.previewLimit,
        false,
      );
    }
    if (scope.permissions.viewHealth && scope.type === 'GLOBAL') {
      data.operationalAlerts = await this.health();
    }

    return data;
  }

  async filterOptions(auth: AuthorizationContext | string[]) {
    const scope = await this.resolveScope(auth);

    if (scope.type === 'INSTRUCTOR' || scope.targetInstructorId) {
      const instructorId = scope.targetInstructorId!;
      const [courses, categories] = await Promise.all([
        this.rows(sql`
          SELECT c.id, c.title, c.slug, c.category_id, cat.name category_name
          FROM courses c
          LEFT JOIN categories cat ON cat.id = c.category_id
          WHERE c.created_by = ${instructorId} AND c.archived_at IS NULL
          ORDER BY c.title ASC
        `),
        this.rows(sql`
          SELECT DISTINCT cat.id, cat.name, cat.slug
          FROM categories cat
          JOIN courses c ON c.category_id = cat.id
          WHERE c.created_by = ${instructorId} AND cat.archived_at IS NULL
          ORDER BY cat.name ASC
        `),
      ]);

      return {
        scope: 'INSTRUCTOR',
        courses: courses.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          categoryId: c.category_id,
          categoryName: c.category_name,
        })),
        categories: categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })),
        instructors: [],
      };
    }

    // Global scope
    const [courses, categories, instructors] = await Promise.all([
      this.rows(sql`
        SELECT c.id, c.title, c.slug, c.category_id, c.created_by, cat.name category_name
        FROM courses c
        LEFT JOIN categories cat ON cat.id = c.category_id
        WHERE c.archived_at IS NULL
        ORDER BY c.title ASC
      `),
      this.rows(sql`
        SELECT id, name, slug
        FROM categories
        WHERE archived_at IS NULL
        ORDER BY name ASC
      `),
      this.rows(sql`
        SELECT DISTINCT u.id, up.first_name, up.last_name, u.email
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        LEFT JOIN user_profiles up ON up.user_id = u.id
        WHERE r.code = 'INSTRUCTOR' AND u.archived_at IS NULL
        ORDER BY up.first_name ASC, u.email ASC
      `),
    ]);

    return {
      scope: 'GLOBAL',
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        categoryId: c.category_id,
        categoryName: c.category_name,
        createdBy: c.created_by,
      })),
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      })),
      instructors: instructors.map((inst) => ({
        id: inst.id,
        name:
          `${inst.first_name ?? ''} ${inst.last_name ?? ''}`.trim() ||
          String(inst.email),
        email: inst.email,
      })),
    };
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
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const [row] = await this.rows(
      sql`SELECT (SELECT count(*) FROM payments WHERE status='PENDING' AND submitted_at < ${twentyFourHoursAgo}) old_payments,(SELECT count(*) FROM certificates WHERE status='FAILED') failed_certificates,(SELECT count(*) FROM email_deliveries WHERE status='FAILED') failed_emails,(SELECT count(*) FROM report_exports WHERE status='FAILED') failed_exports`,
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
