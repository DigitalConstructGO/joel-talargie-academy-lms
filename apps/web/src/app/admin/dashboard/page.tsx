import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
export default function AdminDashboard() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <Badge>Phase 1 placeholder</Badge>
      <Card className="mt-4">
        <CardTitle>Administrator dashboard</CardTitle>
        <p className="mt-3 text-zinc-600">
          Authentication and administrator business functionality will be implemented in later
          phases.
        </p>
      </Card>
    </main>
  );
}
