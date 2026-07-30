'use client';

// ============================================================
// RemindMe AI — App Shell Layout
// ============================================================

import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { FloatingButton } from '@/components/shared/FloatingButton';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Start real-time Firestore sync for reminders + BP when user is logged in
  useFirestoreSync();

  return (
    <div className="flex h-[100dvh] bg-[var(--bg-base)] overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Page content — scrollable, clears fixed bottom nav on mobile */}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Global FAB — desktop only */}
      <FloatingButton className="md:flex hidden" />

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
