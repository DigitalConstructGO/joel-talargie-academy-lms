'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { usePaymentMethods } from '@/features/payment-methods/hooks/use-payment-methods';
import type { PaymentStatus } from '@/features/payments/types/payment.types';
import { PaymentAmountBreakdown } from '@/features/payments/components/payment-amount-breakdown';
import { approveErrorMessage, declineErrorMessage } from '@/features/payments/lib/review-errors';
import { formatCurrency } from '@/lib/format';
import { formatDateTime, formatDate } from '@/lib/date';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';
import { useLanguage } from '@/lib/i18n/language-provider';

const PAGE_SIZE = 20;

interface PaymentsFilters {
  [key: string]: string | undefined;
  status: 'ALL' | PaymentStatus;
  courseId: string | undefined;
  paymentMethodId: string | undefined;
  submittedFrom: string | undefined;
  submittedTo: string | undefined;
  amountMismatch: 'true' | undefined;
  duplicateOnly: 'true' | undefined;
  search: string | undefined;
}

const DEFAULT_FILTERS: PaymentsFilters = {
  status: 'ALL',
  courseId: undefined,
  paymentMethodId: undefined,
  submittedFrom: undefined,
  submittedTo: undefined,
  amountMismatch: undefined,
  duplicateOnly: undefined,
  search: undefined,
};

const STATUS_VARIANT: Record<PaymentStatus, NonNullable<BadgeProps['variant']>> = {
  PENDING: 'warning',
  APPROVED: 'success',
  DECLINED: 'destructive',
};

function formatPaymentStatus(status: PaymentStatus, locale: string): string {
  if (locale !== 'am') return status;

  const STATUS_MAP_AM: Record<PaymentStatus, string> = {
    PENDING: 'በመጠባበቅ ላይ',
    APPROVED: 'የጸደቀ',
    DECLINED: 'ውድቅ የተደረገ',
  };

  return STATUS_MAP_AM[status] || status;
}

function PaymentDetailSheet({
  paymentId,
  onClose,
}: {
  paymentId: string | null;
  onClose: () => void;
}) {
  const { locale } = useLanguage();
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
  const duplicateCount = Number(payment?.duplicateTransactionCount ?? 0);
  const needsMismatchReason = Boolean(payment?.amountMismatch) && !mismatchReason.trim();
  const needsDuplicateAck = duplicateCount > 0 && !acknowledgedDuplicate;

  const approveDisabledHint = approvePayment.isPending
    ? undefined
    : !canApproveMismatch
      ? locale === 'am'
        ? 'የተሳሳተ የገንዘብ መጠን ያለው ክፍያን ለማጽደቅ ፈቃድ የለዎትም።'
        : "You don't have permission to approve a payment with a mismatched amount."
      : needsMismatchReason
        ? locale === 'am'
          ? 'ክፍያውን ለማጽደቅ የተቀናነሰበትን ምክንያት ያስገቡ።'
          : 'Enter a reason for approving the mismatched amount to enable Approve.'
        : needsDuplicateAck
          ? locale === 'am'
            ? 'ክፍያውን ለማጽደቅ የተደገመውን ክፍያ ያረጋግጡ።'
            : 'Confirm the duplicate-transaction warning to enable Approve.'
          : undefined;

  async function handleApprove() {
    if (!paymentId || !payment) return;
    try {
      await approvePayment.mutateAsync({
        paymentId,
        input: {
          mismatchApprovalReason:
            payment.amountMismatch && mismatchReason.trim() ? mismatchReason.trim() : undefined,
          acknowledgeDuplicate: duplicateCount > 0 ? true : undefined,
        },
      });
      toast.success(locale === 'am' ? 'ክፍያው ጸድቋል' : 'Payment approved');
    } catch (error) {
      toast.error(
        locale === 'am' ? 'ክፍያው አልጸደቀም' : 'Payment not approved',
        approveErrorMessage(error),
      );
    }
  }

  async function handleDecline() {
    if (!paymentId) return;
    try {
      await declinePayment.mutateAsync({ paymentId, input: { reason: declineReason } });
      toast.success(locale === 'am' ? 'ክፍያው ውድቅ ተደርጓል' : 'Payment declined');
      setDeclineReason('');
    } catch (error) {
      toast.error(
        locale === 'am' ? 'ክፍያው ውድቅ አልተደረገም' : 'Payment not declined',
        declineErrorMessage(error),
      );
    }
  }

  return (
    <Sheet open={Boolean(paymentId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{locale === 'am' ? 'የክፍያ ዝርዝሮች' : 'Payment details'}</SheetTitle>
          <SheetDescription>
            {locale === 'am'
              ? 'ይህንን የቀረበ ክፍያ ይገምግሙ እና ይወሰኑ።'
              : 'Review this submission and decide.'}
          </SheetDescription>
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
              <Badge variant={STATUS_VARIANT[payment.status]}>
                {formatPaymentStatus(payment.status, locale)}
              </Badge>
            </div>
            <Separator />
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{locale === 'am' ? 'ተማሪ' : 'Student'}</dt>
                <dd className="font-medium text-foreground">{payment.studentEmail}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">
                  {locale === 'am' ? 'የክፍያ ቁጥር' : 'Transaction ID'}
                </dt>
                <dd className="font-medium text-foreground">{payment.transactionId}</dd>
              </div>
              {payment.paymentMethodName && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    {locale === 'am' ? 'የክፍያ ዘዴ' : 'Payment method'}
                  </dt>
                  <dd className="font-medium text-foreground">{payment.paymentMethodName}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{locale === 'am' ? 'ሙከራ' : 'Attempt'}</dt>
                <dd className="font-medium text-foreground">#{payment.attemptNumber}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">
                  {locale === 'am' ? 'የቀረበበት ቀን' : 'Submitted'}
                </dt>
                <dd className="font-medium text-foreground">
                  {formatDateTime(payment.submittedAt)}
                </dd>
              </div>
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
                {locale === 'am'
                  ? 'የቀረበው የገንዘብ መጠን ከሚጠበቀው ዋጋ ጋር አይዛመድም።'
                  : "The submitted amount doesn't match the expected price."}
              </p>
            )}
            {duplicateCount > 0 && (
              <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-warning">
                <Copy className="mt-0.5 size-4 shrink-0" />
                {locale === 'am'
                  ? `ይህ የክፍያ ቁጥር ከ ${duplicateCount} ሌሎች ክፍያዎች ጋር ይዛመዳል።`
                  : `This transaction ID matches ${duplicateCount} other payment(s).`}
              </p>
            )}
            {payment.status === 'DECLINED' && payment.declineReason && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {payment.declineReason}
              </p>
            )}
            {payment.studentNote && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {locale === 'am' ? 'የተማሪ ማስታወሻ' : 'Student note'}
                </p>
                <p className="mt-1 text-sm text-foreground">{payment.studentNote}</p>
              </div>
            )}

            <Separator />

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {locale === 'am' ? 'ደረሰኝ' : 'Receipt'}
              </p>
              {receiptQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {locale === 'am' ? 'ደረሰኝ በመዘጋጀት ላይ...' : 'Preparing receipt...'}
                </div>
              ) : receiptQuery.data ? (
                <Button asChild variant="outline" className="w-full gap-2">
                  <a href={receiptQuery.data.url} download target="_blank" rel="noreferrer">
                    <Download className="size-4" />
                    {locale === 'am' ? 'ደረሰኝ አውርድ' : 'Download receipt'}
                  </a>
                </Button>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="size-4" />
                  {locale === 'am' ? 'ደረሰኝ አልተገኘም።' : 'Receipt unavailable.'}
                </p>
              )}
            </div>

            {payment.status === 'PENDING' && (
              <>
                {payment.amountMismatch && canApproveMismatch && (
                  <div className="space-y-2">
                    <Label htmlFor="mismatch-reason">
                      {locale === 'am'
                        ? 'ያልተዛመደውን መጠን ለማጽደቅ ምክንያት'
                        : 'Reason for approving despite the mismatch'}
                    </Label>
                    <Textarea
                      id="mismatch-reason"
                      value={mismatchReason}
                      onChange={(e) => setMismatchReason(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
                {duplicateCount > 0 && (
                  <label className="flex items-start gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={acknowledgedDuplicate}
                      onCheckedChange={(checked) => setAcknowledgedDuplicate(checked === true)}
                    />
                    {locale === 'am'
                      ? 'የተደገሙትን የክፍያ ቁጥሮች ገምግሜ ክፍያው ትክክለኛ መሆኑን አረጋግጣለሁ።'
                      : "I've reviewed the duplicate transaction(s) and confirm this is legitimate."}
                  </label>
                )}
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Can permission="payments.approve">
                    <Button
                      className="gap-2"
                      onClick={handleApprove}
                      title={approveDisabledHint}
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
                      {locale === 'am' ? 'አጽድቅ' : 'Approve'}
                    </Button>
                  </Can>
                  <Can permission="payments.decline">
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="outline"
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <X className="size-4" /> {locale === 'am' ? 'ውድቅ አድርግ' : 'Decline'}
                        </Button>
                      }
                      title={locale === 'am' ? 'ይህንን ክፍያ ውድቅ ማድረግ ይፈልጋሉ?' : 'Decline this payment?'}
                      description={
                        locale === 'am'
                          ? 'ተማሪው ከምክንያትዎ ጋር ማሳወቂያ ይደርሰዋል።'
                          : 'The student will be notified with your reason.'
                      }
                      confirmLabel={locale === 'am' ? 'ክፍያውን ውድቅ አድርግ' : 'Decline payment'}
                      variant="destructive"
                      confirmDisabled={!declineReason.trim()}
                      onConfirm={handleDecline}
                    >
                      <div className="space-y-2 py-2">
                        <Label htmlFor="decline-reason">
                          {locale === 'am' ? 'ምክንያት' : 'Reason'}
                        </Label>
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
                {approveDisabledHint && (
                  <p className="mt-2 text-xs text-muted-foreground">{approveDisabledHint}</p>
                )}
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function AdminPaymentsPage() {
  const { locale } = useLanguage();
  const { filters, pageSize, setFilter, setFilters, setPageSize, resetFilters } =
    useQueryFilters<PaymentsFilters>({
      defaults: DEFAULT_FILTERS,
      pageSize: PAGE_SIZE,
    });
  const {
    status,
    courseId,
    paymentMethodId,
    submittedFrom,
    submittedTo,
    amountMismatch,
    duplicateOnly,
    search,
  } = filters;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => [
      { label: locale === 'am' ? 'በመጠባበቅ ላይ' : 'Pending', value: 'PENDING' },
      { label: locale === 'am' ? 'የጸደቀ' : 'Approved', value: 'APPROVED' },
      { label: locale === 'am' ? 'ውድቅ የተደረገ' : 'Declined', value: 'DECLINED' },
    ],
    [locale],
  );

  const coursesQuery = useAdminCourses({ pageSize: 100 });
  const courseOptions = (coursesQuery.data?.items ?? []).map((course) => ({
    label: course.title,
    value: course.id,
  }));

  const paymentMethodsQuery = usePaymentMethods({ pageSize: 100 });
  const paymentMethodOptions = (paymentMethodsQuery.data?.items ?? [])
    .filter((method) => method.isActive)
    .map((method) => ({ label: method.name, value: method.id }));

  const paymentsQuery = useAdminPayments({
    page: 1,
    pageSize,
    status: status === 'ALL' ? undefined : status,
    courseId: courseId || undefined,
    paymentMethodId: paymentMethodId || undefined,
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
    Boolean(paymentMethodId) ||
    Boolean(submittedFrom) ||
    Boolean(submittedTo) ||
    Boolean(amountMismatch) ||
    Boolean(duplicateOnly) ||
    Boolean(search);

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: locale === 'am' ? 'ዳሽቦርድ' : 'Dashboard', href: ROUTES.admin.root },
          {
            label: locale === 'am' ? 'የፋይናንስ አስተዳደር' : 'Financial Management',
            href: ROUTES.admin.financial,
          },
          { label: locale === 'am' ? 'ክፍያዎች' : 'Payments' },
        ]}
      />
      <PageHeader
        title={locale === 'am' ? 'ክፍያዎች' : 'Payments'}
        description={
          locale === 'am' ? 'የተማሪዎችን ክፍያዎች ይገምግሙ እና ያስተዳድሩ።' : 'Review and manage student payments.'
        }
      />

      <FilterBar
        chips={
          hasActiveFilters ? (
            <FilterChips
              chips={[
                ...(status !== 'ALL'
                  ? [{ key: 'status', label: formatPaymentStatus(status, locale) }]
                  : []),
                ...(courseId
                  ? [
                      {
                        key: 'courseId',
                        label:
                          courseOptions.find((option) => option.value === courseId)?.label ??
                          (locale === 'am' ? 'ኮርስ' : 'Course'),
                      },
                    ]
                  : []),
                ...(paymentMethodId
                  ? [
                      {
                        key: 'paymentMethodId',
                        label:
                          paymentMethodOptions.find((option) => option.value === paymentMethodId)
                            ?.label ?? (locale === 'am' ? 'የክፍያ ዘዴ' : 'Payment method'),
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
                ...(amountMismatch
                  ? [
                      {
                        key: 'amountMismatch',
                        label: locale === 'am' ? 'የተሳሳተ የገንዘብ መጠን' : 'Amount mismatch',
                      },
                    ]
                  : []),
                ...(duplicateOnly
                  ? [
                      {
                        key: 'duplicateOnly',
                        label: locale === 'am' ? 'የተደገመ የክፍያ ቁጥር' : 'Duplicate transaction',
                      },
                    ]
                  : []),
                ...(search ? [{ key: 'search', label: `"${search}"` }] : []),
              ]}
              onRemove={(key) => {
                if (key === 'status') setFilter('status', 'ALL');
                if (key === 'courseId') setFilter('courseId', undefined);
                if (key === 'paymentMethodId') setFilter('paymentMethodId', undefined);
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
          placeholder={
            locale === 'am'
              ? 'በተክፍያ ቁጥር፣ ተማሪ ወይም ኮርስ ፈልግ...'
              : 'Search by transaction ID, student, or course...'
          }
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-72"
        />
        <SelectFilter
          label={locale === 'am' ? 'ሁኔታ' : 'Status'}
          value={status === 'ALL' ? undefined : status}
          onChange={(value) => setFilter('status', (value ?? 'ALL') as PaymentsFilters['status'])}
          options={statusOptions}
        />
        <SelectFilter
          label={locale === 'am' ? 'ኮርስ' : 'Course'}
          value={courseId}
          onChange={(value) => setFilter('courseId', value)}
          options={courseOptions}
        />
        <SelectFilter
          label={locale === 'am' ? 'የክፍያ ዘዴ' : 'Payment method'}
          value={paymentMethodId}
          onChange={(value) => setFilter('paymentMethodId', value)}
          options={paymentMethodOptions}
          placeholder={locale === 'am' ? 'ሁሉም ዘዴዎች' : 'All methods'}
        />
        <DateRangeFilter
          value={dateRange}
          onChange={(range) =>
            setFilters({
              submittedFrom: range?.from ? range.from.toISOString().slice(0, 10) : undefined,
              submittedTo: range?.to ? range.to.toISOString().slice(0, 10) : undefined,
            })
          }
          placeholder={locale === 'am' ? 'የቀረበበት ቀን' : 'Submitted date'}
        />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={amountMismatch === 'true'}
            onCheckedChange={(checked) => setFilter('amountMismatch', checked ? 'true' : undefined)}
          />
          {locale === 'am' ? 'የተሳሳተ የገንዘብ መጠን' : 'Amount mismatch'}
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={duplicateOnly === 'true'}
            onCheckedChange={(checked) => setFilter('duplicateOnly', checked ? 'true' : undefined)}
          />
          {locale === 'am' ? 'የተደገመ የክፍያ ቁጥር' : 'Duplicate transaction'}
        </label>
      </FilterBar>

      {paymentsQuery.isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : paymentsQuery.isError ? (
        <ErrorState
          onRetry={() => paymentsQuery.refetch()}
          description={locale === 'am' ? 'ክፍያዎችን መጫን አልተቻለም።' : 'Unable to load payments.'}
        />
      ) : payments.length === 0 ? (
        <EmptyState
          title={locale === 'am' ? 'ምንም ክፍያ አልተገኘም' : 'No payments found'}
          description={
            hasActiveFilters
              ? locale === 'am'
                ? 'ከማጣሪያዎችዎ ጋር የሚዛመድ ክፍያ የለም።'
                : 'No payments match your filters.'
              : locale === 'am'
                ? 'እስካሁን ምንም የቀረበ ክፍያ የለም።'
                : 'No payments have been submitted yet.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={resetFilters}>
                {locale === 'am' ? 'ማጣሪያዎችን አጽዳ' : 'Reset filters'}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === 'am' ? 'ተማሪ' : 'Student'}</TableHead>
                <TableHead>{locale === 'am' ? 'ኮርስ' : 'Course'}</TableHead>
                <TableHead>{locale === 'am' ? 'መጠን' : 'Amount'}</TableHead>
                <TableHead>{locale === 'am' ? 'ሁኔታ' : 'Status'}</TableHead>
                <TableHead>{locale === 'am' ? 'የቀረበበት ቀን' : 'Submitted'}</TableHead>
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
                      <p className="text-xs text-muted-foreground">
                        {payment.transactionId}
                        {payment.paymentMethodName && ` · ${payment.paymentMethodName}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-foreground">
                    {formatCurrency(payment.submittedAmount, payment.currency)}
                    {payment.amountMismatch && (
                      <AlertTriangle
                        className="ml-1.5 inline size-3.5 text-warning"
                        aria-label={locale === 'am' ? 'የተሳሳተ መጠን' : 'Amount mismatch'}
                      />
                    )}
                    {payment.promoCode && (
                      <span className="ml-1.5 inline-block rounded-full bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">
                        {payment.promoCode}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[payment.status]}>
                      {formatPaymentStatus(payment.status, locale)}
                    </Badge>
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
          <p className="text-sm text-muted-foreground">
            {locale === 'am'
              ? `${payments.length} ክፍያዎች ይታያሉ`
              : `Showing ${payments.length} payments`}
          </p>
          {hasMore && (
            <Button
              variant="outline"
              onClick={() => setPageSize(pageSize + PAGE_SIZE)}
              disabled={paymentsQuery.isFetching}
            >
              {paymentsQuery.isFetching && <Loader2 className="mr-2 size-4 animate-spin" />}
              {locale === 'am' ? 'ተጨማሪ አሳይ' : 'Load more'}
            </Button>
          )}
        </div>
      )}

      <PaymentDetailSheet paymentId={selectedId} onClose={() => setSelectedId(null)} />
    </ContentContainer>
  );
}
