'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    onSearch(debouncedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSearch identity is expected to be stable per caller convention
  }, [debouncedValue]);

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
          onClick={() => setValue('')}
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
