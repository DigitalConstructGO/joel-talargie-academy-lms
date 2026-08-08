import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { EmailWorkerService } from './email-worker.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    abortOnError: false,
    logger: ['log', 'warn', 'error'],
  });
  if (process.env.EMAIL_WORKER_ENABLED !== 'true') {
    await app.close();
    return;
  }
  const worker = app.get(EmailWorkerService);
  const poll = Math.max(
    Number(process.env.EMAIL_WORKER_POLL_INTERVAL_MS ?? 5000),
    1000,
  );
  let active = true;
  process.once('SIGTERM', () => {
    active = false;
    void app.close();
  });
  while (active) {
    await worker.tick().catch(() => 0);
    await new Promise((resolve) => setTimeout(resolve, poll));
  }
}
void bootstrap();
