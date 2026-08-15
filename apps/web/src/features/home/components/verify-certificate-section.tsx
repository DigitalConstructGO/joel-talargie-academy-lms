import Link from 'next/link';
import { Award, Camera, CheckCircle2, QrCode, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function VerifyCertificateSection() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Information & Actions */}
          <div className="space-y-6 text-left lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3.5 py-1 text-xs font-semibold text-brand">
              <ShieldCheck className="size-4" />
              <span>Public Credential Verification</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Already have a certificate? <br className="hidden sm:inline" />
                <span className="text-brand">Verify its authenticity</span>
              </h2>
              <p className="max-w-2xl text-base text-muted-foreground">
                Employers, recruiters, and academic partners can instantly authenticate any Joel Talargie Academy credential without logging in. Validate via live camera QR scanning or by typing the certificate ID.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Camera className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Scan QR Code</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Point your camera at the QR code printed on the certificate for instant validation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Search className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Enter Certificate ID</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Type the unique certificate ID (e.g. JTA-2026-...) to view the official verified record.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 shadow-sm font-medium">
                <Link href={ROUTES.certificates.verifyLookup}>
                  <ShieldCheck className="size-4" />
                  Verify Certificate
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href={ROUTES.courses.list}>
                  <Award className="size-4" />
                  Browse Certificate Courses
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Visual Interactive Graphic */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/60 p-6 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground font-bold text-xs">
                    JTA
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground">Joel Talargie Academy</p>
                    <p className="text-[11px] text-muted-foreground">Credential Verification System</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  Verified
                </span>
              </div>

              <div className="my-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center">
                <div className="relative flex size-24 items-center justify-center rounded-xl bg-card p-2 shadow-sm">
                  <QrCode className="size-20 text-foreground/80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-5 rounded-full bg-brand text-brand-foreground flex items-center justify-center shadow">
                      <ShieldCheck className="size-3" />
                    </div>
                  </div>
                </div>
                <p className="mt-3 font-mono text-xs font-bold text-foreground">
                  JTA-2026-000123
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Tamper-evident 256-bit cryptographic verification token
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Free Public Access</span>
                <span>No Login Required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
