// ============================================================
// RemindMe — Firebase Cloud Messaging & Notification Helpers
// ============================================================

import { initMessaging } from '@/lib/firebase';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';

export async function requestFCMToken() {
  try {
    const messaging = await initMessaging();
    if (!messaging) {
      console.log('[FCM] Messaging not supported in this browser/environment.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        // VAPID key can be added here if customized in Firebase Console
      });
      console.log('[FCM] Push Notification Token:', token);
      return token;
    } else {
      console.log('[FCM] Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error getting FCM Token:', error);
    return null;
  }
}

export async function listenForForegroundMessages(callback: (payload: MessagePayload) => void) {
  const messaging = await initMessaging();
  if (messaging) {
    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground Message Received:', payload);
      callback(payload);
    });
  }
}
