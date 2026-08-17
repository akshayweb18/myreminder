// ============================================================
// RemindMe — Firebase Realtime Database Service
// ============================================================
// Data structure:
//   bp/{userId}/readings/{readingId}
//   bp/{userId}/medicines/{medicineId}
//   reminders/{userId}/{reminderId}
//
// Required RTDB Security Rules:
// {
//   "rules": {
//     "bp": {
//       "$uid": {
//         ".read":  "$uid === auth.uid",
//         ".write": "$uid === auth.uid"
//       }
//     },
//     "reminders": {
//       "$uid": {
//         ".read":  "$uid === auth.uid",
//         ".write": "$uid === auth.uid"
//       }
//     }
//   }
// }
// ============================================================

import { rtdb } from '@/lib/firebase';
import {
  ref,
  set,
  remove,
  onValue,
  off,
  DatabaseReference,
} from 'firebase/database';
import { BpReading, BpMedicine } from '@/stores/bpStore';
import { Reminder } from '@/types';

// ── Path helpers ──────────────────────────────────────────────

const readingRef  = (uid: string, id: string): DatabaseReference => ref(rtdb, `bp/${uid}/readings/${id}`);
const readingsRef = (uid: string): DatabaseReference             => ref(rtdb, `bp/${uid}/readings`);
const medicineRef  = (uid: string, id: string): DatabaseReference => ref(rtdb, `bp/${uid}/medicines/${id}`);
const medicinesRef = (uid: string): DatabaseReference             => ref(rtdb, `bp/${uid}/medicines`);
const reminderRef  = (uid: string, id: string): DatabaseReference => ref(rtdb, `reminders/${uid}/${id}`);
const remindersRef = (uid: string): DatabaseReference             => ref(rtdb, `reminders/${uid}`);

// ── Generic helpers ──────────────────────────────────────────

async function writeNode(dbRef: DatabaseReference, data: object): Promise<string | null> {
  try {
    // Strip undefined values to prevent Firebase RTDB SDK from throwing error
    const cleanedData = JSON.parse(JSON.stringify(data));
    await set(dbRef, cleanedData);
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[RTDB] write error:', msg, err);
    return msg;
  }
}

async function deleteNode(dbRef: DatabaseReference): Promise<void> {
  try {
    await remove(dbRef);
  } catch (err) {
    console.error('[RTDB] delete error:', err);
  }
}

// ── BP Readings ───────────────────────────────────────────────

export async function saveBpReading(uid: string, reading: BpReading): Promise<string | null> {
  console.log('[RTDB] saveBpReading →', `bp/${uid}/readings/${reading.id}`);
  return writeNode(readingRef(uid, reading.id), reading);
}

export async function deleteBpReading(uid: string, id: string): Promise<void> {
  return deleteNode(readingRef(uid, id));
}

export function subscribeToBpReadings(
  uid: string,
  onData: (readings: BpReading[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const dbRef = readingsRef(uid);
  const handler = onValue(
    dbRef,
    (snap) => {
      if (!snap.exists()) { onData([]); return; }
      const vals = Object.values(snap.val() as Record<string, BpReading>);
      onData(vals.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)));
    },
    (err) => { console.error('[RTDB] subscribeToBpReadings error:', err); onError?.(err); },
  );
  return () => off(dbRef, 'value', handler);
}

// ── BP Medicines ──────────────────────────────────────────────

export async function saveBpMedicine(uid: string, med: BpMedicine): Promise<string | null> {
  console.log('[RTDB] saveBpMedicine →', `bp/${uid}/medicines/${med.id}`);
  return writeNode(medicineRef(uid, med.id), med);
}

export async function deleteBpMedicine(uid: string, id: string): Promise<void> {
  return deleteNode(medicineRef(uid, id));
}

export function subscribeToBpMedicines(
  uid: string,
  onData: (medicines: BpMedicine[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const dbRef = medicinesRef(uid);
  const handler = onValue(
    dbRef,
    (snap) => {
      if (!snap.exists()) { onData([]); return; }
      onData(Object.values(snap.val() as Record<string, BpMedicine>));
    },
    (err) => { console.error('[RTDB] subscribeToBpMedicines error:', err); onError?.(err); },
  );
  return () => off(dbRef, 'value', handler);
}

// ── Reminders ─────────────────────────────────────────────────

export async function saveReminder(uid: string, reminder: Reminder): Promise<string | null> {
  console.log('[RTDB] saveReminder →', `reminders/${uid}/${reminder.id}`);
  return writeNode(reminderRef(uid, reminder.id), { ...reminder, updatedAt: new Date().toISOString() });
}

export async function deleteReminder(uid: string, id: string): Promise<void> {
  return deleteNode(reminderRef(uid, id));
}

export function subscribeToReminders(
  uid: string,
  onData: (reminders: Reminder[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const dbRef = remindersRef(uid);
  const handler = onValue(
    dbRef,
    (snap) => {
      if (!snap.exists()) { onData([]); return; }
      const vals = Object.values(snap.val() as Record<string, Reminder>);
      onData(vals);
    },
    (err) => { console.error('[RTDB] subscribeToReminders error:', err); onError?.(err); },
  );
  return () => off(dbRef, 'value', handler);
}
