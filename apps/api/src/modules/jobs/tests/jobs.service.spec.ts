import { JobsService } from '../jobs.service';

describe('JobsService', () => {
  const repository = { enqueue: jest.fn(), setStatus: jest.fn() };
  const service = new JobsService(repository as never);

  beforeEach(() => jest.clearAllMocks());

  it('enqueues a job through the repository', () => {
    const input = { type: 'SEND_EMAIL', payload: {} } as never;
    service.enqueue(input);
    expect(repository.enqueue).toHaveBeenCalledWith(input);
  });

  it('cancel sets status to FAILED', () => {
    service.cancel('job-1');
    expect(repository.setStatus).toHaveBeenCalledWith('job-1', 'FAILED');
  });

  it('retry sets status to PENDING', () => {
    service.retry('job-1');
    expect(repository.setStatus).toHaveBeenCalledWith('job-1', 'PENDING');
  });

  it('markCompleted sets status to COMPLETED', () => {
    service.markCompleted('job-1');
    expect(repository.setStatus).toHaveBeenCalledWith('job-1', 'COMPLETED');
  });
});
