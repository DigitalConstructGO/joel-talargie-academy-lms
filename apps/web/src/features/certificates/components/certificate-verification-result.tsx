import { Award, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/date';
import type { CertificateVerification } from '../types/certificate.types';

export function CertificateVerificationResult({ result }: { result: CertificateVerification }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      {result.state === 'VALID' ? (
        <>
          <span className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-9" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-foreground">Certificate verified</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This is a genuine certificate issued by Joel Talargie Academy.
            </p>
          </div>
        </>
      ) : result.state === 'REVOKED' ? (
        <>
          <span className="flex size-16 items-center justify-center rounded-full bg-warning/10 text-warning">
            <Award className="size-9" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-foreground">Certificate revoked</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This certificate was issued but has since been revoked by the academy.
            </p>
          </div>
        </>
      ) : (
        <>
          <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="size-9" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-foreground">Invalid verification code</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t find a certificate matching that code or link.
            </p>
          </div>
        </>
      )}

      {result.state !== 'INVALID' && (
        <>
          <Separator />
          <dl className="w-full space-y-3 text-left text-sm">
            {result.certificateNumber && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Certificate ID</dt>
                <dd className="font-medium text-foreground">{result.certificateNumber}</dd>
              </div>
            )}
            {result.studentName && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Awarded to</dt>
                <dd className="font-medium text-foreground">{result.studentName}</dd>
              </div>
            )}
            {result.courseTitle && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Course</dt>
                <dd className="font-medium text-foreground">{result.courseTitle}</dd>
              </div>
            )}
            {result.completionDate && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Completed</dt>
                <dd className="font-medium text-foreground">{formatDate(result.completionDate)}</dd>
              </div>
            )}
            {result.issuedAt && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Issued</dt>
                <dd className="font-medium text-foreground">{formatDate(result.issuedAt)}</dd>
              </div>
            )}
          </dl>
          {result.state === 'REVOKED' && <Badge variant="warning">Revoked</Badge>}
        </>
      )}
    </div>
  );
}
