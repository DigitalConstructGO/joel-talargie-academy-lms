import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { CertificateWorkerService } from './certificate-worker.service';

async function bootstrap() {
  const application = await NestFactory.createApplicationContext(AppModule, {
    abortOnError: false,
    logger: ['log', 'warn', 'error'],
  });
  const worker = application.get(CertificateWorkerService);
  if (process.env.CERTIFICATE_WORKER_ENABLED !== 'true') {
    await application.close();
    return;
  }
  const poll = Number(process.env.CERTIFICATE_WORKER_POLL_MS ?? 5000);
  const run = async () => worker.tick().catch(() => 0);
  await run();
  setInterval(run, Math.max(poll, 1000)).unref();
}

void bootstrap();
