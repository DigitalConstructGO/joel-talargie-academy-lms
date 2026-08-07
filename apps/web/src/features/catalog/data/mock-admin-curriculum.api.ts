import {
  findMockCourse,
  findMockCourseByLessonId,
  findMockCourseBySectionId,
  findMockCourseByResourceId,
} from './mock-admin-courses.api';
import type {
  CreateLessonInput,
  CreateResourceInput,
  CreateSectionInput,
  ReorderItem,
  UpdateLessonInput,
  UpdateResourceInput,
  UpdateSectionInput,
} from '../types/admin-curriculum.types';

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { response?: { status: number } };
  error.response = { status: 404 };
  throw error;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function findLesson(lessonId: string) {
  const course = findMockCourseByLessonId(lessonId);
  for (const section of course.sections) {
    const lesson = section.lessons.find((entry) => entry.id === lessonId);
    if (lesson) return { course, section, lesson };
  }
  notFound('Lesson not found');
}

export const mockAdminCurriculumApi = {
  createSection: async (courseId: string, input: CreateSectionInput) => {
    const course = findMockCourse(courseId);
    const section = {
      id: `section-${Date.now()}`,
      courseId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      position: input.sortOrder ?? course.sections.length,
      lessons: [],
    };
    course.sections = [...course.sections, section];
    return delay(section);
  },

  updateSection: async (sectionId: string, input: UpdateSectionInput) => {
    const course = findMockCourseBySectionId(sectionId);
    const section = course.sections.find((entry) => entry.id === sectionId);
    if (!section) notFound('Section not found');
    if (input.title !== undefined) section.title = input.title;
    if (input.description !== undefined) section.description = input.description;
    return delay(section);
  },

  archiveSection: async (sectionId: string) => {
    const course = findMockCourseBySectionId(sectionId);
    course.sections = course.sections.filter((entry) => entry.id !== sectionId);
    return delay(undefined);
  },

  reorderSections: async (courseId: string, items: ReorderItem[]) => {
    const course = findMockCourse(courseId);
    for (const item of items) {
      const section = course.sections.find((entry) => entry.id === item.id);
      if (section) section.position = item.sortOrder;
    }
    course.sections = [...course.sections].sort((a, b) => a.position - b.position);
    return delay(undefined);
  },

  createLesson: async (sectionId: string, input: CreateLessonInput) => {
    const course = findMockCourseBySectionId(sectionId);
    const section = course.sections.find((entry) => entry.id === sectionId);
    if (!section) notFound('Section not found');
    const lesson = {
      id: `lesson-${Date.now()}`,
      courseId: course.id,
      sectionId,
      title: input.title.trim(),
      slug: input.slug?.trim() || slugify(input.title),
      lessonType: input.lessonType,
      content: input.content ?? null,
      videoUrl: input.videoUrl ?? null,
      externalUrl: input.externalUrl ?? null,
      durationSeconds: input.durationSeconds ?? null,
      isMandatory: input.isMandatory ?? true,
      isPreview: input.isPreview ?? false,
      publishedAt: null,
      position: input.sortOrder ?? section.lessons.length,
      resources: [],
    };
    section.lessons = [...section.lessons, lesson];
    return delay(lesson);
  },

  updateLesson: async (lessonId: string, input: UpdateLessonInput) => {
    const { lesson } = findLesson(lessonId);
    Object.assign(lesson, input);
    return delay(lesson);
  },

  moveLesson: async (lessonId: string, targetSectionId: string, sortOrder?: number) => {
    const { course, section: sourceSection, lesson } = findLesson(lessonId);
    const targetSection = course.sections.find((entry) => entry.id === targetSectionId);
    if (!targetSection) notFound('Target section not found');
    sourceSection.lessons = sourceSection.lessons.filter((entry) => entry.id !== lessonId);
    lesson.sectionId = targetSectionId;
    lesson.position = sortOrder ?? targetSection.lessons.length;
    targetSection.lessons = [...targetSection.lessons, lesson];
    return delay(lesson);
  },

  reorderLessons: async (sectionId: string, items: ReorderItem[]) => {
    const course = findMockCourseBySectionId(sectionId);
    const section = course.sections.find((entry) => entry.id === sectionId);
    if (!section) notFound('Section not found');
    for (const item of items) {
      const lesson = section.lessons.find((entry) => entry.id === item.id);
      if (lesson) lesson.position = item.sortOrder;
    }
    section.lessons = [...section.lessons].sort((a, b) => a.position - b.position);
    return delay(undefined);
  },

  publishLesson: async (lessonId: string) => {
    const { lesson } = findLesson(lessonId);
    lesson.publishedAt = new Date().toISOString();
    return delay(lesson);
  },

  unpublishLesson: async (lessonId: string) => {
    const { lesson } = findLesson(lessonId);
    lesson.publishedAt = null;
    return delay(lesson);
  },

  previewLesson: async (lessonId: string, isPreview: boolean) => {
    const { lesson } = findLesson(lessonId);
    lesson.isPreview = isPreview;
    return delay(lesson);
  },

  archiveLesson: async (lessonId: string) => {
    const { section, lesson } = findLesson(lessonId);
    section.lessons = section.lessons.filter((entry) => entry.id !== lesson.id);
    return delay(undefined);
  },

  createResource: async (lessonId: string, input: CreateResourceInput) => {
    const { lesson } = findLesson(lessonId);
    const resource = {
      id: `resource-${Date.now()}`,
      title: input.title.trim(),
      storageKey: input.storageKey ?? null,
      externalUrl: input.externalUrl ?? null,
      originalFileName: input.originalFileName ?? null,
      mimeType: input.mimeType ?? null,
      fileSize: input.fileSize ?? null,
      visibility: input.visibility,
      sortOrder: input.sortOrder ?? lesson.resources.length,
    };
    lesson.resources = [...lesson.resources, resource];
    return delay(resource);
  },

  updateResource: async (resourceId: string, input: UpdateResourceInput) => {
    const course = findMockCourseByResourceId(resourceId);
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        const resource = lesson.resources.find((entry) => entry.id === resourceId);
        if (resource) {
          Object.assign(resource, input);
          return delay(resource);
        }
      }
    }
    notFound('Resource not found');
  },

  deleteResource: async (resourceId: string) => {
    const course = findMockCourseByResourceId(resourceId);
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (lesson.resources.some((entry) => entry.id === resourceId)) {
          lesson.resources = lesson.resources.filter((entry) => entry.id !== resourceId);
          return delay(undefined);
        }
      }
    }
    notFound('Resource not found');
  },
};
