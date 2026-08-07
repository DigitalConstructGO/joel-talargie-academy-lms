'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalog.api';
import { catalogKeys } from '../api/query-keys';
import type { CourseListParams } from '../types/catalog.types';

export function useCourses(params: CourseListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: catalogKeys.courseList(params),
    queryFn: () => catalogApi.listCourses(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled,
  });
}

export function useFeaturedCourses(params: CourseListParams = {}) {
  return useQuery({
    queryKey: catalogKeys.featuredCourses(params),
    queryFn: () => catalogApi.featuredCourses(params),
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: catalogKeys.course(slug),
    queryFn: () => catalogApi.getCourse(slug),
    enabled: Boolean(slug),
  });
}
