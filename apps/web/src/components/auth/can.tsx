'use client';

import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/stores';
import { hasAnyRole, hasRole } from '@/lib/authorization/user-type';

export interface CanProps {
  children: ReactNode;
  /** Shown instead of `children` when the check fails - omit to render nothing. */
  fallback?: ReactNode;
  /** Must have this exact permission. */
  permission?: string;
  /** Must have at least one of these permissions. */
  anyOf?: string[];
  /** Must have every one of these permissions. */
  allOf?: string[];
  /** Must carry this role code. */
  role?: string;
  /** Must carry at least one of these role codes. */
  anyRole?: string[];
}

/**
 * UX-layer gate for a single action/button - not a security boundary (the
 * backend enforces the same permissions on every API call regardless of
 * what this renders). When more than one condition is given, all of them
 * must pass. `isAdministrator` always short-circuits to allowed, matching
 * `usePermissions()`/`AuthorizationGate` elsewhere.
 *
 * @example
 * <Can permission="courses.create"><CreateCourseButton /></Can>
 * <Can anyOf={['courses.update', 'courses.archive']}>...</Can>
 * <Can role="ADMINISTRATOR" fallback={<DisabledHint />}>...</Can>
 */
export function Can({
  children,
  fallback = null,
  permission,
  anyOf,
  allOf,
  role,
  anyRole,
}: CanProps) {
  const { can, canAny, canAll, isAdministrator } = usePermissions();
  const roles = useAuthStore((state) => state.roles);

  const checks: boolean[] = [];
  if (permission) checks.push(can(permission));
  if (anyOf) checks.push(canAny(anyOf));
  if (allOf) checks.push(canAll(allOf));
  if (role) checks.push(isAdministrator || hasRole(roles, role));
  if (anyRole) checks.push(isAdministrator || hasAnyRole(roles, anyRole));

  const allowed = checks.length === 0 || checks.every(Boolean);
  return <>{allowed ? children : fallback}</>;
}

/**
 * Same component, under the names the wider spec/vocabulary uses - not a
 * second implementation. `<PermissionGate permission="courses.create">` and
 * `<RoleGate role="ADMINISTRATOR">` are `<Can>` calls with a narrower prop
 * surface for readability at the call site.
 */
export const PermissionGate = Can;
export const RoleGate = Can;
