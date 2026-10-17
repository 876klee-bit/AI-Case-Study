import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PanelTab, View } from '@/types';
import { safeStorage } from './storage';

interface LayoutState {
  view: View;
  sidebarCollapsed: boolean;
  /** Mobile sidebar drawer. */
  mobileNavOpen: boolean;
  panelOpen: boolean;
  panelTab: PanelTab;
  /** Version shown in the preview, or null for the working copy. */
  viewingVersion: number | null;
  /** Version selected for comparison in the Versions tab. */
  compareVersion: number | null;

  setView: (view: View) => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  openPanel: (tab?: PanelTab) => void;
  closePanel: () => void;
  togglePanel: () => void;
  setPanelTab: (tab: PanelTab) => void;
  setViewingVersion: (v: number | null) => void;
  setCompareVersion: (v: number | null) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      view: 'chat',
      sidebarCollapsed: false,
      mobileNavOpen: false,
      panelOpen: false,
      panelTab: 'preview',
      viewingVersion: null,
      compareVersion: null,

      setView: (view) => set({ view, mobileNavOpen: false }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      openPanel: (tab) => set((s) => ({ panelOpen: true, panelTab: tab ?? s.panelTab })),
      closePanel: () => set({ panelOpen: false }),
      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
      setPanelTab: (tab) => set({ panelTab: tab }),
      setViewingVersion: (v) => set({ viewingVersion: v }),
      setCompareVersion: (v) => set({ compareVersion: v }),
    }),
    {
      name: 'workspace-layout',
      storage: safeStorage,
      version: 1,
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);
