'use client';

// ============================================================
// RemindMe — Voice Assistant Component
// Floating mic button with animated waveform, Hinglish STT,
// AI parsing, and action confirmation dialog.
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, CheckCircle2, XCircle, Loader2, X, Zap } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeech';
import { useReminderStore } from '@/stores/reminderStore';
import { useBpStore } from '@/stores/bpStore';
import { cn } from '@/lib/utils';

type VoiceMode = 'reminder' | 'bp';

interface ParsedReminder {
  title: string;
  date: string;
  time?: string;
  priority: string;
  categoryId: string;
  emoji?: string;
  description?: string;
}

interface ParsedBp {
  systolic: number;
  diastolic: number;
  pulse: number;
  notes?: string;
}

export function VoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<VoiceMode>('reminder');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedReminder | ParsedBp | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { listening, transcript, supported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { addReminder } = useReminderStore();
  const { addReading } = useBpStore();

  // Auto-parse when listening stops and transcript is available
  useEffect(() => {
    if (!listening && transcript && !parsed && !loading) {
      handleParse();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  const handleParse = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/voice-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript, mode }),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setParsed(data);
    } catch {
      setError('Could not parse voice input. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setLoading(true);
    try {
      if (mode === 'reminder') {
        const r = parsed as ParsedReminder;
        addReminder({
          title: r.title,
          description: r.description,
          date: r.date,
          time: r.time,
          priority: r.priority as 'low' | 'medium' | 'high' | 'urgent',
          categoryId: r.categoryId,
          emoji: r.emoji,
          checklist: [],
        });
      } else {
        const bp = parsed as ParsedBp;
        await addReading(bp.systolic, bp.diastolic, bp.pulse, bp.notes);
      }
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setParsed(null);
    setSuccess(false);
    setError('');
    resetTranscript();
    if (listening) stopListening();
  };

  const handleMicClick = () => {
    if (listening) {
      stopListening();
    } else {
      setParsed(null);
      setError('');
      resetTranscript();
      startListening('en-IN');
    }
  };

  if (!supported) return null;

  const isReminder = mode === 'reminder';
  const parsedReminder = isReminder ? parsed as ParsedReminder : null;
  const parsedBp = !isReminder ? parsed as ParsedBp : null;

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        id="voice-assistant-btn"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className={cn(
          'fixed bottom-24 right-4 z-40 md:bottom-6 md:right-6',
          'h-14 w-14 rounded-2xl',
          'bg-gradient-to-br from-violet-600 to-purple-700',
          'flex items-center justify-center',
          'shadow-xl shadow-violet-500/30',
          'border border-violet-400/20',
        )}
        aria-label="Voice Assistant"
        title="Voice Assistant (Hinglish)"
      >
        <Mic size={22} className="text-white" />
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[var(--bg-base)] animate-pulse" />
      </motion.button>

      {/* Dialog */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-x-4 bottom-4 z-50 sm:inset-auto sm:bottom-8 sm:right-8 sm:w-[400px] rounded-3xl overflow-hidden"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                    <Zap size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">AI Voice Assistant</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">Powered by NVIDIA NIM</p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]">
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Mode Toggle */}
                {!parsed && !success && (
                  <div className="flex gap-2">
                    {(['reminder', 'bp'] as VoiceMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-xs font-semibold transition-all',
                          mode === m
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                            : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                        )}
                      >
                        {m === 'reminder' ? '📅 Reminder' : '🩺 BP Reading'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Mic Button + Waveform */}
                {!parsed && !success && (
                  <div className="flex flex-col items-center gap-4 py-2">
                    <motion.button
                      onClick={handleMicClick}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        'relative h-20 w-20 rounded-full flex items-center justify-center transition-all',
                        listening
                          ? 'bg-red-500 shadow-xl shadow-red-500/40'
                          : 'bg-violet-600 shadow-xl shadow-violet-500/40',
                      )}
                    >
                      {listening && (
                        <>
                          <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-red-400"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.7, 1], opacity: [0.2, 0, 0.2] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                            className="absolute inset-0 rounded-full bg-red-300"
                          />
                        </>
                      )}
                      {listening ? (
                        <MicOff size={28} className="text-white relative z-10" />
                      ) : (
                        <Mic size={28} className="text-white relative z-10" />
                      )}
                    </motion.button>

                    <div className="text-center">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {listening ? '🔴 Listening...' : 'Tap mic to speak'}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {mode === 'reminder'
                          ? '"Kal subah 9 baje doctor appointment hai"'
                          : '"Mera BP 130/85 tha pulse 72"'}
                      </p>
                    </div>

                    {transcript && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]"
                      >
                        <p className="text-xs text-[var(--text-tertiary)] mb-1">Heard:</p>
                        <p className="text-sm text-[var(--text-primary)] italic">&quot;{transcript}&quot;</p>
                      </motion.div>
                    )}

                    {loading && (
                      <div className="flex items-center gap-2 text-xs text-violet-400">
                        <Loader2 size={14} className="animate-spin" />
                        AI is processing your voice...
                      </div>
                    )}

                    {error && (
                      <div className="flex items-center gap-2 text-xs text-red-400 w-full">
                        <XCircle size={14} />
                        {error}
                      </div>
                    )}

                    {transcript && !loading && !parsed && (
                      <button
                        onClick={handleParse}
                        className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-violet-700 transition-colors"
                      >
                        <Sparkles size={14} />
                        Parse with AI
                      </button>
                    )}
                  </div>
                )}

                {/* Parsed Reminder Preview */}
                {parsedReminder && !success && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">AI Extracted Reminder</p>
                    <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-violet-500/20 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{parsedReminder.emoji || '📅'}</span>
                        <p className="font-bold text-[var(--text-primary)]">{parsedReminder.title}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
                        <div><span className="text-[var(--text-tertiary)]">Date:</span> {parsedReminder.date}</div>
                        <div><span className="text-[var(--text-tertiary)]">Time:</span> {parsedReminder.time || 'All day'}</div>
                        <div><span className="text-[var(--text-tertiary)]">Priority:</span> {parsedReminder.priority}</div>
                        <div><span className="text-[var(--text-tertiary)]">Category:</span> {parsedReminder.categoryId}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setParsed(null); resetTranscript(); }}
                        className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        Retry
                      </button>
                      <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-violet-700 transition-colors disabled:opacity-60"
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Create Reminder
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Parsed BP Preview */}
                {parsedBp && !success && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">AI Extracted BP Reading</p>
                    <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-violet-500/20 space-y-2">
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-[var(--text-primary)]">{parsedBp.systolic}<span className="text-lg text-[var(--text-tertiary)]">/{parsedBp.diastolic}</span></p>
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">mmHg</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-pink-400">{parsedBp.pulse}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">bpm</p>
                        </div>
                      </div>
                      {parsedBp.notes && <p className="text-xs text-[var(--text-tertiary)] text-center italic">{parsedBp.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setParsed(null); resetTranscript(); }}
                        className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        Retry
                      </button>
                      <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-violet-700 transition-colors disabled:opacity-60"
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Log BP
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Success */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-4"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-emerald-400" />
                    </div>
                    <p className="text-base font-bold text-[var(--text-primary)]">
                      {mode === 'reminder' ? 'Reminder Created! 🎉' : 'BP Logged! ❤️'}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">Voice input successfully processed</p>
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
