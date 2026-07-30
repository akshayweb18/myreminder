// ============================================================
// RemindMe AI — Firebase Storage Service (Attachments/Voice)
// ============================================================

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const firebaseStorageService = {
  // Upload attachment file or voice note
  async uploadFile(userId: string, reminderId: string, file: File): Promise<string | null> {
    try {
      const storageRef = ref(storage, `users/${userId}/reminders/${reminderId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error('[Storage] Error uploading file:', error);
      return null;
    }
  },

  // Delete file from Firebase storage
  async deleteFile(filePath: string) {
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('[Storage] Error deleting file:', error);
    }
  },
};
