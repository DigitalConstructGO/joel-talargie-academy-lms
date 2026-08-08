import type { CourseSummary } from '@/features/catalog/types/catalog.types';

export interface Instructor {
  name: string;
  courseCount: number;
  courses: CourseSummary[];
}

export interface InstructorSocials {
  linkedin?: string;
  github?: string;
  website?: string;
}

/**
 * Rich instructor profile used only by the mock/demo catalog data source -
 * the live backend has no instructor entity (courses only carry a
 * free-text `presenterName`), so this shape never comes from a real API.
 */
export interface InstructorProfile {
  id: string;
  slug: string;
  name: string;
  title: string;
  avatarColor: string;
  /** Real, rights-cleared photo path (e.g. under /public). Falls back to an initials avatar when unset. */
  photoUrl?: string;
  bio: string;
  skills: string[];
  yearsExperience: number;
  socials: InstructorSocials;
  achievements: string[];
  studentsCount: number;
  rating: number;
}
