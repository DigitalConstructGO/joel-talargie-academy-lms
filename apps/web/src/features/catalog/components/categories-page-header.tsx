'use client';

import { PageHeader } from '@/components/common/page-header';
import { useLanguage } from '@/lib/i18n/language-provider';

export function CategoriesPageHeader() {
  const { t } = useLanguage();
  return (
    <PageHeader title={t('page.categories.title')} description={t('page.categories.subtitle')} />
  );
}
