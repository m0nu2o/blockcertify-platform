
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/glass-card';
import { apiFetch } from '@/lib/api';

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const registerSchema = loginSchema.extend({ name: z.string().min(2), role: z.enum(['admin', 'institution', 'student']), institutionName: z.string().optional(), studentId: z.string().optional() });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="-mt-1 text-xs text-danger">{message}</p>;
}

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(
    async (values) => {
      setLoading(true);
      try {
        const result = await signIn('credentials', { ...values, redirect: false });
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success('Welcome back');
        router.push('/dashboard');
      } catch {
        toast.error('Unexpected error while signing in. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    () => {
      toast.error('Please fix the highlighted fields.');
    }
  );

  return (
    <GlassCard className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-foreground/65">Sign in to issue, verify, and manage certificates.</p>
      </div>
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <div className="grid gap-1.5">
          <Input placeholder="Email address" aria-label="Email address" {...form.register('email')} aria-invalid={!!errors.email} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="grid gap-1.5">
          <Input placeholder="Password" aria-label="Password" type="password" {...form.register('password')} aria-invalid={!!errors.password} />
          <FieldError message={errors.password?.message} />
          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground/45">Must be at least 8 characters.</p>
            <Link href="/forgot-password" className="text-xs font-semibold text-accent hover:text-accent/80 transition">Forgot password?</Link>
          </div>
        </div>
        <Button disabled={loading}>{loading ? 'Signing in...' : 'Login'}</Button>
      </form>
    </GlassCard>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: { role: 'student' } });
  const role = form.watch('role');
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(
    async (values) => {
      setLoading(true);
      try {
        await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(values) });
        await signIn('credentials', { email: values.email, password: values.password, redirect: false });
        toast.success('Account created successfully');
        router.push('/dashboard');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Registration failed');
      } finally {
        setLoading(false);
      }
    },
    () => {
      toast.error('Please fix the highlighted fields.');
    }
  );

  return (
    <GlassCard className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Create your workspace</h1>
        <p className="mt-2 text-sm text-foreground/65">Launch secure certificate operations in minutes.</p>
      </div>
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <div className="grid gap-1.5">
          <Input placeholder="Full name" aria-label="Full name" {...form.register('name')} aria-invalid={!!errors.name} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="grid gap-1.5">
          <Input placeholder="Email address" aria-label="Email address" {...form.register('email')} aria-invalid={!!errors.email} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="grid gap-1.5">
          <Input placeholder="Password" aria-label="Password" type="password" {...form.register('password')} aria-invalid={!!errors.password} />
          <FieldError message={errors.password?.message} />
          <p className="text-xs text-foreground/45">Must be at least 8 characters.</p>
        </div>
        <select
          className="h-12 rounded-2xl border border-border/15 bg-card text-foreground px-4 text-sm outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
          {...form.register('role')}
          aria-label="Select role"
        >
          <option value="student" className="bg-card text-foreground">Student</option>
          <option value="institution" className="bg-card text-foreground">Institution</option>
          <option value="admin" className="bg-card text-foreground">Admin</option>
        </select>
        {role === 'institution' && (
          <div className="grid gap-1.5">
            <Input placeholder="Institution name" aria-label="Institution name" {...form.register('institutionName')} />
          </div>
        )}
        {role === 'student' && (
          <div className="grid gap-1.5">
            <Input placeholder="Student ID" aria-label="Student ID" {...form.register('studentId')} />
          </div>
        )}
        <Button disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </Button>
      </form>
    </GlassCard>
  );
}

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <GlassCard className="mx-auto max-w-lg text-center">
        <CheckCircle2 className="size-14 text-success mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Check your inbox</h1>
        <p className="mt-2 text-sm text-foreground/60">
          If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
        </p>
        <div className="mt-6">
          <Link href="/login" className="text-sm font-semibold text-accent hover:text-accent/80 transition">← Back to login</Link>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Forgot password?</h1>
        <p className="mt-2 text-sm text-foreground/65">
          Enter your account email and we&apos;ll send you a reset link.
        </p>
      </div>
      <form className="grid gap-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="grid gap-1.5">
          <Input
            type="email"
            placeholder="Email address"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</Button>
        <div className="text-center">
          <Link href="/login" className="text-xs font-semibold text-foreground/50 hover:text-accent transition">← Back to login</Link>
        </div>
      </form>
    </GlassCard>
  );
}
