export type Permission = string;

export function can(granted: Permission[], required: Permission): boolean {
  return granted.includes(required);
}

/** True if `required` is empty (nothing to satisfy) or at least one entry is granted. */
export function canAny(granted: Permission[], required: Permission[]): boolean {
  return required.length === 0 || required.some((permission) => granted.includes(permission));
}

export function canAll(granted: Permission[], required: Permission[]): boolean {
  return required.every((permission) => granted.includes(permission));
}

/** Same checks, under the names the wider spec/vocabulary uses - not a second implementation. */
export const hasPermission = can;
export const hasAnyPermission = canAny;
export const hasAllPermissions = canAll;

/**
 * Unifies the single/any/all permission shapes a UI action typically needs
 * to check into one call - what `<Can>` is built on, and usable directly
 * wherever a component needs the same check without JSX.
 */
export function canAccessAction(
  granted: Permission[],
  required: Permission | Permission[],
  mode: 'any' | 'all' = 'any',
): boolean {
  if (typeof required === 'string') return can(granted, required);
  return mode === 'all' ? canAll(granted, required) : canAny(granted, required);
}
