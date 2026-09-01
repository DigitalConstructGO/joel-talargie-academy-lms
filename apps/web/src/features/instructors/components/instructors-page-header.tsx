'use client';

import { PageHeader } from '@/components/common/page-header';
import { useLanguage } from '@/lib/i18n/language-provider';

export function InstructorsPageHeader() {
  const { t } = useLanguage();
  return (
    <PageHeader title={t('page.instructors.title')} description={t('page.instructors.subtitle')} />
  );
}
