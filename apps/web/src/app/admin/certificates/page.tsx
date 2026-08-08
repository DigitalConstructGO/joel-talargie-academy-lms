'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { SearchBar } from '@/components/common/search-bar';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/dashboard/skeletons/table-skeleton';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useAdminCertificates } from '@/features/certificates/hooks/use-admin-certificates';
import { useAdminCourses } from '@/features/catalog/hooks/use-admin-courses';
import type { CertificateStatus } from '@/features/certificates/types/certificate.types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';

const PAGE_SIZE = 20;

interface CertificatesFilters {
  [key: string]: string | undefined;
  status: 'ALL' | CertificateStatus;
  courseId: string | undefined;
  search: string | undefined;
}

const DEFAULT_FILTERS: CertificatesFilters = {
  status: 'ALL',
  courseId: undefined,
  search: undefined,
};

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Issued', value: 'GENERATED' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Revoked', value: 'REVOKED' },
];

const STATUS_VARIANT: Record<CertificateStatus, NonNullable<BadgeProps['variant']>> = {
  PENDING: 'warning',
  GENERATED: 'success',
  FAILED: 'destructive',
  REVOKED: 'outline',
};

export default function AdminCertificatesPage() {
  const { filters, pageSize, setFilter, setPageSize, resetFilters } =
    useQueryFilters<CertificatesFilters>({ defaults: DEFAULT_FILTERS, pageSize: PAGE_SIZE });
  const { status, courseId, search } = filters;

  const coursesQuery = useAdminCourses({ pageSize: 100 });
  const courseOptions = (coursesQuery.data?.items ?? []).map((course) => ({
    label: course.title,
    value: course.id,
  }));

  const certificatesQuery = useAdminCertificates({
    page: 1,
    pageSize,
    status: status === 'ALL' ? undefined : status,
    courseId: courseId || undefined,
    search: search || undefined,
  });

  const certificates = certificatesQuery.data ?? [];
  const hasMore = certificates.length === pageSize;
  const hasActiveFilters = status !== 'ALL' || Boolean(courseId) || Boolean(search);

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[{ label: 'Dashboard', href: ROUTES.admin.root }, { label: 'Certificates' }]}
      />
      <PageHeader
        title="Certificate Management"
        description="Every certificate issued across the platform."
      />

      <FilterBar>
        <SearchBar
          placeholder="Search by certificate number, student, or course..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-72"
        />
        <SelectFilter
          label="Status"
          value={status === 'ALL' ? undefined : status}
          onChange={(value) =>
            setFilter('status', (value ?? 'ALL') as CertificatesFilters['status'])
          }
          options={STATUS_OPTIONS}
        />
        <SelectFilter
          label="Course"
          value={courseId}
          onChange={(value) => setFilter('courseId', value)}
          options={courseOptions}
        />
      </FilterBar>

      {certificatesQuery.isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : certificatesQuery.isError ? (
        <ErrorState
          onRetry={() => certificatesQuery.refetch()}
          description="Unable to load certificates."
        />
      ) : certificates.length === 0 ? (
        <EmptyState
          title="No certificates found"
          description={
            hasActiveFilters
              ? 'No certificates match your filters.'
              : 'No certificates have been issued yet.'
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
                <TableHead>Certificate</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((certificate) => (
                <TableRow key={certificate.id}>
                  <TableCell>
                    <Link
                      href={ROUTES.admin.certificateDetail(certificate.id)}
                      className="font-medium text-foreground hover:underline"
                    >
                      {certificate.certificateNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate">{certificate.studentName}</p>
                      <p className="text-xs text-muted-foreground">{certificate.studentEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-52 truncate">{certificate.courseTitle}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[certificate.status]}>{certificate.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {certificate.issuedAt ? formatDate(certificate.issuedAt) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!certificatesQuery.isLoading && certificates.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {certificates.length} certificates
          </p>
          {hasMore && (
            <Button
              variant="outline"
              onClick={() => setPageSize(pageSize + PAGE_SIZE)}
              disabled={certificatesQuery.isFetching}
            >
              {certificatesQuery.isFetching && <Loader2 className="mr-2 size-4 animate-spin" />}
              Load more
            </Button>
          )}
        </div>
      )}
    </ContentContainer>
  );
}
