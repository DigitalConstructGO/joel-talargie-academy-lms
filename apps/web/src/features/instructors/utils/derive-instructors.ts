import type { CourseSummary } from '@/features/catalog/types/catalog.types';
import type { Instructor } from '../types/instructor.types';

/**
 * The catalog has no dedicated instructor entity - courses only carry a
 * free-text `presenterName`. This derives a lightweight instructor listing
 * by grouping published courses returned by the public catalog API, rather
 * than fabricating instructor profiles (bios, ratings, avatars) that don't
 * exist in the schema.
 */
export function deriveInstructors(courses: CourseSummary[]): Instructor[] {
  const byName = new Map<string, CourseSummary[]>();
  for (const course of courses) {
    const existing = byName.get(course.presenterName);
    if (existing) existing.push(course);
    else byName.set(course.presenterName, [course]);
  }
  return Array.from(byName.entries())
    .map(([name, instructorCourses]) => ({
      name,
      courseCount: instructorCourses.length,
      courses: instructorCourses,
    }))
    .sort((a, b) => b.courseCount - a.courseCount);
}
