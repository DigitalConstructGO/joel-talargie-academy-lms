import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
describe('API (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.API_PORT = '4000';
    process.env.WEB_URL = 'http://localhost:3000';
    process.env.BCRYPT_SALT_ROUNDS = '10';
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new ApiExceptionFilter(false));
    await app.init();
  });
  afterAll(() => app.close());
  it('GET /api/v1/health uses the response contract', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(result.body.data.status).toBe('ok');
    expect(result.body.error).toBeNull();
  });
  it('GET /api/v1/health/database returns a sanitized status', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/v1/health/database')
      .expect(200);
    expect(result.body.data.status).toBe('not-configured');
    expect(JSON.stringify(result.body)).not.toContain('DATABASE_URL');
  });
  it('GET /api/v1/health/storage reports the local storage backend', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/v1/health/storage')
      .expect(200);
    expect(result.body.data.status).toBe('available');
  });
  it('GET /api/v1/health/live answers without checking any dependency', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200);
    expect(result.body.data.status).toBe('alive');
  });
  it('GET /api/v1/health/ready returns 503 when the database is not configured', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(503);
    expect(result.body.error).toEqual(
      expect.objectContaining({ code: 'SERVICE_NOT_READY' }),
    );
  });
  it('formats global errors', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/v1/missing')
      .expect(404);
    expect(result.body).toEqual(
      expect.objectContaining({
        data: null,
        meta: expect.any(Object),
        error: expect.objectContaining({ code: 'HTTP_404', details: [] }),
      }),
    );
  });
});
