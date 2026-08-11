'use client';

import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { SearchBar } from '@/components/common/search-bar';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { usePermissionCatalog } from '@/features/permissions/hooks/use-permission-catalog';
import { ROUTES } from '@/constants/routes';

interface PermissionsFilters {
  [key: string]: string | undefined;
  search: string | undefined;
}

export default function AdminPermissionsPage() {
  const { filters, setFilter } = useQueryFilters<PermissionsFilters>({
    defaults: { search: undefined },
  });
  const catalogQuery = usePermissionCatalog(filters.search);

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[{ label: 'Dashboard', href: ROUTES.admin.root }, { label: 'Permissions' }]}
      />
      <PageHeader
        title="Permissions"
        description="The system-managed permission catalog, grouped by module. Assign these to roles from Role Management."
      />

      <SearchBar
        placeholder="Search by permission code or description..."
        defaultValue={filters.search ?? ''}
        onSearch={(value) => setFilter('search', value || undefined)}
        className="w-full sm:w-80"
      />

      {catalogQuery.isError ? (
        <ErrorState
          onRetry={() => catalogQuery.refetch()}
          description="Unable to load permissions."
        />
      ) : catalogQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : !catalogQuery.data?.groups.length ? (
        <EmptyState title="No permissions found" description="Try a different search term." />
      ) : (
        <Accordion type="multiple" className="rounded-xl border border-border bg-card px-2">
          {catalogQuery.data.groups.map((group) => (
            <AccordionItem key={group.module} value={group.module}>
              <AccordionTrigger className="capitalize">
                {group.module}
                <Badge variant="secondary" className="ml-2">
                  {group.permissions.length}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {group.permissions.map((permission) => (
                    <li
                      key={permission.id}
                      className="flex flex-col gap-0.5 rounded-lg border border-border/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <code className="text-sm font-medium text-foreground">{permission.code}</code>
                      {permission.description && (
                        <span className="text-sm text-muted-foreground">
                          {permission.description}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </ContentContainer>
  );
}
