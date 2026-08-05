import { StudentLearningController } from '../controllers/student-learning.controller';

describe('StudentLearningController', () => {
  const learning = {
    start: jest.fn(),
    resume: jest.fn(),
    overview: jest.fn(),
    open: jest.fn(),
    lesson: jest.fn(),
    position: jest.fn(),
    complete: jest.fn(),
  };
  const controller = new StudentLearningController(learning as never);
  const user = { id: 'student-1', roles: ['STUDENT'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('starts an enrollment', () => {
    controller.start(user, 'enrollment-1');
    expect(learning.start).toHaveBeenCalledWith(user, 'enrollment-1');
  });

  it('resumes an enrollment', () => {
    controller.resume(user, 'enrollment-1');
    expect(learning.resume).toHaveBeenCalledWith(user, 'enrollment-1');
  });

  it('gets the curriculum overview', () => {
    controller.overview(user, 'enrollment-1');
    expect(learning.overview).toHaveBeenCalledWith(user, 'enrollment-1');
  });

  it('opens a lesson', () => {
    controller.open(user, 'enrollment-1', 'lesson-1');
    expect(learning.open).toHaveBeenCalledWith(
      user,
      'enrollment-1',
      'lesson-1',
    );
  });

  it('gets lesson content', () => {
    controller.lesson(user, 'enrollment-1', 'lesson-1');
    expect(learning.lesson).toHaveBeenCalledWith(
      user,
      'enrollment-1',
      'lesson-1',
    );
  });

  it('saves video playback position, extracting positionSeconds from the DTO', () => {
    controller.position(user, 'enrollment-1', 'lesson-1', {
      positionSeconds: 42,
    });
    expect(learning.position).toHaveBeenCalledWith(
      user,
      'enrollment-1',
      'lesson-1',
      42,
    );
  });

  it('completes a lesson', () => {
    controller.complete(user, 'enrollment-1', 'lesson-1');
    expect(learning.complete).toHaveBeenCalledWith(
      user,
      'enrollment-1',
      'lesson-1',
    );
  });
});
