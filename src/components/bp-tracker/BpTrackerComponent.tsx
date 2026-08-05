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

function esc(val: string | number | undefined) {
  const s = String(val ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

function exportCSV(readings: BpReading[], medicines: BpMedicine[]) {
  if (!readings.length) { alert('No readings to export.'); return; }

  // Build a medicines lookup map
  const medMap: Record<string, string> = {};
  medicines.forEach((m) => { medMap[m.id] = m.name; });

  // ── Summary Stats ─────────────────────────────────────────
  const avgSys   = Math.round(readings.reduce((s, r) => s + r.systolic,  0) / readings.length);
  const avgDia   = Math.round(readings.reduce((s, r) => s + r.diastolic, 0) / readings.length);
  const avgPulse = Math.round(readings.reduce((s, r) => s + r.pulse,     0) / readings.length);
  const bestR  = readings.reduce((b, r) => r.systolic < b.systolic ? r : b);
  const worstR = readings.reduce((w, r) => r.systolic > w.systolic ? r : w);

  const lines: string[] = [];

  // BOM so Excel opens UTF-8 correctly
  const BOM = '\uFEFF';

  // ── Report Header ─────────────────────────────────────────
  lines.push(`${esc('BLOOD PRESSURE REPORT')},${esc('RemindMe AI')}`);
  lines.push(`${esc('Generated')},${esc(new Date().toLocaleString())}`);
  lines.push(`${esc('Total Readings')},${esc(readings.length)}`);
  lines.push(`${esc('Date Range')},${esc(`${[...readings].sort((a,b)=>a.date.localeCompare(b.date))[0].date} to ${[...readings].sort((a,b)=>a.date.localeCompare(b.date)).at(-1)!.date}`)}`);
  lines.push('');

  // ── Average Summary ────────────────────────────────────────
  lines.push(`${esc('SUMMARY')},`);
  lines.push(`${esc('Average Systolic')},${esc(`${avgSys} mmHg`)}`);
  lines.push(`${esc('Average Diastolic')},${esc(`${avgDia} mmHg`)}`);
  lines.push(`${esc('Average Pulse')},${esc(`${avgPulse} bpm`)}`);
  lines.push(`${esc('Best Reading (Lowest Systolic)')},${esc(`${bestR.systolic}/${bestR.diastolic} mmHg on ${bestR.date}`)}`);
  lines.push(`${esc('Highest Reading')},${esc(`${worstR.systolic}/${worstR.diastolic} mmHg on ${worstR.date}`)}`);
  lines.push('');

  // ── Detailed Readings ──────────────────────────────────────
  lines.push(`${esc('DETAILED READINGS')},`);
  lines.push([
    esc('No.'), esc('Date'), esc('Time'),
    esc('Systolic (mmHg)'), esc('Diastolic (mmHg)'), esc('Pulse (bpm)'),
    esc('BP Status'), esc('Time of Day'),
    esc('Medicines Taken'), esc('Notes'),
  ].join(','));

  [...readings].reverse().forEach((r, idx) => {
    const medNames = (r.medicinesTaken ?? []).map((id) => medMap[id] ?? id).join('; ');
    lines.push([
      esc(idx + 1),
      esc(new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })),
      esc(r.time),
      esc(r.systolic),
      esc(r.diastolic),
      esc(r.pulse),
      esc(r.categoryLabel),
      esc(r.timeOfDay.charAt(0).toUpperCase() + r.timeOfDay.slice(1)),
      esc(medNames || '—'),
      esc(r.notes || '—'),
    ].join(','));
  });

  const blob = new Blob([BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bp-report-${new Date().toISOString().slice(0, 10)}.csv`;
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);
    try {
      const err = await addReading(systolic, diastolic, pulse, notes.trim(), selectedMeds);
      if (err) {
        // Cloud sync failed — reading is saved locally, but warn the user
        setSaveError(err);
        // Keep form open so the user can see the error
        setIsSaving(false);
        return;
      }
      // Success — reset form
      setNotes(''); setSelectedMeds([]); setShowForm(false); setSaveError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[BpTracker] handleLogSubmit unexpected error:', msg);
      setSaveError(`Unexpected error: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;
    addMedicine(medName.trim(), medDosage.trim(), medFreq, medColor);
    setMedName(''); setMedDosage(''); setMedFreq('once-daily');
    setMedColor(MEDICINE_COLORS[0]); setShowMedForm(false);
  };

  const generatePDF = () => {
    if (!readings.length) { alert('No readings to generate a report.'); return; }

    const medMap: Record<string, BpMedicine> = {};
    medicines.forEach((m) => { medMap[m.id] = m; });

    const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));
    const avgSys   = Math.round(readings.reduce((s, r) => s + r.systolic,  0) / readings.length);
    const avgDia   = Math.round(readings.reduce((s, r) => s + r.diastolic, 0) / readings.length);
    const avgPulse = Math.round(readings.reduce((s, r) => s + r.pulse,     0) / readings.length);
    const avgCat   = getBpCategory(avgSys, avgDia);
    const bestR    = readings.reduce((b, r) => r.systolic < b.systolic ? r : b);
    const worstR   = readings.reduce((w, r) => r.systolic > w.systolic ? r : w);
    const dateRange = `${sorted[0].date} – ${sorted[sorted.length - 1].date}`;

    const statusColor: Record<string, string> = {
      normal:   '#16a34a', elevated: '#d97706',
      stage1:   '#ea580c', stage2:   '#dc2626', crisis: '#7c3aed',
    };
    const statusBg: Record<string, string> = {
      normal:   '#f0fdf4', elevated: '#fffbeb',
      stage1:   '#fff7ed', stage2:   '#fef2f2', crisis: '#f5f3ff',
    };

    const rowsHTML = [...readings].reverse().map((r, i) => {
      const medNames = (r.medicinesTaken ?? []).map((id) => medMap[id]?.name ?? id).join(', ');
      const color = statusColor[r.category] ?? '#64748b';
      const bg    = statusBg[r.category]    ?? '#f8fafc';
      return `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="color:#64748b;text-align:center">${i + 1}</td>
          <td><strong>${new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</strong></td>
          <td style="text-align:center">${r.time}</td>
          <td style="text-align:center;font-weight:700;color:#1e293b">${r.systolic}</td>
          <td style="text-align:center;font-weight:700;color:#1e293b">${r.diastolic}</td>
          <td style="text-align:center">${r.pulse}</td>
          <td style="text-align:center">
            <span style="background:${bg};color:${color};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid ${color}30">
              ${r.categoryLabel}
            </span>
          </td>
          <td style="text-align:center;text-transform:capitalize;color:#64748b">${r.timeOfDay}</td>
          <td style="color:#475569;font-size:10px">${medNames || '—'}</td>
          <td style="color:#64748b;font-size:10px">${r.notes || '—'}</td>
        </tr>`;
    }).join('');

    const avgColor = statusColor[avgCat.category] ?? '#64748b';
    const avgBg    = statusBg[avgCat.category]    ?? '#f8fafc';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BP Report — ${new Date().toLocaleDateString()}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 12px; }

    /* ── Page ── */
    @page { size: A4; margin: 14mm 14mm 16mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #6366f1 100%);
      color: #fff; padding: 28px 32px 22px; border-radius: 16px; margin-bottom: 20px;
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .header-brand { display: flex; align-items: center; gap: 14px; }
    .header-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; font-size: 28px;
    }
    .header-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header-sub { font-size: 12px; opacity: 0.8; margin-top: 2px; }
    .header-meta { text-align: right; font-size: 11px; opacity: 0.85; line-height: 1.7; }
    .header-meta strong { opacity: 1; font-weight: 600; }

    /* ── Stats Grid ── */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat-card {
      border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;
      background: linear-gradient(135deg, #f8fafc, #fff);
    }
    .stat-card.accent { border-color: #bfdbfe; background: linear-gradient(135deg, #eff6ff, #fff); }
    .stat-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
    .stat-value { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
    .stat-unit  { font-size: 10px; color: #94a3b8; font-weight: 500; margin-top: 2px; }

    /* ── Section Title ── */
    .section-title {
      font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase;
      letter-spacing: 0.1em; margin-bottom: 10px; margin-top: 22px;
      display: flex; align-items: center; gap: 8px;
    }
    .section-title::after { content: ''; flex: 1; height: 1.5px; background: linear-gradient(to right, #bfdbfe, transparent); }

    /* ── Highlight Cards ── */
    .highlights { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 0; }
    .hl-card { border-radius: 10px; padding: 12px 16px; border: 1.5px solid; }
    .hl-card .hl-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.7; }
    .hl-card .hl-val { font-size: 20px; font-weight: 800; margin-top: 4px; }
    .hl-card .hl-sub { font-size: 10px; opacity: 0.65; margin-top: 2px; }

    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: linear-gradient(90deg, #1e40af, #3b82f6); color: #fff; }
    th { padding: 9px 10px; font-weight: 600; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    tbody tr:hover { background: #f0f9ff !important; }

    /* ── Footer ── */
    .footer {
      margin-top: 24px; padding: 14px 18px; border-radius: 10px;
      background: #fff8f0; border: 1.5px solid #fed7aa;
      font-size: 10px; color: #92400e; line-height: 1.6;
    }
    .footer strong { color: #b45309; }
    .print-note { text-align: center; color: #94a3b8; font-size: 10px; margin-top: 12px; }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="header-brand">
      <div class="header-icon">🩺</div>
      <div>
        <div class="header-title">Blood Pressure Report</div>
        <div class="header-sub">RemindMe AI · Personal Health Tracker</div>
      </div>
    </div>
    <div class="header-meta">
      <div><strong>Generated:</strong> ${new Date().toLocaleString('en-IN')}</div>
      <div><strong>Total Readings:</strong> ${readings.length}</div>
      <div><strong>Date Range:</strong> ${dateRange}</div>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="stats-grid">
    <div class="stat-card accent">
      <div class="stat-label">Avg Systolic</div>
      <div class="stat-value">${avgSys}</div>
      <div class="stat-unit">mmHg</div>
    </div>
    <div class="stat-card accent">
      <div class="stat-label">Avg Diastolic</div>
      <div class="stat-value">${avgDia}</div>
      <div class="stat-unit">mmHg</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Pulse</div>
      <div class="stat-value">${avgPulse}</div>
      <div class="stat-unit">bpm</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Overall Status</div>
      <div class="stat-value" style="font-size:14px;margin-top:4px">
        <span style="background:${avgBg};color:${avgColor};padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid ${avgColor}30">
          ${avgCat.label}
        </span>
      </div>
    </div>
  </div>

  <!-- Best / Worst -->
  <div class="section-title">Reading Highlights</div>
  <div class="highlights" style="margin-bottom:0">
    <div class="hl-card" style="border-color:#86efac;background:#f0fdf4;color:#166534">
      <div class="hl-label">✅ Best Reading (Lowest Systolic)</div>
      <div class="hl-val">${bestR.systolic}/${bestR.diastolic} <span style="font-size:12px;font-weight:500">mmHg</span></div>
      <div class="hl-sub">${new Date(bestR.date).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})} · ${bestR.time} · ${bestR.categoryLabel}</div>
    </div>
    <div class="hl-card" style="border-color:#fca5a5;background:#fef2f2;color:#991b1b">
      <div class="hl-label">⚠️ Highest Reading (Max Systolic)</div>
      <div class="hl-val">${worstR.systolic}/${worstR.diastolic} <span style="font-size:12px;font-weight:500">mmHg</span></div>
      <div class="hl-sub">${new Date(worstR.date).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})} · ${worstR.time} · ${worstR.categoryLabel}</div>
    </div>
  </div>

  <!-- Readings Table -->
  <div class="section-title">Detailed Readings Log</div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Date</th><th style="text-align:center">Time</th>
        <th style="text-align:center">Sys (mmHg)</th><th style="text-align:center">Dia (mmHg)</th>
        <th style="text-align:center">Pulse</th><th style="text-align:center">BP Status</th>
        <th style="text-align:center">Time of Day</th><th>Medicines</th><th>Notes</th>
      </tr>
    </thead>
    <tbody>${rowsHTML}</tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <strong>⚠️ Medical Disclaimer:</strong> This report is generated from self-logged data using RemindMe AI and is intended for personal reference and sharing with healthcare providers only. It does not constitute medical advice. Always consult a qualified doctor or healthcare professional for diagnosis and treatment.
  </div>
  <div class="print-note">RemindMe AI — Blood Pressure Report · ${new Date().toLocaleDateString('en-IN')}</div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity size={15} /> },
    { id: 'analysis', label: 'Analysis', icon: <TrendingUp size={15} /> },
    { id: 'medicines', label: 'Medicines', icon: <Pill size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Target size={15} /> },
  ];

  return (
    <>
      {/* ── Print-only doctor report ─────────────────────── */}
      <div id="bp-print-report" className="hidden" ref={printRef}>
        <style>{`
          @media print {
            body > * { display: none !important; }
            #bp-print-report {
              display: block !important;
              font-family: 'Segoe UI', Arial, sans-serif;
              padding: 32px;
              color: #111;
              background: #fff;
            }
            .bp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #3b82f6; padding-bottom: 16px; }
            .bp-clinic-name { font-size: 22px; font-weight: 800; color: #1e40af; }
            .bp-subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
            .bp-meta { text-align: right; font-size: 11px; color: #64748b; }
            .bp-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .bp-stat-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
            .bp-stat-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            .bp-stat-value { font-size: 20px; font-weight: 800; color: #1e293b; margin-top: 4px; }
            .bp-stat-unit { font-size: 10px; color: #94a3b8; font-weight: 500; }
            .section-title { font-size: 13px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; margin-top: 20px; border-left: 4px solid #3b82f6; padding-left: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            thead tr { background: #1e40af; color: #fff; }
            th { padding: 8px 10px; font-weight: 600; text-align: left; }
            tbody tr:nth-child(odd) { background: #f8fafc; }
            tbody tr:nth-child(even) { background: #fff; }
            td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
            .status-normal   { color: #16a34a; font-weight: 700; }
            .status-elevated { color: #d97706; font-weight: 700; }
            .status-stage1   { color: #ea580c; font-weight: 700; }
            .status-stage2   { color: #dc2626; font-weight: 700; }
            .status-crisis   { color: #7f1d1d; font-weight: 700; background: #fef2f2; }
            .bp-footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; }
          }
        `}</style>

        {/* Header */}
        <div className="bp-header">
          <div>
            <div className="bp-clinic-name">🩺 Blood Pressure Report</div>
            <div className="bp-subtitle">Generated by RemindMe AI · Health Tracker</div>
          </div>
          <div className="bp-meta">
            <div><strong>Date:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            <div><strong>Time:</strong> {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            <div><strong>Total Readings:</strong> {readings.length}</div>
          </div>
        </div>

        {/* Summary Stats */}
        {readings.length > 0 && (() => {
          const avgSys   = Math.round(readings.reduce((s, r) => s + r.systolic,  0) / readings.length);
          const avgDia   = Math.round(readings.reduce((s, r) => s + r.diastolic, 0) / readings.length);
          const avgPulse = Math.round(readings.reduce((s, r) => s + r.pulse,     0) / readings.length);
          const bestR    = readings.reduce((b, r) => r.systolic < b.systolic ? r : b);
          const worstR   = readings.reduce((w, r) => r.systolic > w.systolic ? r : w);
          return (
            <>
              <div className="section-title">Summary Statistics</div>
              <div className="bp-stats-grid">
                <div className="bp-stat-card">
                  <div className="bp-stat-label">Avg Systolic</div>
                  <div className="bp-stat-value">{avgSys} <span className="bp-stat-unit">mmHg</span></div>
                </div>
                <div className="bp-stat-card">
                  <div className="bp-stat-label">Avg Diastolic</div>
                  <div className="bp-stat-value">{avgDia} <span className="bp-stat-unit">mmHg</span></div>
                </div>
                <div className="bp-stat-card">
                  <div className="bp-stat-label">Avg Pulse</div>
                  <div className="bp-stat-value">{avgPulse} <span className="bp-stat-unit">bpm</span></div>
                </div>
                <div className="bp-stat-card">
                  <div className="bp-stat-label">Total Readings</div>
                  <div className="bp-stat-value">{readings.length}</div>
                </div>
                <div className="bp-stat-card">
                  <div className="bp-stat-label">Best Reading</div>
                  <div className="bp-stat-value" style={{ fontSize: 14 }}>{bestR.systolic}/{bestR.diastolic}</div>
                  <div className="bp-stat-unit">{bestR.date}</div>
                </div>
                <div className="bp-stat-card">
                  <div className="bp-stat-label">Highest Reading</div>
                  <div className="bp-stat-value" style={{ fontSize: 14, color: '#dc2626' }}>{worstR.systolic}/{worstR.diastolic}</div>
                  <div className="bp-stat-unit">{worstR.date}</div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Detailed Table */}
        <div className="section-title">Detailed Readings</div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Date</th><th>Time</th>
              <th>Systolic</th><th>Diastolic</th><th>Pulse</th>
              <th>BP Status</th><th>Time of Day</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {[...readings].reverse().map((r, idx) => (
              <tr key={r.id}>
                <td>{idx + 1}</td>
                <td><strong>{format(parseISO(r.date), 'dd MMM yyyy')}</strong></td>
                <td>{r.time}</td>
                <td><strong>{r.systolic} mmHg</strong></td>
                <td><strong>{r.diastolic} mmHg</strong></td>
                <td>{r.pulse} bpm</td>
                <td className={`status-${r.category}`}>{r.categoryLabel}</td>
                <td style={{ textTransform: 'capitalize' }}>{r.timeOfDay}</td>
                <td>{r.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bp-footer">
          ⚠️ This report is generated from self-logged data and is intended for personal reference only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.
        </div>
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
            <Button variant="ghost" size="sm" onClick={() => exportCSV(readings, medicines)} title="Export CSV">
              <Download size={14} /> CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={generatePDF} title="Doctor PDF Report">
              <Printer size={14} /> PDF Report
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

                  {/* Error banner — shown when cloud sync fails */}
                  {saveError && (
                    <div className="md:col-span-3 p-3 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-400">Cloud Sync Failed</p>
                        <p className="text-xs text-red-300/80 mt-0.5">{saveError}</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">
                          Your reading was saved locally. Sign in or check your internet connection to sync.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="md:col-span-3 flex justify-end gap-2">
                    <Button variant="ghost" type="button" size="sm" onClick={() => { setShowForm(false); setSaveError(null); }}>Cancel</Button>
                    <Button type="submit" size="sm" disabled={isSaving}>
                      {isSaving ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Saving…
                        </span>
                      ) : 'Save Reading'}
                    </Button>
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
