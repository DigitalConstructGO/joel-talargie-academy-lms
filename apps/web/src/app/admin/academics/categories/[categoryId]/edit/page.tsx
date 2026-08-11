'use client';

import { useParams, useRouter } from 'next/navigation';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryForm, type CategoryFormValues } from '@/features/catalog/components/category-form';
import { useAdminCategory, useUpdateCategory } from '@/features/catalog/hooks/use-admin-categories';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/lib/toast';

export default function AdminCategoryEditPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const router = useRouter();
  const categoryQuery = useAdminCategory(categoryId);
  const updateCategory = useUpdateCategory();
  const category = categoryQuery.data;

  async function handleSubmit(values: CategoryFormValues) {
    try {
      await updateCategory.mutateAsync({
        categoryId,
        input: {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          parentId: values.parentId || null,
          isActive: values.isActive,
        },
      });
      toast.success('Category updated');
      router.push(ROUTES.admin.academicsCategoryDetail(categoryId));
    } catch {
      toast.error('Could not update this category');
    }
  }

  if (categoryQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Edit category" />
        <ErrorState
          onRetry={() => categoryQuery.refetch()}
          description="Unable to load this category."
        />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Academic Management', href: ROUTES.admin.academics },
          { label: 'Categories', href: ROUTES.admin.academicsCategories },
          {
            label: category?.name ?? 'Category',
            href: category ? ROUTES.admin.academicsCategoryDetail(categoryId) : undefined,
          },
          { label: 'Edit' },
        ]}
      />
      <PageHeader title="Edit category" description={category?.name} />

      {categoryQuery.isLoading || !category ? (
        <Skeleton className="h-64" />
      ) : (
        <CategoryForm
          defaultValues={{
            name: category.name,
            slug: category.slug,
            description: category.description ?? '',
            parentId: category.parentId ?? '',
            isActive: category.isActive,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateCategory.isPending}
          submitLabel="Save changes"
          onCancel={() => router.push(ROUTES.admin.academicsCategoryDetail(categoryId))}
          excludeCategoryId={categoryId}
        />
      )}
    </ContentContainer>
  );
}
