export interface EnqueueJobInput {
  jobType: string;
  payload: Record<string, unknown>;
  priority?: number;
  scheduledAt?: Date;
}
