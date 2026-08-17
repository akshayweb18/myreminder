'use client';

// ============================================================
// RemindMe — Landing Page (Apple/Linear Style)
// ============================================================

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Smartphone, Zap, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 overflow-hidden text-center">
        {/* Background Radial Glow */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[var(--accent)]/30 to-purple-500/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 space-y-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--accent)]"
          >
            <Sparkles size={14} /> Next-Gen Progressive Web App
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[var(--text-primary)] leading-tight"
          >
            Remember Everything. <br />
            <span className="gradient-text">Forget Nothing.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto"
          >
            The world&apos;s most elegant reminder application. Designed with Apple-level precision, offline support, smart AI natural input, and instant PWA installation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
          >
            <Link href="/dashboard">
              <Button size="xl" variant="gradient" className="w-full sm:w-auto">
                Get Started Free <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                <Download size={18} /> Install PWA App
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Dashboard Preview Frame */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-5xl mx-auto px-6 mt-16"
        >
          <div className="rounded-3xl p-3 bg-white/5 border border-white/10 shadow-[var(--shadow-xl)] backdrop-blur-xl">
            <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden p-6 text-left space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-4">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-[var(--text-tertiary)] ml-2 font-mono">remindme.ai/dashboard</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-2">
                  <p className="text-xs font-bold text-[var(--accent)]">⚡ Smart Natural Input</p>
                  <p className="text-xs text-[var(--text-secondary)]">&quot;Pay credit card bill every 20th&quot;</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-2">
                  <p className="text-xs font-bold text-emerald-400">📱 Native Mobile Experience</p>
                  <p className="text-xs text-[var(--text-secondary)]">Works 100% offline with zero latency.</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-2">
                  <p className="text-xs font-bold text-purple-400">🔔 Smart Notifications</p>
                  <p className="text-xs text-[var(--text-secondary)]">Custom snooze & early alerts.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold font-display text-[var(--text-primary)]">
            Built for Perfection
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">Every feature crafted for speed, elegance, and peace of mind.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: 'Instant Command Palette',
              desc: 'Press Cmd + K anywhere to search reminders, execute actions, or create new tasks instantly.',
            },
            {
              icon: Smartphone,
              title: 'Full PWA & Offline',
              desc: 'Install directly on iOS, Android, or Desktop. Full offline cache ensures you never lose access.',
            },
            {
              icon: Shield,
              title: 'Local First & Private',
              desc: 'Your data stays encrypted in your local browser storage. Complete control over your privacy.',
            },
          ].map((f, i) => (
            <div key={i} className="card p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                <f.icon size={20} />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">{f.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
