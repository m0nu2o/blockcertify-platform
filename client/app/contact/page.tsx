
import { MarketingShell } from '@/components/marketing-shell';
import { ContactForm } from '@/components/forms/contact-form';
import { GlassCard } from '@/components/ui/glass-card';

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr,1.15fr]">
          <GlassCard>
            <h1 className="text-4xl font-semibold tracking-tight">Contact BlockCertify</h1>
            <p className="mt-4 text-sm leading-7 text-foreground/65">Speak with our team about institution onboarding, blockchain architecture, migration, compliance, or enterprise licensing.</p>
            <div className="mt-8 grid gap-4 text-sm text-foreground/70">
              <div><div className="font-medium">Sales</div><div>sales@blockcertify.com</div></div>
              <div><div className="font-medium">Support</div><div>support@blockcertify.com</div></div>
              <div><div className="font-medium">Headquarters</div><div>Digital Trust Avenue, Global Campus District</div></div>
            </div>
          </GlassCard>
          <ContactForm />
        </div>
      </section>
    </MarketingShell>
  );
}
