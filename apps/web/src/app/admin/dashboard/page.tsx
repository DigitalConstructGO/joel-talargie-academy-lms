import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { ContentContainer } from '@/components/layout/content-container';
export default function AdminDashboard() {
  return (
    <ContentContainer className="max-w-4xl">
      <Badge>Phase 1 placeholder</Badge>
      <Card className="mt-4 p-6">
        <CardTitle>Administrator dashboard</CardTitle>
        <p className="mt-3 text-muted-foreground">
          Authentication and administrator business functionality will be implemented in later
          phases.
        </p>
      </Card>
    </ContentContainer>
  );
}
