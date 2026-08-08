import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-auth-gradient-from via-auth-gradient-via to-auth-gradient-to px-4 py-16">
      <div className="relative w-full max-w-md">
        <Link
          href={ROUTES.home}
          aria-label={siteConfig.name}
          className="absolute left-1/2 top-0 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-lg ring-4 ring-background"
        >
          <GraduationCap className="size-7" aria-hidden="true" />
        </Link>
        <div className="rounded-3xl border border-border bg-card p-8 pt-12 shadow-xl sm:p-10 sm:pt-14">
          {children}
        </div>
      </div>
    </main>
  );
}
