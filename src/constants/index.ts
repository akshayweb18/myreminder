// ============================================================
// RemindMe — App Constants
// ============================================================

import { Category, Priority, EarlyReminder, AccentColor } from '@/types';

// ============================================================
// Categories
// ============================================================

export const CATEGORIES: Category[] = [
  { id: 'personal', name: 'Personal', icon: '👤', color: '#6366f1', bgColor: '#6366f120' },
  { id: 'work', name: 'Work', icon: '💼', color: '#3b82f6', bgColor: '#3b82f620' },
  { id: 'health', name: 'Health', icon: '❤️', color: '#ef4444', bgColor: '#ef444420' },
  { id: 'finance', name: 'Finance', icon: '💰', color: '#f59e0b', bgColor: '#f59e0b20' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#8b5cf6', bgColor: '#8b5cf620' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#06b6d4', bgColor: '#06b6d420' },
  { id: 'education', name: 'Education', icon: '📚', color: '#10b981', bgColor: '#10b98120' },
  { id: 'fitness', name: 'Fitness', icon: '🏋️', color: '#f97316', bgColor: '#f9731620' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧', color: '#ec4899', bgColor: '#ec489920' },
  { id: 'birthday', name: 'Birthday', icon: '🎂', color: '#a855f7', bgColor: '#a855f720' },
  { id: 'subscription', name: 'Subscription', icon: '📱', color: '#14b8a6', bgColor: '#14b8a620' },
  { id: 'bills', name: 'Bills', icon: '📄', color: '#64748b', bgColor: '#64748b20' },
  { id: 'doctor', name: 'Doctor', icon: '🩺', color: '#0ea5e9', bgColor: '#0ea5e920' },
  { id: 'movie', name: 'Movie', icon: '🎬', color: '#e11d48', bgColor: '#e11d4820' },
  { id: 'custom', name: 'Custom', icon: '⭐', color: '#6366f1', bgColor: '#6366f120' },
];

export const getCategoryById = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

// ============================================================
// Priority
// ============================================================

export const PRIORITIES: { value: Priority; label: string; color: string; bgColor: string; icon: string }[] = [
  { value: 'low', label: 'Low', color: '#10b981', bgColor: '#10b98115', icon: '🟢' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', bgColor: '#f59e0b15', icon: '🟡' },
  { value: 'high', label: 'High', color: '#f97316', bgColor: '#f9731615', icon: '🟠' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444', bgColor: '#ef444415', icon: '🔴' },
];

export const getPriorityConfig = (priority: Priority) =>
  PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[0];

// ============================================================
// Early Reminder Options
// ============================================================

export const EARLY_REMINDER_OPTIONS: EarlyReminder[] = [
  { value: 5, unit: 'minutes', label: '5 minutes before' },
  { value: 10, unit: 'minutes', label: '10 minutes before' },
  { value: 30, unit: 'minutes', label: '30 minutes before' },
  { value: 1, unit: 'hours', label: '1 hour before' },
  { value: 1, unit: 'days', label: '1 day before' },
  { value: 1, unit: 'weeks', label: '1 week before' },
];

// ============================================================
// Repeat Options
// ============================================================

export const REPEAT_OPTIONS = [
  { value: 'once', label: 'Once', icon: '1️⃣' },
  { value: 'daily', label: 'Daily', icon: '📅' },
  { value: 'weekly', label: 'Weekly', icon: '📆' },
  { value: 'monthly', label: 'Monthly', icon: '🗓️' },
  { value: 'yearly', label: 'Yearly', icon: '🔄' },
  { value: 'weekdays', label: 'Weekdays', icon: '🏢' },
  { value: 'weekends', label: 'Weekends', icon: '🏖️' },
  { value: 'custom', label: 'Custom', icon: '⚙️' },
];

// ============================================================
// Snooze Options
// ============================================================

export const SNOOZE_OPTIONS = [
  { value: 5, unit: 'minutes', label: '5 Min' },
  { value: 10, unit: 'minutes', label: '10 Min' },
  { value: 30, unit: 'minutes', label: '30 Min' },
  { value: 60, unit: 'minutes', label: '1 Hour' },
  { value: 1440, unit: 'minutes', label: 'Tomorrow' },
];

// ============================================================
// Accent Colors
// ============================================================

export const ACCENT_COLORS: { id: AccentColor; label: string; value: string; dark: string }[] = [
  { id: 'indigo', label: 'Indigo', value: '#6366f1', dark: '#818cf8' },
  { id: 'purple', label: 'Purple', value: '#a855f7', dark: '#c084fc' },
  { id: 'blue', label: 'Blue', value: '#3b82f6', dark: '#60a5fa' },
  { id: 'rose', label: 'Rose', value: '#f43f5e', dark: '#fb7185' },
  { id: 'amber', label: 'Amber', value: '#f59e0b', dark: '#fbbf24' },
  { id: 'emerald', label: 'Emerald', value: '#10b981', dark: '#34d399' },
  { id: 'orange', label: 'Orange', value: '#f97316', dark: '#fb923c' },
];

// ============================================================
// Quick Examples for Reminder creation
// ============================================================

export const REMINDER_EXAMPLES = [
  { title: 'Pay Credit Card Bill', category: 'bills', emoji: '💳', priority: 'high' as Priority },
  { title: 'Electricity Bill', category: 'bills', emoji: '⚡', priority: 'high' as Priority },
  { title: 'Team Meeting', category: 'work', emoji: '👥', priority: 'medium' as Priority },
  { title: 'Take Medicine', category: 'health', emoji: '💊', priority: 'urgent' as Priority },
  { title: 'Birthday Reminder', category: 'birthday', emoji: '🎂', priority: 'medium' as Priority },
  { title: 'Exam Preparation', category: 'education', emoji: '📝', priority: 'high' as Priority },
  { title: 'Gym Workout', category: 'fitness', emoji: '🏋️', priority: 'medium' as Priority },
  { title: 'Grocery Shopping', category: 'shopping', emoji: '🛒', priority: 'low' as Priority },
  { title: 'Netflix Renewal', category: 'subscription', emoji: '🎬', priority: 'medium' as Priority },
  { title: 'Passport Renewal', category: 'personal', emoji: '🛂', priority: 'high' as Priority },
  { title: 'Flight Booking', category: 'travel', emoji: '✈️', priority: 'high' as Priority },
  { title: 'Insurance Payment', category: 'finance', emoji: '🏦', priority: 'high' as Priority },
  { title: 'Doctor Appointment', category: 'doctor', emoji: '🩺', priority: 'high' as Priority },
  { title: 'Watch New Movie', category: 'movie', emoji: '🍿', priority: 'low' as Priority },
];

// ============================================================
// Color Presets for Reminders
// ============================================================

export const REMINDER_COLORS = [
  '#6366f1', '#a855f7', '#3b82f6', '#06b6d4',
  '#10b981', '#f59e0b', '#f97316', '#ef4444',
  '#ec4899', '#8b5cf6', '#14b8a6', '#64748b',
];

// ============================================================
// Common Emojis
// ============================================================

export const COMMON_EMOJIS = [
  '📅', '⏰', '🔔', '✅', '❗', '💡', '🎯', '🏆',
  '💰', '💳', '📄', '📱', '💊', '🏋️', '✈️', '🎂',
  '👤', '💼', '❤️', '🛍️', '📚', '👨‍👩‍👧', '⭐', '🎬',
  '🏦', '🛂', '⚡', '🛒', '📝', '👥', '🔑', '📦',
];

// ============================================================
// Navigation Items
// ============================================================

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/reminders', label: 'Reminders', icon: 'Bell' },
  { href: '/calendar', label: 'Calendar', icon: 'Calendar' },
  { href: '/history', label: 'History', icon: 'History' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
];

// ============================================================
// Storage Keys
// ============================================================

export const STORAGE_KEYS = {
  REMINDERS: 'remindme_reminders',
  SETTINGS: 'remindme_settings',
  USER: 'remindme_user',
  THEME: 'remindme_theme',
} as const;

// ============================================================
// App Info
// ============================================================

export const APP_INFO = {
  name: 'RemindMe',
  tagline: 'Remember Everything. Forget Nothing.',
  version: '1.0.0',
  description: 'A world-class reminder application with premium UX.',
} as const;
