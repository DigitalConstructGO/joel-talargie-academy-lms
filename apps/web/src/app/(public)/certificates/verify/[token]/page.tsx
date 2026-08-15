import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { verifyCertificateToken } from '@/features/certificates/api/certificates.server';
import { CertificateVerificationResult } from '@/features/certificates/components/certificate-verification-result';

interface VerifyPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: 'Verify Certificate - Joel Talargie Academy',
  description:
    'Official digital credential verification result for Joel Talargie Academy certificate of completion.',
};

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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden py-12 sm:py-16">
      {/* Background glow accent */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[450px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 sm:px-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
            <ShieldCheck className="size-3.5" />
            Official Credential Verification
          </div>
        </div>

        <Card className="w-full border-border/80 bg-card/80 shadow-xl backdrop-blur-sm">
          <CardContent className="p-2 sm:p-4">
            <CertificateVerificationResult result={result} />
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground/80 max-w-sm">
          Official tamper-evident credential registry record • Joel Talargie Academy
        </div>
      </div>
    </div>
  );
}
