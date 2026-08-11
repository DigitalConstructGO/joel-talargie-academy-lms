import type { AcademyDatabase } from '../database/database.types';
import { normalizePageSize, offsetForPage } from '../utils/pagination.helper';

export interface RepositoryPage {
  limit: number;
  offset: number;
}
export interface RepositorySort<TField extends string> {
  field: TField;
  direction: 'asc' | 'desc';
}

export abstract class BaseRepository<TEntity, TCreate, TUpdate, TId = string> {
  protected constructor(protected readonly database: AcademyDatabase) {}

  abstract findById(id: TId): Promise<TEntity | null>;
  abstract create(input: TCreate): Promise<TEntity>;
  abstract update(id: TId, input: TUpdate): Promise<TEntity | null>;
  abstract softDelete(id: TId, archivedAt?: Date): Promise<boolean>;

  protected pagination(
    page: number,
    requestedPageSize: number,
  ): RepositoryPage {
    const limit = normalizePageSize(requestedPageSize);
    return { limit, offset: offsetForPage(page, limit) };
  }

  protected sorting<TField extends string>(
    requested: string | undefined,
    direction: 'asc' | 'desc',
    allowed: readonly TField[],
    fallback: TField,
  ): RepositorySort<TField> {
    return {
      field: allowed.includes(requested as TField)
        ? (requested as TField)
        : fallback,
      direction,
    };
  }

  protected timestamp(): Date {
    return new Date();
  }
}
