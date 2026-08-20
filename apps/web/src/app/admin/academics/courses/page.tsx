'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Loader2, MoreHorizontal, Pencil, Plus, Rocket, SearchX, Trash2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { DataTable } from '@/components/common/data-table';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { SearchBar } from '@/components/common/search-bar';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { ViewSwitcher } from '@/components/dashboard/filters/view-switcher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Can } from '@/components/auth/can';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/stores/auth.store';
import {
  useAdminCourses,
  useArchiveCourse,
  usePublishCourse,
} from '@/features/catalog/hooks/use-admin-courses';
import { useAdminCategories } from '@/features/catalog/hooks/use-admin-categories';
import { CourseThumbnail } from '@/features/catalog/components/course-thumbnail';
import { CoursesGridSkeleton } from '@/features/catalog/components/course-card-skeleton';
import type { AdminCourseSummary, CourseStatus } from '@/features/catalog/types/admin-course.types';
import type {
  CourseAccessType,
  CourseDifficulty,
  CourseSort,
} from '@/features/catalog/types/catalog.types';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/format';
import { extractErrorMessage } from '@/lib/api/api-error';
import { toast } from '@/lib/toast';

const PAGE_SIZE = 20;

interface CoursesFilters {
  [key: string]: string | undefined;
  tab: 'all' | 'my';
  status: 'ALL' | CourseStatus;
  categoryId: string | undefined;
  difficulty: 'ALL' | CourseDifficulty;
  accessType: 'ALL' | CourseAccessType;
  sort: CourseSort;
  featured: 'true' | undefined;
  search: string | undefined;
  view: 'grid' | 'list';
}

const DEFAULT_FILTERS: CoursesFilters = {
  tab: 'all',
  status: 'ALL',
  categoryId: undefined,
  difficulty: 'ALL',
  accessType: 'ALL',
  sort: 'newest',
  featured: undefined,
  search: undefined,
  view: 'list',
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
  const { status, categoryId, difficulty, accessType, sort, featured, search, tab, view } = filters;
  const archiveCourse = useArchiveCourse();
  const publishCourse = usePublishCourse();
  const categoriesQuery = useAdminCategories({ pageSize: 100, isActive: true });
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { can } = usePermissions();

  // A course can be managed by administrators, anyone with the explicit
  // `courses.manage_all` permission, or the user who created it (non-admins
  // are limited to their own courses on the backend).
  const canManageCourse = (course: AdminCourseSummary) =>
    can('courses.manage_all') || (currentUserId != null && course.createdBy === currentUserId);

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
    createdBy: tab === 'my' && currentUserId ? currentUserId : undefined,
  });

  const totalPages = Math.max(1, Math.ceil((coursesQuery.data?.total ?? 0) / pageSize));

  async function handleArchive(courseId: string) {
    try {
      await archiveCourse.mutateAsync({ courseId, input: undefined });
      toast.success('Course archived');
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not archive this course');
      toast.error('Could not archive this course', message);
    }
  }

  async function handlePublish(courseId: string) {
    try {
      await publishCourse.mutateAsync({ courseId, input: undefined });
      toast.success('Course published');
    } catch (error) {
      const message = extractErrorMessage(
        error,
        'Course is not ready to publish. Please ensure you have added curriculum sections, published lessons, and learning outcomes.',
      );
      toast.error('Could not publish this course', message);
    }
  }

  const columns = useMemo<ColumnDef<AdminCourseSummary, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Course',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.admin.academicsCourseDetail(row.original.id)}
              className="shrink-0 overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80"
            >
              <CourseThumbnail
                title={row.original.title}
                categoryName={row.original.categoryName}
                categorySlug={row.original.categorySlug}
                thumbnailKey={row.original.thumbnailKey}
                showBadge={false}
                className="h-10 w-16 rounded-none object-cover"
              />
            </Link>
            <div className="min-w-0">
              <Link
                href={ROUTES.admin.academicsCourseDetail(row.original.id)}
                className="font-medium text-foreground hover:underline line-clamp-1"
              >
                {row.original.title}
              </Link>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {row.original.categoryName} • {row.original.difficulty}
              </p>
            </div>
          </div>
        ),
      },
      { accessorKey: 'categoryName', header: 'Category' },
      { accessorKey: 'presenterName', header: 'Instructor' },
      ...(tab === 'all'
        ? [
            {
              accessorKey: 'creatorName' as const,
              header: 'Creator',
              cell: ({ row }: { row: { original: AdminCourseSummary } }) =>
                row.original.creatorName || '—',
            },
          ]
        : []),
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
                {canManageCourse(row.original) && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={ROUTES.admin.academicsCourseEdit(row.original.id)}
                      className="gap-2"
                    >
                      <Pencil className="size-4" /> Edit
                    </Link>
                  </DropdownMenuItem>
                )}
              </Can>
              {row.original.status !== 'PUBLISHED' && (
                <Can permission="courses.publish">
                  {canManageCourse(row.original) && (
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
                  )}
                </Can>
              )}
              <Can permission="courses.archive">
                {canManageCourse(row.original) && (
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
                )}
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // Re-derive columns whenever publish/archive pending state changes, so
    // the row-specific spinner reflects live mutation state.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleArchive/handlePublish are stable per render via mutation identity
    [tab, canManageCourse, publishCourse.isPending, publishCourse.variables],
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

      <Tabs
        value={tab}
        onValueChange={(value) => setFilter('tab', value as CoursesFilters['tab'])}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="all">All courses</TabsTrigger>
          <TabsTrigger value="my">My courses</TabsTrigger>
        </TabsList>
      </Tabs>

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
        <div className="ml-auto">
          <ViewSwitcher
            view={view === 'grid' ? 'grid' : 'list'}
            onChange={(next) => setFilter('view', next)}
          />
        </div>
      </FilterBar>

      {coursesQuery.isError ? (
        <ErrorState onRetry={() => coursesQuery.refetch()} description="Unable to load courses." />
      ) : (view ?? 'list') === 'grid' ? (
        <>
          {coursesQuery.isLoading ? (
            <CoursesGridSkeleton count={pageSize} view="grid" />
          ) : (coursesQuery.data?.items ?? []).length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={tab === 'my' ? 'No courses yet' : 'No courses found'}
              description={
                tab === 'my'
                  ? 'You have not created any courses yet. Use New Course to get started.'
                  : 'No courses match your filters.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {coursesQuery.data?.items.map((course) => (
                <Card
                  key={course.id}
                  className="group flex flex-col justify-between overflow-hidden transition-shadow hover:shadow-md"
                >
                  <div>
                    <div className="relative">
                      <Link href={ROUTES.admin.academicsCourseDetail(course.id)}>
                        <CourseThumbnail
                          title={course.title}
                          categoryName={course.categoryName}
                          categorySlug={course.categorySlug}
                          thumbnailKey={course.thumbnailKey}
                        />
                      </Link>
                      <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                        <Badge variant={STATUS_VARIANT[course.status]}>{course.status}</Badge>
                        {course.featured && <Badge variant="secondary">Featured</Badge>}
                      </div>
                      <div className="absolute right-2 top-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="size-8 rounded-full bg-background/80 shadow-xs backdrop-blur-sm hover:bg-background"
                              aria-label="Actions"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={ROUTES.admin.academicsCourseDetail(course.id)}
                                className="gap-2"
                              >
                                <Eye className="size-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            <Can permission="courses.update">
                              {canManageCourse(course) && (
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={ROUTES.admin.academicsCourseEdit(course.id)}
                                    className="gap-2"
                                  >
                                    <Pencil className="size-4" /> Edit
                                  </Link>
                                </DropdownMenuItem>
                              )}
                            </Can>
                            {course.status !== 'PUBLISHED' && (
                              <Can permission="courses.publish">
                                {canManageCourse(course) && (
                                  <DropdownMenuItem
                                    className="gap-2"
                                    disabled={
                                      publishCourse.isPending &&
                                      publishCourse.variables?.courseId === course.id
                                    }
                                    onSelect={(event) => {
                                      event.preventDefault();
                                      handlePublish(course.id);
                                    }}
                                  >
                                    {publishCourse.isPending &&
                                    publishCourse.variables?.courseId === course.id ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <Rocket className="size-4" />
                                    )}
                                    Publish
                                  </DropdownMenuItem>
                                )}
                              </Can>
                            )}
                            <Can permission="courses.archive">
                              {canManageCourse(course) && (
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
                                  onConfirm={() => handleArchive(course.id)}
                                />
                              )}
                            </Can>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardContent className="space-y-2 p-4">
                      <Link
                        href={ROUTES.admin.academicsCourseDetail(course.id)}
                        className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-brand"
                      >
                        {course.title}
                      </Link>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {course.shortDescription}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                        <span>by {course.presenterName || '—'}</span>
                        <span>{course.difficulty}</span>
                      </div>
                    </CardContent>
                  </div>
                  <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">
                      {course.accessType === 'FREE'
                        ? 'Free'
                        : formatCurrency(course.discountPrice ?? course.price, course.currency)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs">
                        <Link href={ROUTES.admin.academicsCourseDetail(course.id)}>
                          <Eye className="mr-1 size-3.5" /> View
                        </Link>
                      </Button>
                      <Can permission="courses.update">
                        {canManageCourse(course) && (
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs">
                            <Link href={ROUTES.admin.academicsCourseEdit(course.id)}>
                              <Pencil className="mr-1 size-3.5" /> Edit
                            </Link>
                          </Button>
                        )}
                      </Can>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
      ) : (
        <>
          <DataTable
            columns={columns}
            data={coursesQuery.data?.items ?? []}
            isLoading={coursesQuery.isLoading}
            emptyTitle={tab === 'my' ? 'No courses yet' : 'No courses found'}
            emptyDescription={
              tab === 'my'
                ? 'You have not created any courses yet. Use New Course to get started.'
                : 'No courses match your filters.'
            }
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
