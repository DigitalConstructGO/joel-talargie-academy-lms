import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly production: boolean) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const message =
      status === 500 && this.production
        ? 'Internal server error'
        : typeof raw === 'object' && raw && 'message' in raw
          ? String((raw as { message: unknown }).message)
          : exception instanceof Error
            ? exception.message
            : 'Request failed';
    response.status(status).json({
      data: null,
      meta: { correlationId: request.headers['x-correlation-id'] },
      error: { code: `HTTP_${status}`, message, details: [] },
    });
  }
}
