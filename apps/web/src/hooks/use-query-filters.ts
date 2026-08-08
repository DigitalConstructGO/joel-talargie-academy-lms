'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface UseQueryFiltersOptions<T extends Record<string, string | undefined>> {
  defaults: T;
  pageSize?: number;
}

export interface UseQueryFiltersResult<T extends Record<string, string | undefined>> {
  filters: T;
  page: number;
  pageSize: number;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  setFilters: (partial: Partial<T>) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetFilters: () => void;
}

/**
 * Generic filter+pagination state synced to the URL query string, so
 * filters survive a refresh and are shareable/bookmarkable (Requirement 3).
 * Any non-page filter change resets `page` back to 1. Only non-default
 * values are written to the URL, keeping it clean. Values round-trip as
 * plain strings - callers coerce (e.g. `Number(filters.categoryId)`) as
 * needed, matching how the existing `SyncSearchParam`/`useFilterStore`
 * catalog filtering already works.
 */
export function useQueryFilters<T extends Record<string, string | undefined>>({
  defaults,
  pageSize: defaultPageSize = 20,
}: UseQueryFiltersOptions<T>): UseQueryFiltersResult<T> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultKeys = useMemo(() => Object.keys(defaults) as (keyof T)[], [defaults]);

  const filters = useMemo(() => {
    const result = { ...defaults };
    for (const key of defaultKeys) {
      const raw = searchParams.get(String(key));
      if (raw !== null) result[key] = raw as T[typeof key];
    }
    return result;
  }, [searchParams, defaults, defaultKeys]);

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.max(1, Number(searchParams.get('pageSize')) || defaultPageSize);

  const writeParams = useCallback(
    (next: { filters: T; page: number; pageSize: number }) => {
      const params = new URLSearchParams();
      for (const key of defaultKeys) {
        const value = next.filters[key];
        if (value !== undefined && value !== '' && value !== defaults[key]) {
          params.set(String(key), value);
        }
      }
      if (next.page > 1) params.set('page', String(next.page));
      if (next.pageSize !== defaultPageSize) params.set('pageSize', String(next.pageSize));
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [defaultKeys, defaults, defaultPageSize, pathname, router],
  );

  const setFilters = useCallback(
    (partial: Partial<T>) =>
      writeParams({ filters: { ...filters, ...partial }, page: 1, pageSize }),
    [filters, pageSize, writeParams],
  );

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) =>
      setFilters({ [key]: value } as unknown as Partial<T>),
    [setFilters],
  );

  const setPage = useCallback(
    (nextPage: number) => writeParams({ filters, page: nextPage, pageSize }),
    [filters, pageSize, writeParams],
  );

  const setPageSize = useCallback(
    (nextPageSize: number) => writeParams({ filters, page: 1, pageSize: nextPageSize }),
    [filters, writeParams],
  );

  const resetFilters = useCallback(
    () => writeParams({ filters: defaults, page: 1, pageSize: defaultPageSize }),
    [defaults, defaultPageSize, writeParams],
  );

  return { filters, page, pageSize, setFilter, setFilters, setPage, setPageSize, resetFilters };
}
