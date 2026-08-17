'use client';

// ============================================================
// RemindMe — Create Reminder Page (AI-Powered)
// Features: NL Parsing (NVIDIA NIM), Voice Input, AI Checklist
// ============================================================

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, MapPin, Sparkles,
  ArrowLeft, Check, Trash2, CheckSquare,
  Mic, MicOff, Wand2, Loader2, Volume2,
} from 'lucide-react';
import { useReminderStore } from '@/stores/reminderStore';
import { CATEGORIES, PRIORITIES, REPEAT_OPTIONS, COMMON_EMOJIS, REMINDER_EXAMPLES } from '@/constants';
import { Priority, RepeatType, ChecklistItem, Tag as TagType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { formatDateForInput, formatTimeForInput } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ============================================================
// ============================================================
// Voice recognition shim (avoids lib.dom conflicts)
// ============================================================
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

export default function NewReminderPage() {
  const router = useRouter();
  const { addReminder } = useReminderStore();

  // AI / NL input state
  const [nlInput, setNlInput] = useState('');
  const [isProcessingNl, setIsProcessingNl] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState(false);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // AI checklist
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('personal');
  const [date, setDate] = useState(formatDateForInput());
  const [time, setTime] = useState(formatTimeForInput());
  const [priority, setPriority] = useState<Priority>('medium');
  const [repeatType, setRepeatType] = useState<RepeatType>('once');
  const [emoji, setEmoji] = useState('🔔');
  const [location, setLocation] = useState('');
  const notes = '';

  // Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Tags
  const [tags, setTags] = useState<TagType[]>([]);
  const [newTagText, setNewTagText] = useState('');

  // Early notification
  const [earlyReminderValue] = useState<number | null>(10);

  // ============================================================
  // REAL AI: Natural Language → Reminder
  // ============================================================
  const handleNaturalLanguageParse = async () => {
    if (!nlInput.trim()) return;
    setIsProcessingNl(true);
    setAiError('');
    setAiSuccess(false);

    try {
      const res = await fetch('/api/ai/parse-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlInput }),
      });

      if (!res.ok) throw new Error('AI parse failed');

      const { data } = await res.json();

      // Fill form fields from AI response
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.date) setDate(data.date);
      if (data.time) setTime(data.time);
      if (data.priority) setPriority(data.priority as Priority);
      if (data.categoryId) setCategoryId(data.categoryId);
      if (data.emoji) setEmoji(data.emoji);
      if (data.checklist?.length > 0) setChecklist(data.checklist);

      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 3000);
    } catch {
      setAiError('AI parsing failed. Please try again or fill manually.');
    } finally {
      setIsProcessingNl(false);
    }
  };

  // ============================================================
  // VOICE INPUT — Web Speech API → AI Parse
  // ============================================================
  const startVoiceInput = () => {
    const w = window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setAiError('Voice input not supported in this browser.');
      return;
    }

    const recognition = new SR();
    recognition.lang = 'hi-IN'; // Hindi + English
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      setNlInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setAiError('Voice recognition failed. Please speak clearly or type instead.');
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setVoiceTranscript('');
    setAiError('');
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // ============================================================
  // AI CHECKLIST GENERATOR
  // ============================================================
  const handleGenerateChecklist = async () => {
    if (!title.trim()) {
      setAiError('Please enter a title first to generate a checklist.');
      return;
    }
    setIsGeneratingChecklist(true);
    setAiError('');

    try {
      const res = await fetch('/api/ai/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, categoryId }),
      });

      if (!res.ok) throw new Error();
      const { items } = await res.json();
      setChecklist(items);
    } catch {
      setAiError('Failed to generate checklist. Please try again.');
    } finally {
      setIsGeneratingChecklist(false);
    }
  };

  // ============================================================
  // Manual Checklist
  // ============================================================
  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      { id: Date.now().toString(), text: newChecklistText.trim(), completed: false },
    ]);
    setNewChecklistText('');
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addTag = () => {
    if (!newTagText.trim()) return;
    setTags([
      ...tags,
      { id: Date.now().toString(), name: newTagText.trim(), color: '#6366f1' },
    ]);
    setNewTagText('');
  };

  // ============================================================
  // Submit
  // ============================================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const earlyReminders = earlyReminderValue
      ? [{ value: earlyReminderValue, unit: 'minutes' as const, label: `${earlyReminderValue} mins before` }]
      : [];

    addReminder({
      title,
      description,
      categoryId,
      date,
      time,
      priority,
      repeat: { type: repeatType },
      emoji,
      location,
      notes,
      checklist,
      tags,
      earlyReminders,
    });

    router.push('/reminders');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={18} />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] truncate">
            Create Reminder
          </h1>
          <p className="text-xs text-[var(--text-tertiary)]">AI-powered — just describe it naturally</p>
        </div>
      </div>

      {/* AI Natural Language Input */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-[var(--accent)]/30"
        style={{
          background: 'linear-gradient(135deg, var(--accent)/8%, rgba(139,92,246,0.06) 100%)',
        }}
      >
        {/* Animated background orb */}
        <div
          className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{ background: 'var(--accent)' }}
        />

        <div className="relative p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent)' }}
              >
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">AI Assistant</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
                NVIDIA Llama 3.3
              </span>
            </div>
          </div>

          {/* Input Row */}
          <div className="flex items-center gap-2">
            <Input
              placeholder='Type or speak... e.g. "Kal subah 9 baje doctor appointment hai"'
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNaturalLanguageParse()}
              containerClassName="flex-1"
              className="bg-[var(--surface-1)] border-[var(--accent)]/20 focus:border-[var(--accent)]/50"
            />

            {/* Voice Button */}
            <button
              type="button"
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              className={cn(
                'h-10 w-10 rounded-xl border flex items-center justify-center transition-all shrink-0',
                isListening
                  ? 'bg-red-500 border-red-500 text-white animate-pulse'
                  : 'bg-[var(--surface-1)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
              )}
              title={isListening ? 'Stop recording' : 'Voice input'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* Parse Button */}
            <Button
              onClick={handleNaturalLanguageParse}
              loading={isProcessingNl}
              variant="gradient"
              disabled={!nlInput.trim() || isProcessingNl}
              className="shrink-0"
            >
              {isProcessingNl ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Wand2 size={14} />
              )}
              {isProcessingNl ? 'Parsing...' : 'Parse'}
            </Button>
          </div>

          {/* Voice status */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-xs text-red-500 font-medium"
              >
                <Volume2 size={13} className="animate-pulse" />
                Listening... speak your reminder in Hindi or English
              </motion.div>
            )}
            {voiceTranscript && !isListening && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-[var(--text-secondary)] italic"
              >
                🎤 Heard: &ldquo;{voiceTranscript}&rdquo;
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Success / Error */}
          <AnimatePresence>
            {aiSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-xs text-emerald-500 font-medium"
              >
                <Check size={13} />
                AI filled the form! Review and adjust as needed.
              </motion.div>
            )}
            {aiError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400"
              >
                ⚠️ {aiError}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Quick Preset Examples */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
          Quick Templates
        </p>
        <div className="flex flex-wrap gap-2">
          {REMINDER_EXAMPLES.slice(0, 6).map((ex) => (
            <button
              key={ex.title}
              type="button"
              onClick={() => {
                setTitle(ex.title);
                setCategoryId(ex.category);
                setEmoji(ex.emoji);
                setPriority(ex.priority);
              }}
              className="px-3 py-1.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
            >
              <span>{ex.emoji}</span>
              <span>{ex.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-5">
          {/* Emoji & Title */}
          <div className="flex items-start gap-3">
            <div className="relative group">
              <button
                type="button"
                className="h-11 w-11 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xl hover:bg-[var(--surface-3)] transition-colors"
              >
                {emoji}
              </button>
              <div className="absolute left-0 top-12 z-20 hidden group-hover:grid grid-cols-6 gap-1 p-2 bg-[var(--surface-1)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-xl)] w-48">
                {COMMON_EMOJIS.slice(0, 18).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className="p-1 rounded hover:bg-[var(--bg-hover)] text-center text-base"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Title *"
              placeholder="What do you need to remember?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              containerClassName="flex-1"
              required
            />
          </div>

          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Add details, notes, or extra info..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                    categoryId === cat.id
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date, Time & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              leftIcon={<Calendar size={16} />}
            />
            <Input
              type="time"
              label="Time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              leftIcon={<Clock size={16} />}
            />
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-1.5 block">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`py-2 text-[10px] font-bold rounded-lg border text-center transition-all ${
                      priority === p.value
                        ? 'border-current shadow-sm'
                        : 'border-[var(--border)] bg-[var(--surface-2)] opacity-60'
                    }`}
                    style={{
                      color: p.color,
                      borderColor: priority === p.value ? p.color : undefined,
                      background: priority === p.value ? p.bgColor : undefined,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Repeat */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
              Repeat Schedule
            </label>
            <div className="flex flex-wrap gap-2">
              {REPEAT_OPTIONS.map((rep) => (
                <button
                  key={rep.value}
                  type="button"
                  onClick={() => setRepeatType(rep.value as RepeatType)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    repeatType === rep.value
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]'
                  }`}
                >
                  <span>{rep.icon}</span>
                  <span>{rep.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <Input
            label="Location (Optional)"
            placeholder="e.g. Office, Home, Coffee Shop"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            leftIcon={<MapPin size={16} />}
          />

          {/* AI Checklist Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                <CheckSquare size={16} /> Checklist Tasks
              </label>

              {/* AI Generate Checklist Button */}
              <button
                type="button"
                onClick={handleGenerateChecklist}
                disabled={isGeneratingChecklist || !title.trim()}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                  isGeneratingChecklist
                    ? 'border-[var(--accent)]/30 text-[var(--accent)]/60 cursor-wait'
                    : title.trim()
                      ? 'border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50',
                )}
              >
                {isGeneratingChecklist ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                {isGeneratingChecklist ? 'Generating...' : 'AI Generate'}
              </button>
            </div>

            <AnimatePresence>
              {checklist.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2 mb-2"
                >
                  {checklist.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-[var(--border)] flex-shrink-0" />
                        <span className="text-[var(--text-primary)]">{item.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(item.id)}
                        className="text-[var(--text-tertiary)] hover:text-red-400 transition-colors ml-2"
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Add checklist step..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                containerClassName="flex-1"
                className="h-9 text-xs"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addChecklistItem}>
                Add
              </Button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="gradient" size="lg" className="w-full sm:w-auto">
              <Check size={18} /> Create Reminder
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
