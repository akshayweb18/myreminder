'use client';

// ============================================================
// RemindMe — Doctor Report Component
// AI-generated clinical BP summary for doctor visits
// Printable full-screen modal with charts + AI analysis
// ============================================================

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Printer, Loader2, Sparkles, FileText, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle2, Clock, Pill,
} from 'lucide-react';
import { useBpStore } from '@/stores/bpStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Period = '7d' | '30d' | '90d';

interface ReportData {
  summary: string;
  classification: string;
  trend: string;
  morningEveningPattern: string;
  medicationNotes: string;
  recommendations: string[];
  urgencyLevel: 'routine' | 'soon' | 'urgent';
  adherenceNote: string;
  stats: {
    avgSystolic: number;
    avgDiastolic: number;
    avgPulse: number;
    totalReadings: number;
    maxSystolic: number;
    minSystolic: number;
    morningAvgSys: number | null;
    eveningAvgSys: number | null;
    period: string;
  };
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    active: boolean;
  }[];
  goal?: { systolic: number; diastolic: number };
  generatedAt: string;
}

const urgencyConfig = {
  routine: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', label: 'Routine Follow-up', icon: CheckCircle2 },
  soon: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', label: 'Schedule Soon', icon: Clock },
  urgent: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/25', label: 'Seek Immediate Care', icon: AlertTriangle },
};

export function DoctorReport() {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const { readings, medicines, goal } = useBpStore();

  const getReadingsForPeriod = (p: Period) => {
    const now = new Date();
    const days = p === '7d' ? 7 : p === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return readings.filter(r => new Date(r.date) >= cutoff);
  };

  const handleGenerate = async () => {
    const periodReadings = getReadingsForPeriod(period);
    if (periodReadings.length === 0) {
      setError('No readings found for this period. Please log BP readings first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/doctor-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readings: periodReadings.map(r => ({
            systolic: r.systolic,
            diastolic: r.diastolic,
            pulse: r.pulse,
            date: r.date,
            time: r.time,
            timeOfDay: r.timeOfDay,
            category: r.category,
            categoryLabel: r.categoryLabel,
            notes: r.notes,
          })),
          medicines: medicines.map(m => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            startDate: m.startDate,
            active: m.active,
          })),
          goal,
          period,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as ReportData;
      setReport(data);
    } catch {
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>BP Report</title>
      <style>
        body { font-family: -apple-system, sans-serif; color: #1a1a2e; padding: 20px; }
        .report { max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; color: #6366f1; } h2 { font-size: 16px; margin-top: 20px; }
        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
        .stat-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
        .stat-val { font-size: 28px; font-weight: 700; color: #6366f1; }
        .stat-label { font-size: 11px; color: #6b7280; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; }
        p { font-size: 13px; line-height: 1.6; color: #374151; }
        ul { font-size: 13px; line-height: 1.8; }
        .urgent { color: #ef4444; } .soon { color: #f59e0b; } .routine { color: #10b981; }
        .disclaimer { margin-top: 24px; padding: 12px; background: #fef9c3; border-radius: 8px; font-size: 11px; color: #713f12; }
        @media print { @page { size: A4; margin: 1cm; } }
      </style></head><body>
      <div class="report">
        ${printRef.current.innerHTML}
      </div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const trendIcon = report?.trend === 'improving' ? TrendingUp : report?.trend === 'worsening' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  return (
    <>
      <button
        id="doctor-report-btn"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
          'bg-gradient-to-r from-indigo-600 to-blue-600 text-white',
          'shadow-lg shadow-indigo-500/20 hover:opacity-90',
        )}
      >
        <FileText size={14} />
        Doctor Report
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-2 top-4 bottom-4 z-50 sm:inset-auto sm:top-[4%] sm:left-1/2 sm:-translate-x-1/2 sm:w-[660px] sm:bottom-auto rounded-3xl flex flex-col overflow-hidden"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xl)',
                maxHeight: '92vh',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
                    <FileText size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">AI Doctor Report</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">Clinical BP Summary for Doctor Visit</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {report && (
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <Printer size={13} />
                      Print / PDF
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!report ? (
                  <div className="space-y-4">
                    {/* Period selector */}
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Report Period</p>
                      <div className="flex gap-2">
                        {(['7d', '30d', '90d'] as Period[]).map(p => (
                          <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={cn(
                              'flex-1 py-2 rounded-xl text-xs font-semibold transition-all',
                              period === p ? 'bg-indigo-600 text-white shadow-lg' : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                            )}
                          >
                            {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'Last 3 Months'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                      <p className="text-xs text-[var(--text-tertiary)]">
                        📊 {getReadingsForPeriod(period).length} readings found for selected period
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        💊 {medicines.filter(m => m.active).length} active medication{medicines.filter(m => m.active).length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-xs text-red-400 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <AlertTriangle size={14} />
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {loading ? (
                        <><Loader2 size={16} className="animate-spin" /> AI is generating report...</>
                      ) : (
                        <><Sparkles size={16} /> Generate AI Report</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div ref={printRef} className="space-y-4">
                    {/* Report header info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-bold text-[var(--text-primary)] font-display">Blood Pressure Report</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          Generated: {format(new Date(report.generatedAt), 'dd MMM yyyy, hh:mm a')} · {report.stats.period}
                        </p>
                      </div>
                      <div className={cn(
                        'px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5',
                        urgencyConfig[report.urgencyLevel].bg,
                        urgencyConfig[report.urgencyLevel].border,
                        urgencyConfig[report.urgencyLevel].color,
                      )}>
                        {report.urgencyLevel === 'urgent' ? '🚨' : report.urgencyLevel === 'soon' ? '⏰' : '✅'}
                        {urgencyConfig[report.urgencyLevel].label}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Avg Systolic', value: report.stats.avgSystolic, unit: 'mmHg', color: 'text-indigo-400' },
                        { label: 'Avg Diastolic', value: report.stats.avgDiastolic, unit: 'mmHg', color: 'text-purple-400' },
                        { label: 'Avg Pulse', value: report.stats.avgPulse, unit: 'bpm', color: 'text-pink-400' },
                      ].map(({ label, value, unit, color }) => (
                        <div key={label} className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
                          <p className={cn('text-2xl font-bold', color)}>{value}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">{unit}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Additional stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1.5">
                        <p className="font-semibold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Readings</p>
                        <p className="text-[var(--text-secondary)]">Total: <span className="font-semibold text-[var(--text-primary)]">{report.stats.totalReadings}</span></p>
                        <p className="text-[var(--text-secondary)]">Highest: <span className="font-semibold text-red-400">{report.stats.maxSystolic} mmHg</span></p>
                        <p className="text-[var(--text-secondary)]">Lowest: <span className="font-semibold text-emerald-400">{report.stats.minSystolic} mmHg</span></p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1.5">
                        <p className="font-semibold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Time of Day</p>
                        {report.stats.morningAvgSys && <p className="text-[var(--text-secondary)]">🌅 Morning: <span className="font-semibold text-[var(--text-primary)]">{report.stats.morningAvgSys} mmHg</span></p>}
                        {report.stats.eveningAvgSys && <p className="text-[var(--text-secondary)]">🌆 Evening: <span className="font-semibold text-[var(--text-primary)]">{report.stats.eveningAvgSys} mmHg</span></p>}
                        {report.goal && <p className="text-[var(--text-secondary)]">🎯 Target: <span className="font-semibold text-indigo-400">{report.goal.systolic}/{report.goal.diastolic}</span></p>}
                      </div>
                    </div>

                    {/* Classification + Trend */}
                    <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Classification</p>
                        <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{report.classification}</p>
                      </div>
                      <div className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold',
                        report.trend === 'improving' ? 'bg-emerald-500/10 text-emerald-400' :
                        report.trend === 'worsening' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400',
                      )}>
                        <TrendIcon size={14} />
                        {report.trend}
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div className="p-4 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 space-y-2">
                      <p className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                        <Sparkles size={12} /> AI Clinical Summary
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{report.summary}</p>
                    </div>

                    {/* Patterns */}
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
                        <p className="font-semibold text-[var(--text-tertiary)] mb-1">🕐 AM/PM Pattern</p>
                        <p className="text-[var(--text-secondary)]">{report.morningEveningPattern}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
                        <p className="font-semibold text-[var(--text-tertiary)] mb-1 flex items-center gap-1"><Pill size={11} /> Medication Notes</p>
                        <p className="text-[var(--text-secondary)]">{report.medicationNotes}</p>
                      </div>
                    </div>

                    {/* Medications list */}
                    {report.medications.length > 0 && (
                      <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Current Medications</p>
                        {report.medications.map((m, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-primary)] font-medium">💊 {m.name} {m.dosage}</span>
                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', m.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--surface-3)] text-[var(--text-tertiary)]')}>
                              {m.active ? 'Active' : 'Stopped'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="p-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 space-y-2">
                      <p className="text-xs font-semibold text-emerald-400">💡 AI Recommendations</p>
                      <ul className="space-y-1.5">
                        {report.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                            <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Adherence */}
                    <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
                      <p className="font-semibold text-[var(--text-tertiary)] mb-1">📊 Measurement Consistency</p>
                      <p className="text-[var(--text-secondary)]">{report.adherenceNote}</p>
                    </div>

                    {/* Disclaimer */}
                    <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-[10px] text-[var(--text-tertiary)] italic">
                      ⚕️ This report is AI-generated for informational purposes only. Always consult a qualified physician for medical decisions. Generated by RemindMe · NVIDIA NIM AI.
                    </div>

                    {/* Generate new */}
                    <button
                      onClick={() => setReport(null)}
                      className="w-full py-2.5 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      Generate New Report
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
