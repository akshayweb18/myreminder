// ============================================================
// RemindMe — Utility Functions
// ============================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isPast, isFuture, parseISO } from 'date-fns';
import { Reminder, Priority } from '@/types';

// ============================================================
// Tailwind Merge
// ============================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// Date Helpers
// ============================================================

export function formatReminderDate(date: string, time?: string): string {
  const parsed = parseISO(date);
  const timeStr = time ? ` at ${formatTime(time)}` : '';

  if (isToday(parsed)) return `Today${timeStr}`;
  if (isTomorrow(parsed)) return `Tomorrow${timeStr}`;
  if (isYesterday(parsed)) return `Yesterday${timeStr}`;

  return format(parsed, 'MMM d, yyyy') + timeStr;
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function isReminderOverdue(reminder: Reminder): boolean {
  const dateTime = reminder.time
    ? `${reminder.date}T${reminder.time}`
    : reminder.date;
  return isPast(parseISO(dateTime)) && reminder.status === 'pending';
}

export function isReminderUpcoming(reminder: Reminder): boolean {
  const dateTime = reminder.time
    ? `${reminder.date}T${reminder.time}`
    : reminder.date;
  return isFuture(parseISO(dateTime)) && reminder.status === 'pending';
}

export function isDueToday(reminder: Reminder): boolean {
  return isToday(parseISO(reminder.date)) && reminder.status === 'pending';
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatDateForInput(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatTimeForInput(date: Date = new Date()): string {
  return format(date, 'HH:mm');
}

// ============================================================
// ID Generation
// ============================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================
// Priority Sort Order
// ============================================================

const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function sortByPriority(a: Reminder, b: Reminder): number {
  return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
}

// ============================================================
// Truncate Text
// ============================================================

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

// ============================================================
// Color Helpers
// ============================================================

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================
// LocalStorage Helpers
// ============================================================

export function getLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage might be full
  }
}

// ============================================================
// Array Helpers
// ============================================================

export function groupByDate(reminders: Reminder[]): Record<string, Reminder[]> {
  return reminders.reduce(
    (acc, reminder) => {
      const key = reminder.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(reminder);
      return acc;
    },
    {} as Record<string, Reminder[]>,
  );
}

// ============================================================
// Stats Helpers
// ============================================================

export function getCompletionRate(reminders: Reminder[]): number {
  const relevant = reminders.filter(
    (r) => r.status === 'completed' || r.status === 'missed',
  );
  if (relevant.length === 0) return 0;
  const completed = relevant.filter((r) => r.status === 'completed').length;
  return Math.round((completed / relevant.length) * 100);
}
