'use client';

// ============================================================
// RemindMe AI — Blood Pressure Tracker Component (Client-only)
// ============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Plus, Trash2, Activity, ShieldAlert,
  Calendar, TrendingUp, Info, AlertTriangle,
  Pill, Target, Bell, Download, Printer,
  Flame, CheckCircle2, ToggleLeft, ToggleRight, X,
} from 'lucide-react';
import {
  useBpStore, getBpCategory, BpReading, BpMedicine,
} from '@/stores/bpStore';
import { Button } from '@/components/ui/Button';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
  ReferenceLine, BarChart, Bar, Cell,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

// ============================================================
// Helpers
// ============================================================

const MEDICINE_COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#06b6d4','#a855f7','#f97316'];
const TOD_LABELS = { morning: '🌅 Morning', afternoon: '☀️ Afternoon', evening: '🌇 Evening', night: '🌙 Night' };

function exportCSV(readings: BpReading[]) {
  const header = 'Date,Time,Systolic,Diastolic,Pulse,Status,Time Of Day,Notes\n';
  const rows = readings
    .map((r) =>
      `${r.date},${r.time},${r.systolic},${r.diastolic},${r.pulse},"${r.categoryLabel}","${r.timeOfDay}","${r.notes ?? ''}"`,
    )
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bp-records-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type TabId = 'overview' | 'analysis' | 'medicines' | 'settings';

export default function BpTrackerComponent() {
  const {
    readings, medicines, goal, reminderSettings,
    addReading, deleteReading, clearAll,
    addMedicine, deleteMedicine, toggleMedicineActive,
    setGoal, setReminderSettings, getStreak,
  } = useBpStore();

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Log form state
  const [showForm, setShowForm] = useState(false);
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [pulse, setPulse] = useState(72);
  const [notes, setNotes] = useState('');
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);

  // Chart timeframe
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | '1year'>('7days');

  // Goal form state
  const [goalSys, setGoalSys] = useState(goal?.systolic ?? 120);
  const [goalDia, setGoalDia] = useState(goal?.diastolic ?? 80);

  // Medicine form state
  const [showMedForm, setShowMedForm] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState<BpMedicine['frequency']>('once-daily');
  const [medColor, setMedColor] = useState(MEDICINE_COLORS[0]);

  // Print ref
  const printRef = useRef<HTMLDivElement>(null);

  const streak = getStreak();

  const liveDiag = useMemo(() => getBpCategory(systolic, diastolic), [systolic, diastolic]);

  // Chart-filtered readings (chronological)
  const chartReadings = useMemo(() => {
    const days = timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 365;
    const limit = format(subDays(new Date(), days), 'yyyy-MM-dd');
    return [...readings].filter((r) => r.date >= limit).reverse();
  }, [readings, timeframe]);

  // All-time stats (avg)
  const stats = useMemo(() => {
    const src = chartReadings;
    if (!src.length) return { sys: 0, dia: 0, pulse: 0, color: '#64748b', label: 'No Data' };
    const avgSys = Math.round(src.reduce((s, r) => s + r.systolic, 0) / src.length);
    const avgDia = Math.round(src.reduce((s, r) => s + r.diastolic, 0) / src.length);
    const avgPulse = Math.round(src.reduce((s, r) => s + r.pulse, 0) / src.length);
    const { label, color } = getBpCategory(avgSys, avgDia);
    return { sys: avgSys, dia: avgDia, pulse: avgPulse, label, color };
  }, [chartReadings]);

  // Time-of-day analysis data
  const todData = useMemo(() => {
    const groups: Record<string, { sys: number[]; dia: number[] }> = {
      morning: { sys: [], dia: [] },
      afternoon: { sys: [], dia: [] },
      evening: { sys: [], dia: [] },
      night: { sys: [], dia: [] },
    };
    readings.forEach((r) => {
      if (groups[r.timeOfDay]) {
        groups[r.timeOfDay].sys.push(r.systolic);
        groups[r.timeOfDay].dia.push(r.diastolic);
      }
    });
    return Object.entries(groups).map(([tod, { sys, dia }]) => ({
      name: TOD_LABELS[tod as keyof typeof TOD_LABELS],
      systolic: sys.length ? Math.round(sys.reduce((a, b) => a + b, 0) / sys.length) : 0,
      diastolic: dia.length ? Math.round(dia.reduce((a, b) => a + b, 0) / dia.length) : 0,
      count: sys.length,
    }));
  }, [readings]);

  // Category distribution
  const catDist = useMemo(() => {
    const map: Record<string, { label: string; color: string; count: number }> = {};
    readings.forEach((r) => {
      if (!map[r.category]) map[r.category] = { label: r.categoryLabel, color: r.categoryColor, count: 0 };
      map[r.category].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [readings]);

  // Best & worst
  const bestReading = useMemo(
    () => readings.length ? readings.reduce((best, r) => r.systolic < best.systolic ? r : best) : null,
    [readings],
  );
  const worstReading = useMemo(
    () => readings.length ? readings.reduce((worst, r) => r.systolic > worst.systolic ? r : worst) : null,
    [readings],
  );

  // Handlers
  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReading(systolic, diastolic, pulse, notes.trim(), selectedMeds);
    setNotes(''); setSelectedMeds([]); setShowForm(false);
  };

  const handleMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;
    addMedicine(medName.trim(), medDosage.trim(), medFreq, medColor);
    setMedName(''); setMedDosage(''); setMedFreq('once-daily');
    setMedColor(MEDICINE_COLORS[0]); setShowMedForm(false);
  };

  const handlePrint = () => window.print();

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity size={15} /> },
    { id: 'analysis', label: 'Analysis', icon: <TrendingUp size={15} /> },
    { id: 'medicines', label: 'Medicines', icon: <Pill size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Target size={15} /> },
  ];

  return (
    <>
      {/* ── Print-only doctor report ────────────────────────── */}
      <div id="bp-print-report" className="hidden" ref={printRef}>
        <style>{`
          @media print {
            body > * { display: none !important; }
            #bp-print-report { display: block !important; font-family: sans-serif; padding: 24px; color: #000; }
            #bp-print-report table { width: 100%; border-collapse: collapse; }
            #bp-print-report th, #bp-print-report td { border: 1px solid #ccc; padding: 6px 10px; font-size: 11px; }
            #bp-print-report th { background: #f3f4f6; }
          }
        `}</style>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>🩺 Blood Pressure Report</h1>
        <p style={{ color: '#555', marginBottom: 16 }}>Generated: {new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Time</th><th>Systolic</th><th>Diastolic</th>
              <th>Pulse</th><th>Status</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {[...readings].reverse().map((r) => (
              <tr key={r.id}>
                <td>{format(parseISO(r.date), 'MMM d, yyyy')}</td>
                <td>{r.time}</td>
                <td><b>{r.systolic} mmHg</b></td>
                <td><b>{r.diastolic} mmHg</b></td>
                <td>{r.pulse} bpm</td>
                <td style={{ color: r.categoryColor, fontWeight: 600 }}>{r.categoryLabel}</td>
                <td>{r.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Main UI ─────────────────────────────────────────── */}
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Heart size={26} className="text-red-500 fill-red-500 animate-pulse" />
            <div>
              <h1 className="text-xl font-bold font-display text-[var(--text-primary)]">BP Tracker</h1>
              <p className="text-xs text-[var(--text-tertiary)]">Log, analyze & manage your blood pressure</p>
            </div>
            {/* Streak badge */}
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
                <Flame size={14} />
                {streak}-day streak!
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => exportCSV(readings)} title="Export CSV">
              <Download size={14} /> CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePrint} title="Doctor Report">
              <Printer size={14} /> Report
            </Button>
            <Button size="sm" onClick={() => { setShowForm(!showForm); setActiveTab('overview'); }}>
              <Plus size={14} /> Log Reading
            </Button>
          </div>
        </div>

        {/* Log Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
            >
              <form onSubmit={handleLogSubmit}
                className="card p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl shadow-xl space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Activity size={16} className="text-[var(--accent)]" /> Log BP Reading
                  </h3>
                  <button type="button" onClick={() => setShowForm(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Systolic */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)] font-medium">Systolic (Upper)</span>
                      <span className="font-bold text-[var(--text-primary)]">{systolic} mmHg</span>
                    </div>
                    <input type="range" min={80} max={200} value={systolic}
                      onChange={(e) => setSystolic(+e.target.value)}
                      className="w-full h-2 rounded-lg bg-[var(--surface-3)] accent-red-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]"><span>80</span><span>200</span></div>
                  </div>

                  {/* Diastolic */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)] font-medium">Diastolic (Lower)</span>
                      <span className="font-bold text-[var(--text-primary)]">{diastolic} mmHg</span>
                    </div>
                    <input type="range" min={40} max={130} value={diastolic}
                      onChange={(e) => setDiastolic(+e.target.value)}
                      className="w-full h-2 rounded-lg bg-[var(--surface-3)] accent-blue-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]"><span>40</span><span>130</span></div>
                  </div>

                  {/* Pulse */}
                  <div className="space-y-1.5">
                    <span className="text-sm text-[var(--text-secondary)] font-medium">Pulse (bpm)</span>
                    <input type="number" min={40} max={180} value={pulse} required
                      onChange={(e) => setPulse(+e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]" />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2 space-y-1.5">
                    <span className="text-sm text-[var(--text-secondary)] font-medium">Notes (optional)</span>
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. After walk, morning fasting, feeling dizzy..."
                      className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]" />
                  </div>

                  {/* Active medicines checkboxes */}
                  {medicines.filter((m) => m.active).length > 0 && (
                    <div className="md:col-span-1 space-y-1.5">
                      <span className="text-sm text-[var(--text-secondary)] font-medium">Medicines Taken</span>
                      <div className="flex flex-wrap gap-2">
                        {medicines.filter((m) => m.active).map((m) => (
                          <button key={m.id} type="button"
                            onClick={() => setSelectedMeds((prev) =>
                              prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                            )}
                            className="px-2 py-1 rounded-lg text-xs font-medium border transition-all"
                            style={{
                              borderColor: selectedMeds.includes(m.id) ? m.color : 'var(--border)',
                              backgroundColor: selectedMeds.includes(m.id) ? `${m.color}20` : 'var(--surface-2)',
                              color: selectedMeds.includes(m.id) ? m.color : 'var(--text-secondary)',
                            }}
                          >
                            {selectedMeds.includes(m.id) ? '✓ ' : ''}{m.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Live status banner */}
                  <div className="md:col-span-3 p-3 rounded-xl border flex items-start gap-3"
                    style={{ backgroundColor: `${liveDiag.color}10`, borderColor: `${liveDiag.color}30` }}
                  >
                    <ShieldAlert size={18} style={{ color: liveDiag.color, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: liveDiag.color }}>
                        Live Status: {liveDiag.label}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {liveDiag.category === 'crisis' && '🚨 Emergency: Seek immediate medical care!'}
                        {liveDiag.category === 'stage2' && '⚠️ Stage 2 Hypertension — consult a doctor.'}
                        {liveDiag.category === 'stage1' && '⚠️ Stage 1 — reduce sodium & monitor regularly.'}
                        {liveDiag.category === 'elevated' && '💡 Slightly elevated — watch your diet & stress.'}
                        {liveDiag.category === 'normal' && '✅ Your BP is in a healthy range!'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-3 flex justify-end gap-2">
                    <Button variant="ghost" type="button" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit" size="sm">Save Reading</Button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab bar */}
        <div className="flex bg-[var(--surface-2)] p-1 rounded-xl gap-1 w-full overflow-x-auto scrollbar-none whitespace-nowrap">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[var(--accent)] text-white shadow'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ──────────── OVERVIEW TAB ──────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {readings.length === 0 ? (
              <div className="card p-12 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-3xl">🩺</div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">No Records Yet</h3>
                  <p className="text-sm text-[var(--text-tertiary)] max-w-xs mt-1">Start logging your BP to see charts and diagnostics.</p>
                </div>
                <Button onClick={() => setShowForm(true)}><Plus size={14} /> Log First Reading</Button>
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Avg Systolic', value: `${stats.sys}`, unit: 'mmHg', icon: <Activity size={18} />, bg: 'bg-red-500/10', fg: 'text-red-400' },
                    { label: 'Avg Diastolic', value: `${stats.dia}`, unit: 'mmHg', icon: <Heart size={18} />, bg: 'bg-blue-500/10', fg: 'text-blue-400' },
                    { label: 'Avg Pulse', value: `${stats.pulse}`, unit: 'bpm', icon: <TrendingUp size={18} />, bg: 'bg-emerald-500/10', fg: 'text-emerald-400' },
                    { label: 'Total Logs', value: `${readings.length}`, unit: 'readings', icon: <CheckCircle2 size={18} />, bg: 'bg-purple-500/10', fg: 'text-purple-400' },
                  ].map((s) => (
                    <div key={s.label} className="card p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center ${s.fg}`}>{s.icon}</div>
                      <div>
                        <p className="text-[11px] text-[var(--text-tertiary)]">{s.label}</p>
                        <p className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                          {s.value} <span className="text-[10px] font-normal text-[var(--text-tertiary)]">{s.unit}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart + Guidelines */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 card p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <TrendingUp size={15} className="text-[var(--accent)]" /> BP Trend
                      </h3>
                      <div className="flex bg-[var(--surface-3)] p-1 rounded-xl gap-1">
                        {(['7days','30days','1year'] as const).map((opt) => (
                          <button key={opt} onClick={() => setTimeframe(opt)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                              timeframe === opt ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            {opt === '7days' ? '1W' : opt === '30days' ? '1M' : '1Y'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-60">
                      {chartReadings.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-[var(--text-tertiary)]">No data in this range.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartReadings} margin={{ left: -22, right: 8, top: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                            <XAxis dataKey="date" tickFormatter={(s) => { try { return format(parseISO(s), timeframe === '1year' ? 'MMM yy' : 'MMM d'); } catch { return s; } }}
                              tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[40, 210]} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload as BpReading;
                              return (
                                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-3 shadow-xl text-xs space-y-1">
                                  <p className="font-semibold text-[var(--text-primary)]">{format(parseISO(d.date), 'MMM d, yyyy')} · {d.time}</p>
                                  <p className="text-red-400">Systolic: <b>{d.systolic} mmHg</b></p>
                                  <p className="text-blue-400">Diastolic: <b>{d.diastolic} mmHg</b></p>
                                  <p className="text-emerald-400">Pulse: <b>{d.pulse} bpm</b></p>
                                  <p className="font-bold" style={{ color: d.categoryColor }}>{d.categoryLabel}</p>
                                  {d.notes && <p className="text-[var(--text-tertiary)] italic pt-1 border-t border-[var(--border)] mt-1">📝 {d.notes}</p>}
                                </div>
                              );
                            }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            {goal && <>
                              <ReferenceLine y={goal.systolic} stroke="#ef4444" strokeDasharray="6 3" label={{ value: `Goal ${goal.systolic}`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
                              <ReferenceLine y={goal.diastolic} stroke="#3b82f6" strokeDasharray="6 3" label={{ value: `Goal ${goal.diastolic}`, fill: '#3b82f6', fontSize: 10, position: 'insideBottomRight' }} />
                            </>}
                            <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* BP Guide */}
                  <div className="card p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <Info size={14} className="text-[var(--accent)]" /> AHA BP Guide
                    </h3>
                    {[
                      { label: 'Normal', range: '< 120 / < 80', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', fg: 'text-emerald-400' },
                      { label: 'Elevated', range: '120–129 / < 80', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', fg: 'text-yellow-400' },
                      { label: 'Hypertension 1', range: '130–139 / 80–89', bg: 'bg-orange-500/10', border: 'border-orange-500/20', fg: 'text-orange-400' },
                      { label: 'Hypertension 2', range: '≥ 140 / ≥ 90', bg: 'bg-red-500/10', border: 'border-red-500/20', fg: 'text-red-400' },
                      { label: '🚨 Crisis', range: '> 180 / > 120', bg: 'bg-red-700/10', border: 'border-red-700/30', fg: 'text-red-500 font-bold animate-pulse' },
                    ].map((row) => (
                      <div key={row.label} className={`flex justify-between p-2 rounded-xl ${row.bg} border ${row.border} ${row.fg} text-xs`}>
                        <span>{row.label}</span><span>{row.range} mmHg</span>
                      </div>
                    ))}
                    {goal && (
                      <div className="mt-2 p-2 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-xs text-[var(--accent)] font-medium">
                        🎯 Your goal: {goal.systolic} / {goal.diastolic} mmHg
                      </div>
                    )}
                  </div>
                </div>

                {/* History table */}
                <div className="card p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <Calendar size={14} className="text-[var(--accent)]" /> Records
                    </h3>
                    <Button variant="ghost" size="sm" onClick={clearAll} className="text-red-400 hover:text-red-500 text-xs">
                      <Trash2 size={12} /> Clear All
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] text-[11px] font-semibold">
                          <th className="py-2 px-3">Date & Time</th>
                          <th className="py-2 px-3 text-center">Sys</th>
                          <th className="py-2 px-3 text-center">Dia</th>
                          <th className="py-2 px-3 text-center">Pulse</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Notes</th>
                          <th className="py-2 px-3 text-right">Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {readings.map((r) => (
                          <tr key={r.id} className="hover:bg-[var(--surface-2)]/50 text-xs text-[var(--text-primary)]">
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-medium">{format(parseISO(r.date), 'MMM d, yyyy')}</span>
                              <span className="text-[var(--text-tertiary)] ml-1">({r.time})</span>
                              <span className="ml-1 text-[var(--text-tertiary)]">·</span>
                              <span className="ml-1 text-[var(--text-tertiary)] capitalize">{r.timeOfDay}</span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-red-400">{r.systolic}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-blue-400">{r.diastolic}</td>
                            <td className="py-2.5 px-3 text-center text-emerald-400">{r.pulse}</td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ backgroundColor: `${r.categoryColor}15`, color: r.categoryColor }}>
                                {r.categoryLabel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[var(--text-tertiary)] max-w-[140px] truncate italic">{r.notes || '—'}</td>
                            <td className="py-2.5 px-3 text-right">
                              <button onClick={() => deleteReading(r.id)}
                                className="p-1 text-[var(--text-tertiary)] hover:text-red-400 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ──────────── ANALYSIS TAB ──────────── */}
        {activeTab === 'analysis' && (
          <div className="space-y-5">
            {readings.length === 0 ? (
              <div className="card p-10 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl text-center">
                <p className="text-[var(--text-tertiary)]">No data yet. Log some readings first!</p>
              </div>
            ) : (
              <>
                {/* Time-of-day chart */}
                <div className="card p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <TrendingUp size={15} className="text-[var(--accent)]" /> Time-of-Day Analysis
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)]">Average BP grouped by time of measurement</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={todData} margin={{ left: -22, right: 8, top: 5, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[40, 180]} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-3 shadow-xl text-xs space-y-1">
                                <p className="font-semibold text-[var(--text-primary)]">{label}</p>
                                <p className="text-red-400">Avg Systolic: <b>{d.systolic} mmHg</b></p>
                                <p className="text-blue-400">Avg Diastolic: <b>{d.diastolic} mmHg</b></p>
                                <p className="text-[var(--text-tertiary)]">Readings: {d.count}</p>
                              </div>
                            );
                          }}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="systolic" name="Avg Systolic" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="diastolic" name="Avg Diastolic" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category distribution + best/worst */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Distribution */}
                  <div className="card p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Category Breakdown</h3>
                    {catDist.map((c) => (
                      <div key={c.label} className="flex items-center gap-3">
                        <span className="text-xs font-medium w-40 text-[var(--text-secondary)] truncate">{c.label}</span>
                        <div className="flex-1 bg-[var(--surface-3)] rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full transition-all"
                            style={{ width: `${(c.count / readings.length) * 100}%`, backgroundColor: c.color }} />
                        </div>
                        <span className="text-[11px] font-bold min-w-[24px] text-right" style={{ color: c.color }}>{c.count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Best & Worst */}
                  <div className="card p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Best & Worst Readings</h3>
                    {bestReading && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                        <p className="text-xs font-bold text-emerald-400">🏆 Best Reading</p>
                        <p className="text-lg font-bold text-emerald-400">{bestReading.systolic}/{bestReading.diastolic}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">{format(parseISO(bestReading.date), 'MMM d, yyyy')} · {bestReading.time}</p>
                      </div>
                    )}
                    {worstReading && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
                        <p className="text-xs font-bold text-red-400">⚠️ Highest Reading</p>
                        <p className="text-lg font-bold text-red-400">{worstReading.systolic}/{worstReading.diastolic}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">{format(parseISO(worstReading.date), 'MMM d, yyyy')} · {worstReading.time}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ──────────── MEDICINES TAB ──────────── */}
        {activeTab === 'medicines' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Pill size={15} className="text-[var(--accent)]" /> BP Medicines
              </h3>
              <Button size="sm" onClick={() => setShowMedForm(!showMedForm)}>
                <Plus size={14} /> Add Medicine
              </Button>
            </div>

            <AnimatePresence>
              {showMedForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <form onSubmit={handleMedSubmit}
                    className="card p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-[var(--text-secondary)] font-medium">Medicine Name *</label>
                      <input type="text" value={medName} required onChange={(e) => setMedName(e.target.value)}
                        placeholder="e.g. Amlodipine, Losartan"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-[var(--text-secondary)] font-medium">Dosage</label>
                      <input type="text" value={medDosage} onChange={(e) => setMedDosage(e.target.value)}
                        placeholder="e.g. 5mg, 50mg"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-[var(--text-secondary)] font-medium">Frequency</label>
                      <select value={medFreq} onChange={(e) => setMedFreq(e.target.value as BpMedicine['frequency'])}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]">
                        <option value="once-daily">Once Daily</option>
                        <option value="twice-daily">Twice Daily</option>
                        <option value="as-needed">As Needed</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-[var(--text-secondary)] font-medium">Color</label>
                      <div className="flex gap-2">
                        {MEDICINE_COLORS.map((c) => (
                          <button key={c} type="button" onClick={() => setMedColor(c)}
                            className="h-7 w-7 rounded-full border-2 transition-all"
                            style={{ backgroundColor: c, borderColor: medColor === c ? 'white' : 'transparent' }} />
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" type="button" onClick={() => setShowMedForm(false)}>Cancel</Button>
                      <Button size="sm" type="submit">Save Medicine</Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {medicines.length === 0 ? (
              <div className="card p-8 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl text-center">
                <p className="text-[var(--text-tertiary)] text-sm">No medicines added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medicines.map((m) => (
                  <div key={m.id} className="card p-4 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3"
                    style={{ borderLeft: `4px solid ${m.color}` }}>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${m.color}20` }}>
                        <Pill size={16} style={{ color: m.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{m.name} {m.dosage && <span className="font-normal text-[var(--text-secondary)]">— {m.dosage}</span>}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)] capitalize">{m.frequency.replace('-', ' ')} · Since {format(parseISO(m.startDate), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleMedicineActive(m.id)}
                        className="text-xs flex items-center gap-1 font-medium"
                        style={{ color: m.active ? '#10b981' : '#64748b' }}>
                        {m.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        {m.active ? 'Active' : 'Inactive'}
                      </button>
                      <button onClick={() => deleteMedicine(m.id)}
                        className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────── SETTINGS TAB ──────────── */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* BP Goal */}
            <div className="card p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Target size={15} className="text-[var(--accent)]" /> BP Target Goal
              </h3>
              <p className="text-xs text-[var(--text-tertiary)]">Set a target — a dashed goal line will appear on the chart.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">Target Systolic</span>
                    <span className="font-bold text-red-400">{goalSys} mmHg</span>
                  </div>
                  <input type="range" min={90} max={180} value={goalSys} onChange={(e) => setGoalSys(+e.target.value)}
                    className="w-full h-2 rounded-lg bg-[var(--surface-3)] accent-red-500 cursor-pointer" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)] font-medium">Target Diastolic</span>
                    <span className="font-bold text-blue-400">{goalDia} mmHg</span>
                  </div>
                  <input type="range" min={50} max={120} value={goalDia} onChange={(e) => setGoalDia(+e.target.value)}
                    className="w-full h-2 rounded-lg bg-[var(--surface-3)] accent-blue-500 cursor-pointer" />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                {goal && (
                  <Button variant="ghost" size="sm" onClick={() => setGoal(null)} className="text-red-400">
                    Remove Goal
                  </Button>
                )}
                <Button size="sm" onClick={() => setGoal({ systolic: goalSys, diastolic: goalDia })}>
                  <CheckCircle2 size={14} /> Save Goal
                </Button>
              </div>
              {goal && (
                <div className="p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-xs font-medium text-[var(--accent)] flex items-center gap-2">
                  <Target size={13} /> Current goal: {goal.systolic} / {goal.diastolic} mmHg
                </div>
              )}
            </div>

            {/* Daily BP Reminders */}
            <div className="card p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Bell size={15} className="text-[var(--accent)]" /> Daily BP Reminders
                </h3>
                <button onClick={() => setReminderSettings({ enabled: !reminderSettings.enabled })}
                  className="flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: reminderSettings.enabled ? '#10b981' : '#64748b' }}>
                  {reminderSettings.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  {reminderSettings.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-secondary)] font-medium">🌅 Morning Reminder</label>
                  <input type="time" value={reminderSettings.morningTime}
                    onChange={(e) => setReminderSettings({ morningTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--text-secondary)] font-medium">🌇 Evening Reminder</label>
                  <input type="time" value={reminderSettings.eveningTime}
                    onChange={(e) => setReminderSettings({ eveningTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] flex items-start gap-2">
                <Info size={13} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                Reminders will appear as a system notification at the set times if notifications are allowed in your browser.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
