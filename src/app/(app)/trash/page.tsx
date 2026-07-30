'use client';

// ============================================================
// RemindMe AI — Trash Page (Restore or Permanent Delete)
// ============================================================

import { useReminderStore } from '@/stores/reminderStore';
import { ReminderCard } from '@/components/shared/ReminderCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { Trash2, RotateCcw } from 'lucide-react';

export default function TrashPage() {
  const { getTrashedReminders, restoreReminder, permanentlyDelete } = useReminderStore();
  const trashed = getTrashedReminders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">Trash</h1>
          <p className="text-xs text-[var(--text-tertiary)]">
            Deleted reminders stay here until permanently purged
          </p>
        </div>
        {trashed.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => trashed.forEach((r) => permanentlyDelete(r.id))}
          >
            <Trash2 size={14} /> Empty Trash
          </Button>
        )}
      </div>

      {trashed.length === 0 ? (
        <EmptyState
          icon="🗑️"
          title="Trash is empty"
          description="Deleted reminders will show up here."
        />
      ) : (
        <div className="space-y-3">
          {trashed.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)]"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{reminder.emoji || '🔔'}</span>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{reminder.title}</h4>
                  <p className="text-xs text-[var(--text-tertiary)]">Deleted</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => restoreReminder(reminder.id)}
                >
                  <RotateCcw size={14} /> Restore
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => permanentlyDelete(reminder.id)}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
