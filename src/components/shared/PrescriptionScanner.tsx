'use client';

// ============================================================
// RemindMe — Prescription Scanner Component
// AI-powered prescription / medicine label scanner using
// NVIDIA Vision Model (llama-3.2-90b-vision-instruct)
// ============================================================

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Sparkles, CheckCircle2, Loader2, FileImage, Plus, AlertCircle } from 'lucide-react';
import { useReminderStore } from '@/stores/reminderStore';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExtractedMedicine {
  name: string;
  dosage: string;
  frequency: 'once-daily' | 'twice-daily' | 'as-needed';
  time: string;
  notes: string;
}

interface ScanResult {
  medicines: ExtractedMedicine[];
  doctorName?: string;
  patientName?: string;
  date?: string;
}

const frequencyToTime: Record<string, string[]> = {
  'once-daily': ['09:00'],
  'twice-daily': ['09:00', '21:00'],
  'as-needed': ['09:00'],
};

const timeToHHMM: Record<string, string> = {
  morning: '09:00',
  afternoon: '13:00',
  evening: '18:00',
  night: '21:00',
  'with-food': '08:00',
  'before-food': '08:00',
  'after-food': '09:00',
};

export function PrescriptionScanner({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState<Set<number>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addReminder } = useReminderStore();

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      // Extract base64 (remove data:mime;base64, prefix)
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
    try {
      const res = await fetch('/api/ai/prescription-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as ScanResult;
      setResult(data);
      setSelectedMeds(new Set(data.medicines.map((_, i) => i)));
    } catch {
      setError('Could not scan prescription. Please try a clearer image.');
    } finally {
      setScanning(false);
    }
  };

  const handleCreateReminders = async () => {
    if (!result) return;
    setCreating(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    _(tomorrow); // used below

    try {
      const selected = result.medicines.filter((_, i) => selectedMeds.has(i));
      for (const med of selected) {
        const times = frequencyToTime[med.frequency] || ['09:00'];
        for (const t of times) {
          const resolvedTime = timeToHHMM[med.time] || t;
          addReminder({
            title: `💊 ${med.name} ${med.dosage}`,
            description: med.notes || `Prescribed medicine — ${med.frequency.replace('-', ' ')}`,
            date: today,
            time: resolvedTime,
            priority: 'high',
            categoryId: 'health',
            emoji: '💊',
            checklist: [],
            repeat: {
              type: med.frequency === 'twice-daily' ? 'daily' : 'daily',
            },
          });
        }
      }
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch {
      setError('Failed to create reminders. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  function _(val: string) { return val; } // suppress unused warning

  const handleClose = () => {
    setOpen(false);
    setPreview(null);
    setImageBase64(null);
    setResult(null);
    setError('');
    setSuccess(false);
    setSelectedMeds(new Set());
    onClose?.();
  };

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
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-x-4 top-[5%] bottom-4 z-50 sm:inset-auto sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:w-[520px] sm:bottom-auto rounded-3xl overflow-hidden flex flex-col"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xl)',
                maxHeight: '85vh',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
                    <Camera size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">Prescription Scanner</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">NVIDIA Vision AI</p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!success ? (
                  <>
                    {/* Upload Zone */}
                    {!preview && (
                      <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          'border-2 border-dashed border-teal-500/30 rounded-2xl p-8 text-center cursor-pointer',
                          'hover:border-teal-500/60 hover:bg-teal-500/5 transition-all',
                        )}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-16 w-16 rounded-2xl bg-teal-500/10 flex items-center justify-center">
                            <FileImage size={28} className="text-teal-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Upload Prescription</p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1">Drag & drop or click to browse</p>
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">JPG, PNG, WEBP supported</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
                            >
                              <Upload size={12} />
                              Browse Files
                            </button>
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                    )}

                    {/* Image Preview */}
                    {preview && !result && (
                      <div className="space-y-3">
                        <div className="relative rounded-2xl overflow-hidden border border-[var(--border)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview} alt="Prescription preview" className="w-full max-h-64 object-contain bg-[var(--surface-2)]" />
                          <button
                            onClick={() => { setPreview(null); setImageBase64(null); setError(''); }}
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <button
                          onClick={handleScan}
                          disabled={scanning}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                          {scanning ? (
                            <><Loader2 size={16} className="animate-spin" /> AI is scanning...</>
                          ) : (
                            <><Sparkles size={16} /> Scan with AI</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Results */}
                    {result && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        {result.doctorName && (
                          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1">
                            {result.doctorName && <p className="text-[var(--text-secondary)]">👨‍⚕️ Dr. {result.doctorName}</p>}
                            {result.date && <p className="text-[var(--text-tertiary)]">📅 {result.date}</p>}
                          </div>
                        )}

                        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                          {result.medicines.length} Medicine{result.medicines.length !== 1 ? 's' : ''} Found
                        </p>

                        {result.medicines.length === 0 && (
                          <div className="flex items-center gap-2 text-xs text-amber-400 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle size={14} />
                            No medicines detected. Try a clearer image.
                          </div>
                        )}

                        {result.medicines.map((med, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className={cn(
                              'p-3 rounded-xl border transition-all cursor-pointer',
                              selectedMeds.has(i)
                                ? 'border-teal-500/40 bg-teal-500/5'
                                : 'border-[var(--border)] bg-[var(--surface-2)] opacity-50',
                            )}
                            onClick={() => {
                              const next = new Set(selectedMeds);
                              if (next.has(i)) next.delete(i); else next.add(i);
                              setSelectedMeds(next);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <span className="text-base">💊</span>
                                <div>
                                  <p className="text-sm font-bold text-[var(--text-primary)]">{med.name} <span className="text-[var(--text-tertiary)] font-normal">{med.dosage}</span></p>
                                  <p className="text-xs text-[var(--text-secondary)]">{med.frequency.replace('-', ' ')} · {med.time}</p>
                                  {med.notes && <p className="text-[10px] text-[var(--text-tertiary)] italic mt-0.5">{med.notes}</p>}
                                </div>
                              </div>
                              <div className={cn(
                                'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                                selectedMeds.has(i) ? 'border-teal-500 bg-teal-500' : 'border-[var(--border)]',
                              )}>
                                {selectedMeds.has(i) && <CheckCircle2 size={12} className="text-white" />}
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {result.medicines.length > 0 && (
                          <button
                            onClick={handleCreateReminders}
                            disabled={creating || selectedMeds.size === 0}
                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                          >
                            {creating ? (
                              <><Loader2 size={16} className="animate-spin" /> Creating reminders...</>
                            ) : (
                              <><Plus size={16} /> Create {selectedMeds.size} Reminder{selectedMeds.size !== 1 ? 's' : ''}</>
                            )}
                          </button>
                        )}
                      </motion.div>
                    )}

                    {error && (
                      <div className="flex items-center gap-2 text-xs text-red-400 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <AlertCircle size={14} />
                        {error}
                      </div>
                    )}
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-8"
                  >
                    <div className="h-20 w-20 rounded-2xl bg-teal-500/15 flex items-center justify-center">
                      <CheckCircle2 size={36} className="text-teal-400" />
                    </div>
                    <p className="text-base font-bold text-[var(--text-primary)]">Reminders Created! 🎉</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Medicine reminders added to your schedule</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
