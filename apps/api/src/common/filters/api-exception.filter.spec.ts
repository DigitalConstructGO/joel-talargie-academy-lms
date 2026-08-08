import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  type ArgumentsHost,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  function makeHost(request: Partial<Request> = {}) {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const response = { status } as unknown as Response;
    const req = { headers: {}, ...request } as Request;
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => req,
      }),
    } as ArgumentsHost;
    return { host, status, json };
  }

  it('formats validation failures without exposing sensitive errors', () => {
    const { host, json } = makeHost({ correlationId: 'id-1' });
    new ApiExceptionFilter(true).catch(
      new BadRequestException(['email must be valid']),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      }),
    );
  });

  it('returns a generic message and 500 status for a non-HttpException error', () => {
    const { host, status, json } = makeHost();
    new ApiExceptionFilter(true).catch(
      new Error('db connection refused'),
      host,
    );
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'HTTP_500',
          message: 'Internal server error',
        }),
      }),
    );
  });

  it('does not leak the raw error message (with a database URL/password) into the response for a 500', () => {
    const { host, json } = makeHost();
    new ApiExceptionFilter(true).catch(
      new Error('failed: postgresql://user:secret@host/db password=hunter2'),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Internal server error' }),
      }),
    );
  });

  it('logs the cause of a wrapped Error when present', () => {
    const { host } = makeHost();
    const cause = new Error('root cause');
    const wrapped = new Error('wrapper', { cause });
    expect(() =>
      new ApiExceptionFilter(true).catch(wrapped, host),
    ).not.toThrow();
  });

  it('handles a thrown non-Error value', () => {
    const { host, status } = makeHost();
    new ApiExceptionFilter(true).catch('plain string throw', host);
    expect(status).toHaveBeenCalledWith(500);
  });

  it('passes through a plain string HttpException message', () => {
    const { host, json } = makeHost();
    new ApiExceptionFilter(true).catch(
      new NotFoundException('Not found'),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'HTTP_404',
          message: 'Not found',
        }),
      }),
    );
  });

  it('uses a custom error code from the exception response body when present', () => {
    const { host, json } = makeHost();
    new ApiExceptionFilter(true).catch(
      new ForbiddenException({ code: 'CUSTOM_CODE', message: 'Nope' }),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'CUSTOM_CODE' }),
      }),
    );
  });

  it('falls back to the x-correlation-id header when the request has no correlationId', () => {
    const { host, json } = makeHost({
      headers: { 'x-correlation-id': 'header-id' },
    });
    new ApiExceptionFilter(true).catch(new BadRequestException('Bad'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: { correlationId: 'header-id' },
      }),
    );
  });
});
