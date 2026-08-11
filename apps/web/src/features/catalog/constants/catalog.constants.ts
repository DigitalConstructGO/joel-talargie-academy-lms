import type { CourseDifficulty, CourseSort } from '../types/catalog.types';

export const DIFFICULTY_LABELS: Record<CourseDifficulty, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All Levels',
};

export const SORT_LABELS: Record<CourseSort, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  title_asc: 'Title (A-Z)',
  title_desc: 'Title (Z-A)',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  featured: 'Featured',
};

export const DEFAULT_PAGE_SIZE = 12;

/**
 * URL-synced filter shape shared by `CourseFilters`/`CoursesGrid` - both
 * consume the same query-string keys via `useQueryFilters`, so the two
 * components stay in sync through the URL itself (no shared client state
 * needed) and filters survive refresh/back-forward/sharing on whichever
 * route they're mounted on (public `/courses` or `/dashboard/browse-courses`).
 */
export interface CatalogFilters {
  [key: string]: string | undefined;
  search: string | undefined;
  categoryId: string | undefined;
  accessType: string | undefined;
  difficulty: string | undefined;
  sort: string;
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  search: undefined,
  categoryId: undefined,
  accessType: undefined,
  difficulty: undefined,
  sort: 'newest',
};
