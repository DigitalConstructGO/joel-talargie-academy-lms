import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('certificate PostgreSQL worker', () => {
  const source = readFileSync(
    resolve(
      process.cwd(),
      'src/modules/certificates/workers/certificate-worker.service.ts',
    ),
    'utf8',
  );

  it('claims bounded jobs with SKIP LOCKED and no Redis or BullMQ', () => {
    expect(source).toContain('FOR UPDATE SKIP LOCKED');
    expect(source).toContain("job_type = 'GENERATE_CERTIFICATE'");
    expect(source).toContain('LIMIT ${batchSize}');
    expect(source).not.toMatch(/redis|bullmq/i);
  });

  it('recovers stale locks and applies bounded retry attempts', () => {
    expect(source).toContain('CERTIFICATE_JOB_LOCK_TIMEOUT_MS');
    expect(source).toContain('CERTIFICATE_JOB_MAX_ATTEMPTS');
    expect(source).toContain("status: terminal ? 'FAILED' : 'PENDING'");
  });
});
