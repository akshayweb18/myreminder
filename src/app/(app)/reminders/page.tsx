'use client';

// ============================================================
// RemindMe AI — All Reminders Page (With Search, Filter & Sort)
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowUpDown, Plus, SlidersHorizontal, Check, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useReminderStore } from '@/stores/reminderStore';
import { ReminderCard } from '@/components/shared/ReminderCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CATEGORIES, PRIORITIES } from '@/constants';
import { Priority, SortOption, ReminderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/Dialog';

export default function RemindersPage() {
  const router = useRouter();
  const { reminders, sort, setSort, filter, setFilter, clearFilter, clearAllReminders, trashReminder } = useReminderStore();
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter & Search Logic
  const filtered = reminders.filter((r) => {
    if (r.status === 'trashed' || r.status === 'archived') return false;

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q);
      const matchCat = r.categoryId.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    // Status tab filter
    if (activeTab === 'pending' && r.status !== 'pending') return false;
    if (activeTab === 'completed' && r.status !== 'completed') return false;

    // Category filter
    if (selectedCategory && r.categoryId !== selectedCategory) return false;

    // Priority filter
    if (selectedPriority && r.priority !== selectedPriority) return false;

    return true;
  });

  // Sort Logic
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'dueDate') {
      const timeA = a.time ? `${a.date}T${a.time}` : a.date;
      const timeB = b.time ? `${b.date}T${b.time}` : b.date;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    }
    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sort === 'alphabetical') {
      return a.title.localeCompare(b.title);
    }
    if (sort === 'priority') {
      const pMap: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    }
    return 0;
  });

  const activeFilterCount =
    (selectedCategory ? 1 : 0) + (selectedPriority ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)]">Reminders</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Manage, filter, and organize all your reminders
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {reminders.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => setShowDeleteAllConfirm(true)}
              className="flex-1 sm:flex-initial text-red-500 hover:text-white hover:bg-red-500 border border-red-500/20 transition-all gap-1.5"
            >
              <Trash2 size={16} /> Delete All
            </Button>
          )}
          <Button onClick={() => router.push('/reminders/new')} className="flex-1 sm:flex-initial">
            <Plus size={16} /> New Reminder
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Input
              placeholder="Search reminders by title, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
              className="h-10"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              variant={showFilters ? 'default' : 'secondary'}
              size="md"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 sm:flex-initial"
            >
              <SlidersHorizontal size={14} /> Filter
              {activeFilterCount > 0 && (
                <span className="h-4 w-4 rounded-full bg-white text-[var(--accent)] text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Button
              variant={isSelectionMode ? 'default' : 'secondary'}
              size="md"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedIds([]);
              }}
              className="flex-1 sm:flex-initial"
            >
              <Check size={14} /> {isSelectionMode ? 'Exit Select' : 'Select'}
            </Button>

            {/* Sort Selector */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="flex-1 sm:flex-none h-10 px-2 text-xs bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl outline-none cursor-pointer min-w-0"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="alphabetical">A–Z</option>
            </select>
          </div>
        </div>

        {/* Filter Drawer / Expandable Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-4 space-y-4 shadow-[var(--shadow-md)]"
            >
              {/* Category Pills */}
              <div>
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                  Category
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full border transition-colors',
                      selectedCategory === null
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                    )}
                  >
                    All Categories
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                      className={cn(
                        'px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1.5',
                        selectedCategory === cat.id
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Pills */}
              <div>
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                  Priority
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedPriority(null)}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full border transition-colors',
                      selectedPriority === null
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                    )}
                  >
                    All Priorities
                  </button>
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setSelectedPriority(selectedPriority === p.value ? null : p.value)}
                      className={cn(
                        'px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1.5',
                        selectedPriority === p.value
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                      )}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex justify-end pt-2 border-t border-[var(--border)]">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedPriority(null);
                      setSearchQuery('');
                    }}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 border-b border-[var(--border)] pb-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Reminders' },
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selection Mode Bar */}
      {isSelectionMode && sorted.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-sm text-[var(--text-primary)]">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.length === sorted.length && sorted.length > 0}
              onChange={() => {
                if (selectedIds.length === sorted.length) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(sorted.map((r) => r.id));
                }
              }}
              className="h-4.5 w-4.5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer"
            />
            <span className="font-semibold text-xs sm:text-sm">{selectedIds.length} Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedIds([]);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={selectedIds.length === 0}
              onClick={() => {
                selectedIds.forEach((id) => trashReminder(id));
                setSelectedIds([]);
                setIsSelectionMode(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-medium gap-1.5"
            >
              <Trash2 size={14} /> Delete Selected ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Reminders List */}
      {sorted.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No reminders found"
          description="Try adjusting your filters or search terms, or create a brand new reminder."
          action={{
            label: 'Create Reminder',
            onClick: () => router.push('/reminders/new'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {sorted.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={(r) => router.push(`/reminders/${r.id}`)}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.includes(reminder.id)}
                onSelectToggle={() => {
                  setSelectedIds((prev) =>
                    prev.includes(reminder.id)
                      ? prev.filter((id) => id !== reminder.id)
                      : [...prev, reminder.id]
                  );
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      {/* Confirmation Dialog */}
      <Dialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <DialogContent
          title="Delete All Reminders?"
          description="Are you sure you want to delete all reminders? This will clear all pending, completed, and archived reminders permanently. This action cannot be undone."
        >
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeleteAllConfirm(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                clearAllReminders();
                setShowDeleteAllConfirm(false);
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg hover:shadow-red-900/10"
            >
              Delete All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
