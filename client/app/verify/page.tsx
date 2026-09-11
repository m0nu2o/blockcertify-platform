
import { Suspense } from 'react';
import { MarketingShell } from '@/components/marketing-shell';
import { VerificationWidget } from '@/components/verification-widget';
import { SectionTitle } from '@/components/section-title';

export default function VerifyPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Verification Portal" title="Validate digital certificates in seconds" description="Lookup by QR code, certificate ID, blockchain hash, or transaction hash and get an instant, elegant trust verdict." />
          <div className="mt-10">
            <Suspense fallback={<div className="h-[400px] w-full animate-pulse rounded-3xl bg-foreground/5" />}>
              <VerificationWidget />
            </Suspense>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
