import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HealthResponse } from '@joel-academy/contracts';
@Injectable()
export class HealthService {
  constructor(private readonly config: ConfigService) {}
  getHealth(): HealthResponse {
    return {
      data: {
        service: 'joel-talargie-academy-api',
        status: 'ok',
        environment: this.config.get<'development' | 'test' | 'production'>(
          'NODE_ENV',
          'development',
        ),
        version: '0.1.0',
        timestamp: new Date().toISOString(),
      },
      meta: {},
      error: null,
    };
  }
}
