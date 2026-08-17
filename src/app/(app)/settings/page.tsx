'use client';

// ============================================================
// RemindMe AI — Settings Page
// ============================================================

import { useSettingsStore } from '@/stores/settingsStore';
import { useReminderStore } from '@/stores/reminderStore';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { ACCENT_COLORS } from '@/constants';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { AccentColor } from '@/types';
import { Moon, Bell, Shield, Download, Upload, Check, AlertCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import { requestNotificationPermission, getNotificationPermission } from '@/services/notificationService';

export default function SettingsPage() {
  const { settings, setAccentColor, toggleNotifications, updateSettings } = useSettingsStore();
  const { reminders, importReminders } = useReminderStore();
  const [exported, setExported] = useState(false);
  const [imported, setImported] = useState(false);
  const [importError, setImportError] = useState('');
  const [notifStatus, setNotifStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Import JSON backup
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.reminders || !Array.isArray(data.reminders)) {
          setImportError('Invalid backup file format.');
          return;
        }
        importReminders(data);
        setImported(true);
        setTimeout(() => setImported(false), 3000);
      } catch {
        setImportError('Could not parse the file. Make sure it is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  // Enable real notifications
  const handleEnableNotifications = async () => {
    const permission = getNotificationPermission();
    if (permission === 'unsupported') {
      setNotifStatus('Your browser does not support notifications.');
      return;
    }
    if (permission === 'denied') {
      setNotifStatus('Notifications blocked. Please allow in browser settings.');
      return;
    }
    const granted = await requestNotificationPermission();
    if (granted) {
      updateSettings({ notifications: { ...settings.notifications, enabled: true } });
      setNotifStatus('✅ Notifications enabled!');
    } else {
      setNotifStatus('Permission denied by user.');
    }
    setTimeout(() => setNotifStatus(''), 4000);
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

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Theme Mode</p>
            <p className="text-xs text-[var(--text-tertiary)]">Choose light, dark, or follow system</p>
          </div>
          <ThemeSwitcher />
        </div>

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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Browser Notifications</p>
            <p className="text-xs text-[var(--text-tertiary)]">Get notified even when the app is in background</p>
            {notifStatus && (
              <p className="text-xs text-[var(--accent)] mt-1">{notifStatus}</p>
            )}
          </div>
          <Button variant="secondary" onClick={handleEnableNotifications} className="shrink-0">
            <Bell size={15} />
            {getNotificationPermission() === 'granted' ? 'Enabled ✓' : 'Enable Notifications'}
          </Button>
        </div>

        <Switch
          label="In-App Notification Toggle"
          description="Enable/disable scheduling notifications for reminders"
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

        {/* Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Export Local Backup</p>
            <p className="text-xs text-[var(--text-tertiary)]">Download your reminders and settings as JSON</p>
          </div>
          <Button variant="secondary" onClick={handleExportData} className="shrink-0">
            {exported ? <Check size={16} /> : <Download size={16} />}
            {exported ? 'Exported!' : 'Export Data'}
          </Button>
        </div>

        {/* Import */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-[var(--border)]">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Import Backup</p>
            <p className="text-xs text-[var(--text-tertiary)]">Restore reminders from a JSON backup file</p>
            {importError && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {importError}
              </p>
            )}
            {imported && (
              <p className="text-xs text-emerald-400 mt-1">✅ Reminders imported successfully!</p>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="shrink-0">
              <Upload size={16} />
              Import Data
            </Button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
          ⌨️ Keyboard Shortcuts
        </h3>
        <div className="space-y-3">
          {[
            { key: 'N', desc: 'New Reminder' },
            { key: 'Ctrl + K', desc: 'Open Command Palette' },
          ].map(({ key, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">{desc}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
