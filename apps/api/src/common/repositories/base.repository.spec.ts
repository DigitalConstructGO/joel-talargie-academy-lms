import type { AcademyDatabase } from '../database/database.types';
import { BaseRepository } from './base.repository';

class TestRepository extends BaseRepository<object, object, object> {
  constructor(database: AcademyDatabase) {
    super(database);
  }
  findById = async () => null;
  create = async (input: object) => input;
  update = async () => null;
  softDelete = async () => true;
  getPage(page: number, size: number) {
    return this.pagination(page, size);
  }
  getSort(field?: string) {
    return this.sorting(field, 'desc', ['createdAt'] as const, 'createdAt');
  }
}

describe('BaseRepository', () => {
  const repository = new TestRepository({} as AcademyDatabase);
  it('bounds pagination and calculates offsets', () =>
    expect(repository.getPage(3, 500)).toEqual({ limit: 100, offset: 200 }));
  it('allows only known sort fields', () =>
    expect(repository.getSort('unsafe')).toEqual({
      field: 'createdAt',
      direction: 'desc',
    }));
});
