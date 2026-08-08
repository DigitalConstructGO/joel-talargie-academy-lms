import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
export class CorrelationIdMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const id =
      typeof request.headers['x-correlation-id'] === 'string'
        ? request.headers['x-correlation-id']
        : randomUUID();
    request.headers['x-correlation-id'] = id;
    request.correlationId = id;
    response.setHeader('x-correlation-id', id);
    next();
  }
}
