'use client';

import Link from 'next/link';
import { ChevronDown, Layers, ArrowRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/features/catalog/hooks/use-categories';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

import { useLanguage, translateCategoryName } from '@/lib/i18n/language-provider';

export function CoursesMegaMenu() {
  const { t, locale } = useLanguage();
  const { data, isLoading } = useCategories({ pageSize: 8 });

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground',
        )}
      >
        {t('nav.courses')}
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[420px] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('categories.title')}
        </p>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {data?.items.map((category) => (
              <Link
                key={category.id}
                href={ROUTES.categories.detail(category.slug)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:bg-accent hover:text-foreground"
              >
                <Layers className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{translateCategoryName(category.name, locale)}</span>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
          <Link
            href={ROUTES.courses.list}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-brand hover:bg-accent"
          >
            {t('featured.browseAll')}
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href={ROUTES.categories.list}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:bg-accent hover:text-foreground"
          >
            {t('categories.browseAll')}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
