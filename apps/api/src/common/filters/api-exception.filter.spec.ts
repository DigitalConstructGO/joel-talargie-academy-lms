import { BadRequestException, type ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  it('formats validation failures without exposing sensitive errors', () => {
    const json = jest.fn();
    const response = {
      status: jest.fn(() => ({ json })),
    } as unknown as Response;
    const request = { headers: {}, correlationId: 'id-1' } as Request;
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as ArgumentsHost;
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
});
