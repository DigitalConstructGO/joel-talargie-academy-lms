import { AdminLearningController } from '../controllers/admin-learning.controller';

describe('AdminLearningController', () => {
  const learning = { adminProgress: jest.fn(), adminActivity: jest.fn() };
  const controller = new AdminLearningController(learning as never);

  beforeEach(() => jest.clearAllMocks());

  it('gets a student’s progress summary', () => {
    controller.progress('enrollment-1');
    expect(learning.adminProgress).toHaveBeenCalledWith('enrollment-1');
  });

  it('gets learning activity history', () => {
    controller.activity('enrollment-1', {} as never);
    expect(learning.adminActivity).toHaveBeenCalledWith('enrollment-1', {});
  });
});
