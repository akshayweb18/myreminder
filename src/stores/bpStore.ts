import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@/lib/firebase';
import {
  saveBpReading,
  deleteBpReading,
  saveBpMedicine,
  deleteBpMedicine,
} from '@/services/rtdbService';

// ============================================================
// Types
// ============================================================

export type BpTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface BpReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  notes?: string;
  category: 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';
  categoryLabel: string;
  categoryColor: string;
  timeOfDay: BpTimeOfDay;
  medicinesTaken: string[]; // medicine IDs
}

export interface BpMedicine {
  id: string;
  name: string;
  dosage: string;
  frequency: 'once-daily' | 'twice-daily' | 'as-needed';
  color: string;
  startDate: string;
  active: boolean;
}

export interface BpGoal {
  systolic: number;
  diastolic: number;
}

export interface BpReminderSettings {
  enabled: boolean;
  morningTime: string; // HH:mm
  eveningTime: string; // HH:mm
}

// ============================================================
// Store Interface
// ============================================================

interface BpStore {
  readings: BpReading[];
  medicines: BpMedicine[];
  goal: BpGoal | null;
  reminderSettings: BpReminderSettings;

  addReading: (
    systolic: number,
    diastolic: number,
    pulse: number,
    notes?: string,
    medicinesTaken?: string[],
  ) => Promise<string | null>; // returns error message or null
  deleteReading: (id: string) => void;
  clearAll: () => void;

  addMedicine: (name: string, dosage: string, frequency: BpMedicine['frequency'], color: string) => void;
  deleteMedicine: (id: string) => void;
  toggleMedicineActive: (id: string) => void;

  setGoal: (goal: BpGoal | null) => void;
  setReminderSettings: (settings: Partial<BpReminderSettings>) => void;
  getStreak: () => number;
  setReadingsFromCloud: (readings: BpReading[]) => void;
  setMedicinesFromCloud: (medicines: BpMedicine[]) => void;
  resetStore: () => void;
}

// ============================================================
// Helpers
// ============================================================

export function getBpCategory(sys: number, dia: number): {
  category: BpReading['category'];
  label: string;
  color: string;
} {
  if (sys > 180 || dia > 120) {
    return { category: 'crisis', label: 'Hypertensive Crisis', color: '#dc2626' };
  }
  if (sys >= 140 || dia >= 90) {
    return { category: 'stage2', label: 'Hypertension Stage 2', color: '#ef4444' };
  }
  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
    return { category: 'stage1', label: 'Hypertension Stage 1', color: '#f97316' };
  }
  if (sys >= 120 && sys <= 129 && dia < 80) {
    return { category: 'elevated', label: 'Elevated BP', color: '#eab308' };
  }
  return { category: 'normal', label: 'Normal BP', color: '#10b981' };
}

export function getTimeOfDay(time: string): BpTimeOfDay {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// ============================================================
// Store
// ============================================================

export const useBpStore = create<BpStore>()(
  persist(
    (set, get) => ({
      readings: [],
      medicines: [],
      goal: null,
      reminderSettings: {
        enabled: false,
        morningTime: '08:00',
        eveningTime: '18:00',
      },

      addReading: async (systolic, diastolic, pulse, notes, medicinesTaken = []) => {
        const { category, label, color } = getBpCategory(systolic, diastolic);
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0, 5);

        const newReading: BpReading = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          systolic,
          diastolic,
          pulse,
          date,
          time,
          notes,
          category,
          categoryLabel: label,
          categoryColor: color,
          timeOfDay: getTimeOfDay(time),
          medicinesTaken,
        };

        // Save locally first so UI updates immediately
        set((state) => ({ readings: [newReading, ...state.readings] }));

        const userId = auth.currentUser?.uid;
        if (!userId) {
          const errMsg = 'Not signed in — BP reading saved locally only. Sign in to sync to cloud.';
          console.warn('[BpStore] addReading:', errMsg);
          return errMsg;
        }

        // Persist to Realtime Database
        const err = await saveBpReading(userId, newReading);
        if (err) {
          console.error('[BpStore] RTDB saveBpReading failed:', err);
          return `Cloud sync failed: ${err}`;
        }
        return null;
      },

      deleteReading: (id) => {
        set((state) => ({ readings: state.readings.filter((r) => r.id !== id) }));
        const userId = auth.currentUser?.uid;
        if (userId) {
          deleteBpReading(userId, id).catch((err) =>
            console.error('[BpStore] deleteBpReading error:', err),
          );
        }
      },

      clearAll: () => {
        const userId = auth.currentUser?.uid;
        if (userId) {
          get().readings.forEach((r) => {
            deleteBpReading(userId, r.id).catch((err) =>
              console.error('[BpStore] clearAll deleteBpReading error:', err),
            );
          });
        }
        set({ readings: [] });
      },

      addMedicine: (name, dosage, frequency, color) => {
        const now = new Date();
        const med: BpMedicine = {
          id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          dosage,
          frequency,
          color,
          startDate: now.toISOString().split('T')[0],
          active: true,
        };
        set((state) => ({ medicines: [med, ...state.medicines] }));

        const userId = auth.currentUser?.uid;
        if (userId) {
          saveBpMedicine(userId, med).catch((err) =>
            console.error('[BpStore] addMedicine error:', err),
          );
        }
      },

      deleteMedicine: (id) => {
        set((state) => ({ medicines: state.medicines.filter((m) => m.id !== id) }));
        const userId = auth.currentUser?.uid;
        if (userId) {
          deleteBpMedicine(userId, id).catch((err) =>
            console.error('[BpStore] deleteMedicine error:', err),
          );
        }
      },

      toggleMedicineActive: (id) => {
        set((state) => {
          const updatedMeds = state.medicines.map((m) =>
            m.id === id ? { ...m, active: !m.active } : m
          );
          const updatedMed = updatedMeds.find((m) => m.id === id);
          const userId = auth.currentUser?.uid;
          if (userId && updatedMed) {
            saveBpMedicine(userId, updatedMed).catch((err) =>
              console.error('[BpStore] toggleMedicineActive error:', err),
            );
          }
          return { medicines: updatedMeds };
        });
      },

      setGoal: (goal) => set({ goal }),

      setReminderSettings: (settings) =>
        set((state) => ({
          reminderSettings: { ...state.reminderSettings, ...settings },
        })),

      getStreak: () => {
        const { readings } = get();
        if (readings.length === 0) return 0;

        const uniqueDates = [...new Set(readings.map((r) => r.date))].sort().reverse();
        const today = new Date().toISOString().split('T')[0];

        let streak = 0;
        let checkDate = today;

        for (const date of uniqueDates) {
          if (date === checkDate) {
            streak++;
            const prev = new Date(checkDate);
            prev.setDate(prev.getDate() - 1);
            checkDate = prev.toISOString().split('T')[0];
          } else if (date < checkDate) {
            break;
          }
        }
        return streak;
      },

      setReadingsFromCloud: (cloudReadings) => {
        set((state) => {
          const localMap = new Map(state.readings.map((r) => [r.id, r]));
          cloudReadings.forEach((r) => localMap.set(r.id, r));
          return { readings: Array.from(localMap.values()) };
        });
      },

      setMedicinesFromCloud: (cloudMedicines) => {
        set((state) => {
          const localMap = new Map(state.medicines.map((m) => [m.id, m]));
          cloudMedicines.forEach((m) => localMap.set(m.id, m));
          return { medicines: Array.from(localMap.values()) };
        });
      },

      resetStore: () => set({ readings: [], medicines: [], goal: null }),
    }),
    { name: 'remindme_bp_readings', skipHydration: true },
  ),
);
