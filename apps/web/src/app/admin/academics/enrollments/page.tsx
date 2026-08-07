'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, Loader2, XCircle } from 'lucide-react';
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
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Can } from '@/components/auth/can';
import { useQueryFilters } from '@/hooks/use-query-filters';
import {
  useAdminEnrollment,
  useAdminEnrollments,
  useCancelEnrollment,
  useRevokeEnrollmentAccess,
} from '@/features/enrollments/hooks/use-admin-enrollments';
import type { AdminEnrollment } from '@/features/enrollments/types/admin-enrollment.types';
import type { EnrollmentStatus } from '@/features/enrollments/types/enrollment.types';
import { formatCurrency } from '@/lib/format';
import { formatDateTime } from '@/lib/date';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';

const PAGE_SIZE = 20;

interface EnrollmentsFilters {
  [key: string]: string | undefined;
  status: 'ALL' | EnrollmentStatus;
  search: string | undefined;
}

const DEFAULT_FILTERS: EnrollmentsFilters = { status: 'ALL', search: undefined };

const STATUS_OPTIONS = [
  { label: 'Pending payment', value: 'PENDING_PAYMENT' },
  { label: 'Waiting approval', value: 'WAITING_APPROVAL' },
  { label: 'Enrolled', value: 'ENROLLED' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Access revoked', value: 'ACCESS_REVOKED' },
];

const STATUS_VARIANT: Record<EnrollmentStatus, NonNullable<BadgeProps['variant']>> = {
  PENDING_PAYMENT: 'warning',
  WAITING_APPROVAL: 'warning',
  ENROLLED: 'secondary',
  IN_PROGRESS: 'secondary',
  COMPLETED: 'success',
  CANCELLED: 'outline',
  ACCESS_REVOKED: 'destructive',
};

function EnrollmentDetailSheet({
  enrollmentId,
  onClose,
}: {
  enrollmentId: string | null;
  onClose: () => void;
}) {
  const enrollmentQuery = useAdminEnrollment(enrollmentId ?? '');
  const cancelEnrollment = useCancelEnrollment();
  const revokeAccess = useRevokeEnrollmentAccess();
  const [cancelReason, setCancelReason] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const enrollment = enrollmentQuery.data;

  async function handleCancel() {
    if (!enrollmentId) return;
    try {
      await cancelEnrollment.mutateAsync({ enrollmentId, reason: cancelReason });
      toast.success('Enrollment cancelled');
      setCancelReason('');
    } catch {
      toast.error('Could not cancel this enrollment');
    }
  }

  async function handleRevoke() {
    if (!enrollmentId) return;
    try {
      await revokeAccess.mutateAsync({ enrollmentId, reason: revokeReason });
      toast.success('Access revoked');
      setRevokeReason('');
    } catch {
      toast.error('Could not revoke access');
    }
  }

  return (
    <Sheet open={Boolean(enrollmentId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Enrollment details</SheetTitle>
          <SheetDescription>Student progress, payment, and access status.</SheetDescription>
        </SheetHeader>

        {enrollmentQuery.isLoading || !enrollment ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {enrollment.courseTitle}
              </span>
              <Badge variant={STATUS_VARIANT[enrollment.status]}>{enrollment.status}</Badge>
            </div>
            <Separator />
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Student</dt>
                <dd className="font-medium text-foreground">
                  {[enrollment.firstName, enrollment.lastName].filter(Boolean).join(' ') ||
                    enrollment.studentEmail}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">{enrollment.studentEmail}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Price paid</dt>
                <dd className="font-medium text-foreground">
                  {formatCurrency(
                    enrollment.discountSnapshot ?? enrollment.priceSnapshot,
                    enrollment.currencySnapshot,
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Payment attempts</dt>
                <dd className="font-medium text-foreground">{enrollment.paymentAttempts}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Enrolled</dt>
                <dd className="font-medium text-foreground">
                  {enrollment.enrolledAt ? formatDateTime(enrollment.enrolledAt) : '—'}
                </dd>
              </div>
              {enrollment.completedAt && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Completed</dt>
                  <dd className="font-medium text-foreground">
                    {formatDateTime(enrollment.completedAt)}
                  </dd>
                </div>
              )}
            </dl>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{enrollment.progressPercentage}%</span>
              </div>
              <Progress value={enrollment.progressPercentage} />
            </div>

            {enrollment.cancellationReason && (
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Cancelled: {enrollment.cancellationReason}
              </p>
            )}
            {enrollment.accessRevocationReason && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                Access revoked: {enrollment.accessRevocationReason}
              </p>
            )}

            {enrollment.hasLearningAccess && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {['ENROLLED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'PENDING_PAYMENT'].includes(
                    enrollment.status,
                  ) && (
                    <Can permission="enrollments.cancel">
                      <ConfirmDialog
                        trigger={
                          <Button variant="outline" size="sm" className="gap-2">
                            <XCircle className="size-3.5" /> Cancel
                          </Button>
                        }
                        title="Cancel this enrollment?"
                        description="The student loses course access."
                        confirmLabel="Cancel enrollment"
                        variant="destructive"
                        confirmDisabled={!cancelReason.trim()}
                        onConfirm={handleCancel}
                      >
                        <div className="space-y-2 py-2">
                          <Label htmlFor="cancel-reason">Reason</Label>
                          <Textarea
                            id="cancel-reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </ConfirmDialog>
                    </Can>
                  )}
                  <Can permission="enrollments.revoke">
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Ban className="size-3.5" /> Revoke access
                        </Button>
                      }
                      title="Revoke course access?"
                      description="The student immediately loses access to this course."
                      confirmLabel="Revoke access"
                      variant="destructive"
                      confirmDisabled={!revokeReason.trim()}
                      onConfirm={handleRevoke}
                    >
                      <div className="space-y-2 py-2">
                        <Label htmlFor="revoke-reason">Reason</Label>
                        <Textarea
                          id="revoke-reason"
                          value={revokeReason}
                          onChange={(e) => setRevokeReason(e.target.value)}
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

export default function AdminEnrollmentsPage() {
  const { filters, page, pageSize, setFilter, setPage } = useQueryFilters<EnrollmentsFilters>({
    defaults: DEFAULT_FILTERS,
    pageSize: PAGE_SIZE,
  });
  const { status, search } = filters;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const enrollmentsQuery = useAdminEnrollments({
    page,
    pageSize,
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
  });

  const totalPages = Math.max(1, Math.ceil((enrollmentsQuery.data?.total ?? 0) / pageSize));

  const columns = useMemo<ColumnDef<AdminEnrollment, unknown>[]>(
    () => [
      {
        id: 'student',
        header: 'Student',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">
              {[row.original.firstName, row.original.lastName].filter(Boolean).join(' ') ||
                row.original.studentEmail}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.studentEmail}</p>
          </div>
        ),
      },
      { accessorKey: 'courseTitle', header: 'Course' },
      {
        accessorKey: 'progressPercentage',
        header: 'Progress',
        cell: ({ row }) => `${row.original.progressPercentage}%`,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>
        ),
      },
      {
        accessorKey: 'enrolledAt',
        header: 'Enrolled',
        cell: ({ row }) =>
          row.original.enrolledAt ? formatDateTime(row.original.enrolledAt) : '—',
      },
    ],
    [],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Academic Management', href: ROUTES.admin.academics },
          { label: 'Enrollments' },
        ]}
      />
      <PageHeader title="Enrollments" description="Every student enrollment across all courses." />

      <FilterBar>
        <SearchBar
          placeholder="Search by student or course..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label="Status"
          value={status === 'ALL' ? undefined : status}
          onChange={(value) =>
            setFilter('status', (value ?? 'ALL') as EnrollmentsFilters['status'])
          }
          options={STATUS_OPTIONS}
        />
      </FilterBar>

      {enrollmentsQuery.isError ? (
        <ErrorState
          onRetry={() => enrollmentsQuery.refetch()}
          description="Unable to load enrollments."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={enrollmentsQuery.data?.items ?? []}
            isLoading={enrollmentsQuery.isLoading}
            emptyTitle="No enrollments found"
            emptyDescription="No enrollments match your filters."
            manualPagination
            onRowClick={(row) => setSelectedId(row.id)}
          />
          {!enrollmentsQuery.isLoading && (enrollmentsQuery.data?.items.length ?? 0) > 0 && (
            <DynamicPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showFirstLast
            />
          )}
        </>
      )}

      <EnrollmentDetailSheet enrollmentId={selectedId} onClose={() => setSelectedId(null)} />
    </ContentContainer>
  );
}
