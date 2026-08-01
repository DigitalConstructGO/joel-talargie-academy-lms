import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { UuidDto } from './uuid.dto';

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
});
