'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog.api';
import { catalogKeys } from '../api/query-keys';
import type { CategoryListParams, CourseListParams } from '../types/catalog.types';

export function useCategories(params: CategoryListParams = {}) {
  return useQuery({
    queryKey: catalogKeys.categoryList(params),
    queryFn: () => catalogApi.listCategories(params),
    placeholderData: keepPreviousData,
  });
}

export function useCategory(slug: string, params: CourseListParams = {}) {
  return useQuery({
    queryKey: catalogKeys.category(slug, params),
    queryFn: () => catalogApi.getCategory(slug, params),
    enabled: Boolean(slug),
    placeholderData: keepPreviousData,
  });
}
