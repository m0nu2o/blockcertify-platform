
import { MarketingShell } from '@/components/marketing-shell';
import { RegisterForm } from '@/components/forms/auth-form';

export default function RegisterPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20"><RegisterForm /></section>
    </MarketingShell>
  );
}
