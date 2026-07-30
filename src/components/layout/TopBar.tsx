'use client';

// ============================================================
// RemindMe AI — Top Bar Component
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { useReminderStore } from '@/stores/reminderStore';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useState } from 'react';
import { getCategoryById } from '@/constants';

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
  const { toggleCommandPalette } = useUiStore();
  const { getOverdueReminders } = useReminderStore();
  const mounted = useIsMounted();
  const [showNotifications, setShowNotifications] = useState(false);

  const title = PAGE_TITLES[pathname] ?? 'RemindMe AI';
  const overdueCount = mounted ? getOverdueReminders().length : 0;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-14 sm:h-16',
        'flex items-center justify-between px-3 sm:px-4 gap-3',
        'glass-strong border-b border-[var(--border)]',
        className,
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-2 min-w-0">
        <motion.h1
          key={pathname}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display truncate"
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
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
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

          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute right-0 top-12 z-50 w-80 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={15} className="text-[var(--accent)]" />
                      <span className="text-sm font-bold text-[var(--text-primary)]">Notifications</span>
                    </div>
                    {mounted && overdueCount > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        {overdueCount} overdue
                      </span>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
                    {!mounted || overdueCount === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center px-4">
                        <span className="text-3xl">🎉</span>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">All caught up!</p>
                        <p className="text-xs text-[var(--text-tertiary)]">No overdue reminders right now.</p>
                      </div>
                    ) : (
                      getOverdueReminders().slice(0, 8).map((r) => {
                        const cat = getCategoryById(r.categoryId);
                        return (
                          <button
                            key={r.id}
                            onClick={() => {
                              router.push(`/reminders/${r.id}`);
                              setShowNotifications(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
                          >
                            <div
                              className="h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0"
                              style={{ background: cat.bgColor }}
                            >
                              {r.emoji ?? cat.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{r.title}</p>
                              <p className="text-xs text-red-400 font-medium">
                                {r.date} {r.time ? `· ${r.time}` : ''} · Overdue
                              </p>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {mounted && overdueCount > 0 && (
                    <div className="px-4 py-2.5 border-t border-[var(--border)]">
                      <button
                        onClick={() => { router.push('/reminders'); setShowNotifications(false); }}
                        className="text-xs text-[var(--accent)] font-semibold hover:underline"
                      >
                        View all reminders →
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

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
