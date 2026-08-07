import { ROUTES } from '@/constants/routes';

const STUDENT_ROLE_CODE = 'STUDENT';

/**
 * Every account is assigned the baseline `STUDENT` role code at
 * registration (`createStudentUser` on the backend) and it can never be
 * removed (`removeRoleFromUser` throws `STUDENT_ROLE_REQUIRED` for it) -
 * so "is this user a student" isn't "do they have the STUDENT role" (true
 * for every account, including administrators), it's "do they have ONLY
 * the STUDENT role." Any additional role - however it's named - makes the
 * account non-student staff. This is what lets a brand-new backend role
 * (however it's named) route correctly with zero frontend changes: the
 * moment a second role is assigned, this flips to `false` on its own.
 */
export function isStudent(roles: string[]): boolean {
  return roles.every((role) => role === STUDENT_ROLE_CODE);
}

/** The application area a user belongs in - used both right after login and to bounce a user out of the wrong portal. */
export function getPostLoginRoute(roles: string[]): string {
  return isStudent(roles) ? ROUTES.dashboard.root : ROUTES.admin.root;
}

/** Does this account carry the given role code, regardless of what else it carries? */
export function hasRole(roles: string[], role: string): boolean {
  return roles.includes(role);
}

/** True if `required` is empty (nothing to satisfy) or the account carries at least one of them. */
export function hasAnyRole(roles: string[], required: string[]): boolean {
  return required.length === 0 || required.some((role) => roles.includes(role));
}
