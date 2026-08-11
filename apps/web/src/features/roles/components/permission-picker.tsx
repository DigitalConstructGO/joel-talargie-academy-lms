'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissionCatalog } from '@/features/permissions/hooks/use-permission-catalog';
import { usePermissions } from '@/hooks/use-permissions';
import type { Permission } from '@/features/permissions/types/permission.types';

export interface PermissionPickerProps {
  selected: string[];
  onChange: (permissionIds: string[]) => void;
  disabled?: boolean;
}

/**
 * Module-grouped permission checkbox picker for role create/edit. Mirrors
 * the backend's privilege-escalation rule (`RolesService.assertAssignable`)
 * by only offering permissions the *acting* admin personally holds -
 * bypassed for a true administrator, same as `usePermissions()` elsewhere -
 * so the picker never lets someone assign a permission the server would
 * reject with a 403.
 */
export function PermissionPicker({ selected, onChange, disabled }: PermissionPickerProps) {
  const catalogQuery = usePermissionCatalog();
  const { can, isAdministrator } = usePermissions();

  if (catalogQuery.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const groups = catalogQuery.data?.groups ?? [];

  function assignable(permission: Permission) {
    return isAdministrator || can(permission.code);
  }

  function toggle(permission: Permission, checked: boolean) {
    if (checked) onChange([...new Set([...selected, permission.id])]);
    else onChange(selected.filter((id) => id !== permission.id));
  }

  function toggleGroup(group: Permission[], checked: boolean) {
    const ids = group.filter(assignable).map((permission) => permission.id);
    if (checked) onChange([...new Set([...selected, ...ids])]);
    else onChange(selected.filter((id) => !ids.includes(id)));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{selected.length} permission(s) selected</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() =>
              onChange(
                groups.flatMap((group) => group.permissions.filter(assignable).map((p) => p.id)),
              )
            }
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange([])}
          >
            Clear all
          </Button>
        </div>
      </div>

      <Accordion type="multiple" className="rounded-xl border border-border">
        {groups.map((group) => {
          const assignableInGroup = group.permissions.filter(assignable);
          const selectedInGroup = assignableInGroup.filter((p) => selected.includes(p.id));
          const allSelected =
            assignableInGroup.length > 0 && selectedInGroup.length === assignableInGroup.length;

          return (
            <AccordionItem key={group.module} value={group.module}>
              <AccordionTrigger className="px-4 capitalize">
                <span className="flex items-center gap-2">
                  {group.module}
                  <Badge variant="secondary">
                    {selectedInGroup.length}/{group.permissions.length}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={allSelected}
                    disabled={disabled || assignableInGroup.length === 0}
                    onCheckedChange={(checked) => toggleGroup(group.permissions, Boolean(checked))}
                  />
                  Select all in {group.module}
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.permissions.map((permission) => {
                    const permitted = assignable(permission);
                    return (
                      <Label
                        key={permission.id}
                        className="flex items-start gap-2 text-sm font-normal"
                      >
                        <Checkbox
                          checked={selected.includes(permission.id)}
                          disabled={disabled || !permitted}
                          onCheckedChange={(checked) => toggle(permission, Boolean(checked))}
                          className="mt-0.5"
                        />
                        <span>
                          <code className="text-xs">{permission.code}</code>
                          {!permitted && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (you don&apos;t hold this permission)
                            </span>
                          )}
                        </span>
                      </Label>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
