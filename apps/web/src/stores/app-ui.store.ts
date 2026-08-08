import { create } from 'zustand';

export interface AppUiState {
  isSidebarOpen: boolean;
  isMobileNavigationOpen: boolean;
  isFocusMode: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  openMobileNavigation: () => void;
  closeMobileNavigation: () => void;
  enableFocusMode: () => void;
  disableFocusMode: () => void;
  resetUiState: () => void;
}

export const initialAppUiState = {
  isSidebarOpen: true,
  isMobileNavigationOpen: false,
  isFocusMode: false,
} as const;

export const useAppUiStore = create<AppUiState>((set) => ({
  ...initialAppUiState,
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openMobileNavigation: () => set({ isMobileNavigationOpen: true }),
  closeMobileNavigation: () => set({ isMobileNavigationOpen: false }),
  enableFocusMode: () => set({ isFocusMode: true }),
  disableFocusMode: () => set({ isFocusMode: false }),
  resetUiState: () => set(initialAppUiState),
}));
