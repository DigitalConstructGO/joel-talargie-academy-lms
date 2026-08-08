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
