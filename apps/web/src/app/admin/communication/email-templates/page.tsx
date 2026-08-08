'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Plus } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { DataTable } from '@/components/common/data-table';
import { SearchBar } from '@/components/common/search-bar';
import { ErrorState } from '@/components/common/error-state';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/can';
import { useEmailTemplates } from '@/features/email-templates/hooks/use-email-templates';
import type { EmailTemplate } from '@/features/email-templates/types/email-template.types';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';

interface EmailTemplatesFilters {
  [key: string]: string | undefined;
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
  search: string | undefined;
}

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

export default function AdminEmailTemplatesPage() {
  const { filters, setFilter } = useQueryFilters<EmailTemplatesFilters>({
    defaults: { status: 'ALL', search: undefined },
  });
  const { status, search } = filters;
  const templatesQuery = useEmailTemplates();

  const filtered = (templatesQuery.data ?? []).filter((template) => {
    if (status !== 'ALL' && template.isActive !== (status === 'ACTIVE')) return false;
    if (search) {
      const needle = search.toLowerCase();
      if (
        !template.name.toLowerCase().includes(needle) &&
        !template.code.toLowerCase().includes(needle)
      )
        return false;
    }
    return true;
  });

  const columns = useMemo<ColumnDef<EmailTemplate, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={ROUTES.admin.communicationEmailTemplateDetail(row.original.id)}
            className="font-medium text-foreground hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Template Key',
        cell: ({ row }) => <code className="text-xs">{row.original.code}</code>,
      },
      { accessorKey: 'locale', header: 'Locale' },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'outline'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <Button asChild variant="ghost" size="icon" className="size-8" aria-label="View">
            <Link href={ROUTES.admin.communicationEmailTemplateDetail(row.original.id)}>
              <Eye className="size-4" />
            </Link>
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Communication', href: ROUTES.admin.communication },
          { label: 'Email Templates' },
        ]}
      />
      <PageHeader
        title="Email Templates"
        description="System transactional email templates. Templates are managed in code and shown here read-only, with live preview."
        actions={
          <Can permission="notifications.manage_templates">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.communicationEmailTemplateCreate}>
                <Plus className="size-4" />
                New Template
              </Link>
            </Button>
          </Can>
        }
      />

      <FilterBar>
        <SearchBar
          placeholder="Search by name or key..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label="Status"
          value={status === 'ALL' ? undefined : status}
          onChange={(value) =>
            setFilter('status', (value ?? 'ALL') as EmailTemplatesFilters['status'])
          }
          options={STATUS_OPTIONS}
        />
      </FilterBar>

      {templatesQuery.isError ? (
        <ErrorState
          onRetry={() => templatesQuery.refetch()}
          description="Unable to load email templates."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={templatesQuery.isLoading}
          emptyTitle="No email templates found"
          emptyDescription="No templates match your filters."
        />
      )}
    </ContentContainer>
  );
}
