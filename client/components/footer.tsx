
import Link from 'next/link';
import { ShieldCheck, Github, Linkedin, Twitter } from 'lucide-react';

const footerSections = {
  Product: ['Features', 'Pricing', 'Documentation', 'Verification'],
  Company: ['About', 'Services', 'Contact', 'FAQs'],
  Legal: ['Privacy Policy', 'Terms'],
};

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/10 bg-foreground/[0.02] px-4 py-14 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.5fr,2fr]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent shadow-glow"><ShieldCheck className="size-6" /></div>
            <div>
              <div className="font-semibold">BlockCertify</div>
              <div className="text-sm text-foreground/65">Secure digital certificates with verifiable on-chain trust.</div>
            </div>
          </div>
          <p className="max-w-md text-sm text-foreground/65">Issue, verify, revoke, and monitor certificates at enterprise scale with IPFS-backed files, Ethereum anchoring, audit trails, and elegant dashboard experiences.</p>
          <div className="mt-6 flex gap-3 text-foreground/60">
            <Github className="size-5" />
            <Twitter className="size-5" />
            <Linkedin className="size-5" />
          </div>
          <div className="mt-6 text-xs text-foreground/50">Choose from 12 themes and persistent personalization from the built-in Theme Manager.</div>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {Object.entries(footerSections).map(([title, items]) => (
            <div key={title}>
              <h3 className="mb-3 text-base font-semibold">{title}</h3>
              <div className="grid gap-2 text-sm text-foreground/65">
                {items.map((item) => (
                  <Link key={item} href={`/${item.toLowerCase().replace(/ /g, '-').replace('verification', 'verify')}`} className="hover:text-foreground">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
