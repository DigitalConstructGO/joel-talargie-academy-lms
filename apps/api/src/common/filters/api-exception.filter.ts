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
    // Structured field errors from `validationExceptionFactory` - preferred
    // over the legacy flattened-string-array shape below, which only
    // remains as a fallback for any `BadRequestException` thrown by hand
    // elsewhere in the codebase with a plain string-array message.
    const rawFieldErrors =
      typeof raw === 'object' && raw && 'errors' in raw
        ? (raw as { errors: unknown }).errors
        : undefined;
    const fieldErrors = Array.isArray(rawFieldErrors)
      ? rawFieldErrors.filter(
          (item): item is { field: string; message: string } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { field?: unknown }).field === 'string' &&
            typeof (item as { message?: unknown }).message === 'string',
        )
      : [];
    const validationMessages = Array.isArray(rawMessage)
      ? rawMessage.filter((item): item is string => typeof item === 'string')
      : [];
    const message =
      status >= 500
        ? 'Internal server error'
        : typeof rawMessage === 'string'
          ? rawMessage
          : fieldErrors.length || validationMessages.length
            ? 'Validation failed'
            : 'Request failed';
    const details = fieldErrors.length
      ? fieldErrors
      : validationMessages.map((validationMessage) => ({
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
