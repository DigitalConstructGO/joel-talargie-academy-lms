import { authClient, unwrap } from '@/lib/api/auth-client';
import type {
  CategoryDetail,
  CategoryListParams,
  CategoryListResult,
  CourseDetail,
  CourseListParams,
  CourseListResult,
} from '../types/catalog.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

export const catalogApi = {
  listCourses: async (params: CourseListParams = {}) =>
    unwrap<CourseListResult>(
      await authClient.get('/catalog/courses', { params: cleanParams(params) }),
    ),

  featuredCourses: async (params: CourseListParams = {}) =>
    unwrap<CourseListResult>(
      await authClient.get('/catalog/courses/featured', { params: cleanParams(params) }),
    ),

  getCourse: async (slug: string) =>
    unwrap<CourseDetail>(await authClient.get(`/catalog/courses/${encodeURIComponent(slug)}`)),

  listCategories: async (params: CategoryListParams = {}) =>
    unwrap<CategoryListResult>(
      await authClient.get('/catalog/categories', { params: cleanParams(params) }),
    ),

  getCategory: async (slug: string, params: CourseListParams = {}) =>
    unwrap<CategoryDetail>(
      await authClient.get(`/catalog/categories/${encodeURIComponent(slug)}`, {
        params: cleanParams(params),
      }),
    ),
};
