'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ProfileMenu } from '@/components/layout/profile-menu';
import { CoursesMegaMenu } from '@/components/layout/courses-mega-menu';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';
import { useAuthStore } from '@/stores';
import { useLogout } from '@/hooks/use-logout';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { TranslationKey } from '@/lib/i18n/translations/en';
import { getPostLoginRoute } from '@/lib/authorization/user-type';
import { cn } from '@/lib/utils';

const NAV_LINKS: { key: TranslationKey; href: string }[] = [
  { key: 'nav.categories', href: ROUTES.categories.list },
  { key: 'nav.instructors', href: ROUTES.instructors.list },
  { key: 'nav.pricing', href: ROUTES.pricing },
  { key: 'nav.about', href: ROUTES.about },
  { key: 'nav.verifyCertificate', href: ROUTES.certificates.verifyLookup },
  { key: 'nav.contact', href: ROUTES.contact },
];

export function PublicHeader() {
  const { t } = useLanguage();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const sessionChecked = useAuthStore((state) => state.sessionChecked);
  const authenticated = useAuthStore((state) => state.authenticated);
  const authzStatus = useAuthStore((state) => state.authzStatus);
  const roles = useAuthStore((state) => state.roles);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = useLogout();

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
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          {!navReady ? (
            <div className="hidden items-center gap-2 sm:flex" aria-hidden="true">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-28" />
            </div>
          ) : authenticated ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href={dashboardHref}>{t('nav.dashboard')}</Link>
              </Button>
              <ProfileMenu />
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild>
                <Link href={ROUTES.auth.login}>{t('nav.signIn')}</Link>
              </Button>
              <Button asChild>
                <Link href={ROUTES.auth.register}>{t('nav.getStarted')}</Link>
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
                {t('nav.courses')}
              </Link>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                  onClick={() => setMobileOpen(false)}
                >
                  {t(link.key)}
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
                    {t('nav.dashboard')}
                  </Link>
                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={async () => {
                      if (loggingOut) return;
                      setLoggingOut(true);
                      await handleLogout();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
                  >
                    {loggingOut ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>{t('nav.signingOut')}</span>
                      </>
                    ) : (
                      <span>{t('nav.logout')}</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  <Button variant="outline" asChild>
                    <Link href={ROUTES.auth.login} onClick={() => setMobileOpen(false)}>
                      {t('nav.signIn')}
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href={ROUTES.auth.register} onClick={() => setMobileOpen(false)}>
                      {t('nav.getStarted')}
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
