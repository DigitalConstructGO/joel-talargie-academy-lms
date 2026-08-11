'use client';

import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { AlertTriangle, Check, Copy, Download, FileText, Loader2, X } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { SearchBar } from '@/components/common/search-bar';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { FilterChips } from '@/components/dashboard/filters/filter-chips';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { DateRangeFilter } from '@/components/dashboard/filters/date-range-filter';
import { TableSkeleton } from '@/components/dashboard/skeletons/table-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Can } from '@/components/auth/can';
import { usePermissions } from '@/hooks/use-permissions';
import { useQueryFilters } from '@/hooks/use-query-filters';
import {
  useAdminPayment,
  useAdminPaymentReceipt,
  useAdminPayments,
  useApprovePayment,
  useDeclinePayment,
} from '@/features/payments/hooks/use-admin-payments';
import { useAdminCourses } from '@/features/catalog/hooks/use-admin-courses';
import type { PaymentStatus } from '@/features/payments/types/payment.types';
import { formatCurrency } from '@/lib/format';
import { formatDateTime, formatDate } from '@/lib/date';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';

const PAGE_SIZE = 20;

interface PaymentsFilters {
  [key: string]: string | undefined;
  status: 'ALL' | PaymentStatus;
  courseId: string | undefined;
  submittedFrom: string | undefined;
  submittedTo: string | undefined;
  amountMismatch: 'true' | undefined;
  duplicateOnly: 'true' | undefined;
  search: string | undefined;
}

const DEFAULT_FILTERS: PaymentsFilters = {
  status: 'ALL',
  courseId: undefined,
  submittedFrom: undefined,
  submittedTo: undefined,
  amountMismatch: undefined,
  duplicateOnly: undefined,
  search: undefined,
};

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Declined', value: 'DECLINED' },
];

const STATUS_VARIANT: Record<PaymentStatus, NonNullable<BadgeProps['variant']>> = {
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
  const paymentQuery = useAdminPayment(paymentId ?? '');
  const receiptQuery = useAdminPaymentReceipt(paymentId ?? undefined);
  const approvePayment = useApprovePayment();
  const declinePayment = useDeclinePayment();
  const { can } = usePermissions();
  const [declineReason, setDeclineReason] = useState('');
  const [mismatchReason, setMismatchReason] = useState('');
  const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false);
  const payment = paymentQuery.data;

  // Reset the acknowledgment fields whenever a different payment is opened -
  // this component instance is reused across selections (the Sheet doesn't
  // unmount), so stale input from a previous review must not carry over.
  useEffect(() => {
    setMismatchReason('');
    setAcknowledgedDuplicate(false);
  }, [paymentId]);

  const canApproveMismatch = !payment?.amountMismatch || can('payments.approve_amount_mismatch');
  const needsMismatchReason = Boolean(payment?.amountMismatch) && !mismatchReason.trim();
  const needsDuplicateAck = Boolean(payment?.duplicateTransactionCount) && !acknowledgedDuplicate;

  async function handleApprove() {
    if (!paymentId || !payment) return;
    try {
      await approvePayment.mutateAsync({
        paymentId,
        input: {
          mismatchApprovalReason: payment.amountMismatch ? mismatchReason.trim() : undefined,
          acknowledgeDuplicate: payment.duplicateTransactionCount > 0 ? true : undefined,
        },
      });
      toast.success('Payment approved');
    } catch {
      toast.error('Could not approve this payment');
    }
  }

  async function handleDecline() {
    if (!paymentId) return;
    try {
      await declinePayment.mutateAsync({ paymentId, input: { reason: declineReason } });
      toast.success('Payment declined');
      setDeclineReason('');
    } catch {
      toast.error('Could not decline this payment');
    }
  }

  return (
    <Sheet open={Boolean(paymentId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Payment details</SheetTitle>
          <SheetDescription>Review this submission and decide.</SheetDescription>
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
              <Badge variant={STATUS_VARIANT[payment.status]}>{payment.status}</Badge>
            </div>
            <Separator />
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Student</dt>
                <dd className="font-medium text-foreground">{payment.studentEmail}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="font-medium text-foreground">{payment.transactionId}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Attempt</dt>
                <dd className="font-medium text-foreground">#{payment.attemptNumber}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Amount submitted</dt>
                <dd className="font-medium text-foreground">
                  {formatCurrency(payment.submittedAmount, payment.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Expected amount</dt>
                <dd className="font-medium text-foreground">
                  {formatCurrency(payment.expectedAmount, payment.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="font-medium text-foreground">
                  {formatDateTime(payment.submittedAt)}
                </dd>
              </div>
            </dl>

            {payment.amountMismatch && (
              <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                The submitted amount doesn&apos;t match the expected price.
              </p>
            )}
            {payment.duplicateTransactionCount > 0 && (
              <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-warning">
                <Copy className="mt-0.5 size-4 shrink-0" />
                This transaction ID matches {payment.duplicateTransactionCount} other payment(s).
              </p>
            )}
            {payment.status === 'DECLINED' && payment.declineReason && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {payment.declineReason}
              </p>
            )}
            {payment.studentNote && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Student note</p>
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
                  <a href={receiptQuery.data.url} download target="_blank" rel="noreferrer">
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

            {payment.status === 'PENDING' && (
              <>
                {payment.amountMismatch && !canApproveMismatch && (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    You don&apos;t have permission to approve a payment with a mismatched amount.
                    Ask an admin with the enhanced mismatch-approval permission to review it.
                  </p>
                )}
                {payment.amountMismatch && canApproveMismatch && (
                  <div className="space-y-2">
                    <Label htmlFor="mismatch-reason">
                      Reason for approving despite the mismatch
                    </Label>
                    <Textarea
                      id="mismatch-reason"
                      value={mismatchReason}
                      onChange={(e) => setMismatchReason(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
                {payment.duplicateTransactionCount > 0 && (
                  <label className="flex items-start gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={acknowledgedDuplicate}
                      onCheckedChange={(checked) => setAcknowledgedDuplicate(checked === true)}
                    />
                    I&apos;ve reviewed the duplicate transaction(s) and confirm this is legitimate.
                  </label>
                )}
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Can permission="payments.approve">
                    <Button
                      className="gap-2"
                      onClick={handleApprove}
                      disabled={
                        approvePayment.isPending ||
                        !canApproveMismatch ||
                        needsMismatchReason ||
                        needsDuplicateAck
                      }
                    >
                      {approvePayment.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Approve
                    </Button>
                  </Can>
                  <Can permission="payments.decline">
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="outline"
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <X className="size-4" /> Decline
                        </Button>
                      }
                      title="Decline this payment?"
                      description="The student will be notified with your reason."
                      confirmLabel="Decline payment"
                      variant="destructive"
                      confirmDisabled={!declineReason.trim()}
                      onConfirm={handleDecline}
                    >
                      <div className="space-y-2 py-2">
                        <Label htmlFor="decline-reason">Reason</Label>
                        <Textarea
                          id="decline-reason"
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </ConfirmDialog>
                  </Can>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function AdminPaymentsPage() {
  const { filters, pageSize, setFilter, setFilters, setPageSize, resetFilters } =
    useQueryFilters<PaymentsFilters>({
      defaults: DEFAULT_FILTERS,
      pageSize: PAGE_SIZE,
    });
  const { status, courseId, submittedFrom, submittedTo, amountMismatch, duplicateOnly, search } =
    filters;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const coursesQuery = useAdminCourses({ pageSize: 100 });
  const courseOptions = (coursesQuery.data?.items ?? []).map((course) => ({
    label: course.title,
    value: course.id,
  }));

  const paymentsQuery = useAdminPayments({
    page: 1,
    pageSize,
    status: status === 'ALL' ? undefined : status,
    courseId: courseId || undefined,
    submittedFrom: submittedFrom || undefined,
    submittedTo: submittedTo || undefined,
    amountMismatch: amountMismatch === 'true' || undefined,
    duplicateOnly: duplicateOnly === 'true' || undefined,
    search: search || undefined,
  });

  const dateRange: DateRange | undefined =
    submittedFrom || submittedTo
      ? {
          from: submittedFrom ? new Date(submittedFrom) : undefined,
          to: submittedTo ? new Date(submittedTo) : undefined,
        }
      : undefined;

  const payments = paymentsQuery.data ?? [];
  const hasMore = payments.length === pageSize;
  const hasActiveFilters =
    status !== 'ALL' ||
    Boolean(courseId) ||
    Boolean(submittedFrom) ||
    Boolean(submittedTo) ||
    Boolean(amountMismatch) ||
    Boolean(duplicateOnly) ||
    Boolean(search);

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Financial Management', href: ROUTES.admin.financial },
          { label: 'Payments' },
        ]}
      />
      <PageHeader title="Payments" description="Review and manage student payments." />

      <FilterBar
        chips={
          hasActiveFilters ? (
            <FilterChips
              chips={[
                ...(status !== 'ALL' ? [{ key: 'status', label: status }] : []),
                ...(courseId
                  ? [
                      {
                        key: 'courseId',
                        label:
                          courseOptions.find((option) => option.value === courseId)?.label ??
                          'Course',
                      },
                    ]
                  : []),
                ...(submittedFrom || submittedTo
                  ? [
                      {
                        key: 'dateRange',
                        label: `${submittedFrom ? formatDate(submittedFrom) : '…'} – ${submittedTo ? formatDate(submittedTo) : '…'}`,
                      },
                    ]
                  : []),
                ...(amountMismatch ? [{ key: 'amountMismatch', label: 'Amount mismatch' }] : []),
                ...(duplicateOnly
                  ? [{ key: 'duplicateOnly', label: 'Duplicate transaction' }]
                  : []),
                ...(search ? [{ key: 'search', label: `"${search}"` }] : []),
              ]}
              onRemove={(key) => {
                if (key === 'status') setFilter('status', 'ALL');
                if (key === 'courseId') setFilter('courseId', undefined);
                if (key === 'dateRange')
                  setFilters({ submittedFrom: undefined, submittedTo: undefined });
                if (key === 'amountMismatch') setFilter('amountMismatch', undefined);
                if (key === 'duplicateOnly') setFilter('duplicateOnly', undefined);
                if (key === 'search') setFilter('search', undefined);
              }}
              onResetAll={resetFilters}
            />
          ) : undefined
        }
      >
        <SearchBar
          placeholder="Search by transaction ID, student, or course..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-72"
        />
        <SelectFilter
          label="Status"
          value={status === 'ALL' ? undefined : status}
          onChange={(value) => setFilter('status', (value ?? 'ALL') as PaymentsFilters['status'])}
          options={STATUS_OPTIONS}
        />
        <SelectFilter
          label="Course"
          value={courseId}
          onChange={(value) => setFilter('courseId', value)}
          options={courseOptions}
        />
        <DateRangeFilter
          value={dateRange}
          onChange={(range) =>
            setFilters({
              submittedFrom: range?.from ? range.from.toISOString().slice(0, 10) : undefined,
              submittedTo: range?.to ? range.to.toISOString().slice(0, 10) : undefined,
            })
          }
          placeholder="Submitted date"
        />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={amountMismatch === 'true'}
            onCheckedChange={(checked) => setFilter('amountMismatch', checked ? 'true' : undefined)}
          />
          Amount mismatch
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={duplicateOnly === 'true'}
            onCheckedChange={(checked) => setFilter('duplicateOnly', checked ? 'true' : undefined)}
          />
          Duplicate transaction
        </label>
      </FilterBar>

      {paymentsQuery.isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : paymentsQuery.isError ? (
        <ErrorState
          onRetry={() => paymentsQuery.refetch()}
          description="Unable to load payments."
        />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No payments found"
          description={
            hasActiveFilters
              ? 'No payments match your filters.'
              : 'No payments have been submitted yet.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow
                  key={payment.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(payment.id)}
                >
                  <TableCell>{payment.studentEmail}</TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{payment.courseTitle}</p>
                      <p className="text-xs text-muted-foreground">{payment.transactionId}</p>
                    </div>
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
                    <Badge variant={STATUS_VARIANT[payment.status]}>{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(payment.submittedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!paymentsQuery.isLoading && payments.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">Showing {payments.length} payments</p>
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

      <PaymentDetailSheet paymentId={selectedId} onClose={() => setSelectedId(null)} />
    </ContentContainer>
  );
}
