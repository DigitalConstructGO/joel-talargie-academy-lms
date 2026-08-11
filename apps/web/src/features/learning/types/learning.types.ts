export type LessonType = 'VIDEO' | 'TEXT' | 'DOCUMENT' | 'DOWNLOAD' | 'EXTERNAL_LINK';
export type LessonProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface CurriculumLesson {
  id: string;
  sectionId: string;
  title: string;
  lessonType: LessonType;
  durationSeconds: number | null;
  position: number;
  isMandatory: boolean;
  isPreview: boolean;
  progressStatus: LessonProgressStatus;
  firstOpenedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
  savedPositionSeconds: number;
  isCurrent: boolean;
  isNextRecommended: boolean;
}

export interface CurriculumSection {
  id: string;
  title: string;
  description: string | null;
  position: number;
  progressPercentage: number;
  lessons: CurriculumLesson[];
}

export interface CourseOverview {
  enrollmentId: string;
  enrollmentStatus: string;
  progressPercentage: number;
  startedAt: string | null;
  completedAt: string | null;
  lastLessonId: string | null;
  reviewAccess: boolean;
  course: { id: string; title: string; slug: string };
  mandatoryLessonCount: number;
  completedMandatoryLessonCount: number;
  optionalLessonCount: number;
  completedOptionalLessonCount: number;
  nextRecommendedLesson: CurriculumLesson | null;
  curriculum: CurriculumSection[];
}

export interface LessonResource {
  id: string;
  label: string;
  resourceType: string;
  externalUrl: string | null;
  originalFileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  visibility: string;
  position: number;
}

export interface LessonContent {
  id: string;
  sectionId: string;
  title: string;
  lessonType: LessonType;
  durationSeconds: number | null;
  isMandatory: boolean;
  isPreview: boolean;
  content: string | null;
  videoUrl: string | null;
  externalUrl: string | null;
  resources: LessonResource[];
}

export interface ResumeTarget {
  enrollmentId: string;
  courseId: string;
  lessonId: string | null;
  sectionId: string | null;
  lessonTitle: string | null;
  lessonType: LessonType | null;
  savedPositionSeconds: number;
  progressPercentage: number;
  courseCompleted: boolean;
}

export interface CompleteLessonResult {
  progressPercentage: number;
  courseCompleted: boolean;
}
