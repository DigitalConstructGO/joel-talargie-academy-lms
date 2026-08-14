'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DateRange } from 'react-day-picker';
import { AlertTriangle, Clock, Download, FileText, Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { SearchBar } from '@/components/common/search-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/constants/routes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { FilterChips } from '@/components/dashboard/filters/filter-chips';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { DateRangeFilter } from '@/components/dashboard/filters/date-range-filter';
import { TableSkeleton } from '@/components/dashboard/skeletons/table-skeleton';
import { DashboardApiErrorState } from '@/components/dashboard/error-states';
import {
  NoPaymentsEmptyState,
  NoSearchResultsEmptyState,
} from '@/components/dashboard/empty-states';
import { useQueryFilters } from '@/hooks/use-query-filters';
import {
  useMyPayments,
  usePayment,
  usePaymentReceipt,
} from '@/features/payments/hooks/use-payments';
import type { PaymentStatus } from '@/features/payments/types/payment.types';
import { PaymentAmountBreakdown } from '@/features/payments/components/payment-amount-breakdown';
import { formatCurrency } from '@/lib/format';
import { formatDate, formatDateTime } from '@/lib/date';

const PAGE_SIZE = 10;

interface PaymentsFilters {
  [key: string]: string | undefined;
  status: 'ALL' | PaymentStatus;
  search: string | undefined;
  submittedFrom: string | undefined;
  submittedTo: string | undefined;
}

const DEFAULT_FILTERS: PaymentsFilters = {
  status: 'ALL',
  search: undefined,
  submittedFrom: undefined,
  submittedTo: undefined,
};

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Declined', value: 'DECLINED' },
];

const STATUS_BADGE_VARIANT: Record<PaymentStatus, 'warning' | 'success' | 'destructive'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  DECLINED: 'destructive',
};

function PaymentDetailSheet({
  paymentId,
  onClose,
}: {
  paymentId: string | null;
  onClose: () => void;
}) {
  const paymentQuery = usePayment(paymentId ?? '');
  const receiptQuery = usePaymentReceipt(paymentId ?? undefined);
  const payment = paymentQuery.data;

  return (
    <Sheet open={Boolean(paymentId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Payment details</SheetTitle>
          <SheetDescription>Everything submitted for this payment attempt.</SheetDescription>
        </SheetHeader>

        {paymentQuery.isLoading || !payment ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-5 w-full animate-pulse rounded-full bg-primary/10" />
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{payment.courseTitle}</span>
              <Badge variant={STATUS_BADGE_VARIANT[payment.status]}>{payment.status}</Badge>
            </div>

            <Separator />

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="font-medium text-foreground">{payment.transactionId}</dd>
              </div>
              {payment.paymentMethodName && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Payment method</dt>
                  <dd className="font-medium text-foreground">{payment.paymentMethodName}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Attempt</dt>
                <dd className="font-medium text-foreground">#{payment.attemptNumber}</dd>
              </div>
              {payment.paymentDate && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Payment date</dt>
                  <dd className="font-medium text-foreground">{formatDate(payment.paymentDate)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="font-medium text-foreground">
                  {formatDateTime(payment.submittedAt)}
                </dd>
              </div>
              {payment.reviewedAt && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Reviewed</dt>
                  <dd className="font-medium text-foreground">
                    {formatDateTime(payment.reviewedAt)}
                  </dd>
                </div>
              )}
            </dl>

            <PaymentAmountBreakdown
              submittedAmount={payment.submittedAmount}
              expectedAmount={payment.expectedAmount}
              currency={payment.currency}
              promo={
                payment.promoCode
                  ? {
                      code: payment.promoCode,
                      discountType: payment.promoDiscountType,
                      discountValue: payment.promoDiscountValue,
                      originalAmount: payment.promoOriginalAmount,
                      discountAmount: payment.promoDiscountAmount,
                      finalAmount: payment.promoFinalAmount,
                    }
                  : null
              }
            />

            {payment.amountMismatch && (
              <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                The submitted amount didn&apos;t match the expected price.
              </p>
            )}

            {payment.status === 'PENDING' && (
              <p className="rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-warning">
                Your payment is being reviewed by the academy. You&apos;ll be notified once
                it&apos;s approved and your course access is unlocked.
              </p>
            )}

            {payment.status === 'DECLINED' && payment.declineReason && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {payment.declineReason}
              </p>
            )}

            {payment.status === 'APPROVED' && (
              <Button asChild className="w-full">
                <Link href={ROUTES.dashboard.learn(payment.enrollmentId)}>Go to Course</Link>
              </Button>
            )}

            {payment.studentNote && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Note</p>
                <p className="mt-1 text-sm text-foreground">{payment.studentNote}</p>
              </div>
            )}

            <Separator />

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Receipt</p>
              {receiptQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Preparing receipt...
                </div>
              ) : receiptQuery.data ? (
                <Button asChild variant="outline" className="w-full gap-2">
                  <a
                    href={receiptQuery.data.url}
                    download={receiptQuery.data.originalFileName}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="size-4" />
                    Download receipt
                  </a>
                </Button>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="size-4" /> Receipt unavailable.
                </p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function StudentPaymentsPage() {
  const { filters, pageSize, setFilter, setFilters, setPageSize, resetFilters } =
    useQueryFilters<PaymentsFilters>({ defaults: DEFAULT_FILTERS, pageSize: PAGE_SIZE });
  const { status, search, submittedFrom, submittedTo } = filters;
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const paymentsQuery = useMyPayments({
    page: 1,
    pageSize,
    status: status === 'ALL' ? undefined : status,
    search: search || undefined,
    submittedFrom,
    submittedTo,
  });

  const payments = paymentsQuery.data ?? [];
  const hasMore = payments.length === pageSize;
  const hasPending = payments.some((payment) => payment.status === 'PENDING');
  const hasActiveFilters =
    status !== 'ALL' || Boolean(search) || Boolean(submittedFrom) || Boolean(submittedTo);

  const dateRange: DateRange | undefined =
    submittedFrom || submittedTo
      ? {
          from: submittedFrom ? new Date(submittedFrom) : undefined,
          to: submittedTo ? new Date(submittedTo) : undefined,
        }
      : undefined;

  return (
    <ContentContainer>
      <PageHeader title="Payments" description="Your payment history and receipts." />

      {hasPending && (
        <p className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
          <Clock className="size-4 shrink-0" />
          You have a payment awaiting review. Course access unlocks once an admin approves it.
        </p>
      )}

      <FilterBar
        chips={
          hasActiveFilters ? (
            <FilterChips
              chips={[
                ...(status !== 'ALL' ? [{ key: 'status', label: status }] : []),
                ...(search ? [{ key: 'search', label: `"${search}"` }] : []),
                ...(submittedFrom || submittedTo
                  ? [{ key: 'dateRange', label: 'Date range' }]
                  : []),
              ]}
              onRemove={(key) => {
                if (key === 'status') setFilter('status', 'ALL');
                if (key === 'search') setFilter('search', undefined);
                if (key === 'dateRange')
                  setFilters({ submittedFrom: undefined, submittedTo: undefined });
              }}
              onResetAll={resetFilters}
            />
          ) : undefined
        }
      >
        <SearchBar
          placeholder="Search by course or transaction ID..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label="Status"
          value={status === 'ALL' ? undefined : status}
          onChange={(value) => setFilter('status', (value ?? 'ALL') as PaymentsFilters['status'])}
          options={STATUS_OPTIONS}
        />
        <DateRangeFilter
          value={dateRange}
          onChange={(range) =>
            setFilters({
              submittedFrom: range?.from ? range.from.toISOString().slice(0, 10) : undefined,
              submittedTo: range?.to ? range.to.toISOString().slice(0, 10) : undefined,
            })
          }
        />
      </FilterBar>

      {paymentsQuery.isLoading ? (
        <TableSkeleton rows={6} columns={4} />
      ) : paymentsQuery.isError ? (
        <DashboardApiErrorState onRetry={() => paymentsQuery.refetch()} />
      ) : payments.length === 0 ? (
        hasActiveFilters ? (
          <NoSearchResultsEmptyState
            action={
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            }
          />
        ) : (
          <NoPaymentsEmptyState />
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Details</TableHead>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow
                  key={payment.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedPaymentId(payment.id)}
                >
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{payment.courseTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        Attempt #{payment.attemptNumber} &middot; {payment.transactionId}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(payment.submittedAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-foreground">
                    {formatCurrency(payment.submittedAmount, payment.currency)}
                    {payment.amountMismatch && (
                      <AlertTriangle
                        className="ml-1.5 inline size-3.5 text-warning"
                        aria-label="Amount mismatch"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[payment.status]}>{payment.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!paymentsQuery.isLoading && payments.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">Showing {payments.length} transactions</p>
          {hasMore && (
            <Button
              variant="outline"
              onClick={() => setPageSize(pageSize + PAGE_SIZE)}
              disabled={paymentsQuery.isFetching}
            >
              {paymentsQuery.isFetching && <Loader2 className="mr-2 size-4 animate-spin" />}
              Load more
            </Button>
          )}
        </div>
      )}

      <PaymentDetailSheet
        paymentId={selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
      />
    </ContentContainer>
  );
}
