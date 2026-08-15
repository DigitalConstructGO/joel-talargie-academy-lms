'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { ProfileMenu } from '@/components/layout/profile-menu';
import { CoursesMegaMenu } from '@/components/layout/courses-mega-menu';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';
import { useAuthStore } from '@/stores';
import { useLogout } from '@/hooks/use-logout';
import { getPostLoginRoute } from '@/lib/authorization/user-type';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Categories', href: ROUTES.categories.list },
  { label: 'Instructors', href: ROUTES.instructors.list },
  { label: 'Pricing', href: ROUTES.pricing },
  { label: 'About', href: ROUTES.about },
  { label: 'Verify Certificate', href: ROUTES.certificates.verifyLookup },
  { label: 'Contact', href: ROUTES.contact },
];

export function PublicHeader() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const sessionChecked = useAuthStore((state) => state.sessionChecked);
  const authenticated = useAuthStore((state) => state.authenticated);
  const authzStatus = useAuthStore((state) => state.authzStatus);
  const roles = useAuthStore((state) => state.roles);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleLogout = useLogout();

  // Never guess: while unauthenticated there's nothing to wait on: while
  // authenticated, wait for authzStatus to settle ('ready' or 'error' -
  // error still unblocks, falling back to `roles: []`, so a down
  // authorization endpoint doesn't wedge the navbar forever) before
  // deciding what "Dashboard" points to. Otherwise a non-student could
  // flash a `/dashboard` link for an instant, since `isStudent([])` is
  // vacuously true before roles load.
  const navReady =
    hasHydrated &&
    sessionChecked &&
    (!authenticated || (authzStatus !== 'loading' && authzStatus !== 'idle'));
  const dashboardHref = getPostLoginRoute(roles);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <GraduationCap className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">{siteConfig.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <CoursesMegaMenu />
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground',
                pathname === link.href && 'text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!navReady ? (
            <div className="hidden items-center gap-2 sm:flex" aria-hidden="true">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-28" />
            </div>
          ) : authenticated ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href={dashboardHref}>Dashboard</Link>
              </Button>
              <ProfileMenu />
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild>
                <Link href={ROUTES.auth.login}>Sign in</Link>
              </Button>
              <Button asChild>
                <Link href={ROUTES.auth.register}>Get started</Link>
              </Button>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col gap-1 lg:hidden">
              <SheetHeader>
                <SheetTitle>{siteConfig.name}</SheetTitle>
              </SheetHeader>
              <Link
                href={ROUTES.courses.list}
                className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                Courses
              </Link>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!navReady ? (
                <div
                  className="mt-4 flex flex-col gap-2 border-t border-border pt-4"
                  aria-hidden="true"
                >
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : authenticated ? (
                <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
                  <Link
                    href={dashboardHref}
                    className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      void handleLogout();
                    }}
                    className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  <Button variant="outline" asChild>
                    <Link href={ROUTES.auth.login} onClick={() => setMobileOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href={ROUTES.auth.register} onClick={() => setMobileOpen(false)}>
                      Get started
                    </Link>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
