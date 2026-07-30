// ============================================================
// RemindMe AI — Firebase Firestore Sync Service
// ============================================================

import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { Reminder } from '@/types';

const REMINDERS_COLLECTION = 'reminders';

export const firestoreService = {
  // Save or update reminder in Firestore
  async saveReminder(userId: string, reminder: Reminder) {
    try {
      const docRef = doc(db, 'users', userId, REMINDERS_COLLECTION, reminder.id);
      await setDoc(docRef, reminder, { merge: true });
    } catch (error) {
      console.error('[Firestore] Error saving reminder:', error);
    }
  },

  // Fetch all user reminders from Firestore
  async getUserReminders(userId: string): Promise<Reminder[]> {
    try {
      const colRef = collection(db, 'users', userId, REMINDERS_COLLECTION);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map((doc) => doc.data() as Reminder);
    } catch (error) {
      console.error('[Firestore] Error fetching reminders:', error);
      return [];
    }
  },

  // Delete reminder from Firestore
  async deleteReminder(userId: string, reminderId: string) {
    try {
      const docRef = doc(db, 'users', userId, REMINDERS_COLLECTION, reminderId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('[Firestore] Error deleting reminder:', error);
    }
  },
};
