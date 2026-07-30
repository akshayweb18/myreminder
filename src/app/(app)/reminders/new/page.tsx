'use client';

// ============================================================
// RemindMe AI — Create Reminder Page (Rich Fields & Natural Language)
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Bell, Calendar, Clock, MapPin, Tag, Repeat, Sparkles,
  ArrowLeft, Check, Plus, Trash2, ShieldAlert, FileText, CheckSquare,
} from 'lucide-react';
import { useReminderStore } from '@/stores/reminderStore';
import { CATEGORIES, PRIORITIES, REPEAT_OPTIONS, EARLY_REMINDER_OPTIONS, COMMON_EMOJIS, REMINDER_EXAMPLES } from '@/constants';
import { Priority, RepeatType, ChecklistItem, Tag as TagType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { formatDateForInput, formatTimeForInput } from '@/lib/utils';

export default function NewReminderPage() {
  const router = useRouter();
  const { addReminder } = useReminderStore();

  // Smart natural language input state
  const [nlInput, setNlInput] = useState('');
  const [isProcessingNl, setIsProcessingNl] = useState(false);

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
  const [notes, setNotes] = useState('');
  
  // Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Tags
  const [tags, setTags] = useState<TagType[]>([]);
  const [newTagText, setNewTagText] = useState('');

  // Early notification
  const [earlyReminderValue, setEarlyReminderValue] = useState<number | null>(10);

  // Handle Natural Language Parse Mock
  const handleNaturalLanguageParse = () => {
    if (!nlInput.trim()) return;
    setIsProcessingNl(true);

    setTimeout(() => {
      const lower = nlInput.toLowerCase();

      // Check category keywords
      if (lower.includes('bill') || lower.includes('pay') || lower.includes('card')) {
        setCategoryId('bills');
        setEmoji('💳');
        setPriority('high');
      } else if (lower.includes('meeting') || lower.includes('standup') || lower.includes('work')) {
        setCategoryId('work');
        setEmoji('👥');
      } else if (lower.includes('medicine') || lower.includes('doctor') || lower.includes('pill')) {
        setCategoryId('health');
        setEmoji('💊');
        setPriority('urgent');
      } else if (lower.includes('gym') || lower.includes('workout') || lower.includes('exercise')) {
        setCategoryId('fitness');
        setEmoji('🏋️');
      } else if (lower.includes('birthday') || lower.includes('party')) {
        setCategoryId('birthday');
        setEmoji('🎂');
      }

      // Check repeat keywords
      if (lower.includes('every month') || lower.includes('monthly')) {
        setRepeatType('monthly');
      } else if (lower.includes('every day') || lower.includes('daily')) {
        setRepeatType('daily');
      } else if (lower.includes('every week') || lower.includes('weekly')) {
        setRepeatType('weekly');
      }

      setTitle(nlInput);
      setIsProcessingNl(false);
    }, 600);
  };

  // Add checklist item
  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      { id: Date.now().toString(), text: newChecklistText.trim(), completed: false },
    ]);
    setNewChecklistText('');
  };

  // Remove checklist item
  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  // Add Tag
  const addTag = () => {
    if (!newTagText.trim()) return;
    setTags([
      ...tags,
      { id: Date.now().toString(), name: newTagText.trim(), color: '#6366f1' },
    ]);
    setNewTagText('');
  };

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
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] truncate">Create Reminder</h1>
          <p className="text-xs text-[var(--text-tertiary)]">Set up smart notifications for anything</p>
        </div>
      </div>

      {/* Natural Language Smart Input Box */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-gradient-to-r from-[var(--accent)]/10 to-purple-500/10 border border-[var(--accent)]/20 space-y-2"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
          <Sparkles size={14} /> Smart AI Assistant
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder='Type anything... e.g. "Remind me to pay credit card bill every month on 20th"'
            value={nlInput}
            onChange={(e) => setNlInput(e.target.value)}
            containerClassName="flex-1"
            className="bg-[var(--surface-1)]"
          />
          <Button onClick={handleNaturalLanguageParse} loading={isProcessingNl} variant="gradient">
            Parse
          </Button>
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
            {/* Emoji Picker Selector */}
            <div className="relative group">
              <button
                type="button"
                className="h-11 w-11 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xl hover:bg-[var(--surface-3)] transition-colors"
              >
                {emoji}
              </button>
              {/* Emoji quick selector dropdown */}
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

          {/* Checklist */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
              <CheckSquare size={16} /> Checklist Tasks
            </label>
            <div className="space-y-2 mb-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs"
                >
                  <span>{item.text}</span>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    className="text-red-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add checklist step..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
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
