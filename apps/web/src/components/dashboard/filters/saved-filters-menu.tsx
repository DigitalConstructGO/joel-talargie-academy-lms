'use client';

import { useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { SavedFilterPreset } from '@/hooks/use-saved-filters';

export interface SavedFiltersMenuProps<T extends Record<string, string | undefined>> {
  presets: SavedFilterPreset<T>[];
  currentFilters: T;
  onSave: (name: string, filters: T) => void;
  onApply: (filters: T) => void;
  onRemove: (name: string) => void;
}

/** Named filter presets - save the current filter/search state, reapply or delete it later. */
export function SavedFiltersMenu<T extends Record<string, string | undefined>>({
  presets,
  currentFilters,
  onSave,
  onApply,
  onRemove,
}: SavedFiltersMenuProps<T>) {
  const [name, setName] = useState('');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="size-4" />
          Saved filters
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Preset name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-8"
            />
            <Button
              size="sm"
              onClick={() => {
                onSave(name, currentFilters);
                setName('');
              }}
              disabled={!name.trim()}
            >
              Save
            </Button>
          </div>
          {presets.length === 0 ? (
            <p className="text-xs text-muted-foreground">No saved filters yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {presets.map((preset) => (
                <li key={preset.name} className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onApply(preset.filters)}
                    className="min-w-0 flex-1 truncate text-left text-sm text-foreground hover:text-brand"
                  >
                    {preset.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(preset.name)}
                    aria-label={`Delete ${preset.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
