
import { MarketingShell } from '@/components/marketing-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { SectionTitle } from '@/components/section-title';

export default function ServicesPage() {
  const services = [
    ['Implementation consulting', 'Solution architecture, institution onboarding, and issuance workflow design.'],
    ['Security hardening', 'Threat modeling, compliance guidance, governance setup, and audit trail configuration.'],
    ['Branding and theming', 'Custom glass themes, white-label adjustments, and polished stakeholder experiences.'],
    ['Migration services', 'Digitize legacy archives and import certificate histories into verifiable formats.'],
  ];

  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="Services" title="Adoption support beyond software" description="BlockCertify helps teams design governance, rollout verification experiences, and migrate credential operations with confidence." />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {services.map(([title, description]) => (
              <GlassCard key={title as string}><h3 className="text-xl font-semibold">{title as string}</h3><p className="mt-3 text-sm text-foreground/65">{description as string}</p></GlassCard>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
