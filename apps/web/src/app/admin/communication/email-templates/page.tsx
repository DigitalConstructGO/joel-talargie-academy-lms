'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
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
import { useEmailTemplates } from '@/features/email-templates/hooks/use-email-templates';
import type { EmailTemplate } from '@/features/email-templates/types/email-template.types';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';
import { useLanguage } from '@/lib/i18n/language-provider';

interface EmailTemplatesFilters {
  [key: string]: string | undefined;
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
  search: string | undefined;
}

function translateTemplateName(name: string, locale: string): string {
  if (locale !== 'am') return name;

  const TEMPLATE_NAME_MAP_AM: Record<string, string> = {
    'Account Activated': 'መለያ ገብሯል',
    'Account Archived': 'መለያ ተቀምጧል',
    'Account Restored': 'መለያ ወደ ነበረበት ተመልሷል',
    'Account Suspended': 'መለያ ታግዷል',
    'Certificate Ready': 'ሰርተፊኬት ተዘጋጅቷል',
    'Certificate Revoked': 'ሰርተፊኬት ተሰርዟል',
    'Course Completed': 'ኮርስ ተጠናቋል',
    'Email Verification': 'የኢሜይል ማረጋገጫ',
    'Free Enrollment Confirmed': 'ነፃ ምዝገባ ተረጋገጠ',
    'Google Account Linked': 'Google መለያ ተገናኝቷል',
  };

  return TEMPLATE_NAME_MAP_AM[name] || name;
}

export default function AdminEmailTemplatesPage() {
  const { locale } = useLanguage();
  const { filters, setFilter } = useQueryFilters<EmailTemplatesFilters>({
    defaults: { status: 'ALL', search: undefined },
  });
  const { status, search } = filters;
  const templatesQuery = useEmailTemplates();

  const statusOptions = useMemo(
    () => [
      { label: locale === 'am' ? 'ንቁ' : 'Active', value: 'ACTIVE' },
      { label: locale === 'am' ? 'ቦዝን' : 'Inactive', value: 'INACTIVE' },
    ],
    [locale],
  );

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
        header: locale === 'am' ? 'ስም' : 'Name',
        cell: ({ row }) => (
          <Link
            href={ROUTES.admin.communicationEmailTemplateDetail(row.original.id)}
            className="font-medium text-foreground hover:underline"
          >
            {translateTemplateName(row.original.name, locale)}
          </Link>
        ),
      },
      {
        accessorKey: 'code',
        header: locale === 'am' ? 'የቴምፕሌት ቁልፍ' : 'Template Key',
        cell: ({ row }) => <code className="text-xs">{row.original.code}</code>,
      },
      { accessorKey: 'locale', header: locale === 'am' ? 'ቋንቋ' : 'Locale' },
      {
        accessorKey: 'isActive',
        header: locale === 'am' ? 'ሁኔታ' : 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'outline'}>
            {row.original.isActive
              ? locale === 'am'
                ? 'ንቁ'
                : 'Active'
              : locale === 'am'
                ? 'ቦዝን'
                : 'Inactive'}
          </Badge>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: locale === 'am' ? 'የተሻሻለበት ቀን' : 'Updated',
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
    [locale],
  );

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: locale === 'am' ? 'ዳሽቦርድ' : 'Dashboard', href: ROUTES.admin.root },
          { label: locale === 'am' ? 'ኮሙኒኬሽን' : 'Communication', href: ROUTES.admin.communication },
          { label: locale === 'am' ? 'የኢሜይል ቴምፕሌቶች' : 'Email Templates' },
        ]}
      />
      <PageHeader
        title={locale === 'am' ? 'የኢሜይል ቴምፕሌቶች' : 'Email Templates'}
        description={
          locale === 'am'
            ? 'የሲስተሙ ግብይት የኢሜይል ቴምፕሌቶች። የሲስተም እንቅስቃሴ ሲፈጠር ቴምፕሌቶች በራስ-ሰር ይፈጠራሉ - የመለያ ሁኔታ ለውጦች፣ የሚና ምደባዎች፣ የክፍያዎች፣ የኮርሶች እና ሰርተፊኬቶች።'
            : 'System transactional email templates. Templates are created automatically in code when a system event fires - account status changes, role assignments, session revocations, Google account linking, payments, courses and certificates - and are shown here read-only, with live preview.'
        }
      />

      <FilterBar>
        <SearchBar
          placeholder={locale === 'am' ? 'በስም ወይም በቁልፍ ፈልግ...' : 'Search by name or key...'}
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label={locale === 'am' ? 'ሁኔታ' : 'Status'}
          value={status === 'ALL' ? undefined : status}
          onChange={(value) =>
            setFilter('status', (value ?? 'ALL') as EmailTemplatesFilters['status'])
          }
          options={statusOptions}
        />
      </FilterBar>

      {templatesQuery.isError ? (
        <ErrorState
          onRetry={() => templatesQuery.refetch()}
          description={
            locale === 'am' ? 'የኢሜይል ቴምፕሌቶችን መጫን አልተቻለም።' : 'Unable to load email templates.'
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={templatesQuery.isLoading}
          emptyTitle={locale === 'am' ? 'ምንም የኢሜይል ቴምፕሌት አልተገኘም' : 'No email templates found'}
          emptyDescription={
            locale === 'am' ? 'ከማጣሪያዎችዎ ጋር የሚዛመድ ቴምፕሌት የለም።' : 'No templates match your filters.'
          }
        />
      )}
    </ContentContainer>
  );
}
