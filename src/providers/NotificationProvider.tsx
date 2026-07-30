'use client';

// ============================================================
// RemindMe AI — Notification Provider
// ============================================================

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useReminderStore } from '@/stores/reminderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useBpStore } from '@/stores/bpStore';
import { isPast, parseISO } from 'date-fns';

const NotificationContext = createContext<null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { reminders, completeReminder, snoozeReminder } = useReminderStore();
  const { settings } = useSettingsStore();
  const { reminderSettings: bpReminders } = useBpStore();
  const notifiedIds = useRef<Set<string>>(new Set());

  // Tracks which BP reminders have been sent today: { date, morning, evening }
  const bpReminderTracking = useRef<{ date: string; morning: boolean; evening: boolean }>({
    date: '',
    morning: false,
    evening: false,
  });

  // Register service worker and listen to actions
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[SW] Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.error('[SW] Service Worker registration failed:', err);
      });

    // Listen to messages from service worker actions (Done / Snooze)
    const handleMessage = (event: MessageEvent) => {
      const { type, id } = event.data || {};
      if (type === 'REMINDER_DONE' && id) {
        completeReminder(id);
      } else if (type === 'REMINDER_SNOOZE' && id) {
        // Snooze for 15 minutes by default
        const snoozeTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        snoozeReminder(id, snoozeTime);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [completeReminder, snoozeReminder]);

  // Request browser notification permissions if enabled in settings
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (settings.notifications.enabled && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('[Notification] Permission state:', permission);
      });
    }
  }, [settings.notifications.enabled]);

  // Periodic checker loop for reminders
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDueReminders = () => {
      if (!settings.notifications.enabled) return;

      reminders.forEach((reminder) => {
        // Skip completed, trashed, or already notified
        if (reminder.status !== 'pending' || notifiedIds.current.has(reminder.id)) {
          return;
        }

        // Parse date-time
        const dateTimeStr = reminder.time ? `${reminder.date}T${reminder.time}` : reminder.date;
        const targetTime = parseISO(dateTimeStr);

        // Check if current time has hit or passed the scheduled time
        if (isPast(targetTime)) {
          // Mark as notified
          notifiedIds.current.add(reminder.id);

          // Trigger OS Notification
          if (Notification.permission === 'granted') {
            const title = `${reminder.emoji || '🔔'} ${reminder.title}`;
            const body = reminder.description || 'Reminder is due now!';

            // Use Service Worker if active for premium background action buttons
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, {
                body,
                tag: reminder.id,
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-96.png',
                // Keep silent: false (default) so standard native OS sound plays
                silent: !settings.notifications.sound,
                vibrate: [200, 100, 200, 100, 200],
                data: {
                  reminderId: reminder.id,
                  url: '/dashboard',
                },
                actions: [
                  { action: 'done', title: '✅ Done' },
                  { action: 'snooze', title: '⏰ Snooze 15m' },
                ],
              } as any);
              if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200, 100, 200]);
              }
            }).catch(() => {
              // Fallback to standard window Notification if SW is not ready/supported
              new Notification(title, { 
                body, 
                icon: '/icons/icon-192.png',
                silent: !settings.notifications.sound,
              });
              if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200, 100, 200]);
              }
            });
          }
        }
      });
    };

    // Run check immediately and then every 5 seconds
    checkDueReminders();
    const intervalId = setInterval(checkDueReminders, 5000);

    return () => clearInterval(intervalId);
  }, [reminders, settings.notifications.enabled, settings.notifications.sound]);

  // BP daily reminder checker (morning + evening)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkBpReminders = () => {
      if (!bpReminders.enabled || Notification.permission !== 'granted') return;

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm

      // Reset tracking at midnight for a new day
      if (bpReminderTracking.current.date !== today) {
        bpReminderTracking.current = { date: today, morning: false, evening: false };
      }

      const fireNotification = (title: string, body: string, tag: string) => {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, {
              body,
              tag,
              icon: '/icons/icon-192.png',
              silent: false,
              vibrate: [200, 100, 200, 100, 200],
            } as any);
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
          })
          .catch(() => {
            new Notification(title, { body });
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
          });
      };

      // Helper: check if currentTime is within a 10-minute window of targetTime
      const isWithin10Min = (targetHHmm: string): boolean => {
        const [tH, tM] = targetHHmm.split(':').map(Number);
        const [cH, cM] = currentTime.split(':').map(Number);
        const target = tH * 60 + tM;
        const current = cH * 60 + cM;
        return current >= target && current <= target + 10;
      };

      if (!bpReminderTracking.current.morning && isWithin10Min(bpReminders.morningTime)) {
        bpReminderTracking.current.morning = true;
        fireNotification(
          '🩺 Morning BP Check',
          'Good morning! Time to measure your blood pressure.',
          'bp-morning',
        );
      }

      if (!bpReminderTracking.current.evening && isWithin10Min(bpReminders.eveningTime)) {
        bpReminderTracking.current.evening = true;
        fireNotification(
          '🩺 Evening BP Check',
          'Time for your evening blood pressure measurement.',
          'bp-evening',
        );
      }
    };

    checkBpReminders();
    const bpInterval = setInterval(checkBpReminders, 30_000); // every 30 s
    return () => clearInterval(bpInterval);
  }, [bpReminders]);

  return (
    <NotificationContext.Provider value={null}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
