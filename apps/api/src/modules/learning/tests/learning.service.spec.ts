import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LearningService } from '../services/learning.service';

describe('LearningService', () => {
  const repository = {
    access: jest.fn(),
    curriculum: jest.fn(),
    lesson: jest.fn(),
    resources: jest.fn(),
    start: jest.fn(),
    open: jest.fn(),
    position: jest.fn(),
    complete: jest.fn(),
    findLessonProgress: jest.fn(),
    adminProgress: jest.fn(),
    activity: jest.fn(),
  };
  const notifications = { notify: jest.fn().mockResolvedValue(null) };
  const certificates = {
    request: jest.fn().mockResolvedValue({ certificate: { id: 'cert-1' } }),
  };
  const certificateWorker = { tick: jest.fn().mockResolvedValue(1) };
  const storage = {
    getSignedUrl: jest
      .fn()
      .mockResolvedValue('https://signed.download/resource'),
  };
  const service = new LearningService(
    repository as never,
    notifications as never,
    certificates as never,
    certificateWorker as never,
    storage as never,
  );
  const student = {
    id: 'student',
    roles: ['STUDENT'],
    emailVerified: true,
  } as never;
  const access = {
    id: 'enrollment',
    studentId: 'student',
    courseId: 'course',
    status: 'IN_PROGRESS',
    progressPercentage: 50,
    lastLessonId: 'lesson-2',
    startedAt: new Date(),
    completedAt: null,
    userStatus: 'ACTIVE',
    emailVerified: true,
    courseTitle: 'Secure Learning',
    courseSlug: 'secure-learning',
    certificateEnabled: true,
    courseArchivedAt: null,
    hasStudentRole: true,
  };
  const lesson = {
    id: 'lesson-2',
    courseId: 'course',
    sectionId: 'section',
    title: 'Lesson Two',
    lessonType: 'VIDEO',
    content: null,
    videoUrl: 'https://video.example/lesson',
    externalUrl: null,
    durationSeconds: 600,
    isMandatory: true,
    isPreview: false,
    isPublished: true,
    archivedAt: null,
    sectionCourseId: 'course',
    sectionArchivedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.access.mockResolvedValue(access);
    repository.lesson.mockResolvedValue(lesson);
    repository.resources.mockResolvedValue([]);
  });

  it.each([
    ['PENDING_PAYMENT', 'PAYMENT_REQUIRED'],
    ['WAITING_APPROVAL', 'PAYMENT_REVIEW_PENDING'],
    ['CANCELLED', 'ENROLLMENT_CANCELLED'],
    ['ACCESS_REVOKED', 'ENROLLMENT_ACCESS_REVOKED'],
  ])('denies learning for %s', async (status, code) => {
    repository.access.mockResolvedValueOnce({ ...access, status });
    await expect(service.overview(student, 'enrollment')).rejects.toMatchObject(
      {
        response: expect.objectContaining({ code }),
      },
    );
  });

  it('preserves completed enrollment review access', async () => {
    repository.access.mockResolvedValueOnce({
      ...access,
      status: 'COMPLETED',
      progressPercentage: 100,
    });
    repository.curriculum.mockResolvedValueOnce([]);
    await expect(
      service.overview(student, 'enrollment'),
    ).resolves.toMatchObject({
      reviewAccess: true,
      enrollmentStatus: 'COMPLETED',
    });
  });

  it('calculates mandatory and optional progress and recommends required work first', async () => {
    repository.curriculum.mockResolvedValueOnce([
      row('required-complete', true, 'COMPLETED', 0),
      row('optional-open', false, 'IN_PROGRESS', 1),
      row('required-next', true, null, 2),
    ]);
    await expect(
      service.overview(student, 'enrollment'),
    ).resolves.toMatchObject({
      mandatoryLessonCount: 2,
      completedMandatoryLessonCount: 1,
      optionalLessonCount: 1,
      nextRecommendedLesson: { id: 'required-next' },
      curriculum: [{ progressPercentage: 50 }],
    });
  });

  it('selects an accessible incomplete last lesson for resume', async () => {
    repository.curriculum.mockResolvedValueOnce([
      row('lesson-1', true, 'COMPLETED', 0),
      row('lesson-2', true, 'IN_PROGRESS', 1),
    ]);
    await expect(service.resume(student, 'enrollment')).resolves.toMatchObject({
      lessonId: 'lesson-2',
      courseCompleted: false,
    });
  });

  it('validates video type and duration before a position write', async () => {
    repository.lesson.mockResolvedValueOnce({ ...lesson, lessonType: 'TEXT' });
    await expect(
      service.position(student, 'enrollment', 'lesson-2', 1),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    repository.lesson.mockResolvedValueOnce(lesson);
    await expect(
      service.position(student, 'enrollment', 'lesson-2', 601),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repository.position).not.toHaveBeenCalled();
  });

  it('rejects a caller without the Student role', async () => {
    await expect(
      service.overview(
        { id: 'user', roles: [], emailVerified: true } as never,
        'enrollment',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.access).not.toHaveBeenCalled();
  });
});

function row(
  id: string,
  mandatory: boolean,
  status: string | null,
  position: number,
) {
  return {
    sectionId: 'section',
    sectionTitle: 'Section',
    sectionDescription: null,
    sectionPosition: 0,
    lessonId: id,
    lessonTitle: id,
    lessonType: 'VIDEO',
    durationSeconds: 600,
    lessonPosition: position,
    isMandatory: mandatory,
    isPreview: false,
    progressStatus: status,
    firstOpenedAt: null,
    lastViewedAt: status === 'IN_PROGRESS' ? new Date() : null,
    completedAt: status === 'COMPLETED' ? new Date() : null,
    savedPositionSeconds: 0,
  };
}
