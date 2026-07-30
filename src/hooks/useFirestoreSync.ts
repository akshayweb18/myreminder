'use client';

// ============================================================
// RemindMe AI — Firestore Sync Hook
// Listens to Firestore real-time updates and keeps Zustand
// stores in sync when the user is logged in.
// ============================================================

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { firestoreService } from '@/services/firestoreService';
import { useReminderStore } from '@/stores/reminderStore';
import { useBpStore } from '@/stores/bpStore';

export function useFirestoreSync() {
  const { user } = useAuth();
  const setRemindersFromCloud = useReminderStore((s) => s.setRemindersFromCloud);
  const setBpReadingsFromCloud = useBpStore((s) => s.setReadingsFromCloud);

  useEffect(() => {
    if (!user) return;

    // Subscribe to reminders real-time
    const unsubReminders = firestoreService.subscribeToReminders(user.uid, (reminders) => {
      if (reminders.length > 0) {
        setRemindersFromCloud(reminders);
      }
    });

    // Subscribe to BP readings real-time
    const unsubBp = firestoreService.subscribeToBloodPressure(user.uid, (readings) => {
      if (readings.length > 0) {
        setBpReadingsFromCloud(readings);
      }
    });

    return () => {
      unsubReminders();
      unsubBp();
    };
  }, [user, setRemindersFromCloud, setBpReadingsFromCloud]);
}
