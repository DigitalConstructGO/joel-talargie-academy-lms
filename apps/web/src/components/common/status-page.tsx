import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export interface StatusPageProps {
  icon: LucideIcon;
  code?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function StatusPage({ icon: Icon, code, title, description, action }: StatusPageProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
      </span>
      {code && (
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {code}
        </p>
      )}
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        {action}
        <Button variant="outline" asChild>
          <Link href={ROUTES.home}>Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
