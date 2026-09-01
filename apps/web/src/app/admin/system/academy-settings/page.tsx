'use client';

import Link from 'next/link';
import { ExternalLink, Globe, Layout, Palette, Settings } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStructuredAcademySettings } from '@/features/settings/hooks/use-settings';
import { AcademyGeneralForm } from '@/features/settings/components/academy-general-form';
import { AcademyBrandingForm } from '@/features/settings/components/academy-branding-form';
import { LandingCmsManager } from '@/features/settings/components/landing-cms-manager';
import { PublicSettingsForm } from '@/features/settings/components/public-settings-form';
import { ROUTES } from '@/constants/routes';

import { useLanguage } from '@/lib/i18n/language-provider';

export default function AdminAcademySettingsPage() {
  const { t, locale } = useLanguage();
  const structuredQuery = useStructuredAcademySettings();

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: t('sidebar.dashboard'), href: ROUTES.admin.root },
          { label: t('sidebar.system'), href: ROUTES.admin.system },
          { label: t('sidebar.academySettings') },
        ]}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title={t('sidebar.academySettings')} description={t('categories.subtitle')} />
        <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5 shadow-xs">
          <Link href={ROUTES.home} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            {locale === 'am' ? 'የመነሻ ገጽ እይ' : 'Preview Landing Page'}
          </Link>
        </Button>
      </div>

      {structuredQuery.isError && (
        <ErrorState
          onRetry={() => structuredQuery.refetch()}
          description="Unable to load Academy Settings."
        />
      )}

      {structuredQuery.isLoading && (
        <div className="space-y-4 pt-4">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      )}

      {structuredQuery.data && (
        <Tabs defaultValue="landing" className="space-y-6 pt-2">
          <TabsList className="flex-wrap bg-muted/60 p-1">
            <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-background">
              <Globe className="size-4" />
              {locale === 'am' ? 'አጠቃላይ' : 'General'}
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2 data-[state=active]:bg-background">
              <Palette className="size-4" />
              {locale === 'am' ? 'ብራንዲንግ' : 'Branding'}
            </TabsTrigger>
            <TabsTrigger value="landing" className="gap-2 data-[state=active]:bg-background">
              <Layout className="size-4" />
              {locale === 'am' ? 'የመነሻ ገጽ ይዘት' : 'Landing Page CMS'}
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-2 data-[state=active]:bg-background">
              <Settings className="size-4" />
              {locale === 'am' ? 'ይፋዊ መቼቶች' : 'Public Settings'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <AcademyGeneralForm initialData={structuredQuery.data.general} />
          </TabsContent>

          <TabsContent value="branding">
            <AcademyBrandingForm initialData={structuredQuery.data.branding} />
          </TabsContent>

          <TabsContent value="landing">
            <LandingCmsManager initialData={structuredQuery.data} />
          </TabsContent>

          <TabsContent value="public">
            <PublicSettingsForm initialData={structuredQuery.data.publicSettings} />
          </TabsContent>
        </Tabs>
      )}
    </ContentContainer>
  );
}
