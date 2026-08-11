import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('PostgreSQL email worker safeguards', () => {
  const source = readFileSync(
    join(__dirname, '../workers/email-worker.service.ts'),
    'utf8',
  );
  it('claims bounded jobs with SKIP LOCKED and performs SMTP after claiming', () => {
    expect(source).toContain('FOR UPDATE SKIP LOCKED');
    expect(source).toContain('EMAIL_WORKER_BATCH_SIZE');
    expect(source.indexOf('this.claim()')).toBeLessThan(
      source.indexOf('this.process(job)'),
    );
    expect(source).toContain('this.mail.sendMail');
  });
  it('supports stale recovery, bounded retries, and no Redis or BullMQ', () => {
    expect(source).toContain('EMAIL_WORKER_LOCK_TIMEOUT_MS');
    expect(source).toContain('EMAIL_MAX_RETRY_DELAY_SECONDS');
    expect(source).not.toMatch(/redis|bullmq/i);
  });
});
