'use client';

// ============================================================
// RemindMe AI — ReminderCard Component
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, MoreHorizontal, Trash2,
  Archive, RotateCcw, MapPin, Repeat, Edit2,
} from 'lucide-react';
import { Reminder } from '@/types';
import { cn, formatReminderDate, isReminderOverdue } from '@/lib/utils';
import { getCategoryById, getPriorityConfig } from '@/constants';
import { useReminderStore } from '@/stores/reminderStore';
import { PriorityBadge } from './PriorityBadge';

interface ReminderCardProps {
  reminder: Reminder;
  onEdit?: (reminder: Reminder) => void;
  compact?: boolean;
  className?: string;
}

export function ReminderCard({ reminder, onEdit, compact = false, className }: ReminderCardProps) {
  const [showActions, setShowActions] = useState(false);
  const { completeReminder, trashReminder, archiveReminder, restoreReminder } = useReminderStore();

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'relative group',
        'bg-[var(--surface-1)] border border-[var(--border)]',
        'rounded-2xl overflow-hidden',
        'shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]',
        'transition-shadow duration-200',
        isCompleted && 'opacity-70',
        className,
      )}
    >
      {/* Priority left bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: statusColor }}
      />

      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
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
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <MoreHorizontal size={16} />
                </button>

                <AnimatePresence>
                  {showActions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -5 }}
                      className="absolute right-0 top-8 z-10 w-44 bg-[var(--surface-1)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-xl)] overflow-hidden"
                      onMouseLeave={() => setShowActions(false)}
                    >
                      {reminder.status === 'pending' && (
                        <>
                          <button
                            onClick={() => { completeReminder(reminder.id); setShowActions(false); }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <CheckCircle2 size={14} /> Mark Done
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => { onEdit(reminder); setShowActions(false); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => { archiveReminder(reminder.id); setShowActions(false); }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            <Archive size={14} /> Archive
                          </button>
                        </>
                      )}
                      {(reminder.status === 'completed' || reminder.status === 'archived') && (
                        <button
                          onClick={() => { restoreReminder(reminder.id); setShowActions(false); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                      )}
                      <button
                        onClick={() => { trashReminder(reminder.id); setShowActions(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
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
        {reminder.status === 'pending' && (
          <motion.button
            initial={{ opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => completeReminder(reminder.id)}
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
        {isCompleted && (
          <div className="absolute bottom-4 right-4">
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
