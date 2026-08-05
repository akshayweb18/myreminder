'use client';

// ============================================================
// RemindMe AI — Firestore Sync Hook
// Listens to Firestore real-time updates and keeps the
// reminders Zustand store in sync when the user is logged in.
//
// NOTE: BP data is synced via useBpSync (RTDB) — not here.
// ============================================================

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { firestoreService } from '@/services/firestoreService';
import { useReminderStore } from '@/stores/reminderStore';

export function useFirestoreSync() {
  const { user } = useAuth();
  const setRemindersFromCloud = useReminderStore((s) => s.setRemindersFromCloud);

  useEffect(() => {
    if (!user) return;

    // Subscribe to reminders real-time
    const unsubReminders = firestoreService.subscribeToReminders(user.uid, (reminders) => {
      if (reminders.length > 0) {
        setRemindersFromCloud(reminders);
      }
    });

    return () => {
      unsubReminders();
    };
  }, [user, setRemindersFromCloud]);
}
