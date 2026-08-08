import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { UuidDto } from './uuid.dto';
import { SortingDto } from './sorting.dto';
import { FilterDto } from './filter.dto';

describe('shared DTO validation', () => {
  it('transforms and validates pagination', async () =>
    expect(
      await validate(
        plainToInstance(PaginationDto, { page: '2', pageSize: '50' }),
      ),
    ).toHaveLength(0));
  it('rejects invalid UUID values', async () =>
    expect(
      await validate(plainToInstance(UuidDto, { id: 'invalid' })),
    ).not.toHaveLength(0));

  describe('SortingDto', () => {
    it('defaults sortOrder to asc and accepts an empty payload', async () => {
      const instance = plainToInstance(SortingDto, {});
      expect(instance.sortOrder).toBe('asc');
      expect(await validate(instance)).toHaveLength(0);
    });

    it('accepts a valid sortBy/sortOrder pair', async () => {
      const errors = await validate(
        plainToInstance(SortingDto, { sortBy: 'createdAt', sortOrder: 'desc' }),
      );
      expect(errors).toHaveLength(0);
    });

    it('rejects a sortOrder outside asc/desc', async () => {
      const errors = await validate(
        plainToInstance(SortingDto, { sortOrder: 'sideways' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('FilterDto', () => {
    it('accepts an empty payload', async () => {
      expect(await validate(plainToInstance(FilterDto, {}))).toHaveLength(0);
    });

    it('rejects a search string over the max length', async () => {
      const errors = await validate(
        plainToInstance(FilterDto, { search: 'a'.repeat(201) }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
