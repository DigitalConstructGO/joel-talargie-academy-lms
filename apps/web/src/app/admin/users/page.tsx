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

import { useLanguage } from '@/lib/i18n/language-provider';

const PAGE_SIZE = 10;

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

const STATUS_VARIANT: Record<ManagedUserStatus, NonNullable<BadgeProps['variant']>> = {
  PENDING_VERIFICATION: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'destructive',
  ARCHIVED: 'outline',
};

function formatUserRole(role: string, locale: string): string {
  if (locale !== 'am') return role;

  const ROLE_MAP_AM: Record<string, string> = {
    STUDENT: 'ተማሪ',
    INSTRUCTOR: 'አስተማሪ',
    ADMINISTRATOR: 'አስተዳዳሪ',
    CONTENT_MANAGER: 'የይዘት አስተዳዳሪ',
  };

  return ROLE_MAP_AM[role] || role;
}

export default function AdminUsersPage() {
  const { locale } = useLanguage();
  const { filters, page, pageSize, setFilter, setPage, resetFilters } =
    useQueryFilters<UsersFilters>({ defaults: DEFAULT_FILTERS, pageSize: PAGE_SIZE });
  const { status, provider, role, search } = filters;

  const rolesQuery = useRoles({ pageSize: 100 });
  const roleOptions = (rolesQuery.data?.items ?? []).map((r) => ({
    label: locale === 'am' ? formatUserRole(r.code, locale) : r.name,
    value: r.code,
  }));

  const usersQuery = useUsers({
    page,
    pageSize,
    status: status === 'ALL' ? undefined : status,
    provider: provider === 'ALL' ? undefined : provider,
    role: role || undefined,
    search: search || undefined,
    includeArchived: true,
  });

  const statusOptions = useMemo(
    () => [
      {
        label: locale === 'am' ? 'ማረጋገጫ በመጠባበቅ ላይ' : 'Pending verification',
        value: 'PENDING_VERIFICATION',
      },
      { label: locale === 'am' ? 'ንቁ' : 'Active', value: 'ACTIVE' },
      { label: locale === 'am' ? 'እገዳ የተደረገበት' : 'Suspended', value: 'SUSPENDED' },
      { label: locale === 'am' ? 'የተቀመጠ' : 'Archived', value: 'ARCHIVED' },
    ],
    [locale],
  );

  const providerOptions = useMemo(
    () => [
      { label: locale === 'am' ? 'ኢሜይል እና የይለፍ ቃል' : 'Email & password', value: 'LOCAL' },
      { label: 'Google', value: 'GOOGLE' },
    ],
    [locale],
  );

  const getStatusLabel = (s: ManagedUserStatus) => {
    if (locale !== 'am') {
      switch (s) {
        case 'PENDING_VERIFICATION':
          return 'Pending verification';
        case 'ACTIVE':
          return 'Active';
        case 'SUSPENDED':
          return 'Suspended';
        case 'ARCHIVED':
          return 'Archived';
        default:
          return s;
      }
    }
    switch (s) {
      case 'PENDING_VERIFICATION':
        return 'ማረጋገጫ በመጠባበቅ ላይ';
      case 'ACTIVE':
        return 'ንቁ';
      case 'SUSPENDED':
        return 'እገዳ የተደረገበት';
      case 'ARCHIVED':
        return 'የተቀመጠ';
      default:
        return s;
    }
  };

  const hasActiveFilters =
    status !== 'ALL' || provider !== 'ALL' || Boolean(role) || Boolean(search);
  const totalPages = Math.max(1, Math.ceil((usersQuery.data?.total ?? 0) / pageSize));

  const columns = useMemo<ColumnDef<ManagedUser, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: locale === 'am' ? 'ስም' : 'Name',
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
      { accessorKey: 'email', header: locale === 'am' ? 'ኢሜይል' : 'Email' },
      {
        accessorKey: 'roles',
        header: locale === 'am' ? 'ሚና' : 'Role',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map((r) => (
              <Badge key={r} variant="secondary">
                {formatUserRole(r, locale)}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: locale === 'am' ? 'ሁኔታ' : 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {getStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'emailVerified',
        header: locale === 'am' ? 'የተረጋገጠ' : 'Verified',
        cell: ({ row }) =>
          row.original.emailVerified
            ? locale === 'am'
              ? 'የተረጋገጠ'
              : 'Verified'
            : locale === 'am'
              ? 'ያልተረጋገጠ'
              : 'Unverified',
      },
      {
        accessorKey: 'createdAt',
        header: locale === 'am' ? 'የተፈጠረበት' : 'Created',
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: 'lastLoginAt',
        header: locale === 'am' ? 'መጨረሻ የገባበት' : 'Last Login',
        cell: ({ row }) =>
          row.original.lastLoginAt
            ? formatDate(row.original.lastLoginAt)
            : locale === 'am'
              ? 'አልገባም'
              : 'Never',
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
                    <Eye className="size-4" /> {locale === 'am' ? 'እይ' : 'View'}
                  </Link>
                </DropdownMenuItem>
              </Can>
              <Can permission="users.update">
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.admin.userEdit(row.original.id)} className="gap-2">
                    <Pencil className="size-4" /> {locale === 'am' ? 'አስተካክል' : 'Edit'}
                  </Link>
                </DropdownMenuItem>
              </Can>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [locale],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: locale === 'am' ? 'ዳሽቦርድ' : 'Dashboard', href: ROUTES.admin.root },
          { label: locale === 'am' ? 'ተጠቃሚዎች እና ሚናዎች' : 'Users & Roles' },
        ]}
      />
      <PageHeader
        title={locale === 'am' ? 'ተጠቃሚዎች እና ሚናዎች' : 'Users & Roles'}
        description={
          locale === 'am'
            ? 'የአካዳሚውን ተጠቃሚዎች፣ ሚናዎችን እና የመለያ ሁኔታዎችን ያስተዳድሩ።'
            : 'Manage academy users, roles, and account statuses.'
        }
      />

      <FilterBar
        chips={
          hasActiveFilters ? (
            <FilterChips
              chips={[
                ...(status !== 'ALL' ? [{ key: 'status', label: getStatusLabel(status) }] : []),
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
          placeholder={locale === 'am' ? 'በስም ወይም በኢሜይል ፈልግ...' : 'Search by name or email...'}
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label={locale === 'am' ? 'ሁኔታ' : 'Status'}
          value={status === 'ALL' ? undefined : status}
          onChange={(value) => setFilter('status', (value ?? 'ALL') as UsersFilters['status'])}
          options={statusOptions}
        />
        <SelectFilter
          label={locale === 'am' ? 'ፕሮቫይደር' : 'Provider'}
          value={provider === 'ALL' ? undefined : provider}
          onChange={(value) => setFilter('provider', (value ?? 'ALL') as UsersFilters['provider'])}
          options={providerOptions}
        />
        <SelectFilter
          label={locale === 'am' ? 'ሚና' : 'Role'}
          value={role}
          onChange={(value) => setFilter('role', value)}
          options={roleOptions}
        />
      </FilterBar>

      {usersQuery.isError ? (
        <ErrorState
          onRetry={() => usersQuery.refetch()}
          description={locale === 'am' ? 'ተጠቃሚዎችን መጫን አልተቻለም።' : 'Unable to load users.'}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={usersQuery.data?.items ?? []}
            isLoading={usersQuery.isLoading}
            emptyTitle={locale === 'am' ? 'ምንም ተጠቃሚ አልተገኘም' : 'No users found'}
            emptyDescription={
              hasActiveFilters
                ? locale === 'am'
                  ? 'ከማጣሪያዎችዎ ጋር የሚዛመድ ተጠቃሚ የለም።'
                  : 'No users match your filters. Try adjusting or clearing them.'
                : locale === 'am'
                  ? 'እስካሁን ምንም ተጠቃሚ አልተመዘገበም።'
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
