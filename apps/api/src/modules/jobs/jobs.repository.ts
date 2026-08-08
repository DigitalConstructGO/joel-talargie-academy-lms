import { Injectable } from '@nestjs/common';
import {
  insertBackgroundJob,
  updateBackgroundJobStatus,
} from '@joel-academy/database';
import { DatabaseService } from '../../common/database/database.service';
import type { EnqueueJobInput } from './jobs.types';

@Injectable()
export class JobsRepository {
  constructor(private readonly database: DatabaseService) {}
  async enqueue(input: EnqueueJobInput): Promise<string> {
    return insertBackgroundJob(this.database.client, input);
  }
  async setStatus(
    id: string,
    status: 'PENDING' | 'COMPLETED' | 'FAILED',
  ): Promise<boolean> {
    return updateBackgroundJobStatus(this.database.client, id, status);
  }
}
