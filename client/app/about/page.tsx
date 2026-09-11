
import { MarketingShell } from '@/components/marketing-shell';
import { SectionTitle } from '@/components/section-title';
import { GlassCard } from '@/components/ui/glass-card';

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="About BlockCertify" title="Rebuilding certificate trust for a borderless digital world" description="We combine blockchain integrity, secure storage, elegant interfaces, and operational clarity for institutions that cannot afford credential doubt." />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <GlassCard><h3 className="text-xl font-semibold">Mission</h3><p className="mt-3 text-sm text-foreground/65">Make every certificate verifiable, portable, tamper-evident, and globally trusted.</p></GlassCard>
            <GlassCard><h3 className="text-xl font-semibold">Vision</h3><p className="mt-3 text-sm text-foreground/65">Enable lifelong verifiable learning records across universities, bootcamps, and employers.</p></GlassCard>
            <GlassCard><h3 className="text-xl font-semibold">Approach</h3><p className="mt-3 text-sm text-foreground/65">Blend enterprise security with premium design so trust feels as refined as it is rigorous.</p></GlassCard>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
