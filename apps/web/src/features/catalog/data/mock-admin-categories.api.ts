import { MOCK_ADMIN_CATEGORIES } from './mock-admin-categories.data';
import type {
  AdminCategory,
  AdminCategoryDetail,
  AdminCategoryListParams,
  AdminCategoryListResult,
  CreateCategoryInput,
  ReorderCategoriesInput,
  UpdateCategoryInput,
} from '../types/admin-category.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

let store: AdminCategory[] = MOCK_ADMIN_CATEGORIES.map((category) => ({ ...category }));

export const mockAdminCategoriesApi = {
  list: async (params: AdminCategoryListParams = {}): Promise<AdminCategoryListResult> => {
    const filtered = store.filter((category) => {
      if (!params.includeArchived && category.archivedAt) return false;
      if (params.isActive !== undefined && category.isActive !== params.isActive) return false;
      if (params.parentId !== undefined && category.parentId !== params.parentId) return false;
      if (params.search && !category.name.toLowerCase().includes(params.search.toLowerCase()))
        return false;
      return true;
    });
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay({ items: filtered.slice(start, start + pageSize), total: filtered.length });
  },

  detail: async (categoryId: string): Promise<AdminCategoryDetail> => {
    const category = store.find((entry) => entry.id === categoryId);
    if (!category) notFound('Category not found');
    const children = store
      .filter((entry) => entry.parentId === categoryId)
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        slug: entry.slug,
        isActive: entry.isActive,
        sortOrder: entry.sortOrder,
      }));
    return delay({ ...category, children, courseCounts: {} });
  },

  create: async (input: CreateCategoryInput): Promise<AdminCategory> => {
    const category: AdminCategory = {
      id: `cat-${Date.now()}`,
      parentId: input.parentId ?? null,
      name: input.name.trim(),
      slug: input.slug?.trim() || slugify(input.name),
      description: input.description?.trim() || null,
      imageKey: input.imageKey ?? null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? store.length,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store = [...store, category];
    return delay(category);
  },

  update: async (categoryId: string, input: UpdateCategoryInput): Promise<AdminCategory> => {
    const category = store.find((entry) => entry.id === categoryId);
    if (!category) notFound('Category not found');
    if (input.name !== undefined) category.name = input.name;
    if (input.description !== undefined) category.description = input.description;
    if (input.parentId !== undefined) category.parentId = input.parentId;
    if (input.imageKey !== undefined) category.imageKey = input.imageKey;
    if (input.isActive !== undefined) category.isActive = input.isActive;
    category.updatedAt = new Date().toISOString();
    return delay(category);
  },

  archive: async (categoryId: string): Promise<void> => {
    const category = store.find((entry) => entry.id === categoryId);
    if (!category) notFound('Category not found');
    category.archivedAt = new Date().toISOString();
    return delay(undefined);
  },

  reorder: async (input: ReorderCategoriesInput): Promise<void> => {
    for (const item of input.items) {
      const category = store.find((entry) => entry.id === item.categoryId);
      if (category) {
        category.sortOrder = item.sortOrder;
        if (item.parentId !== undefined) category.parentId = item.parentId;
      }
    }
    return delay(undefined);
  },
};
