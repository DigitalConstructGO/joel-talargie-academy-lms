'use client';

import { useAuthBootstrap } from '@/hooks/use-auth-bootstrap';

/** Renders nothing - mounts `useAuthBootstrap()` exactly once, app-wide, from inside `AppProviders`. */
export function AuthBootstrap() {
  useAuthBootstrap();
  return null;
}
