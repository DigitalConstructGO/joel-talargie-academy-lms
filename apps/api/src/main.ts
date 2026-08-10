import 'reflect-metadata';
import {
  ClassSerializerInterceptor,
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
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { ApiResponseInterceptor } from './common/api/api-response.interceptor';
import {
  API_DOCUMENT_VERSION,
  API_PREFIX,
  API_VERSION,
} from './common/constants/api.constants';
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
  app.use(
    helmet({
      contentSecurityPolicy: {
        // Same split-origin case CORS handles below: the API and web app
        // run on different origins (e.g. :4000/:3000 in local dev), so the
        // default `frame-ancestors: 'self'` would block the web app from
        // embedding API-served content in an iframe (e.g. the certificate
        // preview streamed from `storage/files/:token`). Add WEB_URL as the
        // one legitimate frame-ancestor rather than disabling the directive.
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'frame-ancestors': ["'self'", webUrl],
        },
      },
    }),
    compression(),
    cookieParser(),
    correlationMiddleware.use.bind(correlationMiddleware),
    requestLoggerMiddleware.use.bind(requestLoggerMiddleware),
  );
  app.enableCors({
    origin: webUrl,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
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

  const port = Number(
    process.env.PORT ?? config.get<number>('API_PORT') ?? 4000,
  );
  await app.listen(port);
}
void bootstrap();
