'use client';

// ============================================================
// RemindMe — Command Palette (Ctrl+K)
// ============================================================

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Calendar, LayoutDashboard, Settings, History, Trash2, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { useReminderStore } from '@/stores/reminderStore';

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, href: '/dashboard', group: 'Navigation' },
  { id: 'reminders', label: 'View All Reminders', icon: Bell, href: '/reminders', group: 'Navigation' },
  { id: 'calendar', label: 'Open Calendar', icon: Calendar, href: '/calendar', group: 'Navigation' },
  { id: 'history', label: 'View History', icon: History, href: '/history', group: 'Navigation' },
  { id: 'trash', label: 'Trash', icon: Trash2, href: '/trash', group: 'Navigation' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings', group: 'Navigation' },
  { id: 'new', label: 'Create New Reminder', icon: Plus, href: '/reminders/new', group: 'Actions' },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore();
  const { reminders } = useReminderStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
        setSelected(0);
      }, 50);
    } else {
      setTimeout(() => {
        setQuery('');
      }, 0);
    }
  }, [commandPaletteOpen]);

  const allResults = useMemo(() => {
    const filteredCommands = COMMANDS.filter((cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()),
    );
    const filteredReminders = query
      ? reminders
          .filter((r) => r.title.toLowerCase().includes(query.toLowerCase()) && r.status !== 'trashed')
          .slice(0, 4)
      : [];
    return [
      ...filteredCommands,
      ...filteredReminders.map((r) => ({
        id: r.id,
        label: r.title,
        icon: Bell,
        href: `/reminders/${r.id}`,
        group: 'Reminders',
        description: r.categoryId,
      })),
    ];
  }, [query, reminders]);



  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter') {
        const item = allResults[selected];
        if (item) {
          router.push(item.href);
          setCommandPaletteOpen(false);
          setQuery('');
        }
      }
    },
    [allResults, selected, router, setCommandPaletteOpen],
  );

  const groups = [...new Set(allResults.map((r) => (r as { group: string }).group))];

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className={cn(
              'fixed left-1/2 top-[20%] z-50',
              '-translate-x-1/2',
              'w-full max-w-xl',
              'bg-[var(--surface-1)] border border-[var(--border)]',
              'rounded-2xl shadow-[var(--shadow-xl)]',
              'overflow-hidden',
            )}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
              <Search size={18} className="text-[var(--text-tertiary)] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search reminders, actions..."
                className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm outline-none"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setSelected(0);
                  }}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <X size={14} />
                </button>
              )}
              <kbd className="text-[10px] px-2 py-1 rounded bg-[var(--surface-2)] text-[var(--text-tertiary)] font-mono border border-[var(--border)]">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {allResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">
                  No results for &quot;{query}&quot;
                </div>
              ) : (
                groups.map((group) => {
                  const groupItems = allResults.filter((r) => (r as { group: string }).group === group);
                  return (
                    <div key={group}>
                      <div className="px-4 py-1.5 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                        {group}
                      </div>
                      {groupItems.map((item) => {
                        const globalIdx = allResults.indexOf(item);
                        const isSelected = globalIdx === selected;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              router.push(item.href);
                              setCommandPaletteOpen(false);
                              setQuery('');
                            }}
                            onMouseEnter={() => setSelected(globalIdx)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                              isSelected
                                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                                : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                            )}
                          >
                            <div
                              className={cn(
                                'flex items-center justify-center h-7 w-7 rounded-lg shrink-0',
                                isSelected ? 'bg-[var(--accent)]/20' : 'bg-[var(--surface-2)]',
                              )}
                            >
                              <Icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.label}</p>
                            </div>
                            {isSelected && (
                              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/20 font-mono">
                                ↵
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border)] px-4 py-2 flex items-center gap-4 text-[10px] text-[var(--text-tertiary)]">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
