'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">Reset password</h2>
        <p className="text-xs text-[var(--text-tertiary)]">
          {sent ? 'Check your email for reset instructions' : "Enter your email to receive a password reset link"}
        </p>
      </div>

      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="alex@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={16} />}
            required
          />
          <Button type="submit" variant="gradient" className="w-full">
            Send Reset Link <ArrowRight size={16} />
          </Button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            Reset link sent to <strong>{email}</strong>
          </p>
          <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
            Return to Login
          </Button>
        </div>
      )}

      <div className="text-center">
        <Link href="/login" className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </div>
    </div>
  );
}
