export interface ThemeConfig {
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    border: string;
    ring: string;
  };
  radius: string;
  fontFamily?: string;
}

export const defaultLightTheme: ThemeConfig = {
  name: "default-light",
  colors: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    primary: "oklch(0.205 0 0)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.97 0 0)",
    secondaryForeground: "oklch(0.205 0 0)",
    muted: "oklch(0.97 0 0)",
    mutedForeground: "oklch(0.556 0 0)",
    accent: "oklch(0.97 0 0)",
    accentForeground: "oklch(0.205 0 0)",
    destructive: "oklch(0.577 0.245 27.325)",
    border: "oklch(0.922 0 0)",
    ring: "oklch(0.708 0 0)",
  },
  radius: "0.625rem",
};

export const defaultDarkTheme: ThemeConfig = {
  name: "default-dark",
  colors: {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    primary: "oklch(0.922 0 0)",
    primaryForeground: "oklch(0.205 0 0)",
    secondary: "oklch(0.269 0 0)",
    secondaryForeground: "oklch(0.985 0 0)",
    muted: "oklch(0.269 0 0)",
    mutedForeground: "oklch(0.708 0 0)",
    accent: "oklch(0.269 0 0)",
    accentForeground: "oklch(0.985 0 0)",
    destructive: "oklch(0.704 0.191 22.216)",
    border: "oklch(1 0 0 / 10%)",
    ring: "oklch(0.556 0 0)",
  },
  radius: "0.625rem",
};

export const brandBlueTheme: ThemeConfig = {
  name: "brand-blue",
  colors: {
    background: "oklch(0.985 0.002 250)",
    foreground: "oklch(0.145 0.02 250)",
    primary: "oklch(0.488 0.243 264.376)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.94 0.02 250)",
    secondaryForeground: "oklch(0.205 0.02 250)",
    muted: "oklch(0.94 0.015 250)",
    mutedForeground: "oklch(0.556 0.02 250)",
    accent: "oklch(0.92 0.03 250)",
    accentForeground: "oklch(0.205 0.02 250)",
    destructive: "oklch(0.577 0.245 27.325)",
    border: "oklch(0.9 0.02 250)",
    ring: "oklch(0.488 0.243 264.376)",
  },
  radius: "0.75rem",
};

export const brandGreenTheme: ThemeConfig = {
  name: "brand-green",
  colors: {
    background: "oklch(0.985 0.005 155)",
    foreground: "oklch(0.145 0.02 155)",
    primary: "oklch(0.55 0.18 155)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.94 0.02 155)",
    secondaryForeground: "oklch(0.205 0.02 155)",
    muted: "oklch(0.94 0.015 155)",
    mutedForeground: "oklch(0.556 0.02 155)",
    accent: "oklch(0.92 0.03 155)",
    accentForeground: "oklch(0.205 0.02 155)",
    destructive: "oklch(0.577 0.245 27.325)",
    border: "oklch(0.9 0.02 155)",
    ring: "oklch(0.55 0.18 155)",
  },
  radius: "0.5rem",
};

export const themePresets: ThemeConfig[] = [
  defaultLightTheme,
  defaultDarkTheme,
  brandBlueTheme,
  brandGreenTheme,
];

const STORAGE_KEY = "whitelabel-theme";

export function loadThemeFromStorage(): ThemeConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ThemeConfig;
  } catch {
    return null;
  }
}

export function saveThemeToStorage(theme: ThemeConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function applyThemeToDOM(theme: ThemeConfig): void {
  const root = document.documentElement;
  root.style.setProperty("--background", theme.colors.background);
  root.style.setProperty("--foreground", theme.colors.foreground);
  root.style.setProperty("--primary", theme.colors.primary);
  root.style.setProperty("--primary-foreground", theme.colors.primaryForeground);
  root.style.setProperty("--secondary", theme.colors.secondary);
  root.style.setProperty("--secondary-foreground", theme.colors.secondaryForeground);
  root.style.setProperty("--muted", theme.colors.muted);
  root.style.setProperty("--muted-foreground", theme.colors.mutedForeground);
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--accent-foreground", theme.colors.accentForeground);
  root.style.setProperty("--destructive", theme.colors.destructive);
  root.style.setProperty("--border", theme.colors.border);
  root.style.setProperty("--ring", theme.colors.ring);
  root.style.setProperty("--radius", theme.radius);
  if (theme.fontFamily) {
    root.style.setProperty("--font-sans", theme.fontFamily);
  }
  root.setAttribute("data-theme", theme.name);
}
