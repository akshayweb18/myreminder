// ============================================================
// RemindMe AI — useIsMounted Hook (SSR-safe, no lint warnings)
// ============================================================
//
// Uses useSyncExternalStore which is the React-recommended way
// to detect client-only hydration without setState-in-effect.

'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,   // client snapshot → true after hydration
    () => false,  // server snapshot → false during SSR
  );
}
