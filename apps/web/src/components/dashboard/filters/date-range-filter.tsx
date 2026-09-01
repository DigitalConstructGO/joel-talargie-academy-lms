'use client';

import type { DateRange } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';

import { useLanguage } from '@/lib/i18n/language-provider';

export interface DateRangeFilterProps {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

/** A date-range picker filter, e.g. for filtering a table by created/updated date. */
export function DateRangeFilter({ value, onChange, placeholder, className }: DateRangeFilterProps) {
  const { locale } = useLanguage();
  const defaultPlaceholder = locale === 'am' ? 'የቀን ገደብ' : 'Date range';
  const effectivePlaceholder = placeholder ?? defaultPlaceholder;

  const label = value?.from
    ? value.to
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : formatDate(value.from)
    : effectivePlaceholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2 font-normal',
            !value?.from && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="size-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar mode="range" selected={value} onSelect={onChange} numberOfMonths={2} />
      </PopoverContent>
    </Popover>
  );
}
