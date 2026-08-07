/**
 * Real enrollment data only tracks an overall `progressPercentage`, not
 * per-lesson completion (that's the excluded Lesson Player domain) - this
 * estimates a displayable "x/y Lessons" pair from that percentage against
 * a course's real `lessonCount` (from the catalog), rather than showing an
 * exact count that doesn't exist yet.
 */
export function estimateLessonProgress(
  progressPercentage: number,
  lessonCount: number | undefined,
): { completedLessons?: number; totalLessons?: number } {
  if (!lessonCount || lessonCount <= 0) return {};
  const completedLessons = Math.min(
    lessonCount,
    Math.round((progressPercentage / 100) * lessonCount),
  );
  return { completedLessons, totalLessons: lessonCount };
}
