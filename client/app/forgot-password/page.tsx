
import { MarketingShell } from '@/components/marketing-shell';
import { ForgotPasswordForm } from '@/components/forms/auth-form';

export const metadata = {
  title: 'Forgot Password — BlockCertify',
  description: 'Reset your BlockCertify account password.',
};

export default function ForgotPasswordPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <ForgotPasswordForm />
      </section>
    </MarketingShell>
  );
}
