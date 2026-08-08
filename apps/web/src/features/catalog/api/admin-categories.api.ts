import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockAdminCategoriesApi } from '../data/mock-admin-categories.api';
import type {
  AdminCategory,
  AdminCategoryDetail,
  AdminCategoryListParams,
  AdminCategoryListResult,
  CreateCategoryInput,
  ReorderCategoriesInput,
  UpdateCategoryInput,
} from '../types/admin-category.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

const liveAdminCategoriesApi = {
  list: async (params: AdminCategoryListParams = {}) =>
    unwrap<AdminCategoryListResult>(
      await authClient.get('/admin/categories', { params: cleanParams(params) }),
    ),

  detail: async (categoryId: string) =>
    unwrap<AdminCategoryDetail>(
      await authClient.get(`/admin/categories/${encodeURIComponent(categoryId)}`),
    ),

  create: async (input: CreateCategoryInput) =>
    unwrap<AdminCategory>(await authClient.post('/admin/categories', input)),

  update: async (categoryId: string, input: UpdateCategoryInput) =>
    unwrap<AdminCategory>(
      await authClient.patch(`/admin/categories/${encodeURIComponent(categoryId)}`, input),
    ),

  archive: async (categoryId: string) =>
    unwrap<void>(await authClient.delete(`/admin/categories/${encodeURIComponent(categoryId)}`)),

  reorder: async (input: ReorderCategoriesInput) =>
    unwrap<void>(await authClient.put('/admin/categories/reorder', input)),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const adminCategoriesApi =
  CATALOG_DATA_SOURCE === 'live' ? liveAdminCategoriesApi : mockAdminCategoriesApi;
