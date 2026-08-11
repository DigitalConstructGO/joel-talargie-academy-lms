import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { verifyCertificateToken } from '@/features/certificates/api/certificates.server';
import { CertificateVerificationResult } from '@/features/certificates/components/certificate-verification-result';

interface VerifyPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = { title: 'Verify Certificate' };

async function loadVerification(token: string) {
  try {
    return await verifyCertificateToken(token);
  } catch {
    return { state: 'INVALID' as const };
  }
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { token } = await params;
  const result = await loadVerification(token);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-16 sm:px-6">
      <Card className="w-full">
        <CertificateVerificationResult result={result} />
      </Card>
    </div>
  );
}
