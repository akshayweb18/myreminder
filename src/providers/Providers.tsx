'use client';

import { useEffect } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { NotificationProvider } from './NotificationProvider';
import { StoreHydration } from './StoreHydration';
import { AuthProvider } from './AuthProvider';
import { initAnalytics } from '@/lib/firebase';

export function Providers({ children }: { children: React.ReactNode }) {
  // Init Firebase Analytics once on the client
  useEffect(() => {
    initAnalytics().catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Rehydrate all Zustand persist stores from localStorage after mount */}
        <StoreHydration />
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
