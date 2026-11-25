
import { Suspense } from 'react';
import { MarketingShell } from '@/components/marketing-shell';
import { RegisterForm } from '@/components/forms/auth-form';

export default function RegisterPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <Suspense fallback={<div className="mx-auto max-w-lg h-96 rounded-2xl border border-border/15 bg-card/40 animate-pulse" />}>
          <RegisterForm />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
