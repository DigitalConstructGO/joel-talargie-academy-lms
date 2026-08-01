import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HealthResponse } from '@joel-academy/contracts';
import {
  DatabaseService,
  type DatabaseConnectionStatus,
} from '../common/database/database.service';
@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService,
    private readonly database: DatabaseService,
  ) {}
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
  async getDatabaseHealth() {
    const status: DatabaseConnectionStatus =
      await this.database.checkConnection();
    return {
      data: { status, timestamp: new Date().toISOString(), version: '0.1.0' },
      meta: {},
      error: null,
    };
  }
}
