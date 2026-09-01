'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FilterOption } from './filter-types';
import { useLanguage } from '@/lib/i18n/language-provider';

const ALL_VALUE = '__all__';

export interface SelectFilterProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
}

/** A single-select dropdown filter (e.g. Status, Category, Role). */
export function SelectFilter({
  label,
  value,
  onChange,
  options,
  placeholder,
  className,
}: SelectFilterProps) {
  const { locale } = useLanguage();
  const allLabel = locale === 'am' ? `ሁሉም ${label}` : `All ${label.toLowerCase()}`;

  return (
    <Select
      value={value ?? ALL_VALUE}
      onValueChange={(next) => onChange(next === ALL_VALUE ? undefined : next)}
    >
      <SelectTrigger className={className ?? 'w-[160px]'} aria-label={label}>
        <SelectValue placeholder={placeholder ?? label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
