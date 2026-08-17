'use client';

// ============================================================
// RemindMe — ThemeSwitcher Component
// ============================================================

import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import { ThemeMode } from '@/types';

interface ThemeSwitcherProps {
  className?: string;
  compact?: boolean;
}

const MODES: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

// ── Compact (icon-only toggle) ──────────────────────────────
export function ThemeSwitcherCompact({ className }: { className?: string }) {
  const { toggleTheme, resolvedTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex items-center justify-center h-9 w-9 rounded-xl',
        'text-[var(--text-secondary)]',
        'hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
        'transition-colors',
        className,
      )}
      aria-label="Toggle theme"
    >
      <motion.div
        key={resolvedTheme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </motion.div>
    </button>
  );
}

// ── Full segmented control ──────────────────────────────────
export function ThemeSwitcher({ className, compact = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    return <ThemeSwitcherCompact className={className} />;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1',
        'bg-[var(--surface-2)] rounded-xl',
        'border border-[var(--border)]',
        className,
      )}
    >
      {MODES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
            'text-sm font-medium transition-colors duration-200',
            theme === value
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
          )}
        >
          {theme === value && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-[var(--surface-1)] rounded-lg shadow-sm border border-[var(--border)]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <Icon size={14} />
            <span>{label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
