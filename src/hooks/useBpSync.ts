'use client';

// ============================================================
// RemindMe — BP Realtime Database Sync Hook
// Subscribes to RTDB bp/{userId}/readings and
// bp/{userId}/medicines and keeps Zustand bpStore in sync
// whenever the signed-in user's data changes in the cloud.
// ============================================================

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { subscribeToBpReadings, subscribeToBpMedicines } from '@/services/rtdbService';
import { useBpStore } from '@/stores/bpStore';

export function useBpSync() {
  const { user } = useAuth();
  const setReadingsFromCloud  = useBpStore((s) => s.setReadingsFromCloud);
  const setMedicinesFromCloud = useBpStore((s) => s.setMedicinesFromCloud);

  useEffect(() => {
    if (!user) return;

    console.log('[useBpSync] Subscribing to RTDB for uid:', user.uid);

    // Subscribe to BP readings — fires immediately with current data, then on
    // every change. Replaces (merges) local state with the authoritative cloud data.
    const unsubReadings = subscribeToBpReadings(
      user.uid,
      (readings) => {
        console.log('[useBpSync] Received', readings.length, 'readings from RTDB');
        setReadingsFromCloud(readings);
      },
      (err) => console.error('[useBpSync] readings error:', err),
    );

    // Subscribe to BP medicines
    const unsubMedicines = subscribeToBpMedicines(
      user.uid,
      (medicines) => {
        console.log('[useBpSync] Received', medicines.length, 'medicines from RTDB');
        setMedicinesFromCloud(medicines);
      },
      (err) => console.error('[useBpSync] medicines error:', err),
    );

    return () => {
      console.log('[useBpSync] Unsubscribing from RTDB');
      unsubReadings();
      unsubMedicines();
    };
  }, [user, setReadingsFromCloud, setMedicinesFromCloud]);
}
