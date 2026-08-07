'use client';

import { useCallback, useEffect, useState } from 'react';

export interface SavedFilterPreset<T> {
  name: string;
  filters: T;
}

const STORAGE_PREFIX = 'joel-academy-saved-filters:';

function readPresets<T>(scopeKey: string): SavedFilterPreset<T>[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + scopeKey);
    return raw ? (JSON.parse(raw) as SavedFilterPreset<T>[]) : [];
  } catch {
    return [];
  }
}

/**
 * Named, localStorage-backed filter presets, scoped per page (e.g.
 * `'my-courses'`, `'payments'`). Read lazily in an effect (not during
 * render) so this never diverges from SSR output - these pages are already
 * fully client-rendered behind `AuthorizationGate`, but staying consistent
 * with that pattern avoids ever needing to think about it again.
 */
export function useSavedFilters<T extends Record<string, string | undefined>>(scopeKey: string) {
  const [presets, setPresets] = useState<SavedFilterPreset<T>[]>([]);

  useEffect(() => {
    setPresets(readPresets<T>(scopeKey));
  }, [scopeKey]);

  const persist = useCallback(
    (next: SavedFilterPreset<T>[]) => {
      setPresets(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_PREFIX + scopeKey, JSON.stringify(next));
      }
    },
    [scopeKey],
  );

  const savePreset = useCallback(
    (name: string, filters: T) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      persist([...presets.filter((preset) => preset.name !== trimmed), { name: trimmed, filters }]);
    },
    [presets, persist],
  );

  const removePreset = useCallback(
    (name: string) => persist(presets.filter((preset) => preset.name !== name)),
    [presets, persist],
  );

  return { presets, savePreset, removePreset };
}
