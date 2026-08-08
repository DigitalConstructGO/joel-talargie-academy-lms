'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Can } from '@/components/auth/can';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useArchiveRole, useRoles } from '@/features/roles/hooks/use-roles';
import type { Role } from '@/features/roles/types/role.types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';
import { toast } from '@/lib/toast';

const PAGE_SIZE = 20;

interface RolesFilters {
  [key: string]: string | undefined;
  scope: 'ALL' | 'SYSTEM' | 'CUSTOM';
  search: string | undefined;
}

const DEFAULT_FILTERS: RolesFilters = { scope: 'ALL', search: undefined };

const SCOPE_OPTIONS = [
  { label: 'System roles', value: 'SYSTEM' },
  { label: 'Custom roles', value: 'CUSTOM' },
];

export default function AdminRolesPage() {
  const { filters, page, pageSize, setFilter, setPage } = useQueryFilters<RolesFilters>({
    defaults: DEFAULT_FILTERS,
    pageSize: PAGE_SIZE,
  });
  const { scope, search } = filters;
  const archiveRole = useArchiveRole();

  const rolesQuery = useRoles({
    page,
    pageSize,
    search: search || undefined,
    isSystem: scope === 'ALL' ? undefined : scope === 'SYSTEM',
  });

  const totalPages = Math.max(1, Math.ceil((rolesQuery.data?.total ?? 0) / pageSize));

  async function handleArchive(roleId: string) {
    try {
      await archiveRole.mutateAsync(roleId);
      toast.success('Role archived');
    } catch {
      toast.error('Could not archive this role');
    }
  }

  const columns = useMemo<ColumnDef<Role, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link href={ROUTES.admin.systemRoleDetail(row.original.id)} className="hover:underline">
            <span className="font-medium text-foreground">{row.original.name}</span>
            <p className="text-xs text-muted-foreground">{row.original.code}</p>
          </Link>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => row.original.description || '—',
      },
      {
        accessorKey: 'isSystem',
        header: 'Scope',
        cell: ({ row }) => (
          <Badge variant={row.original.isSystem ? 'secondary' : 'outline'}>
            {row.original.isSystem ? 'System' : 'Custom'}
          </Badge>
        ),
      },
      { accessorKey: 'permissionCount', header: 'Permissions' },
      { accessorKey: 'userCount', header: 'Users' },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => formatDate(row.original.createdAt),
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
              <DropdownMenuItem asChild>
                <Link href={ROUTES.admin.systemRoleDetail(row.original.id)} className="gap-2">
                  <Eye className="size-4" /> View
                </Link>
              </DropdownMenuItem>
              {!row.original.isSystem && (
                <Can permission="roles.update">
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.admin.systemRoleEdit(row.original.id)} className="gap-2">
                      <Pencil className="size-4" /> Edit
                    </Link>
                  </DropdownMenuItem>
                </Can>
              )}
              {!row.original.isSystem && (
                <Can permission="roles.archive">
                  <ConfirmDialog
                    trigger={
                      <DropdownMenuItem
                        onSelect={(event) => event.preventDefault()}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" /> Archive
                      </DropdownMenuItem>
                    }
                    title="Archive this role?"
                    description="Users assigned this role keep it, but it can no longer be assigned to new users."
                    confirmLabel="Archive"
                    variant="destructive"
                    onConfirm={() => handleArchive(row.original.id)}
                  />
                </Can>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleArchive is stable per render cycle via archiveRole mutation identity
    [],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[{ label: 'Dashboard', href: ROUTES.admin.root }, { label: 'Roles' }]}
      />
      <PageHeader
        title="Roles"
        description="Manage roles and role assignments."
        actions={
          <Can permission="roles.create">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.systemRoleCreate}>
                <Plus className="size-4" />
                New Role
              </Link>
            </Button>
          </Can>
        }
      />

      <FilterBar>
        <SearchBar
          placeholder="Search by name or code..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label="Scope"
          value={scope === 'ALL' ? undefined : scope}
          onChange={(value) => setFilter('scope', (value ?? 'ALL') as RolesFilters['scope'])}
          options={SCOPE_OPTIONS}
        />
      </FilterBar>

      {rolesQuery.isError ? (
        <ErrorState onRetry={() => rolesQuery.refetch()} description="Unable to load roles." />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rolesQuery.data?.items ?? []}
            isLoading={rolesQuery.isLoading}
            emptyTitle="No roles found"
            emptyDescription="No roles match your filters."
            manualPagination
          />
          {!rolesQuery.isLoading && (rolesQuery.data?.items.length ?? 0) > 0 && (
            <DynamicPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showFirstLast
            />
          )}
        </>
      )}
    </ContentContainer>
  );
}
