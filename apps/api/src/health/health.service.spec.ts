import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { DatabaseService } from '../common/database/database.service';
import { LocalStorageProvider } from '../modules/storage/providers/local-storage.provider';

describe('HealthService', () => {
  function makeService(
    overrides: {
      checkConnection?: jest.Mock;
      checkHealth?: jest.Mock;
    } = {},
  ) {
    const database = {
      checkConnection: overrides.checkConnection ?? jest.fn(),
    } as unknown as DatabaseService;
    const storage = {
      checkHealth: overrides.checkHealth ?? jest.fn(),
    } as unknown as LocalStorageProvider;
    return new HealthService(
      new ConfigService({ NODE_ENV: 'test' }),
      database,
      storage,
    );
  }

  it('returns the standard healthy response', () => {
    const value = makeService().getHealth();
    expect(value.data.status).toBe('ok');
    expect(value.error).toBeNull();
    expect(value.meta).toEqual({});
  });

  it('returns a sanitized database status', async () => {
    const service = makeService({
      checkConnection: jest.fn().mockResolvedValue('available'),
    });
    await expect(service.getDatabaseHealth()).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'available' }),
        error: null,
      }),
    );
  });

  it('returns a sanitized storage status', async () => {
    const service = makeService({
      checkHealth: jest.fn().mockResolvedValue('available'),
    });
    await expect(service.getStorageHealth()).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'available' }),
        error: null,
      }),
    );
  });

  it('liveness never touches the database or storage', () => {
    const checkConnection = jest.fn();
    const checkHealth = jest.fn();
    const service = makeService({ checkConnection, checkHealth });
    const value = service.getLiveness();
    expect(value.data.status).toBe('alive');
    expect(checkConnection).not.toHaveBeenCalled();
    expect(checkHealth).not.toHaveBeenCalled();
  });

  describe('getReadiness', () => {
    it('resolves with status ready when database and storage are both available', async () => {
      const service = makeService({
        checkConnection: jest.fn().mockResolvedValue('available'),
        checkHealth: jest.fn().mockResolvedValue('available'),
      });
      await expect(service.getReadiness()).resolves.toEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ready',
            database: 'available',
            storage: 'available',
          }),
          error: null,
        }),
      );
    });

    it('throws ServiceUnavailableException when the database is unavailable', async () => {
      const service = makeService({
        checkConnection: jest.fn().mockResolvedValue('unavailable'),
        checkHealth: jest.fn().mockResolvedValue('available'),
      });
      await expect(service.getReadiness()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('throws ServiceUnavailableException when storage is unavailable', async () => {
      const service = makeService({
        checkConnection: jest.fn().mockResolvedValue('available'),
        checkHealth: jest.fn().mockResolvedValue('unavailable'),
      });
      await expect(service.getReadiness()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
