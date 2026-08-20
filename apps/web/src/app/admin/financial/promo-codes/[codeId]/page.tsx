'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Can } from '@/components/auth/can';
import { useQueryFilters } from '@/hooks/use-query-filters';
import {
  useAdminCouponDetail,
  useArchiveCoupon,
  useCouponRedemptions,
} from '@/features/promotions/hooks/use-admin-coupons';
import { EditCouponDialog } from '@/features/promotions/components/edit-coupon-dialog';
import { useAdminCategories } from '@/features/catalog/hooks/use-admin-categories';
import { useCourses } from '@/features/catalog/hooks/use-courses';
import type {
  CouponRedemption,
  CouponRules,
  CouponValidityStatus,
  PromoCodeStatus,
  PromoRedemptionStatus,
} from '@/features/promotions/types/admin-promotion.types';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/format';
import { formatDate, formatDateTime } from '@/lib/date';
import { toast } from '@/lib/toast';

const PAGE_SIZE = 20;

interface UsageFilters {
  [key: string]: string | undefined;
  status: 'ALL' | PromoRedemptionStatus;
  search: string | undefined;
}

const DEFAULT_FILTERS: UsageFilters = { status: 'ALL', search: undefined };

const REDEMPTION_STATUS_OPTIONS = [
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Reserved', value: 'RESERVED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Failed', value: 'FAILED' },
];

const VALIDITY_VARIANT: Record<
  CouponValidityStatus,
  'success' | 'warning' | 'outline' | 'destructive' | 'secondary'
> = {
  ACTIVE: 'success',
  NOT_STARTED: 'warning',
  EXPIRED: 'outline',
  INACTIVE: 'secondary',
  REVOKED: 'destructive',
};

const CODE_STATUS_VARIANT: Record<
  PromoCodeStatus,
  'success' | 'warning' | 'outline' | 'destructive'
> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  EXPIRED: 'outline',
  REVOKED: 'destructive',
};

const REDEMPTION_STATUS_VARIANT: Record<
  PromoRedemptionStatus,
  'success' | 'warning' | 'outline' | 'destructive'
> = {
  CONFIRMED: 'success',
  RESERVED: 'warning',
  CANCELLED: 'outline',
  FAILED: 'destructive',
};

export default function AdminPromoCodeDetailPage() {
  const { codeId } = useParams<{ codeId: string }>();
  const couponQuery = useAdminCouponDetail(codeId);
  const archiveCoupon = useArchiveCoupon();
  const categoriesQuery = useAdminCategories({ pageSize: 100, isActive: true });
  const coursesQuery = useCourses({ pageSize: 100, sort: 'title_asc' });
  const coupon = couponQuery.data;
  const [editing, setEditing] = useState(false);

  const { filters, page, pageSize, setFilter, setPage } = useQueryFilters<UsageFilters>({
    defaults: DEFAULT_FILTERS,
    pageSize: PAGE_SIZE,
  });
  const { status, search } = filters;

  const redemptionsQuery = useCouponRedemptions(codeId, {
    page,
    pageSize,
    status: status === 'ALL' ? undefined : status,
    search: search || undefined,
  });
  const totalPages = Math.max(1, Math.ceil((redemptionsQuery.data?.total ?? 0) / pageSize));

  async function handleArchive() {
    try {
      await archiveCoupon.mutateAsync(codeId);
      toast.success('Promo code revoked');
      void couponQuery.refetch();
    } catch {
      toast.error('Could not revoke this promo code');
    }
  }

  const columns = useMemo<ColumnDef<CouponRedemption, unknown>[]>(
    () => [
      {
        accessorKey: 'studentEmail',
        header: 'Student',
        cell: ({ row }) => {
          const { studentFirstName, studentLastName, studentEmail } = row.original;
          const name = [studentFirstName, studentLastName].filter(Boolean).join(' ');
          return (
            <div>
              {name && <p className="font-medium text-foreground">{name}</p>}
              <p className="text-sm text-muted-foreground">{studentEmail}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'courseTitle',
        header: 'Course',
        cell: ({ row }) => <span className="line-clamp-2">{row.original.courseTitle}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={REDEMPTION_STATUS_VARIANT[row.original.status]}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'discountAmount',
        header: 'Discount',
        cell: ({ row }) => formatCurrency(row.original.discountAmount, row.original.currency),
      },
      {
        accessorKey: 'finalPrice',
        header: 'Paid',
        cell: ({ row }) => formatCurrency(row.original.finalPrice, row.original.currency),
      },
      {
        accessorKey: 'redeemedAt',
        header: 'Redeemed',
        cell: ({ row }) => formatDateTime(row.original.redeemedAt),
      },
      {
        accessorKey: 'transactionId',
        header: 'Transaction',
        cell: ({ row }) =>
          row.original.transactionId ? (
            <code className="text-xs">{row.original.transactionId}</code>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  );

  const startsAt = coupon?.validFrom ?? null;
  const endsAt = coupon?.validUntil ?? null;

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Financial Management', href: ROUTES.admin.financial },
          { label: 'Promo Codes', href: ROUTES.admin.financialPromoCodes },
          { label: coupon?.code ?? 'Promo code details' },
        ]}
      />
      <PageHeader
        title={coupon?.code ?? 'Promo code details'}
        actions={
          coupon && (
            <div className="flex gap-2">
              <Can permission="promotions.manage_coupons">
                <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}>
                  <Pencil className="size-4" /> Edit
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link href={ROUTES.admin.financialPromoCodes}>
                    <ArrowLeft className="size-4" /> Back to list
                  </Link>
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" /> Revoke
                    </Button>
                  }
                  title="Revoke this promo code?"
                  description="It can no longer be redeemed."
                  confirmLabel="Revoke"
                  variant="destructive"
                  onConfirm={handleArchive}
                />
              </Can>
            </div>
          )
        }
      />

      {couponQuery.isError ? (
        <ErrorState
          onRetry={() => couponQuery.refetch()}
          description="Unable to load this promo code."
        />
      ) : couponQuery.isLoading || !coupon ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-40" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={VALIDITY_VARIANT[coupon.validityStatus]}>
              {coupon.validityStatus.replaceAll('_', ' ')}
            </Badge>
            <Badge variant={CODE_STATUS_VARIANT[coupon.status]}>{coupon.status}</Badge>
            <Badge variant="outline">{coupon.codeType.replaceAll('_', ' ')}</Badge>
            {coupon.isSingleUse && <Badge variant="secondary">Single use</Badge>}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">General</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium text-foreground">
                    {coupon.codeType.replaceAll('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium text-foreground">
                    {formatDate(coupon.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Validity</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Valid from</span>
                  <span className="font-medium text-foreground">
                    {startsAt ? formatDate(startsAt) : 'Immediately'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Valid until</span>
                  <span className="font-medium text-foreground">
                    {endsAt ? formatDate(endsAt) : 'No end date'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={VALIDITY_VARIANT[coupon.validityStatus]}>
                    {coupon.validityStatus.replaceAll('_', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Usage</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Redemptions</span>
                  <span className="font-medium text-foreground">{coupon.redemptionCount}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Max users</span>
                  <span className="font-medium text-foreground">
                    {coupon.maxUsers ?? 'Unlimited'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Single use</span>
                  <span className="font-medium text-foreground">
                    {coupon.isSingleUse ? 'Yes' : 'No'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Financial</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Discount type</span>
                  <span className="font-medium text-foreground">
                    {coupon.discountType.replaceAll('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Discount value</span>
                  <span className="font-medium text-foreground">
                    {coupon.discountType === 'PERCENTAGE'
                      ? `${coupon.discountValue}%`
                      : coupon.discountType === 'FREE'
                        ? 'Free'
                        : formatCurrency(coupon.discountValue)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div>
                  <p className="mb-1 text-muted-foreground">Targeting</p>
                  <TargetingSummary
                    rules={coupon.rules}
                    categories={categoriesQuery.data?.items ?? []}
                    courses={coursesQuery.data?.items ?? []}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Usage history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FilterBar>
                <SearchBar
                  placeholder="Search student, course, transaction..."
                  defaultValue={search ?? ''}
                  onSearch={(value) => {
                    setFilter('search', value || undefined);
                    setPage(1);
                  }}
                  className="w-full sm:w-72"
                />
                <SelectFilter
                  label="Status"
                  value={status === 'ALL' ? undefined : status}
                  onChange={(value) => {
                    setFilter('status', (value ?? 'ALL') as UsageFilters['status']);
                    setPage(1);
                  }}
                  options={REDEMPTION_STATUS_OPTIONS}
                />
              </FilterBar>
              {redemptionsQuery.isError ? (
                <ErrorState
                  onRetry={() => redemptionsQuery.refetch()}
                  description="Unable to load usage history."
                />
              ) : (
                <>
                  <DataTable
                    columns={columns}
                    data={redemptionsQuery.data?.items ?? []}
                    isLoading={redemptionsQuery.isLoading}
                    emptyTitle="No redemptions yet"
                    emptyDescription="This promo code has not been used."
                    manualPagination
                  />
                  {!redemptionsQuery.isLoading &&
                    (redemptionsQuery.data?.items.length ?? 0) > 0 && (
                      <DynamicPagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        showFirstLast
                        isLoading={redemptionsQuery.isFetching}
                      />
                    )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {coupon && (
        <EditCouponDialog
          key={coupon.id}
          coupon={coupon}
          initialRules={coupon.rules}
          open={editing}
          onOpenChange={setEditing}
        />
      )}
    </ContentContainer>
  );
}

function TargetingSummary({
  rules,
  categories,
  courses,
}: {
  rules: CouponRules | null;
  categories: { id: string; name: string }[];
  courses: { id: string; title: string }[];
}) {
  const courseIds = rules?.courseIds ?? [];
  const categoryIds = rules?.categoryIds ?? [];

  if (!courseIds.length && !categoryIds.length) {
    return <p className="font-medium text-foreground">All courses</p>;
  }

  if (courseIds.length) {
    const names = courseIds
      .map((id) => courses.find((course) => course.id === id)?.title ?? id)
      .join(', ');
    return (
      <div className="space-y-1">
        <p className="font-medium text-foreground">Specific courses</p>
        <p className="text-sm text-muted-foreground">{names}</p>
      </div>
    );
  }

  const names = categoryIds
    .map((id) => categories.find((category) => category.id === id)?.name ?? id)
    .join(', ');
  return (
    <div className="space-y-1">
      <p className="font-medium text-foreground">Categories</p>
      <p className="text-sm text-muted-foreground">{names}</p>
    </div>
  );
}
