import Link from 'next/link';
import { Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Certificate, CertificateStatus } from '../types/certificate.types';

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

export interface CertificateCardProps {
  certificate: Certificate;
  href: string;
  className?: string;
}

export function CertificateCard({ certificate, href, className }: CertificateCardProps) {
  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', className)}>
      <Link href={href} className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Award className="size-5" aria-hidden="true" />
          </span>
          <Badge variant={STATUS_VARIANT[certificate.status]}>
            {STATUS_LABEL[certificate.status]}
          </Badge>
        </div>
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
            {certificate.courseTitle}
          </h3>
          {certificate.studentName && (
            <p className="mt-0.5 text-xs text-muted-foreground">{certificate.studentName}</p>
          )}
          <p className="mt-1 font-mono text-[11px] text-muted-foreground truncate">
            {certificate.certificateNumber}
          </p>
        </div>
        <p className="mt-auto text-xs text-muted-foreground">
          {certificate.issuedAt ? `Issued ${formatDate(certificate.issuedAt)}` : 'Not yet issued'}
        </p>
      </Link>
    </Card>
  );
}
