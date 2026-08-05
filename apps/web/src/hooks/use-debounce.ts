import { useEffect, useState } from 'react';

/** Returns a value that only updates after it has been stable for `delayMs` - typical use is debouncing a search input before firing a query. */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}
