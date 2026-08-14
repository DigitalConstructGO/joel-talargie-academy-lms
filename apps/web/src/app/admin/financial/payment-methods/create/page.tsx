'use client';

import { useRouter } from 'next/navigation';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { useCreatePaymentMethod } from '@/features/payment-methods/hooks/use-payment-methods';
import { PaymentMethodForm } from '@/features/payment-methods/components/payment-method-form';
import type { CreatePaymentMethodInput } from '@/features/payment-methods/types/payment-method.types';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';

export default function AdminPaymentMethodCreatePage() {
  const router = useRouter();
  const createMethod = useCreatePaymentMethod();

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Financial Management', href: ROUTES.admin.financial },
          { label: 'Payment Methods', href: ROUTES.admin.financialPaymentMethods },
          { label: 'Add method' },
        ]}
      />
      <PageHeader
        title="Add payment method"
        description="Create a new method students can use to pay at checkout."
      />

      <div className="max-w-3xl">
        <PaymentMethodForm
          mode="create"
          isSubmitting={createMethod.isPending}
          onCancel={() => router.push(ROUTES.admin.financialPaymentMethods)}
          onSubmit={async (input) => {
            try {
              const method = await createMethod.mutateAsync(input as CreatePaymentMethodInput);
              toast.success('Payment method created');
              router.push(ROUTES.admin.financialPaymentMethodDetail(method.id));
            } catch {
              toast.error('Could not create the payment method');
            }
          }}
        />
      </div>
    </ContentContainer>
  );
}
