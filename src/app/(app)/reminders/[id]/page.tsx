'use client';

// ============================================================
// RemindMe — Reminder Detail & Edit Page
// ============================================================

import { useParams, useRouter } from 'next/navigation';
import { useReminderStore } from '@/stores/reminderStore';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { getCategoryById } from '@/constants';
import { ArrowLeft, Check, Trash2, Clock, Calendar } from 'lucide-react';
import { Priority } from '@/types';

export default function ReminderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getReminderById, updateReminder, trashReminder, completeReminder } = useReminderStore();

  const reminder = getReminderById(params.id as string);

  const [title, setTitle] = useState(reminder?.title || '');
  const [description, setDescription] = useState(reminder?.description || '');
  const [date, setDate] = useState(reminder?.date || '');
  const [time, setTime] = useState(reminder?.time || '');
  const [priority] = useState<Priority>(reminder?.priority || 'medium');

  if (!reminder) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Reminder not found</p>
        <Button variant="ghost" onClick={() => router.push('/reminders')} className="mt-4">
          Back to Reminders
        </Button>
      </div>
    );
  }

  const category = getCategoryById(reminder.categoryId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateReminder(reminder.id, {
      title,
      description,
      date,
      time,
      priority,
    });
    router.push('/reminders');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </Button>
        <div className="flex gap-2">
          {reminder.status === 'pending' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { completeReminder(reminder.id); router.push('/reminders'); }}
            >
              <Check size={14} /> Mark Complete
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { trashReminder(reminder.id); router.push('/reminders'); }}
          >
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
          <span>{reminder.emoji || category.icon}</span>
          <span>{category.name}</span>
        </div>

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            leftIcon={<Calendar size={16} />}
          />
          <Input
            type="time"
            label="Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            leftIcon={<Clock size={16} />}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" variant="gradient">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
