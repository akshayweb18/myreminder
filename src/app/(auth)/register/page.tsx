'use client';

// ============================================================
// RemindMe AI — Register Page (Firebase createUser + Firestore)
// ============================================================

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'An account already exists with this email.';
    case 'auth/invalid-email':         return 'Please enter a valid email address.';
    case 'auth/weak-password':         return 'Password must be at least 6 characters.';
    case 'auth/popup-closed-by-user':  return 'Google sign-up was cancelled.';
    default: return 'Registration failed. Please try again.';
  }
}

async function createUserProfile(uid: string, name: string, email: string, photoURL?: string) {
  await setDoc(doc(db, 'users', uid), {
    uid,
    displayName: name,
    email,
    photoURL: photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Save display name to Firebase Auth profile
      await updateProfile(cred.user, { displayName: name.trim() });
      // Create Firestore user document
      await createUserProfile(cred.user.uid, name.trim(), email);
      router.replace('/dashboard');
    } catch (err: unknown) {
      console.error('[Register] Error:', err);
      const code = (err as { code?: string }).code ?? '';
      setError(getFirebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const u = cred.user;
      await createUserProfile(u.uid, u.displayName ?? 'User', u.email ?? '', u.photoURL ?? undefined);
      router.replace('/dashboard');
    } catch (err: unknown) {
      console.error('[Google SignUp] Error:', err);
      const code = (err as { code?: string }).code ?? '';
      setError(getFirebaseErrorMessage(code));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">Create an account</h2>
        <p className="text-xs text-[var(--text-tertiary)] font-sans">Start organizing your life with RemindMe AI</p>
      </div>

      {/* Google Sign-Up */}
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center gap-2 justify-center"
        onClick={handleGoogleSignUp}
        disabled={googleLoading}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {googleLoading ? 'Signing up...' : 'Continue with Google'}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-tertiary)]">or</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          placeholder="Alex Developer"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<User size={16} />}
          required
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="alex@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={16} />}
          required
          minLength={6}
        />

        <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : <>Create Account <ArrowRight size={16} /></>}
        </Button>
      </form>

      <div className="text-center text-xs text-[var(--text-tertiary)]">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
