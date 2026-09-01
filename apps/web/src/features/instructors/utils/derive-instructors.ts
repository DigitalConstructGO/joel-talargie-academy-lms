import type { CourseSummary } from '@/features/catalog/types/catalog.types';
import type { Instructor } from '../types/instructor.types';
import { MOCK_INSTRUCTORS } from '../data/mock-instructors.data';

import { useAuthStore } from '@/stores';

export const DEFAULT_LEAD_INSTRUCTOR: Instructor = {
  id: 'instr-joel',
  slug: 'joel-talargie',
  name: 'Joel Talargie',
  title: 'Founder & Lead Technical Instructor',
  photoUrl: '/images/instructors/joel-talargie.png',
  bio: 'Software Engineer specializing in modern full-stack web development. Experienced in building scalable applications using React, Next.js, TypeScript, Node.js, NestJS, PostgreSQL, and MongoDB. Passionate about mentoring developers and teaching practical software development through real-world projects.',
  skills: ['Curriculum Design', 'Full-Stack Development', 'Team Leadership'],
  achievements: [
    'Over 10+ years of high-scale software engineering leadership',
    'Curriculum designed specifically for career placement & promotion',
    'Trained and certified thousands of engineers across the continent',
  ],
  courseCount: 0,
  courses: [],
};

export function deriveInstructors(
  courses: CourseSummary[],
  extraUsers: {
    name: string;
    title?: string;
    photoUrl?: string;
    avatarUrl?: string;
    bio?: string;
  }[] = [],
): Instructor[] {
  const byName = new Map<string, CourseSummary[]>();
  for (const course of courses) {
    const existing = byName.get(course.presenterName);
    if (existing) existing.push(course);
    else byName.set(course.presenterName, [course]);
  }

  for (const u of extraUsers) {
    if (u.name && !byName.has(u.name)) {
      byName.set(u.name, []);
    }
  }

  const derived: Instructor[] = Array.from(byName.entries()).map(([name, instructorCourses]) => {
    const isJoel = /joel\s*tal/i.test(name);
    const mockProfile = MOCK_INSTRUCTORS.find(
      (m) => m.name.toLowerCase() === name.toLowerCase() || (isJoel && /joel\s*tal/i.test(m.name)),
    );
    const extraUser = extraUsers.find(
      (u) =>
        u.name.toLowerCase() === name.toLowerCase() ||
        u.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(u.name.toLowerCase()),
    );

    const currentUser = typeof window !== 'undefined' ? useAuthStore.getState().user : null;
    const currentFullName = currentUser
      ? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ')
      : '';
    const isCurrentUser =
      Boolean(currentUser) &&
      Boolean(currentFullName) &&
      (currentFullName.toLowerCase() === name.toLowerCase() ||
        name.toLowerCase().includes(currentFullName.toLowerCase()));

    const resolvedPhoto = isJoel
      ? DEFAULT_LEAD_INSTRUCTOR.photoUrl
      : (mockProfile?.photoUrl ??
        (isCurrentUser ? currentUser?.avatarUrl : undefined) ??
        extraUser?.photoUrl ??
        extraUser?.avatarUrl ??
        undefined);

    return {
      id: isJoel ? DEFAULT_LEAD_INSTRUCTOR.id : `instr-${name.toLowerCase().replace(/\s+/g, '-')}`,
      slug: isJoel ? DEFAULT_LEAD_INSTRUCTOR.slug : name.toLowerCase().replace(/\s+/g, '-'),
      name: isJoel ? DEFAULT_LEAD_INSTRUCTOR.name : name,
      title: isJoel
        ? DEFAULT_LEAD_INSTRUCTOR.title
        : (mockProfile?.title ?? extraUser?.title ?? 'Academy Instructor'),
      photoUrl: resolvedPhoto,
      avatarUrl: resolvedPhoto,
      bio: isJoel ? DEFAULT_LEAD_INSTRUCTOR.bio : (mockProfile?.bio ?? extraUser?.bio),
      skills: isJoel ? DEFAULT_LEAD_INSTRUCTOR.skills : mockProfile?.skills,
      achievements: isJoel ? DEFAULT_LEAD_INSTRUCTOR.achievements : mockProfile?.achievements,
      courseCount: instructorCourses.length,
      courses: instructorCourses,
    };
  });

  const hasJoel = derived.some((inst) => /joel\s*tal/i.test(inst.name));
  if (!hasJoel) {
    const joelCourses = courses.filter((c) => /joel\s*tal/i.test(c.presenterName));
    derived.unshift({
      ...DEFAULT_LEAD_INSTRUCTOR,
      courseCount: joelCourses.length,
      courses: joelCourses,
    });
  }

  return derived;
}
