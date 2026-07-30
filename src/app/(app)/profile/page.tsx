'use client';

// ============================================================
// RemindMe AI — User Profile Page (Firebase Auth + Storage)
// ============================================================

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Check, Camera, LogOut, Shield, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase';
import { firestoreService } from '@/services/firestoreService';
import { useAuth } from '@/providers/AuthProvider';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Populate from Firebase user
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '');
      setEmail(user.email ?? '');
      setPhotoURL(user.photoURL ?? '');
    }
  }, [user]);

  // ── Profile Save ──────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: displayName.trim() });
      // Update Firestore
      await firestoreService.saveUserProfile(user.uid, {
        displayName: displayName.trim(),
        email: user.email,
        photoURL: user.photoURL ?? null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('[Profile] Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Photo Upload ──────────────────────────────────────────

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const storageRef = ref(storage, `users/${user.uid}/profile/avatar`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setUploadProgress(pct);
      },
      (err) => {
        console.error('[Storage] Upload error:', err);
        setUploadProgress(null);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await updateProfile(user, { photoURL: url });
        await firestoreService.saveUserProfile(user.uid, { photoURL: url });
        setPhotoURL(url);
        setUploadProgress(null);
      },
    );
  };

  // ── Avatar Initials ───────────────────────────────────────

  const initials = (displayName || email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">User Profile</h1>
        <p className="text-xs text-[var(--text-tertiary)]">Manage your personal details and account settings</p>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-6">
        {/* ── Avatar Section ── */}
        <div className="flex items-center gap-5 border-b border-[var(--border)] pb-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-[var(--accent)] to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              {photoURL ? (
                <Image
                  src={photoURL}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Upload progress ring */}
            {uploadProgress !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                <span className="text-white text-xs font-bold">{uploadProgress}%</span>
              </div>
            )}

            {/* Camera button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadProgress !== null}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{displayName || 'Your Name'}</h3>
            <p className="text-xs text-[var(--text-tertiary)]">{email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {user?.providerData?.[0]?.providerId === 'google.com' ? 'Google Account' : 'Email Account'}
            </span>
          </div>
        </div>

        {/* ── Inputs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            leftIcon={<User size={16} />}
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            disabled
            leftIcon={<Mail size={16} />}
          />
        </div>

        {/* ── Security Info ── */}
        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">Account Security</span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            {user?.providerData?.[0]?.providerId === 'google.com'
              ? 'Your account is secured via Google OAuth. No password is stored.'
              : 'Your account is secured with email & password via Firebase Authentication.'}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            UID: <span className="font-mono text-[10px] text-[var(--text-secondary)]">{user?.uid}</span>
          </p>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={signOut}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
          >
            <LogOut size={15} /> Sign Out
          </Button>

          <Button type="submit" variant="gradient" disabled={saving}>
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
              : saved
                ? <><Check size={15} /> Saved!</>
                : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
