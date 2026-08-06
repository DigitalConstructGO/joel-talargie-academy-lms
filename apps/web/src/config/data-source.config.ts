/**
 * Switches the catalog feature between the real backend API and the
 * built-in demo dataset. Flip to 'live' (or set
 * NEXT_PUBLIC_CATALOG_DATA_SOURCE=live) once the production database has
 * real course/category content - no other code needs to change.
 */
export type CatalogDataSource = 'mock' | 'live';

export const CATALOG_DATA_SOURCE: CatalogDataSource =
  (process.env.NEXT_PUBLIC_CATALOG_DATA_SOURCE as CatalogDataSource | undefined) ?? 'mock';
