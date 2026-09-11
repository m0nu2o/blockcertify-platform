
import { MarketingShell } from '@/components/marketing-shell';
import { FAQList } from '@/components/faq-list';
import { SectionTitle } from '@/components/section-title';

const faqs = [
  { q: 'Does verification require MetaMask?', a: 'No. Public verification is server-assisted and does not require wallet access from the verifier.' },
  { q: 'Can expired certificates remain historically visible?', a: 'Yes. Expired and revoked records remain queryable, preserving compliance and audit histories while clearly showing status.' },
  { q: 'How are reports exported?', a: 'The API supports CSV, XLSX, and PDF export routes for administrative and institutional reporting workflows.' },
  { q: 'Can we run a private Ethereum network?', a: 'Yes. Update RPC, private key, and contract settings to target your preferred EVM-compatible environment.' },
];

export default function FAQPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <SectionTitle eyebrow="FAQs" title="Frequently asked questions" description="Operational, technical, and governance details for institutions evaluating BlockCertify." />
          <div className="mt-10"><FAQList items={faqs} /></div>
        </div>
      </section>
    </MarketingShell>
  );
}
