
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeName } from '@/lib/themes';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'blockcertify-theme';
const DEFAULT_THEME: ThemeName = 'dark';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    const currentTheme = savedTheme || DEFAULT_THEME;
    setThemeState(currentTheme);
    document.documentElement.dataset.theme = currentTheme;
  }, []);

  const setTheme = (nextTheme: ThemeName) => {
    setThemeState(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useThemeManager = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeManager must be used within ThemeProvider');
  return context;
};
