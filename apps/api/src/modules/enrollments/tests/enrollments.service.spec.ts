import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentsService } from '../services/enrollments.service';

describe('EnrollmentsService', () => {
  const repository = {
    create: jest.fn(),
    listMine: jest.fn(),
    studentEnrollment: jest.fn(),
    studentCourse: jest.fn(),
    listAdmin: jest.fn(),
    adminEnrollment: jest.fn(),
    transition: jest.fn(),
    activity: jest.fn(),
  };
  const service = new EnrollmentsService(repository as never);
  const student = {
    id: 'student-id',
    roles: ['STUDENT'],
    emailVerified: true,
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns an existing paid enrollment idempotently with its next action', async () => {
    repository.create.mockResolvedValue({
      created: false,
      enrollment: { id: 'enrollment-id', status: 'PENDING_PAYMENT' },
    });
    await expect(
      service.create(student as never, 'course-id'),
    ).resolves.toMatchObject({
      created: false,
      enrollment: { nextAction: 'SUBMIT_PAYMENT', hasLearningAccess: false },
    });
  });

  it('presents a free enrollment with immediate learning access', async () => {
    repository.create.mockResolvedValue({
      created: true,
      enrollment: { id: 'enrollment-id', status: 'ENROLLED' },
    });
    await expect(
      service.create(student as never, 'course-id'),
    ).resolves.toMatchObject({
      created: true,
      enrollment: { nextAction: 'START_COURSE', hasLearningAccess: true },
    });
  });

  it('rejects a caller without the Student role before database access', async () => {
    await expect(
      service.create(
        { ...student, roles: ['ADMINISTRATOR'] } as never,
        'course-id',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects an unverified email before database access', async () => {
    await expect(
      service.create(
        { ...student, emailVerified: false } as never,
        'course-id',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('maps capacity and ownership-safe not-found failures', async () => {
    repository.create.mockRejectedValueOnce(
      new Error('COURSE_CAPACITY_REACHED'),
    );
    await expect(
      service.create(student as never, 'course-id'),
    ).rejects.toBeInstanceOf(ConflictException);
    repository.studentEnrollment.mockResolvedValueOnce(null);
    await expect(
      service.mineById('student-id', 'other-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not permit Phase 6 to invent status transitions', async () => {
    repository.transition.mockRejectedValue(
      new Error('ENROLLMENT_CANNOT_BE_REVOKED'),
    );
    await expect(
      service.revoke('admin-id', 'pending-id', 'Policy'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
