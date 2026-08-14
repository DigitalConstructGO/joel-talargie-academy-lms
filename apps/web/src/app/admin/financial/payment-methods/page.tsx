'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, Pencil, Plus, Smartphone, Wallet, Wrench } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { SearchBar } from '@/components/common/search-bar';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { FilterChips } from '@/components/dashboard/filters/filter-chips';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { TableSkeleton } from '@/components/dashboard/skeletons/table-skeleton';
import { Can } from '@/components/auth/can';
import { useQueryFilters } from '@/hooks/use-query-filters';
import {
  usePaymentMethods,
  useSetPaymentMethodStatus,
} from '@/features/payment-methods/hooks/use-payment-methods';
import type { PaymentMethodType } from '@/features/payment-methods/types/payment-method.types';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';

const PAGE_SIZE = 20;

interface MethodFilters {
  [key: string]: string | undefined;
  type: 'ALL' | PaymentMethodType;
  isActive: 'true' | 'false' | undefined;
  search: string | undefined;
}

const DEFAULT_FILTERS: MethodFilters = { type: 'ALL', isActive: undefined, search: undefined };

const TYPE_OPTIONS = [
  { label: 'Mobile money', value: 'MOBILE_MONEY' },
  { label: 'Bank transfer', value: 'BANK_TRANSFER' },
  { label: 'Card', value: 'CARD' },
  { label: 'Other', value: 'OTHER' },
];

const TYPE_ICONS: Record<PaymentMethodType, typeof Smartphone> = {
  MOBILE_MONEY: Smartphone,
  BANK_TRANSFER: Landmark,
  CARD: Wallet,
  OTHER: Wrench,
};

export default function AdminPaymentMethodsPage() {
  const router = useRouter();
  const { filters, page, pageSize, setFilter, setPage, resetFilters } =
    useQueryFilters<MethodFilters>({ defaults: DEFAULT_FILTERS, pageSize: PAGE_SIZE });
  const { type, isActive, search } = filters;
  const [statusBusy, setStatusBusy] = useState<string | null>(null);
  const setStatus = useSetPaymentMethodStatus();

  const methodsQuery = usePaymentMethods({
    page,
    pageSize,
    type: type === 'ALL' ? undefined : type,
    isActive: isActive === undefined ? undefined : isActive === 'true',
    search: search || undefined,
  });

  const totalPages = Math.max(1, Math.ceil((methodsQuery.data?.total ?? 0) / pageSize));
  const hasActiveFilters = type !== 'ALL' || isActive !== undefined || Boolean(search);

  async function handleToggleActive(id: string, current: boolean) {
    setStatusBusy(id);
    try {
      await setStatus.mutateAsync({ paymentMethodId: id, isActive: !current });
      toast.success(current ? 'Payment method deactivated' : 'Payment method activated');
    } catch {
      toast.error('Could not update this payment method');
    } finally {
      setStatusBusy(null);
    }
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Financial Management', href: ROUTES.admin.financial },
          { label: 'Payment Methods' },
        ]}
      />
      <PageHeader
        title="Payment Methods"
        description="Configure how students can pay at checkout."
        actions={
          <Can permission="payment_methods.create">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.financialPaymentMethodCreate}>
                <Plus className="size-4" /> Add method
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
                ...(type !== 'ALL' ? [{ key: 'type', label: type }] : []),
                ...(isActive
                  ? [
                      {
                        key: 'isActive',
                        label: isActive === 'true' ? 'Active' : 'Inactive',
                      },
                    ]
                  : []),
                ...(search ? [{ key: 'search', label: `"${search}"` }] : []),
              ]}
              onRemove={(key) => {
                if (key === 'type') setFilter('type', 'ALL');
                if (key === 'isActive') setFilter('isActive', undefined);
                if (key === 'search') setFilter('search', undefined);
              }}
              onResetAll={resetFilters}
            />
          ) : undefined
        }
      >
        <SearchBar
          placeholder="Search by name or code..."
          defaultValue={search ?? ''}
          onSearch={(value) => {
            setFilter('search', value || undefined);
            setPage(1);
          }}
          className="w-full sm:w-72"
        />
        <SelectFilter
          label="Type"
          value={type === 'ALL' ? undefined : type}
          onChange={(value) => {
            setFilter('type', (value ?? 'ALL') as MethodFilters['type']);
            setPage(1);
          }}
          options={TYPE_OPTIONS}
        />
        <SelectFilter
          label="Status"
          value={isActive}
          onChange={(value) => {
            setFilter('isActive', value as MethodFilters['isActive']);
            setPage(1);
          }}
          options={[
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ]}
          placeholder="All statuses"
        />
      </FilterBar>

      {methodsQuery.isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : methodsQuery.isError ? (
        <ErrorState
          onRetry={() => methodsQuery.refetch()}
          description="Unable to load payment methods."
        />
      ) : (methodsQuery.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="No payment methods found"
          description={
            hasActiveFilters
              ? 'No payment methods match your filters.'
              : 'Add a payment method so students can pay at checkout.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            ) : (
              <Can permission="payment_methods.create">
                <Button asChild className="gap-2">
                  <Link href={ROUTES.admin.financialPaymentMethodCreate}>
                    <Plus className="size-4" /> Add method
                  </Link>
                </Button>
              </Can>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(methodsQuery.data?.items ?? []).map((method) => {
                const Icon = TYPE_ICONS[method.type];
                return (
                  <TableRow
                    key={method.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(ROUTES.admin.financialPaymentMethodDetail(method.id))
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{method.name}</p>
                          <p className="text-xs text-muted-foreground">{method.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{method.type.replaceAll('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{method.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={method.isActive ? 'success' : 'secondary'}>
                        {method.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Can permission="payment_methods.update">
                          <Switch
                            aria-label={`Toggle ${method.name}`}
                            checked={method.isActive}
                            disabled={statusBusy === method.id}
                            onCheckedChange={() => handleToggleActive(method.id, method.isActive)}
                          />
                        </Can>
                        <Can permission="payment_methods.update">
                          <Button
                            asChild
                            variant="outline"
                            size="icon"
                            aria-label={`Edit ${method.name}`}
                          >
                            <Link href={ROUTES.admin.financialPaymentMethodEdit(method.id)}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!methodsQuery.isLoading && (methodsQuery.data?.items.length ?? 0) > 0 && (
        <DynamicPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          showFirstLast
          isLoading={methodsQuery.isFetching}
        />
      )}
    </ContentContainer>
  );
}
