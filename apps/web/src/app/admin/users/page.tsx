'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { DataTable } from '@/components/common/data-table';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { SearchBar } from '@/components/common/search-bar';
import { ErrorState } from '@/components/common/error-state';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { FilterChips } from '@/components/dashboard/filters/filter-chips';
import { SelectFilter } from '@/components/dashboard/filters/select-filter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Can } from '@/components/auth/can';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useUsers } from '@/features/users/hooks/use-users';
import { useRoles } from '@/features/roles/hooks/use-roles';
import type { ManagedUser, ManagedUserStatus } from '@/features/users/types/user.types';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';

const PAGE_SIZE = 20;

interface UsersFilters {
  [key: string]: string | undefined;
  status: 'ALL' | ManagedUserStatus;
  provider: 'ALL' | 'LOCAL' | 'GOOGLE';
  role: string | undefined;
  search: string | undefined;
}

const DEFAULT_FILTERS: UsersFilters = {
  status: 'ALL',
  provider: 'ALL',
  role: undefined,
  search: undefined,
};

const STATUS_OPTIONS = [
  { label: 'Pending verification', value: 'PENDING_VERIFICATION' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const PROVIDER_OPTIONS = [
  { label: 'Email & password', value: 'LOCAL' },
  { label: 'Google', value: 'GOOGLE' },
];

const STATUS_VARIANT: Record<ManagedUserStatus, NonNullable<BadgeProps['variant']>> = {
  PENDING_VERIFICATION: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'destructive',
  ARCHIVED: 'outline',
};

const STATUS_LABEL: Record<ManagedUserStatus, string> = {
  PENDING_VERIFICATION: 'Pending verification',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  ARCHIVED: 'Archived',
};

export default function AdminUsersPage() {
  const { filters, page, pageSize, setFilter, setPage, resetFilters } =
    useQueryFilters<UsersFilters>({ defaults: DEFAULT_FILTERS, pageSize: PAGE_SIZE });
  const { status, provider, role, search } = filters;

  const rolesQuery = useRoles({ pageSize: 100 });
  const roleOptions = (rolesQuery.data?.items ?? []).map((r) => ({
    label: r.name,
    value: r.code,
  }));

  const usersQuery = useUsers({
    page,
    pageSize,
    status: status === 'ALL' ? undefined : status,
    provider: provider === 'ALL' ? undefined : provider,
    role: role || undefined,
    search: search || undefined,
    includeArchived: status === 'ARCHIVED' || undefined,
  });

  const hasActiveFilters =
    status !== 'ALL' || provider !== 'ALL' || Boolean(role) || Boolean(search);
  const totalPages = Math.max(1, Math.ceil((usersQuery.data?.total ?? 0) / pageSize));

  const columns = useMemo<ColumnDef<ManagedUser, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={ROUTES.admin.userDetail(row.original.id)}
            className="flex items-center gap-3 hover:underline"
          >
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {row.original.fullName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{row.original.fullName || '—'}</span>
          </Link>
        ),
      },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'roles',
        header: 'Role',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: 'emailVerified',
        header: 'Email verified',
        cell: ({ row }) => (row.original.emailVerified ? 'Verified' : 'Unverified'),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: 'lastLoginAt',
        header: 'Last login',
        cell: ({ row }) =>
          row.original.lastLoginAt ? formatDate(row.original.lastLoginAt) : 'Never',
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
              <Can permission="users.read">
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.admin.userDetail(row.original.id)} className="gap-2">
                    <Eye className="size-4" /> View
                  </Link>
                </DropdownMenuItem>
              </Can>
              <Can permission="users.update">
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.admin.userEdit(row.original.id)} className="gap-2">
                    <Pencil className="size-4" /> Edit profile
                  </Link>
                </DropdownMenuItem>
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[{ label: 'Dashboard', href: ROUTES.admin.root }, { label: 'Users' }]}
      />
      <PageHeader
        title="User Management"
        description="Manage students, instructors, and administrators."
      />

      <FilterBar
        chips={
          hasActiveFilters ? (
            <FilterChips
              chips={[
                ...(status !== 'ALL' ? [{ key: 'status', label: STATUS_LABEL[status] }] : []),
                ...(provider !== 'ALL' ? [{ key: 'provider', label: provider }] : []),
                ...(role
                  ? [
                      {
                        key: 'role',
                        label: roleOptions.find((option) => option.value === role)?.label ?? role,
                      },
                    ]
                  : []),
                ...(search ? [{ key: 'search', label: `"${search}"` }] : []),
              ]}
              onRemove={(key) => {
                if (key === 'status') setFilter('status', 'ALL');
                if (key === 'provider') setFilter('provider', 'ALL');
                if (key === 'role') setFilter('role', undefined);
                if (key === 'search') setFilter('search', undefined);
              }}
              onResetAll={resetFilters}
            />
          ) : undefined
        }
      >
        <SearchBar
          placeholder="Search by name or email..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label="Status"
          value={status === 'ALL' ? undefined : status}
          onChange={(value) => setFilter('status', (value ?? 'ALL') as UsersFilters['status'])}
          options={STATUS_OPTIONS}
        />
        <SelectFilter
          label="Provider"
          value={provider === 'ALL' ? undefined : provider}
          onChange={(value) => setFilter('provider', (value ?? 'ALL') as UsersFilters['provider'])}
          options={PROVIDER_OPTIONS}
        />
        <SelectFilter
          label="Role"
          value={role}
          onChange={(value) => setFilter('role', value)}
          options={roleOptions}
        />
      </FilterBar>

      {usersQuery.isError ? (
        <ErrorState onRetry={() => usersQuery.refetch()} description="Unable to load users." />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={usersQuery.data?.items ?? []}
            isLoading={usersQuery.isLoading}
            emptyTitle="No users found"
            emptyDescription={
              hasActiveFilters
                ? 'No users match your filters. Try adjusting or clearing them.'
                : 'No users have registered yet.'
            }
            manualPagination
          />
          {!usersQuery.isLoading && (usersQuery.data?.items.length ?? 0) > 0 && (
            <DynamicPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showFirstLast
              isLoading={usersQuery.isFetching}
            />
          )}
        </>
      )}
    </ContentContainer>
  );
}
