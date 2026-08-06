import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { FilterOption } from './filter-types';

export interface MultiSelectFilterProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: FilterOption[];
  className?: string;
}

/** A checkbox-driven multi-select filter shown in a popover (e.g. Tags, Categories). */
export function MultiSelectFilter({
  label,
  values,
  onChange,
  options,
  className,
}: MultiSelectFilterProps) {
  function toggle(value: string) {
    onChange(
      values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value],
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={className ?? 'h-9 gap-2'}>
          {label}
          {values.length > 0 && (
            <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">
              {values.length}
            </Badge>
          )}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="flex flex-col gap-1">
          {options.map((option) => {
            const checked = values.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(option.value)} />
                {option.label}
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
