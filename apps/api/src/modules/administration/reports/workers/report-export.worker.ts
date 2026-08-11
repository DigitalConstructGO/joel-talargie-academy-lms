import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { AppModule } from '../../../../app.module';
import { ReportExportProcessor } from './report-export.processor';
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const processor = app.get(ReportExportProcessor);
  const workerId = `report-${randomUUID()}`;
  const stop = async () => {
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  for (;;) {
    await processor.expire();
    const worked = await processor.processOne(workerId);
    await new Promise((resolve) => setTimeout(resolve, worked ? 100 : 2000));
  }
}
void main();
