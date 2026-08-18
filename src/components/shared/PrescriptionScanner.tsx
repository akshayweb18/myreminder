'use client';

// ============================================================
// RemindMe — Prescription Scanner v2
// Two-pass OCR + structured extraction
// Handles handwritten prescriptions with confidence UI
// ============================================================

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, X, Sparkles, CheckCircle2, Loader2, FileImage, Plus,
  AlertCircle, Eye, EyeOff, Scan, ChevronDown, ChevronUp, Info,
  ShieldCheck, Zap,
} from 'lucide-react';
import { useReminderStore } from '@/stores/reminderStore';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExtractedMedicine {
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  time: string;
  duration?: string;
  notes: string;
  confidence?: number;
  clarityNote?: string;
}

interface ScanResult {
  medicines: ExtractedMedicine[];
  rawText?: string;
  handwritingClarity?: 'clear' | 'partial' | 'unclear';
  doctorName?: string;
  patientName?: string;
  hospitalClinic?: string;
  date?: string;
  diagnosis?: string;
  additionalInstructions?: string;
  parseError?: string;
  rawResponse?: string;
}

const FREQ_MAP: Record<string, string[]> = {
  'once-daily': ['09:00'],
  'twice-daily': ['09:00', '21:00'],
  'thrice-daily': ['08:00', '14:00', '20:00'],
  'as-needed': ['09:00'],
};

const TIME_MAP: Record<string, string> = {
  morning: '09:00', afternoon: '13:00', evening: '18:00', night: '21:00',
  'with-food': '08:00', 'before-food': '08:00', 'after-food': '09:00',
};

const CLARITY_CONFIG = {
  clear:   { label: '✅ Clear Handwriting',  bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  partial: { label: '⚠️ Partially Legible', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  unclear: { label: '🔍 AI Enhanced Read',  bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
};

function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence === undefined) return null;
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? 'text-emerald-400' : pct >= 55 ? 'text-amber-400' : 'text-red-400';
  const bg    = pct >= 80 ? 'bg-emerald-500/10' : pct >= 55 ? 'bg-amber-500/10' : 'bg-red-500/10';
  return (
    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', bg, color)}>
      {pct}% confident
    </span>
  );
}

function ScanPhaseIndicator({ phase }: { phase: 'ocr' | 'extract' }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-600/20 to-cyan-600/20 border-2 border-teal-500/30 flex items-center justify-center">
          <Scan size={32} className="text-teal-400 animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-teal-500 flex items-center justify-center">
          <Loader2 size={12} className="text-white animate-spin" />
        </div>
      </div>

      {/* Steps */}
      <div className="w-full space-y-2">
        {[
          { id: 'ocr',     label: 'OCR Text Extraction',     sub: 'Reading all visible characters...' },
          { id: 'extract', label: 'AI Medicine Extraction',  sub: 'Identifying medicines & dosages...' },
        ].map((step) => {
          const isActive  = phase === step.id;
          const isDone    = phase === 'extract' && step.id === 'ocr';
          return (
            <div key={step.id} className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl border transition-all',
              isActive ? 'border-teal-500/40 bg-teal-500/8' : isDone ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[var(--border)] opacity-40',
            )}>
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center shrink-0',
                isActive ? 'bg-teal-500' : isDone ? 'bg-emerald-500' : 'bg-[var(--surface-3)]',
              )}>
                {isDone
                  ? <CheckCircle2 size={13} className="text-white" />
                  : isActive
                    ? <Loader2 size={13} className="text-white animate-spin" />
                    : <span className="text-[9px] font-bold text-[var(--text-tertiary)]">2</span>}
              </div>
              <div>
                <p className={cn('text-xs font-semibold', isActive ? 'text-teal-400' : isDone ? 'text-emerald-400' : 'text-[var(--text-tertiary)]')}>
                  {step.label}
                </p>
                {isActive && <p className="text-[10px] text-[var(--text-tertiary)]">{step.sub}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-[var(--text-tertiary)] text-center">
        AI is reading your prescription...<br />This may take 15-30 seconds
      </p>
    </div>
  );
}

export function PrescriptionScanner({ onClose }: { onClose?: () => void }) {
  const [open, setOpen]               = useState(false);
  const [preview, setPreview]         = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType]       = useState('image/jpeg');
  const [scanning, setScanning]       = useState(false);
  const [scanPhase, setScanPhase]     = useState<'ocr' | 'extract'>('ocr');
  const [result, setResult]           = useState<ScanResult | null>(null);
  const [error, setError]             = useState('');
  const [creating, setCreating]       = useState(false);
  const [success, setSuccess]         = useState(false);
  const [selectedMeds, setSelectedMeds] = useState<Set<number>>(new Set());
  const [showRawText, setShowRawText] = useState(false);
  const [expandedMed, setExpandedMed] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addReminder } = useReminderStore();

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WEBP).');
      return;
    }
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Please use an image under 5MB.');
      return;
    }
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      setResult(null);
      setError('');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleScan = async () => {
    if (!imageBase64) return;
    setScanning(true);
    setError('');
    setResult(null);
    setScanPhase('ocr');

    // Simulate phase transition for UX
    const phaseTimer = setTimeout(() => setScanPhase('extract'), 8000);

    try {
      const res = await fetch('/api/ai/prescription-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      });

      clearTimeout(phaseTimer);

      const data = await res.json() as ScanResult & { error?: string; detail?: string };

      if (!res.ok) {
        throw new Error(data.detail || data.error || `Server error ${res.status}`);
      }

      setResult(data);
      setSelectedMeds(new Set(data.medicines.map((_, i) => i)));
    } catch (err) {
      clearTimeout(phaseTimer);
      const msg = String(err);
      console.error('[prescription-scan] client error:', msg);
      setError(
        msg.includes('abort') || msg.includes('timeout')
          ? 'Scan timed out. Please try again.'
          : 'AI scan failed. Try a brighter, clearer photo with less glare.',
      );
    } finally {
      setScanning(false);
      setScanPhase('ocr');
    }
  };

  const handleCreateReminders = async () => {
    if (!result) return;
    setCreating(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    // tomorrow variable available for future use
    format(addDays(new Date(), 1), 'yyyy-MM-dd');

    try {
      const selected = result.medicines.filter((_, i) => selectedMeds.has(i));
      for (const med of selected) {
        const freqKey = med.frequency.replace(/\s+/g, '-').toLowerCase();
        const times = FREQ_MAP[freqKey] || ['09:00'];
        const timeKey = med.time?.toLowerCase().replace(/\s+/g, '-');
        for (const t of times) {
          const resolvedTime = TIME_MAP[timeKey] || t;
          addReminder({
            title: `💊 ${med.name}${med.dosage ? ` ${med.dosage}` : ''}`,
            description: [
              med.genericName && `Generic: ${med.genericName}`,
              med.duration && `Duration: ${med.duration}`,
              med.notes,
              result.diagnosis && `Diagnosis: ${result.diagnosis}`,
            ].filter(Boolean).join(' · ') || `Prescribed medicine`,
            date: today,
            time: resolvedTime,
            priority: 'high',
            categoryId: 'health',
            emoji: '💊',
            checklist: [],
            repeat: { type: 'daily' },
          });
        }
      }
      setSuccess(true);
      setTimeout(() => handleClose(), 2000);
    } catch {
      setError('Failed to create reminders. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPreview(null);
    setImageBase64(null);
    setResult(null);
    setError('');
    setSuccess(false);
    setSelectedMeds(new Set());
    setShowRawText(false);
    setExpandedMed(null);
    onClose?.();
  };

  const clarity = result?.handwritingClarity
    ? CLARITY_CONFIG[result.handwritingClarity] || CLARITY_CONFIG.unclear
    : null;

  return (
    <>
      {/* Trigger Button */}
      <button
        id="prescription-scanner-btn"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
          'bg-gradient-to-r from-teal-600 to-cyan-600 text-white',
          'shadow-lg shadow-teal-500/20 hover:opacity-90',
        )}
      >
        <Camera size={14} />
        Scan Prescription
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="fixed inset-x-3 top-[3%] bottom-3 z-50 sm:inset-auto sm:top-[5%] sm:left-1/2 sm:-translate-x-1/2 sm:w-[540px] sm:bottom-auto rounded-3xl flex flex-col overflow-hidden"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                maxHeight: '92vh',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                      <Scan size={18} className="text-white" />
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[var(--surface-1)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">AI Prescription Scanner</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                      <Zap size={9} className="text-teal-400" />
                      NVIDIA Vision · Reads handwriting too
                    </p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {success ? (
                  /* ── SUCCESS ─────────────────────────────── */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 py-10"
                  >
                    <div className="h-24 w-24 rounded-3xl bg-teal-500/15 border-2 border-teal-500/30 flex items-center justify-center">
                      <CheckCircle2 size={40} className="text-teal-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-[var(--text-primary)]">Reminders Created! 🎉</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">Medicine reminders added to your schedule</p>
                    </div>
                  </motion.div>
                ) : scanning ? (
                  /* ── SCANNING PHASE ──────────────────────── */
                  <ScanPhaseIndicator phase={scanPhase} />
                ) : (
                  <>
                    {/* ── UPLOAD ZONE ──────────────────────── */}
                    {!preview && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            'border-2 border-dashed border-teal-500/25 rounded-2xl p-7 text-center cursor-pointer',
                            'hover:border-teal-500/55 hover:bg-teal-500/4 transition-all duration-200',
                          )}
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500/15 to-cyan-500/10 flex items-center justify-center border border-teal-500/20">
                              <FileImage size={28} className="text-teal-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[var(--text-primary)]">Upload Prescription</p>
                              <p className="text-xs text-[var(--text-tertiary)] mt-1">Drag & drop or tap to browse</p>
                              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">JPG · PNG · WEBP — Max 5MB</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
                            >
                              <Upload size={12} />
                              Browse Files
                            </button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>

                        {/* Tips */}
                        <div className="mt-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5">
                          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                            <Info size={10} /> Tips for better scanning
                          </p>
                          {[
                            '📸 Take photo in good lighting',
                            '📄 Keep prescription flat, avoid shadows',
                            '🔍 Handwritten prescriptions work too!',
                            '📐 Capture the full prescription page',
                          ].map(t => (
                            <p key={t} className="text-[10px] text-[var(--text-tertiary)]">{t}</p>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ── IMAGE PREVIEW ─────────────────────── */}
                    {preview && !result && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview} alt="Prescription preview" className="w-full max-h-64 object-contain" />
                          <button
                            onClick={() => { setPreview(null); setImageBase64(null); setError(''); }}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black/90 transition-colors"
                          >
                            <X size={14} />
                          </button>
                          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white text-[10px] font-medium">
                            Preview
                          </div>
                        </div>

                        <button
                          onClick={handleScan}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 hover:opacity-90 transition-opacity"
                        >
                          <Sparkles size={17} />
                          Scan with AI Vision
                        </button>

                        <p className="text-[10px] text-center text-[var(--text-tertiary)]">
                          Works on printed AND handwritten prescriptions
                        </p>
                      </motion.div>
                    )}

                    {/* ── SCAN RESULTS ─────────────────────── */}
                    {result && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

                        {/* Prescription meta */}
                        <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                          {/* Handwriting clarity */}
                          {clarity && (
                            <div className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold', clarity.bg, clarity.border, clarity.text)}>
                              <ShieldCheck size={12} />
                              {clarity.label}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            {result.doctorName && <p className="text-[var(--text-secondary)]"><span className="text-[var(--text-tertiary)]">Dr.</span> {result.doctorName}</p>}
                            {result.hospitalClinic && <p className="text-[var(--text-secondary)]"><span className="text-[var(--text-tertiary)]">🏥</span> {result.hospitalClinic}</p>}
                            {result.patientName && <p className="text-[var(--text-secondary)]"><span className="text-[var(--text-tertiary)]">Patient:</span> {result.patientName}</p>}
                            {result.date && <p className="text-[var(--text-secondary)]"><span className="text-[var(--text-tertiary)]">📅</span> {result.date}</p>}
                            {result.diagnosis && (
                              <p className="col-span-2 text-amber-400"><span className="text-[var(--text-tertiary)]">Diagnosis:</span> {result.diagnosis}</p>
                            )}
                          </div>
                        </div>

                        {/* Raw text toggle */}
                        {result.rawText && (
                          <button
                            onClick={() => setShowRawText(!showRawText)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              {showRawText ? <EyeOff size={12} /> : <Eye size={12} />}
                              {showRawText ? 'Hide' : 'View'} Raw OCR Text (what AI read)
                            </span>
                            {showRawText ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        )}

                        <AnimatePresence>
                          {showRawText && result.rawText && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                                <p className="text-[10px] font-mono text-[var(--text-tertiary)] leading-relaxed whitespace-pre-wrap">{result.rawText}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Additional instructions */}
                        {result.additionalInstructions && (
                          <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 text-xs">
                            <p className="text-blue-400 font-semibold mb-1">📋 Additional Instructions</p>
                            <p className="text-[var(--text-secondary)]">{result.additionalInstructions}</p>
                          </div>
                        )}

                        {/* Medicine count */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                            {result.medicines.length} Medicine{result.medicines.length !== 1 ? 's' : ''} Found
                          </p>
                          {result.medicines.length > 0 && (
                            <button
                              onClick={() => setSelectedMeds(
                                selectedMeds.size === result.medicines.length
                                  ? new Set()
                                  : new Set(result.medicines.map((_, i) => i))
                              )}
                              className="text-[10px] text-teal-400 font-semibold hover:underline"
                            >
                              {selectedMeds.size === result.medicines.length ? 'Deselect all' : 'Select all'}
                            </button>
                          )}
                        </div>

                        {result.medicines.length === 0 && (
                          <div className="flex items-start gap-2 text-xs text-amber-400 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold">No medicines detected</p>
                              <p className="text-amber-300/70 mt-0.5">
                                {result.rawText
                                  ? 'Text was read but medicines could not be identified. Check raw OCR text above.'
                                  : 'Please try a clearer, well-lit photo.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Medicine cards */}
                        {result.medicines.map((med, i) => {
                          const isSelected = selectedMeds.has(i);
                          const isExpanded = expandedMed === i;
                          const conf = med.confidence ?? 1;
                          const confColor = conf >= 0.8 ? '#10b981' : conf >= 0.55 ? '#f59e0b' : '#ef4444';

                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.07 }}
                              className={cn(
                                'rounded-2xl border-2 transition-all overflow-hidden',
                                isSelected ? 'border-teal-500/50' : 'border-[var(--border)] opacity-60',
                              )}
                              style={{ background: isSelected ? 'rgba(20,184,166,0.04)' : 'var(--surface-2)' }}
                            >
                              {/* Confidence bar */}
                              {med.confidence !== undefined && (
                                <div
                                  className="h-0.5 transition-all"
                                  style={{ width: `${conf * 100}%`, background: confColor }}
                                />
                              )}

                              <div
                                className="p-3 cursor-pointer"
                                onClick={() => {
                                  const next = new Set(selectedMeds);
                                  if (next.has(i)) next.delete(i); else next.add(i);
                                  setSelectedMeds(next);
                                }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500/15 to-cyan-500/10 flex items-center justify-center text-base shrink-0">
                                      💊
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{med.name}</p>
                                        {med.dosage && (
                                          <span className="text-xs px-1.5 py-0.5 rounded-lg bg-[var(--surface-3)] text-[var(--text-secondary)] font-medium">{med.dosage}</span>
                                        )}
                                        <ConfidenceBadge confidence={med.confidence} />
                                      </div>
                                      {med.genericName && (
                                        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Generic: {med.genericName}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-medium capitalize">
                                          {med.frequency.replace(/-/g, ' ')}
                                        </span>
                                        <span className="text-[10px] text-[var(--text-tertiary)] capitalize">{med.time}</span>
                                        {med.duration && (
                                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">
                                            {med.duration}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setExpandedMed(isExpanded ? null : i); }}
                                      className="p-1 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-colors"
                                    >
                                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                    </button>
                                    <div className={cn(
                                      'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                                      isSelected ? 'border-teal-500 bg-teal-500' : 'border-[var(--border)]',
                                    )}>
                                      {isSelected && <CheckCircle2 size={11} className="text-white" />}
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded detail */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                                        {med.notes && (
                                          <div className="flex items-start gap-1.5">
                                            <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 mt-0.5">📝 Notes:</span>
                                            <p className="text-[10px] text-[var(--text-secondary)]">{med.notes}</p>
                                          </div>
                                        )}
                                        {med.clarityNote && (
                                          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/8 border border-amber-500/15">
                                            <AlertCircle size={11} className="text-amber-400 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-amber-300">{med.clarityNote}</p>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          );
                        })}

                        {/* Create reminders button */}
                        {result.medicines.length > 0 && (
                          <button
                            onClick={handleCreateReminders}
                            disabled={creating || selectedMeds.size === 0}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {creating ? (
                              <><Loader2 size={17} className="animate-spin" /> Creating reminders...</>
                            ) : (
                              <><Plus size={17} /> Add {selectedMeds.size} Medicine Reminder{selectedMeds.size !== 1 ? 's' : ''}</>
                            )}
                          </button>
                        )}

                        {/* Re-scan button */}
                        <button
                          onClick={() => { setResult(null); setError(''); }}
                          className="w-full py-2 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          ↩ Scan a different image
                        </button>
                      </motion.div>
                    )}

                    {/* Error state */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/25"
                      >
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-red-400">Scan Failed</p>
                          <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
                          <button
                            onClick={handleScan}
                            disabled={!imageBase64}
                            className="mt-2 text-[10px] font-semibold text-teal-400 hover:underline"
                          >
                            Try again →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
