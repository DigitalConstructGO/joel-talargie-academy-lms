'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { DataTable } from '@/components/common/data-table';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { SearchBar } from '@/components/common/search-bar';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Can } from '@/components/auth/can';
import { useQueryFilters } from '@/hooks/use-query-filters';
import {
  useArchiveCategory,
  useAdminCategories,
  useReorderCategories,
} from '@/features/catalog/hooks/use-admin-categories';
import type { AdminCategory } from '@/features/catalog/types/admin-category.types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';
import { toast } from '@/lib/toast';

import { useLanguage, translateCategoryName } from '@/lib/i18n/language-provider';

const PAGE_SIZE = 20;

interface CategoriesFilters {
  [key: string]: string | undefined;
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
  search: string | undefined;
}

const DEFAULT_FILTERS: CategoriesFilters = { status: 'ALL', search: undefined };

function translateCategoryDescription(desc: string | null | undefined, locale: string): string {
  if (!desc) return '—';
  if (locale !== 'am') return desc;

  const DESC_MAP_AM: Record<string, string> = {
    'Practical AI tools, machine learning, prompt engineering, and no-code automation.':
      'ተግባራዊ የ AI መሣሪያዎች፣ ማሽን ለርኒንግ፣ ፕሮምፕት ኢንጂነሪንግ እና ኖ-ኮድ ኦቶሜሽን።',
    'This category is about cyber securiut, read team, blue team, penetartion testing':
      'ሳይበር ሴኪዩሪቲ፣ ሬድ ቲም፣ ብሉ ቲም እና ፔኔትሬሽን ቴስቲንግ።',
    'Software engineering, web development, and backend systems.':
      'ሶፍትዌር ኢንጂነሪንግ፣ ዌብ ልማት እና ባክኤንድ ሲስተሞች።',
    'Strategy, product management, and entrepreneurship.': 'ስትራቴጂ፣ ፕሮዳክት ማኔጅመንት እና ኢንተርፕረነርሺፕ።',
    'User research, interface design, prototyping, and design systems.':
      'ተጠቃሚ ምርምር፣ ኢንተርፌስ ዲዛይን፣ ፕሮቶታይፒንግ እና ዲዛይን ሲስተሞች።',
    'Python, data analysis, and machine learning fundamentals.':
      'ፓይተን፣ ዳታ አናሊሲስ እና የማሽን ለርኒንግ መሰረቶች።',
    'Digital marketing, content strategy, and social media growth.':
      'ዲጂታል ማርኬቲንግ፣ ኮንቴንት ስትራቴጂ እና ሶሻል ሚዲያ እድገት።',
  };

  return DESC_MAP_AM[desc] || desc;
}

export default function AdminCategoriesPage() {
  const { t, locale } = useLanguage();
  const { filters, page, pageSize, setFilter, setPage } = useQueryFilters<CategoriesFilters>({
    defaults: DEFAULT_FILTERS,
    pageSize: PAGE_SIZE,
  });
  const { status, search } = filters;
  const archiveCategory = useArchiveCategory();
  const reorderCategories = useReorderCategories();

  const categoriesQuery = useAdminCategories({
    page,
    pageSize,
    search: search || undefined,
    isActive: status === 'ALL' ? undefined : status === 'ACTIVE',
  });

  const statusOptions = useMemo(
    () => [
      { label: locale === 'am' ? 'ንቁ' : 'Active', value: 'ACTIVE' },
      { label: locale === 'am' ? 'የተቀመጠ' : 'Archived', value: 'INACTIVE' },
    ],
    [locale],
  );

  const totalPages = Math.max(1, Math.ceil((categoriesQuery.data?.total ?? 0) / pageSize));
  const canReorder = !search && status === 'ALL' && totalPages === 1;
  const items = categoriesQuery.data?.items ?? [];

  async function handleArchive(categoryId: string) {
    try {
      await archiveCategory.mutateAsync(categoryId);
      toast.success(locale === 'am' ? 'ምድቡ ተቀምጧል' : 'Category archived');
    } catch {
      toast.error(locale === 'am' ? 'ምድቡን ማስቀመጥ አልተቻለም' : 'Could not archive this category');
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    if (!a || !b) return;
    try {
      await reorderCategories.mutateAsync({
        items: [
          { categoryId: a.id, parentId: a.parentId, sortOrder: b.sortOrder },
          { categoryId: b.id, parentId: b.parentId, sortOrder: a.sortOrder },
        ],
      });
    } catch {
      toast.error(locale === 'am' ? 'የምድቦችን ቅደም ተከተል መቀየር አልተቻለም' : 'Could not reorder categories');
    }
  }

  const columns = useMemo<ColumnDef<AdminCategory, unknown>[]>(
    () => [
      ...(canReorder
        ? [
            {
              id: 'reorder',
              header: '',
              enableSorting: false,
              cell: ({ row }: { row: { index: number } }) => (
                <Can permission="categories.reorder">
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      aria-label="Move up"
                      disabled={row.index === 0 || reorderCategories.isPending}
                      onClick={() => handleMove(row.index, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      aria-label="Move down"
                      disabled={row.index === items.length - 1 || reorderCategories.isPending}
                      onClick={() => handleMove(row.index, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                </Can>
              ),
            } satisfies ColumnDef<AdminCategory, unknown>,
          ]
        : []),
      {
        accessorKey: 'name',
        header: locale === 'am' ? 'ስም' : 'Name',
        cell: ({ row }) => (
          <Link
            href={ROUTES.admin.academicsCategoryDetail(row.original.id)}
            className="font-medium text-foreground hover:underline"
          >
            {translateCategoryName(row.original.name, locale)}
          </Link>
        ),
      },
      {
        accessorKey: 'slug',
        header: locale === 'am' ? 'ስለግ' : 'Slug',
      },
      {
        accessorKey: 'description',
        header: locale === 'am' ? 'መግለጫ' : 'Description',
        cell: ({ row }) => translateCategoryDescription(row.original.description, locale),
      },
      {
        accessorKey: 'isActive',
        header: locale === 'am' ? 'ሁኔታ' : 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'outline'}>
            {row.original.isActive
              ? locale === 'am'
                ? 'ንቁ'
                : 'Active'
              : locale === 'am'
                ? 'የተቀመጠ'
                : 'Archived'}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: locale === 'am' ? 'የተፈጠረበት' : 'Created',
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Row actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={ROUTES.admin.academicsCategoryDetail(row.original.id)}
                  className="gap-2"
                >
                  <Eye className="size-4" /> {locale === 'am' ? 'እይ' : 'View'}
                </Link>
              </DropdownMenuItem>
              <Can permission="categories.update">
                <DropdownMenuItem asChild>
                  <Link
                    href={ROUTES.admin.academicsCategoryEdit(row.original.id)}
                    className="gap-2"
                  >
                    <Pencil className="size-4" /> {locale === 'am' ? 'አስተካክል' : 'Edit'}
                  </Link>
                </DropdownMenuItem>
              </Can>
              <Can permission="categories.archive">
                <ConfirmDialog
                  trigger={
                    <DropdownMenuItem
                      onSelect={(event) => event.preventDefault()}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" /> {locale === 'am' ? 'አስቀምጥ' : 'Archive'}
                    </DropdownMenuItem>
                  }
                  title={locale === 'am' ? 'ይህንን ምድብ ማስቀመጥ ይፈልጋሉ?' : 'Archive this category?'}
                  description={
                    locale === 'am'
                      ? 'በዚህ ምድብ ውስጥ ያሉ ኮርሶች አይጎዱም፣ ነገር ግን ከአሁን በኋላ ለአዳዲስ ኮርሶች ሊመረጥ አይችልም።'
                      : 'Courses in this category are unaffected, but it will no longer be selectable for new courses.'
                  }
                  confirmLabel={locale === 'am' ? 'አስቀምጥ' : 'Archive'}
                  variant="destructive"
                  onConfirm={() => handleArchive(row.original.id)}
                />
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canReorder, items.length, reorderCategories.isPending, t, locale],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: locale === 'am' ? 'ዳሽቦርድ' : 'Dashboard', href: ROUTES.admin.root },
          { label: locale === 'am' ? 'ትምህርት አስተዳደር' : 'Academics', href: ROUTES.admin.academics },
          { label: locale === 'am' ? 'ምድቦች' : 'Categories' },
        ]}
      />
      <PageHeader
        title={locale === 'am' ? 'ምድቦች' : 'Categories'}
        description={
          locale === 'am'
            ? 'የኮርስ ምድቦችን እና ዝርዝሮቻቸውን ያስተዳድሩ።'
            : 'Manage course categories and their details.'
        }
        actions={
          <Can permission="categories.create">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.academicsCategoryCreate}>
                <Plus className="size-4" />
                {locale === 'am' ? 'ምድብ ጨምር' : 'Add category'}
              </Link>
            </Button>
          </Can>
        }
      />

      <FilterBar>
        <SearchBar
          placeholder={locale === 'am' ? 'ምድቦችን ፈልግ...' : 'Search categories...'}
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label={locale === 'am' ? 'ሁኔታ' : 'Status'}
          value={status === 'ALL' ? undefined : status}
          onChange={(value) => setFilter('status', (value ?? 'ALL') as CategoriesFilters['status'])}
          options={statusOptions}
        />
      </FilterBar>

      {categoriesQuery.isError ? (
        <ErrorState
          onRetry={() => categoriesQuery.refetch()}
          description={locale === 'am' ? 'ምድቦችን መጫን አልተቻለም።' : 'Unable to load categories.'}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={categoriesQuery.data?.items ?? []}
            isLoading={categoriesQuery.isLoading}
            emptyTitle={locale === 'am' ? 'ምንም ምድብ አልተገኘም' : 'No categories found'}
            emptyDescription={
              locale === 'am' ? 'ከማጣሪያዎችዎ ጋር የሚዛመድ ምድብ የለም።' : 'No categories match your filters.'
            }
            manualPagination
          />
          {!categoriesQuery.isLoading && (categoriesQuery.data?.items.length ?? 0) > 0 && (
            <DynamicPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showFirstLast
              isLoading={categoriesQuery.isFetching}
            />
          )}
        </>
      )}
    </ContentContainer>
  );
}
