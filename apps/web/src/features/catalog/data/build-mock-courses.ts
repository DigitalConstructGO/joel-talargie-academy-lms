import { getMockCategoryBySlug } from './mock-categories.data';
import { getInstructorBySlug } from '@/features/instructors/data/mock-instructors.data';
import { COURSE_SEEDS, type CourseSeed } from './course-seeds.data';
import type { CourseDetail, CourseSection, CourseSummary } from '../types/catalog.types';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildSections(seed: CourseSeed, courseId: string): CourseSection[] {
  const lessonId = (suffix: string) => `${courseId}-${suffix}`;

  const sections: CourseSection[] = [
    {
      id: lessonId('sec-intro'),
      title: 'Getting Started',
      description: `A quick orientation before diving into ${seed.title}.`,
      lessons: [
        {
          id: lessonId('l-1'),
          title: 'Course Introduction and Roadmap',
          lessonType: 'VIDEO',
          durationSeconds: 420,
          isMandatory: true,
          isPreview: true,
        },
        {
          id: lessonId('l-2'),
          title: 'Setting Up Your Environment',
          lessonType: 'VIDEO',
          durationSeconds: 540,
          isMandatory: true,
          isPreview: true,
        },
        {
          id: lessonId('l-3'),
          title: 'How This Course Works',
          lessonType: 'TEXT',
          durationSeconds: null,
          isMandatory: false,
          isPreview: false,
        },
      ],
    },
    {
      id: lessonId('sec-core'),
      title: 'Core Concepts',
      description: 'The main skills you will build in this course.',
      lessons: seed.outcomes.map((outcome, index) => ({
        id: lessonId(`l-core-${index}`),
        title: outcome,
        lessonType: 'VIDEO' as const,
        durationSeconds: 600 + index * 60,
        isMandatory: true,
        isPreview: false,
      })),
    },
    {
      id: lessonId('sec-practice'),
      title: 'Hands-On Practice',
      description: 'Apply what you learned to realistic exercises.',
      lessons: [
        {
          id: lessonId('l-practice-1'),
          title: `Guided Project: ${seed.title}`,
          lessonType: 'VIDEO',
          durationSeconds: 900,
          isMandatory: true,
          isPreview: false,
        },
        {
          id: lessonId('l-practice-2'),
          title: 'Independent Challenge Exercise',
          lessonType: 'DOWNLOAD',
          durationSeconds: null,
          isMandatory: false,
          isPreview: false,
        },
      ],
    },
    {
      id: lessonId('sec-wrap'),
      title: 'Wrap-Up',
      description: null,
      lessons: [
        {
          id: lessonId('l-wrap-1'),
          title: 'Course Recap and Next Steps',
          lessonType: 'VIDEO',
          durationSeconds: 360,
          isMandatory: true,
          isPreview: false,
        },
        ...(seed.certificateEnabled
          ? [
              {
                id: lessonId('l-wrap-2'),
                title: 'Final Assessment and Certificate',
                lessonType: 'TEXT' as const,
                durationSeconds: null,
                isMandatory: true,
                isPreview: false,
              },
            ]
          : []),
      ],
    },
  ];

  return sections;
}

export interface MockCourseRecord extends CourseSummary {
  description: string;
  requirements: string[];
  outcomes: string[];
  sections: CourseSection[];
}

function buildRecord(seed: CourseSeed, index: number): MockCourseRecord {
  const category = getMockCategoryBySlug(seed.categorySlug);
  const instructor = getInstructorBySlug(seed.instructorSlug);
  if (!category) throw new Error(`Unknown mock category slug: ${seed.categorySlug}`);
  if (!instructor) throw new Error(`Unknown mock instructor slug: ${seed.instructorSlug}`);

  const id = `course-${String(index + 1).padStart(3, '0')}`;
  const accessType = seed.priceUsd === 0 ? 'FREE' : 'PAID';
  // Deterministic recent publish dates spread over the last ~18 months.
  const publishedAt = new Date(Date.now() - index * 9 * 24 * 60 * 60 * 1000).toISOString();

  const sections = seed.customSections ?? buildSections(seed, id);
  const lessonCount = sections.reduce((acc, sec) => acc + sec.lessons.length, 0);
  const moduleCount = sections.length;

  return {
    id,
    title: seed.title,
    subtitle: seed.subtitle,
    slug: slugify(seed.title),
    shortDescription: seed.shortDescription,
    description: seed.description,
    thumbnailKey: null,
    thumbnailUrl: seed.thumbnailUrl ?? null,
    presenterName: instructor.name,
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
    accessType,
    price: seed.priceUsd.toFixed(2),
    discountPrice: seed.discountUsd !== undefined ? seed.discountUsd.toFixed(2) : null,
    currency: 'ETB',
    difficulty: seed.difficulty,
    estimatedDurationMinutes: seed.durationMinutes,
    certificateEnabled: seed.certificateEnabled,
    featured: Boolean(seed.featured),
    publishedAt,
    rating: seed.rating,
    studentsCount: seed.studentsCount,
    language: seed.language,
    tags: seed.tags,
    outcomes: seed.outcomes,
    requirements: seed.requirements,
    sections,
    lessonCount,
    moduleCount,
  };
}

export const MOCK_COURSE_RECORDS: MockCourseRecord[] = COURSE_SEEDS.map((seed, index) =>
  buildRecord(seed, index),
);

export function toCourseSummary(record: MockCourseRecord): CourseSummary {
  return {
    id: record.id,
    title: record.title,
    subtitle: record.subtitle,
    slug: record.slug,
    shortDescription: record.shortDescription,
    thumbnailKey: record.thumbnailKey,
    thumbnailUrl: record.thumbnailUrl,
    presenterName: record.presenterName,
    categoryId: record.categoryId,
    categoryName: record.categoryName,
    categorySlug: record.categorySlug,
    accessType: record.accessType,
    price: record.price,
    discountPrice: record.discountPrice,
    currency: record.currency,
    difficulty: record.difficulty,
    estimatedDurationMinutes: record.estimatedDurationMinutes,
    certificateEnabled: record.certificateEnabled,
    featured: record.featured,
    publishedAt: record.publishedAt,
    rating: record.rating,
    studentsCount: record.studentsCount,
    language: record.language,
    tags: record.tags,
    lessonCount: record.lessonCount,
    moduleCount: record.moduleCount,
  };
}

export function toCourseDetail(record: MockCourseRecord): CourseDetail {
  return {
    id: record.id,
    title: record.title,
    subtitle: record.subtitle,
    slug: record.slug,
    shortDescription: record.shortDescription,
    description: record.description,
    presenterName: record.presenterName,
    thumbnailKey: record.thumbnailKey,
    thumbnailUrl: record.thumbnailUrl,
    accessType: record.accessType,
    price: record.price,
    discountPrice: record.discountPrice,
    currency: record.currency,
    difficulty: record.difficulty,
    estimatedDurationMinutes: record.estimatedDurationMinutes,
    certificateEnabled: record.certificateEnabled,
    publishedAt: record.publishedAt,
    outcomes: record.outcomes,
    requirements: record.requirements,
    sections: record.sections,
    rating: record.rating,
    studentsCount: record.studentsCount,
    language: record.language,
    tags: record.tags,
    categoryId: record.categoryId,
    categoryName: record.categoryName,
    categorySlug: record.categorySlug,
  };
}
