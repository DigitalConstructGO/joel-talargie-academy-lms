'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  useAdminCoupons,
  useArchiveCoupon,
  useCreateCoupon,
} from '@/features/promotions/hooks/use-admin-coupons';
import {
  CouponTargetingFields,
  type CouponTargetType,
} from '@/features/promotions/components/coupon-targeting-fields';
import { EditCouponDialog } from '@/features/promotions/components/edit-coupon-dialog';
import type {
  Coupon,
  PromoCodeStatus,
  PromoCodeType,
  PromoDiscountType,
} from '@/features/promotions/types/admin-promotion.types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';
import { formatCurrency } from '@/lib/format';
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

const CREATE_STATUS_OPTIONS: { label: string; value: PromoCodeStatus }[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Paused', value: 'PAUSED' },
];

const DISCOUNT_TYPE_OPTIONS: { label: string; value: PromoDiscountType }[] = [
  { label: 'Percentage', value: 'PERCENTAGE' },
  { label: 'Fixed amount', value: 'FIXED' },
  { label: 'Free', value: 'FREE' },
];

function generatePromoCode(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PROMO-${random}`;
}

function CreateCouponDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<PromoCodeStatus>('ACTIVE');
  const [discountType, setDiscountType] = useState<PromoDiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [maxUsers, setMaxUsers] = useState('');
  const [isSingleUse, setIsSingleUse] = useState(false);
  const [targetType, setTargetType] = useState<CouponTargetType>('ALL');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const createCoupon = useCreateCoupon();

  function handleTargetTypeChange(value: CouponTargetType) {
    setTargetType(value);
    if (value === 'CATEGORIES') setSelectedCourseIds([]);
    if (value === 'COURSES') setSelectedCategoryIds([]);
    if (value === 'ALL') {
      setSelectedCourseIds([]);
      setSelectedCategoryIds([]);
    }
  }

  function resetForm() {
    setCode('');
    setStatus('ACTIVE');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setValidFrom('');
    setValidUntil('');
    setMaxUsers('');
    setIsSingleUse(false);
    setTargetType('ALL');
    setSelectedCategoryIds([]);
    setSelectedCourseIds([]);
    setError('');
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (discountType !== 'FREE' && !discountValue.trim()) {
      setError('Enter a discount value.');
      return;
    }
    const finalCode = code.trim() || generatePromoCode();
    try {
      await createCoupon.mutateAsync({
        code: finalCode,
        status,
        discountType,
        discountValue: Number(discountValue) || 0,
        validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        maxUsers: maxUsers.trim() ? Number(maxUsers) : undefined,
        isSingleUse,
        courseIds: selectedCourseIds.length ? selectedCourseIds : undefined,
        categoryIds: selectedCategoryIds.length ? selectedCategoryIds : undefined,
      });
      toast.success(`Promo code ${finalCode} created`);
      setOpen(false);
      resetForm();
    } catch {
      setError('Could not create this promo code. The code may already be in use.');
    }
  }

  const isPending = createCoupon.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <Can permission="promotions.manage_coupons">
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New promo code
        </Button>
      </Can>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New promo code</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-code">Code (optional - auto-generated if empty)</Label>
              <Input
                id="create-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as PromoCodeStatus)}>
                <SelectTrigger id="create-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREATE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-discount-type">Discount type</Label>
              <Select
                value={discountType}
                onValueChange={(value) => setDiscountType(value as PromoDiscountType)}
              >
                <SelectTrigger id="create-discount-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {discountType === 'FREE' ? (
              <div className="space-y-2">
                <Label htmlFor="create-discount-value">Discount value</Label>
                <Input id="create-discount-value" value="100% off" disabled />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="create-discount-value">
                  Discount value {discountType === 'PERCENTAGE' ? '(%)' : '(amount)'}
                </Label>
                <Input
                  id="create-discount-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-valid-from">Valid from (blank = immediately)</Label>
              <Input
                id="create-valid-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-valid-until">Valid until (blank = never)</Label>
              <Input
                id="create-valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-max-users">Max users (blank = unlimited)</Label>
            <Input
              id="create-max-users"
              type="number"
              min="1"
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Limit the code to the first N students who use it (e.g. 50 for a &quot;first 50&quot;
              offer).
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
            <Checkbox
              id="create-single-use"
              checked={isSingleUse}
              onCheckedChange={(checked) => setIsSingleUse(Boolean(checked))}
            />
            <div>
              <Label htmlFor="create-single-use" className="font-medium">
                Single use
              </Label>
              <p className="text-xs text-muted-foreground">
                Each student can redeem this code once.
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Targeting</Label>
            <p className="text-sm text-muted-foreground">
              Choose which courses this promo code applies to.
            </p>
          </div>
          <CouponTargetingFields
            targetType={targetType}
            onTargetTypeChange={handleTargetTypeChange}
            selectedCategoryIds={selectedCategoryIds}
            onCategoryIdsChange={setSelectedCategoryIds}
            selectedCourseIds={selectedCourseIds}
            onCourseIdsChange={setSelectedCourseIds}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create promo code
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPromoCodesPage() {
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
        accessorKey: 'discountValue',
        header: 'Discount',
        cell: ({ row }) => {
          const coupon = row.original;
          if (coupon.discountType === 'FREE') return 'Free';
          if (coupon.discountType === 'PERCENTAGE') return `${Number(coupon.discountValue)}%`;
          return formatCurrency(coupon.discountValue);
        },
      },
      {
        accessorKey: 'redemptionCount',
        header: 'Used',
        cell: ({ row }) => `${row.original.redemptionCount}`,
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
              <DropdownMenuItem asChild className="gap-2">
                <Link href={ROUTES.admin.financialPromoCodeDetail(row.original.id)}>
                  <Eye className="size-4" /> View
                </Link>
              </DropdownMenuItem>
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
        description="Discount codes for student purchases."
        actions={
          <div className="flex gap-2">
            <CreateCouponDialog />
          </div>
        }
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
