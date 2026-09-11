
import { MarketingShell } from '@/components/marketing-shell';
import { LoginForm } from '@/components/forms/auth-form';

export default function LoginPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20"><LoginForm /></section>
    </MarketingShell>
  );
}
