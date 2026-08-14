'use client';

import { useParams, useRouter } from 'next/navigation';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  usePaymentMethod,
  useUpdatePaymentMethod,
} from '@/features/payment-methods/hooks/use-payment-methods';
import { PaymentMethodForm } from '@/features/payment-methods/components/payment-method-form';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';

export default function AdminPaymentMethodEditPage() {
  const { paymentMethodId } = useParams<{ paymentMethodId: string }>();
  const router = useRouter();
  const methodQuery = usePaymentMethod(paymentMethodId);
  const updateMethod = useUpdatePaymentMethod();
  const method = methodQuery.data;

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Financial Management', href: ROUTES.admin.financial },
          { label: 'Payment Methods', href: ROUTES.admin.financialPaymentMethods },
          { label: method?.name ?? 'Payment method details' },
          { label: 'Edit' },
        ]}
      />
      <PageHeader
        title="Edit payment method"
        description="Update the details, instructions, or configuration for this method."
      />

      <div className="max-w-3xl">
        {methodQuery.isError ? (
          <ErrorState
            onRetry={() => methodQuery.refetch()}
            description="Unable to load this payment method."
          />
        ) : methodQuery.isLoading || !method ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-48" />
            ))}
          </div>
        ) : (
          <PaymentMethodForm
            mode="edit"
            initial={{
              name: method.name,
              code: method.code,
              type: method.type,
              description: method.description,
              sortOrder: method.sortOrder,
              isActive: method.isActive,
              instructions: method.instructions,
              config: method.config,
            }}
            isSubmitting={updateMethod.isPending}
            onCancel={() => router.push(ROUTES.admin.financialPaymentMethodDetail(method.id))}
            onSubmit={async (input) => {
              try {
                await updateMethod.mutateAsync({ paymentMethodId, input });
                toast.success('Payment method updated');
                router.push(ROUTES.admin.financialPaymentMethodDetail(method.id));
              } catch {
                toast.error('Could not update the payment method');
              }
            }}
          />
        )}
      </div>
    </ContentContainer>
  );
}
