import { create } from 'zustand';

/**
 * Pure UI state for the notification bell dropdown - actual notification
 * data (list, unread count, mark-as-read) lives in TanStack Query via
 * `@/features/notifications/hooks/use-notifications`, not here. Server
 * state doesn't belong in a Zustand store; this only tracks whether the
 * dropdown panel is open.
 */
interface NotificationUiState {
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

export const useNotificationStore = create<NotificationUiState>((set) => ({
  isPanelOpen: false,
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
}));
