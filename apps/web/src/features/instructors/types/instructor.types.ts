import type { CourseSummary } from '@/features/catalog/types/catalog.types';

export interface Instructor {
  name: string;
  courseCount: number;
  courses: CourseSummary[];
}
