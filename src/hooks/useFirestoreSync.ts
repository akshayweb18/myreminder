'use client';

// ============================================================
// RemindMe — RTDB Sync Hook (Reminders)
// Subscribes to reminders/{userId} in Realtime Database and
// keeps the Zustand reminderStore in sync when signed in.
//
// BP data is synced separately via useBpSync (also RTDB).
// ============================================================

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { subscribeToReminders } from '@/services/rtdbService';
import { useReminderStore } from '@/stores/reminderStore';

export function useFirestoreSync() {
  const { user } = useAuth();
  const setRemindersFromCloud = useReminderStore((s) => s.setRemindersFromCloud);

  useEffect(() => {
    if (!user) return;

    console.log('[useFirestoreSync] Subscribing to RTDB reminders for uid:', user.uid);

    const unsubReminders = subscribeToReminders(
      user.uid,
      (reminders) => {
        console.log('[useFirestoreSync] Received', reminders.length, 'reminders from RTDB');
        if (reminders.length > 0) {
          setRemindersFromCloud(reminders);
        }
      },
      (err) => console.error('[useFirestoreSync] reminders error:', err),
    );

    return () => {
      console.log('[useFirestoreSync] Unsubscribing RTDB reminders');
      unsubReminders();
    };
  }, [user, setRemindersFromCloud]);
}
