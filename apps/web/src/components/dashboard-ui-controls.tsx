'use client';

import { Button } from '@/components/ui/button';
import { useAppUiStore } from '@/stores';

export function DashboardUiControls() {
  const isSidebarOpen = useAppUiStore((state) => state.isSidebarOpen);
  const isFocusMode = useAppUiStore((state) => state.isFocusMode);
  const toggleSidebar = useAppUiStore((state) => state.toggleSidebar);
  const enableFocusMode = useAppUiStore((state) => state.enableFocusMode);
  const disableFocusMode = useAppUiStore((state) => state.disableFocusMode);

  return (
    <div className="mt-6 flex flex-wrap gap-3" aria-label="Dashboard interface controls">
      <Button type="button" variant="outline" onClick={toggleSidebar}>
        {isSidebarOpen ? 'Hide' : 'Show'} placeholder sidebar
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={isFocusMode ? disableFocusMode : enableFocusMode}
      >
        {isFocusMode ? 'Exit' : 'Enter'} focus mode
      </Button>
      <span className="self-center text-sm text-zinc-600" aria-live="polite">
        Sidebar {isSidebarOpen ? 'open' : 'closed'} · Focus mode {isFocusMode ? 'on' : 'off'}
      </span>
    </div>
  );
}
