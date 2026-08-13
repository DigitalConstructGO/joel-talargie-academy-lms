import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApiExceptionFilter } from '../../../common/filters/api-exception.filter';
import { ApiResponseInterceptor } from '../../../common/api/api-response.interceptor';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { StudentPromotionsController } from '../controllers/student-promotions.controller';
import { RedemptionService } from '../services/redemption.service';

/**
 * Boots the real controller + real ValidationPipe with a stub user attached
 * per test and a role check reading the same ROLES_KEY metadata @Roles()
 * sets, plus a mocked RedemptionService. Exercises the actual HTTP wiring
 * (DTO validation, RBAC decorator enforcement, response envelope, status
 * codes) without a live database. Auth-attach and role-check are combined
 * into one instance-level guard (registered via app.useGlobalGuards) to
 * avoid ordering ambiguity between APP_GUARD providers and instance guards.
 */
const reflector = new Reflector();

function stubGuard(user: { id: string; roles: string[] }): CanActivate {
  return {
    canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();
      request.user = user;
      const required = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (!required?.length) return true;
      return required.some((role) => user.roles.includes(role));
    },
  };
}

describe('StudentPromotionsController (integration)', () => {
  let app: INestApplication;
  const redemptionService = {
    validate: jest.fn(),
    redeem: jest.fn(),
    history: jest.fn(),
  };

  async function boot(user: { id: string; roles: string[] }) {
    const moduleRef = await Test.createTestingModule({
      controllers: [StudentPromotionsController],
      providers: [{ provide: RedemptionService, useValue: redemptionService }],
    }).compile();
    const application = moduleRef.createNestApplication();
    application.useGlobalGuards(stubGuard(user));
    application.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    application.useGlobalFilters(new ApiExceptionFilter(false));
    application.useGlobalInterceptors(new ApiResponseInterceptor());
    await application.init();
    return application;
  }

  afterEach(async () => {
    jest.clearAllMocks();
    await app?.close();
  });

  it('allows a STUDENT to validate a coupon and wraps the response in the API envelope', async () => {
    app = await boot({ id: 'student-1', roles: ['STUDENT'] });
    redemptionService.validate.mockResolvedValue({
      valid: true,
      pricing: { finalPrice: 80 },
    });
    const response = await request(app.getHttpServer())
      .post('/promotions/validate')
      .send({
        courseId: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
        code: 'SAVE20',
      })
      .expect(200);
    expect(response.body.data).toMatchObject({ valid: true });
    expect(response.body.error).toBeNull();
  });

  it('rejects a non-STUDENT with 403 (RBAC enforcement)', async () => {
    app = await boot({ id: 'admin-1', roles: ['ADMINISTRATOR'] });
    await request(app.getHttpServer())
      .post('/promotions/validate')
      .send({ courseId: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
      .expect(403);
    expect(redemptionService.validate).not.toHaveBeenCalled();
  });

  it('rejects an invalid courseId with 400 before reaching the service (DTO validation)', async () => {
    app = await boot({ id: 'student-1', roles: ['STUDENT'] });
    const response = await request(app.getHttpServer())
      .post('/promotions/validate')
      .send({ courseId: 'not-a-uuid' })
      .expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(redemptionService.validate).not.toHaveBeenCalled();
  });

  it('rejects an unknown extra field (whitelist DTO validation)', async () => {
    app = await boot({ id: 'student-1', roles: ['STUDENT'] });
    await request(app.getHttpServer())
      .post('/promotions/validate')
      .send({
        courseId: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
        notAllowed: 'x',
      })
      .expect(400);
  });

  it('returns 422 with the reason code when redeeming an invalid coupon', async () => {
    app = await boot({ id: 'student-1', roles: ['STUDENT'] });
    redemptionService.redeem.mockRejectedValue(
      new UnprocessableEntityException({
        code: 'COUPON_EXPIRED',
        message: 'This coupon has expired',
      }),
    );
    const response = await request(app.getHttpServer())
      .post('/promotions/redeem')
      .send({ courseId: 'd290f1ee-6c54-4b01-90e6-d701748f0851', code: 'OLD10' })
      .expect(422);
    expect(response.body.error.code).toBe('COUPON_EXPIRED');
  });

  it('lists redemption history scoped to the requesting student', async () => {
    app = await boot({ id: 'student-1', roles: ['STUDENT'] });
    redemptionService.history.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    await request(app.getHttpServer()).get('/promotions/history').expect(200);
    expect(redemptionService.history).toHaveBeenCalledWith(
      'student-1',
      expect.any(Object),
    );
  });
});
