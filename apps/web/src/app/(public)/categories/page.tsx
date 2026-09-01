import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { JsonLd } from '@/components/common/json-ld';
import { buildItemListJsonLd } from '@/lib/json-ld';
import { CategoryCard } from '@/features/catalog/components/category-card';
import { listCategoriesServer } from '@/features/catalog/api/catalog.server';
import { ROUTES } from '@/constants/routes';
import { Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse courses by category.',
};

async function loadCategories() {
  try {
    return await listCategoriesServer();
  } catch {
    return { items: [], total: 0 };
  }
}

import { CategoriesPageHeader } from '@/features/catalog/components/categories-page-header';

export default async function CategoriesPage() {
  const categories = await loadCategories();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      {categories.items.length > 0 && (
        <JsonLd
          data={buildItemListJsonLd(
            categories.items.map((category) => ({
              name: category.name,
              url: ROUTES.categories.detail(category.slug),
            })),
          )}
        />
      )}
      <CategoriesPageHeader />
      {categories.items.length === 0 ? (
        <EmptyState icon={Layers} title="No categories yet" />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.items.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
