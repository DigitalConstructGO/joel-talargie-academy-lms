'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { PlatformSetting } from '../types/settings.types';

export interface SettingFieldProps {
  setting: PlatformSetting;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

/** Renders one settings-registry field by its backend-declared `type` - never a hardcoded form per setting. */
export function SettingField({ setting, value, onChange, disabled }: SettingFieldProps) {
  const id = `setting-${setting.key}`;

  if (setting.type === 'BOOLEAN') {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <div>
          <Label htmlFor={id}>{setting.description}</Label>
          <p className="text-xs text-muted-foreground">{setting.key}</p>
        </div>
        <Switch
          id={id}
          checked={Boolean(value)}
          disabled={disabled || !setting.editable}
          onCheckedChange={onChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{setting.description}</Label>
      <Input
        id={id}
        type={setting.type === 'INTEGER' ? 'number' : setting.type === 'EMAIL' ? 'email' : 'text'}
        value={value === null || value === undefined ? '' : String(value)}
        disabled={disabled || !setting.editable}
        onChange={(event) =>
          onChange(setting.type === 'INTEGER' ? Number(event.target.value) : event.target.value)
        }
      />
      <p className="text-xs text-muted-foreground">{setting.key}</p>
    </div>
  );
}
