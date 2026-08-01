import { HealthStatus } from '@/components/health-status';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
export default function HealthPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <Card>
        <CardHeader>
          <CardTitle>System health</CardTitle>
        </CardHeader>
        <CardContent>
          <HealthStatus />
        </CardContent>
      </Card>
    </main>
  );
}
