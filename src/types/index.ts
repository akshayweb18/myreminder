// ============================================================
// RemindMe — Core Type Definitions
// ============================================================

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ReminderStatus = 'pending' | 'completed' | 'missed' | 'snoozed' | 'archived' | 'trashed';

export type RepeatType =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'weekdays'
  | 'weekends'
  | 'custom';

export type CategoryId =
  | 'personal'
  | 'work'
  | 'health'
  | 'finance'
  | 'shopping'
  | 'travel'
  | 'education'
  | 'fitness'
  | 'family'
  | 'birthday'
  | 'subscription'
  | 'bills'
  | 'custom';

export interface Category {
  id: CategoryId | string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface RepeatRule {
  type: RepeatType;
  interval?: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0=Sun … 6=Sat
  dayOfMonth?: number;
  endDate?: string; // ISO date string
  maxOccurrences?: number;
}

export interface EarlyReminder {
  value: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
  label: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'voice';
  name: string;
  url: string;
  size?: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  categoryId: CategoryId | string;
  date: string; // ISO date string YYYY-MM-DD
  time?: string; // HH:MM
  priority: Priority;
  status: ReminderStatus;
  repeat?: RepeatRule;
  earlyReminders?: EarlyReminder[];
  color?: string; // hex accent color
  emoji?: string;
  location?: string;
  notes?: string;
  checklist?: ChecklistItem[];
  attachments?: Attachment[];
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deletedAt?: string;
  nextOccurrence?: string; // for recurring reminders
  snoozedUntil?: string;
  pinned?: boolean;
}

export interface ReminderFormValues {
  title: string;
  description?: string;
  categoryId: string;
  date: string;
  time?: string;
  priority: Priority;
  repeat?: RepeatRule;
  earlyReminders?: EarlyReminder[];
  color?: string;
  emoji?: string;
  location?: string;
  notes?: string;
  checklist?: ChecklistItem[];
  tags?: Tag[];
}

// ============================================================
// User & Auth
// ============================================================

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  devices?: string[];
}

// ============================================================
// Settings
// ============================================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'indigo' | 'purple' | 'blue' | 'rose' | 'amber' | 'emerald' | 'orange';

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  soundId: string;
  vibration: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  notifications: NotificationSettings;
  timezone: string;
  language: string;
  defaultPriority: Priority;
  defaultCategoryId: string;
  defaultEarlyReminder: EarlyReminder | null;
}

// ============================================================
// UI State
// ============================================================

export interface FilterState {
  priority?: Priority[];
  categoryIds?: string[];
  status?: ReminderStatus[];
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'priority' | 'dueDate';

export interface SearchState {
  query: string;
  results: Reminder[];
}
