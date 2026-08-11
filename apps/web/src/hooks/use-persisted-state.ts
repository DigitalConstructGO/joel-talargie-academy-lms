'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * A single value persisted to localStorage under `key` (e.g. a view-mode
 * preference). Starts at `defaultValue` on every render (including the
 * first client render) and is only overwritten from storage in an effect,
 * so there's never a value mismatch between server and first client paint.
 */
export function usePersistedState<T extends string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(stored as T);
    } catch {
      // localStorage unavailable (e.g. private browsing) - fall back to defaultValue silently.
    }
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Non-fatal - the in-memory value still updates for this session.
      }
    },
    [key],
  );

  return [value, update];
}
