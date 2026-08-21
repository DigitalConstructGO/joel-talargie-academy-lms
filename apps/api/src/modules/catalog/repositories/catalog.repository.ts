import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  sql,
  schema,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import type {
  CreateCategoryDto,
  CreateCourseDto,
  CreateLessonDto,
  CreateResourceDto,
  CreateSectionDto,
  ListCategoriesDto,
  ListCoursesDto,
  ReorderCategoriesDto,
  ReorderDto,
} from '../dto/catalog.dto';

@Injectable()
export class CatalogRepository {
  constructor(private readonly database: DatabaseService) {}
  private get db() {
    return this.database.client;
  }
  categoryById(id: string) {
    return this.db.query.categories.findFirst({
      where: eq(schema.categories.id, id),
    });
  }
  categoryBySlug(slug: string) {
    return this.db.query.categories.findFirst({
      where: eq(schema.categories.slug, slug),
    });
  }
  courseById(id: string) {
    return this.db.query.courses.findFirst({
      where: eq(schema.courses.id, id),
    });
  }
  courseBySlug(slug: string) {
    return this.db.query.courses.findFirst({
      where: eq(schema.courses.slug, slug),
    });
  }
  courseCategory(categoryId: string) {
    return this.db.query.categories.findFirst({
      where: eq(schema.categories.id, categoryId),
      columns: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        archivedAt: true,
      },
    });
  }
  sectionById(id: string) {
    return this.db.query.courseSections.findFirst({
      where: eq(schema.courseSections.id, id),
    });
  }
  lessonById(id: string) {
    return this.db.query.lessons.findFirst({
      where: eq(schema.lessons.id, id),
    });
  }
  resourceById(id: string) {
    return this.db.query.lessonResources.findFirst({
      where: eq(schema.lessonResources.id, id),
    });
  }

  createCategory(actorId: string, dto: CreateCategoryDto, slug: string) {
    return this.db.transaction(async (tx) => {
      if (
        dto.parentId &&
        !(await tx.query.categories.findFirst({
          where: and(
            eq(schema.categories.id, dto.parentId),
            isNull(schema.categories.archivedAt),
          ),
        }))
      )
        throw new Error('CATEGORY_NOT_FOUND');
      const [row] = await tx
        .insert(schema.categories)
        .values({
          name: dto.name.trim(),
          slug,
          description: dto.description,
          parentId: dto.parentId,
          imageKey: dto.imageKey,
          isActive: dto.isActive ?? true,
          sortOrder: dto.sortOrder ?? 0,
        })
        .returning();
      if (!row) throw new Error('CATEGORY_CREATE_FAILED');
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'category.created',
        entityType: 'category',
        entityId: row.id,
        after: { name: row.name, slug: row.slug },
      });
      return row;
    });
  }
  async categoryCycle(categoryId: string, parentId: string | null | undefined) {
    if (!parentId) return false;
    const rows = await this.db.execute(
      sql`WITH RECURSIVE ancestors AS (SELECT id,parent_id FROM categories WHERE id=${parentId} UNION ALL SELECT c.id,c.parent_id FROM categories c JOIN ancestors a ON c.id=a.parent_id) SELECT 1 FROM ancestors WHERE id=${categoryId} LIMIT 1`,
    );
    return Boolean(rows.rows[0]);
  }
  updateCategory(actorId: string, id: string, values: Record<string, unknown>) {
    return this.db.transaction(async (tx) => {
      const before = await tx.query.categories.findFirst({
        where: eq(schema.categories.id, id),
      });
      if (!before) throw new Error('CATEGORY_NOT_FOUND');
      const [row] = await tx
        .update(schema.categories)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(schema.categories.id, id))
        .returning();
      await tx.insert(schema.activityLogs).values({
        actorId,
        action:
          values.isActive === true
            ? 'category.activated'
            : values.isActive === false
              ? 'category.deactivated'
              : 'category.updated',
        entityType: 'category',
        entityId: id,
        before,
        after: values,
      });
      return row;
    });
  }
  reorderCategories(actorId: string, dto: ReorderCategoriesDto) {
    return this.db.transaction(async (tx) => {
      const ids = dto.items.map((x) => x.categoryId);
      const rows = await tx
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(inArray(schema.categories.id, ids));
      if (rows.length !== new Set(ids).size || ids.length !== new Set(ids).size)
        throw new Error('INVALID_SORT_ORDER');
      for (const item of dto.items)
        await tx
          .update(schema.categories)
          .set({
            parentId: item.parentId ?? null,
            sortOrder: item.sortOrder,
            updatedAt: new Date(),
          })
          .where(eq(schema.categories.id, item.categoryId));
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'category.reordered',
        entityType: 'category',
        after: { count: dto.items.length },
      });
      return { updated: dto.items.length };
    });
  }
  categoryArchiveCounts(id: string) {
    return Promise.all([
      this.db
        .select({ value: count() })
        .from(schema.categories)
        .where(
          and(
            eq(schema.categories.parentId, id),
            eq(schema.categories.isActive, true),
            isNull(schema.categories.archivedAt),
          ),
        ),
      this.db
        .select({ value: count() })
        .from(schema.courses)
        .where(
          and(
            eq(schema.courses.categoryId, id),
            ne(schema.courses.status, 'ARCHIVED'),
            isNull(schema.courses.archivedAt),
          ),
        ),
    ]);
  }
  archiveCategory(actorId: string, id: string) {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(schema.categories)
        .set({ isActive: false, archivedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.categories.id, id))
        .returning();
      if (!row) throw new Error('CATEGORY_NOT_FOUND');
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'category.archived',
        entityType: 'category',
        entityId: id,
        before: { archivedAt: null },
        after: { archivedAt: row.archivedAt },
      });
      return row;
    });
  }
  async listCategories(query: ListCategoriesDto, publicOnly = false) {
    const conditions = [
      publicOnly
        ? eq(schema.categories.isActive, true)
        : query.isActive === undefined
          ? undefined
          : eq(schema.categories.isActive, query.isActive),
      publicOnly || !query.includeArchived
        ? isNull(schema.categories.archivedAt)
        : undefined,
      query.parentId
        ? eq(schema.categories.parentId, query.parentId)
        : undefined,
      query.search
        ? sql`${schema.categories.name} ILIKE ${`%${query.search}%`}`
        : undefined,
    ].filter(Boolean);
    const items = await this.db
      .select()
      .from(schema.categories)
      .where(and(...conditions))
      .orderBy(
        asc(schema.categories.sortOrder),
        asc(schema.categories.name),
        asc(schema.categories.id),
      )
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    const [{ total = 0 } = {}] = await this.db
      .select({ total: count() })
      .from(schema.categories)
      .where(and(...conditions));
    return { items, total: Number(total) };
  }
  async categoryDetail(id: string) {
    const category = await this.categoryById(id);
    if (!category) return null;
    const [children, counts] = await Promise.all([
      this.db
        .select({
          id: schema.categories.id,
          name: schema.categories.name,
          slug: schema.categories.slug,
          isActive: schema.categories.isActive,
          sortOrder: schema.categories.sortOrder,
        })
        .from(schema.categories)
        .where(
          and(
            eq(schema.categories.parentId, id),
            isNull(schema.categories.archivedAt),
          ),
        )
        .orderBy(asc(schema.categories.sortOrder)),
      this.db
        .select({ status: schema.courses.status, value: count() })
        .from(schema.courses)
        .where(eq(schema.courses.categoryId, id))
        .groupBy(schema.courses.status),
    ]);
    return {
      ...category,
      children,
      courseCounts: Object.fromEntries(
        counts.map((x) => [x.status, Number(x.value)]),
      ),
    };
  }

  createCourse(
    actorId: string,
    dto: CreateCourseDto,
    slug: string,
    description: string,
  ) {
    return this.db.transaction(async (tx) => {
      const category = await tx.query.categories.findFirst({
        where: and(
          eq(schema.categories.id, dto.categoryId),
          eq(schema.categories.isActive, true),
          isNull(schema.categories.archivedAt),
        ),
      });
      if (!category) throw new Error('CATEGORY_NOT_FOUND');
      const [course] = await tx
        .insert(schema.courses)
        .values({
          categoryId: dto.categoryId,
          createdBy: actorId,
          title: dto.title.trim(),
          slug,
          shortDescription: dto.shortDescription.trim(),
          description,
          thumbnailKey: dto.thumbnailKey,
          presenterName: dto.presenterName?.trim() || 'Joel Talargie Academy',
          accessType: dto.accessType,
          price: dto.price ?? '0',
          discountPrice: dto.discountPrice,
          currency: dto.currency ?? 'ETB',
          difficulty: dto.difficulty,
          estimatedDurationMinutes: dto.estimatedDurationMinutes,
          visibility: dto.visibility ?? 'PUBLIC',
          certificateEnabled: dto.certificateEnabled ?? false,
          featured: dto.featured ?? false,
          enrollmentOpenAt: dto.enrollmentOpenAt
            ? new Date(dto.enrollmentOpenAt)
            : undefined,
          enrollmentCloseAt: dto.enrollmentCloseAt
            ? new Date(dto.enrollmentCloseAt)
            : undefined,
          capacity: dto.capacity,
          status: 'DRAFT',
        })
        .returning();
      if (!course) throw new Error('COURSE_CREATE_FAILED');
      if (dto.outcomes?.length)
        await tx.insert(schema.courseOutcomes).values(
          dto.outcomes.map((outcome, sortOrder) => ({
            courseId: course.id,
            outcome: outcome.trim(),
            sortOrder,
          })),
        );
      if (dto.requirements?.length)
        await tx.insert(schema.courseRequirements).values(
          dto.requirements.map((requirement, sortOrder) => ({
            courseId: course.id,
            requirement: requirement.trim(),
            sortOrder,
          })),
        );
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'course.created',
        entityType: 'course',
        entityId: course.id,
        after: { title: course.title, slug: course.slug, status: 'DRAFT' },
      });
      return course;
    });
  }
  updateCourse(
    actorId: string,
    id: string,
    values: Record<string, unknown>,
    action = 'course.updated',
  ) {
    return this.db.transaction(async (tx) => {
      const before = await tx.query.courses.findFirst({
        where: eq(schema.courses.id, id),
      });
      if (!before) throw new Error('COURSE_NOT_FOUND');
      if (
        (action === 'course.unpublished' && before.status !== 'PUBLISHED') ||
        (action === 'course.restored' && before.status !== 'ARCHIVED') ||
        (action === 'course.archived' && before.status === 'ARCHIVED')
      )
        throw new Error('INVALID_STATUS_TRANSITION');
      if (before.status === 'ARCHIVED') throw new Error('COURSE_ARCHIVED');
      const [row] = await tx
        .update(schema.courses)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(schema.courses.id, id))
        .returning();
      await tx.insert(schema.activityLogs).values({
        actorId,
        action,
        entityType: 'course',
        entityId: id,
        before,
        after: values,
      });
      return row;
    });
  }
  replaceCourseItems(
    actorId: string,
    courseId: string,
    type: 'outcomes' | 'requirements',
    items: string[],
  ) {
    return this.db.transaction(async (tx) => {
      if (
        !(await tx.query.courses.findFirst({
          where: eq(schema.courses.id, courseId),
        }))
      )
        throw new Error('COURSE_NOT_FOUND');
      const table =
        type === 'outcomes' ? schema.courseOutcomes : schema.courseRequirements;
      await tx.delete(table).where(eq(table.courseId, courseId));
      if (items.length) {
        if (type === 'outcomes')
          await tx.insert(schema.courseOutcomes).values(
            items.map((outcome, sortOrder) => ({
              courseId,
              outcome: outcome.trim(),
              sortOrder,
            })),
          );
        else
          await tx.insert(schema.courseRequirements).values(
            items.map((requirement, sortOrder) => ({
              courseId,
              requirement: requirement.trim(),
              sortOrder,
            })),
          );
      }
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: `course.${type}_updated`,
        entityType: 'course',
        entityId: courseId,
        after: { count: items.length },
      });
      return { updated: items.length };
    });
  }
  async readiness(courseId: string) {
    const course = await this.courseById(courseId);
    if (!course) return null;
    const [[{ sections = 0, publishedLessons = 0 } = {}], outcomes] =
      await Promise.all([
        this.db
          .select({
            sections: count(sql`distinct ${schema.courseSections.id}`),
            publishedLessons: count(
              sql`case when ${schema.lessons.isPublished}=true and ${schema.lessons.archivedAt} is null then 1 end`,
            ),
          })
          .from(schema.courseSections)
          .leftJoin(
            schema.lessons,
            eq(schema.lessons.sectionId, schema.courseSections.id),
          )
          .where(eq(schema.courseSections.courseId, courseId)),
        this.db
          .select({ id: schema.courseOutcomes.id })
          .from(schema.courseOutcomes)
          .where(eq(schema.courseOutcomes.courseId, courseId))
          .limit(1),
      ]);
    const issues: string[] = [];
    if (!course.title || !course.description || !course.shortDescription)
      issues.push('COURSE_DETAILS_REQUIRED');
    if (Number(sections) < 1) issues.push('SECTION_REQUIRED');
    if (Number(publishedLessons) < 1) issues.push('PUBLISHED_LESSON_REQUIRED');
    if (!outcomes.length) issues.push('OUTCOME_REQUIRED');
    if (course.accessType === 'PAID' && Number(course.price) <= 0)
      issues.push('VALID_PRICE_REQUIRED');
    return {
      ready: issues.length === 0,
      issues,
      sectionCount: Number(sections),
      publishedLessonCount: Number(publishedLessons),
    };
  }
  publishCourse(actorId: string, id: string) {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(schema.courses)
        .set({
          status: 'PUBLISHED',
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.courses.id, id),
            eq(schema.courses.status, 'DRAFT'),
            isNull(schema.courses.archivedAt),
          ),
        )
        .returning();
      if (!row) throw new Error('INVALID_STATUS_TRANSITION');
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'course.published',
        entityType: 'course',
        entityId: id,
        after: { status: 'PUBLISHED', publishedAt: row.publishedAt },
      });
      return row;
    });
  }
  courseStatus(
    actorId: string,
    id: string,
    status: 'DRAFT' | 'ARCHIVED',
    action: string,
  ) {
    return this.db.transaction(async (tx) => {
      const before = await tx.query.courses.findFirst({
        where: eq(schema.courses.id, id),
      });
      if (!before) throw new Error('COURSE_NOT_FOUND');
      const [row] = await tx
        .update(schema.courses)
        .set({
          status,
          publishedAt: status === 'DRAFT' ? null : before.publishedAt,
          archivedAt: status === 'ARCHIVED' ? new Date() : null,
          featured: false,
          updatedAt: new Date(),
        })
        .where(eq(schema.courses.id, id))
        .returning();
      await tx.insert(schema.activityLogs).values({
        actorId,
        action,
        entityType: 'course',
        entityId: id,
        before: { status: before.status },
        after: { status },
      });
      return row;
    });
  }
  async courseDetail(id: string) {
    const course = await this.courseById(id);
    if (!course) return null;
    const [
      outcomes,
      requirements,
      sections,
      lessons,
      resources,
      readiness,
      creator,
      category,
    ] = await Promise.all([
      this.db
        .select()
        .from(schema.courseOutcomes)
        .where(eq(schema.courseOutcomes.courseId, id))
        .orderBy(asc(schema.courseOutcomes.sortOrder)),
      this.db
        .select()
        .from(schema.courseRequirements)
        .where(eq(schema.courseRequirements.courseId, id))
        .orderBy(asc(schema.courseRequirements.sortOrder)),
      this.db
        .select()
        .from(schema.courseSections)
        .where(eq(schema.courseSections.courseId, id))
        .orderBy(asc(schema.courseSections.position)),
      this.db
        .select()
        .from(schema.lessons)
        .where(eq(schema.lessons.courseId, id))
        .orderBy(asc(schema.lessons.position)),
      this.db
        .select()
        .from(schema.lessonResources)
        .innerJoin(
          schema.lessons,
          eq(schema.lessonResources.lessonId, schema.lessons.id),
        )
        .where(eq(schema.lessons.courseId, id)),
      this.readiness(id),
      this.db.query.users.findFirst({
        where: eq(schema.users.id, course.createdBy),
        columns: { id: true, email: true },
      }),
      this.db.query.categories.findFirst({
        where: eq(schema.categories.id, course.categoryId),
        columns: { id: true, name: true, slug: true },
      }),
    ]);
    const creatorProfile = creator
      ? await this.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.userId, creator.id),
          columns: { firstName: true, lastName: true },
        })
      : null;
    return {
      ...course,
      categoryName: category?.name,
      categorySlug: category?.slug,
      creator: creator
        ? {
            id: creator.id,
            email: creator.email,
            name:
              creatorProfile &&
              [creatorProfile.firstName, creatorProfile.lastName]
                .filter(Boolean)
                .join(' '),
          }
        : null,
      outcomes,
      requirements,
      sections: sections.map((section) => ({
        ...section,
        lessons: lessons
          .filter((x) => x.sectionId === section.id)
          .map((lesson) => ({
            ...lesson,
            isPublished: Boolean(lesson.isPublished),
            publishedAt: lesson.isPublished
              ? ((lesson as unknown as { updatedAt?: string }).updatedAt ??
                new Date().toISOString())
              : null,
            resources: resources
              .filter((x) => x.lesson_resources.lessonId === lesson.id)
              .map((x) => ({
                ...x.lesson_resources,
                title: x.lesson_resources.label,
                sortOrder: x.lesson_resources.position,
              })),
          })),
      })),
      readiness,
    };
  }
  duplicateCourse(
    actorId: string,
    sourceId: string,
    title: string,
    slug: string,
  ) {
    return this.db.transaction(async (tx) => {
      const source = await tx.query.courses.findFirst({
        where: eq(schema.courses.id, sourceId),
      });
      if (!source) throw new Error('COURSE_NOT_FOUND');
      const [course] = await tx
        .insert(schema.courses)
        .values({
          categoryId: source.categoryId,
          createdBy: actorId,
          title,
          slug,
          shortDescription: source.shortDescription,
          description: source.description,
          thumbnailKey: source.thumbnailKey,
          presenterName: source.presenterName,
          status: 'DRAFT',
          visibility: source.visibility,
          accessType: source.accessType,
          featured: false,
          price: source.price,
          discountPrice: source.discountPrice,
          currency: source.currency,
          difficulty: source.difficulty,
          estimatedDurationMinutes: source.estimatedDurationMinutes,
          certificateEnabled: source.certificateEnabled,
          enrollmentOpenAt: source.enrollmentOpenAt,
          enrollmentCloseAt: source.enrollmentCloseAt,
          capacity: source.capacity,
        })
        .returning();
      if (!course) throw new Error('COURSE_CREATE_FAILED');
      const [outcomes, requirements, sections, lessons] = await Promise.all([
        tx
          .select()
          .from(schema.courseOutcomes)
          .where(eq(schema.courseOutcomes.courseId, sourceId)),
        tx
          .select()
          .from(schema.courseRequirements)
          .where(eq(schema.courseRequirements.courseId, sourceId)),
        tx
          .select()
          .from(schema.courseSections)
          .where(
            and(
              eq(schema.courseSections.courseId, sourceId),
              isNull(schema.courseSections.archivedAt),
            ),
          ),
        tx
          .select()
          .from(schema.lessons)
          .where(
            and(
              eq(schema.lessons.courseId, sourceId),
              isNull(schema.lessons.archivedAt),
            ),
          ),
      ]);
      if (outcomes.length)
        await tx.insert(schema.courseOutcomes).values(
          outcomes.map((x) => ({
            courseId: course.id,
            outcome: x.outcome,
            sortOrder: x.sortOrder,
          })),
        );
      if (requirements.length)
        await tx.insert(schema.courseRequirements).values(
          requirements.map((x) => ({
            courseId: course.id,
            requirement: x.requirement,
            sortOrder: x.sortOrder,
          })),
        );
      // Multi-row INSERT ... RETURNING preserves the input VALUES order for a
      // plain insert (no ON CONFLICT), so a single batched insert can be
      // safely zipped back to source ids by index - this replaces what used
      // to be one round trip per section/lesson with one round trip total,
      // without changing which rows end up copied.
      const sectionCopies = sections.length
        ? await tx
            .insert(schema.courseSections)
            .values(
              sections.map((section) => ({
                courseId: course.id,
                title: section.title,
                description: section.description,
                position: section.position,
              })),
            )
            .returning({ id: schema.courseSections.id })
        : [];
      const sectionIds = new Map<string, string>(
        sections.map((section, index) => [
          section.id,
          sectionCopies[index]!.id,
        ]),
      );
      const lessonsToCopy = lessons
        .map((lesson) => ({
          lesson,
          sectionId: sectionIds.get(lesson.sectionId),
        }))
        .filter(
          (
            entry,
          ): entry is { lesson: (typeof lessons)[number]; sectionId: string } =>
            Boolean(entry.sectionId),
        );
      const lessonCopies = lessonsToCopy.length
        ? await tx
            .insert(schema.lessons)
            .values(
              lessonsToCopy.map(({ lesson, sectionId }) => ({
                courseId: course.id,
                sectionId,
                title: lesson.title,
                slug: lesson.slug,
                lessonType: lesson.lessonType,
                content: lesson.content,
                videoUrl: lesson.videoUrl,
                externalUrl: lesson.externalUrl,
                durationSeconds: lesson.durationSeconds,
                position: lesson.position,
                isMandatory: lesson.isMandatory,
                isPreview: lesson.isPreview,
                isPublished: false,
              })),
            )
            .returning({ id: schema.lessons.id })
        : [];
      const lessonIds = new Map<string, string>(
        lessonsToCopy.map(({ lesson }, index) => [
          lesson.id,
          lessonCopies[index]!.id,
        ]),
      );
      if (lessonIds.size) {
        const resources = await tx
          .select()
          .from(schema.lessonResources)
          .where(
            inArray(schema.lessonResources.lessonId, [...lessonIds.keys()]),
          );
        if (resources.length)
          await tx.insert(schema.lessonResources).values(
            resources.map((resource) => ({
              lessonId: lessonIds.get(resource.lessonId)!,
              label: resource.label,
              resourceType: resource.resourceType,
              storageKey: resource.storageKey,
              externalUrl: resource.externalUrl,
              originalFileName: resource.originalFileName,
              mimeType: resource.mimeType,
              fileSize: resource.fileSize,
              visibility: resource.visibility,
              position: resource.position,
            })),
          );
      }
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'course.duplicated',
        entityType: 'course',
        entityId: course.id,
        after: { sourceCourseId: sourceId, title, slug },
      });
      return course;
    });
  }

  async listCourses(query: ListCoursesDto, publicOnly = false) {
    const searchTerm = query.search?.trim();
    const searchCondition = searchTerm
      ? or(
          sql`${schema.courses.searchVector} @@ websearch_to_tsquery('simple', ${searchTerm})`,
          ilike(
            schema.courses.title,
            `%${searchTerm.replace(/[%_\\]/g, '\\$&')}%`,
          ),
          ilike(
            schema.courses.shortDescription,
            `%${searchTerm.replace(/[%_\\]/g, '\\$&')}%`,
          ),
          ilike(
            schema.courses.description,
            `%${searchTerm.replace(/[%_\\]/g, '\\$&')}%`,
          ),
          ilike(
            schema.courses.presenterName,
            `%${searchTerm.replace(/[%_\\]/g, '\\$&')}%`,
          ),
          ilike(
            schema.courses.slug,
            `%${searchTerm.replace(/[%_\\]/g, '\\$&')}%`,
          ),
          ilike(
            schema.categories.name,
            `%${searchTerm.replace(/[%_\\]/g, '\\$&')}%`,
          ),
        )
      : undefined;

    const conditions = [
      publicOnly
        ? eq(schema.courses.status, 'PUBLISHED')
        : query.status
          ? eq(schema.courses.status, query.status)
          : undefined,
      publicOnly
        ? eq(schema.courses.visibility, 'PUBLIC')
        : query.visibility
          ? eq(schema.courses.visibility, query.visibility)
          : undefined,
      publicOnly
        ? or(isNull(schema.categories.id), eq(schema.categories.isActive, true))
        : undefined,
      isNull(schema.courses.archivedAt),
      query.accessType
        ? eq(schema.courses.accessType, query.accessType)
        : undefined,
      query.difficulty
        ? eq(schema.courses.difficulty, query.difficulty)
        : undefined,
      query.categoryId
        ? eq(schema.courses.categoryId, query.categoryId)
        : undefined,
      query.createdBy
        ? eq(schema.courses.createdBy, query.createdBy)
        : undefined,
      query.featured === undefined
        ? undefined
        : eq(schema.courses.featured, query.featured),
      searchCondition,
    ].filter(Boolean);
    const order =
      query.sort === 'oldest'
        ? [asc(schema.courses.createdAt), asc(schema.courses.id)]
        : query.sort === 'title_asc'
          ? [asc(schema.courses.title), asc(schema.courses.id)]
          : query.sort === 'title_desc'
            ? [desc(schema.courses.title), desc(schema.courses.id)]
            : query.sort === 'price_asc'
              ? [asc(schema.courses.price), asc(schema.courses.id)]
              : query.sort === 'price_desc'
                ? [desc(schema.courses.price), desc(schema.courses.id)]
                : query.sort === 'featured'
                  ? [
                      desc(schema.courses.featured),
                      desc(schema.courses.publishedAt),
                      desc(schema.courses.id),
                    ]
                  : [desc(schema.courses.createdAt), desc(schema.courses.id)];
    const items = await this.db
      .select({
        id: schema.courses.id,
        title: schema.courses.title,
        slug: schema.courses.slug,
        shortDescription: schema.courses.shortDescription,
        thumbnailKey: schema.courses.thumbnailKey,
        presenterName: schema.courses.presenterName,
        categoryId: schema.courses.categoryId,
        categoryName: schema.categories.name,
        categorySlug: schema.categories.slug,
        createdBy: schema.courses.createdBy,
        creatorName: sql<
          string | null
        >`trim(concat(${schema.userProfiles.firstName}, ' ', ${schema.userProfiles.lastName}))`,
        accessType: schema.courses.accessType,
        price: schema.courses.price,
        discountPrice: schema.courses.discountPrice,
        currency: schema.courses.currency,
        difficulty: schema.courses.difficulty,
        estimatedDurationMinutes: schema.courses.estimatedDurationMinutes,
        status: schema.courses.status,
        visibility: schema.courses.visibility,
        certificateEnabled: schema.courses.certificateEnabled,
        featured: schema.courses.featured,
        publishedAt: schema.courses.publishedAt,
      })
      .from(schema.courses)
      .innerJoin(
        schema.categories,
        eq(schema.categories.id, schema.courses.categoryId),
      )
      .leftJoin(
        schema.userProfiles,
        eq(schema.userProfiles.userId, schema.courses.createdBy),
      )
      .where(
        and(
          ...conditions,
          publicOnly ? eq(schema.categories.isActive, true) : undefined,
          publicOnly ? isNull(schema.categories.archivedAt) : undefined,
        ),
      )
      .orderBy(...order)
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    const [{ total = 0 } = {}] = await this.db
      .select({ total: count() })
      .from(schema.courses)
      .innerJoin(
        schema.categories,
        eq(schema.categories.id, schema.courses.categoryId),
      )
      .where(
        and(
          ...conditions,
          publicOnly ? eq(schema.categories.isActive, true) : undefined,
          publicOnly ? isNull(schema.categories.archivedAt) : undefined,
        ),
      );
    return { items, total: Number(total) };
  }

  createSection(actorId: string, courseId: string, dto: CreateSectionDto) {
    return this.db.transaction(async (tx) => {
      if (
        !(await tx.query.courses.findFirst({
          where: and(
            eq(schema.courses.id, courseId),
            ne(schema.courses.status, 'ARCHIVED'),
          ),
        }))
      )
        throw new Error('COURSE_NOT_FOUND');
      const [{ next = 0 } = {}] = await tx
        .select({
          next: sql<number>`coalesce(max(${schema.courseSections.position})+1,0)`,
        })
        .from(schema.courseSections)
        .where(eq(schema.courseSections.courseId, courseId));
      const [row] = await tx
        .insert(schema.courseSections)
        .values({
          courseId,
          title: dto.title.trim(),
          description: dto.description,
          position: dto.sortOrder ?? Number(next),
        })
        .returning();
      if (!row) throw new Error('SECTION_CREATE_FAILED');
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'section.created',
        entityType: 'section',
        entityId: row.id,
        after: { courseId, title: row.title },
      });
      return row;
    });
  }
  updateSection(actorId: string, id: string, values: Record<string, unknown>) {
    return this.entityUpdate(
      'section',
      schema.courseSections,
      id,
      actorId,
      values,
      'section.updated',
    );
  }
  reorderSections(actorId: string, courseId: string, dto: ReorderDto) {
    return this.reorder(
      actorId,
      'section',
      schema.courseSections,
      courseId,
      dto,
      'courseId',
    );
  }
  archiveSection(actorId: string, id: string) {
    return this.db.transaction(async (tx) => {
      const section = await tx.query.courseSections.findFirst({
        where: eq(schema.courseSections.id, id),
      });
      if (!section) throw new Error('SECTION_NOT_FOUND');
      await tx
        .update(schema.lessons)
        .set({
          archivedAt: new Date(),
          isPublished: false,
          updatedAt: new Date(),
        })
        .where(eq(schema.lessons.sectionId, id));
      await tx
        .update(schema.courseSections)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.courseSections.id, id));
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'section.archived',
        entityType: 'section',
        entityId: id,
        before: { courseId: section.courseId, title: section.title },
      });
      return { id };
    });
  }
  createLesson(
    actorId: string,
    sectionId: string,
    dto: CreateLessonDto,
    slug: string,
    content?: string,
  ) {
    return this.db.transaction(async (tx) => {
      const section = await tx.query.courseSections.findFirst({
        where: eq(schema.courseSections.id, sectionId),
      });
      if (!section) throw new Error('SECTION_NOT_FOUND');
      const duplicate = await tx.query.lessons.findFirst({
        where: and(
          eq(schema.lessons.courseId, section.courseId),
          eq(schema.lessons.slug, slug),
        ),
      });
      if (duplicate) throw new Error('LESSON_SLUG_ALREADY_EXISTS');
      const [{ next = 0 } = {}] = await tx
        .select({
          next: sql<number>`coalesce(max(${schema.lessons.position})+1,0)`,
        })
        .from(schema.lessons)
        .where(eq(schema.lessons.sectionId, sectionId));
      const [row] = await tx
        .insert(schema.lessons)
        .values({
          courseId: section.courseId,
          sectionId,
          title: dto.title.trim(),
          slug,
          lessonType: dto.lessonType,
          content,
          videoUrl: dto.videoUrl,
          externalUrl: dto.externalUrl,
          durationSeconds: dto.durationSeconds,
          position: dto.sortOrder ?? Number(next),
          isMandatory: dto.isMandatory ?? true,
          isPreview: dto.isPreview ?? false,
        })
        .returning();
      if (!row) throw new Error('LESSON_CREATE_FAILED');
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'lesson.created',
        entityType: 'lesson',
        entityId: row.id,
        after: { courseId: row.courseId, sectionId, title: row.title },
      });
      return row;
    });
  }
  updateLesson(
    actorId: string,
    id: string,
    values: Record<string, unknown>,
    action = 'lesson.updated',
  ) {
    return this.entityUpdate(
      'lesson',
      schema.lessons,
      id,
      actorId,
      values,
      action,
    );
  }
  reorderLessons(actorId: string, sectionId: string, dto: ReorderDto) {
    return this.reorder(
      actorId,
      'lesson',
      schema.lessons,
      sectionId,
      dto,
      'sectionId',
    );
  }
  archiveLesson(actorId: string, id: string) {
    return this.updateLesson(
      actorId,
      id,
      { archivedAt: new Date(), isPublished: false },
      'lesson.archived',
    );
  }
  createResource(actorId: string, lessonId: string, dto: CreateResourceDto) {
    return this.db.transaction(async (tx) => {
      if (
        !(await tx.query.lessons.findFirst({
          where: and(
            eq(schema.lessons.id, lessonId),
            isNull(schema.lessons.archivedAt),
          ),
        }))
      )
        throw new Error('LESSON_NOT_FOUND');
      const [{ next = 0 } = {}] = await tx
        .select({
          next: sql<number>`coalesce(max(${schema.lessonResources.position})+1,0)`,
        })
        .from(schema.lessonResources)
        .where(eq(schema.lessonResources.lessonId, lessonId));
      const [row] = await tx
        .insert(schema.lessonResources)
        .values({
          lessonId,
          label: dto.title,
          resourceType: dto.externalUrl ? 'EXTERNAL' : 'FILE',
          storageKey: dto.storageKey,
          externalUrl: dto.externalUrl,
          originalFileName: dto.originalFileName,
          mimeType: dto.mimeType,
          fileSize: dto.fileSize,
          visibility: dto.visibility,
          position: dto.sortOrder ?? Number(next),
        })
        .returning();
      if (!row) throw new Error('RESOURCE_CREATE_FAILED');
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'lesson_resource.created',
        entityType: 'lesson_resource',
        entityId: row.id,
        after: { lessonId, title: row.label, visibility: row.visibility },
      });
      return {
        ...row,
        title: row.label,
        sortOrder: row.position,
      };
    });
  }
  updateResource(actorId: string, id: string, values: Record<string, unknown>) {
    return this.entityUpdate(
      'lesson_resource',
      schema.lessonResources,
      id,
      actorId,
      values,
      'lesson_resource.updated',
    );
  }
  deleteResource(actorId: string, id: string) {
    return this.db.transaction(async (tx) => {
      const row = await tx.query.lessonResources.findFirst({
        where: eq(schema.lessonResources.id, id),
      });
      if (!row) throw new Error('RESOURCE_NOT_FOUND');
      await tx
        .delete(schema.lessonResources)
        .where(eq(schema.lessonResources.id, id));
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: 'lesson_resource.removed',
        entityType: 'lesson_resource',
        entityId: id,
        before: { lessonId: row.lessonId, title: row.label },
      });
      return { id };
    });
  }
  private entityUpdate(
    entityType: string,
    // Drizzle's heterogeneous table generic cannot be expressed without losing column inference.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table: any,
    id: string,
    actorId: string,
    values: Record<string, unknown>,
    action: string,
  ) {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(table)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(table.id, id))
        .returning();
      if (!row) throw new Error(`${entityType.toUpperCase()}_NOT_FOUND`);
      await tx
        .insert(schema.activityLogs)
        .values({ actorId, action, entityType, entityId: id, after: values });
      return row;
    });
  }
  private reorder(
    actorId: string,
    entityType: string,
    // Drizzle's heterogeneous table generic cannot be expressed without losing column inference.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table: any,
    parentId: string,
    dto: ReorderDto,
    parentKey: 'courseId' | 'sectionId',
  ) {
    return this.db.transaction(async (tx) => {
      const ids = dto.items.map((x) => x.id);
      if (ids.length !== new Set(ids).size)
        throw new Error('INVALID_SORT_ORDER');
      const rows = await tx
        .select({ id: table.id })
        .from(table)
        .where(and(inArray(table.id, ids), eq(table[parentKey], parentId)));
      if (rows.length !== ids.length) throw new Error('INVALID_SORT_ORDER');
      await tx
        .update(table)
        .set({
          position: sql`${table.position} + 1000000`,
          updatedAt: new Date(),
        })
        .where(inArray(table.id, ids));
      for (const item of dto.items)
        await tx
          .update(table)
          .set({ position: item.sortOrder, updatedAt: new Date() })
          .where(eq(table.id, item.id));
      await tx.insert(schema.activityLogs).values({
        actorId,
        action: `${entityType}.reordered`,
        entityType,
        after: { parentId, count: ids.length },
      });
      return { updated: ids.length };
    });
  }
}
