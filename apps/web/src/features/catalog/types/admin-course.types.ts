import type { CourseAccessType, CourseDifficulty, CourseSort } from './catalog.types';
import type { AdminLessonDetail } from './admin-curriculum.types';

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CourseVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

export interface AdminCourseSummary {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailKey: string | null;
  presenterName: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  accessType: CourseAccessType;
  price: string;
  discountPrice: string | null;
  currency: string;
  difficulty: CourseDifficulty;
  estimatedDurationMinutes: number | null;
  status: CourseStatus;
  visibility: CourseVisibility;
  certificateEnabled: boolean;
  featured: boolean;
  publishedAt: string | null;
}

export interface AdminCourseListResult {
  items: AdminCourseSummary[];
  total: number;
}

export interface AdminCourseListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CourseStatus;
  accessType?: CourseAccessType;
  visibility?: CourseVisibility;
  difficulty?: CourseDifficulty;
  categoryId?: string;
  featured?: boolean;
  sort?: CourseSort;
}

export interface CourseReadiness {
  ready: boolean;
  issues: string[];
}

export interface AdminCourseSection {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  position: number;
  lessons: AdminLessonDetail[];
}

export interface AdminCourseDetail extends AdminCourseSummary {
  description: string;
  enrollmentOpenAt: string | null;
  enrollmentCloseAt: string | null;
  capacity: number | null;
  outcomes: { id: string; text: string; sortOrder: number }[];
  requirements: { id: string; text: string; sortOrder: number }[];
  sections: AdminCourseSection[];
  readiness: CourseReadiness;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  categoryId: string;
  title: string;
  slug?: string;
  shortDescription: string;
  description: string;
  accessType: CourseAccessType;
  difficulty: CourseDifficulty;
  presenterName?: string;
  price?: string;
  discountPrice?: string;
  currency?: string;
  estimatedDurationMinutes?: number;
}

export interface UpdateCourseInput {
  categoryId?: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  presenterName?: string;
  difficulty?: CourseDifficulty;
  estimatedDurationMinutes?: number | null;
}

export interface UpdatePricingInput {
  accessType: CourseAccessType;
  price: string;
  discountPrice?: string | null;
  currency: string;
}

export interface UpdateVisibilityInput {
  visibility: CourseVisibility;
  featured?: boolean;
}

export interface UpdateSettingsInput {
  certificateEnabled?: boolean;
  enrollmentOpenAt?: string | null;
  enrollmentCloseAt?: string | null;
  capacity?: number | null;
}

export interface DuplicateCourseInput {
  title?: string;
  slug?: string;
}
