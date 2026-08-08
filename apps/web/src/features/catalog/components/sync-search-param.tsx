'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFilterStore } from '@/stores';

/** Seeds the client-side filter store from a `?search=` URL param on first load (e.g. arriving from the home page hero search). */
export function SyncSearchParam() {
  const searchParams = useSearchParams();
  const setSearch = useFilterStore((state) => state.setSearch);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const search = searchParams.get('search');
    if (search) setSearch(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount only
  }, []);

  return null;
}
