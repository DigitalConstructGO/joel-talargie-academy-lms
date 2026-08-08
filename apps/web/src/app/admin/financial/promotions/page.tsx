'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { DataTable } from '@/components/common/data-table';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { SearchBar } from '@/components/common/search-bar';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { FilterChips } from '@/components/dashboard/filters/filter-chips';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Can } from '@/components/auth/can';
import { useQueryFilters } from '@/hooks/use-query-filters';
import {
  useAdminCampaigns,
  useArchiveCampaign,
} from '@/features/promotions/hooks/use-admin-campaigns';
import type {
  Campaign,
  PromoCampaignStatus,
  PromoCampaignType,
} from '@/features/promotions/types/admin-promotion.types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';
import { toast } from '@/lib/toast';

const PAGE_SIZE = 20;

interface CampaignsFilters {
  [key: string]: string | undefined;
  status: 'ALL' | PromoCampaignStatus;
  type: 'ALL' | PromoCampaignType;
  isAutomatic: 'true' | undefined;
  search: string | undefined;
}

const DEFAULT_FILTERS: CampaignsFilters = {
  status: 'ALL',
  type: 'ALL',
  isAutomatic: undefined,
  search: undefined,
};

const STATUS_OPTIONS = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const TYPE_OPTIONS = [
  { label: 'Percentage discount', value: 'PERCENTAGE_DISCOUNT' },
  { label: 'Fixed discount', value: 'FIXED_DISCOUNT' },
  { label: 'Free course', value: 'FREE_COURSE' },
  { label: 'Scholarship', value: 'SCHOLARSHIP' },
  { label: 'Bundle discount', value: 'BUNDLE_DISCOUNT' },
  { label: 'Referral reward', value: 'REFERRAL_REWARD' },
  { label: 'Affiliate discount', value: 'AFFILIATE_DISCOUNT' },
  { label: 'Corporate discount', value: 'CORPORATE_DISCOUNT' },
  { label: 'Partner discount', value: 'PARTNER_DISCOUNT' },
  { label: 'Event promotion', value: 'EVENT_PROMOTION' },
  { label: 'Flash sale', value: 'FLASH_SALE' },
  { label: 'Seasonal promotion', value: 'SEASONAL_PROMOTION' },
  { label: 'First student discount', value: 'FIRST_STUDENT_DISCOUNT' },
  { label: 'Birthday coupon', value: 'BIRTHDAY_COUPON' },
  { label: 'Manual coupon', value: 'MANUAL_COUPON' },
  { label: 'Automatic promotion', value: 'AUTOMATIC_PROMOTION' },
];

const STATUS_VARIANT: Record<PromoCampaignStatus, 'secondary' | 'success' | 'warning' | 'outline'> =
  {
    DRAFT: 'secondary',
    ACTIVE: 'success',
    PAUSED: 'warning',
    EXPIRED: 'outline',
    ARCHIVED: 'outline',
  };

export default function AdminCampaignsPage() {
  const { filters, page, pageSize, setFilter, resetFilters, setPage } =
    useQueryFilters<CampaignsFilters>({
      defaults: DEFAULT_FILTERS,
      pageSize: PAGE_SIZE,
    });
  const { status, type, isAutomatic, search } = filters;
  const archiveCampaign = useArchiveCampaign();
  const hasActiveFilters =
    status !== 'ALL' || type !== 'ALL' || Boolean(isAutomatic) || Boolean(search);

  const campaignsQuery = useAdminCampaigns({
    page,
    pageSize,
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
    type: type === 'ALL' ? undefined : type,
    isAutomatic: isAutomatic === 'true' || undefined,
  });

  const totalPages = Math.max(1, Math.ceil((campaignsQuery.data?.total ?? 0) / pageSize));

  async function handleArchive(campaignId: string) {
    try {
      await archiveCampaign.mutateAsync(campaignId);
      toast.success('Campaign archived');
    } catch {
      toast.error('Could not archive this campaign');
    }
  }

  const columns = useMemo<ColumnDef<Campaign, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={ROUTES.admin.financialPromotionDetail(row.original.id)}
            className="font-medium text-foreground hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      { accessorKey: 'type', header: 'Type' },
      {
        accessorKey: 'discountValue',
        header: 'Discount',
        cell: ({ row }) =>
          row.original.discountType === 'PERCENTAGE'
            ? `${row.original.discountValue}%`
            : row.original.discountType === 'FREE'
              ? 'Free'
              : row.original.discountValue,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>
        ),
      },
      { accessorKey: 'redemptionCount', header: 'Redemptions' },
      {
        accessorKey: 'startsAt',
        header: 'Starts',
        cell: ({ row }) => formatDate(row.original.startsAt),
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
                  href={ROUTES.admin.financialPromotionDetail(row.original.id)}
                  className="gap-2"
                >
                  <Eye className="size-4" /> View
                </Link>
              </DropdownMenuItem>
              <Can permission="promotions.update">
                <DropdownMenuItem asChild>
                  <Link
                    href={ROUTES.admin.financialPromotionEdit(row.original.id)}
                    className="gap-2"
                  >
                    <Pencil className="size-4" /> Edit
                  </Link>
                </DropdownMenuItem>
              </Can>
              <Can permission="promotions.archive">
                <ConfirmDialog
                  trigger={
                    <DropdownMenuItem
                      onSelect={(event) => event.preventDefault()}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" /> Archive
                    </DropdownMenuItem>
                  }
                  title="Archive this campaign?"
                  description="Its coupons will no longer be redeemable."
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleArchive is stable per render via archiveCampaign mutation identity
    [],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Financial Management', href: ROUTES.admin.financial },
          { label: 'Campaigns' },
        ]}
      />
      <PageHeader
        title="Campaigns"
        description="Manage promotional campaigns and their discount rules."
        actions={
          <Can permission="promotions.create">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.financialPromotionCreate}>
                <Plus className="size-4" />
                New Campaign
              </Link>
            </Button>
          </Can>
        }
      />

      <FilterBar
        chips={
          hasActiveFilters ? (
            <FilterChips
              chips={[
                ...(status !== 'ALL' ? [{ key: 'status', label: status }] : []),
                ...(type !== 'ALL'
                  ? [
                      {
                        key: 'type',
                        label: TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type,
                      },
                    ]
                  : []),
                ...(isAutomatic ? [{ key: 'isAutomatic', label: 'Automatic only' }] : []),
                ...(search ? [{ key: 'search', label: `"${search}"` }] : []),
              ]}
              onRemove={(key) => {
                if (key === 'status') setFilter('status', 'ALL');
                if (key === 'type') setFilter('type', 'ALL');
                if (key === 'isAutomatic') setFilter('isAutomatic', undefined);
                if (key === 'search') setFilter('search', undefined);
              }}
              onResetAll={resetFilters}
            />
          ) : undefined
        }
      >
        <SearchBar
          placeholder="Search campaigns..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label="Status"
          value={status === 'ALL' ? undefined : status}
          onChange={(value) => setFilter('status', (value ?? 'ALL') as CampaignsFilters['status'])}
          options={STATUS_OPTIONS}
        />
        <SelectFilter
          label="Type"
          value={type === 'ALL' ? undefined : type}
          onChange={(value) => setFilter('type', (value ?? 'ALL') as CampaignsFilters['type'])}
          options={TYPE_OPTIONS}
        />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={isAutomatic === 'true'}
            onCheckedChange={(checked) => setFilter('isAutomatic', checked ? 'true' : undefined)}
          />
          Automatic only
        </label>
      </FilterBar>

      {campaignsQuery.isError ? (
        <ErrorState
          onRetry={() => campaignsQuery.refetch()}
          description="Unable to load campaigns."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={campaignsQuery.data?.items ?? []}
            isLoading={campaignsQuery.isLoading}
            emptyTitle="No campaigns found"
            emptyDescription="No campaigns match your filters."
            manualPagination
          />
          {!campaignsQuery.isLoading && (campaignsQuery.data?.items.length ?? 0) > 0 && (
            <DynamicPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showFirstLast
            />
          )}
        </>
      )}
    </ContentContainer>
  );
}
