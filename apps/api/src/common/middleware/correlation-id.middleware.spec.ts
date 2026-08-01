import type { NextFunction, Request, Response } from 'express';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  it('preserves a supplied ID and adds it to the response', () => {
    const request = {
      headers: { 'x-correlation-id': 'request-1' },
    } as unknown as Request;
    const response = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;
    new CorrelationIdMiddleware().use(request, response, next);
    expect(request.correlationId).toBe('request-1');
    expect(response.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      'request-1',
    );
    expect(next).toHaveBeenCalled();
  });
});
