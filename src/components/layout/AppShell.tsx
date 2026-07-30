'use client';

// ============================================================
// RemindMe AI — App Shell Layout
// ============================================================

import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { FloatingButton } from '@/components/shared/FloatingButton';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Global FAB */}
      <FloatingButton className="md:flex hidden" />

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
