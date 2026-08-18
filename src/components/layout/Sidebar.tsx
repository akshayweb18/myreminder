'use client';

// ============================================================
// RemindMe — Sidebar Component
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Bell, Calendar, History, Settings,
  Trash2, User, ChevronLeft, ChevronRight, Plus, Heart, LogOut, Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { useReminderStore } from '@/stores/reminderStore';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useAuth } from '@/providers/AuthProvider';

const NAV_GROUPS = [
  {
    label: 'Menu',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/reminders', label: 'Reminders', icon: Bell },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
      { href: '/bp-tracker', label: 'BP Tracker', icon: Heart },
      { href: '/ai-chat', label: 'AI Assistant', icon: Bot },
    ],
  },
  {
    label: 'Library',
    items: [
      { href: '/history', label: 'History', icon: History },
      { href: '/trash', label: 'Trash', icon: Trash2 },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/profile', label: 'Profile', icon: User },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUiStore();
  const { getTodayReminders, getOverdueReminders } = useReminderStore();
  const { signOut } = useAuth();
  const mounted = useIsMounted();

  const todayCount = mounted ? getTodayReminders().length : 0;
  const overdueCount = mounted ? getOverdueReminders().length : 0;

  const badges: Record<string, number> = {
    '/reminders': overdueCount,
    '/dashboard': todayCount,
  };

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      className={cn(
        'relative flex flex-col h-full',
        'bg-[var(--surface-1)] border-r border-[var(--border)]',
        'overflow-hidden shrink-0',
        className,
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-[var(--border)] shrink-0',
        sidebarCollapsed ? 'justify-center' : 'justify-between',
      )}>
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            <motion.div
              key="full-logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2.5"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center shadow-lg">
                <Bell size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)] font-display leading-none">
                  RemindMe
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="icon-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="h-8 w-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center shadow-lg"
            >
              <Bell size={16} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add */}
      {!sidebarCollapsed && (
        <div className="px-3 pt-4 pb-2">
          <Link href="/reminders/new">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-2.5',
                'bg-gradient-to-r from-[var(--accent)] to-purple-500',
                'text-white text-sm font-medium rounded-xl',
                'shadow-lg shadow-[var(--accent-glow)]',
                'transition-opacity hover:opacity-90',
              )}
            >
              <Plus size={16} />
              New Reminder
            </motion.button>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!sidebarCollapsed && (
              <p className="px-3 py-1 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                const badge = badges[href];

                return (
                  <li key={href}>
                    <Link href={href}>
                      <motion.div
                        whileHover={{ x: 2 }}
                        className={cn(
                          'relative flex items-center gap-3 rounded-xl transition-colors duration-150',
                          sidebarCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'px-3 py-2.5',
                          active
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                        )}
                        title={sidebarCollapsed ? label : undefined}
                      >
                        {active && !sidebarCollapsed && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-xl bg-[var(--accent)]/10"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">
                          <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                        </span>
                        {!sidebarCollapsed && (
                          <span className="relative z-10 text-sm font-medium flex-1">{label}</span>
                        )}
                        {mounted && badge !== undefined && badge > 0 && !sidebarCollapsed && (
                          <span className="relative z-10 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                        {mounted && badge !== undefined && badge > 0 && sidebarCollapsed && (
                          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {badge}
                          </span>
                        )}
                      </motion.div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Log Out */}
      <div className={cn('border-t border-[var(--border)] p-2', sidebarCollapsed && 'flex justify-center')}>
        <button
          onClick={signOut}
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2 w-full',
            'text-red-400 hover:bg-red-500/10 hover:text-red-300',
            'text-sm font-medium transition-colors',
            sidebarCollapsed && 'justify-center px-2 h-10 w-10',
          )}
          title="Log Out"
        >
          <LogOut size={18} />
          {!sidebarCollapsed && <span>Log Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <div className={cn('border-t border-[var(--border)] p-2', sidebarCollapsed && 'flex justify-center')}>
        <button
          onClick={toggleSidebarCollapsed}
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2 w-full',
            'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
            'text-sm transition-colors',
            sidebarCollapsed && 'justify-center px-2 h-10 w-10',
          )}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse</span></>}
        </button>
      </div>
    </motion.aside>
  );
}
