import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockCatalogApi } from '../data/mock-catalog.api';
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

/** Talks to the real backend's public catalog endpoints. */
const liveCatalogApi = {
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

/**
 * Resolves to either the live backend or the built-in demo dataset based on
 * CATALOG_DATA_SOURCE. Every caller (hooks, server fetchers, pages) imports
 * this single export, so flipping the switch is the only change needed to
 * go from demo content to real backend data.
 */
export const catalogApi = CATALOG_DATA_SOURCE === 'live' ? liveCatalogApi : mockCatalogApi;
