'use client';

import { ThemeProvider } from './ThemeProvider';
import { NotificationProvider } from './NotificationProvider';
import { StoreHydration } from './StoreHydration';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/* Rehydrate all Zustand persist stores from localStorage after mount */}
      <StoreHydration />
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ThemeProvider>
  );
}
