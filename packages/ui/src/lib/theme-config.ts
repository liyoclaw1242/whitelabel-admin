export interface ColorTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
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
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  inputSheer: string;
  inputSheerHover: string;
  inputDisabledBg: string;
  mutedHover: string;
  destructiveBg: string;
  destructiveBgHover: string;
  destructiveRing: string;
  destructiveBorder: string;
  destructiveFocusBg: string;
  borderInput: string;
  checkedBorder: string;
  checkedBg: string;
  kbdTooltipBg: string;
  switchUnchecked: string;
  switchThumbChecked: string;
  switchThumbUnchecked: string;
  tabsTriggerText: string;
  outlineBg: string;
  outlineBgHover: string;
  activeTabBorder: string;
  avatarOverlayBlend: string;
}

export interface ThemeConfig {
  name: string;
  light: ColorTokens;
  dark: ColorTokens;
  radius: string;
  fontFamily?: string;
  typography?: {
    fontSans?: string;
    fontSerif?: string;
    fontMono?: string;
    letterSpacing?: string;
  };
  adjustments?: {
    hueShift?: number;
    saturationMultiplier?: number;
    lightnessMultiplier?: number;
    spacingMultiplier?: number;
    shadowIntensity?: "none" | "subtle" | "medium" | "prominent";
  };
}

/** @deprecated Use ThemeConfig with light/dark instead */
export interface LegacyThemeConfig {
  name: string;
  colors: ColorTokens;
  radius: string;
  fontFamily?: string;
  typography?: ThemeConfig["typography"];
  adjustments?: ThemeConfig["adjustments"];
}

const defaultLightColors: ColorTokens = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.145 0 0)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.145 0 0)",
  popover: "oklch(1 0 0)",
  popoverForeground: "oklch(0.145 0 0)",
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
  input: "oklch(0.922 0 0)",
  ring: "oklch(0.708 0 0)",
  chart1: "oklch(0.87 0 0)",
  chart2: "oklch(0.556 0 0)",
  chart3: "oklch(0.439 0 0)",
  chart4: "oklch(0.371 0 0)",
  chart5: "oklch(0.269 0 0)",
  sidebar: "oklch(0.985 0 0)",
  sidebarForeground: "oklch(0.145 0 0)",
  sidebarPrimary: "oklch(0.205 0 0)",
  sidebarPrimaryForeground: "oklch(0.985 0 0)",
  sidebarAccent: "oklch(0.97 0 0)",
  sidebarAccentForeground: "oklch(0.205 0 0)",
  sidebarBorder: "oklch(0.922 0 0)",
  sidebarRing: "oklch(0.708 0 0)",
  inputSheer: "transparent",
  inputSheerHover: "transparent",
  inputDisabledBg: "oklch(0.922 0 0 / 50%)",
  mutedHover: "oklch(0.97 0 0)",
  destructiveBg: "oklch(0.577 0.245 27.325 / 10%)",
  destructiveBgHover: "oklch(0.577 0.245 27.325 / 20%)",
  destructiveRing: "oklch(0.577 0.245 27.325 / 20%)",
  destructiveBorder: "oklch(0.577 0.245 27.325)",
  destructiveFocusBg: "oklch(0.577 0.245 27.325 / 10%)",
  borderInput: "oklch(0.922 0 0)",
  checkedBorder: "oklch(0.205 0 0 / 30%)",
  checkedBg: "oklch(0.205 0 0 / 5%)",
  kbdTooltipBg: "oklch(1 0 0 / 20%)",
  switchUnchecked: "oklch(0.922 0 0)",
  switchThumbChecked: "oklch(1 0 0)",
  switchThumbUnchecked: "oklch(1 0 0)",
  tabsTriggerText: "oklch(0.145 0 0 / 60%)",
  outlineBg: "oklch(1 0 0)",
  outlineBgHover: "oklch(0.97 0 0)",
  activeTabBorder: "transparent",
  avatarOverlayBlend: "darken",
};

const defaultDarkColors: ColorTokens = {
  background: "oklch(0.145 0 0)",
  foreground: "oklch(0.985 0 0)",
  card: "oklch(0.205 0 0)",
  cardForeground: "oklch(0.985 0 0)",
  popover: "oklch(0.205 0 0)",
  popoverForeground: "oklch(0.985 0 0)",
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
  input: "oklch(1 0 0 / 15%)",
  ring: "oklch(0.556 0 0)",
  chart1: "oklch(0.87 0 0)",
  chart2: "oklch(0.556 0 0)",
  chart3: "oklch(0.439 0 0)",
  chart4: "oklch(0.371 0 0)",
  chart5: "oklch(0.269 0 0)",
  sidebar: "oklch(0.205 0 0)",
  sidebarForeground: "oklch(0.985 0 0)",
  sidebarPrimary: "oklch(0.488 0.243 264.376)",
  sidebarPrimaryForeground: "oklch(0.985 0 0)",
  sidebarAccent: "oklch(0.269 0 0)",
  sidebarAccentForeground: "oklch(0.985 0 0)",
  sidebarBorder: "oklch(1 0 0 / 10%)",
  sidebarRing: "oklch(0.556 0 0)",
  inputSheer: "oklch(1 0 0 / 30%)",
  inputSheerHover: "oklch(1 0 0 / 50%)",
  inputDisabledBg: "oklch(1 0 0 / 80%)",
  mutedHover: "oklch(0.269 0 0 / 50%)",
  destructiveBg: "oklch(0.704 0.191 22.216 / 20%)",
  destructiveBgHover: "oklch(0.704 0.191 22.216 / 30%)",
  destructiveRing: "oklch(0.704 0.191 22.216 / 40%)",
  destructiveBorder: "oklch(0.704 0.191 22.216 / 50%)",
  destructiveFocusBg: "oklch(0.704 0.191 22.216 / 20%)",
  borderInput: "oklch(1 0 0 / 15%)",
  checkedBorder: "oklch(0.922 0 0 / 20%)",
  checkedBg: "oklch(0.922 0 0 / 10%)",
  kbdTooltipBg: "oklch(0.145 0 0 / 10%)",
  switchUnchecked: "oklch(1 0 0 / 80%)",
  switchThumbChecked: "oklch(0.205 0 0)",
  switchThumbUnchecked: "oklch(0.985 0 0)",
  tabsTriggerText: "oklch(0.708 0 0)",
  outlineBg: "oklch(1 0 0 / 30%)",
  outlineBgHover: "oklch(1 0 0 / 50%)",
  activeTabBorder: "oklch(1 0 0 / 15%)",
  avatarOverlayBlend: "lighten",
};

export const defaultTheme: ThemeConfig = {
  name: "default",
  light: defaultLightColors,
  dark: defaultDarkColors,
  radius: "0.625rem",
};

/** @deprecated Use defaultTheme instead */
export const defaultLightTheme = defaultTheme;
/** @deprecated Use defaultTheme instead */
export const defaultDarkTheme = defaultTheme;

export const brandBlueTheme: ThemeConfig = {
  name: "brand-blue",
  light: {
    background: "oklch(0.985 0.002 250)",
    foreground: "oklch(0.145 0.02 250)",
    card: "oklch(0.985 0.002 250)",
    cardForeground: "oklch(0.145 0.02 250)",
    popover: "oklch(0.985 0.002 250)",
    popoverForeground: "oklch(0.145 0.02 250)",
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
    input: "oklch(0.9 0.02 250)",
    ring: "oklch(0.488 0.243 264.376)",
    chart1: "oklch(0.87 0.05 250)",
    chart2: "oklch(0.556 0.05 250)",
    chart3: "oklch(0.439 0.05 250)",
    chart4: "oklch(0.371 0.05 250)",
    chart5: "oklch(0.269 0.05 250)",
    sidebar: "oklch(0.96 0.01 250)",
    sidebarForeground: "oklch(0.145 0.02 250)",
    sidebarPrimary: "oklch(0.488 0.243 264.376)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.92 0.03 250)",
    sidebarAccentForeground: "oklch(0.205 0.02 250)",
    sidebarBorder: "oklch(0.9 0.02 250)",
    sidebarRing: "oklch(0.488 0.243 264.376)",
    inputSheer: "transparent",
    inputSheerHover: "transparent",
    inputDisabledBg: "oklch(0.9 0.02 250 / 50%)",
    mutedHover: "oklch(0.92 0.02 250)",
    destructiveBg: "oklch(0.577 0.245 27.325 / 10%)",
    destructiveBgHover: "oklch(0.577 0.245 27.325 / 20%)",
    destructiveRing: "oklch(0.577 0.245 27.325 / 20%)",
    destructiveBorder: "oklch(0.577 0.245 27.325)",
    destructiveFocusBg: "oklch(0.577 0.245 27.325 / 10%)",
    borderInput: "oklch(0.9 0.02 250)",
    checkedBorder: "oklch(0.488 0.243 264.376 / 30%)",
    checkedBg: "oklch(0.488 0.243 264.376 / 5%)",
    kbdTooltipBg: "oklch(0.985 0.002 250 / 20%)",
    switchUnchecked: "oklch(0.9 0.02 250)",
    switchThumbChecked: "oklch(0.985 0 0)",
    switchThumbUnchecked: "oklch(0.985 0 0)",
    tabsTriggerText: "oklch(0.145 0.02 250 / 60%)",
    outlineBg: "oklch(0.985 0.002 250)",
    outlineBgHover: "oklch(0.94 0.02 250)",
    activeTabBorder: "transparent",
    avatarOverlayBlend: "darken",
  },
  dark: {
    background: "oklch(0.145 0.01 250)",
    foreground: "oklch(0.985 0.005 250)",
    card: "oklch(0.205 0.015 250)",
    cardForeground: "oklch(0.985 0.005 250)",
    popover: "oklch(0.205 0.015 250)",
    popoverForeground: "oklch(0.985 0.005 250)",
    primary: "oklch(0.6 0.2 264.376)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.269 0.02 250)",
    secondaryForeground: "oklch(0.985 0.005 250)",
    muted: "oklch(0.269 0.015 250)",
    mutedForeground: "oklch(0.708 0.02 250)",
    accent: "oklch(0.269 0.02 250)",
    accentForeground: "oklch(0.985 0.005 250)",
    destructive: "oklch(0.704 0.191 22.216)",
    border: "oklch(1 0 0 / 10%)",
    input: "oklch(1 0 0 / 15%)",
    ring: "oklch(0.6 0.2 264.376)",
    chart1: "oklch(0.87 0.05 250)",
    chart2: "oklch(0.556 0.05 250)",
    chart3: "oklch(0.439 0.05 250)",
    chart4: "oklch(0.371 0.05 250)",
    chart5: "oklch(0.269 0.05 250)",
    sidebar: "oklch(0.205 0.015 250)",
    sidebarForeground: "oklch(0.985 0.005 250)",
    sidebarPrimary: "oklch(0.6 0.2 264.376)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.269 0.02 250)",
    sidebarAccentForeground: "oklch(0.985 0.005 250)",
    sidebarBorder: "oklch(1 0 0 / 10%)",
    sidebarRing: "oklch(0.6 0.2 264.376)",
    inputSheer: "oklch(1 0 0 / 30%)",
    inputSheerHover: "oklch(1 0 0 / 50%)",
    inputDisabledBg: "oklch(1 0 0 / 80%)",
    mutedHover: "oklch(0.269 0.02 250 / 50%)",
    destructiveBg: "oklch(0.704 0.191 22.216 / 20%)",
    destructiveBgHover: "oklch(0.704 0.191 22.216 / 30%)",
    destructiveRing: "oklch(0.704 0.191 22.216 / 40%)",
    destructiveBorder: "oklch(0.704 0.191 22.216 / 50%)",
    destructiveFocusBg: "oklch(0.704 0.191 22.216 / 20%)",
    borderInput: "oklch(1 0 0 / 15%)",
    checkedBorder: "oklch(0.6 0.2 264.376 / 20%)",
    checkedBg: "oklch(0.6 0.2 264.376 / 10%)",
    kbdTooltipBg: "oklch(0.145 0.01 250 / 10%)",
    switchUnchecked: "oklch(1 0 0 / 80%)",
    switchThumbChecked: "oklch(0.205 0.015 250)",
    switchThumbUnchecked: "oklch(0.985 0.005 250)",
    tabsTriggerText: "oklch(0.708 0.02 250)",
    outlineBg: "oklch(1 0 0 / 30%)",
    outlineBgHover: "oklch(1 0 0 / 50%)",
    activeTabBorder: "oklch(1 0 0 / 15%)",
    avatarOverlayBlend: "lighten",
  },
  radius: "0.75rem",
};

export const brandGreenTheme: ThemeConfig = {
  name: "brand-green",
  light: {
    background: "oklch(0.985 0.005 155)",
    foreground: "oklch(0.145 0.02 155)",
    card: "oklch(0.985 0.005 155)",
    cardForeground: "oklch(0.145 0.02 155)",
    popover: "oklch(0.985 0.005 155)",
    popoverForeground: "oklch(0.145 0.02 155)",
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
    input: "oklch(0.9 0.02 155)",
    ring: "oklch(0.55 0.18 155)",
    chart1: "oklch(0.87 0.05 155)",
    chart2: "oklch(0.556 0.05 155)",
    chart3: "oklch(0.439 0.05 155)",
    chart4: "oklch(0.371 0.05 155)",
    chart5: "oklch(0.269 0.05 155)",
    sidebar: "oklch(0.96 0.01 155)",
    sidebarForeground: "oklch(0.145 0.02 155)",
    sidebarPrimary: "oklch(0.55 0.18 155)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.92 0.03 155)",
    sidebarAccentForeground: "oklch(0.205 0.02 155)",
    sidebarBorder: "oklch(0.9 0.02 155)",
    sidebarRing: "oklch(0.55 0.18 155)",
    inputSheer: "transparent",
    inputSheerHover: "transparent",
    inputDisabledBg: "oklch(0.9 0.02 155 / 50%)",
    mutedHover: "oklch(0.92 0.02 155)",
    destructiveBg: "oklch(0.577 0.245 27.325 / 10%)",
    destructiveBgHover: "oklch(0.577 0.245 27.325 / 20%)",
    destructiveRing: "oklch(0.577 0.245 27.325 / 20%)",
    destructiveBorder: "oklch(0.577 0.245 27.325)",
    destructiveFocusBg: "oklch(0.577 0.245 27.325 / 10%)",
    borderInput: "oklch(0.9 0.02 155)",
    checkedBorder: "oklch(0.55 0.18 155 / 30%)",
    checkedBg: "oklch(0.55 0.18 155 / 5%)",
    kbdTooltipBg: "oklch(0.985 0.005 155 / 20%)",
    switchUnchecked: "oklch(0.9 0.02 155)",
    switchThumbChecked: "oklch(0.985 0 0)",
    switchThumbUnchecked: "oklch(0.985 0 0)",
    tabsTriggerText: "oklch(0.145 0.02 155 / 60%)",
    outlineBg: "oklch(0.985 0.005 155)",
    outlineBgHover: "oklch(0.94 0.02 155)",
    activeTabBorder: "transparent",
    avatarOverlayBlend: "darken",
  },
  dark: {
    background: "oklch(0.145 0.01 155)",
    foreground: "oklch(0.985 0.005 155)",
    card: "oklch(0.205 0.015 155)",
    cardForeground: "oklch(0.985 0.005 155)",
    popover: "oklch(0.205 0.015 155)",
    popoverForeground: "oklch(0.985 0.005 155)",
    primary: "oklch(0.65 0.15 155)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.269 0.02 155)",
    secondaryForeground: "oklch(0.985 0.005 155)",
    muted: "oklch(0.269 0.015 155)",
    mutedForeground: "oklch(0.708 0.02 155)",
    accent: "oklch(0.269 0.02 155)",
    accentForeground: "oklch(0.985 0.005 155)",
    destructive: "oklch(0.704 0.191 22.216)",
    border: "oklch(1 0 0 / 10%)",
    input: "oklch(1 0 0 / 15%)",
    ring: "oklch(0.65 0.15 155)",
    chart1: "oklch(0.87 0.05 155)",
    chart2: "oklch(0.556 0.05 155)",
    chart3: "oklch(0.439 0.05 155)",
    chart4: "oklch(0.371 0.05 155)",
    chart5: "oklch(0.269 0.05 155)",
    sidebar: "oklch(0.205 0.015 155)",
    sidebarForeground: "oklch(0.985 0.005 155)",
    sidebarPrimary: "oklch(0.65 0.15 155)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.269 0.02 155)",
    sidebarAccentForeground: "oklch(0.985 0.005 155)",
    sidebarBorder: "oklch(1 0 0 / 10%)",
    sidebarRing: "oklch(0.65 0.15 155)",
    inputSheer: "oklch(1 0 0 / 30%)",
    inputSheerHover: "oklch(1 0 0 / 50%)",
    inputDisabledBg: "oklch(1 0 0 / 80%)",
    mutedHover: "oklch(0.269 0.02 155 / 50%)",
    destructiveBg: "oklch(0.704 0.191 22.216 / 20%)",
    destructiveBgHover: "oklch(0.704 0.191 22.216 / 30%)",
    destructiveRing: "oklch(0.704 0.191 22.216 / 40%)",
    destructiveBorder: "oklch(0.704 0.191 22.216 / 50%)",
    destructiveFocusBg: "oklch(0.704 0.191 22.216 / 20%)",
    borderInput: "oklch(1 0 0 / 15%)",
    checkedBorder: "oklch(0.65 0.15 155 / 20%)",
    checkedBg: "oklch(0.65 0.15 155 / 10%)",
    kbdTooltipBg: "oklch(0.145 0.01 155 / 10%)",
    switchUnchecked: "oklch(1 0 0 / 80%)",
    switchThumbChecked: "oklch(0.205 0.015 155)",
    switchThumbUnchecked: "oklch(0.985 0.005 155)",
    tabsTriggerText: "oklch(0.708 0.02 155)",
    outlineBg: "oklch(1 0 0 / 30%)",
    outlineBgHover: "oklch(1 0 0 / 50%)",
    activeTabBorder: "oklch(1 0 0 / 15%)",
    avatarOverlayBlend: "lighten",
  },
  radius: "0.5rem",
};

export const themePresets: ThemeConfig[] = [
  defaultTheme,
  brandBlueTheme,
  brandGreenTheme,
];

const STORAGE_KEY = "whitelabel-theme";
const COLOR_MODE_KEY = "whitelabel-color-mode";

export type ColorMode = "light" | "dark";

export function loadColorMode(): ColorMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(COLOR_MODE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function saveColorMode(mode: ColorMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COLOR_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

export function applyColorModeToDOM(mode: ColorMode): void {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/** Migrate legacy single-mode ThemeConfig to dual-mode */
function migrateLegacyTheme(stored: LegacyThemeConfig | ThemeConfig): ThemeConfig {
  if ("light" in stored && "dark" in stored) {
    return stored as ThemeConfig;
  }
  const legacy = stored as LegacyThemeConfig;
  return {
    name: legacy.name,
    light: legacy.colors,
    dark: defaultDarkColors,
    radius: legacy.radius,
    fontFamily: legacy.fontFamily,
    typography: legacy.typography,
    adjustments: legacy.adjustments,
  };
}

export function loadThemeFromStorage(): ThemeConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrateLegacyTheme(parsed);
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

function colorTokensToCSS(tokens: ColorTokens): string {
  return [
    `--background: ${tokens.background}`,
    `--foreground: ${tokens.foreground}`,
    `--card: ${tokens.card}`,
    `--card-foreground: ${tokens.cardForeground}`,
    `--popover: ${tokens.popover}`,
    `--popover-foreground: ${tokens.popoverForeground}`,
    `--primary: ${tokens.primary}`,
    `--primary-foreground: ${tokens.primaryForeground}`,
    `--secondary: ${tokens.secondary}`,
    `--secondary-foreground: ${tokens.secondaryForeground}`,
    `--muted: ${tokens.muted}`,
    `--muted-foreground: ${tokens.mutedForeground}`,
    `--accent: ${tokens.accent}`,
    `--accent-foreground: ${tokens.accentForeground}`,
    `--destructive: ${tokens.destructive}`,
    `--border: ${tokens.border}`,
    `--input: ${tokens.input}`,
    `--ring: ${tokens.ring}`,
    `--chart-1: ${tokens.chart1}`,
    `--chart-2: ${tokens.chart2}`,
    `--chart-3: ${tokens.chart3}`,
    `--chart-4: ${tokens.chart4}`,
    `--chart-5: ${tokens.chart5}`,
    `--sidebar: ${tokens.sidebar}`,
    `--sidebar-foreground: ${tokens.sidebarForeground}`,
    `--sidebar-primary: ${tokens.sidebarPrimary}`,
    `--sidebar-primary-foreground: ${tokens.sidebarPrimaryForeground}`,
    `--sidebar-accent: ${tokens.sidebarAccent}`,
    `--sidebar-accent-foreground: ${tokens.sidebarAccentForeground}`,
    `--sidebar-border: ${tokens.sidebarBorder}`,
    `--sidebar-ring: ${tokens.sidebarRing}`,
    `--input-sheer: ${tokens.inputSheer}`,
    `--input-sheer-hover: ${tokens.inputSheerHover}`,
    `--input-disabled-bg: ${tokens.inputDisabledBg}`,
    `--muted-hover: ${tokens.mutedHover}`,
    `--destructive-bg: ${tokens.destructiveBg}`,
    `--destructive-bg-hover: ${tokens.destructiveBgHover}`,
    `--destructive-ring: ${tokens.destructiveRing}`,
    `--destructive-border: ${tokens.destructiveBorder}`,
    `--destructive-focus-bg: ${tokens.destructiveFocusBg}`,
    `--border-input: ${tokens.borderInput}`,
    `--checked-border: ${tokens.checkedBorder}`,
    `--checked-bg: ${tokens.checkedBg}`,
    `--kbd-tooltip-bg: ${tokens.kbdTooltipBg}`,
    `--switch-unchecked: ${tokens.switchUnchecked}`,
    `--switch-thumb-checked: ${tokens.switchThumbChecked}`,
    `--switch-thumb-unchecked: ${tokens.switchThumbUnchecked}`,
    `--tabs-trigger-text: ${tokens.tabsTriggerText}`,
    `--outline-bg: ${tokens.outlineBg}`,
    `--outline-bg-hover: ${tokens.outlineBgHover}`,
    `--active-tab-border: ${tokens.activeTabBorder}`,
    `--avatar-overlay-blend: ${tokens.avatarOverlayBlend}`,
  ].join("; ");
}

const STYLE_ID = "whitelabel-theme-vars";

export function applyThemeToDOM(theme: ThemeConfig): void {
  const root = document.documentElement;

  // Inject both light and dark vars via a <style> element
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  const lightCSS = colorTokensToCSS(theme.light);
  const darkCSS = colorTokensToCSS(theme.dark);

  styleEl.textContent = `
:root { ${lightCSS}; --radius: ${theme.radius}; }
.dark { ${darkCSS}; }
`;

  // Font family
  if (theme.fontFamily || theme.typography?.fontSans) {
    root.style.setProperty("--font-sans", theme.typography?.fontSans || theme.fontFamily || "");
  } else {
    root.style.removeProperty("--font-sans");
  }

  // Typography
  root.style.setProperty("--font-serif", theme.typography?.fontSerif || "");
  root.style.setProperty("--font-mono", theme.typography?.fontMono || "");
  root.style.setProperty("--tracking-body", theme.typography?.letterSpacing || "normal");

  // Adjustments
  const spacing = theme.adjustments?.spacingMultiplier ?? 1;
  root.style.setProperty("--spacing-multiplier", String(spacing));

  const shadowMap: Record<string, string> = {
    none: "none",
    subtle: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
    medium: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
    prominent: "0 4px 6px -1px rgb(0 0 0 / 0.12), 0 2px 4px -2px rgb(0 0 0 / 0.08)",
  };
  const shadow = theme.adjustments?.shadowIntensity ?? "subtle";
  root.style.setProperty("--shadow-theme", shadowMap[shadow] || shadowMap.subtle);
  root.setAttribute("data-theme", theme.name);
}
