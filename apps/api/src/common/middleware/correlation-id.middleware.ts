import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
export class CorrelationIdMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const id =
      typeof request.headers['x-correlation-id'] === 'string'
        ? request.headers['x-correlation-id']
        : randomUUID();
    request.headers['x-correlation-id'] = id;
    response.setHeader('x-correlation-id', id);
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'http_request',
        method: request.method,
        path: request.path,
        correlationId: id,
        timestamp: new Date().toISOString(),
      }),
    );
    next();
  }
}
