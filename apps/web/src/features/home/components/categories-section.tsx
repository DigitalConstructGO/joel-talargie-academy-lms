'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryCard } from '@/features/catalog/components/category-card';
import { ROUTES } from '@/constants/routes';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { Category } from '@/features/catalog/types/catalog.types';

export function CategoriesSection({ categories }: { categories: Category[] }) {
  const { t } = useLanguage();
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('categories.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('categories.subtitle')}</p>
        </div>
        <Button variant="ghost" asChild className="hidden sm:inline-flex">
          <Link href={ROUTES.categories.list}>
            {t('categories.browseAll')}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
