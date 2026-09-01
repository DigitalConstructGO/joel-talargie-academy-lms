import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { verifyCertificateToken } from '@/features/certificates/api/certificates.server';
import { CertificateLookupForm } from '@/features/certificates/components/certificate-lookup-form';
import type { CertificateVerification } from '@/features/certificates/types/certificate.types';

export const metadata: Metadata = {
  title: 'Verify Certificate - Joel Talargie Academy',
  description:
    'Verify the authenticity of Joel Talargie Academy certificates. Scan the QR code or enter the unique certificate ID to validate credentials instantly.',
};

interface VerifyCertificateLookupPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function resolveVerification(identifier?: string): Promise<CertificateVerification | null> {
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    return null;
  }
  try {
    return await verifyCertificateToken(identifier.trim());
  } catch {
    return { state: 'INVALID' };
  }
}

import { VerifyCertificatePageHeader } from '@/features/certificates/components/verify-certificate-header';

export default async function VerifyCertificateLookupPage({
  searchParams,
}: VerifyCertificateLookupPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const queryParam =
    typeof resolvedParams.token === 'string'
      ? resolvedParams.token
      : typeof resolvedParams.code === 'string'
        ? resolvedParams.code
        : typeof resolvedParams.q === 'string'
          ? resolvedParams.q
          : '';

  const initialResult = queryParam ? await resolveVerification(queryParam) : null;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden py-12 sm:py-16">
      {/* Subtle Background Glow Accent */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[450px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 sm:px-6">
        <VerifyCertificatePageHeader />

        <Card className="w-full border-border/80 bg-card/80 shadow-xl backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <CertificateLookupForm initialIdentifier={queryParam} initialResult={initialResult} />
          </CardContent>
        </Card>

        {/* Security Assurance Notice */}
        <div className="text-center text-xs text-muted-foreground/80 max-w-sm">
          All certificates issued by Joel Talargie Academy are protected by tamper-evident
          verification tokens and cryptographically validated against our central registry.
        </div>
      </div>
    </div>
  );
}
