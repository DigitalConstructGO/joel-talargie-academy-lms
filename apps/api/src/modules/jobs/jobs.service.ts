import { Injectable } from '@nestjs/common';
import { JobsRepository } from './jobs.repository';
import type { EnqueueJobInput } from './jobs.types';
@Injectable()
export class JobsService {
  constructor(private readonly repository: JobsRepository) {}
  enqueue(input: EnqueueJobInput) {
    return this.repository.enqueue(input);
  }
  cancel(id: string) {
    return this.repository.setStatus(id, 'FAILED');
  }
  retry(id: string) {
    return this.repository.setStatus(id, 'PENDING');
  }
  markCompleted(id: string) {
    return this.repository.setStatus(id, 'COMPLETED');
  }
}
