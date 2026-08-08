import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { FilterOption } from './filter-types';

export interface CheckboxFilterGroupProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: FilterOption[];
  className?: string;
}

/** An inline (non-popover) group of checkboxes - useful in a filter sidebar rather than a filter bar. */
export function CheckboxFilterGroup({
  label,
  values,
  onChange,
  options,
  className,
}: CheckboxFilterGroupProps) {
  function toggle(value: string) {
    onChange(
      values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value],
    );
  }

  return (
    <fieldset className={cn('flex flex-col gap-2', className)}>
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
        >
          <Checkbox
            checked={values.includes(option.value)}
            onCheckedChange={() => toggle(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
