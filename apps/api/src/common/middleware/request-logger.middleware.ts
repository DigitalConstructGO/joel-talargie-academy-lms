import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HttpRequest');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    response.once('finish', () => {
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
