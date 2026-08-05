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
import { motion, AnimatePresence } from 'framer-motion';

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

  const [showConfirm, setShowConfirm] = useState(false);

  const performSignOut = async () => {
    setShowConfirm(false);
    await firebaseSignOut(auth);
    router.replace('/login');
  };

  const handleSignOutTrigger = () => {
    setShowConfirm(true);
    return Promise.resolve();
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
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOutTrigger }}>
      {children}

      {/* Logout confirmation pop-up */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-2xl z-10"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Warning icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 text-xl font-bold">
                  🚪
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] font-display">
                    Confirm Log Out
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed max-w-xs">
                    Are you sure you want to log out of RemindMe AI? You will need to log back in to sync your reminders.
                  </p>
                </div>
                
                {/* Action buttons */}
                <div className="flex w-full gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={performSignOut}
                    className="flex-1 px-4 py-2 text-xs font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/10 active:scale-95"
                  >
                    Yes, Log Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}
