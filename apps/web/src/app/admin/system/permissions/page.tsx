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

import { useLanguage, translateModuleName } from '@/lib/i18n/language-provider';

interface PermissionsFilters {
  [key: string]: string | undefined;
  search: string | undefined;
}

const ACTION_MAP_AM: Record<string, string> = {
  activate: 'ማንቃት',
  archive: 'ማስቀመጥ',
  cancel: 'መሰረዝ',
  create: 'መፍጠር',
  download: 'ማውረድ',
  duplicate: 'ማባዛት',
  export: 'ኤክስፖርት',
  generate: 'ማመንጨት',
  manage_all: 'ሁሉንም ማኔጅ ማድረግ',
  manage_certificate_settings: 'የሰርተፊኬት መቼቶች',
  manage_pricing: 'የዋጋ መቼቶች',
  manage_resources: 'የሃብቶች አስተዳደር',
  manage_templates: 'የቴምፕሌት አስተዳደር',
  manage_visibility: 'የታይነት አስተዳደር',
  manage_preview: 'የቅድመ-ዕይታ አስተዳደር',
  publish: 'ማተም',
  read: 'መመልከት',
  read_administrator_activity: 'የአስተዳዳሪ እንቅስቃሴዎችን መመልከት',
  read_financial: 'የፋይናንስ መረጃዎችን መመልከት',
  read_operational_health: 'የሲስተም ጤናን መመልከት',
  read_sensitive: 'ሚስጥራዊ መረጃዎችን መመልከት',
  regenerate: 'ድጋሚ ማመንጨት',
  reorder: 'ቅደም ተከተል መቀየር',
  restore: 'መመለስ',
  retry: 'ድጋሚ መሞከር',
  revoke: 'መዳረሻ ማንሳት',
  unpublish: 'ህትመት ማንሳት',
  update: 'ማሻሻል',
  view_activity: 'እንቅስቃሴዎችን መመልከት',
  view_events: 'ክስተቶችን መመልከት',
  view_file_history: 'የፋይል ታሪክ መመልከት',
  view_student_progress: 'የተማሪ እድገትን መመልከት',
};

function translatePermissionDescription(
  code: string | undefined,
  desc: string | null | undefined,
  locale: string,
): string | undefined {
  if (locale !== 'am' || !code) return desc ?? undefined;

  const parts = code.split('.');
  if (parts.length === 2 && parts[0] && parts[1]) {
    const modAm = translateModuleName(parts[0], 'am');
    const actAm = ACTION_MAP_AM[parts[1].toLowerCase()] || parts[1].replaceAll('_', ' ');
    return `${modAm} ${actAm}`;
  }

  return desc ?? undefined;
}

export default function AdminPermissionsPage() {
  const { locale } = useLanguage();
  const { filters, setFilter } = useQueryFilters<PermissionsFilters>({
    defaults: { search: undefined },
  });
  const catalogQuery = usePermissionCatalog(filters.search);

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: locale === 'am' ? 'ዳሽቦርድ' : 'Dashboard', href: ROUTES.admin.root },
          { label: locale === 'am' ? 'ፈቃዶች' : 'Permissions' },
        ]}
      />
      <PageHeader
        title={locale === 'am' ? 'ፈቃዶች' : 'Permissions'}
        description={
          locale === 'am'
            ? 'የሲስተሙን የፈቃዶች ስብስብ እና ሞጁሎችን ይመልከቱ።'
            : 'View system permission codes and modules.'
        }
      />

      <SearchBar
        placeholder={
          locale === 'am'
            ? 'በፈቃድ ኮድ ወይም መግለጫ ፈልግ...'
            : 'Search by permission code or description...'
        }
        defaultValue={filters.search ?? ''}
        onSearch={(value) => setFilter('search', value || undefined)}
        className="w-full sm:w-80"
      />

      {catalogQuery.isError ? (
        <ErrorState
          onRetry={() => catalogQuery.refetch()}
          description={locale === 'am' ? 'ፈቃዶችን መጫን አልተቻለም።' : 'Unable to load permissions.'}
        />
      ) : catalogQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : !catalogQuery.data?.groups.length ? (
        <EmptyState
          title={locale === 'am' ? 'ምንም ፈቃድ አልተገኘም' : 'No permissions found'}
          description={locale === 'am' ? 'የተለየ የፍለጋ ቃል ይሞክሩ።' : 'Try a different search term.'}
        />
      ) : (
        <Accordion type="multiple" className="rounded-xl border border-border bg-card px-2">
          {catalogQuery.data.groups.map((group) => (
            <AccordionItem key={group.module} value={group.module}>
              <AccordionTrigger className="capitalize">
                {translateModuleName(group.module, locale)}
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
                      <span className="text-sm text-muted-foreground">
                        {translatePermissionDescription(
                          permission.code,
                          permission.description,
                          locale,
                        )}
                      </span>
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
