// ============================================================
// RemindMe — Local Notification Service (No server needed)
// Uses browser Notification API + setTimeout scheduling
// ============================================================

import { Reminder } from '@/types';

// Map of reminderID → timeout handle
const scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ============================================================
// Request Permission
// ============================================================
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// ============================================================
// Fire a notification immediately
// ============================================================
function fireNotification(reminder: Reminder) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

  const notif = new Notification(reminder.title, {
    body: reminder.description || (reminder.date + (reminder.time ? ' at ' + reminder.time : '')),
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    tag: reminder.id,
    silent: false,
  });

  notif.onclick = () => {
    window.focus();
    window.location.href = '/reminders/' + reminder.id;
    notif.close();
  };
}

// ============================================================
// Schedule a single reminder's notification
// ============================================================
export function scheduleNotification(reminder: Reminder) {
  cancelNotification(reminder.id);

  if (reminder.status !== 'pending') return;
  if (!reminder.date) return;

  const dateStr = reminder.time ? (reminder.date + 'T' + reminder.time) : (reminder.date + 'T09:00');
  const targetTime = new Date(dateStr).getTime();
  const now = Date.now();
  const delay = targetTime - now;

  if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return;

  const handle = setTimeout(() => {
    fireNotification(reminder);
    scheduledTimers.delete(reminder.id);
  }, delay);

  scheduledTimers.set(reminder.id, handle);
}

// ============================================================
// Cancel a scheduled notification
// ============================================================
export function cancelNotification(id: string) {
  const handle = scheduledTimers.get(id);
  if (handle !== undefined) {
    clearTimeout(handle);
    scheduledTimers.delete(id);
  }
}

// ============================================================
// Schedule all pending reminders at once
// ============================================================
export function scheduleAllNotifications(reminders: Reminder[]) {
  scheduledTimers.forEach((handle) => clearTimeout(handle));
  scheduledTimers.clear();
  reminders.filter((r) => r.status === 'pending').forEach((r) => scheduleNotification(r));
}

// ============================================================
// Cancel all scheduled notifications
// ============================================================
export function cancelAllNotifications() {
  scheduledTimers.forEach((handle) => clearTimeout(handle));
  scheduledTimers.clear();
}
