import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

// Load balancers and uptime monitors poll these every few seconds; logging
// every successful ping at `log` level drowns out real request traffic.
// Failures still log (see below) since a flapping health check is exactly
// the kind of thing operators need to see.
const HEALTH_CHECK_PATH = /\/health(?:\/|$)/;

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HttpRequest');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    response.once('finish', () => {
      if (HEALTH_CHECK_PATH.test(request.path) && response.statusCode < 400)
        return;
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      this.logger.log(
        JSON.stringify({
          method: request.method,
          path: request.path,
          status: response.statusCode,
          durationMs: Number(durationMs.toFixed(2)),
          ip: request.ip,
          correlationId: request.correlationId,
          userId: request.authenticatedUserId,
          timestamp: new Date().toISOString(),
        }),
      );
    });
    next();
  }
}
