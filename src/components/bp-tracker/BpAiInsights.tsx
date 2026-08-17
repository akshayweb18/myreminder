'use client';

// ============================================================
// RemindMe — AI BP Health Insights Panel
// Fetches NVIDIA NIM analysis of BP trends
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle, Heart } from 'lucide-react';
import { useBpStore, BpReading } from '@/stores/bpStore';
import { cn } from '@/lib/utils';

interface InsightsResult {
  insights: string[];
  trend: 'improving' | 'stable' | 'worsening';
  advice: string;
}

export function BpAiInsights() {
  const { readings, medicines, goal } = useBpStore();
  const [result, setResult] = useState<InsightsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const readingsPayload: Pick<BpReading, 'systolic' | 'diastolic' | 'pulse' | 'date' | 'time' | 'timeOfDay' | 'category' | 'categoryLabel'>[] = readings.slice(-30).map((r) => ({
        systolic: r.systolic,
        diastolic: r.diastolic,
        pulse: r.pulse,
        date: r.date,
        time: r.time,
        timeOfDay: r.timeOfDay,
        category: r.category,
        categoryLabel: r.categoryLabel,
      }));

      const medNames = medicines.filter((m) => m.active).map((m) => `${m.name} ${m.dosage}`);

      const res = await fetch('/api/ai/bp-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readings: readingsPayload,
          medicines: medNames,
          goal,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
      setFetched(true);
    } catch {
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (readings.length > 0 && !fetched) {
      setTimeout(() => fetchInsights(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readings.length]);

  const trendConfig = {
    improving: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Improving' },
    stable: { icon: Minus, color: 'text-blue-400', bg: 'bg-blue-500/15', label: 'Stable' },
    worsening: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/15', label: 'Worsening' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-2xl border border-[var(--accent)]/20 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, var(--accent)/5%, rgba(236,72,153,0.04) 100%)' }}
    >
      {/* Header */}
      <div className=" flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent), #ec4899)' }}
          >
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">AI Health Insights</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Powered by NVIDIA Llama 3.3</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <span className={cn('text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1',
              trendConfig[result.trend].bg, trendConfig[result.trend].color
            )}>
              {result.trend === 'improving' ? '↑' : result.trend === 'worsening' ? '↓' : '→'}
              {trendConfig[result.trend].label}
            </span>
          )}
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors p-1.5 rounded-lg hover:bg-[var(--accent)]/10"
            title="Refresh insights"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          {loading && !result ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 py-4"
            >
              <div className="relative">
                <Heart size={20} className="text-[var(--accent)]" />
                <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 animate-ping" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Analyzing your BP trends...</p>
                <p className="text-xs text-[var(--text-tertiary)]">AI is reviewing your last {Math.min(readings.length, 30)} readings</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs text-red-400 py-2">
              <AlertCircle size={14} />
              {error}
            </motion.div>
          ) : result ? (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Insights list */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Key Observations</p>
                {result.insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]"
                  >
                    <span className="text-[var(--accent)] text-xs mt-0.5 font-bold shrink-0">{i + 1}.</span>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{insight}</p>
                  </motion.div>
                ))}
              </div>

              {/* Advice */}
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                  💡 Lifestyle Advice
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{result.advice}</p>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-[var(--text-tertiary)] italic">
                ⚕️ AI insights are informational only. Always consult your doctor for medical decisions.
              </p>
            </motion.div>
          ) : readings.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 text-center">
              <p className="text-xs text-[var(--text-tertiary)]">Log at least 1 BP reading to get AI health insights.</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2">
              <p className="text-xs text-[var(--text-tertiary)] italic">Click refresh to generate insights from your BP data.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
