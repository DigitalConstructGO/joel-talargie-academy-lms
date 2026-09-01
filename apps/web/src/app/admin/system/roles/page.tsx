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

import { useLanguage } from '@/lib/i18n/language-provider';

const PAGE_SIZE = 20;

interface RolesFilters {
  [key: string]: string | undefined;
  scope: 'ALL' | 'SYSTEM' | 'CUSTOM';
  search: string | undefined;
}

const DEFAULT_FILTERS: RolesFilters = { scope: 'ALL', search: undefined };

function translateRoleName(name: string, locale: string): string {
  if (locale !== 'am') return name;

  const ROLE_MAP_AM: Record<string, string> = {
    Administrator: 'አስተዳዳሪ',
    'Content Manager': 'የይዘት አስተዳዳሪ',
    Instructor: 'አስተማሪ',
    Student: 'ተማሪ',
  };

  return ROLE_MAP_AM[name] || name;
}

function translateRoleDescription(desc: string | null | undefined, locale: string): string {
  if (!desc) return '—';
  if (locale !== 'am') return desc;

  const DESC_MAP_AM: Record<string, string> = {
    'Full academy administration access': 'ሙሉ የአካዳሚ አስተዳደር መዳረሻ',
    'Manages the course catalog, categories, and promotional campaigns.':
      'የኮርስ ካታሎግ፣ ምድቦች እና ማስተዋወቂያዎችን ያስተዳድራል።',
    'Creates and manages courses, curriculum, and lesson content.':
      'ኮርሶችን፣ ስርዓተ ትምህርቶችን እና የትምህርት ይዘቶችን ይፈጥራል እንዲሁም ያስተዳድራል።',
    'Academy learner access': 'የአካዳሚ ተማሪ መዳረሻ',
  };

  return DESC_MAP_AM[desc] || desc;
}

export default function AdminRolesPage() {
  const { locale } = useLanguage();
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

  const scopeOptions = useMemo(
    () => [
      { label: locale === 'am' ? 'የሲስተም ሚናዎች' : 'System roles', value: 'SYSTEM' },
      { label: locale === 'am' ? 'የተበጁ ሚናዎች' : 'Custom roles', value: 'CUSTOM' },
    ],
    [locale],
  );

  const totalPages = Math.max(1, Math.ceil((rolesQuery.data?.total ?? 0) / pageSize));

  async function handleArchive(roleId: string) {
    try {
      await archiveRole.mutateAsync(roleId);
      toast.success(locale === 'am' ? 'ሚናው ተቀምጧል' : 'Role archived');
    } catch {
      toast.error(locale === 'am' ? 'ሚናውን ማስቀመጥ አልተቻለም' : 'Could not archive this role');
    }
  }

  const columns = useMemo<ColumnDef<Role, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: locale === 'am' ? 'ስም' : 'Name',
        cell: ({ row }) => (
          <Link href={ROUTES.admin.systemRoleDetail(row.original.id)} className="hover:underline">
            <span className="font-medium text-foreground">
              {translateRoleName(row.original.name, locale)}
            </span>
            <p className="text-xs text-muted-foreground">{row.original.code}</p>
          </Link>
        ),
      },
      {
        accessorKey: 'description',
        header: locale === 'am' ? 'መግለጫ' : 'Description',
        cell: ({ row }) => translateRoleDescription(row.original.description, locale),
      },
      {
        accessorKey: 'isSystem',
        header: locale === 'am' ? 'ወሰን' : 'Scope',
        cell: ({ row }) => (
          <Badge variant={row.original.isSystem ? 'secondary' : 'outline'}>
            {row.original.isSystem
              ? locale === 'am'
                ? 'ሲስተም'
                : 'System'
              : locale === 'am'
                ? 'የተበጀ'
                : 'Custom'}
          </Badge>
        ),
      },
      {
        accessorKey: 'permissionCount',
        header: locale === 'am' ? 'ፈቃዶች' : 'Permissions',
      },
      {
        accessorKey: 'userCount',
        header: locale === 'am' ? 'ተጠቃሚዎች' : 'Users',
      },
      {
        accessorKey: 'createdAt',
        header: locale === 'am' ? 'የተፈጠረበት' : 'Created',
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
                  <Eye className="size-4" /> {locale === 'am' ? 'እይ' : 'View'}
                </Link>
              </DropdownMenuItem>
              {!row.original.isSystem && (
                <Can permission="roles.update">
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.admin.systemRoleEdit(row.original.id)} className="gap-2">
                      <Pencil className="size-4" /> {locale === 'am' ? 'አስተካክል' : 'Edit'}
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
                        <Trash2 className="size-4" /> {locale === 'am' ? 'አስቀምጥ' : 'Archive'}
                      </DropdownMenuItem>
                    }
                    title={locale === 'am' ? 'ይህንን ሚና ማስቀመጥ ይፈልጋሉ?' : 'Archive this role?'}
                    description={
                      locale === 'am'
                        ? 'ይህ ሚና የተሰጣቸው ተጠቃሚዎች ይይዙታል፣ ነገር ግን ከአሁን በኋላ ለአዳዲስ ተማሪዎች ሊሰጥ አይችልም።'
                        : 'Users assigned this role keep it, but it can no longer be assigned to new users.'
                    }
                    confirmLabel={locale === 'am' ? 'አስቀምጥ' : 'Archive'}
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
    [locale],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: locale === 'am' ? 'ዳሽቦርድ' : 'Dashboard', href: ROUTES.admin.root },
          { label: locale === 'am' ? 'ሚናዎች' : 'Roles' },
        ]}
      />
      <PageHeader
        title={locale === 'am' ? 'ሚናዎች' : 'Roles'}
        description={
          locale === 'am'
            ? 'የሲስተሙን የተጠቃሚ ሚናዎች እና የፈቃድ ወሰኖቻቸውን ያስተዳድሩ።'
            : 'Manage system user roles and permission scopes.'
        }
        actions={
          <Can permission="roles.create">
            <Button asChild className="gap-2">
              <Link href={ROUTES.admin.systemRoleCreate}>
                <Plus className="size-4" />
                {locale === 'am' ? 'ሚና ጨምር' : 'Add role'}
              </Link>
            </Button>
          </Can>
        }
      />

      <FilterBar>
        <SearchBar
          placeholder={locale === 'am' ? 'በስም ወይም በኮድ ፈልግ...' : 'Search by name or code...'}
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label={locale === 'am' ? 'ወሰን' : 'Scope'}
          value={scope === 'ALL' ? undefined : scope}
          onChange={(value) => setFilter('scope', (value ?? 'ALL') as RolesFilters['scope'])}
          options={scopeOptions}
        />
      </FilterBar>

      {rolesQuery.isError ? (
        <ErrorState
          onRetry={() => rolesQuery.refetch()}
          description={locale === 'am' ? 'ሚናዎችን መጫን አልተቻለም።' : 'Unable to load roles.'}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rolesQuery.data?.items ?? []}
            isLoading={rolesQuery.isLoading}
            emptyTitle={locale === 'am' ? 'ምንም ሚና አልተገኘም' : 'No roles found'}
            emptyDescription={
              locale === 'am' ? 'ከማጣሪያዎችዎ ጋር የሚዛመድ ሚና የለም።' : 'No roles match your filters.'
            }
            manualPagination
          />
          {!rolesQuery.isLoading && (rolesQuery.data?.items.length ?? 0) > 0 && (
            <DynamicPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showFirstLast
              isLoading={rolesQuery.isFetching}
            />
          )}
        </>
      )}
    </ContentContainer>
  );
}
