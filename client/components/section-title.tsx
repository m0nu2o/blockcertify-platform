
import { Badge } from '@/components/ui/badge';

export function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Badge className="mb-4">{eyebrow}</Badge>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h2>
      <p className="mt-4 text-balance text-base text-foreground/65 sm:text-lg">{description}</p>
    </div>
  );
}
