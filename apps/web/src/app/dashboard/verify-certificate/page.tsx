'use client';

import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { CertificateLookupForm } from '@/features/certificates/components/certificate-lookup-form';
import { useLanguage } from '@/lib/i18n/language-provider';

export default function StudentVerifyCertificatePage() {
  const { t } = useLanguage();
  return (
    <ContentContainer>
      <PageHeader title={t('nav.verifyCertificate')} description={t('categories.subtitle')} />
      <Card className="max-w-lg">
        <CardContent className="p-6">
          <CertificateLookupForm />
        </CardContent>
      </Card>
    </ContentContainer>
  );
}
