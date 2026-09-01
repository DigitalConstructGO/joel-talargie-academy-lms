'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { SearchBar } from '@/components/common/search-bar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { FilterChips } from '@/components/dashboard/filters/filter-chips';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { DashboardApiErrorState } from '@/components/dashboard/error-states';
import {
  NoCertificatesEmptyState,
  NoSearchResultsEmptyState,
} from '@/components/dashboard/empty-states';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useMyCertificates } from '@/features/certificates/hooks/use-certificates';
import { CertificateCard } from '@/features/certificates/components/certificate-card';
import { CertificateCardGridSkeleton } from '@/features/certificates/components/certificate-card-skeleton';
import type { CertificateStatus } from '@/features/certificates/types/certificate.types';
import { ROUTES } from '@/constants/routes';

import { useLanguage } from '@/lib/i18n/language-provider';

const PAGE_SIZE = 9;

interface CertificatesFilters {
  [key: string]: string | undefined;
  status: 'ALL' | CertificateStatus;
  search: string | undefined;
  sort: 'newest' | 'oldest';
}

const DEFAULT_FILTERS: CertificatesFilters = { status: 'ALL', search: undefined, sort: 'newest' };

const STATUS_OPTIONS = [
  { label: 'Issued', value: 'GENERATED' },
  { label: 'Generating', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Revoked', value: 'REVOKED' },
];

export default function CertificatesPage() {
  const { t } = useLanguage();
  const { filters, pageSize, setFilter, setPageSize, resetFilters } =
    useQueryFilters<CertificatesFilters>({
      defaults: DEFAULT_FILTERS,
      pageSize: PAGE_SIZE,
    });
  const { status, search, sort } = filters;

  const certificatesQuery = useMyCertificates({
    page: 1,
    pageSize,
    status: status === 'ALL' ? undefined : status,
  });

  const certificates = useMemo(() => {
    let items = certificatesQuery.data ?? [];
    if (search) {
      const needle = search.toLowerCase();
      items = items.filter(
        (certificate) =>
          certificate.courseTitle.toLowerCase().includes(needle) ||
          certificate.certificateNumber.toLowerCase().includes(needle),
      );
    }
    return [...items].sort((a, b) => {
      const aDate = String(a.createdAt ?? (a as unknown as Record<string, unknown>).issuedAt ?? '');
      const bDate = String(b.createdAt ?? (b as unknown as Record<string, unknown>).issuedAt ?? '');
      return sort === 'newest' ? bDate.localeCompare(aDate) : aDate.localeCompare(bDate);
    });
  }, [certificatesQuery.data, search, sort]);

  const hasMore = (certificatesQuery.data?.length ?? 0) === pageSize;
  const hasActiveFilters = status !== 'ALL' || Boolean(search);

  return (
    <ContentContainer>
      <PageHeader title={t('sidebar.certificates')} description={t('verifyCert.subtitle')} />

      <FilterBar
        chips={
          hasActiveFilters ? (
            <FilterChips
              chips={[
                ...(status !== 'ALL' ? [{ key: 'status', label: status }] : []),
                ...(search ? [{ key: 'search', label: `"${search}"` }] : []),
              ]}
              onRemove={(key) => {
                if (key === 'status') setFilter('status', 'ALL');
                if (key === 'search') setFilter('search', undefined);
              }}
              onResetAll={resetFilters}
            />
          ) : undefined
        }
      >
        <SearchBar
          placeholder="Search by course or certificate number..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label="Status"
          value={status === 'ALL' ? undefined : status}
          onChange={(value) =>
            setFilter('status', (value ?? 'ALL') as CertificatesFilters['status'])
          }
          options={STATUS_OPTIONS}
        />
        <Select
          value={sort}
          onValueChange={(value) => setFilter('sort', value as CertificatesFilters['sort'])}
        >
          <SelectTrigger className="w-40" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {certificatesQuery.isLoading ? (
        <CertificateCardGridSkeleton count={PAGE_SIZE} />
      ) : certificatesQuery.isError ? (
        <DashboardApiErrorState onRetry={() => certificatesQuery.refetch()} />
      ) : certificates.length === 0 ? (
        hasActiveFilters ? (
          <NoSearchResultsEmptyState
            action={
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            }
          />
        ) : (
          <NoCertificatesEmptyState
            action={
              <Button asChild>
                <Link href={ROUTES.dashboard.courses}>View my courses</Link>
              </Button>
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              href={ROUTES.dashboard.certificateDetail(certificate.id)}
            />
          ))}
        </div>
      )}

      {!certificatesQuery.isLoading && certificates.length > 0 && hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPageSize(pageSize + PAGE_SIZE)}
            disabled={certificatesQuery.isFetching}
          >
            {certificatesQuery.isFetching && <Loader2 className="mr-2 size-4 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </ContentContainer>
  );
}
