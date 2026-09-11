
import { MarketingShell } from '@/components/marketing-shell';
import { GlassCard } from '@/components/ui/glass-card';

export default function PrivacyPolicyPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <GlassCard>
            <h1 className="text-4xl font-semibold">Privacy Policy</h1>
            <div className="mt-6 space-y-4 text-sm leading-7 text-foreground/70">
              <p>BlockCertify processes institution, student, and certificate data for issuance, verification, analytics, notifications, and auditability.</p>
              <p>Passwords are hashed with bcrypt. Verification metadata may be written to public blockchain infrastructure and IPFS, so institutions should avoid placing sensitive personal data directly in immutable public fields.</p>
              <p>Users may request profile updates, export records, and review account activity through role-based interfaces and governed administrative processes.</p>
            </div>
          </GlassCard>
        </div>
      </section>
    </MarketingShell>
  );
}
