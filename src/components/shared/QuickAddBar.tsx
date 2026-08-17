'use client';

// ============================================================
// RemindMe — QuickAddBar Component
// One-line input to instantly create a reminder
// ============================================================

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap } from 'lucide-react';
import { useReminderStore } from '@/stores/reminderStore';
import { format } from 'date-fns';

export function QuickAddBar() {
  const [value, setValue] = useState('');
  const [added, setAdded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addReminder } = useReminderStore();

  const detectCategory = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.match(/bill|pay|card|emi/)) return 'bills';
    if (lower.match(/meet|standup|work|office/)) return 'work';
    if (lower.match(/medicine|pill|doctor|health/)) return 'health';
    if (lower.match(/gym|workout|exercise|run/)) return 'fitness';
    if (lower.match(/birthday|party|celebrate/)) return 'birthday';
    if (lower.match(/shop|buy|groceri/)) return 'shopping';
    if (lower.match(/flight|travel|trip/)) return 'travel';
    if (lower.match(/study|exam|learn/)) return 'education';
    return 'personal';
  };

  const handleAdd = () => {
    if (!value.trim()) return;
    addReminder({
      title: value.trim(),
      categoryId: detectCategory(value),
      date: format(new Date(), 'yyyy-MM-dd'),
      priority: 'medium',
    });
    setValue('');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-3 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] shadow-[var(--shadow-md)] hover:border-[var(--accent)]/40 transition-colors"
    >
      <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-[var(--accent)]/10 shrink-0">
        <Zap size={15} className="text-[var(--accent)]" />
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Quick add... type and press Enter (e.g. Pay electricity bill)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none min-w-0"
      />
      <AnimatePresence mode="wait">
        {added ? (
          <motion.span
            key="done"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="text-xs font-semibold text-emerald-400 shrink-0 px-2"
          >
            ✅ Added!
          </motion.span>
        ) : (
          <motion.button
            key="btn"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            onClick={handleAdd}
            disabled={!value.trim()}
            className="shrink-0 h-8 w-8 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-all"
          >
            <Plus size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
