'use client';

// ============================================================
// StoreHydration — Triggers localStorage rehydration for all
// Zustand persist stores after the client mounts.
//
// We use skipHydration:true on all stores so that localStorage
// is NEVER read during SSR (which causes hydration mismatches).
// This component safely rehydrates them on the client side only.
//
// useBpSync() is also called here because this component is
// rendered INSIDE <AuthProvider>, so useAuth() correctly sees
// the real logged-in user (not the default context null value).
// ============================================================

import { useEffect } from 'react';
import { useReminderStore } from '@/stores/reminderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBpStore } from '@/stores/bpStore';
import { useBpSync } from '@/hooks/useBpSync';

export function StoreHydration() {
  useEffect(() => {
    // Rehydrate all persisted stores from localStorage on client mount.
    // This is safe because useEffect never runs on the server.
    useReminderStore.persist.rehydrate();
    useSettingsStore.persist.rehydrate();
    useBpStore.persist.rehydrate();
  }, []);

  // Subscribe to RTDB — must be here (inside AuthContext.Provider tree)
  // so that useAuth() returns the real user, not the default null value.
  useBpSync();

  // Renders nothing — purely a side-effect component.
  return null;
}
