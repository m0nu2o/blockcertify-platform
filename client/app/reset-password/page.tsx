import { Suspense } from 'react';
import { MarketingShell } from '@/components/marketing-shell';
import { ResetPasswordForm } from '@/components/forms/auth-form';

export const metadata = {
  title: 'Reset Password — BlockCertify',
  description: 'Set a new password for your BlockCertify account.',
};

export default function ResetPasswordPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <Suspense fallback={<div className="h-[400px] w-full animate-pulse rounded-3xl bg-foreground/5" />}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </MarketingShell>
  );
}
