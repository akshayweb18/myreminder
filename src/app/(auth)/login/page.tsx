'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">Welcome back</h2>
        <p className="text-xs text-[var(--text-tertiary)]">Enter your credentials to access your reminders</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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

        <Button type="submit" variant="gradient" className="w-full">
          Sign In <ArrowRight size={16} />
        </Button>
      </form>

      <div className="text-center text-xs text-[var(--text-tertiary)]">
        Don't have an account?{' '}
        <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
