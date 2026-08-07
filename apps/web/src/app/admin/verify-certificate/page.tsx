import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { CertificateLookupForm } from '@/features/certificates/components/certificate-lookup-form';

export default function AdminVerifyCertificatePage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Verify Certificate"
        description="Confirm that a certificate is genuine using its verification code."
      />
      <Card className="max-w-lg">
        <CardContent className="p-6">
          <CertificateLookupForm />
        </CardContent>
      </Card>
    </ContentContainer>
  );
}
