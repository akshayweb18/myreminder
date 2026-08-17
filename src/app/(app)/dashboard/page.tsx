'use client';

// ============================================================
// RemindMe — Dashboard Page
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, TrendingUp, CalendarDays, Plus, Pin } from 'lucide-react';
import { useReminderStore } from '@/stores/reminderStore';
import { StatsCard } from '@/components/shared/StatsCard';
import { ReminderCard } from '@/components/shared/ReminderCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { getGreeting, getCompletionRate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';

// ============================================================
// Weekly Activity Chart Data
// ============================================================

import { Reminder } from '@/types';

function useWeeklyData(reminders: Reminder[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayReminders = reminders.filter((r) => r.date === dateStr);
    return {
      day: format(date, 'EEE'),
      completed: dayReminders.filter((r) => r.status === 'completed').length,
      pending: dayReminders.filter((r) => r.status === 'pending').length,
      missed: dayReminders.filter((r) => r.status === 'missed').length,
      total: dayReminders.length,
    };
  });
}

// ============================================================
// Custom Tooltip
// ============================================================

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-3 shadow-[var(--shadow-lg)]">
      <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs text-[var(--text-secondary)]">
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ============================================================
// Dashboard Page
// ============================================================

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const {
    reminders,
    getTodayReminders,
    getUpcomingReminders,
    getOverdueReminders,
    getCompletedReminders,
    getMissedReminders,
    getPinnedReminders,
  } = useReminderStore();

  useEffect(() => { setTimeout(() => setMounted(true), 0); }, []);

  const todayReminders = getTodayReminders();
  const upcomingReminders = getUpcomingReminders();
  const overdueReminders = getOverdueReminders();
  const completedReminders = getCompletedReminders();
  const missedReminders = getMissedReminders();
  const pinnedReminders = getPinnedReminders();
  const weeklyData = useWeeklyData(reminders);
  const completionRate = getCompletionRate(reminders);

  const greeting = getGreeting();
  // Defer time/date formatting to client to avoid locale-based hydration mismatch
  const timeStr = mounted ? format(new Date(), 'EEEE, MMMM d') : '';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)',
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full bg-white translate-y-1/2" />
        </div>

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-0.5">{timeStr}</p>
            <h2 className="text-2xl font-bold text-white font-display mb-1">
              {greeting}! 👋
            </h2>
            <p className="text-white/80 text-sm">
              {!mounted
                ? '\u00A0'
                : overdueReminders.length > 0
                ? `You have ${overdueReminders.length} overdue reminder${overdueReminders.length > 1 ? 's' : ''} that need attention.`
                : todayReminders.length > 0
                ? `You have ${todayReminders.length} reminder${todayReminders.length > 1 ? 's' : ''} due today.`
                : "You're all caught up! Great job! 🎉"}
            </p>
          </div>
          <div className="hidden sm:block text-5xl">
            {!mounted ? null : overdueReminders.length > 0 ? '⚠️' : todayReminders.length > 0 ? '📅' : '✨'}
          </div>
        </div>

        {/* Quick stats inline */}
        <div className="relative z-10 flex items-center gap-4 mt-4 flex-wrap">
          {[
            { label: 'Today', value: todayReminders.length, color: 'bg-white/20' },
            { label: 'Upcoming', value: upcomingReminders.length, color: 'bg-white/20' },
            { label: 'Overdue', value: overdueReminders.length, color: 'bg-red-400/40' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} rounded-xl px-3 py-1.5 backdrop-blur-sm`}>
              <p className="text-xs text-white/70">{label}</p>
              <p className="text-lg font-bold text-white leading-none">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today"
          value={todayReminders.length}
          subtitle="due today"
          icon={CalendarDays}
          iconColor="#6366f1"
          iconBgColor="#6366f120"
          delay={0.05}
        />
        <StatsCard
          title="Upcoming"
          value={upcomingReminders.length}
          subtitle="scheduled"
          icon={Clock}
          iconColor="#3b82f6"
          iconBgColor="#3b82f620"
          delay={0.1}
        />
        <StatsCard
          title="Completed"
          value={completedReminders.length}
          subtitle={`${completionRate}% rate`}
          icon={CheckCircle2}
          iconColor="#10b981"
          iconBgColor="#10b98120"
          delay={0.15}
        />
        <StatsCard
          title="Overdue"
          value={overdueReminders.length}
          subtitle={overdueReminders.length > 0 ? 'needs attention' : 'all clear!'}
          icon={AlertCircle}
          iconColor={overdueReminders.length > 0 ? '#ef4444' : '#10b981'}
          iconBgColor={overdueReminders.length > 0 ? '#ef444420' : '#10b98120'}
          delay={0.2}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Reminders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pinned Reminders */}
          {pinnedReminders.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-base font-bold text-[var(--accent)] font-display flex items-center gap-2">
                  <Pin size={16} /> Pinned
                </h3>
              </div>
              <div className="space-y-3">
                {pinnedReminders.map((r) => (
                  <ReminderCard key={r.id} reminder={r} onEdit={() => router.push(`/reminders/${r.id}`)} />
                ))}
              </div>
            </section>
          )}

          {/* Overdue */}
          {overdueReminders.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-red-400 font-display flex items-center gap-2">
                  <AlertCircle size={18} /> Overdue
                </h3>
                <Button variant="ghost" size="sm" onClick={() => router.push('/reminders')}>
                  View all
                </Button>
              </div>
              <div className="space-y-3">
                {overdueReminders.slice(0, 3).map((r) => (
                  <ReminderCard key={r.id} reminder={r} onEdit={() => router.push(`/reminders/${r.id}`)} />
                ))}
              </div>
            </section>
          )}

          {/* Today */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                <CalendarDays size={18} className="text-[var(--accent)]" /> Today
              </h3>
              <Button variant="ghost" size="sm" onClick={() => router.push('/reminders/new')}>
                <Plus size={14} /> Add
              </Button>
            </div>
            {todayReminders.length === 0 ? (
              <EmptyState
                icon="✅"
                title="All done for today!"
                description="No reminders due today. Enjoy your day!"
                action={{ label: 'Add a reminder', onClick: () => router.push('/reminders/new') }}
              />
            ) : (
              <div className="space-y-3">
                {todayReminders.map((r) => (
                  <ReminderCard key={r.id} reminder={r} onEdit={() => router.push(`/reminders/${r.id}`)} />
                ))}
              </div>
            )}
          </section>

          {/* Upcoming */}
          {upcomingReminders.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                  <Clock size={18} className="text-blue-400" /> Upcoming
                </h3>
                <Button variant="ghost" size="sm" onClick={() => router.push('/reminders')}>
                  View all
                </Button>
              </div>
              <div className="space-y-3">
                {upcomingReminders.slice(0, 4).map((r) => (
                  <ReminderCard key={r.id} reminder={r} compact onEdit={() => router.push(`/reminders/${r.id}`)} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right — Charts & Activity */}
        <div className="space-y-6">
          {/* Weekly Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-md)]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--accent)]" /> Weekly Activity
              </h3>
              <span className="text-xs text-[var(--text-tertiary)]">Last 7 days</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weeklyData} barSize={16} barGap={2}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((_, i) => (
                    <Cell key={i} fill="var(--accent)" opacity={0.85} />
                  ))}
                </Bar>
                <Bar dataKey="missed" name="Missed" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((_, i) => (
                    <Cell key={i} fill="#ef4444" opacity={0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                <div className="h-2 w-2 rounded-full bg-[var(--accent)]" /> Completed
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                <div className="h-2 w-2 rounded-full bg-red-400" /> Missed
              </div>
            </div>
          </motion.div>

          {/* Completion rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-md)]"
          >
            <h3 className="text-sm font-bold text-[var(--text-primary)] font-display mb-4">
              Completion Rate
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--surface-3)"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeDasharray={`${completionRate}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-bold text-[var(--text-primary)]">
                    {completionRate}%
                  </span>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-tertiary)]">Completed</span>
                  <span className="font-semibold text-emerald-400">{completedReminders.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-tertiary)]">Missed</span>
                  <span className="font-semibold text-red-400">{missedReminders.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-tertiary)]">Pending</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {reminders.filter((r) => r.status === 'pending').length}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-3"
          >
            {[
              { label: 'New Reminder', icon: '➕', href: '/reminders/new', color: 'var(--accent)' },
              { label: 'Calendar', icon: '📅', href: '/calendar', color: '#3b82f6' },
              { label: 'History', icon: '📋', href: '/history', color: '#8b5cf6' },
              { label: 'Settings', icon: '⚙️', href: '/settings', color: '#64748b' },
            ].map(({ label, icon, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="flex flex-col items-start gap-2 p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] hover:border-[var(--accent)]/30 hover:bg-[var(--bg-hover)] transition-all group"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  {label}
                </span>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
