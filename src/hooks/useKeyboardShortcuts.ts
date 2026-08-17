'use client';

// ============================================================
// RemindMe — useKeyboardShortcuts Hook
// N = New Reminder | Ctrl+K = Command Palette
// ============================================================

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUiStore } from '@/stores/uiStore';

export function useKeyboardShortcuts() {
  const router = useRouter();
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;

      // Ctrl+K / Cmd+K — Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // N — New Reminder (only when not typing)
      if (!isInput && e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        router.push('/reminders/new');
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, toggleCommandPalette]);
}
