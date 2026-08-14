import { MOCK_ADMIN_COURSES } from './mock-admin-courses.data';
import type {
  AdminCourseDetail,
  AdminCourseListParams,
  AdminCourseListResult,
  AdminCourseSummary,
  CreateCourseInput,
  DuplicateCourseInput,
  UpdateCourseInput,
  UpdatePricingInput,
  UpdateSettingsInput,
  UpdateVisibilityInput,
} from '../types/admin-course.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

function conflict(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 409 };
  throw error;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toSummary(course: AdminCourseDetail): AdminCourseSummary {
  const {
    description: _description,
    enrollmentOpenAt: _enrollmentOpenAt,
    enrollmentCloseAt: _enrollmentCloseAt,
    capacity: _capacity,
    outcomes: _outcomes,
    requirements: _requirements,
    sections: _sections,
    readiness: _readiness,
    archivedAt: _archivedAt,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...summary
  } = course;
  return summary;
}

let store: AdminCourseDetail[] = MOCK_ADMIN_COURSES.map((course) => ({ ...course }));

function find(courseId: string): AdminCourseDetail {
  const course = store.find((entry) => entry.id === courseId);
  if (!course) notFound('Course not found');
  return course;
}

/** Shared with `mock-admin-curriculum.api.ts` so section/lesson/resource mutations affect the same in-memory course store. */
export function findMockCourse(courseId: string): AdminCourseDetail {
  return find(courseId);
}

export function findMockCourseBySectionId(sectionId: string): AdminCourseDetail {
  const course = store.find((entry) => entry.sections.some((section) => section.id === sectionId));
  if (!course) notFound('Section not found');
  return course;
}

export function findMockCourseByLessonId(lessonId: string): AdminCourseDetail {
  const course = store.find((entry) =>
    entry.sections.some((section) => section.lessons.some((lesson) => lesson.id === lessonId)),
  );
  if (!course) notFound('Lesson not found');
  return course;
}

export function findMockCourseByResourceId(resourceId: string): AdminCourseDetail {
  const course = store.find((entry) =>
    entry.sections.some((section) =>
      section.lessons.some((lesson) => lesson.resources.some((r) => r.id === resourceId)),
    ),
  );
  if (!course) notFound('Resource not found');
  return course;
}

export const mockAdminCoursesApi = {
  list: async (params: AdminCourseListParams = {}): Promise<AdminCourseListResult> => {
    const filtered = store.filter((course) => {
      if (params.status && course.status !== params.status) return false;
      if (params.accessType && course.accessType !== params.accessType) return false;
      if (params.visibility && course.visibility !== params.visibility) return false;
      if (params.difficulty && course.difficulty !== params.difficulty) return false;
      if (params.categoryId && course.categoryId !== params.categoryId) return false;
      if (params.featured !== undefined && course.featured !== params.featured) return false;
      if (params.createdBy && course.createdBy !== params.createdBy) return false;
      if (params.search && !course.title.toLowerCase().includes(params.search.toLowerCase()))
        return false;
      return true;
    });
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay({
      items: filtered.slice(start, start + pageSize).map(toSummary),
      total: filtered.length,
    });
  },

  detail: async (courseId: string): Promise<AdminCourseDetail> => delay(find(courseId)),

  create: async (input: CreateCourseInput): Promise<AdminCourseSummary> => {
    const course: AdminCourseDetail = {
      id: `course-${Date.now()}`,
      title: input.title.trim(),
      slug: input.slug?.trim() || slugify(input.title),
      shortDescription: input.shortDescription.trim(),
      description: input.description.trim(),
      thumbnailKey: input.thumbnailKey ?? null,
      presenterName: input.presenterName?.trim() || '',
      categoryId: input.categoryId,
      categoryName: '',
      categorySlug: '',
      accessType: input.accessType,
      price: input.price ?? '0',
      discountPrice: input.discountPrice ?? null,
      currency: input.currency ?? 'ETB',
      difficulty: input.difficulty,
      estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
      status: 'DRAFT',
      visibility: input.visibility ?? 'PUBLIC',
      certificateEnabled: input.certificateEnabled ?? false,
      featured: input.featured ?? false,
      publishedAt: null,
      createdBy: 'user-1',
      creatorName: 'Meron Alemu',
      creator: { id: 'user-1', email: 'meron@academy.test', name: 'Meron Alemu' },
      enrollmentOpenAt: null,
      enrollmentCloseAt: null,
      capacity: input.capacity ?? null,
      outcomes: (input.outcomes ?? []).map((text, i) => ({ id: `outcome-${i}`, text, sortOrder: i })),
      requirements: (input.requirements ?? []).map((text, i) => ({ id: `req-${i}`, text, sortOrder: i })),
      sections: [],
      readiness: { ready: false, issues: ['At least one section with a lesson is required.'] },
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store = [course, ...store];
    return delay(toSummary(course));
  },

  update: async (courseId: string, input: UpdateCourseInput): Promise<AdminCourseSummary> => {
    const course = find(courseId);
    Object.assign(course, input);
    course.updatedAt = new Date().toISOString();
    return delay(toSummary(course));
  },

  updatePricing: async (
    courseId: string,
    input: UpdatePricingInput,
  ): Promise<AdminCourseSummary> => {
    const course = find(courseId);
    course.accessType = input.accessType;
    course.price = input.price;
    course.discountPrice = input.discountPrice ?? null;
    course.currency = input.currency;
    course.updatedAt = new Date().toISOString();
    return delay(toSummary(course));
  },

  updateVisibility: async (
    courseId: string,
    input: UpdateVisibilityInput,
  ): Promise<AdminCourseSummary> => {
    const course = find(courseId);
    course.visibility = input.visibility;
    if (input.featured !== undefined) course.featured = input.featured;
    course.updatedAt = new Date().toISOString();
    return delay(toSummary(course));
  },

  updateSettings: async (
    courseId: string,
    input: UpdateSettingsInput,
  ): Promise<AdminCourseSummary> => {
    const course = find(courseId);
    if (input.certificateEnabled !== undefined)
      course.certificateEnabled = input.certificateEnabled;
    if (input.enrollmentOpenAt !== undefined) course.enrollmentOpenAt = input.enrollmentOpenAt;
    if (input.enrollmentCloseAt !== undefined) course.enrollmentCloseAt = input.enrollmentCloseAt;
    if (input.capacity !== undefined) course.capacity = input.capacity;
    course.updatedAt = new Date().toISOString();
    return delay(toSummary(course));
  },

  updateOutcomes: async (courseId: string, items: string[]): Promise<void> => {
    const course = find(courseId);
    course.outcomes = items.map((text, index) => ({ id: `out-${index}`, text, sortOrder: index }));
    return delay(undefined);
  },

  updateRequirements: async (courseId: string, items: string[]): Promise<void> => {
    const course = find(courseId);
    course.requirements = items.map((text, index) => ({
      id: `req-${index}`,
      text,
      sortOrder: index,
    }));
    return delay(undefined);
  },

  publish: async (courseId: string): Promise<AdminCourseSummary> => {
    const course = find(courseId);
    if (!course.readiness.ready) conflict('Course is not ready to publish');
    course.status = 'PUBLISHED';
    course.publishedAt = new Date().toISOString();
    return delay(toSummary(course));
  },

  unpublish: async (courseId: string): Promise<AdminCourseSummary> => {
    const course = find(courseId);
    course.status = 'DRAFT';
    return delay(toSummary(course));
  },

  archive: async (courseId: string): Promise<AdminCourseSummary> => {
    const course = find(courseId);
    course.status = 'ARCHIVED';
    course.archivedAt = new Date().toISOString();
    return delay(toSummary(course));
  },

  restore: async (courseId: string): Promise<AdminCourseSummary> => {
    const course = find(courseId);
    course.status = 'DRAFT';
    course.archivedAt = null;
    return delay(toSummary(course));
  },

  duplicate: async (courseId: string, input: DuplicateCourseInput): Promise<AdminCourseSummary> => {
    const source = find(courseId);
    const title = input.title?.trim() || `${source.title} (Copy)`;
    const course: AdminCourseDetail = {
      ...source,
      id: `course-${Date.now()}`,
      title,
      slug: input.slug?.trim() || slugify(title),
      status: 'DRAFT',
      publishedAt: null,
      featured: false,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store = [course, ...store];
    return delay(toSummary(course));
  },
};
