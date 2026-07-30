'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/otp');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">Create an account</h2>
        <p className="text-xs text-[var(--text-tertiary)] font-sans">Start organizing your life with RemindMe AI</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Alex Developer"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<User size={16} />}
          required
        />
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

        <Button type="submit" variant="gradient" className="w-full">
          Create Account <ArrowRight size={16} />
        </Button>
      </form>

      <div className="text-center text-xs text-[var(--text-tertiary)]">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
