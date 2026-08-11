'use client';

import { useRouter } from 'next/navigation';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { CategoryForm, type CategoryFormValues } from '@/features/catalog/components/category-form';
import { useCreateCategory } from '@/features/catalog/hooks/use-admin-categories';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/lib/toast';

export default function AdminCategoryCreatePage() {
  const router = useRouter();
  const createCategory = useCreateCategory();

  async function handleSubmit(values: CategoryFormValues) {
    try {
      const category = await createCategory.mutateAsync({
        name: values.name.trim(),
        slug: values.slug?.trim() || undefined,
        description: values.description?.trim() || undefined,
        parentId: values.parentId || undefined,
        isActive: values.isActive,
      });
      toast.success('Category created');
      router.push(ROUTES.admin.academicsCategoryDetail(category.id));
    } catch {
      toast.error('Could not create this category', 'Check the name/slug is unique.');
    }
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Academic Management', href: ROUTES.admin.academics },
          { label: 'Categories', href: ROUTES.admin.academicsCategories },
          { label: 'New category' },
        ]}
      />
      <PageHeader title="New category" description="Add a course category." />
      <CategoryForm
        defaultValues={{ name: '', slug: '', description: '', parentId: '', isActive: true }}
        onSubmit={handleSubmit}
        isSubmitting={createCategory.isPending}
        submitLabel="Create category"
        onCancel={() => router.push(ROUTES.admin.academicsCategories)}
      />
    </ContentContainer>
  );
}
