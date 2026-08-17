'use client';

// ============================================================
// RemindMe — Theme Provider
// ============================================================

import { createContext, useContext, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { ACCENT_COLORS } from '@/constants';
import { ThemeMode, AccentColor } from '@/types';
import { useIsMounted } from '@/hooks/useIsMounted';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  accentColor: AccentColor;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  resolvedTheme: 'dark',
  accentColor: 'indigo',
  setTheme: () => {},
  setAccentColor: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, setTheme: storeSetTheme, setAccentColor: storeSetAccentColor } = useSettingsStore();
  const mounted = useIsMounted();

  // Resolve and apply theme + accent color to DOM
  useEffect(() => {
    const root = document.documentElement;

    let resolved: 'light' | 'dark' = 'dark';
    if (settings.theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = settings.theme as 'light' | 'dark';
    }

    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.setAttribute('data-theme', resolved);

    const accent = ACCENT_COLORS.find((c) => c.id === settings.accentColor);
    if (accent) {
      root.style.setProperty('--accent', accent.value);
      root.style.setProperty('--accent-dark', accent.dark);
    }
  }, [settings.theme, settings.accentColor]);

  let resolvedTheme: 'light' | 'dark' = 'dark';
  if (mounted) {
    if (settings.theme === 'system') {
      resolvedTheme = (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    } else {
      resolvedTheme = settings.theme as 'light' | 'dark';
    }
  }

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    storeSetTheme(next);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: settings.theme,
        resolvedTheme,
        accentColor: settings.accentColor,
        setTheme: storeSetTheme,
        setAccentColor: storeSetAccentColor,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
