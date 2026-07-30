// ============================================================
// RemindMe AI — Firebase SDK Configuration & Services
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCr-9OPLh9q9lM_yHMyfucoyy9z8RFAtSk",
  authDomain: "civila-master-app.firebaseapp.com",
  projectId: "civila-master-app",
  storageBucket: "civila-master-app.firebasestorage.app",
  messagingSenderId: "677262771190",
  appId: "1:677262771190:web:d8bade72c8ce7e04107dd7",
  measurementId: "G-FFEHBPCMFV"
};

// Initialize Firebase App (Singleton pattern for Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics & Messaging safely for SSR
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && (await isAnalyticsSupported())) {
    return getAnalytics(app);
  }
  return null;
};

export const initMessaging = async () => {
  if (typeof window !== 'undefined' && (await isSupported())) {
    return getMessaging(app);
  }
  return null;
};

export default app;
