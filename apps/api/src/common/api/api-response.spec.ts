import { ResponseBuilder } from './api-response';

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
