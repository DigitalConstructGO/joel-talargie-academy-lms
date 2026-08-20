'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { useUpdateSettingsBatch } from '../hooks/use-settings';
import type { PublicSettings } from '../types/settings.types';

export function PublicSettingsForm({
  initialData,
  disabled = false,
}: {
  initialData: PublicSettings;
  disabled?: boolean;
}) {
  const updateBatch = useUpdateSettingsBatch();
  const [form, setForm] = useState<PublicSettings>(initialData);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateBatch.mutateAsync({
        reason: 'Updated Public Settings and platform-wide defaults',
        items: [
          { key: 'academy.name', value: form.academyName },
          { key: 'academy.short_name', value: form.shortName },
          { key: 'academy.default_currency', value: form.defaultCurrency },
          { key: 'academy.timezone', value: form.timezone },
          { key: 'registration.enabled', value: form.registrationEnabled },
        ],
      });
      toast.success('Public settings saved successfully');
    } catch {
      toast.error('Failed to save settings', 'Please check permissions.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Registration & Access</CardTitle>
          <CardDescription>
            Configure user sign-up availability and currency settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Enable Public Student Registration</Label>
              <p className="text-xs text-muted-foreground">
                Allow new students to create accounts from the registration page.
              </p>
            </div>
            <Switch
              checked={form.registrationEnabled}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, registrationEnabled: checked }))
              }
              disabled={disabled || updateBatch.isPending}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select
                value={form.defaultCurrency}
                onValueChange={(val) => setForm((prev) => ({ ...prev, defaultCurrency: val }))}
                disabled={disabled || updateBatch.isPending}
              >
                <SelectTrigger id="defaultCurrency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETB">ETB - Ethiopian Birr</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Academy Timezone</Label>
              <Input
                id="timezone"
                value={form.timezone}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                placeholder="Africa/Addis_Ababa"
                disabled={disabled || updateBatch.isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={disabled || updateBatch.isPending} className="min-w-32">
          {updateBatch.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              Save Public Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
