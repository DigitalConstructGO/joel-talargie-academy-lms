'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Ban, Download, ExternalLink, Loader2, RotateCcw, ShieldAlert } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Can } from '@/components/auth/can';
import {
  useAdminCertificate,
  useAdminCertificateEvents,
  useDownloadAdminCertificate,
  useRegenerateCertificate,
  useRetryCertificate,
  useRevokeCertificate,
} from '@/features/certificates/hooks/use-admin-certificates';
import type { CertificateStatus } from '@/features/certificates/types/certificate.types';
import { ROUTES } from '@/constants/routes';
import { formatDate, formatDateTime } from '@/lib/date';
import { toast } from '@/lib/toast';

const STATUS_VARIANT: Record<CertificateStatus, NonNullable<BadgeProps['variant']>> = {
  PENDING: 'warning',
  GENERATED: 'success',
  FAILED: 'destructive',
  REVOKED: 'outline',
};

function ReasonField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2 py-2">
      <Label htmlFor="cert-reason">Reason</Label>
      <Textarea
        id="cert-reason"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    </div>
  );
}

export default function AdminCertificateDetailPage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const certificateQuery = useAdminCertificate(certificateId);
  const eventsQuery = useAdminCertificateEvents(certificateId);
  const retryCertificate = useRetryCertificate();
  const regenerateCertificate = useRegenerateCertificate();
  const revokeCertificate = useRevokeCertificate();
  const downloadCertificate = useDownloadAdminCertificate();
  const [regenerateReason, setRegenerateReason] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const certificate = certificateQuery.data;

  async function handleDownload() {
    try {
      const result = await downloadCertificate.mutateAsync(certificateId);
      window.open(result.url, '_blank', 'noreferrer');
    } catch {
      toast.error('Could not prepare the download');
    }
  }

  async function handleRetry() {
    try {
      await retryCertificate.mutateAsync({ certificateId, input: undefined });
      toast.success('Certificate generation retried');
    } catch {
      toast.error('Could not retry generation');
    }
  }

  async function handleRegenerate() {
    try {
      await regenerateCertificate.mutateAsync({ certificateId, input: regenerateReason });
      toast.success('Certificate regeneration queued');
      setRegenerateReason('');
    } catch {
      toast.error('Could not regenerate this certificate');
    }
  }

  async function handleRevoke() {
    try {
      await revokeCertificate.mutateAsync({ certificateId, input: revokeReason });
      toast.success('Certificate revoked');
      setRevokeReason('');
    } catch {
      toast.error('Could not revoke this certificate');
    }
  }

  if (certificateQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Certificate details" />
        <ErrorState
          onRetry={() => certificateQuery.refetch()}
          description="Unable to load this certificate."
        />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Certificates', href: ROUTES.admin.certificates },
          { label: certificate?.certificateNumber ?? 'Certificate details' },
        ]}
      />
      <PageHeader
        title={certificate?.certificateNumber ?? 'Certificate details'}
        description={certificate?.courseTitle}
        actions={
          certificate && (
            <div className="flex flex-wrap gap-2">
              {certificate.status === 'GENERATED' && (
                <Can permission="certificates.download">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleDownload}
                    disabled={downloadCertificate.isPending}
                  >
                    {downloadCertificate.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    Download
                  </Button>
                </Can>
              )}
              {certificate.verificationUrl && (
                <Button asChild variant="outline" className="gap-2">
                  <a href={certificate.verificationUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> Verify
                  </a>
                </Button>
              )}
              {certificate.status === 'FAILED' && (
                <Can permission="certificates.retry">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleRetry}
                    disabled={retryCertificate.isPending}
                  >
                    {retryCertificate.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}
                    Retry
                  </Button>
                </Can>
              )}
              {certificate.status === 'GENERATED' && (
                <Can permission="certificates.regenerate">
                  <ConfirmDialog
                    trigger={
                      <Button variant="outline" className="gap-2">
                        <RotateCcw className="size-4" /> Regenerate
                      </Button>
                    }
                    title="Regenerate this certificate?"
                    description="A new file is generated and the old one is superseded."
                    confirmLabel="Regenerate"
                    confirmDisabled={!regenerateReason.trim()}
                    onConfirm={handleRegenerate}
                  >
                    <ReasonField value={regenerateReason} onChange={setRegenerateReason} />
                  </ConfirmDialog>
                </Can>
              )}
              {certificate.status !== 'REVOKED' && (
                <Can permission="certificates.revoke">
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="outline"
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Ban className="size-4" /> Revoke
                      </Button>
                    }
                    title="Revoke this certificate?"
                    description="The verification page will show this certificate as revoked."
                    confirmLabel="Revoke"
                    variant="destructive"
                    confirmDisabled={!revokeReason.trim()}
                    onConfirm={handleRevoke}
                  >
                    <ReasonField value={revokeReason} onChange={setRevokeReason} />
                  </ConfirmDialog>
                </Can>
              )}
            </div>
          )
        }
      />

      {certificateQuery.isLoading || !certificate ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <Badge variant={STATUS_VARIANT[certificate.status]}>{certificate.status}</Badge>

          {certificate.status === 'FAILED' && certificate.failureMessage && (
            <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              {certificate.failureMessage}
            </p>
          )}
          {certificate.status === 'REVOKED' && certificate.revocationReason && (
            <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Revoked: {certificate.revocationReason}
            </p>
          )}

          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Student</p>
                <p className="font-medium text-foreground">{certificate.studentName}</p>
                <p className="text-xs text-muted-foreground">{certificate.studentEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Course</p>
                <p className="font-medium text-foreground">{certificate.courseTitle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completion date</p>
                <p className="font-medium text-foreground">
                  {certificate.completionDate ? formatDate(certificate.completionDate) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Issued</p>
                <p className="font-medium text-foreground">
                  {certificate.issuedAt ? formatDateTime(certificate.issuedAt) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Template</p>
                <p className="font-medium text-foreground">
                  {certificate.templateName ?? 'Default'}
                  {certificate.templateVersion ? ` v${certificate.templateVersion}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Generation version</p>
                <p className="font-medium text-foreground">{certificate.generationVersion}</p>
              </div>
            </CardContent>
          </Card>

          <Can permission="certificates.view_events">
            <Card>
              <CardContent className="pt-6">
                <p className="mb-3 text-xs font-semibold text-muted-foreground">Event history</p>
                {eventsQuery.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-6 w-full" />
                    ))}
                  </div>
                ) : eventsQuery.data?.length ? (
                  <ul className="space-y-2 text-sm">
                    {eventsQuery.data.map((event) => (
                      <li key={event.id} className="flex items-center justify-between">
                        <span>{event.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(event.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No events recorded.</p>
                )}
              </CardContent>
            </Card>
          </Can>
        </div>
      )}
    </ContentContainer>
  );
}
