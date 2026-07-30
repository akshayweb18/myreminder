'use client';

// ============================================================
// RemindMe AI — Settings Page (Theme, Accent Color, Notifications, Backup)
// ============================================================

import { useSettingsStore } from '@/stores/settingsStore';
import { useReminderStore } from '@/stores/reminderStore';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { ACCENT_COLORS } from '@/constants';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { AccentColor } from '@/types';
import { Moon, Bell, Volume2, Globe, Shield, Download, Upload, Check } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const { settings, setAccentColor, toggleNotifications, updateSettings } = useSettingsStore();
  const { reminders } = useReminderStore();
  const [exported, setExported] = useState(false);

  // Export JSON backup
  const handleExportData = () => {
    const dataStr = JSON.stringify({ reminders, settings }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `remindme-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">Settings</h1>
        <p className="text-xs text-[var(--text-tertiary)]">Customize themes, notifications, and data backups</p>
      </div>

      {/* Appearance */}
      <div className="card p-6 space-y-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <Moon size={16} className="text-[var(--accent)]" /> Appearance
        </h3>

        {/* Theme switcher */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Theme Mode</p>
            <p className="text-xs text-[var(--text-tertiary)]">Choose light, dark, or follow system</p>
          </div>
          <ThemeSwitcher />
        </div>

        {/* Accent color picker */}
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Accent Color</p>
          <p className="text-xs text-[var(--text-tertiary)] mb-3">Select primary theme tint</p>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => setAccentColor(color.id as AccentColor)}
                className="h-9 w-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                style={{ background: color.value }}
              >
                {settings.accentColor === color.id && (
                  <Check size={16} className="text-white drop-shadow" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <Bell size={16} className="text-[var(--accent)]" /> Notifications & Sound
        </h3>

        <Switch
          label="Browser Push Notifications"
          description="Receive reminders even when app is closed"
          checked={settings.notifications.enabled}
          onCheckedChange={toggleNotifications}
        />

        <Switch
          label="Sound Alerts"
          description="Play a sound when reminder triggers"
          checked={settings.notifications.sound}
          onCheckedChange={() =>
            updateSettings({
              notifications: {
                ...settings.notifications,
                sound: !settings.notifications.sound,
              },
            })
          }
        />
      </div>

      {/* Data Backup */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <Shield size={16} className="text-[var(--accent)]" /> Data & Storage
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Export Local Backup</p>
            <p className="text-xs text-[var(--text-tertiary)]">Download your reminders and settings as JSON</p>
          </div>
          <Button variant="secondary" onClick={handleExportData}>
            {exported ? <Check size={16} /> : <Download size={16} />}
            {exported ? 'Exported!' : 'Export Data'}
          </Button>
        </div>
      </div>
    </div>
  );
}
