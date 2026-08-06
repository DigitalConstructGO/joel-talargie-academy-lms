import { ContentContainer } from '@/components/layout/content-container';
import { DashboardNotFoundState } from '@/components/dashboard/error-states';

export default function DashboardNotFound() {
  return (
    <ContentContainer>
      <DashboardNotFoundState />
    </ContentContainer>
  );
}
