'use client';

// ============================================================
// RemindMe — FloatingButton (FAB)
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Bell, Calendar, Search } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingButtonProps {
  className?: string;
}

export function FloatingButton({ className }: FloatingButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const actions: FABAction[] = [
    {
      icon: <Bell size={18} />,
      label: 'New Reminder',
      onClick: () => { router.push('/reminders/new'); setOpen(false); },
      color: '#6366f1',
    },
    {
      icon: <Calendar size={18} />,
      label: 'Calendar',
      onClick: () => { router.push('/calendar'); setOpen(false); },
      color: '#3b82f6',
    },
    {
      icon: <Search size={18} />,
      label: 'Search',
      onClick: () => { router.push('/reminders'); setOpen(false); },
      color: '#8b5cf6',
    },
  ];

  return (
    <div className={cn('fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3', className)}>
      {/* Action buttons */}
      <AnimatePresence>
        {open && (
          <>
            {actions.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: 20 }}
                transition={{ delay: (actions.length - 1 - i) * 0.06, type: 'spring', stiffness: 400 }}
                className="flex items-center gap-3"
              >
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-[var(--surface-1)] text-[var(--text-primary)] text-xs font-medium px-3 py-1.5 rounded-full shadow-lg border border-[var(--border)] whitespace-nowrap"
                >
                  {action.label}
                </motion.span>
                <button
                  onClick={action.onClick}
                  className="h-12 w-12 rounded-2xl shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95"
                  style={{ background: action.color }}
                >
                  {action.icon}
                </button>
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className={cn(
          'h-14 w-14 rounded-2xl',
          'flex items-center justify-center',
          'text-white font-medium',
          'shadow-xl shadow-[var(--accent-glow)]',
          'transition-all duration-300',
        )}
        style={{
          background: 'linear-gradient(135deg, var(--accent), #a855f7)',
        }}
        aria-label="Open quick actions"
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {open ? <X size={22} /> : <Plus size={22} />}
        </motion.div>
      </motion.button>
    </div>
  );
}
