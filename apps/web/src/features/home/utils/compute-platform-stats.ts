import { MOCK_COURSE_RECORDS } from '@/features/catalog/data/build-mock-courses';

/**
 * Derives platform-wide stats from the mock course dataset instead of
 * hardcoding arbitrary marketing numbers. There is no real enrollment or
 * certificate ledger yet, so "students enrolled" sums each course's
 * studentsCount (enrollments, not unique people - the same convention most
 * course marketplaces use) and "certificates issued" applies a documented
 * completion-rate assumption on top of that.
 */
export interface PlatformStats {
  studentsEnrolled: number;
  satisfactionPercent: number;
  certificatesIssued: number;
  averageRating: number;
}

const ASSUMED_CERTIFICATE_COMPLETION_RATE = 0.15;

export function computePlatformStats(): PlatformStats {
  const studentsEnrolled = MOCK_COURSE_RECORDS.reduce(
    (total, course) => total + (course.studentsCount ?? 0),
    0,
  );

  const ratedCourses = MOCK_COURSE_RECORDS.filter((course) => course.rating !== undefined);
  const averageRating =
    ratedCourses.reduce((total, course) => total + (course.rating ?? 0), 0) /
    Math.max(1, ratedCourses.length);
  const satisfactionPercent = Math.round((averageRating / 5) * 100);

  const certificateEligibleStudents = MOCK_COURSE_RECORDS.filter(
    (course) => course.certificateEnabled,
  ).reduce((total, course) => total + (course.studentsCount ?? 0), 0);
  const certificatesIssued = Math.round(
    certificateEligibleStudents * ASSUMED_CERTIFICATE_COMPLETION_RATE,
  );

  return {
    studentsEnrolled,
    satisfactionPercent,
    certificatesIssued,
    averageRating: Math.round(averageRating * 10) / 10,
  };
}
