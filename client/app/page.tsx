"use client";

import { motion } from 'framer-motion';
import { Hero } from '@/components/hero';
import { MarketingShell } from '@/components/marketing-shell';
import { SectionTitle } from '@/components/section-title';
import { MetricCard } from '@/components/metric-card';
import { FeatureCard } from '@/components/feature-card';
import { FAQList } from '@/components/faq-list';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, Blocks, FileCheck2, Globe2, LockKeyhole, QrCode, Shield, Workflow } from 'lucide-react';
import { useLanguage } from '@/contexts/language-provider';

const faqs = [
  { q: 'How does BlockCertify prevent tampering?', a: 'Each certificate PDF is hashed with SHA-256, pinned to IPFS, and committed to Ethereum. Verification compares the stored chain digest, metadata, and current lookup payload.' },
  { q: 'Can the platform support multiple institutions?', a: 'Yes. Institutions are first-class entities with isolated analytics, student rosters, issuance histories, and role-based access controls.' },
  { q: 'Is public verification available without login?', a: 'Yes. QR code scanning, certificate ID search, blockchain hash lookup, and transaction-hash verification are publicly accessible.' },
  { q: 'What happens when a certificate must be revoked?', a: 'Authorized institution or admin users can revoke certificates. The action is written on-chain, recorded in MongoDB, and surfaced immediately in verification results.' },
];

const revealVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring" as const, stiffness: 80, damping: 18, duration: 0.8 } 
  }
};

export default function HomePage() {
  const { t } = useLanguage();
  return (
    <MarketingShell>
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Metrics Grid */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px" }}
        variants={revealVariants}
        className="px-4 py-20 relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.05) 0%, transparent 60%)' }} />
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-4 relative z-10">
          <MetricCard label={t('metrics.institutions')} value="480+" caption={t('metrics.institutions.desc')} />
          <MetricCard label={t('metrics.certificates')} value="2.8M" caption={t('metrics.certificates.desc')} />
          <MetricCard label={t('metrics.latency')} value="780ms" caption={t('metrics.latency.desc')} />
          <MetricCard label={t('metrics.audit')} value="100%" caption={t('metrics.audit.desc')} />
        </div>
      </motion.section>

      {/* 3. Features Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px" }}
        variants={revealVariants}
        className="px-4 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow={t('features.title')} title={t('features.heading')} description={t('features.subheading')} />
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard icon={FileCheck2} title={t('features.issuance')} description={t('features.issuance.desc')} />
            <FeatureCard icon={QrCode} title={t('features.verify')} description={t('features.verify.desc')} />
            <FeatureCard icon={BarChart3} title={t('features.analytics')} description={t('features.analytics.desc')} />
            <FeatureCard icon={Shield} title={t('features.security')} description={t('features.security.desc')} />
          </div>
        </div>
      </motion.section>

      {/* 4. How It Works Workflow Grid */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px" }}
        variants={revealVariants}
        className="px-4 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="How it works" title="A transparent trust pipeline from upload to verification" description="Every issuance action is traceable, auditable, and independently verifiable." />
          <div className="mt-12 grid gap-6 lg:grid-cols-4">
            {[
              ['Institution uploads certificate PDF', Blocks],
              ['System creates SHA-256 hash and metadata', Workflow],
              ['PDF and metadata are pinned to IPFS', Globe2],
              ['Ethereum contract stores immutable proof', LockKeyhole],
            ].map(([label, Icon], index) => (
              <div key={label as string} className="group relative overflow-hidden rounded-2xl bg-card border border-border/10 p-6 flex flex-col justify-between transition-all duration-500 hover:-translate-y-1 hover:border-accent/30 hover:shadow-2xl">
                <div className="absolute -top-12 -right-12 size-32 rounded-full pointer-events-none transition-all duration-500 group-hover:opacity-75" style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 70%)' }} />
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="grid size-10 place-items-center rounded-xl bg-accent/15 border border-accent/25 text-accent font-bold text-base shadow-glow">{index + 1}</div>
                    <div className="inline-flex rounded-xl bg-accent/10 border border-accent/20 p-2.5 text-accent transition-colors duration-300 group-hover:bg-accent/20"><Icon className="size-5" strokeWidth={2.5} /></div>
                  </div>
                  <div className="font-semibold text-base text-foreground tracking-tight leading-snug">{label as string}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 5. Testimonials & Partners Grid */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px" }}
        variants={revealVariants}
        className="px-4 py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/10 p-8 sm:p-10 transition-all duration-500 hover:border-accent/20 hover:shadow-2xl">
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none transition-all duration-500 group-hover:opacity-75" style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.1) 0%, transparent 60%)' }} />
            <div className="text-xs uppercase tracking-[0.25em] text-accent font-bold">Testimonials</div>
            <blockquote className="mt-8 text-3xl font-bold leading-snug text-foreground tracking-tight">“BlockCertify gave our registrar office a verifiable, elegant, and efficient digital credential workflow that students actually trust.”</blockquote>
            <div className="mt-8 text-sm text-foreground/50 font-medium tracking-wide">Maya Chen · Director of Records · Future University</div>
          </div>
          
          <div className="relative overflow-hidden rounded-2xl bg-card border border-border/10 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-foreground/50 font-semibold mb-6">Partner institutions</div>
              <div className="grid grid-cols-2 gap-3 text-xs font-bold text-foreground/75 sm:grid-cols-3">
                {['Future University', 'Nova Polytechnic', 'Apex Skills Academy', 'Helix Business School', 'Vertex College', 'Meridian Institute'].map((item) => (
                  <div key={item} className="min-h-[64px] flex items-center justify-center rounded-xl border border-border/10 bg-foreground/[0.02] p-3 text-center leading-snug hover:border-accent/25 hover:bg-foreground/[0.04] transition duration-300">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 6. FAQ Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px" }}
        variants={revealVariants}
        className="px-4 py-20"
      >
        <div className="mx-auto max-w-3xl">
          <SectionTitle eyebrow="FAQs" title="Everything decision-makers ask before rollout" description="Security, compliance, verification, onboarding, and growth concerns answered clearly." />
          <div className="mt-6 bg-card/40 border border-border/10 rounded-2xl p-6 md:p-8"><FAQList items={faqs} /></div>
        </div>
      </motion.section>

      {/* 7. Newsletter Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px" }}
        variants={revealVariants}
        className="px-4 py-20"
      >
        <div className="mx-auto max-w-5xl">
          <GlassCard className="text-center p-8 md:p-12 border border-border/12 bg-card/60 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.1) 0%, transparent 60%)' }} />
            <div className="mx-auto max-w-3xl z-10 relative">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Newsletter for registrars and credential teams</h2>
              <p className="mt-4 text-sm text-foreground/70 leading-relaxed max-w-2xl mx-auto">Get blockchain credential best practices, release notes, and verification strategy insights in one premium digest.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <input suppressHydrationWarning className="h-12 rounded-full border border-border/12 bg-foreground/[0.04] px-5 text-sm backdrop-blur-xl text-foreground placeholder:text-foreground/45 focus:outline-none focus:border-accent/40 sm:min-w-80" aria-label="Enter your work email" placeholder="Enter your work email" />
                <Button size="lg" className="rounded-full px-6 shadow-glow">Subscribe</Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.section>

      {/* 8. Call to Action CTA Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px" }}
        variants={revealVariants}
        className="px-4 pb-24 pt-10"
      >
        <div className="mx-auto max-w-5xl">
          <GlassCard className="text-center p-8 md:p-12 border border-border/12 bg-card/60 rounded-2xl relative overflow-hidden">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.1) 0%, transparent 60%)' }} />
            <div className="mx-auto max-w-3xl z-10 relative">
              <h2 className="text-4xl font-extrabold tracking-tight text-foreground">Ready to modernize your credential infrastructure?</h2>
              <p className="mt-4 text-sm text-foreground/75 leading-relaxed max-w-2xl mx-auto">Launch a future-ready issuance and verification system with enterprise analytics, auditability, and beautiful student experiences.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-xl py-6 px-8 shadow-glow"><Link href="/register">Start Free Trial</Link></Button>
                <Button asChild size="lg" variant="secondary" className="rounded-xl py-6 px-8 hover:bg-foreground/[0.08]"><Link href="/documentation">View Documentation</Link></Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.section>
    </MarketingShell>
  );
}
