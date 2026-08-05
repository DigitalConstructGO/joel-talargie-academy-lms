import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SearchX } from 'lucide-react';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { EmptyState } from '@/components/common/empty-state';
import { CourseCard } from '@/features/catalog/components/course-card';
import { PublicPagination } from '@/components/common/public-pagination';
import { getCategoryBySlug } from '@/features/catalog/api/catalog.server';
import { ROUTES } from '@/constants/routes';
import { DEFAULT_PAGE_SIZE } from '@/features/catalog/constants/catalog.constants';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function loadCategory(slug: string, page: number) {
  try {
    return await getCategoryBySlug(slug, page);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadCategory(slug, 1);
  if (!result) return { title: 'Category not found' };
  return {
    title: result.category.name,
    description: result.category.description ?? `Courses in ${result.category.name}`,
  };
}

export default async function CategoryDetailPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await loadCategory(slug, page);
  if (!result) notFound();

  const { category, courses } = result;
  const totalPages = Math.max(1, Math.ceil(courses.total / DEFAULT_PAGE_SIZE));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      <PageBreadcrumb
        items={[
          { label: 'Home', href: ROUTES.home },
          { label: 'Categories', href: ROUTES.categories.list },
          { label: category.name },
        ]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{category.name}</h1>
        {category.description && (
          <p className="text-sm text-muted-foreground">{category.description}</p>
        )}
      </div>

      {courses.items.length === 0 ? (
        <EmptyState icon={SearchX} title="No courses in this category yet" />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.items.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <PublicPagination
            page={page}
            totalPages={totalPages}
            basePath={ROUTES.categories.detail(slug)}
          />
        </div>
      )}
    </div>
  );
}
