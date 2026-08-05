import { cache } from 'react';
import { catalogApi } from './catalog.api';

/**
 * React `cache()` dedupes these within a single server render, so
 * `generateMetadata` and the page body can both call the same lookup
 * without doubling the request.
 */
export const getCourseBySlug = cache((slug: string) => catalogApi.getCourse(slug));
export const getCategoryBySlug = cache((slug: string, page = 1) =>
  catalogApi.getCategory(slug, { page, pageSize: 12 }),
);
export const listCategoriesServer = cache(() => catalogApi.listCategories({ pageSize: 100 }));
export const listFeaturedCoursesServer = cache(() => catalogApi.featuredCourses({ pageSize: 8 }));
