
import { MarketingShell } from '@/components/marketing-shell';
import { GlassCard } from '@/components/ui/glass-card';

export default function TermsPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <GlassCard>
            <h1 className="text-4xl font-semibold">Terms of Service</h1>
            <div className="mt-6 space-y-4 text-sm leading-7 text-foreground/70">
              <p>Authorized institutions are responsible for the accuracy and legality of certificate records they issue through BlockCertify.</p>
              <p>Blockchain and IPFS actions are immutable by design. Revocation and updates are represented through on-chain events and status transitions rather than destructive deletion.</p>
              <p>Administrators must protect credentials, comply with internal policy, and use exported data in accordance with local privacy regulations.</p>
            </div>
          </GlassCard>
        </div>
      </section>
    </MarketingShell>
  );
}
