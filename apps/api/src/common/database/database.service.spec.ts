import type Database from 'better-sqlite3';
import { DatabaseService } from './database.service';
import type { AcademyDatabase } from './database.types';

describe('DatabaseService', () => {
  it('reports an unconfigured database without connecting', async () => {
    const service = new DatabaseService(null, null);
    await expect(service.checkConnection()).resolves.toBe('not-configured');
  });

  it('checks a configured connection and closes its single pool', async () => {
    const pool = {
      close: jest.fn(),
    } as unknown as Database.Database;
    const database = {
      execute: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    } as unknown as AcademyDatabase;
    const service = new DatabaseService(pool, database);

    await expect(service.checkConnection()).resolves.toBe('available');
    await service.onApplicationShutdown();
    expect(database.execute).toHaveBeenCalledTimes(1);
    expect(pool.close).toHaveBeenCalledTimes(1);
  });

  it('returns a sanitized unavailable status for connection failures', async () => {
    const database = {
      execute: jest
        .fn()
        .mockRejectedValue(new Error('postgresql://user:secret@host/database')),
    } as unknown as AcademyDatabase;
    const service = new DatabaseService(null, database);
    await expect(service.checkConnection()).resolves.toBe('unavailable');
  });
});
