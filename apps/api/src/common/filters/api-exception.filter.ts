import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ResponseBuilder } from '../api/api-response';
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
    response.status(status).json(
      ResponseBuilder.error(
        status === HttpStatus.BAD_REQUEST && details.length
          ? 'VALIDATION_ERROR'
          : `HTTP_${status}`,
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
