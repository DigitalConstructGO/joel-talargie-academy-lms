import type { CategoryListParams, CourseListParams } from '../types/catalog.types';

export const catalogKeys = {
  all: ['catalog'] as const,
  courses: () => [...catalogKeys.all, 'courses'] as const,
  courseList: (params: CourseListParams) => [...catalogKeys.courses(), 'list', params] as const,
  featuredCourses: (params: CourseListParams) =>
    [...catalogKeys.courses(), 'featured', params] as const,
  course: (slug: string) => [...catalogKeys.courses(), 'detail', slug] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  categoryList: (params: CategoryListParams) =>
    [...catalogKeys.categories(), 'list', params] as const,
  category: (slug: string, params: CourseListParams) =>
    [...catalogKeys.categories(), 'detail', slug, params] as const,
};
