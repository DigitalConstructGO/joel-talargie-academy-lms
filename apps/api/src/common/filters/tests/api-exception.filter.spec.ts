import {
  BadRequestException,
  ArgumentsHost,
  NotFoundException,
} from '@nestjs/common';
import { ApiExceptionFilter } from '../api-exception.filter';
import { validationExceptionFactory } from '../../pipes/validation-exception-factory';

function buildHost(request: Record<string, unknown> = {}) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const response = { status };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ headers: {}, ...request }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('ApiExceptionFilter', () => {
  const filter = new ApiExceptionFilter(false);

  it('passes structured field errors through as details with field + message', () => {
    const exception = validationExceptionFactory([
      {
        property: 'email',
        constraints: { isEmail: 'email must be an email' },
      },
    ] as never);
    const { host, status, json } = buildHost();

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Validation failed');
    expect(body.error.details).toEqual([
      { field: 'email', message: 'email must be an email' },
    ]);
  });

  it('falls back to the legacy flattened-string-array shape for hand-thrown BadRequestExceptions', () => {
    const exception = new BadRequestException(['title should not be empty']);
    const { host, json } = buildHost();

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.error.details).toEqual([
      { message: 'title should not be empty' },
    ]);
  });

  it('uses the exception message directly for a plain BadRequestException', () => {
    const exception = new BadRequestException('Something specific went wrong');
    const { host, json } = buildHost();

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.error.message).toBe('Something specific went wrong');
    expect(body.error.details).toEqual([]);
  });

  it('preserves an explicit machine-readable error code', () => {
    const exception = new NotFoundException({
      code: 'ENROLLMENT_NOT_FOUND',
      message: 'Enrollment not found',
    });
    const { host, json } = buildHost();

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe('ENROLLMENT_NOT_FOUND');
  });

  it('never leaks internal error details for a 500', () => {
    const exception = new Error('database connection string leaked here');
    const { host, status, json } = buildHost();

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.error.message).toBe('Internal server error');
    expect(body.error.code).toBe('HTTP_500');
  });
});
