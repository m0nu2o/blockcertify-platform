
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-semibold">You are offline</h1>
        <p className="mt-4 text-foreground/65">Reconnect to continue working with real-time certificate issuance and verification data.</p>
        <Link href="/"><Button className="mt-6">Return Home</Button></Link>
      </div>
    </div>
  );
}
