import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockAdminCoursesApi } from '../data/mock-admin-courses.api';
import type {
  AdminCourseDetail,
  AdminCourseListParams,
  AdminCourseListResult,
  AdminCourseSummary,
  CreateCourseInput,
  DuplicateCourseInput,
  UpdateCourseInput,
  UpdatePricingInput,
  UpdateSettingsInput,
  UpdateVisibilityInput,
} from '../types/admin-course.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

const liveAdminCoursesApi = {
  list: async (params: AdminCourseListParams = {}) =>
    unwrap<AdminCourseListResult>(
      await authClient.get('/admin/courses', { params: cleanParams(params) }),
    ),

  detail: async (courseId: string) =>
    unwrap<AdminCourseDetail>(
      await authClient.get(`/admin/courses/${encodeURIComponent(courseId)}`),
    ),

  create: async (input: CreateCourseInput) =>
    unwrap<AdminCourseSummary>(await authClient.post('/admin/courses', input)),

  update: async (courseId: string, input: UpdateCourseInput) =>
    unwrap<AdminCourseSummary>(
      await authClient.patch(`/admin/courses/${encodeURIComponent(courseId)}`, input),
    ),

  updatePricing: async (courseId: string, input: UpdatePricingInput) =>
    unwrap<AdminCourseSummary>(
      await authClient.put(`/admin/courses/${encodeURIComponent(courseId)}/pricing`, input),
    ),

  updateVisibility: async (courseId: string, input: UpdateVisibilityInput) =>
    unwrap<AdminCourseSummary>(
      await authClient.put(`/admin/courses/${encodeURIComponent(courseId)}/visibility`, input),
    ),

  updateSettings: async (courseId: string, input: UpdateSettingsInput) =>
    unwrap<AdminCourseSummary>(
      await authClient.put(`/admin/courses/${encodeURIComponent(courseId)}/settings`, input),
    ),

  updateOutcomes: async (courseId: string, items: string[]) =>
    unwrap<unknown>(
      await authClient.put(`/admin/courses/${encodeURIComponent(courseId)}/outcomes`, { items }),
    ),

  updateRequirements: async (courseId: string, items: string[]) =>
    unwrap<unknown>(
      await authClient.put(`/admin/courses/${encodeURIComponent(courseId)}/requirements`, {
        items,
      }),
    ),

  publish: async (courseId: string) =>
    unwrap<AdminCourseSummary>(
      await authClient.post(`/admin/courses/${encodeURIComponent(courseId)}/publish`),
    ),

  unpublish: async (courseId: string) =>
    unwrap<AdminCourseSummary>(
      await authClient.post(`/admin/courses/${encodeURIComponent(courseId)}/unpublish`),
    ),

  archive: async (courseId: string) =>
    unwrap<AdminCourseSummary>(
      await authClient.delete(`/admin/courses/${encodeURIComponent(courseId)}`),
    ),

  restore: async (courseId: string) =>
    unwrap<AdminCourseSummary>(
      await authClient.post(`/admin/courses/${encodeURIComponent(courseId)}/restore`),
    ),

  duplicate: async (courseId: string, input: DuplicateCourseInput) =>
    unwrap<AdminCourseSummary>(
      await authClient.post(`/admin/courses/${encodeURIComponent(courseId)}/duplicate`, input),
    ),
};

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const adminCoursesApi =
  CATALOG_DATA_SOURCE === 'live' ? liveAdminCoursesApi : mockAdminCoursesApi;
