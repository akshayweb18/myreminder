'use client';

// ============================================================
// RemindMe — Settings Store
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, ThemeMode, AccentColor } from '@/types';
import { STORAGE_KEYS } from '@/constants';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'indigo',
  notifications: {
    enabled: true,
    sound: true,
    soundId: 'default',
    vibration: true,
  },
  timezone: 'Asia/Kolkata',
  language: 'en',
  defaultPriority: 'medium',
  defaultCategoryId: 'personal',
  defaultEarlyReminder: { value: 10, unit: 'minutes', label: '10 minutes before' },
};

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleNotifications: () => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      setTheme: (theme) => {
        get().updateSettings({ theme });
      },

      setAccentColor: (accentColor) => {
        get().updateSettings({ accentColor });
      },

      toggleNotifications: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: {
              ...state.settings.notifications,
              enabled: !state.settings.notifications.enabled,
            },
          },
        }));
      },

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      skipHydration: true,
    },
  ),
);
