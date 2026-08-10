'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader2, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Can } from '@/components/auth/can';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useAdminCampaigns } from '@/features/promotions/hooks/use-admin-campaigns';
import {
  useAdminCoupons,
  useArchiveCoupon,
  useCreateCoupon,
  useGenerateCoupons,
  useUpdateCoupon,
} from '@/features/promotions/hooks/use-admin-coupons';
import type {
  Coupon,
  PromoCodeStatus,
  PromoCodeType,
} from '@/features/promotions/types/admin-promotion.types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';
import { toast } from '@/lib/toast';

const PAGE_SIZE = 20;

interface CouponsFilters {
  [key: string]: string | undefined;
  status: 'ALL' | PromoCodeStatus;
  codeType: 'ALL' | PromoCodeType;
  search: string | undefined;
}

const DEFAULT_FILTERS: CouponsFilters = { status: 'ALL', codeType: 'ALL', search: undefined };

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Revoked', value: 'REVOKED' },
];

const CODE_TYPE_OPTIONS = [
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Referral', value: 'REFERRAL' },
  { label: 'Affiliate', value: 'AFFILIATE' },
  { label: 'Corporate', value: 'CORPORATE' },
  { label: 'University partner', value: 'UNIVERSITY_PARTNER' },
  { label: 'System generated', value: 'SYSTEM_GENERATED' },
];

const STATUS_VARIANT: Record<PromoCodeStatus, 'success' | 'warning' | 'outline' | 'destructive'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  EXPIRED: 'outline',
  REVOKED: 'destructive',
};

function CreateCouponDialog({ campaignId }: { campaignId: string | undefined }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId ?? '');
  const [code, setCode] = useState('');
  const [count, setCount] = useState('10');
  const [prefix, setPrefix] = useState('');
  const campaignsQuery = useAdminCampaigns({ pageSize: 100 });
  const createCoupon = useCreateCoupon();
  const generateCoupons = useGenerateCoupons();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCampaignId) return;
    try {
      if (mode === 'single') {
        await createCoupon.mutateAsync({
          campaignId: selectedCampaignId,
          code: code.trim() || undefined,
        });
        toast.success('Promo code created');
      } else {
        await generateCoupons.mutateAsync({
          campaignId: selectedCampaignId,
          count: Number(count),
          prefix: prefix.trim() || undefined,
        });
        toast.success(`${count} promo codes generated`);
      }
      setCode('');
      setOpen(false);
    } catch {
      toast.error('Could not create promo code(s)');
    }
  }

  const isPending = createCoupon.isPending || generateCoupons.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Can permission="promotions.manage_coupons">
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New promo code
        </Button>
      </Can>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New promo code</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign</Label>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger id="campaign">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {(campaignsQuery.data?.items ?? []).map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('single')}
            >
              Single code
            </Button>
            <Can permission="promotions.generate_coupons">
              <Button
                type="button"
                variant={mode === 'bulk' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setMode('bulk')}
              >
                <Sparkles className="size-3.5" /> Bulk generate
              </Button>
            </Can>
          </div>
          {mode === 'single' ? (
            <div className="space-y-2">
              <Label htmlFor="code">Code (optional - auto-generated if empty)</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="count">Count</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix (optional)</Label>
                <Input
                  id="prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!selectedCampaignId || isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {mode === 'single' ? 'Create code' : 'Generate codes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The backend has no single-coupon detail endpoint (`GET /promotions/coupons/:id`
 * doesn't exist - confirmed against the real controller), so this edits the
 * row data already fetched by the list query rather than a separate `/edit`
 * route that would have nothing to fetch on direct navigation/refresh.
 */
function EditCouponDialog({
  coupon,
  open,
  onOpenChange,
}: {
  coupon: Coupon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatus] = useState<PromoCodeStatus>(coupon.status);
  const [maxRedemptions, setMaxRedemptions] = useState(coupon.maxRedemptions?.toString() ?? '');
  const [maxRedemptionsPerUser, setMaxRedemptionsPerUser] = useState(
    coupon.maxRedemptionsPerUser?.toString() ?? '',
  );
  const [validFrom, setValidFrom] = useState(coupon.validFrom?.slice(0, 10) ?? '');
  const [validUntil, setValidUntil] = useState(coupon.validUntil?.slice(0, 10) ?? '');
  const updateCoupon = useUpdateCoupon();

  // Re-seed local state whenever a different coupon is opened for editing -
  // this dialog is remounted per-row (see `key={coupon.id}` at the call
  // site) so this only guards against the same row being reopened.
  useEffect(() => {
    setStatus(coupon.status);
    setMaxRedemptions(coupon.maxRedemptions?.toString() ?? '');
    setMaxRedemptionsPerUser(coupon.maxRedemptionsPerUser?.toString() ?? '');
    setValidFrom(coupon.validFrom?.slice(0, 10) ?? '');
    setValidUntil(coupon.validUntil?.slice(0, 10) ?? '');
  }, [coupon]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await updateCoupon.mutateAsync({
        couponId: coupon.id,
        input: {
          status,
          maxRedemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
          maxRedemptionsPerUser: maxRedemptionsPerUser.trim()
            ? Number(maxRedemptionsPerUser)
            : null,
          validFrom: validFrom ? new Date(validFrom).toISOString() : null,
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        },
      });
      toast.success('Promo code updated');
      onOpenChange(false);
    } catch {
      toast.error('Could not update this promo code');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit <code>{coupon.code}</code>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as PromoCodeStatus)}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-max-redemptions">Max redemptions (blank = unlimited)</Label>
              <Input
                id="edit-max-redemptions"
                type="number"
                min="0"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max-per-user">Max per user (blank = unlimited)</Label>
              <Input
                id="edit-max-per-user"
                type="number"
                min="0"
                value={maxRedemptionsPerUser}
                onChange={(e) => setMaxRedemptionsPerUser(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-valid-from">Valid from (blank = immediately)</Label>
              <Input
                id="edit-valid-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-valid-until">Valid until (blank = never)</Label>
              <Input
                id="edit-valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateCoupon.isPending}>
              {updateCoupon.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPromoCodesPage() {
  const searchParams = useSearchParams();
  const campaignIdFilter = searchParams.get('campaignId') ?? undefined;
  const { filters, page, pageSize, setFilter, setPage } = useQueryFilters<CouponsFilters>({
    defaults: DEFAULT_FILTERS,
    pageSize: PAGE_SIZE,
  });
  const { status, codeType, search } = filters;
  const archiveCoupon = useArchiveCoupon();
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const couponsQuery = useAdminCoupons({
    page,
    pageSize,
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
    codeType: codeType === 'ALL' ? undefined : codeType,
    campaignId: campaignIdFilter,
  });

  const totalPages = Math.max(1, Math.ceil((couponsQuery.data?.total ?? 0) / pageSize));

  async function handleArchive(couponId: string) {
    try {
      await archiveCoupon.mutateAsync(couponId);
      toast.success('Promo code revoked');
    } catch {
      toast.error('Could not revoke this promo code');
    }
  }

  const columns = useMemo<ColumnDef<Coupon, unknown>[]>(
    () => [
      { accessorKey: 'code', header: 'Code', cell: ({ row }) => <code>{row.original.code}</code> },
      { accessorKey: 'codeType', header: 'Type' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>
        ),
      },
      {
        accessorKey: 'redemptionCount',
        header: 'Used',
        cell: ({ row }) =>
          `${row.original.redemptionCount}${row.original.maxRedemptions ? ` / ${row.original.maxRedemptions}` : ''}`,
      },
      {
        accessorKey: 'validUntil',
        header: 'Expires',
        cell: ({ row }) =>
          row.original.validUntil ? formatDate(row.original.validUntil) : 'Never',
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
              <Can permission="promotions.manage_coupons">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setEditingCoupon(row.original);
                  }}
                  className="gap-2"
                >
                  <Pencil className="size-4" /> Edit
                </DropdownMenuItem>
                <ConfirmDialog
                  trigger={
                    <DropdownMenuItem
                      onSelect={(event) => event.preventDefault()}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" /> Revoke
                    </DropdownMenuItem>
                  }
                  title="Revoke this promo code?"
                  description="It can no longer be redeemed."
                  confirmLabel="Revoke"
                  variant="destructive"
                  onConfirm={() => handleArchive(row.original.id)}
                />
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleArchive is stable per render via archiveCoupon mutation identity
    [],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Financial Management', href: ROUTES.admin.financial },
          { label: 'Promo Codes' },
        ]}
      />
      <PageHeader
        title="Promo Codes"
        description="Coupon codes generated under your campaigns."
        actions={<CreateCouponDialog campaignId={campaignIdFilter} />}
      />

      <FilterBar>
        <SearchBar
          placeholder="Search codes..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label="Status"
          value={status === 'ALL' ? undefined : status}
          onChange={(value) => setFilter('status', (value ?? 'ALL') as CouponsFilters['status'])}
          options={STATUS_OPTIONS}
        />
        <SelectFilter
          label="Type"
          value={codeType === 'ALL' ? undefined : codeType}
          onChange={(value) =>
            setFilter('codeType', (value ?? 'ALL') as CouponsFilters['codeType'])
          }
          options={CODE_TYPE_OPTIONS}
        />
      </FilterBar>

      {couponsQuery.isError ? (
        <ErrorState
          onRetry={() => couponsQuery.refetch()}
          description="Unable to load promo codes."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={couponsQuery.data?.items ?? []}
            isLoading={couponsQuery.isLoading}
            emptyTitle="No promo codes found"
            emptyDescription="No promo codes match your filters."
            manualPagination
          />
          {!couponsQuery.isLoading && (couponsQuery.data?.items.length ?? 0) > 0 && (
            <DynamicPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showFirstLast
              isLoading={couponsQuery.isFetching}
            />
          )}
        </>
      )}

      {editingCoupon && (
        <EditCouponDialog
          key={editingCoupon.id}
          coupon={editingCoupon}
          open={Boolean(editingCoupon)}
          onOpenChange={(open) => !open && setEditingCoupon(null)}
        />
      )}
    </ContentContainer>
  );
}
