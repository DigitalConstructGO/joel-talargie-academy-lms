'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, ShieldAlert, Trash2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Can } from '@/components/auth/can';
import {
  useDeletePaymentMethod,
  usePaymentMethod,
} from '@/features/payment-methods/hooks/use-payment-methods';
import { formatDateTime } from '@/lib/date';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';

export default function AdminPaymentMethodDetailPage() {
  const { paymentMethodId } = useParams<{ paymentMethodId: string }>();
  const router = useRouter();
  const methodQuery = usePaymentMethod(paymentMethodId);
  const deleteMethod = useDeletePaymentMethod();
  const [deleting, setDeleting] = useState(false);
  const method = methodQuery.data;

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMethod.mutateAsync(paymentMethodId);
      toast.success('Payment method deleted');
      router.push(ROUTES.admin.financialPaymentMethods);
    } catch {
      toast.error(
        'Could not delete this payment method',
        'Methods referenced by existing payments must be deactivated instead.',
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Financial Management', href: ROUTES.admin.financial },
          { label: 'Payment Methods', href: ROUTES.admin.financialPaymentMethods },
          { label: method?.name ?? 'Payment method details' },
        ]}
      />
      <PageHeader
        title={method?.name ?? 'Payment method details'}
        description={method?.description ?? undefined}
        actions={
          method && (
            <div className="flex gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link href={ROUTES.admin.financialPaymentMethods}>
                  <ArrowLeft className="size-4" /> Back to list
                </Link>
              </Button>
              <Can permission="payment_methods.update">
                <Button asChild variant="outline" className="gap-2">
                  <Link href={ROUTES.admin.financialPaymentMethodEdit(method.id)}>
                    <Pencil className="size-4" /> Edit
                  </Link>
                </Button>
              </Can>
              <Can permission="payment_methods.delete">
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive"
                      disabled={deleting}
                    >
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  }
                  title="Delete this payment method?"
                  description="It can only be deleted if no payment references it. Otherwise, deactivate it instead."
                  confirmLabel="Delete method"
                  variant="destructive"
                  onConfirm={handleDelete}
                />
              </Can>
            </div>
          )
        }
      />

      {methodQuery.isError ? (
        <ErrorState
          onRetry={() => methodQuery.refetch()}
          description="Unable to load this payment method."
        />
      ) : methodQuery.isLoading || !method ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-40" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{method.code}</Badge>
            <Badge variant="outline">{method.type.replaceAll('_', ' ')}</Badge>
            <Badge variant={method.isActive ? 'success' : 'secondary'}>
              {method.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="secondary">Sort {method.sortOrder}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">General</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium text-foreground">
                    {formatDateTime(method.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Last updated</span>
                  <span className="font-medium text-foreground">
                    {formatDateTime(method.updatedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Student instructions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                {method.instructions.tagline ? (
                  <p className="text-foreground">{method.instructions.tagline}</p>
                ) : (
                  <p className="text-muted-foreground">No tagline</p>
                )}
                {method.instructions.transactionIdLabel && (
                  <div>
                    <p className="text-muted-foreground">Transaction ID label</p>
                    <p className="font-medium text-foreground">
                      {method.instructions.transactionIdLabel}
                    </p>
                  </div>
                )}
                {method.instructions.transactionIdPlaceholder && (
                  <div>
                    <p className="text-muted-foreground">Transaction ID placeholder</p>
                    <p className="font-medium text-foreground">
                      {method.instructions.transactionIdPlaceholder}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tips & security</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                {method.instructions.tips?.length ? (
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {method.instructions.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No tips</p>
                )}
                {method.instructions.securityNotice && (
                  <p className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-info">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                    {method.instructions.securityNotice}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Private configuration</CardTitle>
              <CardDescription>Admin-only. Never shown to students.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs text-foreground">
                {JSON.stringify(method.config, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </ContentContainer>
  );
}
