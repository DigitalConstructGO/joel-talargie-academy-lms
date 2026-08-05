import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { CategoryCard } from '@/features/catalog/components/category-card';
import { listCategoriesServer } from '@/features/catalog/api/catalog.server';
import { Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse courses by category.',
};

export default async function CategoriesPage() {
  const categories = await listCategoriesServer();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      <PageHeader title="Categories" description="Find courses organized by subject area." />
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
