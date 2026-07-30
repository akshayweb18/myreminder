'use client';

// ============================================================
// RemindMe AI — Full Calendar Page (FullCalendar integration)
// ============================================================

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useReminderStore } from '@/stores/reminderStore';
import { getCategoryById } from '@/constants';
import { useRouter } from 'next/navigation';
import { Plus, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { EventDropArg, EventClickArg } from '@fullcalendar/core';

// Load FullCalendar + all plugins inside ONE dynamic chunk so they share
// the same module context — this prevents "Class constructor cannot be
// invoked without 'new'" runtime TypeError.
const FullCalendarWrapper = dynamic(
  () => import('@/components/shared/FullCalendarWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 text-[var(--text-tertiary)]">
        <Loader2 className="animate-spin mr-2" size={20} />
        Loading calendar…
      </div>
    ),
  }
);

export default function CalendarPage() {
  const router = useRouter();
  const { reminders, updateReminder } = useReminderStore();

  // Convert reminders to FullCalendar events
  const events = reminders
    .filter((r) => r.status !== 'trashed')
    .map((r) => {
      const category = getCategoryById(r.categoryId);
      const start = r.time ? `${r.date}T${r.time}` : r.date;
      return {
        id: r.id,
        title: `${r.emoji || category.icon} ${r.title}`,
        start,
        backgroundColor: r.color || category.color,
        borderColor: r.color || category.color,
        textColor: '#ffffff',
        extendedProps: { ...r },
      };
    });

  // Handle event drag & drop
  const handleEventDrop = (info: EventDropArg) => {
    if (!info.event.start) return;
    const newDate = info.event.start.toISOString().split('T')[0];
    const newTime = info.event.start.toTimeString().slice(0, 5);
    updateReminder(info.event.id, { date: newDate, time: newTime });
  };

  // Handle event click → navigate to reminder detail
  const handleEventClick = (info: EventClickArg) => {
    router.push(`/reminders/${info.event.id}`);
  };

  // Handle date click → open new reminder pre-filled with date
  const handleDateClick = (info: { dateStr: string }) => {
    router.push(`/reminders/new?date=${info.dateStr}`);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
            <CalendarDays size={22} className="text-[var(--accent)]" />
            Calendar View
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Drag and drop reminders to reschedule
          </p>
        </div>
        <Button onClick={() => router.push('/reminders/new')}>
          <Plus size={16} /> New Reminder
        </Button>
      </div>

      {/* Calendar Card */}
      <div className="card p-4 sm:p-6 bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-md)]">
        <FullCalendarWrapper
          events={events}
          onEventDrop={handleEventDrop}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
        />
      </div>
    </div>
  );
}
