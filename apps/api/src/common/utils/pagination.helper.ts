export const MAX_PAGE_SIZE = 100;
export const normalizePageSize = (value: number): number =>
  Math.max(1, Math.min(MAX_PAGE_SIZE, Math.trunc(value)));
export const offsetForPage = (page: number, pageSize: number): number =>
  (Math.max(1, Math.trunc(page)) - 1) * normalizePageSize(pageSize);
