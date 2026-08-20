'use client';

import { useState, type FormEvent } from 'react';
import { Camera, KeyRound, Loader2, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { certificatesApi } from '../api/certificates.api';
import type { CertificateVerification } from '../types/certificate.types';
import { CertificateQrScanner, extractVerificationIdentifier } from './certificate-qr-scanner';
import { CertificateVerificationResult } from './certificate-verification-result';

interface CertificateLookupFormProps {
  initialIdentifier?: string;
  initialResult?: CertificateVerification | null;
  defaultTab?: 'manual' | 'qr';
}

export function CertificateLookupForm({
  initialIdentifier = '',
  initialResult = null,
  defaultTab = 'manual',
}: CertificateLookupFormProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'qr'>(defaultTab);
  const [code, setCode] = useState(initialIdentifier);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<CertificateVerification | null>(initialResult);

  const handleVerify = async (identifierToVerify: string) => {
    const extracted = extractVerificationIdentifier(identifierToVerify);
    if (!extracted) return;

    setIsVerifying(true);
    try {
      const response = await certificatesApi.verify(extracted);
      setResult(response);
    } catch {
      setResult({ state: 'INVALID' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isVerifying) return;
    void handleVerify(code);
  };

  const handleQrScan = (scannedIdentifier: string) => {
    setCode(scannedIdentifier);
    void handleVerify(scannedIdentifier);
  };

  const handleReset = () => {
    setResult(null);
    setCode('');
  };

  // If a result is active, display the verified certificate result
  if (result) {
    return (
      <div className="w-full">
        <CertificateVerificationResult result={result} onVerifyAnother={handleReset} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'manual' | 'qr')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 p-1">
          <TabsTrigger value="manual" className="gap-2 text-xs sm:text-sm">
            <KeyRound className="size-4" />
            Enter Certificate Code
          </TabsTrigger>
          <TabsTrigger value="qr" className="gap-2 text-xs sm:text-sm">
            <Camera className="size-4" />
            Scan QR Code
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Manual Certificate Code Entry */}
        <TabsContent value="manual" className="mt-6 space-y-4">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label
                htmlFor="certificate-code"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Certificate Code / Verification ID
              </Label>
              <div className="relative">
                <Input
                  id="certificate-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. JTA-2026-000123 or paste verification token"
                  autoComplete="off"
                  disabled={isVerifying}
                  className="h-11 font-mono text-sm tracking-wide pr-10"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <ShieldCheck className="size-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the unique certificate number (e.g.{' '}
                <span className="font-mono text-foreground font-medium">JTA-2026-...</span>) or
                public token printed on the certificate.
              </p>
            </div>

            <Button
              type="submit"
              disabled={!code.trim() || isVerifying}
              className="h-11 w-full gap-2 font-medium shadow-sm"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verifying Certificate...
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Verify Certificate
                </>
              )}
            </Button>
          </form>
        </TabsContent>

        {/* Tab 2: Camera QR Code Scanning */}
        <TabsContent value="qr" className="mt-6 space-y-4">
          <div className="text-center text-xs text-muted-foreground">
            Point your device camera at the QR code printed on the bottom-right corner of the
            certificate.
          </div>
          <CertificateQrScanner
            onScan={handleQrScan}
            onSwitchToManual={() => setActiveTab('manual')}
            isVerifying={isVerifying}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
