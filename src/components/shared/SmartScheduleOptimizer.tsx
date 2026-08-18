'use client';

// ============================================================
// RemindMe — Smart Schedule Optimizer Widget
// AI-powered reminder time optimization based on behavioral patterns
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, X, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useReminderStore } from '@/stores/reminderStore';
import { cn } from '@/lib/utils';

interface ScheduleSuggestion {
  reminderId: string;
  title: string;
  currentTime: string;
  suggestedTime: string;
  reason: string;
}

interface OptimizeResult {
  suggestions: ScheduleSuggestion[];
  insight: string;
}

export function SmartScheduleOptimizer() {
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [applying, setApplying] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const { reminders, updateReminder, getCompletedReminders } = useReminderStore();

  useEffect(() => {
    const completed = getCompletedReminders();
    // Only fetch if enough data available
    if (completed.length >= 3 && !fetched) {
      setTimeout(() => fetchOptimizations(), 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOptimizations = async () => {
    if (loading || fetched) return;
    setLoading(true);
    try {
      const completed = reminders.filter(r => r.status === 'completed' && r.time && r.completedAt);
      const res = await fetch('/api/ai/optimize-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminders: completed.map(r => ({
            id: r.id,
            title: r.title,
            time: r.time,
            completedAt: r.completedAt,
            categoryId: r.categoryId,
            priority: r.priority,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as OptimizeResult;
      setResult(data);
      setFetched(true);
    } catch {
      // Silently fail — this is a background optimization
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (suggestion: ScheduleSuggestion) => {
    setApplying(prev => new Set(prev).add(suggestion.reminderId));
    try {
      updateReminder(suggestion.reminderId, { time: suggestion.suggestedTime });
      setTimeout(() => {
        setApplying(prev => {
          const n = new Set(prev);
          n.delete(suggestion.reminderId);
          return n;
        });
        setDismissed(prev => new Set(prev).add(suggestion.reminderId));
      }, 800);
    } catch {
      setApplying(prev => {
        const n = new Set(prev);
        n.delete(suggestion.reminderId);
        return n;
      });
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  if (!result || result.suggestions.length === 0) return null;

  const visibleSuggestions = result.suggestions.filter(s => !dismissed.has(s.reminderId));

  if (visibleSuggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-violet-500/20"
      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.04) 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Smart Schedule AI</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{visibleSuggestions.length} optimization{visibleSuggestions.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] transition-colors"
        >
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Insight */}
              {result.insight && (
                <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--surface-1)] rounded-xl p-3 border border-[var(--border)]">
                  💡 {result.insight}
                </p>
              )}

              {/* Suggestions */}
              {visibleSuggestions.map((s, i) => (
                <motion.div
                  key={s.reminderId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ delay: i * 0.07 }}
                  className="p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                          <Clock size={10} />
                          {s.currentTime}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">→</span>
                        <span className="text-[10px] font-semibold text-violet-400">{s.suggestedTime}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{s.reason}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDismiss(s.reminderId)}
                      className="flex-1 py-1.5 rounded-lg border border-[var(--border)] text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center gap-1"
                    >
                      <X size={10} />
                      Skip
                    </button>
                    <button
                      onClick={() => handleApply(s)}
                      disabled={applying.has(s.reminderId)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1',
                        applying.has(s.reminderId)
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-violet-600 text-white hover:bg-violet-700',
                      )}
                    >
                      {applying.has(s.reminderId) ? (
                        <><Loader2 size={10} className="animate-spin" /> Applied!</>
                      ) : (
                        <><Check size={10} /> Apply</>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="flex items-center gap-2 px-4 pb-3 text-xs text-[var(--text-tertiary)]">
          <Loader2 size={12} className="animate-spin text-violet-400" />
          AI analyzing your schedule patterns...
        </div>
      )}
    </motion.div>
  );
}
