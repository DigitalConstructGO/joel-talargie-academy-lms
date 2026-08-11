'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Copy, Eye, Loader2, MoreHorizontal, Pencil, Plus, Rocket, Trash2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useQueryFilters } from '@/hooks/use-query-filters';
import {
  useAdminCourses,
  useArchiveCourse,
  useDuplicateCourse,
  usePublishCourse,
} from '@/features/catalog/hooks/use-admin-courses';
import { useAdminCategories } from '@/features/catalog/hooks/use-admin-categories';
import type { AdminCourseSummary, CourseStatus } from '@/features/catalog/types/admin-course.types';
import type {
  CourseAccessType,
  CourseDifficulty,
  CourseSort,
} from '@/features/catalog/types/catalog.types';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/format';
import { toast } from '@/lib/toast';

const PAGE_SIZE = 20;

interface CoursesFilters {
  [key: string]: string | undefined;
  status: 'ALL' | CourseStatus;
  categoryId: string | undefined;
  difficulty: 'ALL' | CourseDifficulty;
  accessType: 'ALL' | CourseAccessType;
  sort: CourseSort;
  featured: 'true' | undefined;
  search: string | undefined;
}

const DEFAULT_FILTERS: CoursesFilters = {
  status: 'ALL',
  categoryId: undefined,
  difficulty: 'ALL',
  accessType: 'ALL',
  sort: 'newest',
  featured: undefined,
  search: undefined,
};

const STATUS_OPTIONS = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const DIFFICULTY_OPTIONS = [
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
  { label: 'All levels', value: 'ALL_LEVELS' },
];

const ACCESS_TYPE_OPTIONS = [
  { label: 'Free', value: 'FREE' },
  { label: 'Paid', value: 'PAID' },
];

const SORT_OPTIONS: { label: string; value: CourseSort }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Title (A-Z)', value: 'title_asc' },
  { label: 'Title (Z-A)', value: 'title_desc' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Featured', value: 'featured' },
];

const STATUS_VARIANT: Record<CourseStatus, 'secondary' | 'success' | 'outline'> = {
  DRAFT: 'secondary',
  PUBLISHED: 'success',
  ARCHIVED: 'outline',
};

export default function AdminCoursesPage() {
  const { filters, page, pageSize, setFilter, setPage } = useQueryFilters<CoursesFilters>({
    defaults: DEFAULT_FILTERS,
    pageSize: PAGE_SIZE,
  });
  const { status, categoryId, difficulty, accessType, sort, featured, search } = filters;
  const archiveCourse = useArchiveCourse();
  const publishCourse = usePublishCourse();
  const duplicateCourse = useDuplicateCourse();
  const categoriesQuery = useAdminCategories({ pageSize: 100, isActive: true });

  const coursesQuery = useAdminCourses({
    page,
    pageSize,
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
    categoryId,
    difficulty: difficulty === 'ALL' ? undefined : difficulty,
    accessType: accessType === 'ALL' ? undefined : accessType,
    sort,
    featured: featured === 'true' ? true : undefined,
  });

  const totalPages = Math.max(1, Math.ceil((coursesQuery.data?.total ?? 0) / pageSize));

  async function handleArchive(courseId: string) {
    try {
      await archiveCourse.mutateAsync({ courseId, input: undefined });
      toast.success('Course archived');
    } catch {
      toast.error('Could not archive this course');
    }
  }

  async function handlePublish(courseId: string) {
    try {
      await publishCourse.mutateAsync({ courseId, input: undefined });
      toast.success('Course published');
    } catch {
      toast.error(
        'Could not publish this course',
        'Check the course has at least one section and lesson.',
      );
    }
  }

  async function handleDuplicate(courseId: string) {
    try {
      await duplicateCourse.mutateAsync({ courseId, input: {} });
      toast.success('Course duplicated');
    } catch {
      toast.error('Could not duplicate this course');
    }
  }

  const columns = useMemo<ColumnDef<AdminCourseSummary, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <Link
            href={ROUTES.admin.academicsCourseDetail(row.original.id)}
            className="font-medium text-foreground hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      { accessorKey: 'categoryName', header: 'Category' },
      { accessorKey: 'presenterName', header: 'Instructor' },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) =>
          row.original.accessType === 'FREE'
            ? 'Free'
            : formatCurrency(row.original.price, row.original.currency),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>
        ),
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
                <Link href={ROUTES.admin.academicsCourseDetail(row.original.id)} className="gap-2">
                  <Eye className="size-4" /> View
                </Link>
              </DropdownMenuItem>
              <Can permission="courses.update">
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.admin.academicsCourseEdit(row.original.id)} className="gap-2">
                    <Pencil className="size-4" /> Edit
                  </Link>
                </DropdownMenuItem>
              </Can>
              {row.original.status !== 'PUBLISHED' && (
                <Can permission="courses.publish">
                  <DropdownMenuItem
                    className="gap-2"
                    disabled={
                      publishCourse.isPending &&
                      publishCourse.variables?.courseId === row.original.id
                    }
                    onSelect={(event) => {
                      event.preventDefault();
                      handlePublish(row.original.id);
                    }}
                  >
                    {publishCourse.isPending &&
                    publishCourse.variables?.courseId === row.original.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Rocket className="size-4" />
                    )}
                    Publish
                  </DropdownMenuItem>
                </Can>
              )}
              <Can permission="courses.duplicate">
                <DropdownMenuItem
                  className="gap-2"
                  disabled={
                    duplicateCourse.isPending &&
                    duplicateCourse.variables?.courseId === row.original.id
                  }
                  onSelect={(event) => {
                    event.preventDefault();
                    handleDuplicate(row.original.id);
                  }}
                >
                  {duplicateCourse.isPending &&
                  duplicateCourse.variables?.courseId === row.original.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  Duplicate
                </DropdownMenuItem>
              </Can>
              <Can permission="courses.archive">
                <ConfirmDialog
                  trigger={
                    <DropdownMenuItem
                      onSelect={(event) => event.preventDefault()}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" /> Archive
                    </DropdownMenuItem>
                  }
                  title="Archive this course?"
                  description="Students already enrolled keep their access. The course is hidden from the catalog."
                  confirmLabel="Archive"
                  variant="destructive"
                  onConfirm={() => handleArchive(row.original.id)}
                />
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // Re-derive columns whenever publish/duplicate pending state changes, so
    // the row-specific spinner reflects live mutation state.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleArchive/handlePublish/handleDuplicate are stable per render via mutation identity
    [
      publishCourse.isPending,
      publishCourse.variables,
      duplicateCourse.isPending,
      duplicateCourse.variables,
    ],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Academic Management', href: ROUTES.admin.academics },
          { label: 'Courses' },
        ]}
      />
      <PageHeader
        title="Courses"
        description="Manage the course catalog."
        actions={
          <Can permission="courses.create">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.academicsCourseCreate}>
                <Plus className="size-4" />
                New Course
              </Link>
            </Button>
          </Can>
        }
      />

      <FilterBar>
        <SearchBar
          placeholder="Search courses..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label="Status"
          value={status === 'ALL' ? undefined : status}
          onChange={(value) => setFilter('status', (value ?? 'ALL') as CoursesFilters['status'])}
          options={STATUS_OPTIONS}
        />
        <SelectFilter
          label="Category"
          value={categoryId}
          onChange={(value) => setFilter('categoryId', value)}
          options={(categoriesQuery.data?.items ?? []).map((category) => ({
            label: category.name,
            value: category.id,
          }))}
        />
        <SelectFilter
          label="Level"
          value={difficulty === 'ALL' ? undefined : difficulty}
          onChange={(value) =>
            setFilter('difficulty', (value ?? 'ALL') as CoursesFilters['difficulty'])
          }
          options={DIFFICULTY_OPTIONS}
        />
        <SelectFilter
          label="Access"
          value={accessType === 'ALL' ? undefined : accessType}
          onChange={(value) =>
            setFilter('accessType', (value ?? 'ALL') as CoursesFilters['accessType'])
          }
          options={ACCESS_TYPE_OPTIONS}
        />
        <SelectFilter
          label="Sort"
          value={sort}
          onChange={(value) => setFilter('sort', (value ?? 'newest') as CourseSort)}
          options={SORT_OPTIONS}
        />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={featured === 'true'}
            onCheckedChange={(checked) => setFilter('featured', checked ? 'true' : undefined)}
          />
          Featured only
        </label>
      </FilterBar>

      {coursesQuery.isError ? (
        <ErrorState onRetry={() => coursesQuery.refetch()} description="Unable to load courses." />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={coursesQuery.data?.items ?? []}
            isLoading={coursesQuery.isLoading}
            emptyTitle="No courses found"
            emptyDescription="No courses match your filters."
            manualPagination
          />
          {!coursesQuery.isLoading && (coursesQuery.data?.items.length ?? 0) > 0 && (
            <DynamicPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showFirstLast
              isLoading={coursesQuery.isFetching}
            />
          )}
        </>
      )}
    </ContentContainer>
  );
}
