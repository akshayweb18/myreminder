// ============================================================
// RemindMe AI — Firebase Realtime Database Service (BP Module)
// ============================================================
// All BP data is stored under:
//   bp/{userId}/readings/{readingId}
//   bp/{userId}/medicines/{medicineId}
//
// Required RTDB Security Rules:
// {
//   "rules": {
//     "bp": {
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

// ── Path helpers ──────────────────────────────────────────────

const readingRef = (userId: string, readingId: string): DatabaseReference =>
  ref(rtdb, `bp/${userId}/readings/${readingId}`);

const readingsRef = (userId: string): DatabaseReference =>
  ref(rtdb, `bp/${userId}/readings`);

const medicineRef = (userId: string, medicineId: string): DatabaseReference =>
  ref(rtdb, `bp/${userId}/medicines/${medicineId}`);

const medicinesRef = (userId: string): DatabaseReference =>
  ref(rtdb, `bp/${userId}/medicines`);

// ── BP Readings ───────────────────────────────────────────────

/**
 * Save (or overwrite) a single BP reading to RTDB.
 * Returns an error string on failure, or null on success.
 */
export async function saveBpReading(
  userId: string,
  reading: BpReading,
): Promise<string | null> {
  try {
    await set(readingRef(userId, reading.id), reading);
    console.log('[RTDB] saveBpReading OK:', reading.id);
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[RTDB] saveBpReading error:', msg, err);
    return msg;
  }
}

/**
 * Delete a BP reading from RTDB.
 * Returns an error string on failure, or null on success.
 */
export async function deleteBpReading(
  userId: string,
  readingId: string,
): Promise<string | null> {
  try {
    await remove(readingRef(userId, readingId));
    console.log('[RTDB] deleteBpReading OK:', readingId);
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[RTDB] deleteBpReading error:', msg, err);
    return msg;
  }
}

/**
 * Subscribe to all BP readings for a user (real-time listener).
 * Calls onData whenever the data changes.
 * Returns an unsubscribe function.
 */
export function subscribeToBpReadings(
  userId: string,
  onData: (readings: BpReading[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const dbRef = readingsRef(userId);

  const handler = onValue(
    dbRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      const raw = snapshot.val() as Record<string, BpReading>;
      const readings: BpReading[] = Object.values(raw).sort((a, b) =>
        b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
      );
      onData(readings);
    },
    (err) => {
      console.error('[RTDB] subscribeToBpReadings error:', err);
      onError?.(err);
    },
  );

  // Return unsubscribe function
  return () => off(dbRef, 'value', handler);
}

// ── BP Medicines ──────────────────────────────────────────────

/**
 * Save (or overwrite) a single BP medicine to RTDB.
 * Returns an error string on failure, or null on success.
 */
export async function saveBpMedicine(
  userId: string,
  medicine: BpMedicine,
): Promise<string | null> {
  try {
    await set(medicineRef(userId, medicine.id), medicine);
    console.log('[RTDB] saveBpMedicine OK:', medicine.id);
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[RTDB] saveBpMedicine error:', msg, err);
    return msg;
  }
}

/**
 * Delete a BP medicine from RTDB.
 * Returns an error string on failure, or null on success.
 */
export async function deleteBpMedicine(
  userId: string,
  medicineId: string,
): Promise<string | null> {
  try {
    await remove(medicineRef(userId, medicineId));
    console.log('[RTDB] deleteBpMedicine OK:', medicineId);
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[RTDB] deleteBpMedicine error:', msg, err);
    return msg;
  }
}

/**
 * Subscribe to all BP medicines for a user (real-time listener).
 * Returns an unsubscribe function.
 */
export function subscribeToBpMedicines(
  userId: string,
  onData: (medicines: BpMedicine[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const dbRef = medicinesRef(userId);

  const handler = onValue(
    dbRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      const raw = snapshot.val() as Record<string, BpMedicine>;
      const medicines: BpMedicine[] = Object.values(raw);
      onData(medicines);
    },
    (err) => {
      console.error('[RTDB] subscribeToBpMedicines error:', err);
      onError?.(err);
    },
  );

  return () => off(dbRef, 'value', handler);
}
