'use client';

// ============================================================
// RemindMe — App Shell Layout (PWA Mobile-First)
// ============================================================

import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useKeyboardShortcuts();
  useNotificationScheduler();

  return (
    <div className="flex h-[100dvh] bg-[var(--bg-base)] overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        {/* Scrollable page content */}
        <main
          className="flex-1 overflow-y-auto overscroll-none"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-32 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
