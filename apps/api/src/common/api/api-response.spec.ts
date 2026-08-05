import { firstValueFrom, of } from 'rxjs';
import { ResponseBuilder, isApiEnvelope } from './api-response';
import { ApiResponseInterceptor } from './api-response.interceptor';

describe('ResponseBuilder', () => {
  it('creates standard success envelopes', () =>
    expect(ResponseBuilder.success({ id: '1' })).toEqual({
      data: { id: '1' },
      meta: {},
      error: null,
    }));
  it('creates standard error envelopes', () =>
    expect(ResponseBuilder.error('BAD_INPUT', 'Invalid input')).toEqual({
      data: null,
      meta: {},
      error: { code: 'BAD_INPUT', message: 'Invalid input', details: [] },
    }));
});

describe('isApiEnvelope', () => {
  it('recognizes an already-enveloped object', () => {
    expect(isApiEnvelope({ data: null, error: null })).toBe(true);
  });

  it('rejects primitives, null, and plain objects missing data/error', () => {
    expect(isApiEnvelope(null)).toBe(false);
    expect(isApiEnvelope('string')).toBe(false);
    expect(isApiEnvelope({ id: '1' })).toBe(false);
  });
});

describe('ApiResponseInterceptor', () => {
  const interceptor = new ApiResponseInterceptor();

  it('wraps a raw handler value in a success envelope', async () => {
    const handler = { handle: () => of({ id: '1' }) };
    const result = await firstValueFrom(
      interceptor.intercept({} as never, handler as never),
    );
    expect(result).toEqual({ data: { id: '1' }, meta: {}, error: null });
  });

  it('passes an already-enveloped value through unchanged', async () => {
    const envelope = { data: { id: '1' }, meta: { page: 1 }, error: null };
    const handler = { handle: () => of(envelope) };
    const result = await firstValueFrom(
      interceptor.intercept({} as never, handler as never),
    );
    expect(result).toBe(envelope);
  });
});
