import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Outfit, Plus_Jakarta_Sans, Bricolage_Grotesque, Syne, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { LenisProvider } from '@/components/lenis-provider';
import { FontProvider } from '@/contexts/font-provider';
import { LanguageProvider } from '@/contexts/language-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'BlockCertify',
  description: 'Blockchain-based secure digital certificate issuance and verification platform',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${outfit.variable} ${plusJakarta.variable} ${bricolage.variable} ${syne.variable} ${playfair.variable}`}>
        <LanguageProvider>
          <FontProvider>
            <LenisProvider>
              <Providers>{children}</Providers>
            </LenisProvider>
          </FontProvider>
        </LanguageProvider>
        <footer style={{ textAlign: 'center', padding: '2rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4rem' }}>
          © 2026 BlockCertify. All rights reserved. Unauthorized copying, distribution, or reverse engineering is prohibited.
        </footer>
      </body>
    </html>
  );
}
