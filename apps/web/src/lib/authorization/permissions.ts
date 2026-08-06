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
