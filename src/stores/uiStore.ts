'use client';

// ============================================================
// RemindMe AI — UI Store
// ============================================================

import { create } from 'zustand';

interface UiStore {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  createReminderOpen: boolean;
  activeModal: string | null;
  activeReminderId: string | null;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCreateReminderOpen: (open: boolean) => void;
  openModal: (modalId: string, reminderId?: string) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  createReminderOpen: false,
  activeModal: null,
  activeReminderId: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebarCollapsed: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  setCreateReminderOpen: (open) => set({ createReminderOpen: open }),

  openModal: (modalId, reminderId) =>
    set({ activeModal: modalId, activeReminderId: reminderId ?? null }),

  closeModal: () => set({ activeModal: null, activeReminderId: null }),
}));
