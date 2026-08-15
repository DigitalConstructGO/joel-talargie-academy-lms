'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting until mounted on client
  useEffect(() => setMounted(true), []);

  const current = mounted ? (resolvedTheme ?? theme ?? 'light') : 'light';
  const isDark = current === 'dark';

  function handleToggle() {
    setTheme(isDark ? 'light' : 'dark');
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative size-9 rounded-lg text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-4 text-amber-400 transition-all duration-200 hover:rotate-45" />
        ) : (
          <Moon className="size-4 text-slate-700 transition-all duration-200 hover:-rotate-12 dark:text-slate-200" />
        )
      ) : (
        <Sun className="size-4 text-muted-foreground opacity-60" />
      )}
    </Button>
  );
}
