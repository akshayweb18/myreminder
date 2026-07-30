'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);

  const handleChange = (val: string, index: number) => {
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="h-12 w-12 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
          <ShieldCheck size={24} />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">Security Verification</h2>
        <p className="text-xs text-[var(--text-tertiary)]">Enter the 4-digit code sent to your email</p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex items-center justify-center gap-3">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, i)}
              className="h-12 w-12 rounded-xl text-center text-lg font-bold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none"
            />
          ))}
        </div>

        <Button type="submit" variant="gradient" className="w-full">
          Verify & Continue <ArrowRight size={16} />
        </Button>
      </form>
    </div>
  );
}
