import { MOCK_CATEGORIES } from './mock-categories.data';
import { MOCK_COURSE_RECORDS, toCourseDetail, toCourseSummary } from './build-mock-courses';
import type {
  CategoryDetail,
  CategoryListParams,
  CategoryListResult,
  CourseDetail,
  CourseListParams,
  CourseListResult,
} from '../types/catalog.types';

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function paginate<T>(items: T[], page = 1, pageSize = 12): { items: T[]; total: number } {
  const total = items.length;
  const start = (Math.max(1, page) - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total };
}

function sortRecords<
  T extends { title: string; price: string; publishedAt: string | null; featured: boolean },
>(items: T[], sort: CourseListParams['sort']): T[] {
  const sorted = [...items];
  switch (sort) {
    case 'oldest':
      return sorted.sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''));
    case 'title_asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'title_desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'price_asc':
      return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    case 'price_desc':
      return sorted.sort((a, b) => Number(b.price) - Number(a.price));
    case 'featured':
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    case 'newest':
    default:
      return sorted.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
  }
}

function filterCourses(params: CourseListParams) {
  return MOCK_COURSE_RECORDS.filter((record) => {
    if (params.categoryId && record.categoryId !== params.categoryId) return false;
    if (params.accessType && record.accessType !== params.accessType) return false;
    if (params.difficulty && record.difficulty !== params.difficulty) return false;
    if (params.featured && !record.featured) return false;
    if (params.search) {
      const needle = params.search.toLowerCase();
      const haystack =
        `${record.title} ${record.shortDescription} ${record.presenterName} ${(record.tags ?? []).join(' ')}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export const mockCatalogApi = {
  listCourses: async (params: CourseListParams = {}): Promise<CourseListResult> => {
    const filtered = sortRecords(filterCourses(params), params.sort);
    const { items, total } = paginate(filtered, params.page, params.pageSize ?? 12);
    return delay({ items: items.map(toCourseSummary), total });
  },

  featuredCourses: async (params: CourseListParams = {}): Promise<CourseListResult> => {
    const filtered = sortRecords(
      filterCourses({ ...params, featured: true }),
      params.sort ?? 'featured',
    );
    const { items, total } = paginate(
      filtered,
      params.page ?? 1,
      Math.min(params.pageSize ?? 8, 20),
    );
    return delay({ items: items.map(toCourseSummary), total });
  },

  getCourse: async (slug: string): Promise<CourseDetail> => {
    const record = MOCK_COURSE_RECORDS.find((course) => course.slug === slug);
    if (!record) {
      const error = new Error('Course not found') as Error & { response?: { status: number } };
      error.response = { status: 404 };
      throw error;
    }
    return delay(toCourseDetail(record));
  },

  listCategories: async (params: CategoryListParams = {}): Promise<CategoryListResult> => {
    const filtered = params.search
      ? MOCK_CATEGORIES.filter((category) =>
          category.name.toLowerCase().includes(params.search!.toLowerCase()),
        )
      : MOCK_CATEGORIES;
    const { items, total } = paginate(filtered, params.page, params.pageSize ?? 15);
    return delay({ items, total });
  },

  getCategory: async (slug: string, params: CourseListParams = {}): Promise<CategoryDetail> => {
    const category = MOCK_CATEGORIES.find((entry) => entry.slug === slug);
    if (!category) {
      const error = new Error('Category not found') as Error & { response?: { status: number } };
      error.response = { status: 404 };
      throw error;
    }
    const filtered = sortRecords(
      filterCourses({ ...params, categoryId: category.id }),
      params.sort,
    );
    const { items, total } = paginate(filtered, params.page, params.pageSize ?? 12);
    return delay({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
      courses: { items: items.map(toCourseSummary), total },
    });
  },
};
