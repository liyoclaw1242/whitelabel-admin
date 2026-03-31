"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ColorMode, ThemeConfig } from "../lib/theme-config";
import {
  applyColorModeToDOM,
  applyThemeToDOM,
  defaultTheme,
  loadColorMode,
  loadThemeFromStorage,
  saveColorMode,
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
  /** Current color mode (light or dark) */
  colorMode: ColorMode;
  /** Toggle between light and dark mode */
  toggleColorMode: () => void;
  /** Set a specific color mode */
  setColorMode: (mode: ColorMode) => void;
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
  defaultTheme: defaultThemeProp = defaultTheme,
  extraPresets = [],
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeConfig>(defaultThemeProp);
  const [colorMode, setColorModeState] = useState<ColorMode>("light");

  // Load persisted theme and color mode on mount
  useEffect(() => {
    const stored = loadThemeFromStorage();
    const mode = loadColorMode();
    const activeTheme = stored || defaultThemeProp;

    if (stored) {
      setThemeState(stored);
    }
    setColorModeState(mode);
    applyThemeToDOM(activeTheme);
    applyColorModeToDOM(mode);
  }, [defaultThemeProp]);

  const setTheme = useCallback((newTheme: ThemeConfig) => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
    saveThemeToStorage(newTheme);
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    applyColorModeToDOM(mode);
    saveColorMode(mode);
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorModeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      applyColorModeToDOM(next);
      saveColorMode(next);
      return next;
    });
  }, []);

  const presets = useMemo(
    () => [...themePresets, ...extraPresets],
    [extraPresets],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, presets, colorMode, toggleColorMode, setColorMode }),
    [theme, setTheme, presets, colorMode, toggleColorMode, setColorMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
