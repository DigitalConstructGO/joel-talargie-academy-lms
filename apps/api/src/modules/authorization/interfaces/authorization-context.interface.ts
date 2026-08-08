import type { AuthorizationContext } from '@joel-academy/database';
export type { AuthorizationContext };
export type AuthorizedRequest = {
  user?: { id: string };
  authorization?: AuthorizationContext;
  ip?: string;
  get(name: string): string | undefined;
};
