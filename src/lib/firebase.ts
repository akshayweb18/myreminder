// ============================================================
// RemindMe AI — Firebase SDK Configuration & Services
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

// smartreminder-d2915 Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAphGQYLqcclShDyKZeQRMHPr4KX4g9Cz4",
  authDomain: "smartreminder-d2915.firebaseapp.com",
  databaseURL: "https://smartreminder-d2915-default-rtdb.firebaseio.com",
  projectId: "smartreminder-d2915",
  storageBucket: "smartreminder-d2915.firebasestorage.app",
  messagingSenderId: "306446024497",
  appId: "1:306446024497:web:57032435d80f770e57fa10",
  measurementId: "G-4QNECESCLE",
};

// Initialize Firebase App (Singleton pattern for Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app); // Firebase Realtime Database
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Google provider settings
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Analytics safely (client-side only — SSR safe)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && (await isAnalyticsSupported())) {
    return getAnalytics(app);
  }
  return null;
};

// Initialize FCM Messaging safely (client-side only — SSR safe)
export const initMessaging = async () => {
  if (typeof window !== 'undefined' && (await isSupported())) {
    return getMessaging(app);
  }
  return null;
};

export default app;
