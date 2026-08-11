import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export interface FieldValidationError {
  field: string;
  message: string;
}

/**
 * NestJS's default `ValidationPipe` exception factory flattens
 * `class-validator`'s `ValidationError[]` into a bare array of message
 * strings, discarding which DTO property each message belongs to. That
 * makes it impossible for the frontend to highlight the offending form
 * field - it can only show a generic "validation failed" toast. This
 * preserves the property name (recursing into nested DTOs, e.g.
 * `address.city`) so `ApiExceptionFilter` can pass structured
 * `{ field, message }` pairs through to the client.
 */
export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): FieldValidationError[] {
  return errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const ownMessages = error.constraints
      ? Object.values(error.constraints).map((message) => ({ field, message }))
      : [];
    const childMessages = error.children?.length
      ? flattenValidationErrors(error.children, field)
      : [];
    return [...ownMessages, ...childMessages];
  });
}

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException({
    message: 'Validation failed',
    errors: flattenValidationErrors(errors),
  });
}
