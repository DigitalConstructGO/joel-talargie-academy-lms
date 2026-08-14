export type CourseAccessType = 'FREE' | 'PAID';
export type CourseDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
export type CourseSort =
  'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'price_asc' | 'price_desc' | 'featured';

export interface CourseSummary {
  id: string;
  title: string;
  subtitle?: string;
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
  certificateEnabled: boolean;
  featured: boolean;
  publishedAt: string | null;
  /** Not part of the live backend contract yet - populated by mock data only. */
  rating?: number;
  studentsCount?: number;
  language?: string;
  tags?: string[];
  lessonCount?: number;
  moduleCount?: number;
}

export interface CourseListResult {
  items: CourseSummary[];
  total: number;
}

export interface CourseLessonResource {
  id: string;
  title: string;
  externalUrl: string | null;
  originalFileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
}

export interface CourseLesson {
  id: string;
  title: string;
  lessonType: 'VIDEO' | 'TEXT' | 'DOCUMENT' | 'DOWNLOAD' | 'EXTERNAL_LINK';
  durationSeconds: number | null;
  isMandatory: boolean;
  isPreview: boolean;
  content?: string | null;
  videoUrl?: string | null;
  externalUrl?: string | null;
  resources?: CourseLessonResource[];
}

export interface CourseSection {
  id: string;
  title: string;
  description: string | null;
  lessons: CourseLesson[];
}

export interface CourseDetail {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  shortDescription: string;
  description: string;
  presenterName: string;
  thumbnailKey?: string | null;
  accessType: CourseAccessType;
  price: string;
  discountPrice: string | null;
  currency: string;
  difficulty: CourseDifficulty;
  estimatedDurationMinutes: number | null;
  certificateEnabled: boolean;
  publishedAt: string | null;
  outcomes: string[];
  requirements: string[];
  sections: CourseSection[];
  /** Not part of the live backend contract yet - populated by mock data only. */
  rating?: number;
  studentsCount?: number;
  language?: string;
  tags?: string[];
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageKey?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryListResult {
  items: Category[];
  total: number;
}

export interface CategoryDetail {
  category: Pick<Category, 'id' | 'name' | 'slug' | 'description'>;
  courses: CourseListResult;
}

export interface CourseListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  accessType?: CourseAccessType;
  difficulty?: CourseDifficulty;
  categoryId?: string;
  featured?: boolean;
  sort?: CourseSort;
}

export interface CategoryListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  parentId?: string;
}
