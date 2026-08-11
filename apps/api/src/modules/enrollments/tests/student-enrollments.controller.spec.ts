import { StudentEnrollmentsController } from '../controllers/student-enrollments.controller';

describe('StudentEnrollmentsController', () => {
  const enrollments = {
    create: jest.fn(),
    mine: jest.fn(),
    mineByCourse: jest.fn(),
    mineById: jest.fn(),
  };
  const controller = new StudentEnrollmentsController(enrollments as never);
  const user = { id: 'student-1', roles: ['STUDENT'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('creates an enrollment with an optional redemptionId', () => {
    controller.create(user, {
      courseId: 'course-1',
      redemptionId: 'redemption-1',
    });
    expect(enrollments.create).toHaveBeenCalledWith(
      user,
      'course-1',
      'redemption-1',
    );
  });

  it('creates an enrollment without a redemption', () => {
    controller.create(user, { courseId: 'course-1' });
    expect(enrollments.create).toHaveBeenCalledWith(
      user,
      'course-1',
      undefined,
    );
  });

  it('lists the caller’s own enrollments', () => {
    controller.list(user, {} as never);
    expect(enrollments.mine).toHaveBeenCalledWith('student-1', {});
  });

  it('checks enrollment state scoped to the caller for one course', () => {
    controller.byCourse(user, 'course-1');
    expect(enrollments.mineByCourse).toHaveBeenCalledWith(
      'student-1',
      'course-1',
    );
  });

  it('gets one owned enrollment scoped to the caller', () => {
    controller.detail(user, 'enrollment-1');
    expect(enrollments.mineById).toHaveBeenCalledWith(
      'student-1',
      'enrollment-1',
    );
  });
});
