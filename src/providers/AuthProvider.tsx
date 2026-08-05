'use client';

// ============================================================
// RemindMe AI — Firebase Auth Provider
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useReminderStore } from '@/stores/reminderStore';
import { useBpStore } from '@/stores/bpStore';
import { useBpSync } from '@/hooks/useBpSync';

// ── Auth Context ──────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── Public routes (no auth required) ─────────────────────────

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/otp', '/'];

// ── Provider ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Subscribe to RTDB for real-time BP data sync
  useBpSync();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Logged out or no active session -> Reset local Zustand stores immediately
        // so that data doesn't leak or display when switching accounts
        useReminderStore.getState().resetStore();
        useBpStore.getState().resetStore();
      }

      setUser(firebaseUser);
      setLoading(false);

      const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

      if (!firebaseUser && !isPublic) {
        // Not logged in and on a protected route → redirect to login
        router.replace('/login');
      }

      if (firebaseUser && isPublic && pathname !== '/') {
        // Logged in but on auth page → redirect to dashboard
        router.replace('/dashboard');
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.replace('/login');
  };

  // Show a full-screen loader while Firebase is checking auth state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-base)] z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center animate-pulse shadow-xl">
            <span className="text-2xl">🔔</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">Loading RemindMe...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
