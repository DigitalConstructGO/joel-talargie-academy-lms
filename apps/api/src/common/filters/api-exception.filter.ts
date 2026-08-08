import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ResponseBuilder } from '../api/api-response';
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);
  constructor(private readonly production: boolean) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= 500) {
      const source =
        exception instanceof Error && exception.cause instanceof Error
          ? exception.cause
          : exception instanceof Error
            ? exception
            : undefined;
      const diagnostic = (source?.stack || source?.message || String(exception))
        .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[REDACTED_DATABASE_URL]')
        .replace(/password\s*[=:]\s*[^\s]+/gi, 'password=[REDACTED]');
      this.logger.error(diagnostic ?? 'Unhandled non-Error exception');
    }
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const rawMessage =
      typeof raw === 'object' && raw && 'message' in raw
        ? (raw as { message: unknown }).message
        : undefined;
    const validationMessages = Array.isArray(rawMessage)
      ? rawMessage.filter((item): item is string => typeof item === 'string')
      : [];
    const message =
      status >= 500
        ? 'Internal server error'
        : typeof rawMessage === 'string'
          ? rawMessage
          : validationMessages.length
            ? 'Validation failed'
            : 'Request failed';
    const details = validationMessages.map((validationMessage) => ({
      message: validationMessage,
    }));
    const errorCode =
      typeof raw === 'object' &&
      raw &&
      'code' in raw &&
      typeof (raw as { code?: unknown }).code === 'string'
        ? (raw as { code: string }).code
        : undefined;
    response.status(status).json(
      ResponseBuilder.error(
        errorCode ??
          (status === HttpStatus.BAD_REQUEST && details.length
            ? 'VALIDATION_ERROR'
            : `HTTP_${status}`),
        message,
        details,
        {
          correlationId:
            request.correlationId ?? request.headers['x-correlation-id'],
        },
      ),
    );
  }
}
