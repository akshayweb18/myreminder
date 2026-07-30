'use client';

// ============================================================
// RemindMe AI — Forgot Password Page (Firebase sendPasswordResetEmail)
// ============================================================

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        setError('No account found with that email address.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">Reset password</h2>
        <p className="text-xs text-[var(--text-tertiary)]">
          {sent
            ? 'Check your inbox for the reset link'
            : 'Enter your email to receive a password reset link'}
        </p>
      </div>

      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="alex@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={16} />}
            required
          />
          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : <>Send Reset Link <ArrowRight size={16} /></>}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <CheckCircle2 size={32} className="text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">Email sent successfully!</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                We sent a password reset link to <strong className="text-[var(--text-primary)]">{email}</strong>.
                Check your inbox and spam folder.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { setSent(false); setEmail(''); }}
          >
            Try a different email
          </Button>
        </div>
      )}

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </div>
    </div>
  );
}
