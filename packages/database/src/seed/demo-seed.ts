import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { schema } from '../schema/index.ts';
import type { AcademyDatabase } from '../queries.ts';
import {
  ACTIVITY_ACTIONS,
  ADMIN_PERSON,
  CAMPAIGN_CATALOG,
  CATEGORY_CATALOG,
  CONTENT_MANAGER_PERSON,
  COURSE_CATALOG,
  DEMO_PASSWORD,
  INSTRUCTOR_PERSON,
  NOTIFICATION_TEMPLATES,
  STUDENT_PEOPLE,
  type DemoPerson,
} from './demo-data.ts';

const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const secureToken = () => randomBytes(32).toString('base64url');
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

export interface DemoSeedCounts {
  roles: number;
  users: number;
  profiles: number;
  categories: number;
  courses: number;
  sections: number;
  lessons: number;
  resources: number;
  enrollments: number;
  progress: number;
  campaigns: number;
  promoCodes: number;
  payments: number;
  certificates: number;
  notifications: number;
  activityLogs: number;
  sessions: number;
}

/** True once the demo dataset's marker account exists - makes re-running `db:seed` a safe no-op. */
export async function demoDataAlreadySeeded(db: AcademyDatabase): Promise<boolean> {
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.emailNormalized, normalizeEmail(ADMIN_PERSON.email)),
  });
  return Boolean(existing);
}

async function seedCustomRoles(tx: AcademyDatabase) {
  const [instructorRole] = await tx
    .insert(schema.roles)
    .values({
      code: 'INSTRUCTOR',
      name: 'Instructor',
      description: 'Creates and manages courses, curriculum, and lesson content.',
      isSystem: false,
    })
    .onConflictDoNothing({ target: schema.roles.code })
    .returning();
  const [contentManagerRole] = await tx
    .insert(schema.roles)
    .values({
      code: 'CONTENT_MANAGER',
      name: 'Content Manager',
      description: 'Manages the course catalog, categories, and promotional campaigns.',
      isSystem: false,
    })
    .onConflictDoNothing({ target: schema.roles.code })
    .returning();

  const instructor =
    instructorRole ??
    (await tx.query.roles.findFirst({ where: eq(schema.roles.code, 'INSTRUCTOR') }));
  const contentManager =
    contentManagerRole ??
    (await tx.query.roles.findFirst({ where: eq(schema.roles.code, 'CONTENT_MANAGER') }));
  if (!instructor || !contentManager) throw new Error('Custom roles could not be seeded');

  const instructorPermissionCodes = [
    'courses.read',
    'courses.create',
    'courses.update',
    'courses.publish',
    'courses.unpublish',
    'courses.duplicate',
    'sections.read',
    'sections.create',
    'sections.update',
    'sections.reorder',
    'sections.archive',
    'lessons.read',
    'lessons.create',
    'lessons.update',
    'lessons.reorder',
    'lessons.publish',
    'lessons.unpublish',
    'lessons.archive',
    'lessons.manage_preview',
    'lessons.manage_resources',
    'categories.read',
    'enrollments.read',
    'learning.read',
    'learning.view_student_progress',
    'learning.view_activity',
    'certificates.read',
    'dashboard.read',
  ];
  const contentManagerPermissionCodes = [
    'categories.read',
    'categories.create',
    'categories.update',
    'categories.reorder',
    'categories.activate',
    'categories.archive',
    'courses.read',
    'courses.create',
    'courses.update',
    'courses.publish',
    'courses.unpublish',
    'courses.archive',
    'courses.restore',
    'courses.duplicate',
    'courses.manage_pricing',
    'courses.manage_visibility',
    'courses.manage_certificate_settings',
    'sections.read',
    'sections.create',
    'sections.update',
    'sections.reorder',
    'sections.archive',
    'lessons.read',
    'lessons.create',
    'lessons.update',
    'lessons.reorder',
    'lessons.publish',
    'lessons.unpublish',
    'lessons.archive',
    'lessons.manage_preview',
    'lessons.manage_resources',
    'promotions.read',
    'promotions.create',
    'promotions.update',
    'promotions.archive',
    'promotions.generate_coupons',
    'promotions.manage_coupons',
    'notifications.read',
    'notifications.manage_templates',
    'dashboard.read',
    'reports.read',
  ];

  const allPermissions = await tx
    .select({ id: schema.permissions.id, code: schema.permissions.code })
    .from(schema.permissions);
  const byCode = new Map(allPermissions.map((permission) => [permission.code, permission.id]));

  const rolePermissionRows = [
    ...instructorPermissionCodes.flatMap((code) => {
      const permissionId = byCode.get(code);
      return permissionId ? [{ roleId: instructor.id, permissionId }] : [];
    }),
    ...contentManagerPermissionCodes.flatMap((code) => {
      const permissionId = byCode.get(code);
      return permissionId ? [{ roleId: contentManager.id, permissionId }] : [];
    }),
  ];
  if (rolePermissionRows.length)
    await tx.insert(schema.rolePermissions).values(rolePermissionRows).onConflictDoNothing();

  return { instructor, contentManager };
}

async function createUser(
  tx: AcademyDatabase,
  person: DemoPerson,
  passwordPlainText: string,
  roleId: string,
) {
  const email = normalizeEmail(person.email);
  const passwordHash = await bcrypt.hash(passwordPlainText, BCRYPT_SALT_ROUNDS);
  const [user] = await tx
    .insert(schema.users)
    .values({
      email,
      emailNormalized: email,
      passwordHash,
      status: 'ACTIVE',
      emailVerified: true,
    })
    .returning();
  if (!user) throw new Error(`Could not create demo user ${email}`);
  await tx.insert(schema.userProfiles).values({
    userId: user.id,
    firstName: person.firstName,
    lastName: person.lastName,
    bio: person.bio,
    phone: person.phone,
  });
  await tx.insert(schema.userRoles).values({ userId: user.id, roleId });
  await tx.insert(schema.userNotificationPreferences).values({ userId: user.id });
  return user;
}

async function seedUsers(
  tx: AcademyDatabase,
  roleIds: { administrator: string; student: string; instructor: string; contentManager: string },
) {
  const admin = await createUser(
    tx,
    ADMIN_PERSON,
    DEMO_PASSWORD.ADMINISTRATOR,
    roleIds.administrator,
  );
  const contentManager = await createUser(
    tx,
    CONTENT_MANAGER_PERSON,
    DEMO_PASSWORD.CONTENT_MANAGER,
    roleIds.contentManager,
  );
  const instructor = await createUser(
    tx,
    INSTRUCTOR_PERSON,
    DEMO_PASSWORD.INSTRUCTOR,
    roleIds.instructor,
  );
  const students = [];
  for (const person of STUDENT_PEOPLE) {
    students.push(await createUser(tx, person, DEMO_PASSWORD.STUDENT, roleIds.student));
  }
  return { admin, contentManager, instructor, students };
}

async function seedCategories(tx: AcademyDatabase) {
  const rows = await tx
    .insert(schema.categories)
    .values(CATEGORY_CATALOG.map((category, index) => ({ ...category, sortOrder: index })))
    .onConflictDoNothing({ target: schema.categories.slug })
    .returning();
  const categories = rows.length ? rows : await tx.select().from(schema.categories);
  return new Map(categories.map((category) => [category.slug, category]));
}

interface SeededCourse {
  id: string;
  slug: string;
  price: string;
  discountPrice: string | null;
  currency: string;
  accessType: 'FREE' | 'PAID';
  certificateEnabled: boolean;
  lessons: { id: string; position: number }[];
}

async function seedCourses(
  tx: AcademyDatabase,
  categoryBySlug: Map<string, { id: string }>,
  instructorUserId: string,
): Promise<{
  bySlug: Map<string, SeededCourse>;
  sectionCount: number;
  lessonCount: number;
  resourceCount: number;
}> {
  const bySlug = new Map<string, SeededCourse>();
  let sectionCount = 0;
  let lessonCount = 0;
  let resourceCount = 0;

  for (const [index, courseData] of COURSE_CATALOG.entries()) {
    const category = categoryBySlug.get(courseData.categorySlug);
    if (!category) throw new Error(`Unknown category slug ${courseData.categorySlug}`);
    const publishedAt = courseData.status === 'PUBLISHED' ? daysFromNow(-90 + index * 4) : null;

    const [course] = await tx
      .insert(schema.courses)
      .values({
        categoryId: category.id,
        createdBy: instructorUserId,
        title: courseData.title,
        slug: courseData.slug,
        shortDescription: courseData.shortDescription,
        description: courseData.description,
        presenterName: `${INSTRUCTOR_PERSON.firstName} ${INSTRUCTOR_PERSON.lastName}`,
        status: courseData.status,
        visibility: 'PUBLIC',
        accessType: courseData.accessType,
        featured: courseData.featured,
        price: courseData.price,
        discountPrice: courseData.discountPrice,
        currency: 'USD',
        difficulty: courseData.difficulty,
        estimatedDurationMinutes: courseData.estimatedDurationMinutes,
        certificateEnabled: courseData.certificateEnabled,
        publishedAt,
        createdAt: daysFromNow(-120 + index * 3),
      })
      .onConflictDoNothing({ target: schema.courses.slug })
      .returning();
    const persisted =
      course ??
      (await tx.query.courses.findFirst({ where: eq(schema.courses.slug, courseData.slug) }));
    if (!persisted) throw new Error(`Could not create course ${courseData.slug}`);

    if (courseData.outcomes.length)
      await tx
        .insert(schema.courseOutcomes)
        .values(
          courseData.outcomes.map((outcome, sortOrder) => ({
            courseId: persisted.id,
            outcome,
            sortOrder,
          })),
        )
        .onConflictDoNothing();
    if (courseData.requirements.length)
      await tx
        .insert(schema.courseRequirements)
        .values(
          courseData.requirements.map((requirement, sortOrder) => ({
            courseId: persisted.id,
            requirement,
            sortOrder,
          })),
        )
        .onConflictDoNothing();

    const lessons: { id: string; position: number }[] = [];
    for (const [sectionIndex, sectionData] of courseData.sections.entries()) {
      const [section] = await tx
        .insert(schema.courseSections)
        .values({
          courseId: persisted.id,
          title: sectionData.title,
          description: sectionData.description,
          position: sectionIndex + 1,
        })
        .returning();
      if (!section) throw new Error(`Could not create section for ${courseData.slug}`);
      sectionCount += 1;

      const lessonRows = await tx
        .insert(schema.lessons)
        .values(
          sectionData.lessons.map((lessonData, lessonIndex) => ({
            courseId: persisted.id,
            sectionId: section.id,
            title: lessonData.title,
            slug: `${sectionIndex + 1}-${lessonIndex + 1}-${lessonData.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')}`,
            lessonType: lessonData.lessonType,
            durationSeconds: lessonData.durationSeconds,
            position: lessonIndex + 1,
            isPreview: lessonIndex === 0 && sectionIndex === 0,
            isPublished: courseData.status === 'PUBLISHED',
          })),
        )
        .returning({ id: schema.lessons.id, position: schema.lessons.position });
      lessonCount += lessonRows.length;
      lessons.push(...lessonRows);

      const resourceRows = sectionData.lessons.flatMap((lessonData, lessonIndex) =>
        (lessonData.resources ?? []).map((resource) => ({
          lessonId: lessonRows[lessonIndex]!.id,
          label: resource.label,
          resourceType: resource.resourceType,
          position: 1,
        })),
      );
      if (resourceRows.length) {
        await tx.insert(schema.lessonResources).values(resourceRows);
        resourceCount += resourceRows.length;
      }
    }

    bySlug.set(courseData.slug, {
      id: persisted.id,
      slug: courseData.slug,
      price: courseData.price,
      discountPrice: courseData.discountPrice ?? null,
      currency: 'USD',
      accessType: courseData.accessType,
      certificateEnabled: courseData.certificateEnabled,
      lessons,
    });
  }

  return { bySlug, sectionCount, lessonCount, resourceCount };
}

interface EnrollmentPlanEntry {
  studentIndex: number;
  courseSlug: string;
  status:
    'PENDING_PAYMENT' | 'WAITING_APPROVAL' | 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedLessonFraction?: number;
  payment?: { status: 'PENDING' | 'APPROVED' | 'DECLINED'; priorDeclined?: boolean };
  cancellationReason?: string;
}

const ENROLLMENT_PLAN: EnrollmentPlanEntry[] = [
  {
    studentIndex: 0,
    courseSlug: 'full-stack-web-development',
    status: 'COMPLETED',
    payment: { status: 'APPROVED' },
  },
  { studentIndex: 0, courseSlug: 'javascript-mastery', status: 'COMPLETED' },
  {
    studentIndex: 0,
    courseSlug: 'advanced-react-development',
    status: 'IN_PROGRESS',
    completedLessonFraction: 0.4,
    payment: { status: 'APPROVED', priorDeclined: true },
  },
  { studentIndex: 0, courseSlug: 'python-for-data-science', status: 'ENROLLED' },
  { studentIndex: 0, courseSlug: 'machine-learning-fundamentals', status: 'PENDING_PAYMENT' },

  { studentIndex: 1, courseSlug: 'digital-marketing-fundamentals', status: 'COMPLETED' },
  {
    studentIndex: 1,
    courseSlug: 'social-media-marketing',
    status: 'IN_PROGRESS',
    completedLessonFraction: 0.6,
    payment: { status: 'APPROVED' },
  },
  {
    studentIndex: 1,
    courseSlug: 'product-management-essentials',
    status: 'CANCELLED',
    payment: { status: 'APPROVED' },
    cancellationReason: 'Schedule conflict with work commitments.',
  },
  {
    studentIndex: 1,
    courseSlug: 'business-strategy-fundamentals',
    status: 'ENROLLED',
    payment: { status: 'APPROVED' },
  },
  {
    studentIndex: 1,
    courseSlug: 'advanced-figma-design',
    status: 'WAITING_APPROVAL',
    payment: { status: 'PENDING' },
  },

  { studentIndex: 2, courseSlug: 'python-for-data-science', status: 'COMPLETED' },
  {
    studentIndex: 2,
    courseSlug: 'machine-learning-fundamentals',
    status: 'IN_PROGRESS',
    completedLessonFraction: 0.7,
    payment: { status: 'APPROVED' },
  },
  {
    studentIndex: 2,
    courseSlug: 'data-analytics-with-python',
    status: 'ENROLLED',
    payment: { status: 'APPROVED' },
  },
  {
    studentIndex: 2,
    courseSlug: 'ui-ux-design-fundamentals',
    status: 'IN_PROGRESS',
    completedLessonFraction: 0.3,
  },
  { studentIndex: 2, courseSlug: 'full-stack-web-development', status: 'PENDING_PAYMENT' },

  { studentIndex: 3, courseSlug: 'ui-ux-design-fundamentals', status: 'COMPLETED' },
  {
    studentIndex: 3,
    courseSlug: 'advanced-figma-design',
    status: 'IN_PROGRESS',
    completedLessonFraction: 0.5,
    payment: { status: 'APPROVED', priorDeclined: true },
  },
  {
    studentIndex: 3,
    courseSlug: 'product-design-masterclass',
    status: 'ENROLLED',
    payment: { status: 'APPROVED' },
  },
  {
    studentIndex: 3,
    courseSlug: 'business-strategy-fundamentals',
    status: 'IN_PROGRESS',
    completedLessonFraction: 0.8,
    payment: { status: 'APPROVED' },
  },
  {
    studentIndex: 3,
    courseSlug: 'machine-learning-fundamentals',
    status: 'ENROLLED',
    payment: { status: 'APPROVED' },
  },
];

async function seedEnrollmentsProgressAndPayments(
  tx: AcademyDatabase,
  students: { id: string }[],
  courseBySlug: Map<string, SeededCourse>,
  adminUserId: string,
) {
  let enrollmentCount = 0;
  let progressCount = 0;
  let paymentCount = 0;

  for (const [index, plan] of ENROLLMENT_PLAN.entries()) {
    const student = students[plan.studentIndex];
    const course = courseBySlug.get(plan.courseSlug);
    if (!student || !course) continue;

    const effectivePrice = course.discountPrice ?? course.price;
    const isTerminalAccess = ['ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(
      plan.status,
    );
    const enrolledAt = isTerminalAccess ? daysFromNow(-60 + index * 2) : null;
    const startedAt = ['IN_PROGRESS', 'COMPLETED'].includes(plan.status)
      ? daysFromNow(-45 + index * 2)
      : null;
    const completedAt = plan.status === 'COMPLETED' ? daysFromNow(-10 + index) : null;
    const cancelledAt = plan.status === 'CANCELLED' ? daysFromNow(-5 + index) : null;

    const [enrollment] = await tx
      .insert(schema.enrollments)
      .values({
        studentId: student.id,
        courseId: course.id,
        status: plan.status,
        priceAtEnrollment: course.price,
        currencyAtEnrollment: course.currency,
        discountAtEnrollment:
          course.discountPrice != null
            ? (Number(course.price) - Number(course.discountPrice)).toFixed(2)
            : '0',
        progressPercentage:
          plan.status === 'COMPLETED'
            ? 100
            : plan.completedLessonFraction
              ? Math.round(plan.completedLessonFraction * 100)
              : 0,
        enrolledAt,
        startedAt,
        completedAt,
        cancelledAt,
        cancelledBy: plan.status === 'CANCELLED' ? adminUserId : null,
        cancellationReason: plan.cancellationReason,
        createdAt: daysFromNow(-60 + index * 2),
      })
      .onConflictDoNothing({ target: [schema.enrollments.studentId, schema.enrollments.courseId] })
      .returning();
    const persisted =
      enrollment ??
      (await tx.query.enrollments.findFirst({
        where: (fields, { and, eq: equals }) =>
          and(equals(fields.studentId, student.id), equals(fields.courseId, course.id)),
      }));
    if (!persisted) continue;
    enrollmentCount += 1;

    // Lesson progress
    const totalLessons = course.lessons.length;
    if (plan.status === 'COMPLETED' && totalLessons) {
      const rows = course.lessons.map((lessonRef) => ({
        enrollmentId: persisted.id,
        lessonId: lessonRef.id,
        status: 'COMPLETED' as const,
        progressPercent: 100,
        firstOpenedAt: daysFromNow(-40 + index),
        lastViewedAt: daysFromNow(-10 + index),
        completedAt: daysFromNow(-10 + index),
      }));
      await tx.insert(schema.lessonProgress).values(rows).onConflictDoNothing();
      progressCount += rows.length;
      const lastLessonId = course.lessons[course.lessons.length - 1]?.id;
      if (lastLessonId)
        await tx
          .update(schema.enrollments)
          .set({ lastLessonId })
          .where(eq(schema.enrollments.id, persisted.id));
    } else if (plan.completedLessonFraction && totalLessons) {
      const completedCount = Math.max(1, Math.round(plan.completedLessonFraction * totalLessons));
      const ordered = [...course.lessons].sort((a, b) => a.position - b.position);
      const rows: (typeof schema.lessonProgress.$inferInsert)[] = ordered
        .slice(0, completedCount)
        .map((lessonRef) => ({
          enrollmentId: persisted.id,
          lessonId: lessonRef.id,
          status: 'COMPLETED',
          progressPercent: 100,
          firstOpenedAt: daysFromNow(-30 + index),
          lastViewedAt: daysFromNow(-8 + index),
          completedAt: daysFromNow(-8 + index),
        }));
      const currentLesson = ordered[completedCount];
      if (currentLesson)
        rows.push({
          enrollmentId: persisted.id,
          lessonId: currentLesson.id,
          status: 'IN_PROGRESS',
          progressPercent: 40,
          firstOpenedAt: daysFromNow(-3),
          lastViewedAt: daysFromNow(-1),
        });
      await tx.insert(schema.lessonProgress).values(rows).onConflictDoNothing();
      progressCount += rows.length;
      await tx
        .update(schema.enrollments)
        .set({ lastLessonId: (currentLesson ?? ordered[completedCount - 1])?.id })
        .where(eq(schema.enrollments.id, persisted.id));
    }

    // Payments
    if (plan.payment && course.accessType === 'PAID') {
      let attemptNumber = 1;
      if (plan.payment.priorDeclined) {
        await tx.insert(schema.payments).values({
          enrollmentId: persisted.id,
          attemptNumber,
          transactionId: `DEMO-TX-${index}-A`,
          transactionIdNormalized: `demo-tx-${index}-a`,
          amount: effectivePrice,
          expectedAmountSnapshot: effectivePrice,
          currency: course.currency,
          status: 'DECLINED',
          declineReason: 'Receipt did not match the expected transfer amount.',
          reviewerId: adminUserId,
          submittedAt: daysFromNow(-20 + index),
          reviewedAt: daysFromNow(-19 + index),
        });
        paymentCount += 1;
        attemptNumber += 1;
      }
      await tx.insert(schema.payments).values({
        enrollmentId: persisted.id,
        attemptNumber,
        transactionId: `DEMO-TX-${index}-${attemptNumber}`,
        transactionIdNormalized: `demo-tx-${index}-${attemptNumber}`,
        amount: effectivePrice,
        expectedAmountSnapshot: effectivePrice,
        currency: course.currency,
        status: plan.payment.status,
        reviewerId: plan.payment.status === 'PENDING' ? null : adminUserId,
        submittedAt: daysFromNow(-18 + index),
        reviewedAt: plan.payment.status === 'PENDING' ? null : daysFromNow(-17 + index),
      });
      paymentCount += 1;
    }
  }

  return { enrollmentCount, progressCount, paymentCount };
}

async function seedCertificates(tx: AcademyDatabase, generatedBy: string) {
  const template = await tx.query.certificateTemplates.findFirst({
    where: eq(schema.certificateTemplates.isDefault, true),
  });
  if (!template) return 0;

  const completedEnrollments = await tx.query.enrollments.findMany({
    where: eq(schema.enrollments.status, 'COMPLETED'),
  });
  let count = 0;
  for (const enrollment of completedEnrollments) {
    const course = await tx.query.courses.findFirst({
      where: eq(schema.courses.id, enrollment.courseId),
    });
    const profile = await tx.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.userId, enrollment.studentId),
    });
    if (!course) continue;
    const certificateNumber = `JTA-2026-${String(count + 1).padStart(6, '0')}`;
    await tx
      .insert(schema.certificates)
      .values({
        enrollmentId: enrollment.id,
        templateId: template.id,
        certificateNumber,
        verificationToken: secureToken(),
        studentNameAtIssue: profile
          ? `${profile.firstName} ${profile.lastName}`
          : 'Academy Student',
        courseTitleAtIssue: course.title,
        completionDateSnapshot: enrollment.completedAt,
        templateNameSnapshot: template.name,
        templateVersionSnapshot: template.version,
        status: 'GENERATED',
        issuedAt: enrollment.completedAt,
        generatedAt: enrollment.completedAt,
        generatedBy,
      })
      .onConflictDoNothing();
    count += 1;
  }
  return count;
}

async function seedPromotions(tx: AcademyDatabase, createdBy: string) {
  let campaignCount = 0;
  let codeCount = 0;
  for (const campaignData of CAMPAIGN_CATALOG) {
    const [campaign] = await tx
      .insert(schema.promoCampaigns)
      .values({
        name: campaignData.name,
        description: campaignData.description,
        type: campaignData.type,
        status: campaignData.status,
        discountType: campaignData.discountType,
        discountValue: campaignData.discountValue,
        startsAt: daysFromNow(campaignData.startsInDays),
        endsAt: campaignData.endsInDays != null ? daysFromNow(campaignData.endsInDays) : null,
        createdBy,
      })
      .returning();
    if (!campaign) continue;
    campaignCount += 1;
    const codeRows = campaignData.codes.map((codeData) => ({
      campaignId: campaign.id,
      code: codeData.code,
      codeType: 'MANUAL' as const,
      status: codeData.status,
      maxRedemptions: codeData.maxRedemptions,
      validUntil: codeData.validUntilInDays != null ? daysFromNow(codeData.validUntilInDays) : null,
      createdBy,
    }));
    await tx.insert(schema.promoCodes).values(codeRows).onConflictDoNothing({
      target: schema.promoCodes.code,
    });
    codeCount += codeRows.length;
  }
  return { campaignCount, codeCount };
}

async function seedNotifications(
  tx: AcademyDatabase,
  staff: { id: string }[],
  students: { id: string }[],
) {
  // Templates: 0 enrollment, 1 payment received, 2 payment approved, 3 certificate,
  // 4 course completed, 5 promotion, 6 security login, 7 security password changed.
  const staffTemplateIndexes = [6];
  const studentTemplateIndexes = [0, 1, 2];
  const completedCourseExtraIndexes = [3, 4];

  const assignments: { userId: string; templateIndex: number }[] = [];
  staff.forEach((user) => {
    staffTemplateIndexes.forEach((templateIndex) =>
      assignments.push({ userId: user.id, templateIndex }),
    );
  });
  students.forEach((user) => {
    studentTemplateIndexes.forEach((templateIndex) =>
      assignments.push({ userId: user.id, templateIndex }),
    );
    // Every student has at least one COMPLETED enrollment in the plan below, so each
    // gets the certificate/course-completed notifications too, matching seedCertificates' output.
    completedCourseExtraIndexes.forEach((templateIndex) =>
      assignments.push({ userId: user.id, templateIndex }),
    );
  });

  const rows = assignments.map(({ userId, templateIndex }, index) => {
    const template = NOTIFICATION_TEMPLATES[templateIndex]!;
    const isRead = index % 3 !== 0;
    return {
      userId,
      channel: 'IN_APP' as const,
      status: 'SENT' as const,
      type: template.type,
      title: template.title,
      body: template.body,
      priority: template.priority,
      readAt: isRead ? daysFromNow(-index - 1) : null,
      createdAt: daysFromNow(-index - 2),
    };
  });
  await tx.insert(schema.notifications).values(rows);
  return rows.length;
}

async function seedActivityLogs(tx: AcademyDatabase, actors: { id: string }[]) {
  const actions = Object.values(ACTIVITY_ACTIONS);
  const rows = Array.from({ length: 32 }, (_, index) => {
    const actor = actors[index % actors.length];
    const action = actions[index % actions.length];
    return {
      actorId: actor?.id,
      action: action ?? 'user.login',
      entityType: (action ?? '').split('.')[0] ?? 'user',
      ipAddress: `10.0.${index % 8}.${(index * 7) % 255}`,
      userAgent: 'Mozilla/5.0 (Demo Seed)',
      createdAt: daysFromNow(-index * 2 - 1),
    };
  });
  await tx.insert(schema.activityLogs).values(rows);
  return rows.length;
}

async function seedSessions(tx: AcademyDatabase, users: { id: string }[]) {
  let count = 0;
  const sessionPlan = [
    { userIndex: 0, sessions: 1, expired: false },
    { userIndex: 1, sessions: 2, expired: false },
    { userIndex: 2, sessions: 1, expired: true },
  ];
  for (const plan of sessionPlan) {
    const user = users[plan.userIndex];
    if (!user) continue;
    for (let i = 0; i < plan.sessions; i += 1) {
      await tx.insert(schema.refreshSessions).values({
        userId: user.id,
        tokenHash: hashToken(secureToken()),
        expiresAt: plan.expired ? daysFromNow(-1) : daysFromNow(30),
        revokedAt: plan.expired ? daysFromNow(-1) : null,
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0 (Demo Seed)',
        lastUsedAt: daysFromNow(-1),
      });
      count += 1;
    }
  }
  return count;
}

export async function seedDemoData(database: AcademyDatabase): Promise<DemoSeedCounts> {
  return database.transaction(async (rawTx) => {
    const tx = rawTx as AcademyDatabase;

    const administratorRole = await tx.query.roles.findFirst({
      where: eq(schema.roles.code, 'ADMINISTRATOR'),
    });
    const studentRole = await tx.query.roles.findFirst({
      where: eq(schema.roles.code, 'STUDENT'),
    });
    if (!administratorRole || !studentRole)
      throw new Error('System roles are missing - run the RBAC baseline seed first');

    const { instructor: instructorRole, contentManager: contentManagerRole } =
      await seedCustomRoles(tx);

    const { admin, contentManager, instructor, students } = await seedUsers(tx, {
      administrator: administratorRole.id,
      student: studentRole.id,
      instructor: instructorRole.id,
      contentManager: contentManagerRole.id,
    });

    const categoryBySlug = await seedCategories(tx);
    const {
      bySlug: courseBySlug,
      sectionCount,
      lessonCount,
      resourceCount,
    } = await seedCourses(tx, categoryBySlug, instructor.id);

    const { enrollmentCount, progressCount, paymentCount } =
      await seedEnrollmentsProgressAndPayments(tx, students, courseBySlug, admin.id);

    const certificateCount = await seedCertificates(tx, admin.id);
    const { campaignCount, codeCount } = await seedPromotions(tx, contentManager.id);

    const allUsers = [admin, contentManager, instructor, ...students];
    const notificationCount = await seedNotifications(
      tx,
      [admin, contentManager, instructor],
      students,
    );
    const activityLogCount = await seedActivityLogs(tx, allUsers);
    const sessionCount = await seedSessions(tx, [admin, instructor, ...students]);

    return {
      roles: 2,
      users: allUsers.length,
      profiles: allUsers.length,
      categories: categoryBySlug.size,
      courses: courseBySlug.size,
      sections: sectionCount,
      lessons: lessonCount,
      resources: resourceCount,
      enrollments: enrollmentCount,
      progress: progressCount,
      campaigns: campaignCount,
      promoCodes: codeCount,
      payments: paymentCount,
      certificates: certificateCount,
      notifications: notificationCount,
      activityLogs: activityLogCount,
      sessions: sessionCount,
    };
  });
}
