import { describe, expect, it } from 'vitest';
import { ApiClientError, extractErrorMessage, extractFieldErrors } from './api-error';

describe('extractErrorMessage', () => {
  it('prefers the nested error.message shape the backend normally returns', () => {
    const error = { response: { data: { error: { message: 'Invalid credentials' } } } };
    expect(extractErrorMessage(error)).toBe('Invalid credentials');
  });

  it('falls back to a top-level message when there is no nested error object', () => {
    const error = { response: { data: { message: 'Validation failed' } } };
    expect(extractErrorMessage(error)).toBe('Validation failed');
  });

  it('falls back to the given fallback when the response has no message at all', () => {
    const error = { response: { data: {} } };
    expect(extractErrorMessage(error, 'Something went wrong')).toBe('Something went wrong');
  });

  it('falls back to the default message for a non-axios error (e.g. a network failure)', () => {
    expect(extractErrorMessage(new Error('Network Error'))).toBe('Something went wrong');
  });

  it('falls back to a custom message when given one', () => {
    expect(extractErrorMessage(new Error('boom'), 'Request failed')).toBe('Request failed');
  });

  it('uses a status-specific default when the backend sent a status but no message', () => {
    const error = { response: { status: 429, data: {} } };
    expect(extractErrorMessage(error)).toBe(
      'Too many requests. Please wait a moment and try again.',
    );
  });

  it('uses a status-specific default for a 401 with no backend message', () => {
    const error = { response: { status: 401, data: {} } };
    expect(extractErrorMessage(error)).toBe('Your session has expired. Please sign in again.');
  });

  it('returns a timeout-specific message for an aborted axios request', () => {
    const error = { isAxiosError: true, code: 'ECONNABORTED' };
    expect(extractErrorMessage(error)).toBe(
      'The request timed out. Please check your connection and try again.',
    );
  });

  it('returns a network-specific message when the request never got a response', () => {
    const error = { isAxiosError: true, request: {} };
    expect(extractErrorMessage(error)).toBe(
      'Unable to reach the server. Please check your connection and try again.',
    );
  });
});

describe('extractFieldErrors', () => {
  it('extracts field/message pairs from a structured validation response', () => {
    const error = {
      response: {
        data: {
          error: {
            details: [
              { field: 'email', message: 'email must be an email' },
              {
                field: 'password',
                message: 'password must be longer than or equal to 8 characters',
              },
            ],
          },
        },
      },
    };
    expect(extractFieldErrors(error)).toEqual([
      { field: 'email', message: 'email must be an email' },
      { field: 'password', message: 'password must be longer than or equal to 8 characters' },
    ]);
  });

  it('ignores detail entries with no field name (legacy flattened-message shape)', () => {
    const error = {
      response: { data: { error: { details: [{ message: 'Something went wrong' }] } } },
    };
    expect(extractFieldErrors(error)).toEqual([]);
  });

  it('returns an empty array when there are no details at all', () => {
    expect(extractFieldErrors({ response: { data: {} } })).toEqual([]);
    expect(extractFieldErrors(new Error('boom'))).toEqual([]);
  });
});

describe('ApiClientError', () => {
  it('carries an optional HTTP status alongside the message', () => {
    const error = new ApiClientError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
    expect(error.name).toBe('ApiClientError');
  });
});
