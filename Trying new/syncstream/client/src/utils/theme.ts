import { useState, useEffect, useCallback } from 'react';

export type Theme = 'fire' | 'dark' | 'light';

const THEME_STORAGE_KEY = 'syncstream_theme';
const THEME_MIGRATION_KEY = 'syncstream_theme_fire_v1';
const THEME_EVENT_NAME = 'syncstream-theme-change';

export function getSavedTheme(): Theme {
  try {
    // One-time activation: set 'fire' as default active theme for users
    const migrated = localStorage.getItem(THEME_MIGRATION_KEY);
    if (!migrated) {
      localStorage.setItem(THEME_MIGRATION_KEY, 'true');
      localStorage.setItem(THEME_STORAGE_KEY, 'fire');
      return 'fire';
    }

    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'fire' || saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // Ignore storage error
  }
  return 'fire';
}

export function applyTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage error
  }
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(THEME_EVENT_NAME, { detail: theme }));
  }
}

// Initial theme application
if (typeof document !== 'undefined') {
  const initial = getSavedTheme();
  document.documentElement.setAttribute('data-theme', initial);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getSavedTheme);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail);
      }
    };

    window.addEventListener(THEME_EVENT_NAME, handleThemeChange);
    return () => window.removeEventListener(THEME_EVENT_NAME, handleThemeChange);
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    applyTheme(nextTheme);
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const cycle: Record<Theme, Theme> = {
      fire: 'dark',
      dark: 'light',
      light: 'fire',
    };
    const nextTheme: Theme = cycle[theme] || 'fire';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  return { theme, toggleTheme, setTheme };
}
