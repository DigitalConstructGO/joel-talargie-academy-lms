import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { DashboardUiControls } from '@/components/dashboard-ui-controls';
export default function Dashboard() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <Badge>Phase 1 placeholder</Badge>
      <Card className="mt-4">
        <CardTitle>Student dashboard</CardTitle>
        <p className="mt-3 text-zinc-600">
          Authentication and student dashboard functionality will be implemented in later phases.
        </p>
        <DashboardUiControls />
      </Card>
    </main>
  );
}
