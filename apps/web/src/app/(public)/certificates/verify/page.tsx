import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { CertificateLookupForm } from '@/features/certificates/components/certificate-lookup-form';

export const metadata: Metadata = { title: 'Verify Certificate' };

export default function VerifyCertificateLookupPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Verify a certificate</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the verification code from a certificate to confirm it&apos;s genuine.
        </p>
      </div>
      <Card className="w-full">
        <CardContent className="p-6">
          <CertificateLookupForm />
        </CardContent>
      </Card>
    </div>
  );
}
