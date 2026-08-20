'use client';

import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  Award,
  Ban,
  Check,
  Copy,
  Download,
  Loader2,
  Printer,
  Share2,
} from 'lucide-react';
import { useState } from 'react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState } from '@/components/common/error-state';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCertificate,
  useCertificateDownload,
  useCertificateFile,
} from '@/features/certificates/hooks/use-certificates';
import { useCourses } from '@/features/catalog/hooks/use-courses';
import type { CertificateStatus } from '@/features/certificates/types/certificate.types';
import { formatDate } from '@/lib/date';
import { toast } from '@/lib/toast';

const STATUS_VARIANT: Record<CertificateStatus, NonNullable<BadgeProps['variant']>> = {
  GENERATED: 'success',
  PENDING: 'warning',
  FAILED: 'destructive',
  REVOKED: 'outline',
};

const STATUS_LABEL: Record<CertificateStatus, string> = {
  GENERATED: 'Issued',
  PENDING: 'Generating',
  FAILED: 'Failed',
  REVOKED: 'Revoked',
};

function PreviewPanel({
  status,
  fileUrl,
  isLoading,
  isError,
  onRetry,
}: {
  status: CertificateStatus;
  fileUrl?: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (status === 'PENDING') {
    return (
      <div className="flex aspect-[297/210] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center shadow-xs">
        <Loader2 className="size-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-foreground">
          Your certificate is being generated...
        </p>
        <p className="text-xs text-muted-foreground">
          Rendering tamper-evident credentials and security seal.
        </p>
      </div>
    );
  }
  if (status === 'FAILED') {
    return (
      <div className="flex aspect-[297/210] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 p-8 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">
          Certificate generation failed. Please contact academy support for help.
        </p>
      </div>
    );
  }
  if (status === 'REVOKED') {
    return (
      <div className="flex aspect-[297/210] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <Ban className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">This certificate has been revoked.</p>
      </div>
    );
  }
  if (isError) {
    return (
      <ErrorState
        className="aspect-[297/210] w-full rounded-2xl"
        title="Couldn't load the preview"
        description="The certificate file link may have expired. Try again."
        onRetry={onRetry}
      />
    );
  }
  if (isLoading || !fileUrl) {
    return <Skeleton className="aspect-[297/210] w-full rounded-2xl" />;
  }
  return (
    <div className="relative aspect-[297/210] w-full overflow-hidden rounded-2xl border border-border bg-slate-900 shadow-sm">
      <iframe
        src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
        title="Official Certificate Preview"
        className="size-full border-0"
      />
    </div>
  );
}

export default function CertificateDetailPage() {
  const params = useParams<{ certificateId: string }>();
  const certificateId = params.certificateId;
  const [copied, setCopied] = useState(false);

  const certificateQuery = useCertificate(certificateId);
  const certificate = certificateQuery.data;

  const coursesQuery = useCourses({ pageSize: 100 });
  const course = coursesQuery.data?.items.find((item) => item.id === certificate?.courseId);

  const fileQuery = useCertificateFile(certificate?.downloadAvailable ? certificateId : undefined);
  const downloadCertificate = useCertificateDownload();

  const verificationCode = certificate?.verificationUrl?.split('/').filter(Boolean).pop() ?? null;

  async function handleDownload() {
    if (!certificate) return;
    try {
      const result = await downloadCertificate.mutateAsync(certificate.id);
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.fileName;
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Certificate downloaded');
    } catch {
      toast.error('Could not download certificate', 'Please try again.');
    }
  }

  function handlePrint() {
    if (fileQuery.data?.url) window.open(fileQuery.data.url, '_blank', 'noopener,noreferrer');
  }

  async function handleShare() {
    if (!certificate?.verificationUrl) return;
    const shareData = {
      title: `Certificate - ${certificate.courseTitle}`,
      text: `View my certificate for ${certificate.courseTitle}`,
      url: certificate.verificationUrl,
    };
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled the share sheet - not an error
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(certificate.verificationUrl);
      toast.success('Verification link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  }

  async function handleCopyCode() {
    if (!verificationCode) return;
    try {
      await navigator.clipboard.writeText(verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the verification code');
    }
  }

  if (certificateQuery.isLoading) {
    return (
      <ContentContainer>
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Skeleton className="aspect-[297/210] w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </ContentContainer>
    );
  }

  if (certificateQuery.isError || !certificate) {
    return (
      <ContentContainer>
        <PageHeader title="Certificate" description="Certificate details." />
        <ErrorState
          title="We couldn't load this certificate"
          description="It may have been removed or you may not have access to it."
          onRetry={() => certificateQuery.refetch()}
        />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <PageHeader
        title={certificate.courseTitle}
        description={`Official Credential • ${certificate.certificateNumber}`}
        actions={
          <Badge variant={STATUS_VARIANT[certificate.status]}>
            {STATUS_LABEL[certificate.status]}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <PreviewPanel
          status={certificate.status}
          fileUrl={fileQuery.data?.url}
          isLoading={fileQuery.isLoading}
          isError={fileQuery.isError}
          onRetry={() => fileQuery.refetch()}
        />

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Award className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {certificate.studentName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {course?.presenterName ?? 'Joel Talargie Academy'}
                  </p>
                </div>
              </div>

              <Separator />

              <dl className="space-y-3.5 text-xs sm:text-sm">
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground">Certificate ID</dt>
                  <dd className="font-mono text-xs font-semibold text-foreground break-all rounded-lg border border-border bg-muted/40 p-2 leading-relaxed">
                    {certificate.certificateNumber}
                  </dd>
                </div>

                {certificate.completionDate && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Completion Date</dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(certificate.completionDate)}
                    </dd>
                  </div>
                )}

                {certificate.issuedAt && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Issue Date</dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(certificate.issuedAt)}
                    </dd>
                  </div>
                )}

                {verificationCode && (
                  <div className="space-y-1.5 pt-1">
                    <dt className="text-xs font-medium text-muted-foreground">Verification Code</dt>
                    <dd className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-xs text-foreground">
                      <span className="truncate">{verificationCode}</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Copy verification code"
                      >
                        {copied ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-5">
              <Button
                className="w-full gap-2 font-medium"
                onClick={handleDownload}
                disabled={!certificate.downloadAvailable || downloadCertificate.isPending}
              >
                {downloadCertificate.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Download Certificate
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handlePrint}
                disabled={!certificate.downloadAvailable || !fileQuery.data}
              >
                <Printer className="size-4" />
                Print / Open in Tab
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleShare}
                disabled={!certificate.verificationUrl}
              >
                <Share2 className="size-4" />
                Share Credential
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ContentContainer>
  );
}
