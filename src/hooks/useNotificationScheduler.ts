'use client';

// ============================================================
// RemindMe — useNotificationScheduler Hook
// Schedules browser notifications for all pending reminders
// ============================================================

import { useEffect } from 'react';
import { useReminderStore } from '@/stores/reminderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { scheduleAllNotifications, cancelAllNotifications } from '@/services/notificationService';

export function useNotificationScheduler() {
  const reminders = useReminderStore((s) => s.reminders);
  const notificationsEnabled = useSettingsStore((s) => s.settings.notifications.enabled);

  useEffect(() => {
    if (notificationsEnabled && typeof window !== 'undefined' && Notification.permission === 'granted') {
      scheduleAllNotifications(reminders);
    } else {
      cancelAllNotifications();
    }

    return () => {
      // Cleanup on unmount
    };
  }, [reminders, notificationsEnabled]);
}
