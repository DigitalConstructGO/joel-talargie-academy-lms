export type ResourceVisibility = 'PUBLIC' | 'ENROLLED_STUDENTS' | 'ADMIN_ONLY';

export type LessonType = 'VIDEO' | 'TEXT' | 'DOCUMENT' | 'DOWNLOAD' | 'EXTERNAL_LINK';

export interface CreateSectionInput {
  title: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateSectionInput {
  title?: string;
  description?: string | null;
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}

export interface CreateLessonInput {
  title: string;
  slug?: string;
  lessonType: LessonType;
  content?: string;
  videoUrl?: string;
  externalUrl?: string;
  durationSeconds?: number;
  isMandatory?: boolean;
  isPreview?: boolean;
  sortOrder?: number;
}

export interface UpdateLessonInput {
  title?: string;
  lessonType?: LessonType;
  content?: string | null;
  videoUrl?: string | null;
  externalUrl?: string | null;
  durationSeconds?: number | null;
  isMandatory?: boolean;
}

export interface AdminLessonResource {
  id: string;
  title: string;
  storageKey: string | null;
  externalUrl: string | null;
  originalFileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  visibility: ResourceVisibility;
  sortOrder: number;
}

export interface AdminLessonDetail {
  id: string;
  courseId: string;
  sectionId: string;
  title: string;
  slug: string;
  lessonType: LessonType;
  content: string | null;
  videoUrl: string | null;
  externalUrl: string | null;
  durationSeconds: number | null;
  isMandatory: boolean;
  isPreview: boolean;
  publishedAt: string | null;
  position: number;
  resources: AdminLessonResource[];
}

export interface CreateResourceInput {
  title: string;
  storageKey?: string;
  externalUrl?: string;
  originalFileName?: string;
  mimeType?: string;
  fileSize?: number;
  visibility: ResourceVisibility;
  sortOrder?: number;
}

export interface UpdateResourceInput {
  title?: string;
  storageKey?: string | null;
  externalUrl?: string | null;
  visibility?: ResourceVisibility;
}
