import Link from 'next/link';
import { HealthStatus } from '@/components/health-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-20">
      <p className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-500">
        Digital Construct
      </p>
      <h1 className="text-4xl font-bold">Joel Talargie Academy</h1>
      <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-300">
        Phase 1 establishes a secure, maintainable foundation for the learning management system.
      </p>
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Platform connectivity</CardTitle>
        </CardHeader>
        <CardContent>
          <HealthStatus />
        </CardContent>
      </Card>
      <nav className="mt-8 flex gap-5 underline">
        <Link href="/health">Health details</Link>
        <Link href="/dashboard">Student area</Link>
        <Link href="/admin/dashboard">Administrator area</Link>
      </nav>
    </main>
  );
}
