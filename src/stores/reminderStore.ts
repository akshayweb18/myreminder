'use client';

// ============================================================
// RemindMe AI — Reminder Store (Zustand + localStorage)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Reminder,
  ReminderFormValues,
  FilterState,
  SortOption,
} from '@/types';
import { generateId, isReminderOverdue, isDueToday, isReminderUpcoming } from '@/lib/utils';
import { STORAGE_KEYS } from '@/constants';
import { format } from 'date-fns';
import { auth } from '@/lib/firebase';
import { saveReminder, deleteReminder } from '@/services/rtdbService';

// ============================================================
// Sample Data
// ============================================================

const today = format(new Date(), 'yyyy-MM-dd');
const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

const SAMPLE_REMINDERS: Reminder[] = [
  {
    id: 'sample-1',
    title: 'Pay Credit Card Bill',
    description: 'HDFC Credit Card due date',
    categoryId: 'bills',
    date: today,
    time: '18:00',
    priority: 'high',
    status: 'pending',
    emoji: '💳',
    tags: [{ id: 't1', name: 'finance', color: '#f59e0b' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    title: 'Team Standup Meeting',
    description: 'Daily standup with the dev team',
    categoryId: 'work',
    date: today,
    time: '10:00',
    priority: 'medium',
    status: 'completed',
    emoji: '👥',
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    title: 'Take Blood Pressure Medicine',
    categoryId: 'health',
    date: today,
    time: '08:00',
    priority: 'urgent',
    status: 'missed',
    emoji: '💊',
    repeat: { type: 'daily' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-4',
    title: 'Netflix Subscription Renewal',
    categoryId: 'subscription',
    date: tomorrow,
    priority: 'medium',
    status: 'pending',
    emoji: '🎬',
    earlyReminders: [{ value: 1, unit: 'days', label: '1 day before' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-5',
    title: "Mom's Birthday",
    description: "Don't forget to buy a gift!",
    categoryId: 'birthday',
    date: tomorrow,
    priority: 'high',
    status: 'pending',
    emoji: '🎂',
    repeat: { type: 'yearly' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-6',
    title: 'Gym Workout',
    categoryId: 'fitness',
    date: yesterday,
    time: '07:00',
    priority: 'medium',
    status: 'completed',
    emoji: '🏋️',
    repeat: { type: 'weekdays' },
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-7',
    title: 'Passport Renewal',
    description: 'Passport expiring in 3 months',
    categoryId: 'personal',
    date: format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd'),
    priority: 'high',
    status: 'pending',
    emoji: '🛂',
    earlyReminders: [{ value: 1, unit: 'weeks', label: '1 week before' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-8',
    title: 'Grocery Shopping',
    categoryId: 'shopping',
    date: format(new Date(Date.now() + 2 * 86400000), 'yyyy-MM-dd'),
    priority: 'low',
    status: 'pending',
    emoji: '🛒',
    checklist: [
      { id: 'c1', text: 'Milk', completed: false },
      { id: 'c2', text: 'Eggs', completed: false },
      { id: 'c3', text: 'Bread', completed: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================
// Store Interface
// ============================================================

interface ReminderStore {
  reminders: Reminder[];
  filter: FilterState;
  sort: SortOption;
  searchQuery: string;

  // CRUD
  addReminder: (values: ReminderFormValues) => Reminder;
  updateReminder: (id: string, values: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  completeReminder: (id: string) => void;
  snoozeReminder: (id: string, until: string) => void;
  restoreReminder: (id: string) => void;
  trashReminder: (id: string) => void;
  archiveReminder: (id: string) => void;
  permanentlyDelete: (id: string) => void;

  // Filters & Search
  setFilter: (filter: Partial<FilterState>) => void;
  clearFilter: () => void;
  setSort: (sort: SortOption) => void;
  setSearchQuery: (query: string) => void;

  // Computed selectors (called as functions)
  getTodayReminders: () => Reminder[];
  getUpcomingReminders: () => Reminder[];
  getOverdueReminders: () => Reminder[];
  getCompletedReminders: () => Reminder[];
  getMissedReminders: () => Reminder[];
  getTrashedReminders: () => Reminder[];
  getArchivedReminders: () => Reminder[];
  getReminderById: (id: string) => Reminder | undefined;
  clearAllReminders: () => void;
  setRemindersFromCloud: (reminders: Reminder[]) => void;
  resetStore: () => void;
}

// ============================================================
// Store Implementation
// ============================================================

export const useReminderStore = create<ReminderStore>()(
  persist(
    (set, get) => ({
      reminders: [],
      filter: {},
      sort: 'dueDate',
      searchQuery: '',

      addReminder: (values) => {
        const newReminder: Reminder = {
          ...values,
          id: generateId(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ reminders: [newReminder, ...state.reminders] }));

        const userId = auth.currentUser?.uid;
        if (userId) {
          saveReminder(userId, newReminder).catch((err) =>
            console.error('[ReminderStore] addReminder RTDB error:', err),
          );
        } else {
          console.warn('[ReminderStore] addReminder: no user logged in, saved locally only');
        }

        return newReminder;
      },

      updateReminder: (id, values) => {
        set((state) => {
          const updatedReminders = state.reminders.map((r) =>
            r.id === id ? { ...r, ...values, updatedAt: new Date().toISOString() } : r
          );
          const updatedReminder = updatedReminders.find((r) => r.id === id);
          const userId = auth.currentUser?.uid;
          if (userId && updatedReminder) {
            saveReminder(userId, updatedReminder).catch((err) =>
              console.error('[ReminderStore] updateReminder RTDB error:', err),
            );
          }
          return { reminders: updatedReminders };
        });
      },

      deleteReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        }));

        const userId = auth.currentUser?.uid;
        if (userId) {
          deleteReminder(userId, id).catch((err) =>
            console.error('[ReminderStore] deleteReminder RTDB error:', err),
          );
        }
      },

      completeReminder: (id) => {
        get().updateReminder(id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      },

      snoozeReminder: (id, until) => {
        get().updateReminder(id, {
          status: 'snoozed',
          snoozedUntil: until,
        });
      },

      restoreReminder: (id) => {
        get().updateReminder(id, {
          status: 'pending',
          deletedAt: undefined,
        });
      },

      trashReminder: (id) => {
        get().updateReminder(id, {
          status: 'trashed',
          deletedAt: new Date().toISOString(),
        });
      },

      archiveReminder: (id) => {
        get().updateReminder(id, { status: 'archived' });
      },

      permanentlyDelete: (id) => {
        get().deleteReminder(id);
      },

      setFilter: (filter) => {
        set((state) => ({ filter: { ...state.filter, ...filter } }));
      },

      clearFilter: () => set({ filter: {} }),

      setSort: (sort) => set({ sort }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      getTodayReminders: () =>
        get().reminders.filter(
          (r) => isDueToday(r) && r.status !== 'trashed',
        ),

      getUpcomingReminders: () =>
        get().reminders.filter(
          (r) => isReminderUpcoming(r) && !isDueToday(r) && r.status !== 'trashed',
        ),

      getOverdueReminders: () =>
        get().reminders.filter(
          (r) => isReminderOverdue(r) && r.status !== 'trashed',
        ),

      getCompletedReminders: () =>
        get().reminders.filter((r) => r.status === 'completed'),

      getMissedReminders: () =>
        get().reminders.filter((r) => r.status === 'missed'),

      getTrashedReminders: () =>
        get().reminders.filter((r) => r.status === 'trashed'),

      getArchivedReminders: () =>
        get().reminders.filter((r) => r.status === 'archived'),

      getReminderById: (id) =>
        get().reminders.find((r) => r.id === id),

      clearAllReminders: () => {
        const userId = auth.currentUser?.uid;
        if (userId) {
          get().reminders.forEach((r) => {
            deleteReminder(userId, r.id).catch((err) =>
              console.error('[ReminderStore] clearAll RTDB error:', err),
            );
          });
        }
        set({ reminders: [] });
      },

      setRemindersFromCloud: (cloudReminders) => {
        // Merge cloud data, preferring cloud version for existing IDs
        set((state) => {
          const localMap = new Map(state.reminders.map((r) => [r.id, r]));
          cloudReminders.forEach((r) => localMap.set(r.id, r));
          return { reminders: Array.from(localMap.values()) };
        });
      },

      resetStore: () => set({ reminders: [] }),
    }),
    {
      name: STORAGE_KEYS.REMINDERS,
      skipHydration: true,
    },
  ),
);
