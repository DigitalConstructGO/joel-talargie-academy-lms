import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { RequestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  it('logs only safe request metadata after completion', () => {
    const log = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const response = Object.assign(new EventEmitter(), {
      statusCode: 200,
    }) as unknown as Response;
    const request = {
      method: 'POST',
      path: '/safe',
      ip: '127.0.0.1',
      correlationId: 'id-1',
    } as Request;
    const next = jest.fn() as NextFunction;
    new RequestLoggerMiddleware().use(request, response, next);
    response.emit('finish');
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('"correlationId":"id-1"'),
    );
    expect(log.mock.calls[0]?.[0]).not.toContain('password');
    log.mockRestore();
  });
});
