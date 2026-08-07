export const learningKeys = {
  all: ['learning'] as const,
  overview: (enrollmentId: string) => [...learningKeys.all, 'overview', enrollmentId] as const,
  lesson: (enrollmentId: string, lessonId: string) =>
    [...learningKeys.all, 'lesson', enrollmentId, lessonId] as const,
  resume: (enrollmentId: string) => [...learningKeys.all, 'resume', enrollmentId] as const,
};
