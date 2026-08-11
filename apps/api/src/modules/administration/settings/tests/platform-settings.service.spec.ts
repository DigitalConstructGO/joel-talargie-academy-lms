import { BadRequestException } from '@nestjs/common';
import { PlatformSettingsService } from '../platform-settings.service';

describe('PlatformSettingsService', () => {
  const selectChain = {
    from: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    orderBy: jest.fn(),
  };
  const db = {
    client: { select: jest.fn(() => selectChain), transaction: jest.fn() },
  };
  const registry = {
    definitions: [
      {
        key: 'academy.name',
        category: 'academy',
        type: 'STRING',
        defaultValue: 'Academy',
        permission: 'settings.update_academy',
        editable: true,
        restartRequired: false,
        description: 'academy name',
      },
      {
        key: 'payment.bank_name',
        category: 'payment',
        type: 'STRING',
        defaultValue: '',
        permission: 'settings.update_payment',
        editable: true,
        restartRequired: false,
        description: 'bank name',
      },
    ],
    get: jest.fn(),
    authorize: jest.fn(),
    validate: jest.fn(),
  };
  const service = new PlatformSettingsService(db as never, registry as never);

  beforeEach(() => {
    jest.clearAllMocks();
    selectChain.from.mockReturnValue(selectChain);
    selectChain.where.mockReturnValue(selectChain);
    selectChain.limit.mockResolvedValue([]);
    selectChain.orderBy.mockReturnValue(selectChain);
    registry.get.mockImplementation((key: string) =>
      registry.definitions.find((d) => d.key === key),
    );
  });

  describe('list', () => {
    it('merges stored values over defaults and filters by category/search', async () => {
      selectChain.from.mockResolvedValue([
        {
          key: 'academy.name',
          value: 'Custom',
          updatedAt: new Date('2026-01-01'),
          updatedBy: 'admin-1',
        },
      ]);
      const result = await service.list({} as never);
      expect(result).toHaveLength(2);
      const academy = result.find((r) => r.key === 'academy.name');
      expect(academy?.value).toBe('Custom');
      expect(academy?.updatedBy).toBe('admin-1');

      const filtered = await service.list({ category: 'payment' } as never);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].key).toBe('payment.bank_name');
    });

    it('filters by search text across key and description', async () => {
      selectChain.from.mockResolvedValue([]);
      const result = await service.list({ search: 'bank' } as never);
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('payment.bank_name');
    });

    it('falls back to the default value when no row exists', async () => {
      selectChain.from.mockResolvedValue([]);
      const [result] = await service.list({ category: 'academy' } as never);
      expect(result.value).toBe('Academy');
      expect(result.updatedAt).toBeNull();
    });
  });

  describe('get', () => {
    it('returns the stored value merged with the definition', async () => {
      selectChain.limit.mockResolvedValue([
        {
          value: 'Custom',
          updatedAt: new Date('2026-01-01'),
          updatedBy: 'admin-1',
        },
      ]);
      const result = await service.get('academy.name');
      expect(result.value).toBe('Custom');
      expect(result.key).toBe('academy.name');
    });

    it('falls back to the default when the setting has never been written', async () => {
      selectChain.limit.mockResolvedValue([]);
      const result = await service.get('academy.name');
      expect(result.value).toBe('Academy');
      expect(result.updatedAt).toBeNull();
    });
  });

  describe('batch', () => {
    function txChain() {
      const chain = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        onConflictDoUpdate: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: 'setting-1',
            value: 'Custom',
            updatedAt: new Date('2026-01-01'),
          },
        ]),
      };
      return chain;
    }

    it('rejects duplicate keys in the same batch', async () => {
      await expect(
        service.batch(
          'admin-1',
          [
            { key: 'academy.name', value: 'A' },
            { key: 'academy.name', value: 'B' },
          ] as never,
          'reason',
          [],
          true,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('authorizes and validates each item, then writes value + activity log inside a transaction', async () => {
      const chain = txChain();
      db.client.transaction.mockImplementation(
        async (fn: (tx: unknown) => unknown) => fn(chain),
      );
      const result = await service.batch(
        'admin-1',
        [{ key: 'academy.name', value: 'Custom' }] as never,
        'Rebrand',
        ['settings.update_academy'],
        false,
      );
      expect(registry.authorize).toHaveBeenCalledWith(
        registry.definitions[0],
        ['settings.update_academy'],
        false,
      );
      expect(registry.validate).toHaveBeenCalledWith(
        registry.definitions[0],
        'Custom',
      );
      expect(chain.insert).toHaveBeenCalledTimes(2);
      expect(result[0].value).toBe('Custom');
      expect(result[0].updatedBy).toBe('admin-1');
    });

    it('propagates a permission error from the registry before any writes happen', async () => {
      registry.authorize.mockImplementationOnce(() => {
        throw new BadRequestException('forbidden');
      });
      await expect(
        service.batch(
          'admin-1',
          [{ key: 'academy.name', value: 'Custom' }] as never,
          'reason',
          [],
          false,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(db.client.transaction).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('delegates to batch with a single item and returns the first result', async () => {
      const chain = txChain0();
      db.client.transaction.mockImplementation(
        async (fn: (tx: unknown) => unknown) => fn(chain),
      );
      const result = await service.update(
        'admin-1',
        'academy.name',
        'Custom',
        'Rebrand',
        ['settings.update_academy'],
        false,
      );
      expect(result.value).toBe('Custom');
    });

    function txChain0() {
      return {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        onConflictDoUpdate: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: 'setting-1',
            value: 'Custom',
            updatedAt: new Date('2026-01-01'),
          },
        ]),
      };
    }
  });

  describe('history', () => {
    it('validates the key exists, then filters activity logs to entries matching that key', async () => {
      selectChain.orderBy.mockReturnValue({
        limit: jest.fn().mockResolvedValue([
          {
            id: 'log-1',
            actorId: 'admin-1',
            before: { value: 'Old' },
            after: { key: 'academy.name', value: 'New', reason: 'Rebrand' },
            createdAt: new Date('2026-01-01'),
          },
          {
            id: 'log-2',
            actorId: 'admin-1',
            before: { value: '' },
            after: { key: 'payment.bank_name', value: 'Bank' },
            createdAt: new Date('2026-01-01'),
          },
        ]),
      });
      const result = await service.history('academy.name');
      expect(registry.get).toHaveBeenCalledWith('academy.name');
      expect(result).toEqual([
        {
          id: 'log-1',
          actorId: 'admin-1',
          previousValue: 'Old',
          newValue: 'New',
          reason: 'Rebrand',
          createdAt: new Date('2026-01-01'),
        },
      ]);
    });
  });
});
