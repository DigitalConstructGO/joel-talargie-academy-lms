'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminCategoriesApi } from '../api/admin-categories.api';
import type {
  AdminCategoryListParams,
  CreateCategoryInput,
  ReorderCategoriesInput,
  UpdateCategoryInput,
} from '../types/admin-category.types';

const adminCategoryKeys = {
  all: ['admin-categories'] as const,
  lists: () => [...adminCategoryKeys.all, 'list'] as const,
  list: (params: AdminCategoryListParams) => [...adminCategoryKeys.lists(), params] as const,
  detail: (categoryId: string) => [...adminCategoryKeys.all, 'detail', categoryId] as const,
};

export function useAdminCategories(params: AdminCategoryListParams = {}) {
  return useQuery({
    queryKey: adminCategoryKeys.list(params),
    queryFn: () => adminCategoriesApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminCategory(categoryId: string) {
  return useQuery({
    queryKey: adminCategoryKeys.detail(categoryId),
    queryFn: () => adminCategoriesApi.detail(categoryId),
    enabled: Boolean(categoryId),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => adminCategoriesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCategoryKeys.lists() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, input }: { categoryId: string; input: UpdateCategoryInput }) =>
      adminCategoriesApi.update(categoryId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminCategoryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: adminCategoryKeys.detail(variables.categoryId),
      });
    },
  });
}

export function useArchiveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => adminCategoriesApi.archive(categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCategoryKeys.lists() });
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderCategoriesInput) => adminCategoriesApi.reorder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCategoryKeys.lists() });
    },
  });
}
