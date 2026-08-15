'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Printer,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date';
import { ROUTES } from '@/constants/routes';
import type { CertificateVerification } from '../types/certificate.types';

interface CertificateVerificationResultProps {
  result: CertificateVerification;
  onVerifyAnother?: () => void;
}

export function CertificateVerificationResult({
  result,
  onVerifyAnother,
}: CertificateVerificationResultProps) {
  const isPrintable = result.state === 'VALID';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 p-6 sm:p-8 text-center">
      {/* Status Header */}
      {result.state === 'VALID' ? (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <span className="flex size-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5">
              <CheckCircle2 className="size-10 stroke-[2.5]" />
            </span>
            <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Official Credential Verified
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Certificate Verified
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              This credential is valid and authentically issued by Joel Talargie Academy.
            </p>
          </div>
        </div>
      ) : result.state === 'REVOKED' ? (
        <div className="flex flex-col items-center gap-3">
          <span className="flex size-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
            <AlertTriangle className="size-10 stroke-[2.5]" />
          </span>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Credential Status
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Certificate Revoked
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              This certificate was officially issued but has since been revoked by the academy.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <span className="flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
            <XCircle className="size-10 stroke-[2.5]" />
          </span>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-destructive">
              Lookup Failed
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Certificate Not Found
            </h1>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              The certificate code you entered could not be verified. Please check the ID or QR code link and try again.
            </p>
          </div>
        </div>
      )}

      {/* Verified Certificate Details Card */}
      {result.state !== 'INVALID' && (
        <div className="w-full rounded-xl border border-border/80 bg-card/60 p-5 text-left backdrop-blur-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-brand/10 text-brand">
                <GraduationCap className="size-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Certificate of Completion
              </span>
            </div>
            {result.state === 'VALID' ? (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 px-2.5 py-0.5">
                <CheckCircle2 className="size-3" />
                VALID
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 px-2.5 py-0.5">
                <AlertTriangle className="size-3" />
                REVOKED
              </Badge>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 text-sm">
            {result.studentName && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Awarded to Student
                </dt>
                <dd className="mt-0.5 text-lg font-bold tracking-tight text-foreground">
                  {result.studentName}
                </dd>
              </div>
            )}

            {result.courseTitle && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Course
                </dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {result.courseTitle}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Issued By
              </dt>
              <dd className="mt-0.5 font-medium text-foreground">
                Joel Talargie Academy
              </dd>
            </div>

            {result.certificateNumber && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Certificate ID
                </dt>
                <dd className="mt-0.5 font-mono text-xs font-bold tracking-wide text-foreground">
                  {result.certificateNumber}
                </dd>
              </div>
            )}

            {result.completionDate && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Completion Date
                </dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {formatDate(result.completionDate)}
                </dd>
              </div>
            )}

            {result.issuedAt && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Issue Date
                </dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {formatDate(result.issuedAt)}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-5 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
            <span>
              Cryptographically registered credential • Tamper-evident record verified against Joel Talargie Academy public ledger.
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex w-full flex-wrap items-center justify-center gap-3 pt-2">
        {onVerifyAnother ? (
          <Button variant="outline" onClick={onVerifyAnother} className="gap-2">
            <RotateCcw className="size-4" />
            Verify Another Certificate
          </Button>
        ) : (
          <Button variant="outline" asChild className="gap-2">
            <Link href={ROUTES.certificates.verifyLookup}>
              <RotateCcw className="size-4" />
              Verify Another Certificate
            </Link>
          </Button>
        )}

        {isPrintable && (
          <Button variant="secondary" onClick={handlePrint} className="gap-2">
            <Printer className="size-4" />
            Print Record
          </Button>
        )}

        <Button variant="ghost" asChild className="gap-1.5 text-xs text-muted-foreground">
          <Link href={ROUTES.courses.list}>
            <span>Browse Courses</span>
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
