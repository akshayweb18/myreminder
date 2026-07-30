// ============================================================
// RemindMe AI — Firebase Firestore Sync Service
// ============================================================

import { db } from '@/lib/firebase';
import {
  collection, doc, setDoc, getDocs, deleteDoc,
  onSnapshot, serverTimestamp, Unsubscribe,
} from 'firebase/firestore';
import { Reminder } from '@/types';
import { BpReading, BpMedicine } from '@/stores/bpStore';

// ── Reminders ────────────────────────────────────────────────

export const firestoreService = {
  // Save / update one reminder
  async saveReminder(userId: string, reminder: Reminder) {
    try {
      const ref = doc(db, 'users', userId, 'reminders', reminder.id);
      await setDoc(ref, { ...reminder, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error('[Firestore] saveReminder error:', err);
    }
  },

  // Fetch all reminders (one-time)
  async getUserReminders(userId: string): Promise<Reminder[]> {
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'reminders'));
      return snap.docs.map((d) => d.data() as Reminder);
    } catch (err) {
      console.error('[Firestore] getUserReminders error:', err);
      return [];
    }
  },

  // Delete one reminder
  async deleteReminder(userId: string, reminderId: string) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'reminders', reminderId));
    } catch (err) {
      console.error('[Firestore] deleteReminder error:', err);
    }
  },

  // Real-time listener for reminders
  subscribeToReminders(
    userId: string,
    onData: (reminders: Reminder[]) => void,
  ): Unsubscribe {
    return onSnapshot(
      collection(db, 'users', userId, 'reminders'),
      (snap) => {
        const reminders = snap.docs.map((d) => d.data() as Reminder);
        onData(reminders);
      },
      (err) => console.error('[Firestore] subscribeToReminders error:', err),
    );
  },

  // ── BP Readings ────────────────────────────────────────────

  async saveBpReading(userId: string, reading: BpReading) {
    try {
      const ref = doc(db, 'users', userId, 'bpReadings', reading.id);
      await setDoc(ref, reading, { merge: true });
    } catch (err) {
      console.error('[Firestore] saveBpReading error:', err);
    }
  },

  async deleteBpReading(userId: string, readingId: string) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'bpReadings', readingId));
    } catch (err) {
      console.error('[Firestore] deleteBpReading error:', err);
    }
  },

  subscribeToBloodPressure(
    userId: string,
    onData: (readings: BpReading[]) => void,
  ): Unsubscribe {
    return onSnapshot(
      collection(db, 'users', userId, 'bpReadings'),
      (snap) => {
        const readings = snap.docs.map((d) => d.data() as BpReading);
        onData(readings);
      },
      (err) => console.error('[Firestore] subscribeToBloodPressure error:', err),
    );
  },

  // ── BP Medicines ───────────────────────────────────────────

  async saveBpMedicine(userId: string, medicine: BpMedicine) {
    try {
      const ref = doc(db, 'users', userId, 'bpMedicines', medicine.id);
      await setDoc(ref, medicine, { merge: true });
    } catch (err) {
      console.error('[Firestore] saveBpMedicine error:', err);
    }
  },

  async deleteBpMedicine(userId: string, medicineId: string) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'bpMedicines', medicineId));
    } catch (err) {
      console.error('[Firestore] deleteBpMedicine error:', err);
    }
  },

  // ── User Profile ───────────────────────────────────────────

  async saveUserProfile(userId: string, data: Record<string, unknown>) {
    try {
      const ref = doc(db, 'users', userId);
      await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('[Firestore] saveUserProfile error:', err);
    }
  },

  async getUserProfile(userId: string): Promise<Record<string, unknown> | null> {
    try {
      const { getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'users', userId));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.error('[Firestore] getUserProfile error:', err);
      return null;
    }
  },
};
