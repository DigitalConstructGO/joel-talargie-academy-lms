'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';

export function CertificateLookupForm() {
  const router = useRouter();
  const [code, setCode] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(ROUTES.certificates.verify(trimmed));
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2 text-left">
        <Label htmlFor="certificate-code">Certificate verification code</Label>
        <Input
          id="certificate-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Paste the code from the certificate"
          autoComplete="off"
        />
      </div>
      <Button type="submit" className="gap-2" disabled={!code.trim()}>
        <Search className="size-4" />
        Verify
      </Button>
    </form>
  );
}
