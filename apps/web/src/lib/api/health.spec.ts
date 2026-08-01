import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHealth } from './health';
afterEach(() => vi.unstubAllGlobals());
describe('getHealth', () => {
  it('fetches without caching and validates health', async () => {
    const body = {
      data: {
        service: 'joel-talargie-academy-api',
        status: 'ok',
        environment: 'test',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
      },
      meta: {},
      error: null,
    };
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test/api/v1');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
    vi.stubGlobal('fetch', fetchMock);
    await expect(getHealth()).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/v1/health',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });
});
