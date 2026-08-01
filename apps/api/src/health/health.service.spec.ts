import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { DatabaseService } from '../common/database/database.service';
describe('HealthService', () => {
  it('returns the standard healthy response', () => {
    const value = new HealthService(new ConfigService({ NODE_ENV: 'test' }), {
      checkConnection: jest.fn(),
    } as unknown as DatabaseService).getHealth();
    expect(value.data.status).toBe('ok');
    expect(value.error).toBeNull();
    expect(value.meta).toEqual({});
  });
  it('returns a sanitized database status', async () => {
    const database = {
      checkConnection: jest.fn().mockResolvedValue('available'),
    } as unknown as DatabaseService;
    await expect(
      new HealthService(
        new ConfigService({ NODE_ENV: 'test' }),
        database,
      ).getDatabaseHealth(),
    ).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'available' }),
        error: null,
      }),
    );
  });
});
