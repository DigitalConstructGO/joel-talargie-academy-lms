import {
  insertBackgroundJob,
  updateBackgroundJobStatus,
} from '@joel-academy/database';
import { JobsRepository } from '../jobs.repository';

describe('JobsRepository', () => {
  const database = { client: {} };
  const repository = new JobsRepository(database as never);

  beforeEach(() => jest.clearAllMocks());

  it('enqueues a job through the database client', async () => {
    (insertBackgroundJob as jest.Mock).mockResolvedValueOnce('job-1');
    const input = { type: 'SEND_EMAIL', payload: {} } as never;
    const result = await repository.enqueue(input);
    expect(insertBackgroundJob).toHaveBeenCalledWith(database.client, input);
    expect(result).toBe('job-1');
  });

  it('updates a job status through the database client', async () => {
    (updateBackgroundJobStatus as jest.Mock).mockResolvedValueOnce(true);
    const result = await repository.setStatus('job-1', 'COMPLETED');
    expect(updateBackgroundJobStatus).toHaveBeenCalledWith(
      database.client,
      'job-1',
      'COMPLETED',
    );
    expect(result).toBe(true);
  });
});
