
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="text-center">
        <div className="text-sm uppercase tracking-[0.3em] text-foreground/45">404</div>
        <h1 className="mt-3 text-5xl font-semibold">Page not found</h1>
        <p className="mt-4 text-foreground/65">The page you requested could not be located in this credential universe.</p>
        <Link href="/"><Button className="mt-6">Back to Home</Button></Link>
      </div>
    </div>
  );
}
