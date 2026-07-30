'use client';

// ============================================================
// RemindMe AI — History Page (Completed, Missed & Archived)
// ============================================================

import { useState } from 'react';
import { useReminderStore } from '@/stores/reminderStore';
import { ReminderCard } from '@/components/shared/ReminderCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { CheckCircle2, AlertCircle, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const { getCompletedReminders, getMissedReminders, getArchivedReminders } = useReminderStore();
  const [activeTab, setActiveTab] = useState<'completed' | 'missed' | 'archived'>('completed');

  const completed = getCompletedReminders();
  const missed = getMissedReminders();
  const archived = getArchivedReminders();

  const getList = () => {
    if (activeTab === 'completed') return completed;
    if (activeTab === 'missed') return missed;
    return archived;
  };

  const currentList = getList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">History</h1>
        <p className="text-xs text-[var(--text-tertiary)]">
          Review completed, missed, or archived reminders
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab('completed')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors',
            activeTab === 'completed'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]',
          )}
        >
          <CheckCircle2 size={14} /> Completed ({completed.length})
        </button>
        <button
          onClick={() => setActiveTab('missed')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors',
            activeTab === 'missed'
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]',
          )}
        >
          <AlertCircle size={14} /> Missed ({missed.length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors',
            activeTab === 'archived'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]',
          )}
        >
          <Archive size={14} /> Archived ({archived.length})
        </button>
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <EmptyState
          icon={activeTab === 'completed' ? '🎉' : activeTab === 'missed' ? '👍' : '📦'}
          title={`No ${activeTab} reminders`}
          description={`Your ${activeTab} reminders will appear here.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentList.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}
    </div>
  );
}
