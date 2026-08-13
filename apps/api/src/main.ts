import 'reflect-metadata';
import {
  ClassSerializerInterceptor,
  INestApplication,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { validationExceptionFactory } from './common/pipes/validation-exception-factory';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { ApiResponseInterceptor } from './common/api/api-response.interceptor';
import { EmailWorkerService } from './modules/notifications/workers/email-worker.service';
import {
  API_DOCUMENT_VERSION,
  API_PREFIX,
  API_VERSION,
} from './common/constants/api.constants';

// The email worker is normally a standalone process (`npm run worker:email`).
// Running it in-process here - gated by the same EMAIL_WORKER_ENABLED flag the
// standalone entry checks - makes queued emails actually send for a plain
// `npm run dev`/`npm run start`, without a second process. Concurrent workers
// are safe: delivery claim uses `FOR UPDATE SKIP LOCKED`, so a row is only
// ever processed by one of them.
function startEmailWorkerWhenEnabled(
  app: INestApplication,
  config: ConfigService,
): void {
  if (config.get<boolean>('EMAIL_WORKER_ENABLED') !== true) return;
  const worker = app.get(EmailWorkerService);
  const logger = new Logger('EmailWorker');
  const poll = Math.max(
    config.get<number>('EMAIL_WORKER_POLL_INTERVAL_MS') ?? 5000,
    1000,
  );
  let stopped = false;
  process.once('SIGTERM', () => {
    stopped = true;
  });
  process.once('SIGINT', () => {
    stopped = true;
  });
  logger.log(`Email worker started in-process (poll interval ${poll}ms)`);
  void (async () => {
    while (!stopped) {
      try {
        await worker.tick();
      } catch (error) {
        logger.error(
          `Email worker tick failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, poll));
    }
  })();
}

async function bootstrap() {
  process.env.TZ = 'UTC';
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_VERSION,
  });
  app
    .getHttpAdapter()
    .getInstance()
    .set('trust proxy', config.get<boolean>('TRUST_PROXY') ?? false);
  app.use(json({ limit: config.get<string>('BODY_LIMIT') ?? '1mb' }));
  const correlationMiddleware = new CorrelationIdMiddleware();
  const requestLoggerMiddleware = new RequestLoggerMiddleware();
  app.use(
    urlencoded({
      limit: config.get<string>('BODY_LIMIT') ?? '1mb',
      extended: true,
    }),
  );
  const webUrl = config.getOrThrow<string>('WEB_URL');
  // WEB_URL is the one canonical frontend origin (used to build absolute
  // links - OAuth redirects, storage URLs). CORS/CSP additionally allow any
  // extra origins from CORS_ADDITIONAL_ORIGINS (e.g. a Vercel deployment
  // used alongside local dev), since a browser request's Origin header can
  // legitimately be any of several known frontends, even though a
  // server-generated link can only point at one.
  const additionalOrigins = (
    config.get<string>('CORS_ADDITIONAL_ORIGINS') ?? ''
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = [...new Set([webUrl, ...additionalOrigins])];
  app.use(
    helmet({
      contentSecurityPolicy: {
        // Same split-origin case CORS handles below: the API and web app
        // run on different origins (e.g. :4000/:3000 in local dev), so the
        // default `frame-ancestors: 'self'` would block the web app from
        // embedding API-served content in an iframe (e.g. the certificate
        // preview streamed from `storage/files/:token`). Add the allowed
        // web origins as legitimate frame-ancestors rather than disabling
        // the directive.
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'frame-ancestors': ["'self'", ...allowedOrigins],
        },
      },
    }),
    compression(),
    cookieParser(),
    correlationMiddleware.use.bind(correlationMiddleware),
    requestLoggerMiddleware.use.bind(requestLoggerMiddleware),
  );
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(
    new ApiExceptionFilter(config.get('NODE_ENV') === 'production'),
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new ApiResponseInterceptor(),
  );
  app.enableShutdownHooks();
  // Publicly exposing the full API schema (every route, DTO shape, and
  // permission requirement) is unnecessary attack-surface in production -
  // keep Swagger available in development/test only.
  if (config.get('NODE_ENV') !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Joel Talargie Academy API')
        .setDescription('Versioned REST API for Joel Talargie Academy')
        .setVersion(API_DOCUMENT_VERSION)
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }
  await app.listen(config.get<number>('API_PORT') ?? 4000);
  startEmailWorkerWhenEnabled(app, config);
}
void bootstrap();
