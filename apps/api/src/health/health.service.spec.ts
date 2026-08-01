import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
describe('HealthService', () => {
  it('returns the standard healthy response', () => {
    const value = new HealthService(
      new ConfigService({ NODE_ENV: 'test' }),
    ).getHealth();
    expect(value.data.status).toBe('ok');
    expect(value.error).toBeNull();
    expect(value.meta).toEqual({});
  });
});
