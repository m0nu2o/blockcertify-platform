
"use client";

import { LucideIcon, BellRing, Blocks, FileCheck2, FileSpreadsheet, Globe2, Languages, Search, ShieldCheck, Smartphone } from 'lucide-react';
import { MarketingShell } from '@/components/marketing-shell';
import { SectionTitle } from '@/components/section-title';
import { FeatureCard } from '@/components/feature-card';

type FeatureItem = [LucideIcon, string, string];

export default function FeaturesPage() {
  const items: FeatureItem[] = [
    [Blocks, 'Ethereum smart contract registry', 'Immutable issuance, revocation, updates, and verification events.'],
    [FileCheck2, 'Certificate preview and download', 'Beautiful student-facing records with downloadable PDFs and QR proof.'],
    [Search, 'Advanced public verification', 'Verify by ID, QR code, chain hash, or transaction hash without login.'],
    [ShieldCheck, 'Security-first controls', 'JWT, Auth.js, RBAC, rate limiting, XSS protection, and audit logs.'],
    [BellRing, 'Notifications and email alerts', 'Students and admins stay informed with issuance, verification, and governance updates.'],
    [FileSpreadsheet, 'Export suite', 'Generate CSV, Excel, and PDF reports for compliance and operations.'],
    [Languages, 'Global-ready UX', 'Responsive, accessible, themeable, and ready for multilingual expansion.'],
    [Smartphone, 'PWA and mobile support', 'Installable shell, offline fallback, and retina-optimized interfaces.'],
    [Globe2, 'IPFS distribution', 'Decentralized metadata and file access with Pinata gateway support.'],
  ];

  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Platform capabilities" title="Everything you need to issue and verify trusted digital credentials" description="From registrar workflows to public verification and admin governance, the entire lifecycle is covered." />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map(([icon, title, description]) => <FeatureCard key={title} icon={icon} title={title} description={description} />)}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
