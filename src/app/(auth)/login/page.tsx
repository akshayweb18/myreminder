'use client';

// ============================================================
// RemindMe AI — Login Page (Firebase Email + Google Sign-In)
// ============================================================

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':     return 'No account found with this email.';
    case 'auth/wrong-password':     return 'Incorrect password. Try again.';
    case 'auth/invalid-credential': return 'Email or password is incorrect.';
    case 'auth/invalid-email':      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':  return 'Too many attempts. Please try again later.';
    case 'auth/user-disabled':      return 'This account has been disabled.';
    case 'auth/popup-closed-by-user': return 'Google sign-in was cancelled.';
    default: return 'Login failed. Please try again.';
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getFirebaseErrorMessage(code));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">Welcome back</h2>
        <p className="text-xs text-[var(--text-tertiary)]">Enter your credentials to access your reminders</p>
      </div>

      {/* Google Sign-In */}
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center gap-2 justify-center"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {googleLoading ? 'Signing in...' : 'Continue with Google'}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-tertiary)]">or</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={16} />}
          required
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-[var(--accent)] hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : <>Sign In <ArrowRight size={16} /></>}
        </Button>
      </form>

      <div className="text-center text-xs text-[var(--text-tertiary)]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
