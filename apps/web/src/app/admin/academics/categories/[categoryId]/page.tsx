'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Can } from '@/components/auth/can';
import {
  useAdminCategory,
  useArchiveCategory,
} from '@/features/catalog/hooks/use-admin-categories';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';
import { toast } from '@/lib/toast';

export default function AdminCategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const router = useRouter();
  const categoryQuery = useAdminCategory(categoryId);
  const archiveCategory = useArchiveCategory();
  const category = categoryQuery.data;

  async function handleArchive() {
    try {
      await archiveCategory.mutateAsync(categoryId);
      toast.success('Category archived');
      router.push(ROUTES.admin.academicsCategories);
    } catch {
      toast.error('Could not archive this category');
    }
  }

  if (categoryQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Category details" />
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
          { label: category?.name ?? 'Category details' },
        ]}
      />
      <PageHeader
        title={category?.name ?? 'Category details'}
        description={category?.description ?? undefined}
        actions={
          category && (
            <div className="flex gap-2">
              <Can permission="categories.update">
                <Button asChild variant="outline" className="gap-2">
                  <Link href={ROUTES.admin.academicsCategoryEdit(categoryId)}>
                    <Pencil className="size-4" /> Edit
                  </Link>
                </Button>
              </Can>
              <Can permission="categories.archive">
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" /> Archive
                    </Button>
                  }
                  title="Archive this category?"
                  description="Courses in this category are unaffected, but it will no longer be selectable for new courses."
                  confirmLabel="Archive"
                  variant="destructive"
                  onConfirm={handleArchive}
                />
              </Can>
            </div>
          )
        }
      />

      {categoryQuery.isLoading || !category ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Slug</p>
                <p className="font-medium text-foreground">{category.slug}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={category.isActive ? 'success' : 'outline'}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium text-foreground">{formatDate(category.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="font-medium text-foreground">{formatDate(category.updatedAt)}</p>
              </div>
              {category.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm text-foreground">{category.description}</p>
                </div>
              )}
              {Object.keys(category.courseCounts).length > 0 && (
                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs text-muted-foreground">Courses by status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(category.courseCounts).map(([status, value]) => (
                      <Badge key={status} variant="secondary">
                        {status}: {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subcategories</CardTitle>
            </CardHeader>
            <CardContent>
              {category.children.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subcategories.</p>
              ) : (
                <ul className="space-y-2">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={ROUTES.admin.academicsCategoryDetail(child.id)}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
                      >
                        <span>{child.name}</span>
                        <Badge variant={child.isActive ? 'success' : 'outline'}>
                          {child.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </ContentContainer>
  );
}
