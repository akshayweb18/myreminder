'use client';

// ============================================================
// RemindMe — ReminderCard Component
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, MoreHorizontal, Trash2,
  Archive, RotateCcw, MapPin, Repeat, Edit2,
  Pin, PinOff, Copy, AlarmClock,
} from 'lucide-react';
import { Reminder } from '@/types';
import { cn, formatReminderDate, isReminderOverdue } from '@/lib/utils';
import { getCategoryById, getPriorityConfig, SNOOZE_OPTIONS } from '@/constants';
import { useReminderStore } from '@/stores/reminderStore';
import { PriorityBadge } from './PriorityBadge';
import { addMinutes, format } from 'date-fns';

interface ReminderCardProps {
  reminder: Reminder;
  onEdit?: (reminder: Reminder) => void;
  compact?: boolean;
  className?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectToggle?: () => void;
}

export function ReminderCard({
  reminder,
  onEdit,
  compact = false,
  className,
  isSelectionMode = false,
  isSelected = false,
  onSelectToggle,
}: ReminderCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const { completeReminder, trashReminder, archiveReminder, restoreReminder, pinReminder, unpinReminder, duplicateReminder, snoozeReminder } = useReminderStore();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showActions && !showSnooze) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActions(false);
        setShowSnooze(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions, showSnooze]);

  const category = getCategoryById(reminder.categoryId);
  const priorityConfig = getPriorityConfig(reminder.priority);
  const overdue = isReminderOverdue(reminder);
  const isCompleted = reminder.status === 'completed';
  const isMissed = reminder.status === 'missed';

  const statusColor = isCompleted
    ? '#10b981'
    : isMissed || overdue
    ? '#ef4444'
    : priorityConfig.color;

  const checklistProgress =
    reminder.checklist && reminder.checklist.length > 0
      ? Math.round(
          (reminder.checklist.filter((i) => i.completed).length / reminder.checklist.length) * 100,
        )
      : null;

  const handleSnooze = (minutes: number) => {
    const until = format(addMinutes(new Date(), minutes), "yyyy-MM-dd'T'HH:mm");
    snoozeReminder(reminder.id, until);
    setShowSnooze(false);
    setShowActions(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={isSelectionMode ? onSelectToggle : undefined}
      className={cn(
        'relative group',
        showActions || showSnooze ? 'z-30' : 'z-10',
        'bg-[var(--surface-1)] border border-[var(--border)]',
        'rounded-2xl',
        'shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]',
        'transition-all duration-200',
        isSelectionMode && 'cursor-pointer border-[var(--accent)]/30',
        isSelected && 'ring-2 ring-[var(--accent)] border-transparent bg-[var(--accent)]/[0.03]',
        isCompleted && 'opacity-70',
        className,
      )}
    >
      {/* Priority left bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: statusColor }}
      />

      {/* Pinned indicator */}
      {reminder.pinned && (
        <div className="absolute top-2 right-2 z-10">
          <Pin size={11} className="text-[var(--accent)]" />
        </div>
      )}

      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {isSelectionMode && (
            <div className="flex items-center justify-center h-10 w-6 shrink-0" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelectToggle}
                className="h-4.5 w-4.5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer"
              />
            </div>
          )}
          {/* Category icon */}
          <div
            className="flex items-center justify-center h-10 w-10 rounded-xl text-lg shrink-0"
            style={{ background: category.bgColor }}
          >
            {reminder.emoji ?? category.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  'font-semibold text-sm leading-snug text-[var(--text-primary)]',
                  isCompleted && 'line-through text-[var(--text-tertiary)]',
                )}
              >
                {reminder.title}
              </h3>

              {/* Actions menu */}
              <div ref={menuRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                {!isSelectionMode && (
                  <button
                    onClick={() => { setShowActions(!showActions); setShowSnooze(false); }}
                    className="p-1 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                )}

                <AnimatePresence>
                  {showActions && !showSnooze && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -5 }}
                      className="absolute right-0 top-8 z-50 w-48 bg-[var(--surface-1)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-xl)] overflow-hidden"
                    >
                      {reminder.status === 'pending' && (
                        <>
                          <button
                            onClick={() => { completeReminder(reminder.id); setShowActions(false); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <CheckCircle2 size={14} /> Mark Done
                          </button>
                          <button
                            onClick={() => setShowSnooze(true)}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                          >
                            <AlarmClock size={14} /> Snooze
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => { onEdit(reminder); setShowActions(false); }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (reminder.pinned) {
                                unpinReminder(reminder.id);
                              } else {
                                pinReminder(reminder.id);
                              }
                              setShowActions(false);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            {reminder.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                            {reminder.pinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            onClick={() => { duplicateReminder(reminder.id); setShowActions(false); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            <Copy size={14} /> Duplicate
                          </button>
                          <button
                            onClick={() => { archiveReminder(reminder.id); setShowActions(false); }}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            <Archive size={14} /> Archive
                          </button>
                        </>
                      )}
                      {(reminder.status === 'completed' || reminder.status === 'archived' || reminder.status === 'missed') && (
                        <button
                          onClick={() => { restoreReminder(reminder.id); setShowActions(false); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                      )}
                      <button
                        onClick={() => { trashReminder(reminder.id); setShowActions(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </motion.div>
                  )}

                  {/* Snooze sub-menu */}
                  {showSnooze && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -5 }}
                      className="absolute right-0 top-8 z-50 w-44 bg-[var(--surface-1)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-xl)] overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-[var(--border)]">
                        <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                          <AlarmClock size={12} /> Snooze for...
                        </p>
                      </div>
                      {SNOOZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => handleSnooze(opt.value)}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowSnooze(false)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] border-t border-[var(--border)] transition-colors"
                      >
                        ← Back
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Description */}
            {!compact && reminder.description && (
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-1">
                {reminder.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <PriorityBadge priority={reminder.priority} />

              <span
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  overdue ? 'text-red-400' : 'text-[var(--text-tertiary)]',
                )}
              >
                <Clock size={11} />
                {formatReminderDate(reminder.date, reminder.time)}
              </span>

              {reminder.repeat && (
                <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                  <Repeat size={11} />
                  {reminder.repeat.type}
                </span>
              )}

              {reminder.location && (
                <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                  <MapPin size={11} />
                  {reminder.location}
                </span>
              )}

              {/* Tags */}
              {reminder.tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: tag.color + '20', color: tag.color }}
                >
                  #{tag.name}
                </span>
              ))}
            </div>

            {/* Checklist progress */}
            {checklistProgress !== null && !compact && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] mb-1">
                  <span>
                    {reminder.checklist!.filter((i) => i.completed).length}/
                    {reminder.checklist!.length} tasks
                  </span>
                  <span>{checklistProgress}%</span>
                </div>
                <div className="h-1 rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${checklistProgress}%`,
                      background: statusColor,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Complete button (shown on hover for pending reminders) */}
        {reminder.status === 'pending' && !isSelectionMode && (
          <motion.button
            initial={{ opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            onClick={(e) => { e.stopPropagation(); completeReminder(reminder.id); }}
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div
              className="h-7 w-7 rounded-full border-2 flex items-center justify-center transition-colors hover:border-emerald-400 hover:bg-emerald-400/10"
              style={{ borderColor: statusColor + '60' }}
            >
              <CheckCircle2 size={14} style={{ color: statusColor }} />
            </div>
          </motion.button>
        )}

        {/* Completed check */}
        {isCompleted && !isSelectionMode && (
          <div className="absolute bottom-4 right-4">
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
