import { beforeEach, describe, expect, it } from 'vitest';
import { initialAppUiState, useAppUiStore } from './app-ui.store';

describe('useAppUiStore', () => {
  beforeEach(() => useAppUiStore.getState().resetUiState());

  it('starts with the sidebar open', () => {
    expect(useAppUiStore.getState().isSidebarOpen).toBe(true);
  });

  it('opens the sidebar', () => {
    useAppUiStore.getState().closeSidebar();
    useAppUiStore.getState().openSidebar();
    expect(useAppUiStore.getState().isSidebarOpen).toBe(true);
  });

  it('closes the sidebar', () => {
    useAppUiStore.getState().closeSidebar();
    expect(useAppUiStore.getState().isSidebarOpen).toBe(false);
  });

  it('toggles the sidebar', () => {
    useAppUiStore.getState().toggleSidebar();
    expect(useAppUiStore.getState().isSidebarOpen).toBe(false);
  });

  it('enables and disables focus mode', () => {
    useAppUiStore.getState().enableFocusMode();
    expect(useAppUiStore.getState().isFocusMode).toBe(true);
    useAppUiStore.getState().disableFocusMode();
    expect(useAppUiStore.getState().isFocusMode).toBe(false);
  });

  it('resets all UI state', () => {
    useAppUiStore.getState().closeSidebar();
    useAppUiStore.getState().openMobileNavigation();
    useAppUiStore.getState().enableFocusMode();
    useAppUiStore.getState().resetUiState();
    expect(useAppUiStore.getState()).toMatchObject(initialAppUiState);
  });

  it('opens and closes mobile navigation', () => {
    useAppUiStore.getState().openMobileNavigation();
    expect(useAppUiStore.getState().isMobileNavigationOpen).toBe(true);
    useAppUiStore.getState().closeMobileNavigation();
    expect(useAppUiStore.getState().isMobileNavigationOpen).toBe(false);
  });
});
