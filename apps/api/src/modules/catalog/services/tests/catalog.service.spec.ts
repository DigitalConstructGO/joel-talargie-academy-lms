import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CatalogService } from '../catalog.service';

describe('CatalogService', () => {
  const repository = {
    categoryBySlug: jest.fn(),
    courseBySlug: jest.fn(),
    createCategory: jest.fn(),
    listCategories: jest.fn(),
    categoryDetail: jest.fn(),
    listCourses: jest.fn(),
    categoryCycle: jest.fn(),
    updateCategory: jest.fn(),
    reorderCategories: jest.fn(),
    categoryArchiveCounts: jest.fn(),
    archiveCategory: jest.fn(),
    createCourse: jest.fn(),
    categoryById: jest.fn(),
    updateCourse: jest.fn(),
    replaceCourseItems: jest.fn(),
    courseDetail: jest.fn(),
    readiness: jest.fn(),
    publishCourse: jest.fn(),
    courseStatus: jest.fn(),
    courseById: jest.fn(),
    duplicateCourse: jest.fn(),
    createSection: jest.fn(),
    updateSection: jest.fn(),
    reorderSections: jest.fn(),
    archiveSection: jest.fn(),
    createLesson: jest.fn(),
    updateLesson: jest.fn(),
    reorderLessons: jest.fn(),
    lessonById: jest.fn(),
    archiveLesson: jest.fn(),
    createResource: jest.fn(),
    updateResource: jest.fn(),
    deleteResource: jest.fn(),
  };
  const contexts = {
    resolve: jest.fn().mockResolvedValue({
      userId: 'admin-1',
      status: 'ACTIVE',
      roles: ['ADMINISTRATOR'],
      permissions: [],
      isAdministrator: true,
    }),
  };
  const service = new CatalogService(repository as never, contexts as never);
  const actor = { id: 'admin-1' } as never;

  beforeEach(() => jest.clearAllMocks());

  describe('createCategory / uniqueSlug', () => {
    it('rejects when the derived slug is empty', async () => {
      await expect(
        service.createCategory(actor, { name: '!!!' } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a slug that already exists', async () => {
      repository.categoryBySlug.mockResolvedValueOnce({ id: 'c1' });
      await expect(
        service.createCategory(actor, { name: 'Programming' } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('creates the category with a slugified name', async () => {
      repository.categoryBySlug.mockResolvedValueOnce(undefined);
      repository.createCategory.mockResolvedValueOnce({ id: 'c1' });
      const result = await service.createCategory(actor, {
        name: 'Programming 101',
      } as never);
      expect(repository.createCategory).toHaveBeenCalledWith(
        'admin-1',
        expect.objectContaining({ name: 'Programming 101' }),
        'programming-101',
      );
      expect(result).toEqual({ id: 'c1' });
    });

    it('maps a repository NOT_FOUND error via the shared mapper', async () => {
      repository.categoryBySlug.mockResolvedValueOnce(undefined);
      repository.createCategory.mockRejectedValueOnce(
        new Error('CATEGORY_NOT_FOUND'),
      );
      await expect(
        service.createCategory(actor, { name: 'X' } as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('rethrows an unmapped repository error', async () => {
      repository.categoryBySlug.mockResolvedValueOnce(undefined);
      repository.createCategory.mockRejectedValueOnce(new Error('boom'));
      await expect(
        service.createCategory(actor, { name: 'X' } as never),
      ).rejects.toThrow('boom');
    });
  });

  it('listCategories / category delegate to the repository', async () => {
    service.listCategories({} as never, true);
    expect(repository.listCategories).toHaveBeenCalledWith({}, true);

    repository.categoryDetail.mockResolvedValueOnce(undefined);
    await expect(service.category('c1')).rejects.toThrow(NotFoundException);

    repository.categoryDetail.mockResolvedValueOnce({ id: 'c1' });
    await expect(service.category('c1')).resolves.toEqual({ id: 'c1' });
  });

  describe('publicCategory', () => {
    it('throws NotFoundException for an inactive/archived/missing category', async () => {
      repository.categoryBySlug.mockResolvedValueOnce(undefined);
      await expect(
        service.publicCategory('missing', {} as never),
      ).rejects.toThrow(NotFoundException);

      repository.categoryBySlug.mockResolvedValueOnce({
        id: 'c1',
        isActive: false,
      });
      await expect(
        service.publicCategory('inactive', {} as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the category summary and its public course listing', async () => {
      repository.categoryBySlug.mockResolvedValueOnce({
        id: 'c1',
        name: 'Programming',
        slug: 'programming',
        description: 'desc',
        isActive: true,
        archivedAt: null,
      });
      repository.listCourses.mockResolvedValueOnce([{ id: 'course-1' }]);
      const result = await service.publicCategory('programming', {} as never);
      expect(repository.listCourses).toHaveBeenCalledWith(
        { categoryId: 'c1' },
        true,
      );
      expect(result.courses).toEqual([{ id: 'course-1' }]);
    });
  });

  describe('updateCategory', () => {
    it('rejects a category set as its own parent', async () => {
      await expect(
        service.updateCategory(actor, 'c1', { parentId: 'c1' } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects a hierarchy that would create a cycle', async () => {
      repository.categoryCycle.mockResolvedValueOnce(true);
      await expect(
        service.updateCategory(actor, 'c1', { parentId: 'c2' } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('updates the category and maps repository errors', async () => {
      repository.categoryCycle.mockResolvedValueOnce(false);
      repository.updateCategory.mockResolvedValueOnce({ id: 'c1' });
      const result = await service.updateCategory(actor, 'c1', {
        name: 'New',
      } as never);
      expect(result).toEqual({ id: 'c1' });
    });
  });

  describe('reorderCategories', () => {
    it('rejects an item that parents itself', async () => {
      await expect(
        service.reorderCategories(actor, {
          items: [{ categoryId: 'c1', parentId: 'c1' }],
        } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects a cycle formed purely within the proposed batch', async () => {
      await expect(
        service.reorderCategories(actor, {
          items: [
            { categoryId: 'c1', parentId: 'c2' },
            { categoryId: 'c2', parentId: 'c1' },
          ],
        } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects a cycle detected against existing repository state', async () => {
      repository.categoryCycle.mockResolvedValueOnce(true);
      await expect(
        service.reorderCategories(actor, {
          items: [{ categoryId: 'c1', parentId: 'c3' }],
        } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('reorders successfully when no cycle exists', async () => {
      repository.categoryCycle.mockResolvedValueOnce(false);
      repository.reorderCategories.mockResolvedValueOnce({ ok: true });
      const result = await service.reorderCategories(actor, {
        items: [{ categoryId: 'c1', parentId: 'c3' }],
      } as never);
      expect(result).toEqual({ ok: true });
    });
  });

  describe('archiveCategory', () => {
    it('rejects when the category has active children', async () => {
      repository.categoryArchiveCounts.mockResolvedValueOnce([
        [{ value: 2 }],
        [{ value: 0 }],
      ]);
      await expect(service.archiveCategory(actor, 'c1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects when the category has active courses', async () => {
      repository.categoryArchiveCounts.mockResolvedValueOnce([
        [{ value: 0 }],
        [{ value: 1 }],
      ]);
      await expect(service.archiveCategory(actor, 'c1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('archives when there are no active children or courses', async () => {
      repository.categoryArchiveCounts.mockResolvedValueOnce([
        [{ value: 0 }],
        [{ value: 0 }],
      ]);
      repository.archiveCategory.mockResolvedValueOnce({ archived: true });
      await expect(service.archiveCategory(actor, 'c1')).resolves.toEqual({
        archived: true,
      });
    });
  });

  describe('createCourse', () => {
    const validDto = {
      title: 'Intro to CS',
      accessType: 'PAID',
      price: '99',
      description: '<p>Hello</p>',
    };

    it('rejects invalid pricing before touching the repository', async () => {
      await expect(
        service.createCourse(actor, {
          ...validDto,
          accessType: 'FREE',
          price: '10',
        } as never),
      ).rejects.toThrow(BadRequestException);
      expect(repository.categoryBySlug).not.toHaveBeenCalled();
    });

    it('rejects invalid enrollment dates', async () => {
      await expect(
        service.createCourse(actor, {
          ...validDto,
          enrollmentOpenAt: '2026-02-01',
          enrollmentCloseAt: '2026-01-01',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the course with a sanitized description and unique slug', async () => {
      repository.courseBySlug.mockResolvedValueOnce(undefined);
      repository.createCourse.mockResolvedValueOnce({ id: 'course-1' });
      const result = await service.createCourse(actor, validDto as never);
      expect(repository.createCourse).toHaveBeenCalledWith(
        'admin-1',
        validDto,
        'intro-to-cs',
        '<p>Hello</p>',
      );
      expect(result).toEqual({ id: 'course-1' });
    });
  });

  describe('updateCourse', () => {
    it('rejects when the new category does not exist or is inactive/archived', async () => {
      repository.categoryById.mockResolvedValueOnce(undefined);
      await expect(
        service.updateCourse(actor, 'course-1', {
          categoryId: 'missing',
        } as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('sanitizes a new description and updates the course', async () => {
      repository.updateCourse.mockResolvedValueOnce({ id: 'course-1' });
      const result = await service.updateCourse(actor, 'course-1', {
        description: '<script>alert(1)</script><p>Safe</p>',
      } as never);
      expect(repository.updateCourse).toHaveBeenCalledWith(
        'admin-1',
        'course-1',
        expect.objectContaining({ description: '<p>Safe</p>' }),
      );
      expect(result).toEqual({ id: 'course-1' });
    });

    it('maps repository errors', async () => {
      repository.updateCourse.mockRejectedValueOnce(
        new Error('COURSE_NOT_FOUND'),
      );
      await expect(
        service.updateCourse(actor, 'course-1', {} as never),
      ).rejects.toThrow(NotFoundException);
    });
  });

  it('pricing validates and delegates to updateCourse with the pricing event', async () => {
    await expect(
      service.pricing(actor, 'course-1', {
        accessType: 'PAID',
        price: '-5',
        currency: 'ETB',
      } as never),
    ).rejects.toThrow(BadRequestException);

    await service.pricing(actor, 'course-1', {
      accessType: 'PAID',
      price: '50',
      currency: 'ETB',
    } as never);
    expect(repository.updateCourse).toHaveBeenCalledWith(
      'admin-1',
      'course-1',
      expect.objectContaining({ price: '50', currency: 'ETB' }),
      'course.pricing_updated',
    );
  });

  it('pricing rejects any currency other than ETB', async () => {
    await expect(
      service.pricing(actor, 'course-1', {
        accessType: 'PAID',
        price: '50',
        currency: 'USD',
      } as never),
    ).rejects.toThrow(BadRequestException);
    expect(repository.updateCourse).not.toHaveBeenCalled();
  });

  it('visibility delegates to updateCourse with the visibility event', async () => {
    await service.visibility(actor, 'course-1', { visibility: 'PUBLIC' } as never);
    expect(repository.updateCourse).toHaveBeenCalledWith(
      'admin-1',
      'course-1',
      expect.objectContaining({ visibility: 'PUBLIC' }),
      'course.visibility_updated',
    );
  });

  it('settings validates dates and converts enrollment date strings to Date objects', async () => {
    await expect(
      service.settings(actor, 'course-1', {
        enrollmentOpenAt: '2026-02-01',
        enrollmentCloseAt: '2026-01-01',
      } as never),
    ).rejects.toThrow(BadRequestException);

    await service.settings(actor, 'course-1', {
      enrollmentOpenAt: '2026-01-01T00:00:00.000Z',
      enrollmentCloseAt: '2026-02-01T00:00:00.000Z',
    } as never);
    expect(repository.updateCourse).toHaveBeenCalledWith(
      'admin-1',
      'course-1',
      expect.objectContaining({
        enrollmentOpenAt: expect.any(Date),
        enrollmentCloseAt: expect.any(Date),
      }),
      'course.settings_updated',
    );
  });

  it('items trims and filters empty entries before replacing them', async () => {
    await service.items(actor, 'course-1', 'outcomes', {
      items: [' Learn TS ', '   ', 'Build APIs'],
    } as never);
    expect(repository.replaceCourseItems).toHaveBeenCalledWith(
      'admin-1',
      'course-1',
      'outcomes',
      ['Learn TS', 'Build APIs'],
    );
  });

  describe('adminCourse / adminCourses', () => {
    it('throws NotFoundException for a missing course', async () => {
      repository.courseDetail.mockResolvedValueOnce(undefined);
      await expect(service.adminCourse('course-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('delegates listing to the repository', () => {
      service.adminCourses({} as never);
      expect(repository.listCourses).toHaveBeenCalledWith({});
    });
  });

  describe('publish', () => {
    it('throws NotFoundException when the course does not exist', async () => {
      repository.readiness.mockResolvedValueOnce(undefined);
      await expect(service.publish(actor, 'course-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException with issues when the course is not ready', async () => {
      repository.readiness.mockResolvedValueOnce({
        ready: false,
        issues: ['NO_SECTIONS'],
      });
      await expect(service.publish(actor, 'course-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('publishes a ready course', async () => {
      repository.readiness.mockResolvedValueOnce({ ready: true, issues: [] });
      repository.publishCourse.mockResolvedValueOnce({ status: 'PUBLISHED' });
      const result = await service.publish(actor, 'course-1');
      expect(result).toEqual({ status: 'PUBLISHED' });
    });
  });

  it('unpublish / archiveCourse delegate to courseStatus with the right transition', async () => {
    await service.unpublish(actor, 'course-1');
    expect(repository.courseStatus).toHaveBeenCalledWith(
      'admin-1',
      'course-1',
      'DRAFT',
      'course.unpublished',
    );
    await service.archiveCourse(actor, 'course-1');
    expect(repository.courseStatus).toHaveBeenCalledWith(
      'admin-1',
      'course-1',
      'ARCHIVED',
      'course.archived',
    );
  });

  describe('restoreCourse', () => {
    it('throws NotFoundException for a missing course', async () => {
      repository.courseById.mockResolvedValueOnce(undefined);
      await expect(service.restoreCourse(actor, 'course-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects restoring a course that is not archived', async () => {
      repository.courseById.mockResolvedValueOnce({ status: 'PUBLISHED' });
      await expect(service.restoreCourse(actor, 'course-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('restores an archived course to DRAFT', async () => {
      repository.courseById.mockResolvedValueOnce({ status: 'ARCHIVED' });
      repository.courseStatus.mockResolvedValueOnce({ status: 'DRAFT' });
      const result = await service.restoreCourse(actor, 'course-1');
      expect(result).toEqual({ status: 'DRAFT' });
    });
  });

  describe('duplicateCourse', () => {
    it('throws NotFoundException for a missing source course', async () => {
      repository.courseById.mockResolvedValueOnce(undefined);
      await expect(
        service.duplicateCourse(actor, 'course-1', {} as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('defaults the title to "<source title> Copy" and slugifies it', async () => {
      repository.courseById.mockResolvedValueOnce({ title: 'Intro to CS' });
      repository.courseBySlug.mockResolvedValueOnce(undefined);
      repository.duplicateCourse.mockResolvedValueOnce({ id: 'course-2' });
      const result = await service.duplicateCourse(
        actor,
        'course-1',
        {} as never,
      );
      expect(repository.duplicateCourse).toHaveBeenCalledWith(
        'admin-1',
        'course-1',
        'Intro to CS Copy',
        'intro-to-cs-copy',
      );
      expect(result).toEqual({ id: 'course-2' });
    });
  });

  describe('course ownership enforcement', () => {
    const instructorContext = {
      userId: 'u1',
      status: 'ACTIVE',
      roles: ['INSTRUCTOR'],
      permissions: [],
      isAdministrator: false,
    };

    beforeEach(() => {
      contexts.resolve.mockReset();
      repository.courseById.mockReset();
    });

    it('rejects a non-admin managing a course they did not create', async () => {
      contexts.resolve.mockResolvedValueOnce(instructorContext);
      repository.courseById.mockResolvedValueOnce({
        id: 'course-1',
        createdBy: 'someone-else',
      });
      await expect(
        service.updateCourse(actor, 'course-1', { title: 'Hijack' } as never),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.updateCourse).not.toHaveBeenCalled();
    });

    it('rejects a non-admin publishing/pricing/archiving a course they do not own', async () => {
      contexts.resolve.mockResolvedValue(instructorContext);
      repository.courseById.mockResolvedValue({
        id: 'course-1',
        createdBy: 'someone-else',
      });
      await expect(service.publish(actor, 'course-1')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.pricing(actor, 'course-1', {
          accessType: 'PAID',
          price: '50',
          currency: 'ETB',
        } as never),
      ).rejects.toThrow(ForbiddenException);
      await expect(service.archiveCourse(actor, 'course-1')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.duplicateCourse(actor, 'course-1', {} as never),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.items(actor, 'course-1', 'outcomes', { items: ['x'] } as never),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.updateCourse).not.toHaveBeenCalled();
      expect(repository.duplicateCourse).not.toHaveBeenCalled();
    });

    it('allows a non-admin to manage their own course', async () => {
      contexts.resolve.mockResolvedValueOnce(instructorContext);
      repository.courseById.mockResolvedValueOnce({
        id: 'course-1',
        createdBy: 'admin-1',
      });
      repository.updateCourse.mockResolvedValueOnce({ id: 'course-1' });
      const result = await service.updateCourse(actor, 'course-1', {
        title: 'My course',
      } as never);
      expect(result).toEqual({ id: 'course-1' });
      expect(repository.updateCourse).toHaveBeenCalledWith(
        'admin-1',
        'course-1',
        expect.objectContaining({ title: 'My course' }),
      );
    });

    it('allows a non-admin with courses.manage_all to manage any course', async () => {
      contexts.resolve.mockResolvedValueOnce({
        ...instructorContext,
        permissions: ['courses.manage_all'],
      });
      repository.updateCourse.mockResolvedValueOnce({ id: 'course-1' });
      const result = await service.updateCourse(actor, 'course-1', {
        title: 'Managed',
      } as never);
      expect(result).toEqual({ id: 'course-1' });
    });

    it('throws NotFoundException when a non-admin manages a missing course', async () => {
      contexts.resolve.mockResolvedValueOnce(instructorContext);
      repository.courseById.mockResolvedValueOnce(undefined);
      await expect(
        service.archiveCourse(actor, 'missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a non-active or missing authorization context', async () => {
      contexts.resolve.mockResolvedValueOnce({
        userId: 'u1',
        status: 'SUSPENDED',
        roles: [],
        permissions: [],
        isAdministrator: false,
      });
      await expect(
        service.updateCourse(actor, 'course-1', {} as never),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('publicCourse', () => {
    it('throws NotFoundException for a missing/unpublished/private/archived course', async () => {
      repository.courseBySlug.mockResolvedValueOnce(undefined);
      await expect(service.publicCourse('missing')).rejects.toThrow(
        NotFoundException,
      );

      repository.courseBySlug.mockResolvedValueOnce({
        id: 'course-1',
        status: 'DRAFT',
      });
      await expect(service.publicCourse('draft-course')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('shapes the public course payload, filtering unpublished lessons and private resources', async () => {
      repository.courseBySlug.mockResolvedValueOnce({
        id: 'course-1',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        archivedAt: null,
      });
      repository.courseDetail.mockResolvedValueOnce({
        id: 'course-1',
        title: 'Intro to CS',
        slug: 'intro-to-cs',
        shortDescription: 'short',
        description: 'long',
        presenterName: 'Ada',
        accessType: 'PAID',
        price: '99',
        discountPrice: null,
        currency: 'USD',
        difficulty: 'BEGINNER',
        estimatedDurationMinutes: 60,
        certificateEnabled: true,
        publishedAt: new Date('2026-01-01'),
        outcomes: [{ outcome: 'Learn TS' }],
        requirements: [{ requirement: 'Laptop' }],
        sections: [
          {
            id: 's1',
            title: 'Section 1',
            description: null,
            archivedAt: null,
            lessons: [
              {
                id: 'l1',
                title: 'Preview lesson',
                lessonType: 'VIDEO',
                durationSeconds: 100,
                isMandatory: true,
                isPreview: true,
                isPublished: true,
                archivedAt: null,
                content: 'content',
                videoUrl: 'https://video',
                externalUrl: null,
                resources: [
                  {
                    id: 'r1',
                    visibility: 'PUBLIC',
                    label: 'Slides',
                    externalUrl: null,
                    originalFileName: 'slides.pdf',
                    mimeType: 'application/pdf',
                    fileSize: 100,
                  },
                  {
                    id: 'r2',
                    visibility: 'PRIVATE',
                    label: 'Answers',
                  },
                ],
              },
              {
                id: 'l2',
                title: 'Non-preview lesson',
                lessonType: 'TEXT',
                isPreview: false,
                isPublished: true,
                archivedAt: null,
              },
              {
                id: 'l3',
                title: 'Unpublished lesson',
                isPreview: true,
                isPublished: false,
                archivedAt: null,
              },
            ],
          },
          {
            id: 's2',
            title: 'Archived section',
            archivedAt: new Date(),
            lessons: [],
          },
        ],
      });
      const result = await service.publicCourse('intro-to-cs');
      const lessons = result.sections[0].lessons as Array<{
        id: string;
        content?: string;
        resources?: Array<{ id: string }>;
      }>;
      expect(result.sections).toHaveLength(1);
      expect(lessons).toHaveLength(2);
      const previewLesson = lessons.find((l) => l.id === 'l1')!;
      expect(previewLesson.content).toBe('content');
      expect(previewLesson.resources).toHaveLength(1);
      expect(previewLesson.resources![0].id).toBe('r1');
      const nonPreviewLesson = lessons.find((l) => l.id === 'l2')!;
      expect(nonPreviewLesson).not.toHaveProperty('content');
      expect(result.outcomes).toEqual(['Learn TS']);
      expect(result.requirements).toEqual(['Laptop']);
    });
  });

  it('section CRUD methods delegate to the repository', () => {
    service.createSection(actor, 'course-1', {} as never);
    expect(repository.createSection).toHaveBeenCalledWith(
      'admin-1',
      'course-1',
      {},
    );
    service.updateSection(actor, 's1', {} as never);
    expect(repository.updateSection).toHaveBeenCalledWith('admin-1', 's1', {});
    service.reorderSections(actor, 'course-1', {} as never);
    expect(repository.reorderSections).toHaveBeenCalledWith(
      'admin-1',
      'course-1',
      {},
    );
    service.archiveSection(actor, 's1');
    expect(repository.archiveSection).toHaveBeenCalledWith('admin-1', 's1');
  });

  describe('lesson methods', () => {
    it('createLesson validates lesson-type configuration before delegating', async () => {
      await expect(
        service.createLesson(actor, 's1', {
          title: 'Video Lesson',
          lessonType: 'VIDEO',
        } as never),
      ).rejects.toThrow(BadRequestException);

      repository.createLesson.mockResolvedValueOnce({ id: 'l1' });
      const result = await service.createLesson(actor, 's1', {
        title: 'Video Lesson',
        lessonType: 'VIDEO',
        videoUrl: 'https://video',
      } as never);
      expect(repository.createLesson).toHaveBeenCalledWith(
        'admin-1',
        's1',
        expect.objectContaining({ lessonType: 'VIDEO' }),
        'video-lesson',
        undefined,
      );
      expect(result).toEqual({ id: 'l1' });
    });

    it('updateLesson sanitizes content when provided', () => {
      service.updateLesson(actor, 'l1', {
        content: '<script>x</script><p>Safe</p>',
      } as never);
      expect(repository.updateLesson).toHaveBeenCalledWith('admin-1', 'l1', {
        content: '<p>Safe</p>',
      });
    });

    it('reorderLessons delegates to the repository', () => {
      service.reorderLessons(actor, 's1', {} as never);
      expect(repository.reorderLessons).toHaveBeenCalledWith(
        'admin-1',
        's1',
        {},
      );
    });

    it('moveLesson updates sectionId and position only when sortOrder is provided', () => {
      service.moveLesson(actor, 'l1', { sectionId: 's2' } as never);
      expect(repository.updateLesson).toHaveBeenCalledWith(
        'admin-1',
        'l1',
        { sectionId: 's2' },
        'lesson.moved',
      );

      service.moveLesson(actor, 'l1', {
        sectionId: 's2',
        sortOrder: 3,
      } as never);
      expect(repository.updateLesson).toHaveBeenCalledWith(
        'admin-1',
        'l1',
        { sectionId: 's2', position: 3 },
        'lesson.moved',
      );
    });

    describe('publishLesson', () => {
      it('throws NotFoundException for a missing lesson', async () => {
        repository.lessonById.mockResolvedValueOnce(undefined);
        await expect(service.publishLesson(actor, 'l1')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('re-validates lesson-type configuration before publishing', async () => {
        repository.lessonById.mockResolvedValueOnce({
          lessonType: 'VIDEO',
          videoUrl: null,
        });
        await expect(service.publishLesson(actor, 'l1')).rejects.toThrow(
          BadRequestException,
        );
      });

      it('publishes a valid lesson', async () => {
        repository.lessonById.mockResolvedValueOnce({
          lessonType: 'VIDEO',
          videoUrl: 'https://video',
        });
        repository.updateLesson.mockResolvedValueOnce({ isPublished: true });
        const result = await service.publishLesson(actor, 'l1');
        expect(result).toEqual({ isPublished: true });
      });
    });

    it('unpublishLesson / previewLesson / archiveLesson delegate to the repository', () => {
      service.unpublishLesson(actor, 'l1');
      expect(repository.updateLesson).toHaveBeenCalledWith(
        'admin-1',
        'l1',
        { isPublished: false },
        'lesson.unpublished',
      );
      service.previewLesson(actor, 'l1', true);
      expect(repository.updateLesson).toHaveBeenCalledWith(
        'admin-1',
        'l1',
        { isPreview: true },
        'lesson.preview_updated',
      );
      service.archiveLesson(actor, 'l1');
      expect(repository.archiveLesson).toHaveBeenCalledWith('admin-1', 'l1');
    });
  });

  describe('resource methods', () => {
    it('createResource requires a storageKey or externalUrl', () => {
      expect(() => service.createResource(actor, 'l1', {} as never)).toThrow(
        BadRequestException,
      );

      service.createResource(actor, 'l1', {
        externalUrl: 'https://x.example.com',
      } as never);
      expect(repository.createResource).toHaveBeenCalledWith(
        'admin-1',
        'l1',
        expect.objectContaining({ externalUrl: 'https://x.example.com' }),
      );
    });

    it('updateResource maps title/sortOrder and infers resourceType from externalUrl', () => {
      service.updateResource(actor, 'r1', {
        title: 'New title',
        externalUrl: 'https://x.example.com',
        sortOrder: 2,
      } as never);
      expect(repository.updateResource).toHaveBeenCalledWith(
        'admin-1',
        'r1',
        expect.objectContaining({
          label: 'New title',
          resourceType: 'EXTERNAL',
          position: 2,
        }),
      );
    });

    it('updateResource treats an explicit empty externalUrl as a FILE resource', () => {
      service.updateResource(actor, 'r1', { externalUrl: '' } as never);
      expect(repository.updateResource).toHaveBeenCalledWith(
        'admin-1',
        'r1',
        expect.objectContaining({ resourceType: 'FILE' }),
      );
    });

    it('deleteResource delegates to the repository', () => {
      service.deleteResource(actor, 'r1');
      expect(repository.deleteResource).toHaveBeenCalledWith('admin-1', 'r1');
    });
  });
});
