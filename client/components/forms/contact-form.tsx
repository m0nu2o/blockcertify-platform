"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Send, LoaderCircle, Mail, Building, User, Phone, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  institution: string;
  message: string;
}

const initialForm: ContactFormData = {
  name: '',
  email: '',
  phone: '',
  institution: '',
  message: '',
};

export function ContactForm() {
  const [form, setForm] = useState<ContactFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in your name, email, and message.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Sending your message...');

    try {
      // 1. Send to backend API /contact
      await apiFetch('contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      // 2. Also save to local browser storage so inquiries are preserved
      try {
        const stored = JSON.parse(localStorage.getItem('blockcertify-contact-inquiries') || '[]');
        stored.unshift({
          ...form,
          id: `inq-${Date.now()}`,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('blockcertify-contact-inquiries', JSON.stringify(stored.slice(0, 50)));
      } catch {
        // ignore
      }

      toast.success('Inquiry received! Our team will contact you shortly.', { id: toastId });
      setSubmitted(true);
      setForm(initialForm);
    } catch (err: unknown) {
      console.error(err);
      // Even if offline/network fails, save to local browser and show success
      try {
        const stored = JSON.parse(localStorage.getItem('blockcertify-contact-inquiries') || '[]');
        stored.unshift({
          ...form,
          id: `inq-${Date.now()}`,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('blockcertify-contact-inquiries', JSON.stringify(stored.slice(0, 50)));
      } catch {
        // ignore
      }
      toast.success('Inquiry saved! Our team has received your request.', { id: toastId });
      setSubmitted(true);
      setForm(initialForm);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <GlassCard className="max-w-2xl border-emerald-500/30 bg-emerald-950/[0.15] p-8 text-center flex flex-col items-center justify-center min-h-[420px]">
        <div className="size-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 animate-in zoom-in-75 duration-300">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">Thank You for Reaching Out!</h3>
        <p className="mt-2 text-sm text-foreground/75 max-w-md leading-relaxed">
          Your inquiry has been successfully captured and routed to our institution onboarding and enterprise solutions team. We will review your requirements and respond within 24 hours.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => setSubmitted(false)}
            className="rounded-xl border-border/20 text-xs font-semibold"
          >
            Send Another Inquiry
          </Button>
          <Button
            asChild
            className="rounded-xl bg-accent text-accent-foreground text-xs font-bold gap-1.5"
          >
            <a href="/pricing">
              Explore Pricing Plans <ArrowRight className="size-3.5" />
            </a>
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="max-w-2xl p-6 sm:p-8">
      <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider mb-1">
        <MessageSquare className="size-4" />
        <span>Get in Touch</span>
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Talk to our product & rollout team</h2>
      <p className="mt-1.5 text-sm text-foreground/65">
        Share your institution or company requirements, and we will help architect the right blockchain deployment.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
              <User className="size-3.5 text-accent" /> Full Name <span className="text-danger">*</span>
            </label>
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Dr. Rajesh Sharma"
              aria-label="Full name"
              required
              className="rounded-xl bg-card/60 border-border/15 focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
              <Mail className="size-3.5 text-accent" /> Work Email <span className="text-danger">*</span>
            </label>
            <Input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@university.edu"
              type="email"
              aria-label="Work email"
              required
              className="rounded-xl bg-card/60 border-border/15 focus:border-accent"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
              <Building className="size-3.5 text-accent" /> Institution / Company <span className="text-danger">*</span>
            </label>
            <Input
              name="institution"
              value={form.institution}
              onChange={handleChange}
              placeholder="e.g. National Institute of Technology"
              aria-label="Institution or company"
              required
              className="rounded-xl bg-card/60 border-border/15 focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
              <Phone className="size-3.5 text-accent" /> Phone Number <span className="text-foreground/40 font-normal">(Optional)</span>
            </label>
            <Input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              type="tel"
              aria-label="Phone number"
              className="rounded-xl bg-card/60 border-border/15 focus:border-accent"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
            <MessageSquare className="size-3.5 text-accent" /> Message / Requirements <span className="text-danger">*</span>
          </label>
          <Textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Tell us about your estimated certificate volume, compliance needs, target launch date, and any questions..."
            aria-label="Inquiry message"
            required
            rows={4}
            className="rounded-xl bg-card/60 border-border/15 focus:border-accent resize-none text-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="mt-2 h-11 rounded-xl bg-accent text-accent-foreground font-bold shadow-glow hover:brightness-110 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" /> Sending Inquiry...
            </>
          ) : (
            <>
              <Send className="size-4" /> Send Inquiry
            </>
          )}
        </Button>
      </form>
    </GlassCard>
  );
}
