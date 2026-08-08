import { describe, expect, it } from 'vitest';
import { ApiClientError, extractErrorMessage } from './api-error';

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
});

describe('ApiClientError', () => {
  it('carries an optional HTTP status alongside the message', () => {
    const error = new ApiClientError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
    expect(error.name).toBe('ApiClientError');
  });
});
