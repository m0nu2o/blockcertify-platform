
"use client";

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ContactForm() {
  return (
    <GlassCard className="max-w-2xl">
      <h2 className="text-2xl font-semibold">Talk to our product team</h2>
      <p className="mt-2 text-sm text-foreground/65">Share your institution needs and we will help architect the right rollout.</p>
      <form
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          toast.success('Your message has been captured. Connect your preferred email workflow for outbound delivery.');
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Full name" aria-label="Full name" required />
          <Input placeholder="Work email" type="email" aria-label="Work email" required />
        </div>
        <Input placeholder="Institution or company" aria-label="Institution or company" required />
        <Textarea placeholder="Tell us about certificate volume, compliance needs, and deployment timeline" aria-label="Inquiry message" required />
        <Button type="submit">Send Inquiry</Button>
      </form>
    </GlassCard>
  );
}
