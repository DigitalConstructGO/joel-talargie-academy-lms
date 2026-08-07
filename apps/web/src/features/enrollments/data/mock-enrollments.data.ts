import { MOCK_COURSE_RECORDS } from '@/features/catalog/data/build-mock-courses';
import type { Enrollment, EnrollmentStatus } from '../types/enrollment.types';

interface EnrollmentSeed {
  courseIndex: number;
  status: EnrollmentStatus;
  progressPercentage: number;
  daysAgoEnrolled: number;
  daysAgoUpdated: number;
}

/** Spread across different real courses/categories so "My Courses" reads naturally, not repetitively. */
const ENROLLMENT_SEEDS: EnrollmentSeed[] = [
  {
    courseIndex: 0,
    status: 'IN_PROGRESS',
    progressPercentage: 72,
    daysAgoEnrolled: 34,
    daysAgoUpdated: 1,
  },
  {
    courseIndex: 2,
    status: 'IN_PROGRESS',
    progressPercentage: 18,
    daysAgoEnrolled: 6,
    daysAgoUpdated: 2,
  },
  {
    courseIndex: 4,
    status: 'COMPLETED',
    progressPercentage: 100,
    daysAgoEnrolled: 90,
    daysAgoUpdated: 20,
  },
  {
    courseIndex: 6,
    status: 'ENROLLED',
    progressPercentage: 0,
    daysAgoEnrolled: 1,
    daysAgoUpdated: 1,
  },
  {
    courseIndex: 8,
    status: 'IN_PROGRESS',
    progressPercentage: 45,
    daysAgoEnrolled: 15,
    daysAgoUpdated: 4,
  },
  {
    courseIndex: 10,
    status: 'COMPLETED',
    progressPercentage: 100,
    daysAgoEnrolled: 150,
    daysAgoUpdated: 60,
  },
  {
    courseIndex: 12,
    status: 'COMPLETED',
    progressPercentage: 100,
    daysAgoEnrolled: 80,
    daysAgoUpdated: 10,
  },
];

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

function buildEnrollment(seed: EnrollmentSeed, index: number): Enrollment | null {
  const record = MOCK_COURSE_RECORDS[seed.courseIndex];
  if (!record) return null;

  const hasLearningAccess =
    seed.status === 'ENROLLED' || seed.status === 'IN_PROGRESS' || seed.status === 'COMPLETED';

  return {
    id: `enrollment-${String(index + 1).padStart(3, '0')}`,
    courseId: record.id,
    status: seed.status,
    priceSnapshot: record.price,
    discountSnapshot: record.discountPrice,
    currencySnapshot: record.currency,
    progressPercentage: seed.progressPercentage,
    enrolledAt: daysAgo(seed.daysAgoEnrolled),
    startedAt: seed.progressPercentage > 0 ? daysAgo(seed.daysAgoEnrolled - 1) : null,
    completedAt: seed.status === 'COMPLETED' ? daysAgo(seed.daysAgoUpdated) : null,
    createdAt: daysAgo(seed.daysAgoEnrolled),
    updatedAt: daysAgo(seed.daysAgoUpdated),
    courseTitle: record.title,
    courseSlug: record.slug,
    thumbnailKey: record.thumbnailKey,
    categoryId: record.categoryId,
    categoryName: record.categoryName,
    categorySlug: record.categorySlug,
    nextAction: seed.status === 'COMPLETED' ? 'REVIEW' : hasLearningAccess ? 'RESUME' : 'WAIT',
    hasLearningAccess,
  };
}

export const MOCK_ENROLLMENTS: Enrollment[] = ENROLLMENT_SEEDS.map(buildEnrollment).filter(
  (enrollment): enrollment is Enrollment => enrollment !== null,
);
