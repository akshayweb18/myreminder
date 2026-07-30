'use client';

// ============================================================
// RemindMe AI — User Profile Page
// ============================================================

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Smartphone, Shield, Key, Mail, Check } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const [username, setUsername] = useState('Alex Developer');
  const [email, setEmail] = useState('alex@remindme.ai');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">User Profile</h1>
        <p className="text-xs text-[var(--text-tertiary)]">Manage your personal details and active devices</p>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-4 border-b border-[var(--border)] pb-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-[var(--accent)] to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            A
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{username}</h3>
            <p className="text-xs text-[var(--text-tertiary)]">{email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Pro Account
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            leftIcon={<User size={16} />}
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={16} />}
          />
        </div>

        {/* Connected Devices */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Smartphone size={14} /> Registered PWA Devices
          </h4>
          <div className="space-y-2">
            {[
              { name: 'iPhone 15 Pro (Safari PWA)', active: 'Active now', icon: '📱' },
              { name: 'MacBook Pro 16" (Chrome PWA)', active: '2 hours ago', icon: '💻' },
            ].map((device, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{device.icon}</span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{device.name}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">{device.active}</p>
                  </div>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="gradient">
            {saved ? <Check size={16} /> : null}
            {saved ? 'Saved Changes!' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
