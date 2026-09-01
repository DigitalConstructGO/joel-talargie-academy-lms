'use client';

import { PageHeader } from '@/components/common/page-header';
import { useLanguage } from '@/lib/i18n/language-provider';

export function CoursesPageHeader() {
  const { t } = useLanguage();
  return (
    <PageHeader
      title={t('page.browseCourses.title')}
      description={t('page.browseCourses.subtitle')}
    />
  );
}
