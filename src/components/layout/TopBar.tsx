'use client';

// ============================================================
// RemindMe AI — Top Bar Component
// ============================================================

import { motion } from 'framer-motion';
import { Bell, Search, Menu, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { useReminderStore } from '@/stores/reminderStore';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { useIsMounted } from '@/hooks/useIsMounted';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/reminders': 'Reminders',
  '/reminders/new': 'New Reminder',
  '/calendar': 'Calendar',
  '/bp-tracker': 'BP Tracker',
  '/history': 'History',
  '/trash': 'Trash',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleCommandPalette, toggleSidebarCollapsed } = useUiStore();
  const { getOverdueReminders } = useReminderStore();
  const mounted = useIsMounted();

  const title = PAGE_TITLES[pathname] ?? 'RemindMe AI';
  const overdueCount = mounted ? getOverdueReminders().length : 0;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-16',
        'flex items-center justify-between px-4 gap-4',
        'glass-strong border-b border-[var(--border)]',
        className,
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleSidebarCollapsed}
          className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        <motion.h1
          key={pathname}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-bold text-[var(--text-primary)] font-display"
        >
          {title}
        </motion.h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={toggleCommandPalette}
          className={cn(
            'hidden sm:flex items-center gap-2',
            'h-9 px-3 rounded-xl',
            'bg-[var(--surface-2)] border border-[var(--border)]',
            'text-[var(--text-tertiary)] text-sm',
            'hover:border-[var(--accent)] hover:text-[var(--text-primary)]',
            'transition-all duration-150',
          )}
          aria-label="Open search"
        >
          <Search size={14} />
          <span>Search...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-tertiary)] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Mobile search icon */}
        <button
          onClick={toggleCommandPalette}
          className="sm:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Search size={20} />
        </button>

        {/* Theme switcher */}
        <ThemeSwitcher compact />

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {mounted && overdueCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
            >
              {overdueCount > 9 ? '9+' : overdueCount}
            </motion.span>
          )}
        </button>

        {/* New reminder CTA */}
        <button
          onClick={() => router.push('/reminders/new')}
          className={cn(
            'hidden sm:flex items-center gap-1.5',
            'h-9 px-3 rounded-xl',
            'bg-[var(--accent)] text-white text-sm font-medium',
            'hover:opacity-90 transition-opacity',
            'shadow-lg shadow-[var(--accent-glow)]',
          )}
        >
          <Plus size={16} />
          New
        </button>
      </div>
    </header>
  );
}
