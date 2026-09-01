'use client';

import { ShieldCheck } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ComingSoonSection } from '@/components/dashboard/coming-soon-section';
import { useLanguage } from '@/lib/i18n/language-provider';

export default function AdminSystemPage() {
  const { t } = useLanguage();
  return (
    <ContentContainer>
      <PageHeader title={t('sidebar.system')} description={t('categories.subtitle')} />
      <ComingSoonSection feature="System administration" icon={ShieldCheck} />
    </ContentContainer>
  );
}
