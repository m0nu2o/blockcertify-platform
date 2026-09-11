
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { ParticleBackground } from '@/components/particle-background';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <ParticleBackground />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
