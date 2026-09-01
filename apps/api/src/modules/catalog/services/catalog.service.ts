import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { AuthorizationContextService } from '../../authorization/services/authorization-context.service';
import type {
  CreateCategoryDto,
  CreateCourseDto,
  CreateLessonDto,
  CreateResourceDto,
  CreateSectionDto,
  DuplicateCourseDto,
  ListCategoriesDto,
  ListCoursesDto,
  MoveLessonDto,
  PricingDto,
  ReorderCategoriesDto,
  ReorderDto,
  SettingsDto,
  StringItemsDto,
  UpdateCategoryDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateResourceDto,
  UpdateSectionDto,
  VisibilityDto,
} from '../dto/catalog.dto';
import { CatalogRepository } from '../repositories/catalog.repository';
import {
  cleanRichText,
  slugify,
  validateDates,
  validateLesson,
  validatePricing,
} from '../validators/catalog.validators';

@Injectable()
export class CatalogService {
  constructor(
    private readonly repository: CatalogRepository,
    private readonly authorizationContextService: AuthorizationContextService,
  ) {}
  private async assertCanManageCourse(actorId: string, courseId: string) {
    const context = await this.authorizationContextService.resolve(actorId);
    if (!context || context.status !== 'ACTIVE')
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to perform this action.',
      });
    if (
      context.isAdministrator ||
      context.permissions.includes('courses.manage_all')
    )
      return;
    const course = await this.repository.courseById(courseId);
    if (!course)
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    if (course.createdBy !== actorId)
      throw new ForbiddenException({
        code: 'COURSE_NOT_OWNED',
        message: 'You can only manage courses you created.',
      });
  }
  private assertEtbCurrency(currency: string | undefined) {
    if (currency && currency !== 'ETB')
      throw new BadRequestException({
        code: 'INVALID_COURSE_CURRENCY',
        message: 'Course currency must be ETB',
      });
  }
  private async uniqueSlug(
    kind: 'category' | 'course',
    requested: string | undefined,
    title: string,
  ) {
    const base = slugify(requested || title);
    if (!base)
      throw new BadRequestException({
        code: 'INVALID_SLUG',
        message: 'A valid slug is required',
      });
    const existing =
      kind === 'category'
        ? await this.repository.categoryBySlug(base)
        : await this.repository.courseBySlug(base);
    if (existing)
      throw new ConflictException({
        code:
          kind === 'category'
            ? 'CATEGORY_SLUG_ALREADY_EXISTS'
            : 'COURSE_SLUG_ALREADY_EXISTS',
        message: 'Slug already exists',
      });
    return base;
  }
  private map(error: unknown): never {
    const value = String(error);
    for (const code of [
      'CATEGORY_NOT_FOUND',
      'COURSE_NOT_FOUND',
      'SECTION_NOT_FOUND',
      'LESSON_NOT_FOUND',
      'RESOURCE_NOT_FOUND',
    ])
      if (value.includes(code))
        throw new NotFoundException({
          code,
          message: code.replaceAll('_', ' ').toLowerCase(),
        });
    for (const code of [
      'CATEGORY_HIERARCHY_CYCLE',
      'CATEGORY_HAS_ACTIVE_CHILDREN',
      'CATEGORY_HAS_ACTIVE_COURSES',
      'COURSE_ARCHIVED',
      'COURSE_NOT_READY',
      'INVALID_STATUS_TRANSITION',
      'INVALID_SORT_ORDER',
      'CATEGORY_SLUG_ALREADY_EXISTS',
      'COURSE_SLUG_ALREADY_EXISTS',
      'LESSON_SLUG_ALREADY_EXISTS',
    ])
      if (value.includes(code))
        throw new ConflictException({
          code,
          message: code.replaceAll('_', ' ').toLowerCase(),
        });
    throw error;
  }
  async createCategory(actor: AuthUser, dto: CreateCategoryDto) {
    try {
      return await this.repository.createCategory(
        actor.id,
        dto,
        await this.uniqueSlug('category', dto.slug, dto.name),
      );
    } catch (e) {
      this.map(e);
    }
  }
  listCategories(query: ListCategoriesDto, publicOnly = false) {
    return this.repository.listCategories(query, publicOnly);
  }
  async category(id: string) {
    const row = await this.repository.categoryDetail(id);
    if (!row)
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      });
    return row;
  }
  async publicCategory(slug: string, query: ListCoursesDto) {
    const category = await this.repository.categoryBySlug(slug);
    if (!category || !category.isActive || category.archivedAt)
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      });
    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
      courses: await this.repository.listCourses(
        { ...query, categoryId: category.id },
        true,
      ),
    };
  }
  async updateCategory(actor: AuthUser, id: string, dto: UpdateCategoryDto) {
    if (dto.parentId === id)
      throw new ConflictException({
        code: 'CATEGORY_HIERARCHY_CYCLE',
        message: 'Category cannot parent itself',
      });
    if (await this.repository.categoryCycle(id, dto.parentId))
      throw new ConflictException({
        code: 'CATEGORY_HIERARCHY_CYCLE',
        message: 'Category hierarchy would contain a cycle',
      });
    try {
      return await this.repository.updateCategory(
        actor.id,
        id,
        dto as Record<string, unknown>,
      );
    } catch (e) {
      this.map(e);
    }
  }
  async reorderCategories(actor: AuthUser, dto: ReorderCategoriesDto) {
    const proposed = new Map(
      dto.items.map((item) => [item.categoryId, item.parentId ?? null]),
    );
    for (const item of dto.items) {
      const visited = new Set<string>([item.categoryId]);
      let parent = item.parentId ?? null;
      while (parent && proposed.has(parent)) {
        if (visited.has(parent))
          throw new ConflictException({
            code: 'CATEGORY_HIERARCHY_CYCLE',
            message: 'Category hierarchy would contain a cycle',
          });
        visited.add(parent);
        parent = proposed.get(parent) ?? null;
      }
    }
    for (const item of dto.items)
      if (
        item.parentId === item.categoryId ||
        (await this.repository.categoryCycle(item.categoryId, item.parentId))
      )
        throw new ConflictException({
          code: 'CATEGORY_HIERARCHY_CYCLE',
          message: 'Category hierarchy would contain a cycle',
        });
    try {
      return await this.repository.reorderCategories(actor.id, dto);
    } catch (e) {
      this.map(e);
    }
  }
  async archiveCategory(actor: AuthUser, id: string) {
    const [[children], [courses]] =
      await this.repository.categoryArchiveCounts(id);
    if (Number(children?.value) > 0)
      throw new ConflictException({
        code: 'CATEGORY_HAS_ACTIVE_CHILDREN',
        message: 'Category has active child categories',
        count: Number(children?.value),
      });
    if (Number(courses?.value) > 0)
      throw new ConflictException({
        code: 'CATEGORY_HAS_ACTIVE_COURSES',
        message: 'Category has active courses',
        count: Number(courses?.value),
      });
    return this.repository.archiveCategory(actor.id, id);
  }
  async createCourse(actor: AuthUser, dto: CreateCourseDto) {
    this.assertEtbCurrency(dto.currency);
    validatePricing({
      accessType: dto.accessType,
      price: dto.price ?? '0',
      discountPrice: dto.discountPrice,
      currency: dto.currency ?? 'ETB',
    });
    validateDates(dto);
    try {
      return await this.repository.createCourse(
        actor.id,
        dto,
        await this.uniqueSlug('course', dto.slug, dto.title),
        cleanRichText(dto.description),
      );
    } catch (e) {
      this.map(e);
    }
  }
  async updateCourse(actor: AuthUser, id: string, dto: UpdateCourseDto) {
    await this.assertCanManageCourse(actor.id, id);
    if (dto.categoryId) {
      const category = await this.repository.categoryById(dto.categoryId);
      if (!category || category.archivedAt || !category.isActive)
        throw new NotFoundException({
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
        });
    }
    const values = {
      ...dto,
      ...(dto.description
        ? { description: cleanRichText(dto.description) }
        : {}),
    };
    try {
      return await this.repository.updateCourse(actor.id, id, values);
    } catch (e) {
      this.map(e);
    }
  }
  async pricing(actor: AuthUser, id: string, dto: PricingDto) {
    this.assertEtbCurrency(dto.currency);
    validatePricing(dto);
    await this.assertCanManageCourse(actor.id, id);
    return this.repository.updateCourse(
      actor.id,
      id,
      dto as unknown as Record<string, unknown>,
      'course.pricing_updated',
    );
  }
  async visibility(actor: AuthUser, id: string, dto: VisibilityDto) {
    await this.assertCanManageCourse(actor.id, id);
    return this.repository.updateCourse(
      actor.id,
      id,
      dto as unknown as Record<string, unknown>,
      'course.visibility_updated',
    );
  }
  async settings(actor: AuthUser, id: string, dto: SettingsDto) {
    await this.assertCanManageCourse(actor.id, id);
    validateDates(dto);
    return this.repository.updateCourse(
      actor.id,
      id,
      {
        ...dto,
        enrollmentOpenAt: dto.enrollmentOpenAt
          ? new Date(dto.enrollmentOpenAt)
          : dto.enrollmentOpenAt,
        enrollmentCloseAt: dto.enrollmentCloseAt
          ? new Date(dto.enrollmentCloseAt)
          : dto.enrollmentCloseAt,
      },
      'course.settings_updated',
    );
  }
  async items(
    actor: AuthUser,
    id: string,
    type: 'outcomes' | 'requirements',
    dto: StringItemsDto,
  ) {
    await this.assertCanManageCourse(actor.id, id);
    return this.repository.replaceCourseItems(
      actor.id,
      id,
      type,
      dto.items.map((x) => x.trim()).filter(Boolean),
    );
  }
  async adminCourse(id: string) {
    const row = await this.repository.courseDetail(id);
    if (!row)
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    return row;
  }
  adminCourses(query: ListCoursesDto) {
    return this.repository.listCourses(query);
  }
  async publish(actor: AuthUser, id: string) {
    await this.assertCanManageCourse(actor.id, id);
    const readiness = await this.repository.readiness(id);
    if (!readiness)
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    if (!readiness.ready) {
      const issueDescriptions: Record<string, string> = {
        COURSE_DETAILS_REQUIRED: 'Course title and descriptions are required.',
        SECTION_REQUIRED:
          'At least one curriculum section is required before publishing.',
        PUBLISHED_LESSON_REQUIRED:
          'At least one published lesson is required before publishing.',
        OUTCOME_REQUIRED:
          'At least one learning outcome is required before publishing.',
        VALID_PRICE_REQUIRED:
          'Paid courses must have a valid price greater than 0.',
      };
      const detailedMessage = readiness.issues
        .map((issue) => issueDescriptions[issue] || issue)
        .join(' ');
      throw new ConflictException({
        code: 'COURSE_NOT_READY',
        message:
          detailedMessage ||
          'Course is not ready to publish. Please add curriculum sections, published lessons, and outcomes.',
        issues: readiness.issues,
      });
    }
    return this.repository.publishCourse(actor.id, id);
  }
  async unpublish(actor: AuthUser, id: string) {
    await this.assertCanManageCourse(actor.id, id);
    return this.repository.courseStatus(
      actor.id,
      id,
      'DRAFT',
      'course.unpublished',
    );
  }
  async archiveCourse(actor: AuthUser, id: string) {
    await this.assertCanManageCourse(actor.id, id);
    return this.repository.courseStatus(
      actor.id,
      id,
      'ARCHIVED',
      'course.archived',
    );
  }
  async restoreCourse(actor: AuthUser, id: string) {
    await this.assertCanManageCourse(actor.id, id);
    const course = await this.repository.courseById(id);
    if (!course)
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    if (course.status !== 'ARCHIVED')
      throw new ConflictException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only archived courses can be restored',
      });
    return this.repository.courseStatus(
      actor.id,
      id,
      'DRAFT',
      'course.restored',
    );
  }
  async duplicateCourse(actor: AuthUser, id: string, dto: DuplicateCourseDto) {
    await this.assertCanManageCourse(actor.id, id);
    const source = await this.repository.courseById(id);
    if (!source)
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    const title = dto.title ?? `${source.title} Copy`;
    const slug = await this.uniqueSlug('course', dto.slug, title);
    return this.repository.duplicateCourse(actor.id, id, title, slug);
  }
  async publicCourses(query: ListCoursesDto) {
    return this.repository.listCourses(query, true);
  }
  async publicCourse(slug: string, allowPreview = false) {
    const course = await this.repository.courseBySlug(slug);
    if (!course || course.archivedAt)
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });

    if (
      !allowPreview &&
      (course.status !== 'PUBLISHED' || course.visibility === 'PRIVATE')
    )
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    const detail = await this.adminCourse(course.id);
    const category = course.categoryId
      ? await this.repository.courseCategory(course.categoryId)
      : undefined;

    if (!allowPreview && category && (category.isActive === false || category.archivedAt))
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    return {
      id: detail.id,
      title: detail.title,
      slug: detail.slug,
      shortDescription: detail.shortDescription,
      description: detail.description,
      presenterName: detail.presenterName,
      thumbnailKey: detail.thumbnailKey ?? null,
      thumbnailUrl: detail.thumbnailKey
        ? detail.thumbnailKey.startsWith('http://') ||
          detail.thumbnailKey.startsWith('https://') ||
          detail.thumbnailKey.startsWith('/')
          ? detail.thumbnailKey
          : `/api/v1/storage/course-thumbnails/${detail.thumbnailKey.replace(/^course-thumbnails\//, '')}`
        : null,
      categoryId: detail.categoryId ?? null,
      categoryName: category?.name ?? null,
      categorySlug: category?.slug ?? null,
      featured: detail.featured,
      accessType: detail.accessType,
      price: detail.price,
      discountPrice: detail.discountPrice,
      currency: detail.currency,
      difficulty: detail.difficulty,
      estimatedDurationMinutes: detail.estimatedDurationMinutes,
      certificateEnabled: detail.certificateEnabled,
      publishedAt: detail.publishedAt,
      outcomes: detail.outcomes.map(
        (x: { outcome?: string; text?: string }) => x.text ?? x.outcome ?? '',
      ),
      requirements: detail.requirements.map(
        (x: { requirement?: string; text?: string }) => x.text ?? x.requirement ?? '',
      ),
      sections: detail.sections
        .filter((s: { archivedAt: Date | null }) => !s.archivedAt)
        .map(
          (s: {
            id: string;
            title: string;
            description: string | null;
            lessons: Array<Record<string, unknown>>;
          }) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            lessons: s.lessons
              .filter((l) => l.isPublished && !l.archivedAt)
              .map((l) => ({
                id: l.id,
                title: l.title,
                lessonType: l.lessonType,
                durationSeconds: l.durationSeconds,
                isMandatory: l.isMandatory,
                isPreview: l.isPreview,
                ...(l.isPreview
                  ? {
                      content: l.content,
                      videoUrl: l.videoUrl,
                      externalUrl: l.externalUrl,
                      resources: (l.resources as Array<Record<string, unknown>>)
                        .filter((r) => r.visibility === 'PUBLIC')
                        .map((r) => ({
                          id: r.id,
                          title: r.label,
                          externalUrl: r.externalUrl,
                          originalFileName: r.originalFileName,
                          mimeType: r.mimeType,
                          fileSize: r.fileSize,
                        })),
                    }
                  : {}),
              })),
          }),
        ),
    };
  }
  createSection(actor: AuthUser, courseId: string, dto: CreateSectionDto) {
    return this.repository.createSection(actor.id, courseId, dto);
  }
  updateSection(actor: AuthUser, id: string, dto: UpdateSectionDto) {
    return this.repository.updateSection(
      actor.id,
      id,
      dto as Record<string, unknown>,
    );
  }
  reorderSections(actor: AuthUser, courseId: string, dto: ReorderDto) {
    return this.repository.reorderSections(actor.id, courseId, dto);
  }
  archiveSection(actor: AuthUser, id: string) {
    return this.repository.archiveSection(actor.id, id);
  }
  async createLesson(actor: AuthUser, sectionId: string, dto: CreateLessonDto) {
    validateLesson(dto);
    return this.repository.createLesson(
      actor.id,
      sectionId,
      dto,
      slugify(dto.slug || dto.title),
      dto.content ? cleanRichText(dto.content) : undefined,
    );
  }
  updateLesson(actor: AuthUser, id: string, dto: UpdateLessonDto) {
    return this.repository.updateLesson(actor.id, id, {
      ...dto,
      ...(dto.content ? { content: cleanRichText(dto.content) } : {}),
    });
  }
  reorderLessons(actor: AuthUser, sectionId: string, dto: ReorderDto) {
    return this.repository.reorderLessons(actor.id, sectionId, dto);
  }
  moveLesson(actor: AuthUser, id: string, dto: MoveLessonDto) {
    return this.repository.updateLesson(
      actor.id,
      id,
      {
        sectionId: dto.sectionId,
        ...(dto.sortOrder === undefined ? {} : { position: dto.sortOrder }),
      },
      'lesson.moved',
    );
  }
  async publishLesson(actor: AuthUser, id: string) {
    const lesson = await this.repository.lessonById(id);
    if (!lesson)
      throw new NotFoundException({
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found',
      });
    if (lesson.lessonType === 'VIDEO' && !lesson.videoUrl?.trim()) {
      throw new BadRequestException({
        code: 'VIDEO_URL_REQUIRED',
        message:
          'A valid video URL is required before publishing a video lesson.',
      });
    }
    if (lesson.lessonType === 'TEXT' && !lesson.content?.trim()) {
      throw new BadRequestException({
        code: 'CONTENT_REQUIRED',
        message:
          'Lesson content/notes are required before publishing a text lesson.',
      });
    }
    if (lesson.lessonType === 'EXTERNAL_LINK' && !lesson.externalUrl?.trim()) {
      throw new BadRequestException({
        code: 'EXTERNAL_URL_REQUIRED',
        message:
          'An external URL is required before publishing an external link lesson.',
      });
    }
    validateLesson(lesson as unknown as CreateLessonDto);
    return this.repository.updateLesson(
      actor.id,
      id,
      { isPublished: true },
      'lesson.published',
    );
  }
  unpublishLesson(actor: AuthUser, id: string) {
    return this.repository.updateLesson(
      actor.id,
      id,
      { isPublished: false },
      'lesson.unpublished',
    );
  }
  previewLesson(actor: AuthUser, id: string, isPreview: boolean) {
    return this.repository.updateLesson(
      actor.id,
      id,
      { isPreview },
      'lesson.preview_updated',
    );
  }
  archiveLesson(actor: AuthUser, id: string) {
    return this.repository.archiveLesson(actor.id, id);
  }
  createResource(actor: AuthUser, lessonId: string, dto: CreateResourceDto) {
    if (!dto.storageKey && !dto.externalUrl)
      throw new BadRequestException({
        code: 'INVALID_RESOURCE_TYPE',
        message: 'Storage key or external URL is required',
      });
    return this.repository.createResource(actor.id, lessonId, dto);
  }
  updateResource(actor: AuthUser, id: string, dto: UpdateResourceDto) {
    return this.repository.updateResource(actor.id, id, {
      ...(dto.title === undefined ? {} : { label: dto.title }),
      ...(dto.externalUrl === undefined
        ? {}
        : { resourceType: dto.externalUrl ? 'EXTERNAL' : 'FILE' }),
      storageKey: dto.storageKey,
      externalUrl: dto.externalUrl,
      originalFileName: dto.originalFileName,
      mimeType: dto.mimeType,
      fileSize: dto.fileSize,
      visibility: dto.visibility,
      position: dto.sortOrder,
    });
  }
  deleteResource(actor: AuthUser, id: string) {
    return this.repository.deleteResource(actor.id, id);
  }
}
