import { ConflictException, NotFoundException } from '@nestjs/common';
import { CatalogService } from '../services/catalog.service';
import { CourseAccessType, CourseDifficulty } from '../dto/catalog.dto';

describe('CatalogService', () => {
  const repository = {
    categoryBySlug: jest.fn(),
    categoryById: jest.fn(),
    courseBySlug: jest.fn(),
    courseById: jest.fn(),
    createCategory: jest.fn(),
    listCategories: jest.fn(),
    categoryDetail: jest.fn(),
    categoryCycle: jest.fn(),
    updateCategory: jest.fn(),
    reorderCategories: jest.fn(),
    categoryArchiveCounts: jest.fn(),
    archiveCategory: jest.fn(),
    createCourse: jest.fn(),
    updateCourse: jest.fn(),
    replaceCourseItems: jest.fn(),
    readiness: jest.fn(),
    publishCourse: jest.fn(),
    courseStatus: jest.fn(),
    courseDetail: jest.fn(),
    listCourses: jest.fn(),
    duplicateCourse: jest.fn(),
  };
  const service = new CatalogService(repository as never);
  const actor = { id: 'actor-id' } as never;
  beforeEach(() => jest.clearAllMocks());

  it('creates courses as drafts through the transactional repository', async () => {
    repository.courseBySlug.mockResolvedValue(null);
    repository.createCourse.mockResolvedValue({
      id: 'course-id',
      status: 'DRAFT',
    });
    await expect(
      service.createCourse(actor, {
        categoryId: 'category-id',
        title: 'Secure NestJS',
        shortDescription: 'A complete backend course',
        description: 'A long and safe course description',
        accessType: CourseAccessType.FREE,
        difficulty: CourseDifficulty.BEGINNER,
        price: '0',
      }),
    ).resolves.toMatchObject({ status: 'DRAFT' });
  });
  it('rejects duplicate course slugs', async () => {
    repository.courseBySlug.mockResolvedValue({ id: 'existing' });
    await expect(
      service.createCourse(actor, {
        categoryId: 'category-id',
        title: 'Secure NestJS',
        shortDescription: 'A complete backend course',
        description: 'A long and safe course description',
        accessType: CourseAccessType.FREE,
        difficulty: CourseDifficulty.BEGINNER,
        price: '0',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('blocks publication when readiness checks fail', async () => {
    repository.readiness.mockResolvedValue({
      ready: false,
      issues: ['SECTION_REQUIRED'],
    });
    await expect(service.publish(actor, 'course-id')).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'COURSE_NOT_READY' }),
    });
  });
  it('publishes a ready course', async () => {
    repository.readiness.mockResolvedValue({ ready: true, issues: [] });
    repository.publishCourse.mockResolvedValue({ status: 'PUBLISHED' });
    await expect(service.publish(actor, 'course-id')).resolves.toMatchObject({
      status: 'PUBLISHED',
    });
  });
  it('returns 404 for protected public course content', async () => {
    repository.courseBySlug.mockResolvedValue({
      status: 'DRAFT',
      visibility: 'PUBLIC',
    });
    await expect(service.publicCourse('draft')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('duplicates curriculum through a single repository transaction', async () => {
    repository.courseById.mockResolvedValue({ title: 'Original' });
    repository.courseBySlug.mockResolvedValue(null);
    repository.duplicateCourse.mockResolvedValue({
      id: 'copy',
      status: 'DRAFT',
    });
    await expect(
      service.duplicateCourse(actor, 'source', {}),
    ).resolves.toMatchObject({ status: 'DRAFT' });
    expect(repository.duplicateCourse).toHaveBeenCalledWith(
      'actor-id',
      'source',
      'Original Copy',
      'original-copy',
    );
  });
});
