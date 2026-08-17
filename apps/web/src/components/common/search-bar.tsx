'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
  'aria-label'?: string;
}

export function SearchBar({
  placeholder = 'Search…',
  defaultValue = '',
  onSearch,
  debounceMs = 300,
  className,
  'aria-label': ariaLabel = 'Search',
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebounce(value, debounceMs);
  const prevPropRef = useRef(defaultValue);
  const isFirstMount = useRef(true);

  // Synchronize when the defaultValue prop itself changes from parent / URL
  useEffect(() => {
    if (defaultValue !== prevPropRef.current) {
      prevPropRef.current = defaultValue;
      setValue(defaultValue);
    }
  }, [defaultValue]);

  // Debounced search trigger on typing
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    onSearch(debouncedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSearch identity is expected to be stable per caller convention
  }, [debouncedValue]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSearch(value.trim());
    }
  }

  function handleClear() {
    setValue('');
    onSearch('');
  }

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="pl-9 pr-9"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
