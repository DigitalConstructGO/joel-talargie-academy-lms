'use client';
import { useCallback, useEffect, useState } from 'react';
import type { HealthResponse } from '@joel-academy/contracts';
import { getHealth } from '@/lib/api/health';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
export function HealthStatus() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getHealth());
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Unable to connect');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  if (loading) return <p role="status">Checking API connection…</p>;
  if (error)
    return (
      <Alert>
        <p>Disconnected: {error}</p>
        <Button className="mt-3" onClick={() => void load()}>
          Retry
        </Button>
      </Alert>
    );
  return (
    <div className="flex items-center gap-3">
      <Badge>Connected</Badge>
      <span>{data?.data.service}</span>
    </div>
  );
}
