"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ThemeConfig } from "../lib/theme-config";
import {
  applyThemeToDOM,
  defaultLightTheme,
  loadThemeFromStorage,
  saveThemeToStorage,
  themePresets,
} from "../lib/theme-config";

export interface ThemeContextValue {
  /** The currently active theme config */
  theme: ThemeConfig;
  /** Set a new theme (applies immediately and persists to localStorage) */
  setTheme: (theme: ThemeConfig) => void;
  /** All available theme presets */
  presets: ThemeConfig[];
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Override the default theme (used on first load when no localStorage value exists) */
  defaultTheme?: ThemeConfig;
  /** Additional presets to include beyond the built-in ones */
  extraPresets?: ThemeConfig[];
}

export function ThemeProvider({
  children,
  defaultTheme = defaultLightTheme,
  extraPresets = [],
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeConfig>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load persisted theme on mount
  useEffect(() => {
    const stored = loadThemeFromStorage();
    if (stored) {
      setThemeState(stored);
      applyThemeToDOM(stored);
    } else {
      applyThemeToDOM(defaultTheme);
    }
    setMounted(true);
  }, [defaultTheme]);

  const setTheme = useCallback((newTheme: ThemeConfig) => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
    saveThemeToStorage(newTheme);
  }, []);

  const presets = useMemo(
    () => [...themePresets, ...extraPresets],
    [extraPresets],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, presets }),
    [theme, setTheme, presets],
  );

  // Prevent flash of unstyled content — render children only after mount
  // so the correct CSS vars are in place. We still render the tree in SSR
  // (via suppressHydrationWarning on <html>) but skip applying vars there.
  return (
    <ThemeContext.Provider value={value}>
      {/* Always render children for SSR; CSS vars are applied in useEffect */}
      {children}
    </ThemeContext.Provider>
  );
}
