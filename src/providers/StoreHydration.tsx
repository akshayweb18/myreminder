'use client';

// ============================================================
// StoreHydration — Triggers localStorage rehydration for all
// Zustand persist stores after the client mounts.
//
// We use skipHydration:true on all stores so that localStorage
// is NEVER read during SSR (which causes hydration mismatches).
// This component safely rehydrates them on the client side only.
// ============================================================

import { useEffect } from 'react';
import { useReminderStore } from '@/stores/reminderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBpStore } from '@/stores/bpStore';

export function StoreHydration() {
  useEffect(() => {
    // Rehydrate all persisted stores from localStorage on client mount.
    // This is safe because useEffect never runs on the server.
    useReminderStore.persist.rehydrate();
    useSettingsStore.persist.rehydrate();
    useBpStore.persist.rehydrate();
  }, []);

  // Renders nothing — purely a side-effect component.
  return null;
}
