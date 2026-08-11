import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HealthResponse } from '@joel-academy/contracts';
import {
  DatabaseService,
  type DatabaseConnectionStatus,
} from '../common/database/database.service';
import { LocalStorageProvider } from '../modules/storage/providers/local-storage.provider';
@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService,
    private readonly database: DatabaseService,
    private readonly storage: LocalStorageProvider,
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
  async getStorageHealth() {
    const status = await this.storage.checkHealth();
    return {
      data: { status, timestamp: new Date().toISOString(), version: '0.1.0' },
      meta: {},
      error: null,
    };
  }
  /**
   * Liveness has no external dependencies on purpose: it answers "is the
   * process alive", not "is it working correctly". A DB blip must never
   * make an orchestrator kill and restart an otherwise-healthy pod - that's
   * what readiness (which does check dependencies) is for.
   */
  getLiveness() {
    return {
      data: { status: 'alive', timestamp: new Date().toISOString() },
      meta: {},
      error: null,
    };
  }
  /**
   * Readiness checks every dependency this instance needs to safely serve
   * traffic. Unlike /health and /health/database (which always answer 200
   * so operators can inspect status), this throws a 503 when anything is
   * unavailable, since that's the signal orchestrators/load balancers
   * actually act on to stop routing requests here.
   */
  async getReadiness() {
    const [database, storage] = await Promise.all([
      this.database.checkConnection(),
      this.storage.checkHealth(),
    ]);
    const ready = database === 'available' && storage === 'available';
    const data = { status: ready ? 'ready' : 'not-ready', database, storage };
    if (!ready)
      throw new ServiceUnavailableException({
        code: 'SERVICE_NOT_READY',
        message: 'Service is not ready to accept traffic',
        details: [data],
      });
    return {
      data: { ...data, timestamp: new Date().toISOString() },
      meta: {},
      error: null,
    };
  }
}
