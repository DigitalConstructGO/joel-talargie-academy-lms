import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface FilterChipData {
  key: string;
  label: string;
}

export interface FilterChipsProps {
  chips: FilterChipData[];
  onRemove: (key: string) => void;
  onResetAll?: () => void;
}

/** Renders the currently-active filters as removable pills, plus a "Reset all" action. */
export function FilterChips({ chips, onRemove, onResetAll }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge key={chip.key} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1">
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            aria-label={`Remove ${chip.label} filter`}
            className="rounded-full p-0.5 hover:bg-background/60"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {onResetAll && (
        <Button variant="ghost" size="sm" onClick={onResetAll} className="h-6 px-2 text-xs">
          Reset all
        </Button>
      )}
    </div>
  );
}
